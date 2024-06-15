import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchGetCommand, BatchGetCommandInput } from "@aws-sdk/lib-dynamodb";

import { CustomError } from "./CustomError";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const documentClient = DynamoDBDocumentClient.from(client);

export const getProductById = async (productId: string) => {
  try {
    console.log('\nGet product and stock data by product id:');
    console.log({ id: productId });

    const commandInput: BatchGetCommandInput = {
      RequestItems: {
        products: {
          Keys: [
            {
              id: productId
            }
          ]
        },
        stocks: {
          Keys: [
            {
              product_id: productId
            }
          ],
          AttributesToGet: ['count']
        }
      }
    };

    console.log('\nRun batch with input:');
    console.log(commandInput);

    const command = new BatchGetCommand(commandInput);

    const { Responses } = await documentClient.send(command);

    if (!Responses?.products || !Responses?.products.length) {
      throw new CustomError('Product not found!', 404);
    }

    if (!Responses?.stocks || !Responses?.stocks.length) {
      throw new CustomError('Stock not found!', 404);
    }

    const product = {
      ...Responses.products[0],
      ...Responses.stocks[0]
    };

    return product;
  } catch (error) {
    if (error instanceof CustomError && error.statusCode === 404) {
      throw error;
    }
    throw new CustomError('Something went wrong!', 500);
  }
};

// getProductById('7567ec4b-b10c-48c5-9345-fc73348a80a1')
//   .then((product) => {
//     console.log('\nResult:');
//     console.log(product);
//   })
//   .catch((error) => console.error(error));

// getProductById('1')
//   .then((product) => {
//     console.log('\nResult:');
//     console.log(product);
//   })
//   .catch((error) => console.error(error));