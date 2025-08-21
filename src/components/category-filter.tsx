'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';

interface CategoryFilterProps {
  categories: string[];
  currentCategory: string;
}

export function CategoryFilter({ categories, currentCategory }: CategoryFilterProps) {
  const router = useRouter();

  const handleCategoryChange = (value: string) => {
    if (value === 'all') {
      router.push('/');
    } else {
      router.push(`/?category=${value}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">カテゴリーで絞り込む:</span>
      <Select value={currentCategory} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="カテゴリー" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat.toLowerCase()}>
              {cat === 'all' ? 'すべて' : cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
