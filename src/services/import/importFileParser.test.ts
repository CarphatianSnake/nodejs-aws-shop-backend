import { mockClient } from "aws-sdk-client-mock";
import { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { handler } from "./importFileParser";
import { s3EventRecordMock } from "@/mock/s3EventRecordMock";
import { createReadStream } from 'node:fs';
import 'aws-sdk-client-mock-jest';
import type { S3Event } from "aws-lambda";
import type { StreamingBlobPayloadOutputTypes } from '@smithy/types';

describe('importFilePaser', () => {
  const s3Mock = mockClient(S3Client);
  const sqsMock = mockClient(SQSClient);

  process.env = {
    ...process.env,
    S3_BUCKET: 'mocked-bucket',
    REGION: 'mocked-region',
  };

  const defaultEvent: S3Event = {
    Records: [s3EventRecordMock]
  } as any;

  beforeEach(() => {
    defaultEvent.Records = [s3EventRecordMock];
    s3Mock.reset();
    sqsMock.reset();
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
  })

  it('Should parse data and move file to /parsed folder', async () => {
    const record = s3EventRecordMock;
    record.s3.object.key = 'uploaded/test.csv';

    defaultEvent.Records[0] = record;

    s3Mock.on(GetObjectCommand).resolves({
      Body: createReadStream('src/mock/test.csv') as unknown as StreamingBlobPayloadOutputTypes,
    })

    sqsMock.on(SendMessageCommand).resolves({ MessageId: 'id' });

    const result = await handler(defaultEvent);

    expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 2);
    expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
    expect(s3Mock).toHaveReceivedCommandTimes(DeleteObjectCommand, 1);
    expect(result).toHaveProperty('statusCode', 200);
  })

  it('Should return error 404 No data', async () => {
    s3Mock.on(GetObjectCommand).resolves({
      Body: undefined
    });

    const result = await handler(defaultEvent);

    expect(result).toHaveProperty('statusCode', 404);
    expect(JSON.parse(result.body)).toHaveProperty('message', 'No data');
  })

  it('Should return error 500 on wrong event data', async () => {
    const result = await handler(defaultEvent);

    expect(result).toHaveProperty('statusCode', 500);
    expect(JSON.parse(result.body)).toHaveProperty('message', 'Something went wrong!');
  })
})