
'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  name: z.string().min(2, '名前は2文字以上で入力してください。'),
  category: z.enum(['葉物野菜', '根菜', 'アブラナ科', '果菜']),
  price: z.coerce.number().min(0, '価格は0以上で入力してください。'),
  stock: z.coerce.number().min(0, '在庫数は0以上で入力してください。'),
  description: z.string().min(10, '詳細は10文字以上で入力してください。').max(500),
  origin: z.string().min(2, '産地は2文字以上で入力してください。'),
  farmingMethod: z.enum(['有機栽培', '慣行栽培', '水耕栽培']),
  image: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, '画像は必須です。')
    .refine((files) => files?.[0]?.size <= 5000000, `画像サイズは5MBまでです。`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "対応しているファイル形式は .jpg, .jpeg, .png, .webp です。"
    ),
});

interface ProductAddFormProps {
  producerId: string;
}

export function ProductAddForm({ producerId }: ProductAddFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: '葉物野菜',
      price: 0,
      stock: 0,
      description: '',
      origin: '',
      farmingMethod: '有機栽培',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // 1. Upload image to Firebase Storage
      const imageFile = values.image[0];
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);

      // 2. Add product data to Firestore
      await addDoc(collection(db, 'products'), {
        name: values.name,
        category: values.category,
        price: values.price,
        stock: values.stock,
        description: values.description,
        origin: values.origin,
        farmingMethod: values.farmingMethod,
        availability: values.stock > 0 ? '在庫あり' : '在庫切れ',
        producerId: producerId,
        currency: 'JPY',
        image: imageUrl, // Use uploaded image URL
        dataAiHint: `${values.name} vegetable`,
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
    } finally {
        setIsSubmitting(false);
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
          name="image"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel>商品画像</FormLabel>
              <FormControl>
                <Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files)} {...rest} />
              </FormControl>
              <FormDescription>
                JPEG, PNG, WEBP形式の画像をアップロードできます (最大5MB)。
              </FormDescription>
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
          name="stock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>在庫数</FormLabel>
              <FormControl>
                <Input type="number" placeholder="例：10" {...field} />
              </FormControl>
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
        <FormField
          control={form.control}
          name="origin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>産地</FormLabel>
              <FormControl>
                <Input placeholder="例：北海道" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="farmingMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>栽培方法</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="栽培方法を選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="有機栽培">有機栽培</SelectItem>
                  <SelectItem value="慣行栽培">慣行栽培</SelectItem>
                  <SelectItem value="水耕栽培">水耕栽培</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? '登録中...' : '商品を登録する'}
        </Button>
      </form>
    </Form>
  );
}
