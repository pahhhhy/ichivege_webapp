
'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const formSchema = z.object({
  title: z.string().min(2, 'タイトルは2文字以上で入力してください。'),
  content: z.string().min(10, '内容は10文字以上で入力してください。'),
});

export function PostForm() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !userProfile) {
        toast({
            title: 'エラー',
            description: '投稿するにはログインが必要です。',
            variant: 'destructive',
        });
        return;
    }

    try {
      await addDoc(collection(db, 'posts'), {
        ...values,
        authorId: user.uid,
        authorName: userProfile.username,
        createdAt: serverTimestamp(),
      });

      toast({
        title: '投稿が作成されました！',
        description: '新しいお知らせが掲示板に表示されます。',
      });
      form.reset();
    } catch (error) {
      console.error('Error adding post:', error);
      toast({
        title: 'エラー',
        description: '投稿の作成中にエラーが発生しました。',
        variant: 'destructive',
      });
    }
  }

  return (
    <Card className="my-8">
        <CardHeader>
            <CardTitle>新しいお知らせを作成</CardTitle>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>タイトル</FormLabel>
                    <FormControl>
                        <Input placeholder="例：新しい野菜が入荷しました！" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>内容</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="お知らせの詳細を入力してください。"
                        className="min-h-[150px]"
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full" size="lg">
                投稿する
                </Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
