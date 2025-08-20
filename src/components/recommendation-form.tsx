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
          Thinking...
        </>
      ) : (
        'Get Recommendations'
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
        error: 'Please select at least one past purchase.',
      };
    }
    const seasonalAvailability = formData.getAll('seasonalAvailability') as string[];
    const result = await recommendVegetables({ pastPurchases, seasonalAvailability });
    return { ...result, error: null };
  } catch (e) {
    return {
      ...initialState,
      error: 'An unexpected error occurred. Please try again.',
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
    // pre-select some options for demo
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
        {/* Hidden inputs to pass all seasonal veggies to the AI */}
        {seasonalOptions.map(veg => (
            <input type="hidden" name="seasonalAvailability" value={veg} key={`hidden-${veg}`} />
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Tell us what you like</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div>
                <Label className="text-base font-semibold">Your Past Purchases</Label>
                <p className="text-sm text-muted-foreground mb-4">Select a few vegetables you've enjoyed before.</p>
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
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.recommendations.length > 0 && (
        <div className="mt-8 space-y-6">
          <h2 className="text-center text-2xl font-bold">Our Recommendations For You</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Try these next!</CardTitle>
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
                    <CardTitle>Why you'll love them</CardTitle>
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
