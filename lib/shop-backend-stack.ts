import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class ShopBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create lambda layer
    const lambdaLayer = new lambda.LayerVersion(this, 'LambdaLayer', {
      code: lambda.Code.fromAsset('lambda-layer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
    });

    // Create lambda functions
    const getProducts = new NodejsFunction(this, 'GetProductsHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: 'products-service/getProductsList.ts',
      layers: [lambdaLayer],
    });

    const getProductById = new NodejsFunction(this, 'GetProductByIdHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: 'products-service/getProductById.ts',
      layers: [lambdaLayer],
    });

    const createProduct = new NodejsFunction(this, 'CreateProductHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: 'products-service/createProduct.ts',
      layers: [lambdaLayer],
      initialPolicy: [new iam.PolicyStatement({
        actions: ['dynamodb:PutItem'],
        resources: ['*'],
      })]
    });

    const cors = new NodejsFunction(this, 'CORS', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: 'products-service/cors.ts',
    })

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
    })

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
      methods: [apigw.HttpMethod.PUT],
      integration: createProductIntegration,
    });
  }
};
