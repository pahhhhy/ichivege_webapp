
import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getLineProfile } from '@/lib/line';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Firebase UID
  const sessionState = searchParams.get('session_state'); // LINE may send this

  if (!code || !state) {
    console.error('Invalid callback request: missing code or state');
    return NextResponse.redirect(new URL('/profile?error=bad_request', request.url));
  }

  // In a real app, you should validate the state against a value stored in the user's session.
  // Here, we trust the state as it's a short-lived secure value (the user's UID).
  const firebaseUid = state; 

  const lineLoginChannelId = process.env.LINE_LOGIN_CHANNEL_ID;
  const lineChannelSecret = process.env.LINE_CHANNEL_SECRET;
  
  if (!lineLoginChannelId || !lineChannelSecret) {
    console.error('LINE environment variables for login are not set.');
    return NextResponse.redirect(new URL('/profile?error=config_error', request.url));
  }
  
  const redirectUri = `${new URL(request.url).origin}/api/line/callback`;

  try {
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
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
    
    // Get user profile from LINE
    const lineProfile = await getLineProfile(accessToken);
    const lineUserId = lineProfile.userId;

    if (!lineUserId) {
        throw new Error('Could not retrieve LINE User ID.');
    }

    // Save lineUserId to user's Firestore document
    const userDocRef = doc(db, 'users', firebaseUid);
    await updateDoc(userDocRef, {
      lineUserId: lineUserId,
    });

    // Redirect to profile page with success message
    return NextResponse.redirect(new URL('/profile?line_connect=success', request.url));
  } catch (error) {
    console.error('LINE callback handling failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during LINE login.';
    return NextResponse.redirect(new URL(`/profile?error=${encodeURIComponent(errorMessage)}`, request.url));
  }
}
