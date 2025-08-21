'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/product-card';
import type { Product } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { CategoryFilter } from '@/components/category-filter';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
      );
      setProducts(productsData);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const category =
    typeof searchParams.category === 'string' ? searchParams.category : 'all';

  const filteredProducts =
    category === 'all'
      ? products
      : products.filter(
          (p) => p.category.toLowerCase() === category.toLowerCase()
        );

  const categories = ['all', ...new Set(products.map((p) => p.category))];

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="font-headline text-4xl font-bold text-primary md:text-5xl">
          農場から新鮮な野菜を
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          地元で採れた野菜のセレクションをご覧ください。
        </p>
      </header>

      <div className="mb-6 flex items-center justify-end">
        <CategoryFilter categories={categories} currentCategory={category} />
      </div>

      <Separator className="mb-8" />

      {loading ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex justify-between">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
