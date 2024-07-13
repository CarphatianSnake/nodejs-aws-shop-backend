import { DynamoDBClient, ExecuteTransactionCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';
import type { TransactProps } from '@/types';

export const createResponse = (
  methods: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS')[],
  headers?: { [x: string]: string }
) => ({
  statusCode: 500,
  headers: {
    "Access-Control-Allow-Origin": "https://d3ffym298mm09d.cloudfront.net, http://localhost:3000",
    "Access-Control-Allow-Headers": "Authorization, Access-Control-Allow-Origin, Access-Control-Allow-Methods, Content-Type",
    "Access-Control-Allow-Methods": `${methods.join(', ')}`,
    "Content-Type": "application/json",
    ...headers,
  },
  body: JSON.stringify({ message: 'Something went wrong!' })
});

export class CustomError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const ProductSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().default('').optional(),
  price: z.coerce.number().nonnegative().safe().default(0).optional(),
  count: z.coerce.number().nonnegative().safe().default(0).optional(),
});

export const transactProduct = async ({ product, region, tables }: TransactProps): Promise<void> => {
  const client = new DynamoDBClient({ region });
  const documentClient = DynamoDBDocumentClient.from(client);

  console.log('Run transact...');

  const productStatement = {
    Statement: `INSERT INTO "${tables.PRODUCTS_TABLE}" VALUE {
      'id': '${product.id}',
      'title': '${product.title.replace(/'/g, "''")}',
      'description': '${product.description?.replace(/'/g, "''")}',
      'price': ${product.price}
    }`,
  };

  console.log('Product statement:', productStatement);

  const stockStatement = {
    Statement: `INSERT INTO "${tables.STOCKS_TABLE}" VALUE {
      'product_id': '${product.id}',
      'count': ${product.count}
    }`,
  };

  console.log('Stock statement:', stockStatement);

  await documentClient.send(new ExecuteTransactionCommand({
    TransactStatements: [
      productStatement,
      stockStatement,
    ],
  }));

  console.log('Product successfully added!');
};