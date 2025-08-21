
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
} from 'firebase/firestore';
import type { UserProfile, ChatRoom } from '@/lib/types';
import { User } from 'firebase/auth';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';

interface UserSearchDialogProps {
    currentUser: User;
    onChatRoomSelect: (chatRoom: ChatRoom) => void;
}

const getInitials = (name?: string) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
}


export function UserSearchDialog({ currentUser, onChatRoomSelect }: UserSearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (searchTerm.trim().length < 2) {
      toast({
        title: '検索エラー',
        description: '検索するには2文字以上入力してください。',
        variant: 'destructive',
      });
      return;
    }
    setIsSearching(true);
    try {
      const usersRef = collection(db, 'users');
      // Firestore does not support case-insensitive search or partial string search natively.
      // A common workaround is to search for a range.
      const q = query(
        usersRef,
        where('username', '>=', searchTerm),
        where('username', '<=', searchTerm + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs
        .map((doc) => doc.data() as UserProfile)
        .filter((user) => user.uid !== currentUser.uid); // Exclude current user
      setSearchResults(users);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'エラー',
        description: 'ユーザーの検索に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const createChatRoom = async (otherUser: UserProfile) => {
    try {
        // Check if a chat room already exists
        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, where('participantUids', 'array-contains', currentUser.uid));
        const querySnapshot = await getDocs(q);

        // Client-side filter to find the exact chat room
        const existingChat = querySnapshot.docs.find(doc => {
            const data = doc.data();
            const participantUids = data.participantUids as string[];
            // Check for a 1-on-1 chat with the other user
            return participantUids.length === 2 && participantUids.includes(otherUser.uid);
        });

        if (existingChat) {
            onChatRoomSelect({ id: existingChat.id, ...existingChat.data() } as ChatRoom);
            setIsOpen(false);
            return;
        }

        // Create a new chat room
        const currentUserProfileDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const currentUserProfile = currentUserProfileDoc.data();
        
        if (!currentUserProfile) {
            throw new Error("Could not find current user's profile.");
        }

        const newChatRoomRef = await addDoc(collection(db, 'chats'), {
            participantUids: [currentUser.uid, otherUser.uid],
            participants: [
                { uid: currentUser.uid, username: currentUserProfile.username },
                { uid: otherUser.uid, username: otherUser.username }
            ],
            createdAt: serverTimestamp(),
            lastMessage: '',
            lastMessageAt: serverTimestamp(),
        });
        
        const newChatRoomDoc = await getDoc(newChatRoomRef);

        onChatRoomSelect({ 
            id: newChatRoomDoc.id, 
            ...newChatRoomDoc.data()
        } as ChatRoom);
        setIsOpen(false);
    } catch(error) {
        console.error("Error creating chat room: ", error);
        toast({
            title: "エラー",
            description: "チャットルームの作成に失敗しました。",
            variant: "destructive"
        })
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Users className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新しいチャットを開始</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Input
              id="search"
              placeholder="ユーザー名で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching} size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-64">
            <div className="space-y-2">
                {isSearching && <p>検索中...</p>}
                {!isSearching && searchResults.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground pt-4">検索結果がありません。</p>
                )}
                {!isSearching && searchResults.map(user => (
                    <div key={user.uid} className="flex items-center justify-between rounded-md p-2 hover:bg-muted">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                            </Avatar>
                            <span>{user.username}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => createChatRoom(user)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            チャット
                        </Button>
                    </div>
                ))}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              閉じる
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
