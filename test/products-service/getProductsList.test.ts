import * as utils from "/opt/utils";
import { handler } from "@/products-service/getProductsList";
import { products } from "../mock/products";

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getProducts handler', () => {
  it("Should return products array", async () => {
    const response = await handler();
    expect(JSON.parse(response.body)).toStrictEqual(products);
  });

  it("Should return statusCode 404", async () => {
    jest.spyOn(utils, 'getProductsList').mockReturnValue([]);
    const response = await handler();
    expect(response.statusCode).toEqual(404);
  });
})
