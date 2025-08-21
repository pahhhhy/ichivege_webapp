
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ChatRoom, ChatParticipant } from '@/lib/types';
import { User } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';

interface ChatSidebarProps {
  currentUser: User;
  selectedChatId: string | null;
  onChatSelect: (chatRoom: ChatRoom) => void;
}

const getOtherParticipant = (participants: ChatParticipant[], currentUserId: string) => {
    return participants.find(p => p.uid !== currentUserId);
}

const getInitials = (name?: string) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
}

const useUnreadCounts = (chatRooms: ChatRoom[], userId: string) => {
    const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
  
    useEffect(() => {
      if (!userId) return;
  
      const unsubscribes = chatRooms.map(room => {
        const lastReadTimestamp = room.lastReadBy?.[userId] || new Timestamp(0, 0);
        
        // Query for all messages after the last read timestamp.
        // We will filter by sender on the client-side to avoid composite index requirements.
        const q = query(
          collection(db, 'chats', room.id, 'messages'),
          where('createdAt', '>', lastReadTimestamp)
        );
  
        return onSnapshot(q, (snapshot) => {
          // Filter out messages sent by the current user on the client.
          const unreadCount = snapshot.docs.filter(doc => doc.data().senderId !== userId).length;
          
          setUnreadCounts(prevCounts => ({
            ...prevCounts,
            [room.id]: unreadCount,
          }));
        }, (error) => {
            console.error(`Error fetching unread count for room ${room.id}:`, error);
        });
      });
  
      return () => unsubscribes.forEach(unsub => unsub());
    }, [chatRooms, userId]);
  
    return unreadCounts;
  };


export function ChatSidebar({ currentUser, selectedChatId, onChatSelect }: ChatSidebarProps) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const unreadCounts = useUnreadCounts(chatRooms, currentUser.uid);

  useEffect(() => {
    const q = query(
        collection(db, 'chats'), 
        where('participantUids', 'array-contains', currentUser.uid),
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const rooms = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ChatRoom)
      );
      // Sort on the client-side to avoid composite index
      const sortedRooms = rooms.sort((a, b) => {
        const timeA = a.lastMessageAt?.toMillis() || a.createdAt?.toMillis() || 0;
        const timeB = b.lastMessageAt?.toMillis() || b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setChatRooms(sortedRooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser.uid]);

  if (loading) {
    return (
        <div className="space-y-2 p-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <nav className="flex flex-col gap-1 p-2">
        {chatRooms.length === 0 && !loading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
                チャットルームがありません。
            </div>
        )}
        {chatRooms.map((room) => {
            const otherParticipant = getOtherParticipant(room.participants, currentUser.uid);
            const unreadCount = unreadCounts[room.id] || 0;
            const lastMessageText = room.lastMessage || 'まだメッセージはありません';

            return (
                <button
                    key={room.id}
                    onClick={() => onChatSelect(room)}
                    className={cn(
                    'flex items-center gap-3 rounded-lg p-3 text-left transition-all hover:bg-accent',
                    selectedChatId === room.id ? 'bg-accent' : ''
                    )}
                >
                    <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(otherParticipant?.username)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 truncate">
                        <div className="font-semibold">{otherParticipant?.username}</div>
                        <p className={cn("text-xs", unreadCount > 0 ? "text-foreground font-bold" : "text-muted-foreground")}>
                           {lastMessageText.length > 15 ? `${lastMessageText.substring(0, 15)}...` : lastMessageText}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Badge className="flex h-6 w-6 items-center justify-center rounded-full">
                            {unreadCount}
                        </Badge>
                    )}
                </button>
            )
        })}
      </nav>
    </ScrollArea>
  );
}
