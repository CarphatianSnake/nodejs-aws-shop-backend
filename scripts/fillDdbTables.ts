import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand, TransactWriteCommandInput } from "@aws-sdk/lib-dynamodb";
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

const transactInput: TransactWriteCommandInput = {
  TransactItems: [
    ...genetateTransactions(productsData, 'products'),
    ...genetateTransactions(stocksData, 'stocks'),
  ]
};

console.log('\nFill tables with data.');
console.log('Run transact...');

const transactWriteCommand = new TransactWriteCommand(transactInput);

documentClient.send(transactWriteCommand)
  .then((response) => {
    console.log('\nResponse:');
    console.log(response);
    console.log('\nTables successfully filled!\n')
  })
  .catch((error) => console.error(error));
