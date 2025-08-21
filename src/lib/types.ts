
import { User } from 'firebase/auth';

export interface Producer {
  id: string;
  name: string;
  location: string;
  bio: string;
}

export interface Product {
  id: string;
  name:string;
  description: string;
  price: number;
  currency: 'USD' | 'JPY';
  image: string;
  category: '葉物野菜' | '根菜' | 'アブラナ科' | '果菜';
  producerId: string;
  origin: string;
  farmingMethod: '有機栽培' | '慣行栽培' | '水耕栽培';
  stock: number;
  dataAiHint?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  dataAiHint?: string;
}

export interface Order {
  id: string;
  userId: string;
  orderItems: OrderItem[];
  totalAmount: number;
  orderDate: any; // Firestore Timestamp
  status: '処理中' | '発送済み' | '完了';
}

export type UserRole = '農家' | '一般ユーザー' | '飲食店' | '管理者';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  role: UserRole;
  phoneNumber: string;
  // For producers
  name?: string;
  location?: string;
  bio?: string;
}

export interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    logout: () => void;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any; // Firestore Timestamp
}
