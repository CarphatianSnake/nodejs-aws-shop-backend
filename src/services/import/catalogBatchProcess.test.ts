import { mockClient } from "aws-sdk-client-mock";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { DynamoDBDocumentClient, ExecuteTransactionCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "./catalogBatchProcess";
import { sqsRecordMock } from "@/mock/sqsRecordMock";
import 'aws-sdk-client-mock-jest';

describe('catalogBatchProcess', () => {
  const snsMock = mockClient(SNSClient);
  const ddbMock = mockClient(DynamoDBDocumentClient);

  const correctRecords = [
    sqsRecordMock,
    {
      ...sqsRecordMock,
      body: '{"title":"Something","price":"776","count":"86"}',
    },
    {
      ...sqsRecordMock,
      body: '{"title":"Product","price":"5"}',
    }
  ];

  const errorRecords = [
    {
      ...sqsRecordMock,
      body: '{"title":"Product","description":"Lorem ipsum","price":"5","count":"count"}',
    },
    {
      ...sqsRecordMock,
      body: '{"title":"Product","description":"Lorem ipsum","price":"price","count":"8"}',
    }
  ];

  beforeEach(() => {
    snsMock.reset();
    ddbMock.reset();
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
  })

  it('Should add all products and send messages', async () => {
    ddbMock.on(ExecuteTransactionCommand).resolves({});
    snsMock.on(PublishCommand).resolves({
      MessageId: 'XXX',
    });

    await handler({
      Records: correctRecords,
    });

    expect(ddbMock).toHaveReceivedCommandTimes(ExecuteTransactionCommand, correctRecords.length);
    expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, correctRecords.length);
  })

  it('Should add only correct validated products and send all messages', async () => {
    ddbMock.on(ExecuteTransactionCommand).resolves({});
    snsMock.on(PublishCommand).resolves({
      MessageId: 'XXX',
    });

    const Records = [...correctRecords, ...errorRecords];

    await handler({
      Records,
    });

    expect(ddbMock).toHaveReceivedCommandTimes(ExecuteTransactionCommand, correctRecords.length);
    expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, Records.length);
  })
})
