import { products } from './products';
import prepareResponse from './prepareResponse';
import type { HttpResponse } from '@/types';

export const handler = async (): HttpResponse => {
  return prepareResponse(200, products);
};
