import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { storeDiscogsTokens } from '@/lib/auth';
import {
  logEntityManagement,
  endpointFromRequest,
  OCSF_ACTIVITY,
  OCSF_STATUS,
} from '@/lib/audit';

/**
 * Handle Discogs OAuth callback
 * Connects Discogs account to existing authenticated user
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

    // Retrieve token secret and user ID from cookies
    const cookieStore = await cookies();
    const tokenSecret = cookieStore.get('discogs_token_secret')?.value;
    const userId = cookieStore.get('discogs_connecting_user')?.value;

    if (!tokenSecret) {
      throw new Error('Token secret not found in cookies');
    }

    if (!userId) {
      throw new Error('User ID not found in cookies - user must be authenticated first');
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
      data: {
        oauth_verifier: oauthVerifier,
      },
    };

    const token = {
      key: oauthToken,
      secret: tokenSecret,
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    const response = await fetch(requestData.url, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'VinylCollectionViewer/1.0',
      },
      body: new URLSearchParams({
        oauth_verifier: oauthVerifier,
      }).toString(),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Discogs OAuth failed with status:', response.status);
      throw new Error('Failed to get access token from Discogs');
    }

    const params = new URLSearchParams(responseText);
    const accessToken = params.get('oauth_token');
    const accessTokenSecret = params.get('oauth_token_secret');

    if (!accessToken || !accessTokenSecret) {
      console.error('Failed to parse Discogs access token response');
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

    // Store Discogs connection for the authenticated user
    await storeDiscogsTokens(
      userId,
      identity.id.toString(),
      identity.username,
      accessToken,
      accessTokenSecret
    );

    // Log successful Discogs connection
    try {
      await logEntityManagement(
        OCSF_ACTIVITY.ENTITY_MANAGEMENT.CREATE,
        `Connected Discogs account: ${identity.username}`,
        {
          type: 'DiscogsConnection',
          id: identity.id.toString(),
          name: identity.username,
          data: { discogsUsername: identity.username },
        },
        {
          actor: { userId },
          srcEndpoint: endpointFromRequest(request),
          statusId: OCSF_STATUS.SUCCESS,
        }
      );
    } catch (logError) {
      console.error('Failed to log Discogs connection (non-fatal):', logError);
    }

    // Clear temporary cookies
    cookieStore.delete('discogs_token_secret');
    cookieStore.delete('discogs_connecting_user');

    // Redirect to settings page with success message
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/settings?success=DiscogsConnected`);
  } catch (error) {
    console.error('Discogs OAuth callback error:', error);

    // Log failed connection attempt
    try {
      const cookieStore = await cookies();
      const userId = cookieStore.get('discogs_connecting_user')?.value;
      await logEntityManagement(
        OCSF_ACTIVITY.ENTITY_MANAGEMENT.CREATE,
        'Failed to connect Discogs account',
        { type: 'DiscogsConnection' },
        {
          actor: userId ? { userId } : undefined,
          srcEndpoint: endpointFromRequest(request),
          statusId: OCSF_STATUS.FAILURE,
          statusDetail: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    } catch (logError) {
      console.error('Failed to log Discogs connection failure:', logError);
    }

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/auth/error?error=CallbackError`
    );
  }
}
