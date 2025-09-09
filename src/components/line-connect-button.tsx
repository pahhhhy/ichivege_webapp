
'use client';

import { useAuth } from '@/context/auth-context';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export function LineConnectButton() {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const handleConnect = () => {
    if (!user) return;
    
    const lineLoginChannelId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID;

    if (!lineLoginChannelId) {
      console.error('LINE Login Channel ID is not configured.');
      toast({
        title: '設定エラー',
        description: 'LINE連携機能が正しく設定されていません。',
        variant: 'destructive',
      });
      return;
    }
    
    // Use the user's UID as the state parameter for security
    const state = user.uid;

    const lineLoginUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
    lineLoginUrl.searchParams.set('response_type', 'code');
    lineLoginUrl.searchParams.set('client_id', lineLoginChannelId);
    lineLoginUrl.searchParams.set('redirect_uri', `${window.location.origin}/api/line/callback`);
    lineLoginUrl.searchParams.set('state', state);
    lineLoginUrl.searchParams.set('scope', 'profile openid');
    // Add nonce for OpenID Connect
    lineLoginUrl.searchParams.set('nonce', state + Date.now().toString());

    window.location.href = lineLoginUrl.toString();
  };

  const handleDisconnect = async () => {
    if (!user) return;
    try {
        const userDocRef = doc(db, 'users', user.uid);
        // Set lineUserId to null to effectively disconnect
        await updateDoc(userDocRef, {
            lineUserId: null
        });
        await refreshUserProfile();
        toast({
            title: '成功',
            description: 'LINEとの連携を解除しました。',
        });
    } catch(error) {
        console.error('Failed to disconnect LINE', error);
        toast({
            title: 'エラー',
            description: 'LINE連携の解除に失敗しました。',
            variant: 'destructive',
        });
    }
  };

  if (userProfile?.lineUserId) {
    return (
        <Button onClick={handleDisconnect} variant="destructive">LINE連携を解除</Button>
    )
  }

  return <Button onClick={handleConnect}>LINEと連携する</Button>;
}
