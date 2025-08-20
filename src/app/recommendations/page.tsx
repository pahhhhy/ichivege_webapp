import { RecommendationForm } from '@/components/recommendation-form';
import { seasonalVegetables, userPastPurchases } from '@/lib/mock-data';
import { Sparkles } from 'lucide-react';

export default function RecommendationsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="text-center">
        <Sparkles className="mx-auto h-12 w-12 text-primary" />
        <h1 className="font-headline mt-4 text-4xl font-bold">
          Vegetable Recommender
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Let our AI help you discover your next favorite vegetable!
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Select some of your past purchases and we'll suggest something new and in-season.
        </p>
      </div>

      <RecommendationForm
        seasonalOptions={seasonalVegetables}
        purchaseOptions={userPastPurchases}
      />
    </div>
  );
}
