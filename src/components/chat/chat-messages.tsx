
'use client';

import { useEffect, useRef, useState } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Message } from '@/lib/types';
import { User } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { format, isSameDay, formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ChatMessagesProps {
  chatRoomId: string;
  currentUser: User;
}

const formatDate = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return '';
  return format(timestamp.toDate(), 'p', { locale: ja });
};

const formatDateSeparator = (timestamp: Timestamp): string => {
  return format(timestamp.toDate(), 'PPP(E)', { locale: ja });
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
        <div className="space-y-2 p-4" ref={viewportRef}>
        {messages.map((message, index) => {
            const showDateSeparator = 
                index === 0 || 
                (message.createdAt && messages[index-1].createdAt && 
                 !isSameDay(message.createdAt.toDate(), messages[index-1].createdAt.toDate()));
            
            return (
                <div key={message.id}>
                    {showDateSeparator && message.createdAt && (
                        <div className="my-4 text-center text-xs text-muted-foreground">
                            <span className="rounded-full bg-muted px-3 py-1">
                               {formatDateSeparator(message.createdAt)}
                            </span>
                        </div>
                    )}
                    <div
                        className={cn(
                            'flex items-end gap-2',
                            message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'
                        )}
                    >
                        <div className={cn('flex items-end gap-2', message.senderId === currentUser.uid ? 'flex-row-reverse' : 'flex-row')}>
                            <div
                                className={cn(
                                'max-w-xs rounded-lg px-3 py-2 md:max-w-md',
                                message.senderId === currentUser.uid
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                )}
                            >
                                <p className="whitespace-pre-wrap">{message.text}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {formatDate(message.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>
            )
        })}
        </div>
    </ScrollArea>
  );
}
