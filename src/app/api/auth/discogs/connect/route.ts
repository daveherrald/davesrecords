import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAuth } from '@/lib/auth';

/**
 * Initiate Discogs OAuth connection
 * Requires user to already be authenticated with Google
 * GET /api/auth/discogs/connect
 */
export async function GET() {
  try {
    // Require user to be signed in with Google first
    const session = await requireAuth();

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

    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/auth/discogs/callback`;

    const requestData = {
      url: 'https://api.discogs.com/oauth/request_token',
      method: 'GET' as const,
      data: { oauth_callback: callbackUrl },
    };

    const response = await fetch(requestData.url + '?oauth_callback=' + encodeURIComponent(callbackUrl), {
      method: 'GET',
      headers: {
        ...oauth.toHeader(oauth.authorize(requestData)),
        'User-Agent': 'VinylCollectionViewer/1.0',
      },
    });

    const responseText = await response.text();
    const params = new URLSearchParams(responseText);
    const oauthToken = params.get('oauth_token');
    const oauthTokenSecret = params.get('oauth_token_secret');

    if (!oauthToken || !oauthTokenSecret) {
      throw new Error('Failed to get request token from Discogs');
    }

    // Store token secret AND user ID in cookies (needed for callback)
    const cookieStore = await cookies();
    cookieStore.set('discogs_token_secret', oauthTokenSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    cookieStore.set('discogs_connecting_user', session.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    // Redirect user to Discogs authorization page
    const authorizeUrl = `https://www.discogs.com/oauth/authorize?oauth_token=${oauthToken}`;
    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    console.error('Discogs OAuth connect error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/settings?error=DiscogsConnectFailed`);
  }
}
