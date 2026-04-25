import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as path from 'path';

export class UdodiriSocialClubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. S3 Bucket for Frontend
    const bucket = new s3.Bucket(this, 'UdodiriFrontendBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false, // CloudFront will handle access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // 2. CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'UdodiriDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 404,
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
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 4. Lambda Functions (Auth Example)
    const authFunction = new lambda.Function(this, 'UdodiriAuthFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'auth-handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: {
        USERS_TABLE: usersTable.tableName,
      },
    });

    usersTable.grantReadWriteData(authFunction);

    // 5. Outputs for GitHub Actions
    this.addOutputs({
      CloudFrontDistributionId: distribution.distributionId,
      FrontendBucketName: bucket.bucketName,
      ApiEndpoint: `https://${distribution.domainName}/api`,
      UsersTableName: usersTable.tableName,
    });
  }
  
  // Helper to add outputs strongly typed
  private addOutputs(outputs: { [key: string]: string }) {
    for (const [key, value] of Object.entries(outputs)) {
      new cdk.CfnOutput(this, key, { value, exportName: `${this.stackName}-${key}` });
    }
  }
}
