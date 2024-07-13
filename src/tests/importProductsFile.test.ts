import { mockClient } from "aws-sdk-client-mock";
import { S3Client } from "@aws-sdk/client-s3";
import { handler } from "@services/import/lambdas/importProductsFile";
import { httpEventMock } from "@/mock/httpEventMock";
import type { HttpEventRequest } from "@/types";

describe('importProductsFile', () => {
  const s3Mock = mockClient(S3Client);
  process.env = {
    ...process.env,
    S3_BUCKET: 'mocked-bucket',
    AWS_REGION: 'mocked-region',
  };

  const defaultEvent: HttpEventRequest = {
    ...httpEventMock,
    queryStringParameters: null,
  } as any;
  
  jest.spyOn(console, 'log').mockImplementation(() => { });
  jest.spyOn(console, 'error').mockImplementation(() => { });

  beforeEach(() => {
    defaultEvent.queryStringParameters = null;
    s3Mock.reset();
  });

  it('Should return Signed URL', async () => {
    const FILENAME = 'test.csv';

    defaultEvent.queryStringParameters = {
      name: FILENAME,
    };

    const result = await handler(defaultEvent);

    expect(result).toHaveProperty('statusCode', 200);
    expect(result.headers).toHaveProperty('Content-Type', 'text/plain');
    expect(result.body).toContain(`https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/uploaded/${FILENAME}`);
  })

  it('Should return error 404 file not found', async () => {
    const result1 = await handler(defaultEvent);

    expect(result1).toHaveProperty('statusCode', 404);
    expect(JSON.parse(result1.body)).toHaveProperty('message', 'File for upload not found.');

    defaultEvent.queryStringParameters = {
      name: '',
    }

    const result2 = await handler(defaultEvent);

    expect(result2).toHaveProperty('statusCode', 404);
    expect(JSON.parse(result2.body)).toHaveProperty('message', 'File for upload not found.');
  })

  it('Should return error 415 on unsupported file type', async () => {
    defaultEvent.queryStringParameters = {
      name: 'test.jpg',
    };

    const result = await handler(defaultEvent);

    expect(result).toHaveProperty('statusCode', 415);
    expect(JSON.parse(result.body)).toHaveProperty('message', 'Unsupported file type.');
  })
})
