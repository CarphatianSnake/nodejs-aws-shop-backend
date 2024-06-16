import type { Product, PutTransact, PutTransactOptions, Stock, TableNames } from "@/types";

export function generatePutTransact(item: Product, tableName: TableNames.Products, options?: PutTransactOptions): PutTransact<Product>;
export function generatePutTransact(item: Stock, tableName: TableNames.Stocks, options?: PutTransactOptions): PutTransact<Stock>;
export function generatePutTransact(item: Product | Stock, tableName: TableNames, options?: PutTransactOptions) {
  return {
    Put: {
      TableName: tableName,
      Item: item,
      ...options
    },
  };
};
