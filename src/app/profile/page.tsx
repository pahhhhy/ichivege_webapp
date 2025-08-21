
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Mail, Phone, User, UserCog } from 'lucide-react';
import { orders } from '@/lib/mock-data';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Image from 'next/image';

function OrderItem({ order }: { order: (typeof orders)[0] }) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    setFormattedDate(new Date(order.date).toLocaleDateString());
  }, [order.date]);

  return (
    <AccordionItem value={`item-${order.id}`} key={order.id}>
      <AccordionTrigger>
        <div className="flex w-full items-center justify-between pr-4">
          <div className="text-left">
            <p className="font-semibold">注文番号 #{order.id}</p>
            <p className="text-sm text-muted-foreground">
              日付: {formattedDate}
            </p>
          </div>
          <p className="font-semibold">
            合計: {order.total.toFixed(0)}円
          </p>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] hidden sm:table-cell">画像</TableHead>
              <TableHead>商品</TableHead>
              <TableHead className="text-center">数量</TableHead>
              <TableHead className="text-right">価格</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="hidden sm:table-cell">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={50}
                    height={50}
                    className="rounded-md object-cover"
                    data-ai-hint={item.dataAiHint}
                  />
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  {(item.price * item.quantity).toFixed(0)}円
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AccordionContent>
    </AccordionItem>
  );
}


function ProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const getInitials = (email: string | null | undefined) => {
    if (!email) return '??';
    return userProfile?.username
      ? userProfile.username.substring(0, 2).toUpperCase()
      : email.substring(0, 2).toUpperCase();
  };

  if (loading || !userProfile) {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <h1 className="font-headline mb-8 text-4xl font-bold">マイページ</h1>
            <Card>
                <CardHeader className="items-center text-center">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="w-full space-y-2">
                        <Skeleton className="mx-auto h-8 w-48" />
                        <Skeleton className="mx-auto h-4 w-64" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-headline mb-8 text-4xl font-bold">マイページ</h1>
      <div className="grid gap-8 md:grid-cols-1">
        <Card>
          <CardHeader className="items-center gap-4 text-center">
            <Avatar className="h-24 w-24 text-3xl">
              <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl">{userProfile.username}</CardTitle>
              <CardDescription>{userProfile.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <UserCog className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{userProfile.role}</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{userProfile.phoneNumber}</span>
              </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-6 w-6" />
                    <span>注文履歴</span>
                </CardTitle>
                <CardDescription>過去の注文一覧です。</CardDescription>
            </CardHeader>
            <CardContent>
                {orders.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                        <p className="mt-4 text-lg">過去の注文はありません。</p>
                    </div>
                ) : (
                    <Accordion type="single" collapsible className="w-full">
                        {orders.map((order) => (
                            <OrderItem key={order.id} order={order} />
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default ProfilePage;
