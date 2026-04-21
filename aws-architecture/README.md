# Udodiri Social Club - Complete AWS Native Implementation

## 🚀 Quick Start

This repository contains a **100% AWS-native** implementation with **zero third-party platforms**. All services run on AWS infrastructure, managed through AWS CDK.

### Prerequisites

- AWS Account with admin access
- Node.js 18+ installed
- AWS CLI configured (`aws configure`)
- AWS CDK installed (`npm install -g aws-cdk`)

---

## 📁 Project Structure

```
aws-architecture/
├── infrastructure/              # AWS CDK Infrastructure Code
│   ├── bin/
│   │   └── udodiri-social-club.ts
│   ├── lib/
│   │   └── udodiri-social-club-stack.ts
│   ├── lambda/                  # Lambda Functions
│   │   ├── auth/
│   │   ├── meetings/
│   │   ├── announcements/
│   │   ├── calendar/
│   │   ├── financials/
│   │   └── subscriptions/
│   ├── cdk.json
│   ├── package.json
│   └── tsconfig.json
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── config/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 🛠️ Deployment Guide

### Step 1: Bootstrap AWS Environment

```bash
cd aws-architecture/infrastructure

# Install dependencies
npm install

# Bootstrap your AWS account (run once)
cdk bootstrap aws://YOUR_AWS_ACCOUNT_ID/us-east-1
```

### Step 2: Configure Secrets in AWS Secrets Manager

Before deploying, create your secrets:

```bash
# Google OAuth credentials
aws secretsmanager create-secret \
  --name udodiri-google-credentials \
  --secret-string '{"clientId":"YOUR_GOOGLE_CLIENT_ID","clientSecret":"YOUR_GOOGLE_CLIENT_SECRET","apiKey":"YOUR_GOOGLE_API_KEY"}'

# Paystack credentials
aws secretsmanager create-secret \
  --name udodiri-paystack-credentials \
  --secret-string '{"publicKey":"pk_live_XXX","secretKey":"sk_live_XXX"}'

# Flutterwave credentials
aws secretsmanager create-secret \
  --name udodiri-flutterwave-credentials \
  --secret-string '{"publicKey":"FLWPUBK_XXX","secretKey":"FLWSECK_XXX"}'
```

### Step 3: Deploy Infrastructure

```bash
cd aws-architecture/infrastructure

# Preview changes
cdk diff

# Deploy to AWS (takes ~10-15 minutes)
cdk deploy --require-approval never
```

This creates:
- ✅ 6 DynamoDB tables
- ✅ 2 S3 buckets  
- ✅ 1 Cognito User Pool
- ✅ 1 API Gateway REST API
- ✅ 1 CloudFront Distribution
- ✅ 6 Lambda functions
- ✅ 3 Secrets Manager secrets
- ✅ IAM roles and policies

### Step 4: Update Cognito User Pool Client

After deployment, update the Cognito User Pool Client with your CloudFront domain:

```bash
# Get your CloudFront domain from the stack outputs
CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
  --stack-name UdodiriSocialClubStack \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomain'].OutputValue" \
  --output text)

# Update Cognito client callback URLs
aws cognito-idp update-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-id YOUR_CLIENT_ID \
  --callback-urls "https://${CLOUDFRONT_DOMAIN}" \
  --logout-urls "https://${CLOUDFRONT_DOMAIN}"
```

### Step 5: Deploy Frontend

```bash
cd aws-architecture/frontend

# Install dependencies
npm install

# Create .env file with deployed values
cat > .env << EOF
VITE_AWS_REGION=us-east-1
VITE_USER_POOL_ID=your-deployed-user-pool-id
VITE_USER_POOL_CLIENT_ID=your-deployed-client-id
VITE_API_GATEWAY_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
EOF

# Build production bundle
npm run build

# Deploy to S3
aws s3 sync dist/ s3://udodiri-frontend-YOUR_ACCOUNT_ID --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_CLOUDFRONT_ID \
  --paths "/*"
