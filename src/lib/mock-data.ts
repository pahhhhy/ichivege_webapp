import type { Producer, Product, Order } from '@/lib/types';

export const producers: Producer[] = [
  {
    id: 'producer-1',
    name: 'グリーン・エーカーズ・ファーム',
    location: 'カリフォルニア州ソノマ郡',
    bio: '有機栽培の伝統野菜を専門とする家族経営の農場です。私たちは持続可能な農業を信じ、地域社会に最も新鮮な農産物を提供しています。',
  },
  {
    id: 'producer-2',
    name: 'サンライズ・オーガニックス',
    location: 'ニューヨーク州ハドソンバレー',
    bio: '季節の野菜を幅広く栽培している認定有機農場です。私たちの使命は、人々を健康的でおいしい食べ物と結びつけることです。',
  },
  {
    id: 'producer-3',
    name: 'ハイドロハーベスト',
    location: 'テキサス州オースティン',
    bio: '環境への影響を最小限に抑えながら、一年中、新鮮でクリーンな葉物野菜を生産する最先端の水耕栽培農場です。',
  },
];

export const products: Product[] = [];

export const orders: Order[] = [
  {
    id: 'order-1',
    date: '2023-10-26',
    items: [],
    total: 1350,
  },
  {
    id: 'order-2',
    date: '2023-10-15',
    items: [],
    total: 3075,
  },
];

export const seasonalVegetables = [
  'ケール',
  'ブロッコリー',
  '人参',
  'ほうれん草',
  'ビーツ',
  'さつまいも',
  '芽キャベツ',
  '冬かぼちゃ',
  'キャベツ',
];

export const userPastPurchases = [
  'レインボーチャード',
  '伝統人参',
  'バターレタス',
  'ビーフステーキトマト',
];
