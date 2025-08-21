
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatMessages } from '@/components/chat/chat-messages';
import { ChatInput } from '@/components/chat/chat-input';
import type { ChatRoom } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Users } from 'lucide-react';
import { UserSearchDialog } from '@/components/user-search-dialog';

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-8rem)]">
        <aside className="hidden w-1/4 flex-col border-r p-4 md:flex">
          <Skeleton className="h-10 w-full" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </aside>
        <main className="flex flex-1 flex-col">
          <div className="flex h-full items-center justify-center">
             <Skeleton className="h-32 w-1/2" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      <aside className="hidden w-1/4 flex-col border-r md:flex">
        <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-xl font-bold">チャット</h2>
            <UserSearchDialog currentUser={user} onChatRoomSelect={setSelectedChat} />
        </div>
        <ChatSidebar
          currentUser={user}
          selectedChatId={selectedChat?.id}
          onChatSelect={setSelectedChat}
        />
      </aside>
      <main className="flex flex-1 flex-col">
        {selectedChat ? (
          <>
            <div className="border-b p-4">
              <h3 className="text-lg font-semibold">
                {selectedChat.participants.find(p => p.uid !== user.uid)?.username || 'Chat'}
              </h3>
            </div>
            <ChatMessages chatRoomId={selectedChat.id} currentUser={user} />
            <ChatInput chatRoomId={selectedChat.id} senderId={user.uid} />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <MessageSquare className="h-16 w-16" />
            <h2 className="mt-4 text-2xl font-semibold">チャットが選択されていません</h2>
            <p className="mt-2">
              チャットルームを選択するか、<Users className="inline h-4 w-4" /> ボタンで新しいチャットを開始してください。
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
