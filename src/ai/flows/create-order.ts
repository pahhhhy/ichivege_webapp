
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
  writeBatch,
  serverTimestamp,
  getDocs,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/lib/types';

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

        // Create a new order document
        const orderRef = await addDoc(collection(db, 'orders'), {
            userId,
            orderItems,
            totalAmount,
            status: '処理中',
            orderDate: serverTimestamp(),
        });
        
        // Temporarily disable stock update and cart clearing
        /*
        // Use a transaction to ensure atomicity for order creation and stock update
        const orderId = await runTransaction(db, async (transaction) => {
            // 1. READ phase: Verify stock for all items first.
            const productsToUpdate: { ref: any, currentStock: number, quantityToDecrement: number }[] = [];

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
            productsToUpdate.push({
                ref: productRef,
                currentStock: productData.stock,
                quantityToDecrement: item.quantity,
            });
            }

            // 2. WRITE phase: After all reads are done, perform all writes.
            
            // Create the order document
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

            // Create a new order document reference with an auto-generated ID
            const orderRef = doc(collection(db, 'orders'));

            transaction.set(orderRef, {
            userId,
            orderItems,
            totalAmount,
            status: '処理中',
            orderDate: serverTimestamp(),
            id: orderRef.id,
            });

            // Update stock for each product
            for (const prod of productsToUpdate) {
                const newStock = prod.currentStock - prod.quantityToDecrement;
                transaction.update(prod.ref, { stock: newStock });
            }
            
            return orderRef.id;
        });

        // 3. Clear the user's cart (outside of the transaction, after it succeeds)
        const cartCollectionRef = collection(db, 'users', userId, 'cart');
        const cartSnapshot = await getDocs(cartCollectionRef);
        const batch = writeBatch(db);
        cartSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        */

        return orderRef.id;

    } catch (error) {
        console.error('Order processing failed: ', error);
        if (error instanceof Error) {
            throw error; // Re-throw the original error to be caught by the UI
        }
        throw new Error('注文処理中に不明なエラーが発生しました。');
    }
  }
);

