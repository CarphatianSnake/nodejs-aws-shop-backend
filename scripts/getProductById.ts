import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchGetCommand } from "@aws-sdk/lib-dynamodb";

import { CustomError } from "./CustomError";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const documentClient = DynamoDBDocumentClient.from(client);

const getProductById = async (productId: string) => {
  try {
    const { Responses } = await documentClient.send(
      new BatchGetCommand({
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
      })
    );

    if (!Responses?.products || !Responses?.products.length) {
      throw new CustomError('Product not found!', 404);
    }

    const product = {
      ...Responses.products[0],
      ...Responses.stocks[0]
    };

    return product;
  } catch (error: any) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Something went wrong', 500);
  }
};

getProductById('7567ec4b-b10c-48c5-9345-fc73348a80a1')
  .then((product) => console.log(product))
  .catch((error) => console.error(error));