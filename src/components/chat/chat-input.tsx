
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const messageSchema = z.object({
  text: z.string().min(1, 'メッセージを入力してください。'),
});

type MessageFormValues = z.infer<typeof messageSchema>;

interface ChatInputProps {
  chatRoomId: string;
  senderId: string;
  senderName: string;
}

export function ChatInput({ chatRoomId, senderId, senderName }: ChatInputProps) {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { text: '' },
  });

  const onSubmit: SubmitHandler<MessageFormValues> = async (data) => {
    setIsSending(true);
    try {
      const batch = writeBatch(db);
      
      const messagesColRef = collection(db, 'chats', chatRoomId, 'messages');
      const newMessageRef = doc(messagesColRef);
      batch.set(newMessageRef, {
        text: data.text,
        senderId: senderId,
        senderName: senderName,
        createdAt: serverTimestamp(),
        readBy: [senderId],
      });

      const chatRoomRef = doc(db, 'chats', chatRoomId);
      batch.update(chatRoomRef, {
        lastMessage: data.text,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: senderId,
      });

      await batch.commit();

      form.reset();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'エラー',
        description: 'メッセージの送信に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="border-t p-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
        <Input
          {...form.register('text')}
          placeholder="メッセージを入力..."
          autoComplete="off"
          disabled={isSending}
        />
        <Button type="submit" size="icon" disabled={isSending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
