import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import { products } from '@/lib/mock-data';
import type { Product } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export default function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const category =
    typeof searchParams.category === 'string' ? searchParams.category : 'all';

  const filteredProducts =
    category === 'all'
      ? products
      : products.filter(
          (p) => p.category.toLowerCase() === category.toLowerCase()
        );

  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="font-headline text-4xl font-bold text-primary-foreground/90 md:text-5xl">
          農場から新鮮な野菜を
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          地元で採れた野菜のセレクションをご覧ください。
        </p>
      </header>

      <div className="mb-6 flex items-center justify-end">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">カテゴリーで絞り込む:</span>
          <Select defaultValue={category}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="カテゴリー" />
            </SelectTrigger>
            <SelectContent>
              <Link href="/">
                <SelectItem value="all">すべて</SelectItem>
              </Link>
              {categories.map((cat) => (
                <Link href={`/?category=${cat.toLowerCase()}`} key={cat}>
                  <SelectItem value={cat.toLowerCase()}>{cat}</SelectItem>
                </Link>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Separator className="mb-8" />

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product: Product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
