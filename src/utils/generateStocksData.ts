import { products } from '@/mock/products';
import type { Stock } from '@/types';

export const generateStocksData = (): Stock[] => {
  return products.map((product) => ({
    product_id: product.id,
    count: Math.floor(Math.random() * 10) + 1,
  }))
};
