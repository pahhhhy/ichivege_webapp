
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import type { UserRole } from '@/lib/types';

const formSchema = z.object({
  username: z.string().min(2, 'ユーザー名は2文字以上で入力してください。'),
  email: z.string().email('無効なメールアドレスです。'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください。'),
  role: z.enum(['農家', '一般ユーザー', '飲食店']),
  phoneNumber: z.string().min(10, '有効な電話番号を入力してください。'),
  postalCode: z.string().min(7, '郵便番号は7文字で入力してください。').max(7, '郵便番号は7文字で入力してください。'),
  address: z.string().min(5, '住所は5文字以上で入力してください。'),
});

export function SignupForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      role: '一般ユーザー',
      phoneNumber: '',
      postalCode: '',
      address: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username: values.username,
        email: values.email,
        role: values.role,
        phoneNumber: values.phoneNumber,
        postalCode: values.postalCode,
        address: values.address,
      });

      toast({
        title: '登録が完了しました！',
        description: 'ICHIVEGEへようこそ！',
      });
      form.reset();
      // Redirect to home or login page after successful registration
      // window.location.href = '/';
    } catch (error: any) {
      console.error('Registration error:', error);
      let description = '登録中にエラーが発生しました。もう一度お試しください。';
      if (error.code === 'auth/email-already-in-use') {
        description = 'このメールアドレスは既に使用されています。';
      }
      toast({
        title: '登録エラー',
        description: description,
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ユーザー名</FormLabel>
              <FormControl>
                <Input placeholder="例：山田 太郎" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>ユーザー種別</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="役割を選択してください" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="農家">農家</SelectItem>
                            <SelectItem value="一般ユーザー">一般ユーザー</SelectItem>
                            <SelectItem value="飲食店">飲食店</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>電話番号</FormLabel>
              <FormControl>
                <Input placeholder="09012345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>郵便番号 (ハイフンなし)</FormLabel>
              <FormControl>
                <Input placeholder="1500002" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>住所</FormLabel>
              <FormControl>
                <Input placeholder="東京都渋谷区渋谷..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" size="lg">
          登録する
        </Button>
      </form>
    </Form>
  );
}
