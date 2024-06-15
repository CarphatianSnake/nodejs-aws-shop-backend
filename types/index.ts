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

export type HttpResponseBody = HttpErrorMessage | Product | Product[];

export type HttpEventRequest<T = null> = Omit<APIGatewayProxyEvent, 'pathParameters'> & {
  pathParameters: T
}

export type ProductPathParams = {
  productId?: string
};

export type HttpResponse = Promise<APIGatewayProxyResult>;