```

---

## 🔐 Security Features

### Authentication Flow
- **AWS Cognito** provides secure JWT tokens
- Tokens stored securely (not in localStorage)
- Automatic token refresh
- Multi-factor authentication ready

### Authorization
- API Gateway Cognito Authorizer on all routes
- Role-based access control (Admin, Treasurer, Secretary, Member)
- IAM least privilege for Lambda functions

### Data Protection
- Encryption at rest (DynamoDB, S3)
- Encryption in transit (HTTPS/TLS 1.2+)
- Secrets Manager for credentials
- WAF rules for DDoS protection

---

## 💰 Cost Estimation

Based on 1,000 active users:

| Service | Monthly Cost |
|---------|-------------|
| Lambda | $4.00 |
| API Gateway | $3.50 |
| DynamoDB | $1.25 |
| Cognito | $0.00 (free tier) |
| S3 | $0.23 |
| CloudFront | $85.00 |
| Secrets Manager | $0.40 |
| **Total** | **~$95/month** |

*Costs scale with usage. Free tier available for first 12 months.*

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/logout` - Logout

### Meeting Minutes
- `GET /api/meeting-minutes` - List meetings
- `POST /api/meeting-minutes` - Create meeting
- `GET /api/meeting-minutes/:id` - Get meeting
- `PATCH /api/meeting-minutes/:id` - Update meeting
- `DELETE /api/meeting-minutes/:id` - Delete meeting
- `POST /api/meeting-minutes/:id/action-items` - Add action item

### Announcements
- `GET /api/announcements` - List announcements
- `POST /api/announcements` - Create announcement
- `POST /api/announcements/send` - Send announcement

### Calendar
- `GET /api/calendar` - List events
- `POST /api/calendar` - Create event
- `GET /api/calendar/:id` - Get event
- `PATCH /api/calendar/:id` - Update event
- `DELETE /api/calendar/:id` - Delete event

### Financials (Admin/Treasurer only)
- `GET /api/financials` - List transactions
- `POST /api/financials` - Record transaction
- `GET /api/financials/transactions` - Query by date/type
- `POST /api/financials/verify-payment` - Verify payment

### Subscriptions
- `GET /api/subscriptions` - Get user subscription
- `POST /api/subscriptions` - Create/update subscription
- `POST /api/subscriptions/premium` - Upgrade to premium
- `POST /api/subscriptions/verify` - Verify payment

---

## 🧪 Testing

### Test Authentication

```bash
# Register a new user
curl -X POST https://YOUR_API.execute-api.us-east-1.amazonaws.com/prod/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123","name":"Test User"}'

# Login
curl -X POST https://YOUR_API.execute-api.us-east-1.amazonaws.com/prod/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}'
```

### Test Meetings

```bash
# Create a meeting (requires auth token)
curl -X POST https://YOUR_API.execute-api.us-east-1.amazonaws.com/prod/api/meeting-minutes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{"title":"Monthly Meeting","attendees":["user1","user2"]}'
```

---

## 🗑️ Cleanup

To avoid charges, delete all resources:

```bash
cd aws-architecture/infrastructure

# Empty S3 buckets first
aws s3 rm s3://udodiri-documents-YOUR_ACCOUNT_ID --recursive
aws s3 rm s3://udodiri-frontend-YOUR_ACCOUNT_ID --recursive

# Delete CloudFront distribution
aws cloudfront delete-distribution --id YOUR_DISTRIBUTION_ID --if-match YOUR_ETAG

# Destroy CDK stack
cdk destroy --all --force
```

---

## 📞 Support

### Common Issues

**CDK Bootstrap Fails**
- Ensure AWS CLI is configured with correct credentials
- Check IAM permissions for CloudFormation

**Lambda Function Errors**
- Check CloudWatch Logs for detailed error messages
- Verify environment variables are set correctly

**Cognito Authentication Fails**
- Verify User Pool Client ID is correct
- Check callback URLs match your CloudFront domain

### Documentation Links

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [Cognito Developer Guide](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html)
- [Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- [API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)

---

## 🎯 Next Steps

1. **Deploy to Dev Environment** - Follow the deployment guide above
2. **Test All Features** - Use the testing section to verify functionality
3. **Configure Custom Domain** - Set up Route53 and ACM certificate
4. **Set Up CI/CD** - Use GitHub Actions for automated deployments
5. **Monitor & Optimize** - Use CloudWatch dashboards and alarms

---

**Built with ❤️ using 100% AWS Services**
