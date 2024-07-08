import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { LAYERS_PATH, SERVICES_PATH } from '@/constants';
import path = require('node:path');

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // Create lambda layers
    const utilsLayer = new lambda.LayerVersion(this, 'UtilsLayer', {
      code: lambda.Code.fromAsset(path.join(LAYERS_PATH, 'utils')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
    });

    // Create basic authorization service lambda
    const basicAuthorization = new NodejsFunction(this, 'BasicAuthHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(SERVICES_PATH.Authorization, 'lambdas', 'basicAuthorizer.ts'),
      layers: [utilsLayer],
      environment: {
        CarphatianSnake: process.env.CarphatianSnake!
      }
    });

    // Export basic authorization service lambda ARN
    new cdk.CfnOutput(this, 'BasicAuthArnOutput', {
      value: basicAuthorization.functionArn,
      exportName: 'basicAuthArn',
    })
  }
}