import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class ShopBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProducts = new NodejsFunction(this, 'GetProductsHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('products'),
      handler: 'getProducts.handler',
    });

    const getProductById = new NodejsFunction(this, 'GetProductByIdHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('products'),
      handler: 'getProductById.handler',
    });

    const productsApi = new apigw.HttpApi(this, 'ProductsHttpApi');

    const getProductsIntegration = new HttpLambdaIntegration('GetProductsIntegration', getProducts);
    const getProductByIdIntegration = new HttpLambdaIntegration('GetProductByIdIntegration', getProductById);

    productsApi.addRoutes({
      path: '/products',
      methods: [apigw.HttpMethod.GET],
      integration: getProductsIntegration,
    });

    productsApi.addRoutes({
      path: '/products/{productId}',
      methods: [apigw.HttpMethod.GET],
      integration: getProductByIdIntegration,
    });
  }
};
