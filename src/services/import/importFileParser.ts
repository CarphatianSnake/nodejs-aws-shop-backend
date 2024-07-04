import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Upload } from "@aws-sdk/lib-storage";
import csv = require('csv-parser');
import { CustomError, createResponse } from "/opt/utils";
import type { APIGatewayProxyResult, S3Event } from "aws-lambda";
import type { NodeJsClient } from "@smithy/types";

type IData = {
  [x: string]: string;
}

export const handler = async (event: S3Event): Promise<APIGatewayProxyResult> => {
  const { S3_BUCKET, REGION, SQS_IMPORT_URL } = process.env;
  const response = createResponse(['GET', 'OPTIONS']);

  try {
    const key = event.Records[0].s3.object.key;
    const s3Client = new S3Client({ region: REGION }) as NodeJsClient<S3Client>;
    const sqsClient = new SQSClient({ region: REGION });
    const input = {
      Bucket: S3_BUCKET,
      Key: key,
    };

    console.log('Getting object stream from bucket...');

    const getCommand = new GetObjectCommand(input);
    const output = await s3Client.send(getCommand);

    await new Promise((resolve, reject) => {
      if (!output.Body) return reject(new CustomError('No data', 404));

      output.Body
        .pipe(csv())
        .on('data', async (chunk: IData) => {
          const message = await sqsClient.send(new SendMessageCommand({
            QueueUrl: SQS_IMPORT_URL,
            MessageBody: JSON.stringify(chunk),
          }));

          console.log('Message sent to the queue', message.MessageId);
        })
        .on('end', async () => {
          console.log('Uploaded file successfully parsed!');
          return resolve(null);
        })
        .on('error', reject);
    });

    console.log('Moving parsed file...');

    const source = await s3Client.send(getCommand);

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: S3_BUCKET,
        Key: key.replace('uploaded', 'parsed'),
        Body: source.Body,
      },
    });

    await upload.done();

    console.log('Parsed file copied from /uploaded to /parsed folder.');

    const deleteCommand = new DeleteObjectCommand(input);
    await s3Client.send(deleteCommand);

    console.log('Parsed file deleted from /uploaded folder.');

    response.statusCode = 200;
    response.body = JSON.stringify({ message: 'File parsed successfully!' });

    return response;
  } catch (error) {
    console.error(error);

    if (error instanceof CustomError) {
      response.statusCode = error.statusCode;
      response.body = JSON.stringify({ message: error.message });
    }

    return response;
  }
};
