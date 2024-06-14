import * as getProducts from "@/products/getProducts";
import { products } from "../mock/products";

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getProducts handler', () => {
  it("Should return products array", async () => {
    const response = await getProducts.handler();
    expect(JSON.parse(response.body)).toStrictEqual(products);
  });

  it("Should return statusCode 404", async () => {
    jest.spyOn(getProducts, 'getProductsData').mockReturnValue([]);
    const response = await getProducts.handler();
    expect(response.statusCode).toEqual(404);
  });
})
