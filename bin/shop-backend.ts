#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ShopBackendStack } from '../lib/shop-backend-stack';

const app = new cdk.App();
new ShopBackendStack(app, 'ShopBackendStack', {
  env: {
    account: process.env.AWS_ACCOUNT_NUMBER,
    region: process.env.AWS_REGION
  }
});