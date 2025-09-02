
'use client';

import { useEffect, useRef, useState } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Message, ChatRoom } from '@/lib/types';
import { User } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { format, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ChatMessagesProps {
  chatRoom: ChatRoom;
  currentUser: User;
}

const formatDate = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return '';
  return format(timestamp.toDate(), 'p', { locale: ja });
};

const formatDateSeparator = (timestamp: Timestamp): string => {
  return format(timestamp.toDate(), 'PPP(E)', { locale: ja });
}


export function ChatMessages({ chatRoom, currentUser }: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const markMessagesAsRead = async (messagesToMark: Message[]) => {
    if (messagesToMark.length === 0) return;

    const batch = writeBatch(db);
    
    messagesToMark.forEach(msg => {
        if (msg.senderId !== currentUser.uid) {
            const msgRef = doc(db, 'chats', chatRoom.id, 'messages', msg.id);
            batch.update(msgRef, {
                readBy: [...(msg.readBy || []), currentUser.uid]
            });
        }
    });
    
    const chatRoomRef = doc(db, 'chats', chatRoom.id);
    batch.update(chatRoomRef, {
        [`lastReadBy.${currentUser.uid}`]: Timestamp.now()
    });

    await batch.commit().catch(console.error);
  };


  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'chats', chatRoom.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Message)
      );
      setMessages(msgs);
      setLoading(false);
      
      const unreadMessages = msgs.filter(msg => msg.senderId !== currentUser.uid && (!msg.readBy || !msg.readBy.includes(currentUser.uid)));
      if (unreadMessages.length > 0) {
        markMessagesAsRead(unreadMessages);
      } else {
        const chatRoomRef = doc(db, 'chats', chatRoom.id);
        const batch = writeBatch(db);
        batch.update(chatRoomRef, {
            [`lastReadBy.${currentUser.uid}`]: Timestamp.now()
        });
        batch.commit().catch(console.error);
      }
    });

    return () => unsubscribe();
  }, [chatRoom.id, currentUser.uid]);

  useEffect(() => {
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
            
            const isMe = message.senderId === currentUser.uid;
            
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
                            'flex flex-col gap-1',
                            isMe ? 'items-end' : 'items-start'
                        )}
                    >
                         {chatRoom.isGroup && !isMe && (
                            <span className="text-xs text-muted-foreground ml-2">
                                {message.senderName || 'Unknown User'}
                            </span>
                        )}
                        <div className={cn('flex items-end gap-2', isMe ? 'flex-row-reverse' : 'flex-row')}>
                            <div
                                className={cn(
                                'max-w-xs rounded-lg px-3 py-2 md:max-w-md',
                                isMe
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
