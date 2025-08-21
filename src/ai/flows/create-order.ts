
'use server';

/**
 * @fileOverview Creates an order, updates stock, and clears the user's cart.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  collection,
  runTransaction,
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
  addDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CartItem, Product } from '@/lib/types';

const CreateOrderInputSchema = z.object({
  userId: z.string().describe('The ID of the user placing the order.'),
  cartItems: z
    .array(
      z.object({
        id: z.string(),
        quantity: z.number(),
        price: z.number(),
        name: z.string(),
        image: z.string(),
        dataAiHint: z.string().optional(),
      })
    )
    .describe('An array of items in the cart.'),
});

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

export async function createOrder(input: CreateOrderInput): Promise<string> {
  return createOrderFlow(input);
}

const createOrderFlow = ai.defineFlow(
  {
    name: 'createOrderFlow',
    inputSchema: CreateOrderInputSchema,
    outputSchema: z.string(), // Returns the new order ID
  },
  async ({ userId, cartItems }) => {
    if (cartItems.length === 0) {
      throw new Error('カートが空です。');
    }

    try {
      // Use a transaction to ensure atomicity
      const orderId = await runTransaction(db, async (transaction) => {
        // 1. Verify stock for all items
        for (const item of cartItems) {
          const productRef = doc(db, 'products', item.id);
          const productDoc = await transaction.get(productRef);
          if (!productDoc.exists()) {
            throw new Error(`商品が見つかりません: ${item.name}`);
          }
          const productData = productDoc.data() as Product;
          if (productData.stock < item.quantity) {
            throw new Error(`在庫不足: ${item.name}`);
          }
        }

        // 2. Create the order document
        const totalAmount = cartItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const orderItems = cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          dataAiHint: item.dataAiHint,
        }));

        const orderRef = await addDoc(collection(db, 'orders'), {
          userId,
          orderItems,
          totalAmount,
          status: '処理中',
          orderDate: serverTimestamp(),
        });
        
        // 3. Update stock for each product
        for (const item of cartItems) {
          const productRef = doc(db, 'products', item.id);
          const productDoc = await transaction.get(productRef);
          const newStock = productDoc.data()!.stock - item.quantity;
          transaction.update(productRef, { stock: newStock });
        }

        return orderRef.id;
      });

      // 4. Clear the user's cart (outside of the transaction)
      const cartCollectionRef = collection(db, 'users', userId, 'cart');
      const cartSnapshot = await getDocs(cartCollectionRef);
      const batch = writeBatch(db);
      cartSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      return orderId;
    } catch (error) {
      console.error('Transaction failed: ', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('注文処理中に不明なエラーが発生しました。');
    }
  }
);
