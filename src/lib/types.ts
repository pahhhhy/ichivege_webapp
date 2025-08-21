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
  availability: '在庫あり' | '在庫切れ';
  stock: number;
  dataAiHint?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
}

export type UserRole = '農家' | '一般ユーザー' | '飲食店';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  role: UserRole;
  phoneNumber: string;
}

export interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    logout: () => void;
}
