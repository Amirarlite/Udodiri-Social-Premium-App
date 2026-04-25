import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class UdodiriSocialClubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. S3 Bucket for Frontend (Private, accessed only by CloudFront)
    const frontendBucket = new s3.Bucket(this, 'UdodiriFrontendBucket', {
      bucketName: `udodiri-frontend-${this.account}-${this.region}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
    });

    // 2. CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'UdodiriDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // 3. DynamoDB Tables
    const usersTable = new dynamodb.Table(this, 'UdodiriUsersTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const postsTable = new dynamodb.Table(this, 'UdodiriPostsTable', {
      partitionKey: { name: 'postId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 4. Lambda Functions (Placeholder for now)
    const apiHandler = new lambda.Function(this, 'UdodiriApiHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        USERS_TABLE: usersTable.tableName,
        POSTS_TABLE: postsTable.tableName,
      },
    });

    usersTable.grantReadWriteData(apiHandler);
    postsTable.grantReadWriteData(apiHandler);

    // 5. API Gateway
    const api = new apigateway.RestApi(this, 'UdodiriApi', {
      restApiName: 'Udodiri Social Club API',
      deployOptions: { stageName: 'prod' },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(apiHandler);
    const apiResource = api.root.addResource('api');
    apiResource.addMethod('ANY', lambdaIntegration);

    // OUTPUTS (Crucial for GitHub Actions)
    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      exportName: 'CloudFrontDistributionId',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      exportName: 'FrontendBucketName',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      exportName: 'ApiEndpoint',
    });
  }
}
