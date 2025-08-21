
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, ShoppingCart } from 'lucide-react';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline mb-8 text-center text-4xl font-bold">
        ショッピングカート
      </h1>
      {cartItems.length === 0 ? (
        <div className="text-center">
          <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground" />
          <p className="mt-4 text-xl text-muted-foreground">カートは空です。</p>
          <Button asChild className="mt-6">
            <Link href="/">お買い物を始める</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] hidden md:table-cell">画像</TableHead>
                      <TableHead>商品</TableHead>
                      <TableHead className="text-center">数量</TableHead>
                      <TableHead className="text-right">価格</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="hidden md:table-cell">
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="rounded-md object-cover"
                            data-ai-hint={item.dataAiHint}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link href={`/product/${item.id}`} className="hover:underline">{item.name}</Link>
                          <div className="text-sm text-muted-foreground">{item.price.toFixed(0)}円/個</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(item.id, parseInt(e.target.value))
                              }
                              className="h-9 w-16 text-center"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {(item.price * item.quantity).toFixed(0)}円
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Button variant="outline" onClick={clearCart} className="mt-4">
              カートを空にする
            </Button>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>注文概要</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>小計</span>
                  <span>{cartTotal.toFixed(0)}円</span>
                </div>
                <div className="flex justify-between">
                  <span>送料</span>
                  <span>レジで計算されます</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>合計</span>
                  <span>{cartTotal.toFixed(0)}円</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg">
                  レジに進む
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
