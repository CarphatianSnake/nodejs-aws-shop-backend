import { CustomError } from "/opt/utils";
import type { Product, PutTransact, PutTransactOptions, Stock } from "@/types";


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