import { handler } from "@/products/getProducts";
import { products } from "../mock/products";

it("Should return equal products array", async () => {
  const response = await handler();
  expect(JSON.parse(response.body)).toStrictEqual(products);
});
