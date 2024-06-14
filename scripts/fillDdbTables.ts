import { AttributeValue, DynamoDBClient, BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { products } from "../test/mock/products";

type Stock = {
  product_id: string;
  count: number;
};

type PutRequestObject = {
  PutRequest: {
    Item: Record<string, AttributeValue>;
  };
}

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const documentClient = DynamoDBDocumentClient.from(client);

const generatePutRequests = <T>(items: T[], tableName: string): PutRequestObject[] => {
  return items.map((item) => {
    return {
      PutRequest: {
        Item: marshall({
          ...item
        })
      }
    }
  });
};

const fillTables = async () => {
  const stocks: Stock[] = products.map((product) => ({
    product_id: product.id,
    count: Math.floor(Math.random() * 10) + 1,
  }));

  const batchWriteCommand = new BatchWriteItemCommand({
    RequestItems: {
      'products': generatePutRequests(products, 'products'),
      'stocks': generatePutRequests(stocks, 'stocks')
    }
  });

  try {
    const response = await documentClient.send(batchWriteCommand);
    console.log('\nResponse:', response, '\n\nTables successfully filled!\n');
  } catch (error) {
    console.error('Error:', error);
  }
};

fillTables();