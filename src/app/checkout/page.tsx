
'use client';

import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createOrder } from '@/ai/flows/create-order';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { OrderItem } from '@/lib/types';


export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!user || !userProfile) {
    // Redirect to login if not authenticated, or show loading
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  const handleCreateOrder = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const orderItemsForFlow: Omit<OrderItem, 'producerId'>[] = cartItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        image: item.image,
        dataAiHint: item.dataAiHint || ''
      }));

      const orderId = await createOrder({ userId: user.uid, cartItems: orderItemsForFlow as OrderItem[] });
      toast({
        title: '注文が確定しました！',
        description: `ご注文ありがとうございます。注文番号: ${orderId}`,
      });
      // The local cart will be cleared via Firestore listener in CartContext
      router.push(`/order-complete?orderId=${orderId}`);
    } catch (err: any) {
      console.error('注文の作成に失敗しました:', err);
      setError(
        err.message ||
          '注文の処理中にエラーが発生しました。在庫が不足している可能性があります。'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-headline mb-8 text-center text-4xl font-bold">
        注文内容の確認
      </h1>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>お届け先</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{userProfile.username}</p>
              {userProfile.postalCode && <p>〒{userProfile.postalCode}</p>}
              {userProfile.address && <p>{userProfile.address}</p>}
              {!userProfile.address && <p className='text-sm text-muted-foreground'>マイページから住所を登録してください。</p>}
              <p className='mt-2'>電話番号: {userProfile.phoneNumber}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>お支払い方法</CardTitle>
            </CardHeader>
            <CardContent>
              <p>代金引換</p>
              <p className="text-sm text-muted-foreground">
                商品到着時に配達員にお支払いください。
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ご注文内容</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const imageUrl = item.image ? item.image : `https://placehold.co/64x64?text=${item.name}`;
                  return (
                  <div key={item.id} className="flex items-center gap-4">
                    <Image
                      src={imageUrl}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="rounded-md object-cover"
                      data-ai-hint={item.dataAiHint}
                    />
                    <div className="flex-grow">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x {item.price.toFixed(0)}円
                      </p>
                    </div>
                    <p className="font-semibold">
                      {(item.price * item.quantity).toFixed(0)}円
                    </p>
                  </div>
                )})}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>小計</span>
                  <span>{cartTotal.toFixed(0)}円</span>
                </div>
                <div className="flex justify-between">
                  <span>送料</span>
                  <span>無料</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>合計</span>
                  <span>{cartTotal.toFixed(0)}円</span>
                </div>
              </div>
            </CardContent>
          </Card>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            onClick={handleCreateOrder}
            disabled={cartItems.length === 0 || isProcessing || !userProfile.address}
            className="w-full"
            size="lg"
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? '処理中...' : '注文を確定する'}
          </Button>
        </div>
      </div>
    </div>
  );
}
