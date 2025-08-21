
'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { useAuth } from './auth-context';
import type { CartItem, Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  cartTotal: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const fetchCartItems = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const cartCollectionRef = collection(db, 'users', user.uid, 'cart');
      const querySnapshot = await getDocs(cartCollectionRef);
      const items = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as CartItem)
      );
      setCartItems(items);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      toast({
        title: 'エラー',
        description: 'カートの情報を取得できませんでした。',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading) {
      fetchCartItems();
    }
  }, [user, authLoading, fetchCartItems]);

  const addToCart = async (product: Product) => {
    if (!user) {
      toast({
        title: 'ログインが必要です',
        description: '商品をカートに追加するにはログインしてください。',
        variant: 'destructive',
      });
      return;
    }

    const existingItem = cartItems.find((item) => item.id === product.id);
    const newQuantity = existingItem ? existingItem.quantity + 1 : 1;
    const cartItemRef = doc(db, 'users', user.uid, 'cart', product.id);

    try {
      if (existingItem) {
        await setDoc(cartItemRef, { quantity: newQuantity }, { merge: true });
      } else {
        await setDoc(cartItemRef, { ...product, quantity: newQuantity });
      }
      fetchCartItems(); // カートの状態を再同期
      toast({
        title: 'カートに追加しました！',
        description: `${product.name} がショッピングカートに入りました。`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: 'エラー',
        description: 'カートへの追加中にエラーが発生しました。',
        variant: 'destructive',
      });
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;
    const cartItemRef = doc(db, 'users', user.uid, 'cart', productId);
    try {
      await deleteDoc(cartItemRef);
      fetchCartItems(); // カートの状態を再同期
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: 'エラー',
        description: 'カートからの削除中にエラーが発生しました。',
        variant: 'destructive',
      });
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    const cartItemRef = doc(db, 'users', user.uid, 'cart', productId);
    try {
      await setDoc(cartItemRef, { quantity }, { merge: true });
      fetchCartItems(); // カートの状態を再同期
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: 'エラー',
        description: '数量の更新中にエラーが発生しました。',
        variant: 'destructive',
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;
    const cartCollectionRef = collection(db, 'users', user.uid, 'cart');
    try {
        const querySnapshot = await getDocs(cartCollectionRef);
        const batch = writeBatch(db);
        querySnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        fetchCartItems(); // カートの状態を再同期
    } catch (error) {
        console.error("Error clearing cart: ", error);
        toast({
            title: "エラー",
            description: "カートのクリア中にエラーが発生しました。",
            variant: "destructive",
        });
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartはCartProviderの中で使用する必要があります');
  }
  return context;
};
