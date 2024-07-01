#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductsServiceStack } from '../lib/products-service-stack';
import { ImportServiceStack } from 'lib/import-service-stack';

const app = new cdk.App();

const props: cdk.StackProps = {
  env: {
    account: process.env.AWS_ACCOUNT_NUMBER,
    region: process.env.AWS_REGION,
  },
};

new ProductsServiceStack(app, 'ShopBackendStack', props);

new ImportServiceStack(app, 'ImportServiceStack', props);

app.synth();
