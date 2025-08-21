
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  name: z.string().min(2, '名前は2文字以上で入力してください。'),
  category: z.enum(['葉物野菜', '根菜', 'アブラナ科', '果菜']),
  price: z.coerce.number().min(0, '価格は0以上で入力してください。'),
  availability: z.enum(['在庫あり', '在庫切れ']),
  description: z.string().min(10, '詳細は10文字以上で入力してください。').max(500),
});

interface ProductAddFormProps {
  producerId: string;
}

export function ProductAddForm({ producerId }: ProductAddFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: '葉物野菜',
      price: 0,
      availability: '在庫あり',
      description: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await addDoc(collection(db, 'products'), {
        ...values,
        producerId: producerId,
        currency: 'JPY',
        image: 'https://placehold.co/600x400.png', // Placeholder image
        dataAiHint: `${values.name} vegetable`,
        origin: '未設定', // You might want to get this from producer's profile
        farmingMethod: '未設定', // You might want to add this to the form
        createdAt: serverTimestamp(),
      });

      toast({
        title: '商品が追加されました！',
        description: `${values.name}が商品一覧に表示されます。`,
      });
      form.reset();
      router.push('/');
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: 'エラー',
        description: '商品の追加中にエラーが発生しました。',
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>野菜の名前</FormLabel>
              <FormControl>
                <Input placeholder="例：新鮮なトマト" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>カテゴリー</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリーを選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="葉物野菜">葉物野菜</SelectItem>
                  <SelectItem value="根菜">根菜</SelectItem>
                  <SelectItem value="アブラナ科">アブラナ科</SelectItem>
                  <SelectItem value="果菜">果菜</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>価格 (円)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="例：500" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="availability"
          render={({ field }) => (
            <FormItem>
              <FormLabel>在庫状況</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="在庫状況を選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="在庫あり">在庫あり</SelectItem>
                  <SelectItem value="在庫切れ">在庫切れ</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>詳細情報</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="野菜の特徴、味、おすすめの調理法などを入力してください。"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" size="lg">
          商品を登録する
        </Button>
      </form>
    </Form>
  );
}
