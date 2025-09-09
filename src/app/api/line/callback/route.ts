
import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getLineProfile } from '@/lib/line';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Firebase UID

  if (!code || !state) {
    console.error('Invalid callback request: missing code or state');
    const errorUrl = new URL('/profile', request.url);
    errorUrl.searchParams.set('error', 'bad_request');
    return NextResponse.redirect(errorUrl);
  }

  const firebaseUid = state; 

  const lineLoginChannelId = process.env.LINE_LOGIN_CHANNEL_ID;
  const lineChannelSecret = process.env.LINE_CHANNEL_SECRET;
  
  if (!lineLoginChannelId || !lineChannelSecret) {
    console.error('LINE environment variables for login are not set.');
    const errorUrl = new URL('/profile', request.url);
    errorUrl.searchParams.set('error', 'config_error');
    return NextResponse.redirect(errorUrl);
  }
  
  // Build the redirect URI for the token exchange. It must match exactly what's in the console.
  const redirectUriForToken = new URL('/api/line/callback', request.url).href;

  try {
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUriForToken,
        client_id: lineLoginChannelId,
        client_secret: lineChannelSecret,
      }),
    });

    if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.json();
        console.error('LINE token exchange error:', errorBody);
        throw new Error(`Failed to get access token from LINE. Reason: ${errorBody.error_description || 'Unknown'}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    const lineProfile = await getLineProfile(accessToken);
    const lineUserId = lineProfile.userId;

    if (!lineUserId) {
        throw new Error('Could not retrieve LINE User ID.');
    }

    const userDocRef = doc(db, 'users', firebaseUid);
    // Correctly update the document with only the lineUserId field.
    await updateDoc(userDocRef, {
      lineUserId: lineUserId,
    });

    // Redirect to profile page with a clean success message
    const successUrl = new URL('/profile', request.url);
    successUrl.searchParams.set('line_connect', 'success');
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('LINE callback handling failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during LINE login.';
    const errorUrl = new URL('/profile', request.url);
    errorUrl.searchParams.set('error', encodeURIComponent(errorMessage));
    return NextResponse.redirect(errorUrl);
  }
}
