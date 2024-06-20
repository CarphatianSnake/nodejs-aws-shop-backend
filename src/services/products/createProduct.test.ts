import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, ExecuteTransactionCommand } from "@aws-sdk/lib-dynamodb";

import { handler } from "@/services/products/createProduct";
import { httpEventMock } from "@/mock/httpEventMock";
import { TableNames, type HttpEventRequest } from "@/types";

describe('createProduct handler', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);
  process.env = {
    ...process.env,
    PRODUCTS_TABLE: TableNames.Products,
    STOCKS_TABLE: TableNames.Stocks,
  };

  const defaultEvent: HttpEventRequest = {
    ...httpEventMock
  } as any;

  beforeEach(() => {
    defaultEvent.body = null;
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

    defaultEvent.body = JSON.stringify(product);

    const result = await handler(defaultEvent);

    const parsedResult = JSON.parse(result.body);

    const { title, description, price, count } = parsedResult;

    expect(parsedResult).toHaveProperty('id');
    expect({ title, description, price, count }).toStrictEqual({
      title: product.title,
      description: product.description,
      price: product.price,
      count: product.count
    });
  })

  it('Should successfully add product with partial data to database', async () => {
    const product = {
      title: 'Test Title',
    };

    defaultEvent.body = JSON.stringify(product);

    const result = await handler(defaultEvent);

    const parsedResult = JSON.parse(result.body);

    const { title, description, price, count } = parsedResult;

    expect(parsedResult).toHaveProperty('id');
    expect({ title, description, price, count }).toStrictEqual({
      title: product.title,
      description: '',
      price: 0,
      count: 0
    });
  })

  it('Should return error 400 on invalid product data', async () => {
    const product = {
      title: 'Test Title',
      price: -100,
    };

    defaultEvent.body = JSON.stringify(product);

    const result = await handler(defaultEvent);

    expect(result).toHaveProperty('statusCode', 400);
  })

  it('Should return error 400 if there is no data inside body', async () => {
    defaultEvent.body = null;

    const result = await handler(defaultEvent);

    expect(result).toHaveProperty('statusCode', 400);
  })

  it('Should return error 500 on any error except invalid product data', async () => {

    const product = {
      title: 'Reject test',
      description: 'Must reject',
      price: 100,
      count: 4,
    };

    ddbMock.on(ExecuteTransactionCommand).rejects();

    defaultEvent.body = JSON.stringify(product);

    const result = await handler(defaultEvent);

    expect(result).toHaveProperty('statusCode', 500);
  })
})
