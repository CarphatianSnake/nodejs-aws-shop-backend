import { products } from './products';
import prepareResponse from './prepareResponse';
import type { HttpResponse } from '@/types';

export const getProductsData = () => products;

export const handler = async (): HttpResponse => {
  const data = getProductsData();

  if (data.length) {
    return prepareResponse(200, data);
  };

  return prepareResponse(404, { message: 'No products found' });
};
