
'use server';

/**
 * @fileOverview Creates an order using the Firebase Admin SDK, updates stock, and clears the user's cart.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { admin, adminDb } from '@/lib/firebase-admin'; // Use Admin SDK
import { FieldValue } from 'firebase-admin/firestore';
import type { OrderItem, Product, UserProfile } from '@/lib/types';
import { sendPushMessage } from '@/lib/line';
import type { TextMessage } from '@line/bot-sdk';

const CreateOrderInputSchema = z.object({
  userId: z.string().describe('The ID of the user placing the order.'),
  cartItems: z
    .array(
      z.object({
        id: z.string(),
        quantity: z.number(),
        price: z.number(),
        name: z.string(),
        images: z.array(z.string()),
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
    if (!adminDb) {
      throw new Error(
        'Firebase Admin SDK is not initialized. Check server configuration.'
      );
    }
    if (cartItems.length === 0) {
      throw new Error('カートが空です。');
    }

    try {
      // Use an admin transaction to ensure atomicity
      const orderId = await adminDb.runTransaction(async (transaction) => {
        const productRefs = cartItems.map((item) =>
          adminDb.collection('products').doc(item.id)
        );
        const productDocs = await transaction.getAll(...productRefs);

        const productsToUpdate: {
          ref: admin.firestore.DocumentReference;
          newStock: number;
        }[] = [];
        const finalOrderItems: OrderItem[] = [];

        // 1. READ & VALIDATE phase: Verify stock for all items
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
            producerId: productData.producerId, // Ensure producerId is included
          });
        }

        // 2. WRITE phase
        const totalAmount = cartItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const orderRef = adminDb.collection('orders').doc();

        // Create the new order
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

        // Return the new order ID from the transaction
        return orderRef.id;
      });

      // 3. Post-transaction: Clear the user's cart using Admin SDK batch write
      const cartCollectionRef = adminDb
        .collection('users')
        .doc(userId)
        .collection('cart');
      const cartSnapshot = await cartCollectionRef.get();

      if (!cartSnapshot.empty) {
        const batch = adminDb.batch();
        cartSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

      // 4. Post-transaction: Send LINE notification
      try {
        const userDocRef = adminDb.collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
          const userProfile = userDoc.data() as UserProfile;
          if (userProfile.lineUserId) {
            const message: TextMessage = {
              type: 'text',
              text: `${userProfile.username}様\n\nご注文ありがとうございます！\n商品が発送されるまで今しばらくお待ちください。\n\n注文番号: ${orderId}`,
            };
            await sendPushMessage(userProfile.lineUserId, [message]);
          }
        }
      } catch (lineError) {
        // Log the error but don't fail the entire transaction
        console.error(`Failed to send LINE notification for order ${orderId}:`, lineError);
      }

      return orderId;
    } catch (error) {
      console.error('Order processing failed: ', error);
      if (error instanceof Error) {
        // Re-throw specific, user-friendly messages from the transaction
        if (
          error.message.includes('在庫不足') ||
          error.message.includes('商品が見つかりません')
        ) {
          throw error;
        }
        throw new Error('注文処理中にサーバーエラーが発生しました。');
      }
      throw new Error('注文処理中に不明なエラーが発生しました。');
    }
  }
);
