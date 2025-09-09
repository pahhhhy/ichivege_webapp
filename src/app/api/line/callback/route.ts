
import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getLineProfile } from '@/lib/line';
import getConfig from 'next/config';

const { serverRuntimeConfig } = getConfig();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const sessionState = searchParams.get('session_state'); // LINE may send this

  // In a real app, you MUST validate the state against a value stored in the user's session.
  // For this example, we assume the `state` parameter is the Firebase UID, which is a temporary secure value.
  if (!code || !state) {
    console.error('Invalid callback request: missing code or state');
    return NextResponse.redirect(new URL('/profile?error=bad_request', request.url));
  }

  const firebaseUid = state; 

  try {
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${new URL(request.url).origin}/api/line/callback`,
        client_id: serverRuntimeConfig.lineLoginChannelId!,
        client_secret: serverRuntimeConfig.lineChannelSecret!,
      }),
    });

    if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.json();
        console.error('LINE token exchange error:', errorBody);
        throw new Error(errorBody.error_description || 'Failed to get access token from LINE.');
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
