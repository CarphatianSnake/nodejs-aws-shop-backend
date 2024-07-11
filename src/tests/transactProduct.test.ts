import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ExecuteTransactionCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { transactProduct } from "@/layers/utils";
import { products } from '@/mock/products';
import 'aws-sdk-client-mock-jest';

describe('transactProduct', () => {
	const ddbMock = mockClient(DynamoDBDocumentClient);
  
  jest.spyOn(console, 'log').mockImplementation(() => { });

  const props = {
    product: products[0],
    region: 'region',
    tables: {
      PRODUCTS_TABLE: 'products',
      STOCKS_TABLE: 'stocks',
    }
  };

  beforeEach(() => {
    ddbMock.reset();
  })

  it('Should succesfully transact data', async () => {
    const result = await transactProduct(props);

    expect(ddbMock).toHaveReceivedCommandTimes(ExecuteTransactionCommand, 1);
    expect(result).resolves;
  })

  it('Should throw an error', async () => {
    ddbMock.on(ExecuteTransactionCommand).rejects;

    const result = await transactProduct(props);

    expect(ddbMock).toHaveReceivedCommandTimes(ExecuteTransactionCommand, 1);
    expect(result).rejects;
  })
})
