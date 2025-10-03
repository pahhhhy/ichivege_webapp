
'use client';

import Image from 'next/image';
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
import { History } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function OrderItem({ order }: { order: Order }) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    // Check if order.orderDate is a Firestore Timestamp
    if (order.orderDate && typeof order.orderDate.toDate === 'function') {
      setFormattedDate(new Date(order.orderDate.toDate()).toLocaleString());
    }
  }, [order.orderDate]);

  return (
    <AccordionItem value={`item-${order.id}`} key={order.id}>
      <AccordionTrigger>
        <div className="flex w-full items-center justify-between pr-4">
          <div className="text-left">
            <p className="font-semibold">注文番号 #{order.id.slice(0, 7)}...</p>
            <p className="text-sm text-muted-foreground">
              日付: {formattedDate}
            </p>
          </div>
          <div className='text-right'>
            <p className="font-semibold">
                合計: {order.totalAmount.toFixed(0)}円
            </p>
            <p className="text-sm text-muted-foreground">{order.status}</p>
          </div>
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
            {order.orderItems.map((item) => {
              const imageUrl = (item.images && item.images.length > 0) ? item.images[0] : `https://placehold.co/50x50?text=${item.name}`;
              return (
              <TableRow key={item.id}>
                <TableCell className="hidden sm:table-cell">
                  <Image
                    src={imageUrl}
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
            )})}
          </TableBody>
        </Table>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        if (!authLoading) {
            setLoading(false);
        }
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Order)
      );
      // Sort on the client-side
      const sortedOrders = ordersData.sort((a, b) => {
          const dateA = a.orderDate?.toDate() || 0;
          const dateB = b.orderDate?.toDate() || 0;
          return dateB - dateA;
      });
      setOrders(sortedOrders);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching orders: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-headline mb-8 text-center text-4xl font-bold">
        注文履歴
      </h1>
      {loading ? (
         <div className="w-full space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
         </div>
      ) : orders.length === 0 ? (
        <div className="text-center">
          <History className="mx-auto h-24 w-24 text-muted-foreground" />
          <p className="mt-4 text-xl text-muted-foreground">過去の注文はありません。</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
            {orders.map((order) => (
              <OrderItem key={order.id} order={order} />
            ))}
        </Accordion>
      )}
    </div>
  );
}
