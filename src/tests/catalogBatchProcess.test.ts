import { mockClient } from "aws-sdk-client-mock";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { handler } from "@/services/products/catalogBatchProcess";
import { sqsRecordMock } from "@/mock/sqsRecordMock";
import 'aws-sdk-client-mock-jest';
import * as utils from "@/layers/utils";

describe('catalogBatchProcess', () => {
  const snsMock = mockClient(SNSClient);

  const transactSpy = jest.spyOn(utils, 'transactProduct').mockImplementation(() => Promise.resolve());
  jest.spyOn(console, 'log').mockImplementation(() => { });
  jest.spyOn(console, 'error').mockImplementation(() => { });

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
    transactSpy.mockClear();
  })

  it('Should add all products and send messages', async () => {
    snsMock.on(PublishCommand).resolves({
      MessageId: 'XXX',
    });

    await handler({
      Records: correctRecords,
    });

    expect(transactSpy).toHaveBeenCalledTimes(correctRecords.length);
    expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, correctRecords.length);
  })

  it('Should add only correct validated products and send all messages', async () => {
    snsMock.on(PublishCommand).resolves({
      MessageId: 'XXX',
    });

    const Records = [...correctRecords, ...errorRecords];

    await handler({
      Records,
    });

    expect(transactSpy).toHaveBeenCalledTimes(correctRecords.length);
    expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, Records.length);
  })
})
