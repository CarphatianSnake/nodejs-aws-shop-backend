import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ExecuteTransactionCommand } from '@aws-sdk/lib-dynamodb';

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { CustomError, ProductSchema, createResponse } from '/opt/utils';

export const handler = async ({ body }: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { PRODUCTS_TABLE, STOCKS_TABLE, AWS_REGION } = process.env;

  const response = createResponse(['POST', 'OPTIONS']);

  const client = new DynamoDBClient({ region: AWS_REGION });
  const documentClient = DynamoDBDocumentClient.from(client);

  try {
    console.log('Checking is data exists...');

    if (!body) {
      throw new CustomError('Invalid product data!', 400);
    }

    const data = JSON.parse(body);

    console.log('Validating data...');
    console.log(data);

    console.log('Generating id for a new product...');

    const id = uuidv4();

    const { title, description, price, count } = ProductSchema.required().parse({
      id,
      ...data
    });

    console.log('Validated data:', { title, description, price, count });

    console.log('Product id:', { id });

    console.log('Run transact with statements...');

    const productStatement = {
      Statement: `INSERT INTO "${PRODUCTS_TABLE}" VALUE {
        'id': '${id}',
        'title': '${title}',
        'description': '${description}',
        'price': ${price}
      }`,
    };

    console.log('Product statement:', productStatement);

    const stockStatement = {
      Statement: `INSERT INTO "${STOCKS_TABLE}" VALUE {
        'product_id': '${id}',
        'count': ${count}
      }`,
    };

    console.log('Stock statement:', stockStatement);

    const command = new ExecuteTransactionCommand({
      TransactStatements: [
        productStatement,
        stockStatement,
      ],
    });

    await documentClient.send(command);

    console.log('\nProduct successfully added!\n');

    response.statusCode = 201;
    response.body = JSON.stringify({ id, title, description, price, count });
  } catch (error) {
    console.error(error);

    const isCustomError = error instanceof CustomError;
    const isZodError = error instanceof z.ZodError;

    if (isCustomError || isZodError) {
      response.statusCode = 400;
      response.body = JSON.stringify({ message: 'Invalid product data!' });
    }
  }

  console.log('Response:', response);
  return response;
};
