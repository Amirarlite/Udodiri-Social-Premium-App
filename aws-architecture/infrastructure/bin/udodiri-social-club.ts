#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { UdodiriSocialClubStack } from '../lib/udodiri-social-club-stack';

const app = new cdk.App();

new UdodiriSocialClubStack(app, 'UdodiriSocialClubStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Udodiri Young Social Club Infrastructure',
});
