import type { Put } from "@aws-sdk/client-dynamodb";
import type { NativeAttributeValue } from "@aws-sdk/util-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

type HttpErrorMessage = {
  message: string;
};

export type Product = {
  id: string;
  description: string;
  price: number;
  title: string;
};

export type Stock = {
  product_id: string;
  count: number;
};

export type HttpResponseBody = HttpErrorMessage | Product | Product[];

export type HttpEventRequest<T = null> = Omit<APIGatewayProxyEvent, 'pathParameters'> & {
  pathParameters: T
}

export type ProductPathParams = {
  productId?: string
};

export type HttpResponse = Promise<APIGatewayProxyResult>;

export enum TableNames {
  Products = 'products',
  Stocks = 'stocks',
}

export type PutTransactOptions = Omit<Put, "Item" | "ExpressionAttributeValues" | "TableName">;

export type PutTransact<T extends Product | Stock> = {
  Put: PutTransactOptions & {
    Item: T;
    TableName: TableNames;
    ExpressionAttributeValues?: Record<string, NativeAttributeValue>;
  };
};
