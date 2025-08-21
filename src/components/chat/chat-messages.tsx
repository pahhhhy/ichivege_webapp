
'use client';

import { useEffect, useRef, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Message } from '@/lib/types';
import { User } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '../ui/skeleton';

interface ChatMessagesProps {
  chatRoomId: string;
  currentUser: User;
}

export function ChatMessages({ chatRoomId, currentUser }: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatRoomId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Message)
      );
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatRoomId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return (
        <div className="flex-1 space-y-4 p-4">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-12 w-2/3 ml-auto" />
            <Skeleton className="h-12 w-2/3" />
        </div>
    )
  }

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="space-y-4 p-4" ref={viewportRef}>
        {messages.map((message) => (
            <div
            key={message.id}
            className={cn(
                'flex items-end gap-2',
                message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'
            )}
            >
            <div
                className={cn(
                'max-w-xs rounded-lg px-4 py-2 md:max-w-md',
                message.senderId === currentUser.uid
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
            >
                <p className="whitespace-pre-wrap">{message.text}</p>
            </div>
            </div>
        ))}
        </div>
    </ScrollArea>
  );
}
