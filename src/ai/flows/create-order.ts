
'use server';

/**
 * @fileOverview Creates an order using the Firebase Admin SDK, updates stock, and clears the user's cart.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin'; // Use Admin SDK
import { FieldValue } from 'firebase-admin/firestore';
import type { Product } from '@/lib/types';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Client SDK for clearing cart

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
      // Use an admin transaction to ensure atomicity
      const orderId = await adminDb.runTransaction(async (transaction) => {
        const productsToUpdate: {
          ref: FirebaseFirestore.DocumentReference;
          currentStock: number;
          quantityToDecrement: number;
        }[] = [];
        const orderItemsWithProducer = [];

        // 1. READ phase: Verify stock for all items using admin transaction
        for (const item of cartItems) {
          const productRef = adminDb.collection('products').doc(item.id);
          const productDoc = await transaction.get(productRef);
          if (!productDoc.exists) {
            throw new Error(`商品が見つかりません: ${item.name}`);
          }
          const productData = productDoc.data() as Product;
          if (productData.stock < item.quantity) {
            throw new Error(
              `在庫不足: ${item.name} (現在の在庫: ${productData.stock})`
            );
          }
          productsToUpdate.push({
            ref: productRef,
            currentStock: productData.stock,
            quantityToDecrement: item.quantity,
          });
          orderItemsWithProducer.push({
            ...item,
            producerId: productData.producerId,
          });
        }

        // 2. WRITE phase
        const totalAmount = cartItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const orderRef = adminDb.collection('orders').doc(); // Auto-generate ID

        transaction.set(orderRef, {
          userId,
          orderItems: orderItemsWithProducer,
          totalAmount,
          status: '処理中',
          orderDate: FieldValue.serverTimestamp(),
          id: orderRef.id,
        });

        // Update stock for each product
        for (const prod of productsToUpdate) {
          const newStock = prod.currentStock - prod.quantityToDecrement;
          transaction.update(prod.ref, { stock: newStock });
        }

        return orderRef.id;
      });

      // 3. Clear the user's cart (using client SDK as it's a client-side action context)
      // This is safe to do after the transaction succeeds.
      const cartCollectionRef = collection(db, 'users', userId, 'cart');
      const cartSnapshot = await getDocs(cartCollectionRef);
      const batch = adminDb.batch(); // Use admin batch
      cartSnapshot.docs.forEach((doc) => {
        batch.delete(adminDb.collection('users').doc(userId).collection('cart').doc(doc.id));
      });
      await batch.commit();

      return orderId;
    } catch (error) {
      console.error('Order processing failed: ', error);
      if (error instanceof Error) {
        // Re-throw specific, user-friendly messages
        if (error.message.includes('在庫不足') || error.message.includes('商品が見つかりません')) {
            throw error;
        }
        throw new Error('注文処理中にサーバーエラーが発生しました。');
      }
      throw new Error('注文処理中に不明なエラーが発生しました。');
    }
  }
);
