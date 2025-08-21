import { ProductCard } from '@/components/product-card';
import { products } from '@/lib/mock-data';
import type { Product } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { CategoryFilter } from '@/components/category-filter';

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

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product: Product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
