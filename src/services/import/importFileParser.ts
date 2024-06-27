import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import csv = require('csv-parser');
import type { S3Event } from "aws-lambda";
import type { NodeJsClient } from "@smithy/types";

type IData = {
  [x: string]: string;
}

export const handler = async (event: S3Event): Promise<IData[] | void> => {
  const { BUCKET, REGION } = process.env;

  try {
    const key = event.Records[0].s3.object.key;
    const client = new S3Client({ region: REGION }) as NodeJsClient<S3Client>;
    const input = {
      Bucket: BUCKET,
      Key: key,
    };
    const data: IData[] = []
    const command = new GetObjectCommand(input);
    const output = await client.send(command);

    await new Promise((resolve, reject) => {
      if (!output.Body) return reject(new Error('No data'));

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

    const upload = new Upload({
      client,
      params: {
        Bucket: BUCKET,
        Key: `parsed/${key.replace('uploaded/', '')}`,
        Body: output.Body,
      },
    });

    await upload.done();

    console.log('Parsed file copied from /uploaded to /parsed folder.');

    const deleteCommand = new DeleteObjectCommand(input);
    await client.send(deleteCommand);

    console.log('Parsed file deleted from /uploaded folder.');
  } catch (error) {
    console.error(error);
  }
};
