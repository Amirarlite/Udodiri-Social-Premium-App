import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface UdodiriSocialClubStackProps extends cdk.StackProps {
  readonly description?: string;
}

export class UdodiriSocialClubStack extends cdk.Stack {
  // Core Resources
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.CfnUserPoolClient;
  public readonly apiGateway: apigateway.RestApi;
  
  // DynamoDB Tables
  public readonly usersTable: dynamodb.Table;
  public readonly meetingsTable: dynamodb.Table;
  public readonly announcementsTable: dynamodb.Table;
  public readonly calendarTable: dynamodb.Table;
  public readonly subscriptionsTable: dynamodb.Table;
  public readonly financialsTable: dynamodb.Table;
  
  // S3 Buckets
  public readonly documentsBucket: s3.Bucket;
  public readonly frontendBucket: s3.Bucket;
  
  // CloudFront Distribution
  public readonly distribution: cloudfront.Distribution;
  
  // Secrets
  public readonly googleSecrets: secretsmanager.Secret;
  public readonly paystackSecrets: secretsmanager.Secret;
  public readonly flutterwaveSecrets: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: UdodiriSocialClubStackProps = {}) {
    super(scope, id, props);

    // ============================================
    // DYNAMODB TABLES - NoSQL Database Layer
    // ============================================
    
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'udodiri-users',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add GSI for email lookup
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'emailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.meetingsTable = new dynamodb.Table(this, 'MeetingsTable', {
      tableName: 'udodiri-meeting-minutes',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    this.announcementsTable = new dynamodb.Table(this, 'AnnouncementsTable', {
      tableName: 'udodiri-announcements',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    this.calendarTable = new dynamodb.Table(this, 'CalendarTable', {
      tableName: 'udodiri-calendar-events',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    this.subscriptionsTable = new dynamodb.Table(this, 'SubscriptionsTable', {
      tableName: 'udodiri-subscriptions',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'tier', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    this.financialsTable = new dynamodb.Table(this, 'FinancialsTable', {
      tableName: 'udodiri-financials',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add GSI for date-based queries
    this.financialsTable.addGlobalSecondaryIndex({
      indexName: 'dateIndex',
      partitionKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ============================================
    // S3 BUCKETS - Storage Layer
    // ============================================
    
    this.documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      bucketName: `udodiri-documents-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      lifecycleRules: [
        {
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    this.frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `udodiri-frontend-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
    });

    // ============================================
    // AWS COGNITO - Authentication & Authorization
    // ============================================
    
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'udodiri-user-pool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullName: { required: true, mutable: true },
      },
      autoVerify: { email: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Google OAuth Integration
    this.userPool.addIdentityProvider('GoogleProvider', {
      clientId: 'PLACEHOLDER_GOOGLE_CLIENT_ID',
      clientSecretValue: cdk.SecretValue.secretsManager('google-oauth-secret', {
        jsonField: 'clientSecret',
      }),
    });

    this.userPoolClient = new cognito.CfnUserPoolClient(this, 'UserPoolClient', {
      userPoolId: this.userPool.userPoolId,
      clientName: 'udodiri-web-client',
      generateSecret: false,
      explicitAuthFlows: [
        'ALLOW_ADMIN_USER_PASSWORD_AUTH',
        'ALLOW_CUSTOM_AUTH',
        'ALLOW_USER_PASSWORD_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH',
      ],
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.GOOGLE,
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
      callbackUrls: [
        'http://localhost:5173',
        'https://PLACEHOLDER_CLOUDFRONT_DOMAIN.cloudfront.net',
      ],
      logoutUrls: [
        'http://localhost:5173',
        'https://PLACEHOLDER_CLOUDFRONT_DOMAIN.cloudfront.net',
      ],
      allowedOAuthFlows: ['code', 'implicit'],
      allowedOAuthScopes: [
        cognito.OAuthScope.EMAIL,
        cognito.OAuthScope.OPENID,
        cognito.OAuthScope.PROFILE,
      ],
      allowedOAuthFlowsUserPoolClient: true,
      preventUserExistenceErrors: true,
    });

    // ============================================
    // SECRETS MANAGER - Secure Credential Storage
    // ============================================
    
    this.googleSecrets = new secretsmanager.Secret(this, 'GoogleSecrets', {
      secretName: 'udodiri-google-credentials',
      description: 'Google API credentials for Drive, Docs, Calendar, Gmail',
      secretObjectValue: {
        clientId: cdk.SecretValue.unsafePlainText('PLACEHOLDER_GOOGLE_CLIENT_ID'),
        clientSecret: cdk.SecretValue.unsafePlainText('PLACEHOLDER_GOOGLE_CLIENT_SECRET'),
        apiKey: cdk.SecretValue.unsafePlainText('PLACEHOLDER_GOOGLE_API_KEY'),
      },
    });

    this.paystackSecrets = new secretsmanager.Secret(this, 'PaystackSecrets', {
      secretName: 'udodiri-paystack-credentials',
      description: 'Paystack payment gateway credentials',
      secretObjectValue: {
        publicKey: cdk.SecretValue.unsafePlainText('PLACEHOLDER_PAYSTACK_PUBLIC_KEY'),
        secretKey: cdk.SecretValue.unsafePlainText('PLACEHOLDER_PAYSTACK_SECRET_KEY'),
      },
    });

    this.flutterwaveSecrets = new secretsmanager.Secret(this, 'FlutterwaveSecrets', {
      secretName: 'udodiri-flutterwave-credentials',
      description: 'Flutterwave payment gateway credentials',
      secretObjectValue: {
        publicKey: cdk.SecretValue.unsafePlainText('PLACEHOLDER_FLUTTERWAVE_PUBLIC_KEY'),
        secretKey: cdk.SecretValue.unsafePlainText('PLACEHOLDER_FLUTTERWAVE_SECRET_KEY'),
      },
    });

    // ============================================
    // API GATEWAY - REST API Layer
    // ============================================
    
    this.apiGateway = new apigateway.RestApi(this, 'ApiGateway', {
      restApiName: 'udodiri-social-club-api',
      description: 'REST API for Udodiri Social Club Application',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        throttlingBurstLimit: 500,
        throttlingRateLimit: 1000,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
        ],
        allowCredentials: true,
      },
      cloudWatchRoleRemovalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ============================================
    // CLOUDFRONT - CDN & HTTPS Frontend
    // ============================================
    
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'FrontendOAI',
      {
        comment: 'OAI for Udodiri Frontend Bucket',
      }
    );

    this.frontendBucket.grantRead(originAccessIdentity);

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.frontendBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.RestApiOrigin(this.apiGateway),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
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
      defaultRootObject: 'index.html',
      enabled: true,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    // Grant Lambda functions access to resources
    this.createLambdaFunctions();
  }

  private createLambdaFunctions() {
    // Common Lambda configuration
    const commonLambdaConfig: lambda.FunctionOptions = {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        USERS_TABLE: this.usersTable.tableName,
        MEETING_MINUTES_TABLE: this.meetingsTable.tableName,
        ANNOUNCEMENTS_TABLE: this.announcementsTable.tableName,
        CALENDAR_EVENTS_TABLE: this.calendarTable.tableName,
        SUBSCRIPTIONS_TABLE: this.subscriptionsTable.tableName,
        FINANCIALS_TABLE: this.financialsTable.tableName,
        COGNITO_USER_POOL_ID: this.userPool.userPoolId,
        COGNITO_CLIENT_ID: this.userPoolClient.ref,
        DOCUMENTS_BUCKET: this.documentsBucket.bucketName,
        GOOGLE_SECRET_NAME: this.googleSecrets.secretName,
        PAYSTACK_SECRET_NAME: this.paystackSecrets.secretName,
        FLUTTERWAVE_SECRET_NAME: this.flutterwaveSecrets.secretName,
      },
      logRetention: logs.RetentionDays.THREE_MONTHS,
    };

    // Auth Lambda Function
    const authFunction = new lambda.Function(this, 'AuthFunction', {
      ...commonLambdaConfig,
      functionName: 'udodiri-auth-handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      description: 'Handles user authentication via Cognito',
    });

    // Meetings Lambda Function
    const meetingsFunction = new lambda.Function(this, 'MeetingsFunction', {
      ...commonLambdaConfig,
      functionName: 'udodiri-meetings-handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      description: 'CRUD operations for meeting minutes',
    });

    // Announcements Lambda Function
    const announcementsFunction = new lambda.Function(this, 'AnnouncementsFunction', {
      ...commonLambdaConfig,
      functionName: 'udodiri-announcements-handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      description: 'Create and send announcements',
    });

    // Calendar Lambda Function
    const calendarFunction = new lambda.Function(this, 'CalendarFunction', {
      ...commonLambdaConfig,
      functionName: 'udodiri-calendar-handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      description: 'Calendar event management',
    });

    // Financials Lambda Function
    const financialsFunction = new lambda.Function(this, 'FinancialsFunction', {
      ...commonLambdaConfig,
      functionName: 'udodiri-financials-handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      description: 'Payment processing and transaction tracking',
    });

    // Subscriptions Lambda Function
    const subscriptionsFunction = new lambda.Function(this, 'SubscriptionsFunction', {
      ...commonLambdaConfig,
      functionName: 'udodiri-subscriptions-handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      description: 'Premium subscription management',
    });

    // Grant permissions to DynamoDB tables
    [authFunction, meetingsFunction, announcementsFunction, calendarFunction, financialsFunction, subscriptionsFunction].forEach(fn => {
      this.usersTable.grantReadWriteData(fn);
      this.meetingsTable.grantReadWriteData(fn);
      this.announcementsTable.grantReadWriteData(fn);
      this.calendarTable.grantReadWriteData(fn);
      this.subscriptionsTable.grantReadWriteData(fn);
      this.financialsTable.grantReadWriteData(fn);
      
      // Grant access to Secrets Manager
      this.googleSecrets.grantRead(fn);
      this.paystackSecrets.grantRead(fn);
      this.flutterwaveSecrets.grantRead(fn);
    });

    // Grant Cognito permissions
    authFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'cognito-idp:InitiateAuth',
        'cognito-idp:AdminInitiateAuth',
        'cognito-idp:SignUp',
        'cognito-idp:ConfirmSignUp',
        'cognito-idp:GetUser',
        'cognito-idp:GlobalSignOut',
        'cognito-idp:AdminGetUser',
      ],
      resources: [
        this.userPool.userPoolArn,
        `${this.userPool.userPoolArn}/client/*`,
      ],
    }));

    // ============================================
    // API Gateway Integrations
    // ============================================
    
    const authIntegration = new apigateway.LambdaIntegration(authFunction);
    const meetingsIntegration = new apigateway.LambdaIntegration(meetingsFunction);
    const announcementsIntegration = new apigateway.LambdaIntegration(announcementsFunction);
    const calendarIntegration = new apigateway.LambdaIntegration(calendarFunction);
    const financialsIntegration = new apigateway.LambdaIntegration(financialsFunction);
    const subscriptionsIntegration = new apigateway.LambdaIntegration(subscriptionsFunction);

    // Create Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      authorizerName: 'udodiri-cognito-authorizer',
      cognitoUserPools: [this.userPool],
      identitySource: 'method.request.header.Authorization',
      resultsCacheTtl: cdk.Duration.minutes(5),
    });

    // API Routes
    const api = this.apiGateway.root.addResource('api');

    // Auth endpoints (public)
    const auth = api.addResource('auth');
    auth.addResource('register').addMethod('POST', authIntegration);
    auth.addResource('login').addMethod('POST', authIntegration);
    auth.addResource('verify').addMethod('GET', authIntegration, {
      authorizer,
    });
    auth.addResource('logout').addMethod('POST', authIntegration, {
      authorizer,
    });
    auth.addResource('google').addResource('callback').addMethod('POST', authIntegration);

    // Meetings endpoints (protected)
    const meetings = api.addResource('meeting-minutes');
    meetings.addMethod('GET', meetingsIntegration, { authorizer });
    meetings.addMethod('POST', meetingsIntegration, { authorizer });
    meetings.addResource('{id}').addMethod('GET', meetingsIntegration, { authorizer });
    meetings.addResource('{id}').addMethod('PATCH', meetingsIntegration, { authorizer });
    meetings.addResource('{id}').addMethod('DELETE', meetingsIntegration, { authorizer });
    meetings.addResource('{id}').addResource('action-items').addMethod('POST', meetingsIntegration, { authorizer });

    // Announcements endpoints (protected)
    const announcements = api.addResource('announcements');
    announcements.addMethod('GET', announcementsIntegration, { authorizer });
    announcements.addMethod('POST', announcementsIntegration, { authorizer });
    announcements.addResource('send').addMethod('POST', announcementsIntegration, { authorizer });

    // Calendar endpoints (protected)
    const calendar = api.addResource('calendar');
    calendar.addMethod('GET', calendarIntegration, { authorizer });
    calendar.addMethod('POST', calendarIntegration, { authorizer });
    calendar.addResource('{id}').addMethod('GET', calendarIntegration, { authorizer });
    calendar.addResource('{id}').addMethod('PATCH', calendarIntegration, { authorizer });
    calendar.addResource('{id}').addMethod('DELETE', calendarIntegration, { authorizer });

    // Financials endpoints (protected - Admin only)
    const financials = api.addResource('financials');
    financials.addMethod('GET', financialsIntegration, { authorizer });
    financials.addMethod('POST', financialsIntegration, { authorizer });
    financials.addResource('transactions').addMethod('GET', financialsIntegration, { authorizer });
    financials.addResource('verify-payment').addMethod('POST', financialsIntegration, { authorizer });

    // Subscriptions endpoints (protected)
    const subscriptions = api.addResource('subscriptions');
    subscriptions.addMethod('GET', subscriptionsIntegration, { authorizer });
    subscriptions.addMethod('POST', subscriptionsIntegration, { authorizer });
    subscriptions.addResource('premium').addMethod('POST', subscriptionsIntegration, { authorizer });
    subscriptions.addResource('verify').addMethod('POST', subscriptionsIntegration, { authorizer });
  }

  // Output important values
  addOutputs() {
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.apiGateway.url,
      description: 'API Gateway endpoint URL',
      exportName: 'UdodiriApiGatewayUrl',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: this.distribution.domainName,
      description: 'CloudFront distribution domain name',
      exportName: 'UdodiriCloudFrontDomain',
    });

    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'UdodiriCognitoUserPoolId',
    });

    new cdk.CfnOutput(this, 'CognitoClientId', {
      value: this.userPoolClient.ref,
      description: 'Cognito User Pool Client ID',
      exportName: 'UdodiriCognitoClientId',
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
      description: 'DynamoDB Users Table Name',
      exportName: 'UdodiriUsersTable',
    });

    new cdk.CfnOutput(this, 'DocumentsBucketName', {
      value: this.documentsBucket.bucketName,
      description: 'S3 Documents Bucket Name',
      exportName: 'UdodiriDocumentsBucket',
    });
  }
}
