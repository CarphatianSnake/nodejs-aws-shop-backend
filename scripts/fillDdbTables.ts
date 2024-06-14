import { DynamoDBClient, BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { products as productsData } from "../test/mock/products";
import type { Stock, PutRequestObject } from "../types";

const generatePutRequests = <T>(items: T[]): PutRequestObject[] =>
  items.map((item) => ({
    PutRequest: {
      Item: marshall({
        ...item
      })
    }
  }));

const generateStocks = (): Stock[] => productsData.map((product) => ({
  product_id: product.id,
  count: Math.floor(Math.random() * 10) + 1,
}));

const fillTables = async () => {
  try {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    const documentClient = DynamoDBDocumentClient.from(client);

    const stocksData = generateStocks();
    const stocks = generatePutRequests(stocksData);
    const products = generatePutRequests(productsData);

    const batchWriteCommand = new BatchWriteItemCommand({
      RequestItems: {
        products,
        stocks
      }
    });

    const response = await documentClient.send(batchWriteCommand);

    console.log('\nResponse:', response, '\n\nTables successfully filled!\n');
  } catch (error) {
    console.error('Error:', error);
  }
};

fillTables();
