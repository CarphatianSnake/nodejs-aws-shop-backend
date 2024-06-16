import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand, TransactWriteCommandInput } from "@aws-sdk/lib-dynamodb";
import { ZodError } from "zod";
import { v4 as uuidv4 } from 'uuid';

import { CustomError } from "./CustomError";
import { ProductDataSchema, ProductData } from '@/schemas';
import { generatePutTransact } from "./generatePutTransact";
import { TableNames } from "@/types";

export const createProduct = async (data: ProductData) => {
  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const documentClient = DynamoDBDocumentClient.from(client);

  try {
    console.log('Validate data...');
    console.log(data);
    const { title, description, price, count } = ProductDataSchema.required().parse(data);

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
  } catch (error) {
    if (error instanceof ZodError) {
      throw new CustomError('Invalid product data!', 400);
    }
    throw new CustomError('Something went wrong!', 500);
  }
};

// createProduct({
//   title: 'Response Test',
// });
