import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchExecuteStatementCommand } from "@aws-sdk/lib-dynamodb";

import { CustomError, ProductSchema, createResponse } from '/opt/utils';
import type { HttpEventRequest } from '@/types';

import type { APIGatewayProxyResult } from "aws-lambda";

export const handler = async ({ pathParameters }: HttpEventRequest): Promise<APIGatewayProxyResult> => {
  const { PRODUCTS_TABLE, STOCKS_TABLE } = process.env;

  const response = createResponse(['GET', 'OPTIONS']);

  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const documentClient = DynamoDBDocumentClient.from(client);

  try {
    const id = pathParameters.productId;

    console.log('Checking is id exists...');

    if (!id) {
      throw new CustomError('Product id is required!', 400);
    }

    console.log('Running product batch by id...');

    const productStatement = {
      Statement: `SELECT * FROM "${PRODUCTS_TABLE}" WHERE "id" = '${id}'`
    };

    console.log('Product statement:', productStatement);

    const stockStatement = {
      Statement: `SELECT "count" FROM "${STOCKS_TABLE}" WHERE "product_id" = '${id}'`
    };

    console.log('Stock statement:', stockStatement);

    const batchCommand = new BatchExecuteStatementCommand({
      Statements: [
        productStatement,
        stockStatement,
      ],
    });

    const { Responses } = await documentClient.send(batchCommand);

    const product = Responses?.find((item) => item.TableName === PRODUCTS_TABLE);

    console.log('Checking is product exists...');

    if (!product?.Item?.id) {
      throw new CustomError('Product not found!', 404);
    }

    const stock = Responses?.find((item) => item.TableName === STOCKS_TABLE);

    console.log('Validating product data...');

    const productData = {
      ...product.Item,
      count: stock?.Item?.count || 0,
    };

    console.log('Product data:', productData);

    const result = ProductSchema.required().parse(productData);

    response.statusCode = 200;
    response.body = JSON.stringify(result);
  } catch (error) {
    console.error(error);
    if (error instanceof CustomError) {
      if (error.statusCode === 404) {
        response.statusCode = 404;
        response.body = JSON.stringify({ message: 'Product not found!' });
      }
      if (error.statusCode === 400) {
        response.statusCode = 400;
        response.body = JSON.stringify({ message: 'Product id is required!' });
      }
    }
  }

  console.log('Response:', response);
  return response;
};
