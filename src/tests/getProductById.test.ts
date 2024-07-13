import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, BatchExecuteStatementCommand } from "@aws-sdk/lib-dynamodb";

import { handler } from "@services/products/lambdas/getProductById";
import { products } from "@/mock/products";
import { httpEventMock } from "@/mock/httpEventMock";
import { TableNames, type HttpEventRequest } from "@/types";

const defaultEvent: HttpEventRequest = {
  ...httpEventMock
} as any;

describe('getProductById handler', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);
  process.env = {
    ...process.env,
    PRODUCTS_TABLE: TableNames.Products,
    STOCKS_TABLE: TableNames.Stocks,
  };

  jest.spyOn(console, 'log').mockImplementation(() => { });
  jest.spyOn(console, 'error').mockImplementation(() => { });

  beforeEach(() => {
    defaultEvent.pathParameters = {};
    ddbMock.reset();
  })

  it("Should return correct product by id", async () => {
    defaultEvent.pathParameters = { productId: products[0].id };

    const stock = {
      product_id: products[0].id,
      count: 100,
    };

    ddbMock.on(BatchExecuteStatementCommand).resolves({
      Responses: [
        {
          Item: products[0],
          TableName: TableNames.Products,
        },
        {
          Item: stock,
          TableName: TableNames.Stocks,
        },
      ],
    });

    const result = await handler(defaultEvent);

    expect(JSON.parse(result.body)).toStrictEqual({
      ...products[0],
      count: stock.count,
    });
  });

  it('Should return product data with 0 count if there is no stock in response', async () => {
    defaultEvent.pathParameters = { productId: products[0].id };

    ddbMock.on(BatchExecuteStatementCommand).resolves({
      Responses: [
        {
          Item: products[0],
          TableName: TableNames.Products,
        }
      ],
    });

    const result = await handler(defaultEvent);

    expect(JSON.parse(result.body)).toStrictEqual({
      ...products[0],
      count: 0,
    });
  })

  it('Should return error 404 if product not found', async () => {
    const productId = '12345678-abcd-efgh-ijkl-1234567890ab';

    defaultEvent.pathParameters = { productId };

    const stock = {
      product_id: productId,
      count: 100,
    };

    ddbMock.on(BatchExecuteStatementCommand).resolves({
      Responses: [
        {
          Item: [],
          TableName: TableNames.Products,
        },
        {
          Item: stock,
          TableName: TableNames.Stocks,
        },
      ],
    });

    const result1 = await handler(defaultEvent);

    expect(result1).toHaveProperty('statusCode', 404);

    ddbMock.on(BatchExecuteStatementCommand).resolves({
      Responses: [
        {
          Item: stock,
          TableName: TableNames.Stocks,
        },
      ],
    });

    const result2 = await handler(defaultEvent);

    expect(result2).toHaveProperty('statusCode', 404);
  })

  it('Should return error 400 if there is no id provided', async () => {
    defaultEvent.pathParameters = {};

    const result = await handler(defaultEvent);

    expect(result).toHaveProperty('statusCode', 400);
  })

  it('Should return error 500 on all errors exept not found and missing id', async () => {
    defaultEvent.pathParameters = { productId: products[0].id };

    ddbMock.on(BatchExecuteStatementCommand).resolves({
      Responses: [
        {
          Item: { ...products[0] },
          TableName: TableNames.Products,
        },
        {
          Item: { count: -5 },
          TableName: TableNames.Stocks,
        },
      ],
    });

    const result1 = await handler(defaultEvent);

    expect(result1).toHaveProperty('statusCode', 500);

    ddbMock.on(BatchExecuteStatementCommand).rejects();

    const result2 = await handler(defaultEvent);

    expect(result2).toHaveProperty('statusCode', 500);
  })
})
