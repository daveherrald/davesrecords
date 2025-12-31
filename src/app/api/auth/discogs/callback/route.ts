import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

/**
 * Handle Discogs OAuth callback
 * GET /api/auth/discogs/callback?oauth_token=XXX&oauth_verifier=YYY
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const oauthToken = searchParams.get('oauth_token');
    const oauthVerifier = searchParams.get('oauth_verifier');

    if (!oauthToken || !oauthVerifier) {
      throw new Error('Missing oauth_token or oauth_verifier');
    }

    // Retrieve token secret from cookie
    const cookieStore = await cookies();
    const tokenSecret = cookieStore.get('discogs_token_secret')?.value;

    if (!tokenSecret) {
      throw new Error('Token secret not found in cookies');
    }

    // Exchange request token for access token
    const oauth = new OAuth({
      consumer: {
        key: process.env.DISCOGS_CONSUMER_KEY!,
        secret: process.env.DISCOGS_CONSUMER_SECRET!,
      },
      signature_method: 'HMAC-SHA1',
      hash_function(baseString, key) {
        return crypto.createHmac('sha1', key).update(baseString).digest('base64');
      },
    });

    const requestData = {
      url: 'https://api.discogs.com/oauth/access_token',
      method: 'POST' as const,
    };

    const token = {
      key: oauthToken,
      secret: tokenSecret,
    };

    const response = await fetch(
      requestData.url + '?oauth_verifier=' + oauthVerifier,
      {
        method: 'POST',
        headers: {
          ...oauth.toHeader(oauth.authorize(requestData, token)),
          'User-Agent': 'VinylCollectionViewer/1.0',
        },
      }
    );

    const responseText = await response.text();
    const params = new URLSearchParams(responseText);
    const accessToken = params.get('oauth_token');
    const accessTokenSecret = params.get('oauth_token_secret');

    if (!accessToken || !accessTokenSecret) {
      throw new Error('Failed to get access token from Discogs');
    }

    // Get user identity from Discogs
    const identityRequestData = {
      url: 'https://api.discogs.com/oauth/identity',
      method: 'GET' as const,
    };

    const identityToken = {
      key: accessToken,
      secret: accessTokenSecret,
    };

    const identityResponse = await fetch(identityRequestData.url, {
      method: 'GET',
      headers: {
        ...oauth.toHeader(oauth.authorize(identityRequestData, identityToken)),
        'User-Agent': 'VinylCollectionViewer/1.0',
      },
    });

    const identity = await identityResponse.json();

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { discogsId: identity.id.toString() },
      update: {
        accessToken: encrypt(accessToken),
        accessTokenSecret: encrypt(accessTokenSecret),
        discogsUsername: identity.username,
      },
      create: {
        discogsId: identity.id.toString(),
        discogsUsername: identity.username,
        accessToken: encrypt(accessToken),
        accessTokenSecret: encrypt(accessTokenSecret),
        publicSlug: identity.username.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        email: identity.email || null,
      },
    });

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken: crypto.randomUUID(),
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Set session cookie
    cookieStore.set('session-token', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    // Clear temporary token secret cookie
    cookieStore.delete('discogs_token_secret');

    // Redirect to dashboard
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard`);
  } catch (error) {
    console.error('Discogs OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/auth/error?error=CallbackError`
    );
  }
}
