import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ExecuteTransactionCommand } from '@aws-sdk/lib-dynamodb';
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { ProductSchema } from "/opt/utils";
import type { SQSEvent } from "aws-lambda";

export const handler = async ({ Records }: SQSEvent): Promise<void> => {
  const { AWS_REGION, SNS_ARN, PRODUCTS_TABLE, STOCKS_TABLE } = process.env
  const snsClient = new SNSClient({ region: AWS_REGION });
  const client = new DynamoDBClient({ region: AWS_REGION });
  const documentClient = DynamoDBDocumentClient.from(client);

  for (const record of Records) {
    const { body } = record;
    const data = JSON.parse(body);

    try {
      console.log('Validating data...');

      const id = uuidv4();

      const product = ProductSchema.parse({
        id,
        ...data,
      });

      console.log('Run transact...');

      const productStatement = {
        Statement: `INSERT INTO "${PRODUCTS_TABLE}" VALUE {
          'id': '${id}',
          'title': '${product.title}',
          'description': '${product.description}',
          'price': ${product.price}
        }`,
      };

      const stockStatement = {
        Statement: `INSERT INTO "${STOCKS_TABLE}" VALUE {
          'product_id': '${id}',
          'count': ${product.count}
        }`,
      };

      await documentClient.send(new ExecuteTransactionCommand({
        TransactStatements: [
          productStatement,
          stockStatement,
        ],
      }));

      console.log('Product successfully added to DynamoDB');

      console.log('Sending SNS message...');

      const publishCommand = new PublishCommand({
        Message: JSON.stringify(product),
        TopicArn: SNS_ARN,
        Subject: 'Product successfully added',
        MessageAttributes: {
          status: {
            DataType: 'String',
            StringValue: 'success',
          },
        },
      });

      const response = await snsClient.send(publishCommand);

      console.log('Message was', response.MessageId);
      console.log('Message data', product);

    } catch (error) {
      console.error(error);

      const publishCommand = new PublishCommand({
        Message: '',
        MessageAttributes: {
          status: {
            DataType: 'String',
            StringValue: 'error',
          },
        },
        TopicArn: SNS_ARN,
        Subject: 'Failed to add product',
      });

      if (error instanceof z.ZodError) {
        publishCommand.input.Message = JSON.stringify({
          data,
          errors: error.errors,
        });
      }

      publishCommand.input.Message = JSON.stringify({ data, error });

      const response = await snsClient.send(publishCommand);

      console.log('Message was sent', response.MessageId);
      console.log('Error', error);
    }
  }
}