import { S3Client, GetObjectCommand, type GetObjectRequest } from "@aws-sdk/client-s3";
import csv = require('csv-parser');
import type { S3Event } from "aws-lambda";
import type { NodeJsClient } from "@smithy/types";

type IData = {
  [x: string]: string;
}

export const handler = async (event: S3Event): Promise<IData[] | void> => {
  try {
    const key = event.Records[0].s3.object.key;
    const client = new S3Client({ region: process.env.REGION }) as NodeJsClient<S3Client>;
    const input: GetObjectRequest = {
      Bucket: process.env.BUCKET,
      Key: key,
    };
    const command = new GetObjectCommand(input);
    const output = await client.send(command);
    const data: IData[] = [];

    await new Promise((resolve, reject) => {
      if (!output.Body) return reject(new Error('No data'));

      output.Body.pipe(csv())
        .on('data', (chunk: IData) => {
          console.log(chunk);
          data.push(chunk);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log('Data:', data);
    return data;
  } catch (error) {
    console.error(error);
  }
};
