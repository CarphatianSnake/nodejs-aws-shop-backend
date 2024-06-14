import { handler } from "@/products/getProductById";
import { products } from "../mock/products";
import { httpEventMock } from "../mock/httpEventMock";
import type { HttpEventRequest, ProductPathParams } from "@/types";

const defaultEvent: HttpEventRequest<ProductPathParams> = {
  ...httpEventMock
} as any;

beforeEach(() => {
  defaultEvent.pathParameters = {};
})

describe('getProductById handler', () => {
  it("Should return correct product by id", async () => {
    defaultEvent.pathParameters = { productId: products[0].id };
    const result = await handler(defaultEvent);
    expect(JSON.parse(result.body)).toStrictEqual(products[0]);
  });

  it('Should return statusCode 404', async () => {
    defaultEvent.pathParameters = { productId: '123' };
    const result = await handler(defaultEvent);
    expect(result.statusCode).toEqual(404);
  });

  it('Should return statusCode 400', async () => {
    const result = await handler(defaultEvent);
    expect(result.statusCode).toEqual(400);
  });
})
