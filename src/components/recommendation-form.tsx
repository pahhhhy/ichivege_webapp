'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { recommendVegetables } from '@/ai/flows/vegetable-recommendation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { AlertCircle, Leaf, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const initialState = {
  recommendations: [],
  reasoning: '',
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          考え中...
        </>
      ) : (
        'おすすめを取得'
      )}
    </Button>
  );
}

async function formAction(
  _prevState: any,
  formData: FormData
): Promise<{ recommendations: string[]; reasoning: string; error: string | null; }> {
  try {
    const pastPurchases = formData.getAll('pastPurchases') as string[];
    if (pastPurchases.length === 0) {
      return {
        ...initialState,
        error: '過去の購入品を1つ以上選択してください。',
      };
    }
    const seasonalAvailability = formData.getAll('seasonalAvailability') as string[];
    const result = await recommendVegetables({ pastPurchases, seasonalAvailability });
    return { ...result, error: null };
  } catch (e) {
    return {
      ...initialState,
      error: '予期せぬエラーが発生しました。もう一度お試しください。',
    };
  }
}

export function RecommendationForm({
  seasonalOptions,
  purchaseOptions,
}: {
  seasonalOptions: string[];
  purchaseOptions: string[];
}) {
  const [state, action] = useFormState(formAction, initialState);
  const [selectedPurchases, setSelectedPurchases] = useState<string[]>([]);
  
  useEffect(() => {
    // デモ用にいくつかのオプションを事前に選択
    setSelectedPurchases(purchaseOptions.slice(0, 2));
  }, [purchaseOptions]);

  const handleCheckboxChange = (checked: boolean, value: string) => {
    setSelectedPurchases(prev => 
      checked ? [...prev, value] : prev.filter(p => p !== value)
    );
  };

  return (
    <div className="mt-8">
      <form action={action}>
        {/* すべての旬の野菜をAIに渡すための隠し入力 */}
        {seasonalOptions.map(veg => (
            <input type="hidden" name="seasonalAvailability" value={veg} key={`hidden-${veg}`} />
        ))}

        <Card>
          <CardHeader>
            <CardTitle>あなたの好みを教えてください</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div>
                <Label className="text-base font-semibold">過去の購入品</Label>
                <p className="text-sm text-muted-foreground mb-4">以前に楽しんだ野菜をいくつか選択してください。</p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {purchaseOptions.map((veg) => (
                    <div key={veg} className="flex items-center space-x-2">
                      <Checkbox
                        id={`purchase-${veg}`}
                        name="pastPurchases"
                        value={veg}
                        checked={selectedPurchases.includes(veg)}
                        onCheckedChange={(checked) => handleCheckboxChange(!!checked, veg)}
                      />
                      <Label htmlFor={`purchase-${veg}`} className="cursor-pointer">{veg}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <SubmitButton />
            </div>
          </CardContent>
        </Card>
      </form>
      
      {state.error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.recommendations.length > 0 && (
        <div className="mt-8 space-y-6">
          <h2 className="text-center text-2xl font-bold">あなたへのおすすめ</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>次はこちらをお試しください！</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {state.recommendations.map((veg) => (
                        <div key={veg} className="flex items-center gap-3 text-lg">
                            <Leaf className="h-5 w-5 text-primary" />
                            <span>{veg}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Card className="bg-secondary">
                <CardHeader>
                    <CardTitle>気に入る理由</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-secondary-foreground">{state.reasoning}</p>
                </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
