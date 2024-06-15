import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, BatchGetCommand, BatchGetCommandInput, ScanCommandInput } from "@aws-sdk/lib-dynamodb";

import { CustomError } from "./CustomError";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const documentClient = DynamoDBDocumentClient.from(client);

const getProductsList = async () => {
  try {
    console.log('\nGet products list');

    const scanInput: ScanCommandInput = {
      TableName: "products",
      ConsistentRead: true,
    };

    console.log('\nRun products scan with input:');
    console.log(scanInput);

    const scanCommand = new ScanCommand(scanInput);

    const { Count, Items } = await documentClient.send(scanCommand);

    if (!Count || !Items) {
      throw new CustomError('Products not found!', 404);
    }

    const batchInput: BatchGetCommandInput = {
      RequestItems: {
        stocks: {
          Keys: Items.map((product) => ({
            product_id: product.id
          }))
        }
      }
    };

    console.log('\nRun stocks batch with input:');
    console.log(batchInput);

    const batchCommand = new BatchGetCommand(batchInput);

    const batchResult = await documentClient.send(batchCommand);

    if (!batchResult.Responses) {
      throw new CustomError('Stocks not found!', 404);
    }

    const { stocks } = batchResult.Responses;

    if (!stocks || !stocks.length) {
      throw new CustomError('Stocks not found!', 404);
    }

    const productsList = Items.map((prod) => {
      const stock = stocks.find((stock) => stock.product_id === prod.id);

      return {
        ...prod,
        count: stock?.count || 0,
      }
    });

    return productsList;
  } catch (error) {
    if (error instanceof CustomError && error.statusCode === 404) {
      throw error;
    }
    throw new CustomError('Something went wrong', 500);
  }
};

getProductsList()
  .then((data) => {
    console.log('\nResult:');
    console.log(data);
  })
  .catch((error) => console.error(error));
