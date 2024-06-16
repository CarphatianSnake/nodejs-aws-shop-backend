import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

import { createProduct } from "@/utils/createProduct";
import { CustomError } from "@/utils/CustomError";
import { response } from "../mock/response";

describe('createProduct', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);

  beforeEach(() => {
    ddbMock.reset();
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  it('Should successfully add product with full data to database', async () => {
    const product = {
      title: 'Test Title',
      description: 'Test Description',
      price: 100,
      count: 4,
    };

    ddbMock.on(TransactWriteCommand).resolves(response);

    const result = await createProduct(product);

    expect(result).resolves;
  })

  it('Should successfully add product with partial data to database', async () => {
    const product = {
      title: 'Test Title',
    };

    ddbMock.on(TransactWriteCommand).resolves(response);

    const result = await createProduct(product);

    expect(result).resolves;
  })

  it('Should return error 400 on invalid product data', async () => {
    ddbMock.on(TransactWriteCommand).resolves(response);

    const product1 = {
      title: 'Test Title',
      price: -100,
    };

    const result1 = createProduct(product1)

    expect(result1).rejects.toThrow();
    expect(result1).rejects.toBeInstanceOf(CustomError);
    expect(result1).rejects.toHaveProperty('statusCode', 400);

    const product2 = {
      title: 'Test Title',
      description: true,
      price: 100,
    };
  })

  it('Should return error 500 on any error except invalid product data', async () => {
    ddbMock.on(TransactWriteCommand).rejects();

    const product = {
      title: 'Test Title',
      description: 'Test Description',
      price: 100,
      count: 4,
    };

    const result = createProduct(product);

    expect(result).rejects.toThrow();
    expect(result).rejects.toBeInstanceOf(CustomError);
    expect(result).rejects.toHaveProperty('statusCode', 500);
  })
})
