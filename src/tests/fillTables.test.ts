import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

import { fillDdbTables } from "@/scripts/fillTables";
import { response } from "@/mock/response";

describe('fillDdbTables', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);
  
  jest.spyOn(console, 'log').mockImplementation(() => { });
  jest.spyOn(console, 'error').mockImplementation(() => { });

  beforeEach(() => {
    ddbMock.reset();
  });

  it('Should successfully fill tables', async () => {
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