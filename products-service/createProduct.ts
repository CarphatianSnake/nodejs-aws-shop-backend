import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ExecuteTransactionCommand } from '@aws-sdk/lib-dynamodb';

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { v4 as uuidv4 } from 'uuid';
import { prepareResponse, CustomError, ProductSchema } from '/opt/utils';

import { z } from 'zod';

export const handler = async ({ body }: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const documentClient = DynamoDBDocumentClient.from(client);

  const { PRODUCTS_TABLE, STOCKS_TABLE } = process.env;

  try {
    console.log('Check is data exists...');

    if (!body) {
      throw new CustomError('Invalid product data!', 400);
    }

    const data = JSON.parse(body);

    console.log('Validate data...');
    console.log(data);

    const { title, description, price, count } = ProductSchema.omit({ id: true }).required().parse(data);

    console.log('Validated data:', { title, description, price, count });

    const id = uuidv4();

    console.log('Run transact with validated data...');

    const command = new ExecuteTransactionCommand({
      TransactStatements: [
        {
          Statement: `INSERT INTO "${PRODUCTS_TABLE}" VALUE {
            'id': '${id}',
            'title': '${title}',
            'description': '${description}',
            'price': ${price}
          }`,
        },
        {
          Statement: `INSERT INTO "${STOCKS_TABLE}" VALUE {
            'product_id': '${id}',
            'count': ${count}
          }`,
        },
      ],
    });

    const result = await documentClient.send(command);

    console.log('\nProduct successfully added!\n');
    console.log(result);

    return prepareResponse(201, { id, title, description, price, count });
  } catch (error) {
    console.error(error);

    const isCustomError = error instanceof CustomError;
    const isZodError = error instanceof z.ZodError;

    if (isCustomError || isZodError) {
      return prepareResponse(400, { message: 'Invalid product data!' });
    }

    return prepareResponse(500, { message: 'Something went wrong!' });
  }
};
