import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

import { handler } from "@/products-service/createProduct";
import { response } from "../mock/response";
import { httpEventMock } from "../mock/httpEventMock";
import type { HttpEventRequest } from "@/types";

describe('createProduct', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);

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

    ddbMock.on(TransactWriteCommand).resolves(response);

    const result = await handler(defaultEvent);

    expect(JSON.parse(result.body)).resolves;
  })

  it('Should successfully add product with partial data to database', async () => {
    const product = {
      title: 'Test Title',
    };

    defaultEvent.body = JSON.stringify(product);

    ddbMock.on(TransactWriteCommand).resolves(response);

    const result = await handler(defaultEvent);

    expect(JSON.parse(result.body)).resolves;
  })

  it('Should return error 400 on invalid product data', async () => {
    ddbMock.on(TransactWriteCommand).resolves(response);

    const product = {
      title: 'Test Title',
      price: -100,
    };

    defaultEvent.body = JSON.stringify(product);

    const result = await handler(defaultEvent);

    expect(result).toHaveProperty('statusCode', 400);
  })

  it('Should return error 400 on no data body', async () => {
    ddbMock.on(TransactWriteCommand).resolves(response);

    const result = await handler(defaultEvent);

    expect(result).toHaveProperty('statusCode', 400);
  })

  it('Should return error 500 on any error except invalid product data', async () => {
    ddbMock.on(TransactWriteCommand).rejects();

    const product = {
      title: 'Test Title',
      description: 'Test Description',
      price: 100,
      count: 4,
    };

    defaultEvent.body = JSON.stringify(product);

    const result = await handler(defaultEvent);

    expect(result).toHaveProperty('statusCode', 500);
  })
})
