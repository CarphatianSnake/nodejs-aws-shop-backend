import { prepareResponse, products } from '/opt/utils';
import type { HttpEventRequest, HttpResponse, ProductPathParams } from '@/types';

export const handler = async (event: HttpEventRequest): HttpResponse => {
  const { productId } = event.pathParameters;

  if (productId) {
    const product = products.find((product) => product.id === productId);

    if (product) {
      return prepareResponse(200, product);
    }

    return prepareResponse(404, { message: 'Product not found' });
  }

  return prepareResponse(400, { message: `Missing product id` });
};
