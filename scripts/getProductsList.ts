import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";

import { CustomError } from "./CustomError";
import { error } from "console";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const documentClient = DynamoDBDocumentClient.from(client);

const getProductsList = async () => {
  try {
    const { Count, Items } = await documentClient.send(
      new ScanCommand({
        TableName: "products",
        ConsistentRead: true,
        AttributesToGet: ['id'],
      })
    );

    if (!Count || !Items) {
      throw new CustomError('Products not found!', 404);
    }

    const batchResult = await documentClient.send(
      new BatchGetCommand({
        RequestItems: {
          products: {
            Keys: Items.map((product) => ({
              id: product.id
            }))
          },
          stocks: {
            Keys: Items.map((product) => ({
              product_id: product.id
            }))
          }
        }
      })
    );

    if (!batchResult.Responses) {
      throw new CustomError('Products not found!', 404);
    }

    const { stocks, products } = batchResult.Responses;

    const productsList = products.map((prod) => {
      const stock = stocks.find((stock) => stock.product_id === prod.id);

      return {
        ...prod,
        count: stock?.count || 0
      }
    });

    return productsList;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Something went wrong', 500);
  }
};

getProductsList()
  .then((data) => console.log(data))
  .catch((error) => console.error(error));
