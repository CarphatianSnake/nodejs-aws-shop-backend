import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchExecuteStatementCommand, ExecuteStatementCommand } from "@aws-sdk/lib-dynamodb";

import { z } from 'zod';
import { CustomError, ProductSchema, prepareResponse } from "/opt/utils";

import type { APIGatewayProxyResult } from "aws-lambda";

export const handler = async (): Promise<APIGatewayProxyResult> => {
  try {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    const documentClient = DynamoDBDocumentClient.from(client);

    const { PRODUCTS_TABLE, STOCKS_TABLE } = process.env;

    console.log('Running products scan...');

    const scanCommand = new ExecuteStatementCommand({
      Statement: `SELECT * FROM "${PRODUCTS_TABLE}"`,
    });

    const scanResult = await documentClient.send(scanCommand);

    if (!scanResult.Items || !scanResult.Items.length) {
      throw new CustomError('Products not found!', 404);
    }

    console.log('Validating recieved products data...');

    const products = z.array(ProductSchema.required().omit({ count: true })).parse(scanResult.Items);

    console.log('Running stocks batch...');

    const batchCommand = new BatchExecuteStatementCommand({
      Statements: products.map((product) => ({
        Statement: `SELECT * FROM "${STOCKS_TABLE}" WHERE "product_id" = '${product.id}'`,
      })),
    });

    const { Responses } = await documentClient.send(batchCommand);

    if (!Responses || !Responses.length) {
      throw new CustomError('Stocks not found!', 404);
    }

    const productsList = products.map((product) => {
      const stock = Responses.find((stock) => stock.Item?.product_id === product.id);

      return {
        ...product,
        count: stock?.Item?.count || 0,
      }
    });

    console.log('Products recieved');
    console.log(productsList);

    return prepareResponse(200, productsList);
  } catch (error) {
    console.error(error);
    if (error instanceof CustomError) {
      return prepareResponse(404, { message: error.message });
    }

    return prepareResponse(500, { message: 'Something went wrong!' });
  }
};
