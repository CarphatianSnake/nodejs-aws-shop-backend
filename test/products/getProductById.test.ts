import { APIGatewayProxyEvent } from "aws-lambda";
import { products } from "@/products/mock/products";
import { handler } from "@/products/getProductById";

let mockedEvent: APIGatewayProxyEvent;

beforeEach(() => {
  mockedEvent = {} as unknown as APIGatewayProxyEvent;
})

it("Should return correct product by id", async () => {
  mockedEvent.pathParameters = { productId: products[0].id };
  const result = await handler(mockedEvent);
  expect(JSON.parse(result.body)).toStrictEqual(products[0]);
});

it('Should return statusCode 404', async () => {
  mockedEvent.pathParameters = { productId: '123' };
  const result = await handler(mockedEvent);
  expect(result.statusCode).toEqual(404);
});

it('Should return statusCode 400', async () => {
  mockedEvent.pathParameters = {};
  const result = await handler(mockedEvent);
  expect(result.statusCode).toEqual(400);
});
