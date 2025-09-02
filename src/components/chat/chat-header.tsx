
'use client';

import type { ChatRoom, ChatParticipant } from '@/lib/types';
import { User } from 'firebase/auth';
import { Users as GroupIcon, User as UserIcon } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';

interface ChatHeaderProps {
  chatRoom: ChatRoom;
  currentUser: User;
}

const getOtherParticipant = (participants: ChatParticipant[], currentUserId: string): ChatParticipant | undefined => {
  return participants.find(p => p.uid !== currentUserId);
};

export function ChatHeader({ chatRoom, currentUser }: ChatHeaderProps) {
  const isGroup = chatRoom.isGroup;
  const otherParticipant = isGroup ? null : getOtherParticipant(chatRoom.participants, currentUser.uid);
  const displayName = isGroup ? chatRoom.groupName : otherParticipant?.username;

  return (
    <div className="flex items-center justify-between border-b p-4">
      <h3 className="text-lg font-semibold">
        {displayName || 'Chat'}
      </h3>
      {isGroup && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <GroupIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>メンバー ({chatRoom.participants.length})</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {chatRoom.participants.map(p => (
              <DropdownMenuItem key={p.uid} className="gap-2">
                <UserIcon className="h-4 w-4" />
                <span>{p.username} {p.uid === currentUser.uid && '(あなた)'}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
