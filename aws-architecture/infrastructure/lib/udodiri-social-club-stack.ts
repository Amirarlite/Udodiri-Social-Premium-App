import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class UdodiriSocialClubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const frontendBucket = new s3.Bucket(this, 'UdodiriFrontendBucket', {
      bucketName: `udodiri-frontend-${this.account}-${this.region}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      websiteIndexDocument: 'index.html',
    });

    const distribution = new cloudfront.Distribution(this, 'UdodiriDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    });

    const usersTable = new dynamodb.Table(this, 'UdodiriUsersTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const apiHandler = new lambda.Function(this, 'UdodiriApiHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: { USERS_TABLE: usersTable.tableName },
    });

    usersTable.grantReadWriteData(apiHandler);

    const api = new apigateway.RestApi(this, 'UdodiriApi', {
      restApiName: 'Udodiri Social Club API',
      deployOptions: { stageName: 'prod' },
    });

    api.root.addMethod('ANY', new apigateway.LambdaIntegration(apiHandler));

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', { value: distribution.distributionId });
    new cdk.CfnOutput(this, 'FrontendBucketName', { value: frontendBucket.bucketName });
    new cdk.CfnOutput(this, 'ApiEndpoint', { value: api.url });
  }
}
