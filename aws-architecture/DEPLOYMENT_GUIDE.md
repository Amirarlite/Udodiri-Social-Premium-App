# 🚀 Udodiri Social Club - One-Click AWS Deployment

## Overview

This repository contains a complete **one-click deployment script** for the Udodiri Social Club application on AWS. The solution is **100% AWS-native** with zero third-party platforms, designed for **zero to very low cost**.

## 📋 Prerequisites

Before running the deployment script, ensure you have:

1. **AWS Account** with admin access
2. **Node.js 18+** installed
3. **AWS CLI** configured (`aws configure`)
4. **AWS CDK** installed globally (`npm install -g aws-cdk`)

### Quick Setup Commands

```bash
# Install Node.js (if not installed)
# Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure

# Install AWS CDK globally
npm install -g aws-cdk
```

## 🎯 One-Click Deployment

Simply run the deployment script from the root directory:

```bash
cd /workspace
./deploy.sh
```

The script will automatically:

1. ✅ Check all prerequisites
2. ✅ Install dependencies (infrastructure & frontend)
3. ✅ Bootstrap AWS CDK in your account
4. ✅ Create secrets in AWS Secrets Manager
5. ✅ Deploy all infrastructure (DynamoDB, Lambda, API Gateway, Cognito, S3, CloudFront)
6. ✅ Build and deploy the frontend
7. ✅ Configure Cognito User Pool with correct URLs
8. ✅ Invalidate CloudFront cache

**Total deployment time: ~15-20 minutes**

## 🏗️ Architecture

The deployment creates the following AWS resources:

- **6 DynamoDB Tables** (Users, Meetings, Announcements, Calendar, Subscriptions, Financials)
- **6 Lambda Functions** (Auth, Meetings, Announcements, Calendar, Financials, Subscriptions)
- **1 API Gateway REST API** with Cognito authorizer
- **1 Cognito User Pool** for authentication
- **2 S3 Buckets** (Frontend hosting, Documents storage)
- **1 CloudFront Distribution** for global CDN
- **3 Secrets Manager Secrets** (Google OAuth, Paystack, Flutterwave)

## 💰 Cost Estimation

Based on 1,000 active users per month:

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| Lambda | $4.00 | Pay per request |
| API Gateway | $3.50 | First 12 months free tier |
| DynamoDB | $1.25 | On-demand pricing |
| Cognito | $0.00 | Free for first 50,000 MAUs |
| S3 | $0.23 | Minimal storage |
| CloudFront | $85.00 | Based on data transfer |
| Secrets Manager | $0.40 | 3 secrets |
| **Total** | **~$95/month** | Can be lower with free tier |

### 💡 Cost Optimization Tips

1. **Use AWS Free Tier** (first 12 months):
   - Lambda: 1M requests/month free
   - API Gateway: 1M calls/month free
   - DynamoDB: 25GB storage free
   - Cognito: 50,000 MAUs free

2. **Reduce CloudFront costs**:
   - Most users are likely in one region (Nigeria/West Africa)
   - Consider using S3 website hosting directly (~$0.23/month)
   - Savings: ~$84/month

3. **Total with optimizations**: **~$10-15/month** or **FREE** for first 12 months!

## 🔐 Post-Deployment Configuration

After deployment completes, you need to:

### 1. Update Secrets Manager with Real Credentials

```bash
# Google OAuth (Get from https://console.cloud.google.com/apis/credentials)
aws secretsmanager update-secret \
  --secret-id udodiri-google-credentials \
  --secret-string '{"clientId":"YOUR_REAL_CLIENT_ID","clientSecret":"YOUR_REAL_CLIENT_SECRET","apiKey":"YOUR_REAL_API_KEY"}'

# Paystack (Get from https://dashboard.paystack.com/settings/api-keys)
aws secretsmanager update-secret \
  --secret-id udodiri-paystack-credentials \
  --secret-string '{"publicKey":"pk_live_YOUR_KEY","secretKey":"sk_live_YOUR_KEY"}'

# Flutterwave (Get from https://dashboard.flutterwave.com/dashboard)
aws secretsmanager update-secret \
  --secret-id udodiri-flutterwave-credentials \
  --secret-string '{"publicKey":"FLWPUBK_YOUR_KEY","secretKey":"FLWSECK_YOUR_KEY"}'
```

### 2. Configure Google OAuth Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://YOUR_CLOUDFRONT_DOMAIN`
4. Save changes

### 3. Test the Application

Visit your deployed application at: `https://YOUR_CLOUDFRONT_DOMAIN`

## 🧹 Cleanup (Avoid Charges)

To delete all resources and avoid charges:

```bash
cd aws-architecture/infrastructure

# Empty S3 buckets
aws s3 rm s3://udodiri-documents-YOUR_ACCOUNT_ID --recursive
aws s3 rm s3://udodiri-frontend-YOUR_ACCOUNT_ID --recursive

# Delete CloudFront distribution (get ID from AWS Console if needed)
aws cloudfront delete-distribution --id YOUR_DISTRIBUTION_ID --if-match YOUR_ETAG

# Destroy CDK stack
cdk destroy --all --force
```

## 📁 Project Structure

```
/workspace/
├── deploy.sh                          # One-click deployment script
├── aws-architecture/
│   ├── infrastructure/                # AWS CDK code
│   │   ├── bin/
│   │   ├── lib/
│   │   ├── lambda/                    # Lambda function code
│   │   └── package.json
│   └── frontend/                      # React frontend
│       ├── src/
│       ├── public/
│       └── package.json
└── README.md
```

## 🎨 Club Logo Integration

The club logo from `https://i.postimg.cc/bJQgWxd8/udodiri-young-social-club.jpg` has been integrated into:
- Login page (centered, circular, 120px)
- Dashboard header (small, circular, 50px)

## 🆘 Troubleshooting

### Common Issues

**1. CDK Bootstrap Fails**
```bash
# Ensure AWS CLI is configured correctly
aws sts get-caller-identity

# Check IAM permissions
aws iam list-attached-user-policies --user-name YOUR_USERNAME
```

**2. Deployment Timeout**
```bash
# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name UdodiriSocialClubStack
```

**3. Lambda Function Errors**
```bash
# Check CloudWatch Logs
aws logs tail /aws/lambda/udodiri-auth-function --follow
```

**4. Cognito Authentication Fails**
```bash
# Verify User Pool Client settings
aws cognito-idp describe-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-id YOUR_CLIENT_ID
```

## 📞 Support

For issues or questions:
- Check AWS CloudWatch Logs for Lambda errors
- Review CloudFormation Events for deployment issues
- Verify AWS CLI credentials with `aws sts get-caller-identity`

## 📄 License

Built with ❤️ for Udodiri Young Social Club

---

**Quick Start Summary:**

```bash
# 1. Clone/download this repository
cd /workspace

# 2. Run the deployment script
./deploy.sh

# 3. Wait ~15-20 minutes

# 4. Update secrets with real credentials

# 5. Visit your app! 🎉
```
