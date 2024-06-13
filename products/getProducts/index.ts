import { products } from './products';
import prepareResponse from './prepareResponse';

export const handler = async () => {
  return prepareResponse(200, products);
};
