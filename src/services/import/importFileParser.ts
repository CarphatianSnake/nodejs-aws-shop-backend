import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import csv = require('csv-parser');
import { CustomError, createResponse } from "/opt/utils";
import type { APIGatewayProxyResult, S3Event } from "aws-lambda";
import type { NodeJsClient } from "@smithy/types";

type IData = {
  [x: string]: string;
}

export const handler = async (event: S3Event): Promise<APIGatewayProxyResult> => {
  const { BUCKET, REGION } = process.env;
  const response = createResponse(['GET', 'OPTIONS']);

  try {
    const key = event.Records[0].s3.object.key;
    const client = new S3Client({ region: REGION }) as NodeJsClient<S3Client>;
    const input = {
      Bucket: BUCKET,
      Key: key,
    };
    const data: IData[] = [];

    console.log('Getting object stream from bucket...');

    const getCommand = new GetObjectCommand(input);
    const output = await client.send(getCommand);

    await new Promise((resolve, reject) => {
      if (!output.Body) return reject(new CustomError('No data', 404));

      output.Body
        .pipe(csv())
        .on('data', (chunk: IData) => {
          console.log(chunk);
          data.push(chunk);
        })
        .on('end', async () => {
          console.log('Uploaded file successfully parsed!');

          console.log('Data:', data);
          return resolve(null);
        })
        .on('error', reject);
    });

    console.log('Moving parsed file...');

    const source = await client.send(getCommand);

    const upload = new Upload({
      client,
      params: {
        Bucket: BUCKET,
        Key: key.replace('uploaded', 'parsed'),
        Body: source.Body,
      },
    });

    await upload.done();

    console.log('Parsed file copied from /uploaded to /parsed folder.');

    const deleteCommand = new DeleteObjectCommand(input);
    await client.send(deleteCommand);

    console.log('Parsed file deleted from /uploaded folder.');

    response.statusCode = 200;
    response.body = JSON.stringify(data);

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
