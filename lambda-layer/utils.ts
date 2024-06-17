import { z } from 'zod';
import type { Product, PutTransact, PutTransactOptions, Stock, TableNames, HttpResponseBody } from "@/types";

export const prepareResponse = (statusCode: number, body: HttpResponseBody) => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Access-Control-Allow-Origin, Access-Control-Allow-Methods, Content-Type",
    },
    body: JSON.stringify(body),
  };
};

export const products: Product[] = [
  {
    description: "Short Product Description1",
    id: "7567ec4b-b10c-48c5-9345-fc73c48a80aa",
    price: 24,
    title: "ProductOne",
  },
  {
    description: "Short Product Description7",
    id: "7567ec4b-b10c-48c5-9345-fc73c48a80a1",
    price: 15,
    title: "ProductTitle",
  },
  {
    description: "Short Product Description2",
    id: "7567ec4b-b10c-48c5-9345-fc73c48a80a3",
    price: 23,
    title: "Product",
  },
  {
    description: "Short Product Description4",
    id: "7567ec4b-b10c-48c5-9345-fc73348a80a1",
    price: 15,
    title: "ProductTest",
  },
  {
    description: "Short Product Descriptio1",
    id: "7567ec4b-b10c-48c5-9445-fc73c48a80a2",
    price: 23,
    title: "Product2",
  },
  {
    description: "Short Product Description7",
    id: "7567ec4b-b10c-45c5-9345-fc73c48a80a1",
    price: 15,
    title: "ProductName",
  },
];

export const getProductsList = () => products;

export function generatePutTransact(item: Product, tableName: string, options?: PutTransactOptions): PutTransact<Product>;
export function generatePutTransact(item: Stock, tableName: string, options?: PutTransactOptions): PutTransact<Stock>;
export function generatePutTransact(item: Product | Stock, tableName: string, options?: PutTransactOptions) {
  return {
    Put: {
      TableName: tableName,
      Item: item,
      ...options
    },
  };
};

export class CustomError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const CreateProductDataSchema = z.object({
  title: z.string(),
  description: z.string().default('').optional(),
  price: z.number().min(0).default(0).optional(),
  count: z.number().min(0).default(0).optional(),
});

export type CreateProductData = z.infer<typeof CreateProductDataSchema>;
