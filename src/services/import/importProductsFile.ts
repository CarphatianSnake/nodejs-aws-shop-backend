import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { CustomError, createResponse } from "/opt/utils";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { queryStringParameters } = event;
  const response = createResponse(['GET', 'OPTIONS'], { 'Content-Type': 'text/plain' });
  const client = new S3Client({ region: process.env.REGION });

  try {
    console.log('Checking file name...');

    if (!queryStringParameters?.name) {
      throw new CustomError('File for upload not found.', 404);
    }

    if (!queryStringParameters.name.toLowerCase().endsWith('.csv')) {
      throw new CustomError('Unsupported file type.', 415);
    }

    const key = `uploaded/${queryStringParameters.name}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    });

    console.log('Creating Signed URL with following key:', key);

    const signedUrl = await getSignedUrl(client, command, { expiresIn: 300 });

    response.statusCode = 200;
    response.body = signedUrl;

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
