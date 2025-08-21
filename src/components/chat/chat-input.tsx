
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const messageSchema = z.object({
  text: z.string().min(1, 'メッセージを入力してください。'),
});

type MessageFormValues = z.infer<typeof messageSchema>;

interface ChatInputProps {
  chatRoomId: string;
  senderId: string;
}

export function ChatInput({ chatRoomId, senderId }: ChatInputProps) {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { text: '' },
  });

  const onSubmit: SubmitHandler<MessageFormValues> = async (data) => {
    setIsSending(true);
    try {
      const messagesColRef = collection(db, 'chats', chatRoomId, 'messages');
      await addDoc(messagesColRef, {
        text: data.text,
        senderId: senderId,
        createdAt: serverTimestamp(),
      });
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
