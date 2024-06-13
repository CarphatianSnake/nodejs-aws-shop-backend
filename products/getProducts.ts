import { products } from './utils/products';
import prepareResponse from './utils/prepareResponse';

export const handler = async () => {
  return prepareResponse(200, products);
};
