
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { Order, Product, OrderItem } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartTooltipContent, ChartContainer } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Package, ShoppingBag, Users } from 'lucide-react';
import { format } from 'date-fns';

type DailySales = {
  date: string;
  total: number;
};

const chartConfig = {
    total: {
      label: '売上',
    },
  };

export default function DashboardPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && (!userProfile || userProfile.role !== '農家')) {
      router.push('/');
    }
  }, [userProfile, authLoading, router]);

  useEffect(() => {
    if (userProfile && userProfile.role === '農家') {
      const fetchData = async () => {
        setLoadingData(true);
        try {
          // Fetch products by producer
          const productsQuery = query(
            collection(db, 'products'),
            where('producerId', '==', userProfile.uid)
          );
          const productsSnapshot = await getDocs(productsQuery);
          const productsData = productsSnapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Product)
          );
          setProducts(productsData);

          // Fetch orders containing the producer's products
          const ordersQuery = query(
            collection(db, 'orders'),
            where('orderItems', 'array-contains-any', 
              productsData.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                quantity: 1, // These fields are just for the query shape
                image: p.image,
                dataAiHint: p.dataAiHint,
                producerId: p.producerId
              }))
            )
          );
          
          const allOrdersSnapshot = await getDocs(query(collection(db, 'orders'), orderBy('orderDate', 'desc')));
          const producerOrders = allOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)).filter(order => 
            order.orderItems.some(item => item.producerId === userProfile.uid)
          );

          setOrders(producerOrders);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        } finally {
          setLoadingData(false);
        }
      };
      fetchData();
    }
  }, [userProfile]);

  const { totalRevenue, totalSales, uniqueCustomers, dailySales } =
    useMemo(() => {
      let totalRevenue = 0;
      const customerIds = new Set<string>();
      const salesByDate: { [key: string]: number } = {};

      const producerOrders = orders.map(order => {
        const producerItems = order.orderItems.filter(item => item.producerId === userProfile?.uid);
        return { ...order, orderItems: producerItems };
      }).filter(order => order.orderItems.length > 0);


      producerOrders.forEach((order) => {
        customerIds.add(order.userId);
        const date = format(order.orderDate.toDate(), 'yyyy-MM-dd');
        if (!salesByDate[date]) {
          salesByDate[date] = 0;
        }
        const orderRevenue = order.orderItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        totalRevenue += orderRevenue;
        salesByDate[date] += orderRevenue;
      });

      const dailySales: DailySales[] = Object.keys(salesByDate)
        .sort()
        .map((date) => ({
          date: format(new Date(date), 'M/d'),
          total: salesByDate[date],
        }));

      return {
        totalRevenue,
        totalSales: producerOrders.length,
        uniqueCustomers: customerIds.size,
        dailySales,
      };
    }, [orders, userProfile]);

  const recentSales = useMemo(() => {
    return orders
        .map(order => ({
            ...order,
            orderItems: order.orderItems.filter(item => item.producerId === userProfile?.uid)
        }))
        .filter(order => order.orderItems.length > 0)
        .slice(0, 5);
  }, [orders, userProfile]);

  if (authLoading || loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48" />
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="h-96 lg:col-span-4" />
            <Skeleton className="h-96 lg:col-span-3" />
        </div>
      </div>
    );
  }
  
  if (!userProfile || userProfile.role !== '農家') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline mb-8 text-4xl font-bold">ダッシュボード</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総売上</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toFixed(0)}円</div>
            <p className="text-xs text-muted-foreground">全ての期間の合計</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総注文件数</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalSales}</div>
            <p className="text-xs text-muted-foreground">全ての期間の合計</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">顧客数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCustomers}</div>
            <p className="text-xs text-muted-foreground">ユニークな顧客の数</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">出品中の商品数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">現在販売中の商品</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>売上の概要</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <BarChart accessibilityLayer data={dailySales}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `${value}円`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  width={80}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total, hsl(var(--primary)))" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>最近の注文</CardTitle>
            <CardDescription>あなたの商品の直近5件の注文です。</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>注文ID</TableHead>
                        <TableHead>日付</TableHead>
                        <TableHead className="text-right">金額</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentSales.map(order => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id.slice(0, 7)}</TableCell>
                            <TableCell>{format(order.orderDate.toDate(), 'yyyy/MM/dd')}</TableCell>
                            <TableCell className="text-right">{order.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(0)}円</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
             </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>在庫状況</CardTitle>
          <CardDescription>現在出品中の商品の在庫一覧です。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>商品名</TableHead>
                <TableHead>カテゴリー</TableHead>
                <TableHead className='text-right'>価格</TableHead>
                <TableHead className='text-right'>在庫数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className='text-right'>{product.price.toFixed(0)}円</TableCell>
                  <TableCell className='text-right'>{product.stock}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    