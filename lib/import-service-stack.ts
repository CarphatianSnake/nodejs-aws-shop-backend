import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSource from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { ALLOWED_HEADERS, API_PATHS, LAYERS_PATH, ORIGINS, SERVICES_PATH } from '@/constants';
import path = require('node:path');
import { TableNames } from '@/types';

const S3_BUCKET = 'import-service-bucket-rss-course-carp';
const RESOURCE = 'arn:aws:s3:::import-service-bucket-rss-course-carp';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const DYNAMO_TABLE_ARN = `arn:aws:dynamodb:${this.region}:${this.account}:table/`;

    const DYNAMO_ARNS = {
      products: `${DYNAMO_TABLE_ARN}${TableNames.Products}`,
      stocks: `${DYNAMO_TABLE_ARN}${TableNames.Stocks}`,
    };

    // Create import service API
    const importApi = new apigw.HttpApi(this, 'ImportApi', {
      corsPreflight: {
        allowOrigins: ORIGINS,
        allowMethods: [apigw.CorsHttpMethod.OPTIONS, apigw.CorsHttpMethod.GET],
        allowHeaders: ALLOWED_HEADERS,
      },
    });

    // Add "dev" stage to import service API
    new apigw.HttpStage(this, 'DevStage', {
      httpApi: importApi,
      stageName: 'dev',
      autoDeploy: true,
    });

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

    // Create import products file service event source
    const importProductsFileEventSource = new lambdaEventSource.ApiEventSource(
      apigw.HttpMethod.GET,
      API_PATHS.Import,
      {
        requestParameters: {
          'method.request.querystring.name': true,
        }
      },
    );

    // Create import products file service lambda function
    const importProductsFile = new NodejsFunction(this, 'ImportHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(SERVICES_PATH.Import, 'importProductsFile.ts'),
      layers: [utilsLayer],
      initialPolicy: [new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject'],
        resources: [`${RESOURCE}/uploaded/*`],
      })],
      environment: {
        S3_BUCKET,
      },
      events: [importProductsFileEventSource]
    });

    // Create import service integration
    const importProductsFileIntegration = new HttpLambdaIntegration('ImportProductsFileIntegration', importProductsFile);

    // Add route for import service API
    importApi.addRoutes({
      path: API_PATHS.Import,
      methods: [apigw.HttpMethod.GET],
      integration: importProductsFileIntegration,
    });

    // Create SQS Import Products Queue
    const importQueue = new sqs.Queue(this, 'ImportProductsQueue', {
      queueName: 'import-products-queue-carp',
    });

    // Create import file parser lambda function
    const importFileParser = new NodejsFunction(this, 'ParserHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(SERVICES_PATH.Import, 'importFileParser.ts'),
      layers: [utilsLayer],
      initialPolicy: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:GetObject', 's3:DeleteObject'],
          resources: [`${RESOURCE}/uploaded/*`],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:PutObject'],
          resources: [`${RESOURCE}/parsed/*`],
        })
      ],
      environment: {
        S3_BUCKET,
        SQS_IMPORT_URL: importQueue.queueUrl
      },
    });

    // Grant import file parser lambda function to send messages to SQS queue
    importQueue.grantSendMessages(importFileParser);

    // Create SQS event source for catalog batch process lambda function
    const catalogBatchProcessEventSource = new lambdaEventSource.SqsEventSource(importQueue, {
      batchSize: 5,
    });

    // Create SNS import service topic
    const importTopic = new sns.Topic(this, 'ImportTopic');

    // Create catalog batch process lambda function
    const catalogBatchProcess = new NodejsFunction(this, 'CatalogBatchProcessHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(SERVICES_PATH.Import, 'catalogBatchProcess.ts'),
      layers: [utilsLayer, uuidLayer, zodLayer],
      initialPolicy: [new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:PartiQLInsert'],
        resources: [DYNAMO_ARNS.products, DYNAMO_ARNS.stocks],
      })],
      environment: {
        SNS_ARN: importTopic.topicArn,
        PRODUCTS_TABLE: TableNames.Products,
        STOCKS_TABLE: TableNames.Stocks,
      },
      events: [catalogBatchProcessEventSource],
    });

    // Add SNS import service topic subscriptions
    importTopic.addSubscription(new snsSubscriptions.EmailSubscription(process.env.SNS_SUB_SUCCESS_EMAIL!, {
      filterPolicy: {
        status: sns.SubscriptionFilter.stringFilter({
          allowlist: ['success'],
        }),
      }
    }));

    importTopic.addSubscription(new snsSubscriptions.EmailSubscription(process.env.SNS_SUB_FAIL_EMAIL!, {
      filterPolicy: {
        status: sns.SubscriptionFilter.stringFilter({
          allowlist: ['error'],
        }),
      },
    }));

    // Allow catalog batch process lambda function to send messages to the topic
    importTopic.grantPublish(catalogBatchProcess);
  }
}
