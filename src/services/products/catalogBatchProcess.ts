import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { ProductSchema, transactProduct } from "/opt/utils";
import type { SQSEvent } from "aws-lambda";

export const handler = async ({ Records }: SQSEvent): Promise<void> => {
  const { AWS_REGION, SNS_ARN, PRODUCTS_TABLE, STOCKS_TABLE } = process.env;
  const snsClient = new SNSClient({ region: AWS_REGION });

  for (const { body } of Records) {
    const data = JSON.parse(body);

    try {
      console.log('Validating data...');

      const product = ProductSchema.required().parse({
        id: uuidv4(),
        ...data,
      });

      await transactProduct({
        product,
        region: AWS_REGION,
        tables: {
          PRODUCTS_TABLE,
          STOCKS_TABLE,
        }
      });

      console.log('Sending SNS message...');

      const publishCommand = new PublishCommand({
        Subject: 'Product successfully added',
        Message: JSON.stringify(product),
        TopicArn: SNS_ARN,
        MessageAttributes: {
          price: {
            DataType: 'Number',
            StringValue: product.price.toString(),
          },
        },
      });

      const response = await snsClient.send(publishCommand);

      console.log('Message sent', response.MessageId);
      console.log('Message data', product);

    } catch (error) {
      console.error(error);

      const publishCommand = new PublishCommand({
        Subject: 'Failed to add product',
        Message: '',
        TopicArn: SNS_ARN,
      });

      if (error instanceof z.ZodError) {
        publishCommand.input.Message = JSON.stringify({
          ...data,
          errors: error.errors,
        });
      }

      publishCommand.input.Message = JSON.stringify({ ...data, error });

      const response = await snsClient.send(publishCommand);

      console.log('Message sent', response.MessageId);
      console.log(error);
    }
  }
};
