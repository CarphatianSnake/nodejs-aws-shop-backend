import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

import { fillDdbTables } from "@/utils/fillDdbTables";

describe('fillDdbTables', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);

  beforeEach(() => {
    ddbMock.reset();
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  it('Should successfully fill tables', async () => {
    const response = {
      '$metadata': {
        httpStatusCode: 200,
        requestId: 'MECVSND77T6GNRHEDB4UJ36L07VV4KQNSO5AEMVJF66Q9ASUAAJG',
        extendedRequestId: undefined,
        cfId: undefined,
        attempts: 1,
        totalRetryDelay: 0
      }
    };

    ddbMock.on(TransactWriteCommand).resolves(response);

    const res = await fillDdbTables();

    expect(res).resolves;
  })
  it('Should fail to fill tables', async () => {
    ddbMock.on(TransactWriteCommand).rejects();

    const res = await fillDdbTables();

    expect(res).rejects;
  })
})