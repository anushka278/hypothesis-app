import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to exchange OAuth authorization codes for access tokens
 * This is a server-side endpoint that securely handles token exchange
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service, code } = body;

    if (!service || !code) {
      return NextResponse.json(
        { error: 'Missing service or code' },
        { status: 400 }
      );
    }

    // Get redirect URI
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    if (service === 'strava') {
      // Strava OAuth token exchange
      const redirectUri = `${origin}/auth/strava/callback`;
      const clientId = process.env.STRAVA_CLIENT_ID || 'your-client-id';
      const clientSecret = process.env.STRAVA_CLIENT_SECRET || 'your-client-secret';

      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Strava token exchange error:', error);
        return NextResponse.json(
          { error: 'Failed to exchange token' },
          { status: response.status }
        );
      }

      const tokenData = await response.json();
      
      return NextResponse.json({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        token_type: tokenData.token_type || 'Bearer',
      });
    }

    if (service === 'fitbit') {
      // Fitbit OAuth token exchange
      const redirectUri = `${origin}/auth/fitbit/callback`;
      const clientId = process.env.FITBIT_CLIENT_ID || 'your-client-id';
      const clientSecret = process.env.FITBIT_CLIENT_SECRET || 'your-client-secret';

      // Fitbit requires Basic authentication header
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const response = await fetch('https://api.fitbit.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          client_id: clientId,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }).toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Fitbit token exchange error:', error);
        return NextResponse.json(
          { error: 'Failed to exchange token' },
          { status: response.status }
        );
      }

      const tokenData = await response.json();
      
      return NextResponse.json({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type || 'Bearer',
        user_id: tokenData.user_id,
      });
    }

    if (service === 'garmin') {
      // Garmin OAuth token exchange with PKCE
      const { code_verifier } = body;
      if (!code_verifier) {
        return NextResponse.json(
          { error: 'Missing code_verifier for PKCE flow' },
          { status: 400 }
        );
      }

      const redirectUri = `${origin}/auth/garmin/callback`;
      const clientId = process.env.GARMIN_CLIENT_ID || 'your-client-id';
      const clientSecret = process.env.GARMIN_CLIENT_SECRET || 'your-client-secret';

      const response = await fetch('https://connect.garmin.com/oauthToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code_verifier: code_verifier,
        }).toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Garmin token exchange error:', error);
        return NextResponse.json(
          { error: 'Failed to exchange token' },
          { status: response.status }
        );
      }

      const tokenData = await response.json();
      
      return NextResponse.json({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in || 3600,
        token_type: tokenData.token_type || 'Bearer',
      });
    }

    // Add other services here
    return NextResponse.json(
      { error: `Service ${service} not yet implemented` },
      { status: 501 }
    );
  } catch (error) {
    console.error('Auth exchange error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

