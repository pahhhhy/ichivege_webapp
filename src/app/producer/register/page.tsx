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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  farmName: z.string().min(2, '農園名は2文字以上で入力してください。'),
  location: z.string().min(2, '場所は必須です。'),
  email: z.string().email('無効なメールアドレスです。'),
  bio: z.string().min(20, '自己紹介は20文字以上で入力してください。').max(500, '自己紹介は500文字以内で入力してください。'),
});

export default function ProducerRegistrationPage() {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            farmName: '',
            location: '',
            email: '',
            bio: '',
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
        toast({
            title: "登録が送信されました！",
            description: "ご登録ありがとうございます。追ってご連絡いたします。",
        });
        form.reset();
    }


  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">生産者になる</CardTitle>
          <CardDescription>
            私たちの地域の農家コミュニティに参加して、新鮮な農産物の販売を始めましょう。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="farmName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>農園名</FormLabel>
                    <FormControl>
                      <Input placeholder="例：グリーンエイカーズファーム" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>場所</FormLabel>
                    <FormControl>
                      <Input placeholder="例：カリフォルニア州ソノマ郡" {...field} />
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
                    <FormLabel>連絡先メールアドレス</FormLabel>
                    <FormControl>
                      <Input placeholder="you@yourfarm.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>農園について</FormLabel>
                    <FormControl>
                      <Textarea placeholder="あなたの農園、栽培方法、そしてあなたの農産物の特別な点について教えてください。" className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" size="lg">農園を登録する</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
