import { CustomError } from '/opt/utils';
import { generatePutTransact } from './generatePutTransact';
import { products } from '@/mock/products';
import { TableNames } from '@/types';

describe('generatePutTransact', () => {
  it('should return a PutTransact object', () => {
    const productTransact = {
      Put: {
        TableName: TableNames.Products,
        Item: products[0],
      },
    };

    const result = generatePutTransact(products[0], TableNames.Products);

    expect(result).toEqual(productTransact);
  });

  it('should throw an error if tableName is not provided', async () => {

    const result = () => {
      generatePutTransact(products[0], undefined)
    };

    expect(result).toThrow('Table name is required');
    expect(result).toThrow(CustomError);
  });
});