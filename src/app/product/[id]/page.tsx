
'use client';

import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
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
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, Producer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function ProductPageSkeleton() {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-12">
            <div className="grid gap-8 md:grid-cols-2">
                <Skeleton className="h-96 w-full rounded-lg" />
                <div className="flex flex-col justify-center space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-20 w-full" />
                    <div className="flex flex-wrap items-center gap-4">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
            <div className="mt-12">
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    )
}


export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [producer, setProducer] = useState<Producer | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
        setLoading(true);
        const productDocRef = doc(db, 'products', id);
        const productDoc = await getDoc(productDocRef);

        if (productDoc.exists()) {
            const productData = { id: productDoc.id, ...productDoc.data() } as Product;
            setProduct(productData);

            if (productData.producerId) {
                const producerDocRef = doc(db, 'users', productData.producerId);
                const producerDoc = await getDoc(producerDocRef);
                if (producerDoc.exists()) {
                    setProducer(producerDoc.data() as Producer);
                }
            }
        } else {
            notFound();
        }
        setLoading(false);
    }
    fetchProduct();
  }, [id]);


  if (loading) {
    return <ProductPageSkeleton />;
  }

  if (!product) {
    return notFound();
  }
  
  const availability = product.stock > 0 ? '在庫あり' : '在庫切れ';
  const imageUrl = product.image ? product.image : `https://placehold.co/600x600?text=${product.name}`;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg shadow-lg bg-muted">
            <Image
                src={imageUrl}
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
            <Badge variant={availability === '在庫あり' ? 'default' : 'destructive'} className="flex items-center gap-2 bg-accent py-1 text-sm text-accent-foreground">
              <Truck className="h-4 w-4" />
              {availability}
            </Badge>
          </div>
          <Button
            size="lg"
            className="mt-8 w-full"
            onClick={() => addToCart(product)}
            disabled={availability !== '在庫あり'}
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
