
'use server';

/**
 * @fileOverview Creates an order using the Firebase Admin SDK, updates stock, and clears the user's cart.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { admin, adminDb } from '@/lib/firebase-admin'; // Use Admin SDK
import { FieldValue } from 'firebase-admin/firestore';
import type { OrderItem, Product } from '@/lib/types';
// Removed unused client-side imports

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

        const productRefs = cartItems.map(item => adminDb.collection('products').doc(item.id));
        const productDocs = await transaction.getAll(...productRefs);
        
        const productsToUpdate: { ref: admin.firestore.DocumentReference; newStock: number }[] = [];
        const finalOrderItems: OrderItem[] = [];

        // 1. READ phase: Verify stock for all items
        for (let i = 0; i < productDocs.length; i++) {
          const productDoc = productDocs[i];
          const cartItem = cartItems[i];

          if (!productDoc.exists) {
            throw new Error(`商品が見つかりません: ${cartItem.name}`);
          }
          
          const productData = productDoc.data() as Product;
          
          if (productData.stock < cartItem.quantity) {
            throw new Error(
              `在庫不足: ${cartItem.name} (現在の在庫: ${productData.stock})`
            );
          }
          
          productsToUpdate.push({
            ref: productDoc.ref,
            newStock: productData.stock - cartItem.quantity,
          });

          finalOrderItems.push({
            ...cartItem,
            producerId: productData.producerId,
          });
        }
        
        // 2. WRITE phase
        const totalAmount = cartItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const orderRef = adminDb.collection('orders').doc();

        transaction.set(orderRef, {
          userId,
          orderItems: finalOrderItems,
          totalAmount,
          status: '処理中',
          orderDate: FieldValue.serverTimestamp(),
          id: orderRef.id,
        });

        // Update stock for each product
        for (const prod of productsToUpdate) {
          transaction.update(prod.ref, { stock: prod.newStock });
        }

        return orderRef.id;
      });

      // 3. Clear the user's cart using Admin SDK batch write
      const cartCollectionRef = adminDb.collection('users').doc(userId).collection('cart');
      const cartSnapshot = await cartCollectionRef.get();
      if (!cartSnapshot.empty) {
        const batch = adminDb.batch();
        cartSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

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
