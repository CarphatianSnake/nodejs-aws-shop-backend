import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { SERVICES_PATH } from '@/constants';
import path = require('node:path');

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // Create basic authorization service lambda
    const basicAuthorizer = new NodejsFunction(this, 'BasicAuthHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(SERVICES_PATH.Authorization, 'lambdas', 'basicAuthorizer.ts'),
      environment: {
        CarphatianSnake: process.env.CarphatianSnake!
      }
    });

    // Export basic authorization service lambda ARN
    new cdk.CfnOutput(this, 'BasicAuthArnOutput', {
      value: basicAuthorizer.functionArn,
      exportName: 'basicAuthArn',
    })
  }
}