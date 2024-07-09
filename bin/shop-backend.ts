#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthorizationServiceStack } from '@services/authorization/lib/authorization-service-stack';
import { ProductsServiceStack } from '@services/products/lib/products-service-stack';
import { ImportServiceStack } from '@services/import/lib/import-service-stack';
import 'dotenv/config';

const app = new cdk.App();

const props: cdk.StackProps = {
  env: {
    account: process.env.AWS_ACCOUNT_NUMBER,
    region: process.env.AWS_REGION,
  },
};

new AuthorizationServiceStack(app, 'AuthorizationServiceStack', props);
new ProductsServiceStack(app, 'ShopBackendStack', props);
new ImportServiceStack(app, 'ImportServiceStack', props);

app.synth();
