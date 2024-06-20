import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { ALLOWED_HEADERS, API_PATHS, ORIGINS, SERVICES_PATH } from '@/constants';
import path = require('node:path');

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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

    // ==========================
    // TODO
    // ==========================

    // Create lambda functions
    const importProductsFile = new NodejsFunction(this, 'ImportHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(SERVICES_PATH.Import, 'importProductsFile.ts'),
      layers: [],
      initialPolicy: [new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [],
        resources: [],
      })],
      environment: {},
    });

    const importFileParser = new NodejsFunction(this, 'ParserHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(SERVICES_PATH.Import, 'importFileParser.ts'),
      layers: [],
      initialPolicy: [new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [],
        resources: [],
      })],
      environment: {},
    });

    // Create import service integration
    const importProductsFileIntegration = new HttpLambdaIntegration('ImportProductsFileIntegration', importProductsFile);

    // Add route for import service API
    importApi.addRoutes({
      path: API_PATHS.Import,
      methods: [apigw.HttpMethod.GET],
      integration: importProductsFileIntegration,
    });
  }
}
