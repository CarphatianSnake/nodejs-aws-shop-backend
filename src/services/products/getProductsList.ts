import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchExecuteStatementCommand, ExecuteStatementCommand } from "@aws-sdk/lib-dynamodb";

import { z } from 'zod';
import { CustomError, ProductSchema, createResponse } from "/opt/utils";

import type { APIGatewayProxyResult } from "aws-lambda";

export const handler = async (): Promise<APIGatewayProxyResult> => {
  const { PRODUCTS_TABLE, STOCKS_TABLE } = process.env;
  const LIMIT = 12;

  const response = createResponse(['GET', 'OPTIONS']);

  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const documentClient = DynamoDBDocumentClient.from(client);

  try {
    console.log('Running products scan...');

    const scanStatement = `SELECT * FROM "${PRODUCTS_TABLE}"`;
    console.log('Scan statement:', { Statement: scanStatement });
    console.log('Scan limit:', { Limit: LIMIT });

    const scanCommand = new ExecuteStatementCommand({
      Statement: scanStatement,
      Limit: LIMIT,
    });

    const scanResult = await documentClient.send(scanCommand);

    if (!scanResult.Items?.length) {
      throw new CustomError('Products not found!', 404);
    }

    console.log('Validating recieved products data...');
    console.log('Recieved data:', scanResult.Items);

    const products = z.array(ProductSchema.required().omit({ count: true })).parse(scanResult.Items);

    console.log('Running stocks batch...');

    const batchStatements = products.map((product) => ({
      Statement: `SELECT * FROM "${STOCKS_TABLE}" WHERE "product_id" = '${product.id}'`,
    }));

    console.log('Batch statements:', batchStatements);

    const batchCommand = new BatchExecuteStatementCommand({
      Statements: batchStatements,
    });

    const { Responses } = await documentClient.send(batchCommand);

    const productsList = products.map((product) => {
      const stock = Responses?.find((stock) => stock.Item?.product_id === product.id);
      const count = typeof stock?.Item?.count === "number" ? stock.Item.count : 0;

      return {
        ...product,
        count,
      }
    });

    console.log('Products recieved!');

    response.statusCode = 200;
    response.body = JSON.stringify(productsList);
  } catch (error) {
    console.error(error);
    if (error instanceof CustomError) {
      response.statusCode = 404;
      response.body = JSON.stringify({ message: 'Products not found!' });
    }
  }

  console.log('Response:', response);
  return response;
};
