import Image from 'next/image';
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
import { History } from 'lucide-react';

export default function OrdersPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-headline mb-8 text-center text-4xl font-bold">
        注文履歴
      </h1>
      {orders.length === 0 ? (
        <div className="text-center">
          <History className="mx-auto h-24 w-24 text-muted-foreground" />
          <p className="mt-4 text-xl text-muted-foreground">過去の注文はありません。</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {orders.map((order, index) => (
            <AccordionItem value={`item-${index}`} key={order.id}>
              <AccordionTrigger>
                <div className="flex w-full items-center justify-between pr-4">
                  <div className="text-left">
                    <p className="font-semibold">注文番号 #{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      日付: {new Date(order.date).toLocaleDateString()}
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
          ))}
        </Accordion>
      )}
    </div>
  );
}
