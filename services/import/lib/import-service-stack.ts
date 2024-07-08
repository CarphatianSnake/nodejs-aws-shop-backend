import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSource from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpLambdaAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { ALLOWED_HEADERS, API_PATHS, LAYERS_PATH, ORIGINS, SERVICES_PATH } from '@/constants';
import path = require('node:path');

const S3_BUCKET = 'import-service-bucket-rss-course-carp';
const RESOURCE = 'arn:aws:s3:::import-service-bucket-rss-course-carp';

interface ImportServiceStackProps extends cdk.StackProps {
  CATALOG_ITEMS_QUEUE: sqs.Queue;
}

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ImportServiceStackProps) {
    super(scope, id, props);

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
      entry: path.join(SERVICES_PATH.Import, 'lambdas', 'importProductsFile.ts'),
      layers: [utilsLayer],
      initialPolicy: [new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject'],
        resources: [`${RESOURCE}/uploaded/*`],
      })],
      environment: {
        S3_BUCKET,
      },
      events: [importProductsFileEventSource],
    });

    // Create import service integration
    const importProductsFileIntegration = new HttpLambdaIntegration('ImportProductsFileIntegration', importProductsFile);

    // Import basic authorization lambda function
    const basicAuthorizer = NodejsFunction.fromFunctionArn(this, 'BasicAuthHandler', cdk.Fn.importValue('basicAuthArn'));

    // Create http lambda authorizer
    const basicImportAuthorizer = new HttpLambdaAuthorizer('BasicImportAuthorizer', basicAuthorizer, {
      resultsCacheTtl: cdk.Duration.seconds(0),
    });

    // Add route for import service API
    importApi.addRoutes({
      path: API_PATHS.Import,
      methods: [apigw.HttpMethod.GET],
      integration: importProductsFileIntegration,
      authorizer: basicImportAuthorizer,
    });

    // Create import file parser lambda function
    const importFileParser = new NodejsFunction(this, 'ParserHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(SERVICES_PATH.Import, 'lambdas', 'importFileParser.ts'),
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
        SQS_IMPORT_URL: props.CATALOG_ITEMS_QUEUE.queueUrl,
      },
    });

    // Grant import file parser lambda function to send messages to SQS queue
    props.CATALOG_ITEMS_QUEUE.grantSendMessages(importFileParser);
  }
}
