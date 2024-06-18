import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchExecuteStatementCommand } from "@aws-sdk/lib-dynamodb";

import { CustomError, ProductSchema, prepareResponse } from '/opt/utils-layer/utils';
import type { HttpEventRequest } from '@/types';

import type { APIGatewayProxyResult } from "aws-lambda";

export const handler = async ({ pathParameters }: HttpEventRequest): Promise<APIGatewayProxyResult> => {
  try {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    const documentClient = DynamoDBDocumentClient.from(client);

    const { PRODUCTS_TABLE, STOCKS_TABLE } = process.env;
    const id = pathParameters.productId;

    if (!id) {
      throw new CustomError('Product id is required!', 400);
    }

    console.log('Running products batch by id');
    console.log({ id });

    const batchCommand = new BatchExecuteStatementCommand({
      Statements: [
        {
          Statement: `SELECT * FROM "${PRODUCTS_TABLE}" WHERE "id" = '${id}'`
        },
        {
          Statement: `SELECT "count" FROM "${STOCKS_TABLE}" WHERE "product_id" = '${id}'`
        },
      ],
    });

    const { Responses } = await documentClient.send(batchCommand);

    const product = Responses?.find((item) => item.TableName === PRODUCTS_TABLE);

    console.log('Checking is product exists...');

    if (!product?.Item?.id) {
      throw new CustomError('Product not found!', 404);
    }

    const stock = Responses?.find((item) => item.TableName === STOCKS_TABLE);

    const result = ProductSchema.required().parse({
      ...product.Item,
      count: stock?.Item?.count || 0,
    });

    console.log(result);

    return prepareResponse(200, result);
  } catch (error) {
    console.error(error);
    if (error instanceof CustomError) {
      if (error.statusCode === 404) {
        return prepareResponse(404, { message: 'Product not found!' });
      }
      if (error.statusCode === 400) {
        return prepareResponse(400, { message: 'Product id is required!' });
      }
    }
    return prepareResponse(500, { message: 'Something went wrong!' });
  }
};
