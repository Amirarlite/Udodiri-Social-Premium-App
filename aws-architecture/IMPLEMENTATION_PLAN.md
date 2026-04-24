# Udodiri Social Club - AWS Implementation Plan

## Executive Summary

This document outlines the **complete implementation plan** for migrating the Udodiri Social Club application to a **100% AWS-native architecture**. This eliminates all third-party platforms and leverages AWS services exclusively.

---

## 🎯 Architecture Decision: Why 100% AWS?

### Current Issues Addressed

| Problem | AWS Solution |
|---------|-------------|
| ❌ Base64 "tokens" (not real JWT) | ✅ Cognito provides real signed JWT tokens |
| ❌ Tokens stored in localStorage | ✅ Cognito secure token management |
| ❌ No input validation | ✅ API Gateway request validators |
| ❌ Hardcoded secrets | ✅ Secrets Manager |
| ❌ No rate limiting | ✅ API Gateway throttling |
| ❌ DynamoDB scans (inefficient) | ✅ Proper indexing + Query operations |
| ❌ No CORS configured | ✅ API Gateway CORS built-in |
| ❌ Error information disclosure | ✅ Centralized error handling |
| ❌ No authorization checks | ✅ Cognito groups + IAM policies |
| ❌ Weak OAuth implementation | ✅ Cognito identity pools |

---

## 📋 Complete Building Plan

### Phase 1: Foundation Setup (Days 1-3)

#### Day 1: AWS Account & CLI Setup

```bash
# 1. Create AWS Account
# Visit: https://portal.aws.amazon.com/billing/signup

# 2. Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version  # Should show aws-cli/2.x.x

# 3. Create IAM User for CDK Deployment
aws iam create-user --user-name udodiri-cdk-deployer

# 4. Attach AdministratorAccess policy (for initial setup)
aws iam attach-user-policy \
  --user-name udodiri-cdk-deployer \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# 5. Create access keys
aws iam create-access-key --user-name udodiri-cdk-deployer

# 6. Configure AWS CLI
aws configure
# Enter the access key, secret key, region (us-east-1), output (json)
```

#### Day 2: Development Environment

```bash
# 1. Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install AWS CDK globally
npm install -g aws-cdk
cdk --version  # Should show 2.x.x

# 3. Clone/setup project structure
mkdir -p udodiri-social-club
cd udodiri-social-club

# 4. Initialize git repository
git init
git checkout -b main
```

#### Day 3: Infrastructure Code Setup

```bash
# Navigate to infrastructure directory
cd aws-architecture/infrastructure

# Install dependencies
npm install

# Build TypeScript
npm run build

# Bootstrap AWS account for CDK
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
```

---

### Phase 2: Core Infrastructure Deployment (Days 4-7)

#### Day 4: Deploy Database Layer

```bash
# Deploy only DynamoDB tables first
cdk deploy UdodiriSocialClubStack --outputs-file outputs.json

# Verify tables created
aws dynamodb list-tables --query "TableNames[?contains(@, 'udodiri')]"

# Expected output:
# [
#   "udodiri-users",
#   "udodiri-meeting-minutes",
#   "udodiri-announcements",
#   "udodiri-calendar-events",
#   "udodiri-subscriptions",
#   "udodiri-financials"
# ]
```

#### Day 5: Deploy Authentication (Cognito)

```bash
# Get Cognito outputs from stack
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name UdodiriSocialClubStack \
  --query "Stacks[0].Outputs[?OutputKey=='CognitoUserPoolId'].OutputValue" \
  --output text)

CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name UdodiriSocialClubStack \
  --query "Stacks[0].Outputs[?OutputKey=='CognitoClientId'].OutputValue" \
  --output text)

echo "User Pool ID: $USER_POOL_ID"
echo "Client ID: $CLIENT_ID"

# Configure Google Identity Provider
aws cognito-idp create-identity-provider \
  --user-pool-id $USER_POOL_ID \
  --provider-name Google \
  --provider-type Google \
  --provider-details '{"client_id":"YOUR_GOOGLE_CLIENT_ID","client_secret":"YOUR_GOOGLE_CLIENT_SECRET"}' \
  --attribute-mapping '{"email":"email","username":"sub"}'
```

#### Day 6: Deploy API Gateway & Lambda Functions

