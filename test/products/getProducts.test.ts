import { products } from "@/products/mock/products";
import { handler } from "@/products/getProducts";

it("Should return equal products array", async () => {
  const response = await handler();
  expect(JSON.parse(response.body)).toStrictEqual(products);
});
