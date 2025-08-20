'use server';

/**
 * @fileOverview Recommends vegetables to users based on their past purchases and seasonal availability.
 *
 * - recommendVegetables - A function that recommends vegetables.
 * - VegetableRecommendationInput - The input type for the recommendVegetables function.
 * - VegetableRecommendationOutput - The return type for the recommendVegetables function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VegetableRecommendationInputSchema = z.object({
  pastPurchases: z
    .array(z.string())
    .describe('An array of the user\'s past vegetable purchases.'),
  seasonalAvailability: z
    .array(z.string())
    .describe('An array of vegetables that are currently in season.'),
});
export type VegetableRecommendationInput = z.infer<
  typeof VegetableRecommendationInputSchema
>;

const VegetableRecommendationOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe(
      'An array of recommended vegetables based on past purchases and seasonal availability.'
    ),
  reasoning: z
    .string()
    .describe(
      'Explanation of why the vegetables were recommended for the user.'
    ),
});
export type VegetableRecommendationOutput = z.infer<
  typeof VegetableRecommendationOutputSchema
>;

export async function recommendVegetables(
  input: VegetableRecommendationInput
): Promise<VegetableRecommendationOutput> {
  return vegetableRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'vegetableRecommendationPrompt',
  input: {schema: VegetableRecommendationInputSchema},
  output: {schema: VegetableRecommendationOutputSchema},
  prompt: `You are a vegetable recommendation expert.

  Based on the user's past purchases and current seasonal availability, recommend vegetables that the user might enjoy.
  Explain the reasoning for the recommendation.

  Past Purchases: {{pastPurchases}}
  Seasonal Availability: {{seasonalAvailability}}`,
});

const vegetableRecommendationFlow = ai.defineFlow(
  {
    name: 'vegetableRecommendationFlow',
    inputSchema: VegetableRecommendationInputSchema,
    outputSchema: VegetableRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