```bash
# Full stack deployment (includes API Gateway + Lambda)
cdk deploy UdodiriSocialClubStack

# Get API Gateway URL
API_URL=$(aws cloudformation describe-stacks \
  --stack-name UdodiriSocialClubStack \
  --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" \
  --output text)

echo "API Gateway URL: $API_URL"

# Test auth endpoint
curl -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","name":"Test User"}'
```

#### Day 7: Deploy CloudFront & S3

```bash
# Get CloudFront domain
CF_DOMAIN=$(aws cloudformation describe-stacks \
  --stack-name UdodiriSocialClubStack \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomain'].OutputValue" \
  --output text)

echo "CloudFront Domain: $CF_DOMAIN"

# Update Cognito callback URLs
aws cognito-idp update-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-id $CLIENT_ID \
  --callback-urls "https://$CF_DOMAIN" \
  --logout-urls "https://$CF_DOMAIN"
```

---

### Phase 3: Secrets Configuration (Day 8)

#### Update All Secrets

```bash
# 1. Google API Credentials
aws secretsmanager update-secret \
  --secret-id udodiri-google-credentials \
  --secret-string '{
    "clientId": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    "clientSecret": "GOCSPX-YOUR_GOOGLE_CLIENT_SECRET",
    "apiKey": "AIzaSyD-YOUR_GOOGLE_API_KEY"
  }'

# 2. Paystack Credentials
aws secretsmanager update-secret \
  --secret-id udodiri-paystack-credentials \
  --secret-string '{
    "publicKey": "pk_live_YOUR_PAYSTACK_PUBLIC_KEY",
    "secretKey": "sk_live_YOUR_PAYSTACK_SECRET_KEY"
  }'

# 3. Flutterwave Credentials
aws secretsmanager update-secret \
  --secret-id udodiri-flutterwave-credentials \
  --secret-string '{
    "publicKey": "FLWPUBK_TEST_YOUR_PUBLIC_KEY",
    "secretKey": "FLWSECK_TEST_YOUR_SECRET_KEY"
  }'

# Verify secrets
aws secretsmanager list-secrets --query "SecretList[*].Name"
```

---

### Phase 4: Frontend Integration (Days 9-12)

#### Day 9-10: Update Frontend Configuration

Create `frontend/.env.production`:

```env
REACT_APP_AWS_REGION=us-east-1
REACT_APP_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
REACT_APP_COGNITO_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j
REACT_APP_COGNITO_DOMAIN=udodiri-user-pool.auth.us-east-1.amazoncognito.com
REACT_APP_API_ENDPOINT=https://abcdef123.execute-api.us-east-1.amazonaws.com/prod
REACT_APP_S3_BUCKET=udodiri-documents-YOUR_ACCOUNT_ID
REACT_APP_CLOUDFRONT_DOMAIN=d1234.cloudfront.net
```

#### Day 11: Build & Deploy Frontend

```bash
cd aws-architecture/frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Deploy to S3
FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name UdodiriSocialClubStack \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)

aws s3 sync dist/ s3://$FRONTEND_BUCKET --delete

# Invalidate CloudFront cache
CF_DIST_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='Udodiri Frontend'].Id" \
  --output text)

aws cloudfront create-invalidation \
  --distribution-id $CF_DIST_ID \
  --paths "/*"
```

#### Day 12: End-to-End Testing

```bash
# Test complete user flow
# 1. Register new user
curl -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"SecurePass123!","name":"New User"}'

# 2. Login
LOGIN_RESPONSE=$(curl -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"SecurePass123!"}')

# Extract tokens
ID_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.tokens.idToken')
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.tokens.accessToken')

# 3. Access protected endpoint
curl -X GET "$API_URL/api/meeting-minutes" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

### Phase 5: Security Hardening (Days 13-14)

#### Day 13: Enable WAF & Monitoring

```bash
# Create WAF Web ACL
aws wafv2 create-web-acl \
  --name UdodiriWAF \
  --scope REGIONAL \
  --default-action Allow={} \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=UdodiriWAF \
  --rules '[{
    "Name": "AWSManagedRulesCommonRuleSet",
    "Priority": 1,
    "Statement": {
      "ManagedRuleGroupStatement": {
        "VendorName": "AWS",
        "Name": "AWSManagedRulesCommonRuleSet"
      }
    },
    "OverrideAction": { "None": {} },
    "VisibilityConfig": {
      "SampledRequestsEnabled": true,
      "CloudWatchMetricsEnabled": true,
      "MetricName": "CommonRuleSet"
    }
  }]'

