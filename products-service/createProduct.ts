import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ExecuteTransactionCommand } from '@aws-sdk/lib-dynamodb';

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prepareResponse, CustomError, ProductSchema } from '/opt/utils';

export const handler = async ({ body }: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const documentClient = DynamoDBDocumentClient.from(client);

  const { PRODUCTS_TABLE, STOCKS_TABLE } = process.env;

  try {
    console.log('Checking is data exists...');

    if (!body) {
      throw new CustomError('Invalid product data!', 400);
    }

    const data = JSON.parse(body);

    console.log('Validating data...');
    console.log(data);

    const { title, description, price, count } = ProductSchema.omit({ id: true }).required().parse(data);

    console.log('Validated data:', { title, description, price, count });

    console.log('Generating id for a new product...');

    const id = uuidv4();

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

    const response = prepareResponse(201, { id, title, description, price, count });

    console.log('Response:', response);

    return response;
  } catch (error) {
    console.error(error);

    const isCustomError = error instanceof CustomError;
    const isZodError = error instanceof z.ZodError;

    if (isCustomError || isZodError) {
      const response = prepareResponse(400, { message: 'Invalid product data!' });
      console.log(response);
      return response;
    }

    const response = prepareResponse(500, { message: 'Something went wrong!' });
    console.log(response);
    return response;
  }
};
