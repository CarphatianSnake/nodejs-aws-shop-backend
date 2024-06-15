import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { products as productsData } from "../test/mock/products";

const genetateTransactions = <T>(items: T[], tableName: string) => {
  return items.map((item) => {
    return {
      Put: {
        TableName: tableName,
        Item: item
      }
    }
  })
};

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const documentClient = DynamoDBDocumentClient.from(client);

const stocksData = productsData.map((product) => ({
  product_id: product.id,
  count: Math.floor(Math.random() * 10) + 1,
}));

const transactWriteCommand = new TransactWriteCommand({
  TransactItems: [
    ...genetateTransactions(productsData, 'products'),
    ...genetateTransactions(stocksData, 'stocks'),
  ]
});

console.log('\nRequest to fill tables with data:\nProducts data:\n', productsData, '\nStocks data:\n', stocksData);

documentClient.send(transactWriteCommand)
  .then((response) => console.log('\nResponse:', response, '\n\nTables successfully filled!\n'))
  .catch((error) => console.error(error));