# Associate with API Gateway
# (Requires additional CloudFormation resources)
```

#### Day 14: Set Up Alarms

```bash
# Lambda error alarm
aws cloudwatch put-metric-alarm \
  --alarm-name Udodiri-LambdaErrors \
  --alarm-description "Lambda function error rate exceeded" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=FunctionName,Value=udodiri-auth-handler \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts

# API Gateway 5xx alarm
aws cloudwatch put-metric-alarm \
  --alarm-name Udodiri-API5xxErrors \
  --alarm-description "API Gateway 5xx error rate exceeded" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ApiName,Value=udodiri-social-club-api \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts
```

---

### Phase 6: Production Launch (Days 15-16)

#### Day 15: Load Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test API Gateway throughput
ab -n 1000 -c 10 \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_URL/api/meeting-minutes"

# Expected: ~100 requests/second with <200ms latency
```

#### Day 16: Go Live Checklist

- [ ] All tests passing
- [ ] Monitoring dashboards configured
- [ ] Alerts set up and tested
- [ ] Backup strategy verified
- [ ] Disaster recovery plan documented
- [ ] SSL certificate valid
- [ ] DNS records updated
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] User documentation ready

---

## 📊 Resource Inventory

### AWS Resources Created

| Resource Type | Count | Purpose |
|--------------|-------|---------|
| DynamoDB Tables | 6 | Data storage |
| Lambda Functions | 6 | Serverless compute |
| API Gateway REST APIs | 1 | API layer |
| Cognito User Pools | 1 | Authentication |
| S3 Buckets | 2 | File storage |
| CloudFront Distributions | 1 | CDN |
| Secrets Manager Secrets | 3 | Credential storage |
| IAM Roles | 7 | Access control |
| CloudWatch Log Groups | 6 | Logging |
| CloudWatch Alarms | 4 | Monitoring |

### Estimated Monthly Costs

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| Lambda | 1M requests/mo | $0.20 per 1M |
| API Gateway | 1M calls/mo | $3.50 per 1M |
| DynamoDB | 25 GB storage | $0.25 per GB |
| Cognito | 50K MAUs | $0.004 per MAU |
| S3 | 5 GB standard | $0.023 per GB |
| CloudFront | 1 TB transfer | $0.085 per GB |
| **Total (1K users)** | **$0** | **~$95/mo** |

---

## 🔧 Maintenance & Operations

### Daily Tasks

- Monitor CloudWatch dashboards
- Review error logs
- Check backup status

### Weekly Tasks

- Review cost reports
- Update security patches
- Test disaster recovery

### Monthly Tasks

- Rotate credentials
- Review IAM permissions
- Performance optimization
- Cost optimization

---

## 🚨 Disaster Recovery Plan

### Backup Strategy

- **DynamoDB**: Point-in-time recovery enabled (35 days)
- **S3**: Versioning enabled + lifecycle policies
- **Lambda**: Code versioned in Git + S3 artifacts
- **Cognito**: User pool configuration exported

### Recovery Time Objective (RTO): 4 hours
### Recovery Point Objective (RPO): 1 hour

### Recovery Steps

1. Deploy infrastructure from CDK code
2. Restore DynamoDB from point-in-time backup
3. Restore S3 from versioned objects
4. Update DNS if needed
5. Verify all endpoints

---

## ✅ Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Uptime | 99.9% | CloudWatch |
| API Latency | <200ms | X-Ray |
| Error Rate | <0.1% | CloudWatch |
| Page Load Time | <2s | CloudFront |
| Cost per User | <$0.10/mo | AWS Cost Explorer |

---

## 📞 Support Contacts

- **AWS Support**: https://console.aws.amazon.com/support
- **CDK Documentation**: https://docs.aws.amazon.com/cdk/
- **Cognito Guide**: https://docs.aws.amazon.com/cognito/
- **Emergency Escalation**: Your internal team contacts

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Owner**: Udodiri Social Club Development Team
