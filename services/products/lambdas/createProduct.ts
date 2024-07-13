import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { CustomError, ProductSchema, createResponse, transactProduct } from '/opt/utils';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async ({ body }: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { PRODUCTS_TABLE, STOCKS_TABLE, AWS_REGION } = process.env;

  const response = createResponse(['POST', 'OPTIONS']);

  try {
    console.log('Checking is data exists...');

    if (!body) {
      throw new CustomError('Invalid product data!', 400);
    }

    const data = JSON.parse(body);

    console.log('Validating data...');
    console.log(data);

    const product = ProductSchema.required().parse({
      id: uuidv4(),
      ...data
    });

    await transactProduct({
      product,
      region: AWS_REGION,
      tables: {
        PRODUCTS_TABLE,
        STOCKS_TABLE,
      }
    });

    response.statusCode = 201;
    response.body = JSON.stringify(product);
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
