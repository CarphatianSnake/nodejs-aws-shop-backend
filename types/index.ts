import type { AttributeValue } from "@aws-sdk/client-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export type CustomError = {
  message: string;
};

export type Product = {
  id: string;
  description: string;
  price: number;
  title: string;
};

export type HttpResponseBody = CustomError | Product | Product[];

export type HttpEventRequest<T = null> = Omit<APIGatewayProxyEvent, 'pathParameters'> & {
  pathParameters: T
}

export type ProductPathParams = {
  productId?: string
};

export type HttpResponse = Promise<APIGatewayProxyResult>;

export type Stock = {
  product_id: string;
  count: number;
};

export type PutRequestObject = {
  PutRequest: {
    Item: Record<string, AttributeValue>;
  };
}
