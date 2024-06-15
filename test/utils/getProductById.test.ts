import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, BatchGetCommand } from "@aws-sdk/lib-dynamodb";

import { getProductById } from '@/utils/getProductById';
import { CustomError } from "@/utils/CustomError";

describe('getProductById', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);

  beforeEach(() => {
    ddbMock.reset();
  });

  it('Should return the product with the given ID', async () => {
    const productId = '1';
    const product = { id: productId, name: 'Product 1' };
    const stock = { count: 10 };

    ddbMock.on(BatchGetCommand).resolves({
      Responses: {
        'products': [product],
        'stocks': [stock],
      }
    });

    const result = await getProductById(productId);
    expect(result).toEqual({ ...product, ...stock });
  });

  it('Should return error 404 PRODUCT not found error with the given ID', async () => {
    const productId = '1';

    ddbMock.on(BatchGetCommand).resolves({
      Responses: {
        'products': [],
        'stocks': [],
      }
    });

    expect(getProductById(productId)).rejects.toThrow();
    expect(getProductById(productId)).rejects.toBeInstanceOf(CustomError);
    expect(getProductById(productId)).rejects.toHaveProperty('statusCode', 404);
    expect(getProductById(productId)).rejects.toHaveProperty('message', 'Product not found!');
  });

  it('Should return error 404 STOCK not found error with the given ID', async () => {
    const productId = '1';

    ddbMock.on(BatchGetCommand).resolves({
      Responses: {
        'products': [{ id: productId }],
        'stocks': [],
      }
    });

    expect(getProductById(productId)).rejects.toThrow();
    expect(getProductById(productId)).rejects.toBeInstanceOf(CustomError);
    expect(getProductById(productId)).rejects.toHaveProperty('statusCode', 404);
    expect(getProductById(productId)).rejects.toHaveProperty('message', 'Stock not found!');
  });

  it('Should return error 500 error with the given ID', async () => {
    const productId = '1';

    ddbMock.on(BatchGetCommand).rejects();

    expect(getProductById(productId)).rejects.toThrow();
    expect(getProductById(productId)).rejects.toBeInstanceOf(CustomError);
    expect(getProductById(productId)).rejects.toHaveProperty('statusCode', 500);
    expect(getProductById(productId)).rejects.toHaveProperty('message', 'Something went wrong!');
  });
});