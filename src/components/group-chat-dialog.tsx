
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users as GroupIcon, Search, PlusCircle, Loader2 } from 'lucide-react';
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
import type { UserProfile, ChatRoom, ChatParticipant } from '@/lib/types';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';

interface GroupChatDialogProps {
  currentUser: UserProfile;
  onChatRoomSelect: (chatRoom: ChatRoom) => void;
}

const getInitials = (name?: string) => {
  return name ? name.substring(0, 2).toUpperCase() : '??';
};

export function GroupChatDialog({ currentUser, onChatRoomSelect }: GroupChatDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Select members, 2: Set group name
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (searchTerm.trim().length < 2) {
      toast({
        description: '検索するには2文字以上入力してください。',
        variant: 'destructive',
      });
      return;
    }
    setIsSearching(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('username', '>=', searchTerm),
        where('username', '<=', searchTerm + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs
        .map((doc) => doc.data() as UserProfile)
        .filter((user) => user.uid !== currentUser.uid);
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

  const toggleUserSelection = (user: UserProfile) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.uid === user.uid)
        ? prev.filter((u) => u.uid !== user.uid)
        : [...prev, user]
    );
  };

  const handleCreateGroup = async () => {
    if (groupName.trim().length < 2) {
      toast({ description: 'グループ名は2文字以上で入力してください。', variant: 'destructive' });
      return;
    }
    if (selectedUsers.length < 2) {
      toast({ description: '自分以外に最低2人のメンバーを選択してください。', variant: 'destructive' });
      return;
    }
    
    setIsCreating(true);
    try {
      const allParticipants: ChatParticipant[] = [
        { uid: currentUser.uid, username: currentUser.username },
        ...selectedUsers.map(u => ({ uid: u.uid, username: u.username }))
      ];
      const allParticipantUids = allParticipants.map(p => p.uid);

      const newChatRoomRef = await addDoc(collection(db, 'chats'), {
        groupName: groupName,
        isGroup: true,
        groupAdmin: currentUser.uid,
        participantUids: allParticipantUids,
        participants: allParticipants,
        createdAt: serverTimestamp(),
        lastMessage: `${currentUser.username}がグループを作成しました。`,
        lastMessageAt: serverTimestamp(),
      });
      
      const newChatRoomDoc = await getDoc(newChatRoomRef);
      onChatRoomSelect({ id: newChatRoomDoc.id, ...newChatRoomDoc.data() } as ChatRoom);
      
      toast({ title: "成功", description: "新しいグループチャットが作成されました。" });
      resetStateAndClose();

    } catch (error) {
      console.error('Error creating group chat:', error);
      toast({ title: "エラー", description: "グループの作成に失敗しました。", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const resetStateAndClose = () => {
    setIsOpen(false);
    setStep(1);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedUsers([]);
    setGroupName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <PlusCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'メンバーを選択' : 'グループ情報を設定'}
          </DialogTitle>
          <DialogDescription>
             {step === 1 ? 'グループに追加するメンバーを選択してください。' : 'グループ名を入力してください。'}
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 && (
          <div>
            <div className="flex items-center gap-2 py-4">
              <Input
                placeholder="ユーザー名で検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching} size="icon" variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {selectedUsers.length > 0 && (
                <div className='mb-2'>
                    <h4 className='text-sm font-medium mb-2'>選択中のメンバー:</h4>
                    <div className="flex flex-wrap gap-2">
                        {selectedUsers.map(user => (
                            <Badge key={user.uid} variant="secondary" className="flex items-center gap-1">
                                {user.username}
                                <button onClick={() => toggleUserSelection(user)} className='rounded-full hover:bg-muted-foreground/20'>
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
            
            <ScrollArea className="h-52 border rounded-md">
              <div className="p-2 space-y-1">
                {isSearching && <p className='text-center text-sm p-4'>検索中...</p>}
                {!isSearching && searchResults.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground p-4">検索結果がありません。</p>
                )}
                {!isSearching && searchResults.map(user => (
                  <div
                    key={user.uid}
                    className={cn(
                        "flex items-center justify-between rounded-md p-2 cursor-pointer",
                        selectedUsers.some(u => u.uid === user.uid) ? 'bg-accent' : 'hover:bg-muted'
                    )}
                    onClick={() => toggleUserSelection(user)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                      </Avatar>
                      <span>{user.username}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {step === 2 && (
          <div className="py-4">
            <Input
              placeholder="グループ名を入力"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
             <div className='mt-4'>
                <h4 className='text-sm font-medium mb-2'>メンバー ({selectedUsers.length + 1}人):</h4>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{currentUser.username} (あなた)</Badge>
                    {selectedUsers.map(user => (
                        <Badge key={user.uid} variant="secondary">{user.username}</Badge>
                    ))}
                </div>
            </div>
          </div>
        )}

        <DialogFooter>
            {step === 1 && (
                <>
                <Button type="button" variant="secondary" onClick={resetStateAndClose}>キャンセル</Button>
                <Button type="button" onClick={() => setStep(2)} disabled={selectedUsers.length === 0}>次へ ({selectedUsers.length})</Button>
                </>
            )}
            {step === 2 && (
                 <>
                 <Button type="button" variant="secondary" onClick={() => setStep(1)}>戻る</Button>
                 <Button type="button" onClick={handleCreateGroup} disabled={isCreating}>
                     {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     作成する
                 </Button>
                 </>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
