export interface Producer {
  id: string;
  name: string;
  location: string;
  bio: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  category: 'Leafy Green' | 'Root' | 'Cruciferous' | 'Fruit';
  producerId: string;
  origin: string;
  farmingMethod: 'Organic' | 'Conventional' | 'Hydroponic';
  availability: 'In Stock' | 'Out of Stock';
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
