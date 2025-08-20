'use client';

import Image from 'next/image';
import { notFound } from 'next/navigation';
import { products, producers } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/cart-context';
import { MapPin, Sprout, ShoppingCart, Truck } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = products.find((p) => p.id === params.id);
  const { addToCart } = useCart();

  if (!product) {
    notFound();
  }

  const producer = producers.find((p) => p.id === product.producerId);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative h-96 w-full overflow-hidden rounded-lg shadow-lg">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            data-ai-hint={product.dataAiHint}
          />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="font-headline text-4xl font-bold">{product.name}</h1>
          <p className="mt-2 text-2xl font-semibold text-primary">
            {product.price.toFixed(0)}円
          </p>
          <p className="mt-4 text-muted-foreground">{product.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-2 py-1 text-sm">
              <MapPin className="h-4 w-4" />
              {product.origin}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 py-1 text-sm">
              <Sprout className="h-4 w-4" />
              {product.farmingMethod}
            </Badge>
            <Badge variant={product.availability === '在庫あり' ? 'default' : 'destructive'} className="flex items-center gap-2 bg-accent py-1 text-sm text-accent-foreground">
              <Truck className="h-4 w-4" />
              {product.availability}
            </Badge>
          </div>
          <Button
            size="lg"
            className="mt-8 w-full"
            onClick={() => addToCart(product)}
            disabled={product.availability !== '在庫あり'}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            カートに追加
          </Button>
        </div>
      </div>
      {producer && (
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>生産者より</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-semibold">{producer.name}</h3>
            <p className="text-sm text-muted-foreground">{producer.location}</p>
            <p className="mt-2">{producer.bio}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
