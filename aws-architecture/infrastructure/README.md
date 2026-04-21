# AWS CDK Infrastructure for Udodiri Social Club

Complete infrastructure-as-code implementation using AWS CDK (Cloud Development Kit) in TypeScript.

## Quick Start

### Prerequisites

- Node.js 18.x or later
- AWS CLI configured (`aws configure`)
- AWS CDK installed globally (`npm install -g aws-cdk`)
- AWS account with appropriate permissions

### Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Bootstrap AWS environment (one-time per account/region)
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1

# Deploy all resources
cdk deploy --all
```

## Architecture Components

This CDK stack provisions:

### Compute
- **6 Lambda Functions** (Node.js 18.x)
  - Auth Handler
  - Meetings Handler
  - Announcements Handler
  - Calendar Handler
  - Financials Handler
  - Subscriptions Handler

### Database
- **6 DynamoDB Tables** (On-demand billing)
  - udodiri-users
  - udodiri-meeting-minutes
  - udodiri-announcements
  - udodiri-calendar-events
  - udodiri-subscriptions
  - udodiri-financials

### Authentication
- **Cognito User Pool** with:
  - Email/password authentication
  - Google OAuth integration
  - JWT token issuance
  - Built-in MFA support

### API Layer
- **API Gateway REST API** with:
  - Cognito authorizer
  - CORS enabled
  - Request throttling (1000 req/s)
  - CloudWatch logging

### Storage
- **2 S3 Buckets**
  - Documents bucket (versioned, encrypted)
  - Frontend hosting bucket

### CDN
- **CloudFront Distribution**
  - HTTPS enforcement (TLS 1.2+)
  - Edge caching
  - SPA routing support

### Security
- **Secrets Manager** for:
  - Google API credentials
  - Paystack payment keys
  - Flutterwave payment keys

## Configuration

Edit `cdk.json` to customize:

```json
{
  "context": {
    "appName": "udodiri-social-club",
    "env": {
      "account": "YOUR_AWS_ACCOUNT_ID",
      "region": "us-east-1"
    }
  }
}
```

## Outputs

After deployment, you'll receive:

- `ApiGatewayUrl` - Base URL for all API endpoints
- `CloudFrontDomain` - Frontend application URL
- `CognitoUserPoolId` - User pool ID for frontend config
- `CognitoClientId` - Client ID for OAuth flows
- `UsersTableName` - DynamoDB table name
- `DocumentsBucketName` - S3 bucket for documents

## Development

```bash
# Watch mode for development
npm run watch

# View deployment diff
cdk diff

# Destroy all resources (use with caution!)
cdk destroy --all
```

## Lambda Function Deployment

Lambda function code should be placed in the `lambda/` directory:

```
lambda/
├── auth/
│   └── index.ts
├── meetings/
│   └── index.ts
├── announcements/
│   └── index.ts
├── calendar/
│   └── index.ts
├── financials/
│   └── index.ts
└── subscriptions/
    └── index.ts
```

Each function will be automatically bundled and deployed when you run `cdk deploy`.

## Cost Optimization

- All DynamoDB tables use **PAY_PER_REQUEST** billing
- Lambda functions sized at **256MB** (adjust as needed)
- CloudFront caching enabled for static assets
- S3 lifecycle policies for cost-effective storage

## Security Best Practices

✅ IAM roles follow least-privilege principle  
✅ All data encrypted at rest (AES-256)  
✅ All traffic encrypted in transit (TLS 1.2+)  
✅ Secrets stored in Secrets Manager (not environment variables)  
✅ API Gateway protected by Cognito authorizer  
✅ S3 buckets block public access  

## Monitoring

Resources are configured with:

- CloudWatch Logs (90-day retention)
- CloudWatch Metrics (invocations, errors, latency)
- X-Ray tracing enabled for Lambda functions

## Cleanup

To avoid ongoing charges:

```bash
# Delete all deployed resources
cdk destroy --all

# Empty S3 buckets manually (retention policy prevents auto-delete)
aws s3 rm s3://udodiri-documents-ACCOUNT_ID --recursive
aws s3 rm s3://udodiri-frontend-ACCOUNT_ID --recursive
```

## License

MIT
