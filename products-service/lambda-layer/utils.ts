import { z } from 'zod';
import type { Product, PutTransact, PutTransactOptions, Stock, HttpResponseBody } from "@/types";

export const prepareResponse = (statusCode: number, body: HttpResponseBody) => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Access-Control-Allow-Origin, Access-Control-Allow-Methods, Content-Type",
    },
    body: JSON.stringify(body),
  };
};

export function generatePutTransact(
  item: Product,
  tableName: string | undefined,
  options?: PutTransactOptions
): PutTransact<Product> | never;
export function generatePutTransact(
  item: Stock,
  tableName: string | undefined,
  options?: PutTransactOptions
): PutTransact<Stock> | never;
export function generatePutTransact(
  item: Product | Stock,
  tableName: string | undefined,
  options?: PutTransactOptions
): PutTransact<Product | Stock> | never {
  if (!tableName) {
    throw new CustomError('Table name is required', 500);
  }

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

export const ProductSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().default('').optional(),
  price: z.number().min(0).default(0).optional(),
  count: z.number().min(0).default(0).optional(),
})

export const CreateProductSchema = ProductSchema.omit({ id: true });

export type ProductData = z.infer<typeof ProductSchema>;
export type CreateProductData = z.infer<typeof CreateProductSchema>;
