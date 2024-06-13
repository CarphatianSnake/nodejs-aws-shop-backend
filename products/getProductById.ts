import type { APIGatewayProxyEvent } from 'aws-lambda';

import { products } from './utils/products';
import prepareResponse from './utils/prepareResponse';

export const handler = async (event: APIGatewayProxyEvent) => {
  const params = event.pathParameters;

  if (params?.productId) {
    const product = products.find((product) => product.id === params.productId);

    if (product) {
      return prepareResponse(200, product);
    }

    return prepareResponse(404, { message: 'Product not found' });
  }

  return prepareResponse(400, { message: `Missing product id` });
};
