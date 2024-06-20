import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, BatchExecuteStatementCommand, ExecuteStatementCommand } from "@aws-sdk/lib-dynamodb";

import { handler } from "@/services/products/getProductsList";
import { products } from "@/mock/products";
import { generateStocksData } from "@/utils/generateStocksData";
import { TableNames } from "@/types";

describe('getProducts handler', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);
  process.env = {
    ...process.env,
    PRODUCTS_TABLE: TableNames.Products,
    STOCKS_TABLE: TableNames.Stocks,
  };

  beforeEach(() => {
    ddbMock.reset();
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  it("Should return products array", async () => {
    const stocks = generateStocksData().map((stock) => ({ Item: stock }));
    const result = products.map((product) => {
      const stock = stocks.find((stock) => stock.Item.product_id === product.id);

      return {
        ...product,
        count: stock?.Item?.count || 0,
      }
    });

    ddbMock.on(ExecuteStatementCommand).resolves({ Items: products });
    ddbMock.on(BatchExecuteStatementCommand).resolves({ Responses: stocks });

    const response = await handler();
    expect(JSON.parse(response.body)).toStrictEqual(result);
  });

  it('Should return error 404 if products not found', async () => {
    ddbMock.on(ExecuteStatementCommand).resolves({ Items: [] });

    const response1 = await handler();

    expect(response1).toHaveProperty('statusCode', 404);
    expect(response1).toHaveProperty('body', JSON.stringify({ message: 'Products not found!' }));

    ddbMock.on(ExecuteStatementCommand).resolves({});

    const response2 = await handler();

    expect(response2).toHaveProperty('statusCode', 404);
    expect(response2).toHaveProperty('body', JSON.stringify({ message: 'Products not found!' }));
  })

  it('Should return error 500 on any error except products/stocks not found', async () => {
    ddbMock.on(ExecuteStatementCommand).rejects();

    const response1 = await handler();

    expect(response1).toHaveProperty('statusCode', 500);
    expect(response1).toHaveProperty('body', JSON.stringify({ message: 'Something went wrong!' }));

    ddbMock.on(ExecuteStatementCommand).resolves({ Items: products });
    ddbMock.on(BatchExecuteStatementCommand).rejects();

    const response2 = await handler();

    expect(response2).toHaveProperty('statusCode', 500);
    expect(response2).toHaveProperty('body', JSON.stringify({ message: 'Something went wrong!' }));
  })
})
