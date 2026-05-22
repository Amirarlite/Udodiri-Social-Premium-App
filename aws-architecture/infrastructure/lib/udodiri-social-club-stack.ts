import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class UdodiriSocialClubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================================================================
    // Frontend Bucket
    // ============================================================================
    const frontendBucket = new s3.Bucket(this, 'UdodiriFrontendBucket', {
      bucketName: `udodiri-frontend-${this.account}-${this.region}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      websiteIndexDocument: 'index.html',
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // ============================================================================
    // CloudFront Distribution
    // ============================================================================
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

    // ============================================================================
    // Cognito User Pool
    // ============================================================================
    const userPool = new cognito.UserPool(this, 'UdodiriUserPool', {
      userPoolName: 'udodiri-social-club-pool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true,
      },
      autoVerifiedAttributes: [cognito.UserPoolAttribute.EMAIL],
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UdodiriUserPoolClient', {
      userPool,
      clientName: 'udodiri-web-client',
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: true,
      },
    });

    // ============================================================================
    // DynamoDB Tables
    // ============================================================================
    const usersTable = new dynamodb.Table(this, 'UdodiriUsersTable', {
      tableName: 'udodiri-users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    const meetingsTable = new dynamodb.Table(this, 'UdodiriMeetingsTable', {
      tableName: 'udodiri-meetings',
      partitionKey: { name: 'meetingId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const announcementsTable = new dynamodb.Table(this, 'UdodiriAnnouncementsTable', {
      tableName: 'udodiri-announcements',
      partitionKey: { name: 'announcementId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const calendarTable = new dynamodb.Table(this, 'UdodiriCalendarTable', {
      tableName: 'udodiri-calendar',
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const financialsTable = new dynamodb.Table(this, 'UdodiriFinancialsTable', {
      tableName: 'udodiri-financials',
      partitionKey: { name: 'recordId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const subscriptionsTable = new dynamodb.Table(this, 'UdodiriSubscriptionsTable', {
      tableName: 'udodiri-subscriptions',
      partitionKey: { name: 'subscriptionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ============================================================================
    // Lambda Functions
    // ============================================================================
    const apiHandler = new lambda.Function(this, 'UdodiriApiHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        USERS_TABLE: usersTable.tableName,
        MEETINGS_TABLE: meetingsTable.tableName,
        ANNOUNCEMENTS_TABLE: announcementsTable.tableName,
        CALENDAR_TABLE: calendarTable.tableName,
        FINANCIALS_TABLE: financialsTable.tableName,
        SUBSCRIPTIONS_TABLE: subscriptionsTable.tableName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Grant table permissions
    usersTable.grantReadWriteData(apiHandler);
    meetingsTable.grantReadWriteData(apiHandler);
    announcementsTable.grantReadWriteData(apiHandler);
    calendarTable.grantReadWriteData(apiHandler);
    financialsTable.grantReadWriteData(apiHandler);
    subscriptionsTable.grantReadWriteData(apiHandler);

    // ============================================================================
    // API Gateway
    // ============================================================================
    const api = new apigateway.RestApi(this, 'UdodiriApi', {
      restApiName: 'Udodiri Social Club API',
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    api.root.addMethod('ANY', new apigateway.LambdaIntegration(apiHandler));

    // ============================================================================
    // CloudFront Outputs
    // ============================================================================
    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
      exportName: 'CloudFrontDistributionId',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.domainName,
      description: 'CloudFront Domain Name (use this for OAuth)',
      exportName: 'CloudFrontDomain',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'S3 Frontend Bucket Name',
      exportName: 'FrontendBucketName',
    });

    // ============================================================================
    // API Outputs
    // ============================================================================
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway Endpoint',
      exportName: 'ApiEndpoint',
    });

    // ============================================================================
    // Cognito Outputs
    // ============================================================================
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'UserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'UserPoolClientId',
    });

    new cdk.CfnOutput(this, 'UserPoolDomain', {
      value: `https://${userPool.userPoolDomain?.domainName}.auth.${this.region}.amazoncognito.com`,
      description: 'Cognito Domain',
      exportName: 'UserPoolDomain',
    });

    // ============================================================================
    // DynamoDB Table Outputs
    // ============================================================================
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
      exportName: 'UsersTableName',
    });

    new cdk.CfnOutput(this, 'MeetingsTableName', {
      value: meetingsTable.tableName,
      exportName: 'MeetingsTableName',
    });

    new cdk.CfnOutput(this, 'AnnouncementsTableName', {
      value: announcementsTable.tableName,
      exportName: 'AnnouncementsTableName',
    });

    new cdk.CfnOutput(this, 'CalendarTableName', {
      value: calendarTable.tableName,
      exportName: 'CalendarTableName',
    });

    new cdk.CfnOutput(this, 'FinancialsTableName', {
      value: financialsTable.tableName,
      exportName: 'FinancialsTableName',
    });

    new cdk.CfnOutput(this, 'SubscriptionsTableName', {
      value: subscriptionsTable.tableName,
      exportName: 'SubscriptionsTableName',
    });
  }
}
