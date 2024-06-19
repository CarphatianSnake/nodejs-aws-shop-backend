import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand, TransactWriteCommandInput } from "@aws-sdk/lib-dynamodb";
import { generateStocksData } from "../utils/generateStocksData";
import { generatePutTransact } from "/opt/utils";
import { products } from "@/test/mock/products";
import { TableNames } from "@/types";

export const fillDdbTables = async () => {
  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const documentClient = DynamoDBDocumentClient.from(client);

  const stocks = generateStocksData();

  const transactInput: TransactWriteCommandInput = {
    TransactItems: [
      ...products.map((item) => generatePutTransact(item, TableNames.Products)),
      ...stocks.map((item) => generatePutTransact(item, TableNames.Stocks)),
    ]
  };

  console.log('\nFill tables with data.');
  console.log('Run transact...');

  const transactWriteCommand = new TransactWriteCommand(transactInput);

  try {
    const response = await documentClient.send(transactWriteCommand);
    console.log('\nResponse:');
    console.log(response);
    console.log('\nTables successfully filled!\n');
  } catch (error) {
    console.log(error);
  }
};
