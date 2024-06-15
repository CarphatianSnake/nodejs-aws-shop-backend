import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { products as productsData } from "../test/mock/products";

const generatePutRequests = <T>(items: T[]) =>
  items.map((item) => ({
    PutRequest: {
      Item: item
    }
  }));

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const documentClient = DynamoDBDocumentClient.from(client);

const stocksData = productsData.map((product) => ({
  product_id: product.id,
  count: Math.floor(Math.random() * 10) + 1,
}));

const stocks = generatePutRequests(stocksData);
const products = generatePutRequests(productsData);

const batchWriteCommand = new BatchWriteCommand({
  RequestItems: {
    products,
    stocks
  }
})

documentClient.send(batchWriteCommand)
  .then((response) => console.log('\nResponse:', response, '\n\nTables successfully filled!\n'))
  .catch((error) => console.error(error));
