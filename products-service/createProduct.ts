import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, TransactWriteCommand, TransactWriteCommandInput } from '@aws-sdk/lib-dynamodb';

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { TableNames, type HttpResponse } from '@/types';

import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prepareResponse, generatePutTransact, CustomError, CreateProductDataSchema } from '/opt/utils';

export const handler = async ({ body }: APIGatewayProxyEvent): HttpResponse => {
  if (!body) {
    throw new CustomError('Invalid product data!', 400);
  }

  const data = JSON.parse(body);

  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const documentClient = DynamoDBDocumentClient.from(client);

  try {
    console.log('Validate data...');
    console.log(data);
    const { title, description, price, count } = CreateProductDataSchema.required().parse(data);

    console.log('Validated data:', { title, description, price, count })

    const product = {
      id: uuidv4(),
      title,
      description,
      price,
    };

    const stock = {
      product_id: product.id,
      count,
    };

    console.log('\nFill tables with data');
    console.log('\nProduct:');
    console.log(product);
    console.log('\nStock:');
    console.log(stock);

    const productTrasact = generatePutTransact(product, TableNames.Products);
    const stockTrasact = generatePutTransact(stock, TableNames.Stocks);

    const transactInput: TransactWriteCommandInput = {
      TransactItems: [
        productTrasact,
        stockTrasact,
      ]
    };

    console.log('Run transact...');

    const transactWriteCommand = new TransactWriteCommand(transactInput);

    await documentClient.send(transactWriteCommand);

    console.log('\nProduct successfully added!\n');

    return prepareResponse(201, { message: `Product with id=${product.id} created!` });
  } catch (error) {
    if (error instanceof ZodError) {
      return prepareResponse(400, { message: 'Invalid product data!' });
    }
    return prepareResponse(500, { message: 'Something went wrong!' });
  }
};
