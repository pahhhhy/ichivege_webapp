import { RecommendationForm } from '@/components/recommendation-form';
import { seasonalVegetables, userPastPurchases } from '@/lib/mock-data';
import { Sparkles } from 'lucide-react';

export default function RecommendationsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="text-center">
        <Sparkles className="mx-auto h-12 w-12 text-primary" />
        <h1 className="font-headline mt-4 text-4xl font-bold">
          野菜のおすすめ
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          AIがあなたの次のお気に入りの野菜を見つけるお手伝いをします！
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          過去に購入したものをいくつか選択してください。旬の新しいものをお勧めします。
        </p>
      </div>

      <RecommendationForm
        seasonalOptions={seasonalVegetables}
        purchaseOptions={userPastPurchases}
      />
    </div>
  );
}
