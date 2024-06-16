import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, BatchGetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

import { getProductsList } from "@/utils/getProductsList";
import { generateStocksData } from "@/utils/generateStocksData";
import { CustomError } from "@/utils/CustomError";
import { products } from "../mock/products";

describe('getProductsList', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);

  beforeEach(() => {
    ddbMock.reset();
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  it('Should return products list', async () => {
    const stocks = generateStocksData();
    const data = products.map((product) => {
      const stock = stocks.find((stock) => stock.product_id === product.id);

      return {
        ...product,
        count: stock?.count || 0,
      };
    })

    ddbMock.on(ScanCommand).resolves({
      Count: products.length,
      Items: products,
    });

    ddbMock.on(BatchGetCommand).resolves({
      Responses: {
        stocks,
      },
    });

    const result = await getProductsList();

    expect(result).toStrictEqual(data);
  })

  it('Should return error 404 PRODUCTS not found', async () => {
    ddbMock.on(ScanCommand).resolves({
      Count: 0,
      Items: [],
    });

    expect(getProductsList()).rejects.toThrow();
    expect(getProductsList()).rejects.toBeInstanceOf(CustomError);
    expect(getProductsList()).rejects.toHaveProperty('statusCode', 404);
    expect(getProductsList()).rejects.toHaveProperty('message', 'Products not found!');
  })

  it('Sould return error 404 STOCKS not found', async () => {
    ddbMock.on(ScanCommand).resolves({
      Count: products.length,
      Items: products,
    });

    ddbMock.on(BatchGetCommand).resolves({
      Responses: {
        stocks: [],
      },
    });

    expect(getProductsList()).rejects.toThrow();
    expect(getProductsList()).rejects.toBeInstanceOf(CustomError);
    expect(getProductsList()).rejects.toHaveProperty('statusCode', 404);
    expect(getProductsList()).rejects.toHaveProperty('message', 'Stocks not found!');
  })

  it('Should return error 500 on ScanCommand fail', async () => {
    ddbMock.on(ScanCommand, {}).rejects();

    expect(getProductsList()).rejects.toThrow();
    expect(getProductsList()).rejects.toBeInstanceOf(CustomError);
    expect(getProductsList()).rejects.toHaveProperty('message', 'Something went wrong!');
    expect(getProductsList()).rejects.toHaveProperty('statusCode', 500);
  })

  it('Should return error 500 on BatchCommand fail', async () => {
    ddbMock.on(ScanCommand).resolves({
      Count: products.length,
      Items: products,
    });

    ddbMock.on(BatchGetCommand).rejects();

    expect(getProductsList()).rejects.toThrow();
    expect(getProductsList()).rejects.toBeInstanceOf(CustomError);
    expect(getProductsList()).rejects.toHaveProperty('message', 'Something went wrong!');
    expect(getProductsList()).rejects.toHaveProperty('statusCode', 500);
  })
})
