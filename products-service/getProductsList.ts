import { getProductsList, prepareResponse } from '/opt/utils';
import type { HttpResponse } from '@/types';

export const handler = async (): HttpResponse => {
  const data = getProductsList();

  if (data.length) {
    return prepareResponse(200, data);
  };

  return prepareResponse(404, { message: 'No products found' });
};
