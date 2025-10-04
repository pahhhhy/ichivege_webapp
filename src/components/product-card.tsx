
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const availability = product.stock > 0 ? '在庫あり' : '在庫切れ';
  const imageUrl = product.image ? product.image : `https://placehold.co/600x400?text=${product.name}`;

  return (
    <Link href={`/product/${product.id}`} className="group">
      <Card className="flex h-full transform flex-col overflow-hidden transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              data-ai-hint={product.dataAiHint}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-4">
          <CardTitle className="mb-2 text-lg font-bold">{product.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {product.description.length > 60 ? `${product.description.substring(0, 60)}...` : product.description}
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4 pt-0">
          <p className="text-lg font-semibold text-primary">
            {product.price.toFixed(0)}円
          </p>
          <Badge variant={availability === '在庫あり' ? 'secondary' : 'destructive'}>
            {availability}
          </Badge>
        </CardFooter>
      </Card>
    </Link>
  );
}
