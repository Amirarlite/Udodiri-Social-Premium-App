#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { UdodiriSocialClubStack } from './lib/udodiri-social-club-stack';

const app = new cdk.App();

// Load configuration from context or use defaults
const appName = app.node.tryGetContext('appName') || 'udodiri-social-club';
const env = app.node.tryGetContext('env') || {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
};

console.log(`Deploying ${appName} to ${env.region}`);

new UdodiriSocialClubStack(app, `${appName}-stack`, {
  description: 'Udodiri Social Club - Complete AWS Native Architecture',
  env,
  tags: {
    App: appName,
    Environment: 'Production',
    ManagedBy: 'CDK',
    Owner: 'Udodiri-Social-Club'
  }
});

app.synth();
