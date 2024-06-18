import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { TableNames } from '@/types';

export class ShopBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const LAMBDA_ENV = {
      PRODUCTS_TABLE: TableNames.Products,
      STOCKS_TABLE: TableNames.Stocks,
    };

    const DYNAMO_TABLE_ARN = `arn:aws:dynamodb:${this.region}:${this.account}:table/`;

    const DYNAMO_ARNS = {
      products: `${DYNAMO_TABLE_ARN}${TableNames.Products}`,
      stocks: `${DYNAMO_TABLE_ARN}${TableNames.Stocks}`,
    };

    // Create lambda layers
    const utilsLayer = new lambda.LayerVersion(this, 'UtilsLayer', {
      code: lambda.Code.fromAsset('products-service/utils-layer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
    });

    const zodLayer = new lambda.LayerVersion(this, 'ZodLayer', {
      code: lambda.Code.fromAsset('products-service/zod-layer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
    });

    const uuidLayer = new lambda.LayerVersion(this, 'UuidLayer', {
      code: lambda.Code.fromAsset('products-service/uuid-layer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
    });

    // Create lambda functions
    const getProducts = new NodejsFunction(this, 'GetProductsHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: 'products-service/getProductsList.ts',
      layers: [utilsLayer, zodLayer],
      initialPolicy: [new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:PartiQLSelect'],
        resources: [DYNAMO_ARNS.products, DYNAMO_ARNS.stocks],
      })],
      environment: LAMBDA_ENV,
    });

    const getProductById = new NodejsFunction(this, 'GetProductByIdHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: 'products-service/getProductById.ts',
      layers: [utilsLayer, zodLayer],
      initialPolicy: [new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:PartiQLSelect'],
        resources: [DYNAMO_ARNS.products, DYNAMO_ARNS.stocks],
      })],
      environment: LAMBDA_ENV,
    });

    const createProduct = new NodejsFunction(this, 'CreateProductHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: 'products-service/createProduct.ts',
      layers: [utilsLayer, zodLayer, uuidLayer],
      initialPolicy: [new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:PartiQLInsert'],
        resources: [DYNAMO_ARNS.products, DYNAMO_ARNS.stocks],
      })],
      environment: LAMBDA_ENV,
    });

    const cors = new NodejsFunction(this, 'CORS', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: 'products-service/cors.ts',
    });

    // Create products service integrations
    const getProductsIntegration = new HttpLambdaIntegration('GetProductsIntegration', getProducts);
    const getProductByIdIntegration = new HttpLambdaIntegration('GetProductByIdIntegration', getProductById);
    const createProductIntegration = new HttpLambdaIntegration('CreateProductIntegration', createProduct);
    const corsIntegration = new HttpLambdaIntegration('CORsIntegration', cors);

    // Create products service API
    const productsApi = new apigw.HttpApi(this, 'ProductsHttpApi');

    // Create "dev" stage
    new apigw.HttpStage(this, 'DevStage', {
      httpApi: productsApi,
      stageName: 'dev',
      autoDeploy: true,
    });

    // Add routes to products service API endpoint
    productsApi.addRoutes({
      path: '/products',
      methods: [apigw.HttpMethod.OPTIONS],
      integration: corsIntegration,
    });

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

    productsApi.addRoutes({
      path: '/products',
      methods: [apigw.HttpMethod.POST],
      integration: createProductIntegration,
    });
  }
};
