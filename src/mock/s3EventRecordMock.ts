import type { S3EventRecord } from "aws-lambda";

export const s3EventRecordMock: S3EventRecord = {
  eventVersion: 'version',
  eventSource: 'source',
  awsRegion: 'region',
  eventTime: 'time',
  eventName: 'name',
  userIdentity: {
    principalId: '1',
  },
  requestParameters: {
    sourceIPAddress: '123',
  },
  responseElements: {
    "x-amz-request-id": '1',
    "x-amz-id-2": '2',
  },
  s3: {
    object: {
      key: '',
      size: 1000,
      eTag: 'test-etag',
      sequencer: 'test-seq'
    },
    bucket: {
      name: 'mocked-bucket',
      arn: 'XXXXXXXXXXXXXXXXXXXXXXXXXX',
      ownerIdentity: {
        principalId: 'XXXXXXXXXXXX'
      }
    },
    configurationId: '1234',
    s3SchemaVersion: '1',
  }
};
