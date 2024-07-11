import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSource from 'aws-cdk-lib/aws-lambda-event-sources';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { TableNames } from '@/types';
import { ALLOWED_HEADERS, LAYERS_PATH, ORIGINS, SERVICES_PATH, API_PATHS } from '@/constants';
import path = require('node:path');

export class ProductsServiceStack extends cdk.Stack {
  public readonly CatalogItemsQueue: sqs.Queue;

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
      code: lambda.Code.fromAsset(path.join(LAYERS_PATH, 'utils')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
    });

    const zodLayer = new lambda.LayerVersion(this, 'ZodLayer', {
      code: lambda.Code.fromAsset(path.join(LAYERS_PATH, 'zod')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
    });

    const uuidLayer = new lambda.LayerVersion(this, 'UuidLayer', {
      code: lambda.Code.fromAsset(path.join(LAYERS_PATH, 'uuid')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
    });

    // Create lambda functions
    const getProducts = new NodejsFunction(this, 'GetProductsHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(SERVICES_PATH.Products, 'getProductsList.ts'),
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
      entry: path.join(SERVICES_PATH.Products, 'getProductById.ts'),
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
      entry: path.join(SERVICES_PATH.Products, 'createProduct.ts'),
      layers: [utilsLayer, zodLayer, uuidLayer],
      initialPolicy: [new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:PartiQLInsert'],
        resources: [DYNAMO_ARNS.products, DYNAMO_ARNS.stocks],
      })],
      environment: LAMBDA_ENV,
    });

    // Create products service integrations
    const getProductsIntegration = new HttpLambdaIntegration('GetProductsIntegration', getProducts);
    const getProductByIdIntegration = new HttpLambdaIntegration('GetProductByIdIntegration', getProductById);
    const createProductIntegration = new HttpLambdaIntegration('CreateProductIntegration', createProduct);

    // Create products service API
    const productsApi = new apigw.HttpApi(this, 'ProductsHttpApi', {
      corsPreflight: {
        allowOrigins: ORIGINS,
        allowMethods: [apigw.CorsHttpMethod.OPTIONS, apigw.CorsHttpMethod.POST, apigw.CorsHttpMethod.GET],
        allowHeaders: ALLOWED_HEADERS,
      }
    });

    // Create "dev" stage to products service API
    new apigw.HttpStage(this, 'DevStage', {
      httpApi: productsApi,
      stageName: 'dev',
      autoDeploy: true,
    });

    // Add routes to products service API endpoint
    productsApi.addRoutes({
      path: API_PATHS.Products,
      methods: [apigw.HttpMethod.GET],
      integration: getProductsIntegration,
    });

    productsApi.addRoutes({
      path: API_PATHS.Products,
      methods: [apigw.HttpMethod.POST],
      integration: createProductIntegration,
    });

    productsApi.addRoutes({
      path: `${API_PATHS.Products}/{productId}`,
      methods: [apigw.HttpMethod.GET],
      integration: getProductByIdIntegration,
    });

    // Create SQS Import Products Queue
    const catalogItemsQueue = new sqs.Queue(this, 'ImportProductsQueue', {
      queueName: 'import-products-queue-carp',
    });
    this.CatalogItemsQueue = catalogItemsQueue;

    // Create SQS event source for catalog batch process lambda function
    const catalogBatchProcessEventSource = new lambdaEventSource.SqsEventSource(catalogItemsQueue, {
      batchSize: 5,
    });

    // Create SNS import service topic
    const createProductTopic = new sns.Topic(this, 'ImportTopic');

    // Add SNS import service topic subscriptions
    createProductTopic.addSubscription(new snsSubscriptions.EmailSubscription(process.env.SNS_SUB_MAIN_EMAIL!));

    createProductTopic.addSubscription(new snsSubscriptions.EmailSubscription(process.env.SNS_SUB_SECONDARY_EMAIL!, {
      filterPolicy: {
        price: sns.SubscriptionFilter.numericFilter({
          allowlist: [0],
        }),
      },
    }));

    // Create catalog batch process lambda function
    const catalogBatchProcess = new NodejsFunction(this, 'CatalogBatchProcessHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(SERVICES_PATH.Products, 'catalogBatchProcess.ts'),
      layers: [utilsLayer, uuidLayer, zodLayer],
      initialPolicy: [new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:PartiQLInsert'],
        resources: [DYNAMO_ARNS.products, DYNAMO_ARNS.stocks],
      })],
      environment: {
        SNS_ARN: createProductTopic.topicArn,
        PRODUCTS_TABLE: TableNames.Products,
        STOCKS_TABLE: TableNames.Stocks,
      },
      events: [catalogBatchProcessEventSource],
    });

    // Allow catalog batch process lambda function to send messages to the topic
    createProductTopic.grantPublish(catalogBatchProcess);
  }
};
