# Udodiri Young Social Club - Complete Application

![Udodiri Social Club Logo](https://i.postimg.cc/bJQgWxd8/udodiri-young-social-club.jpg)

## 🚀 Quick Start - One-Click Deployment

This repository contains a complete, production-ready social club management application with **one-click AWS deployment**.

### Prerequisites

- AWS Account with admin access
- Node.js 18+ installed
- AWS CLI configured (`aws configure`)
- AWS CDK installed (`npm install -g aws-cdk`)

### Deploy in 3 Steps

```bash
# 1. Navigate to the project directory
cd /workspace

# 2. Run the one-click deployment script
./deploy.sh

# 3. Wait ~15-20 minutes for deployment to complete
```

That's it! The script handles everything automatically.

## 📋 What Gets Deployed

The deployment script creates a complete serverless architecture on AWS:

- ✅ **6 DynamoDB Tables** - Database for users, meetings, announcements, calendar, subscriptions, financials
- ✅ **6 Lambda Functions** - Serverless backend API
- ✅ **API Gateway** - REST API with Cognito authentication
- ✅ **Cognito User Pool** - Secure user authentication
- ✅ **S3 + CloudFront** - Frontend hosting with global CDN
- ✅ **Secrets Manager** - Secure storage for API keys

## 💰 Cost

**Estimated cost: ~$10-15/month** (or **FREE** for first 12 months with AWS Free Tier!)

See [DEPLOYMENT_GUIDE.md](aws-architecture/DEPLOYMENT_GUIDE.md) for detailed cost breakdown and optimization tips.

## 🎨 Features

- 🔐 Secure authentication with AWS Cognito
- 📅 Meeting minutes management with Google Docs integration
- 📢 Announcements system (in-app, Gmail, chat)
- 🗓️ Event calendar with Google Calendar sync
- 💳 Premium subscriptions via Paystack & Flutterwave
- 📊 Financial tracking (dues, levies, funds, fines)
- 📱 Responsive design for mobile and desktop
- 🌍 Global CDN for fast loading worldwide

## 📁 Project Structure

```
/workspace/
├── deploy.sh                          # ⭐ One-click deployment script
├── README.md                          # This file
├── aws-architecture/
│   ├── DEPLOYMENT_GUIDE.md           # Detailed deployment guide
│   ├── README.md                     # Architecture documentation
│   ├── infrastructure/               # AWS CDK infrastructure code
│   │   ├── bin/
│   │   ├── lib/
│   │   └── lambda/                   # Backend Lambda functions
│   └── frontend/                     # React frontend
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   └── config/
│       └── public/
└── Udodiri-social-club-app.txt       # Original app specification
```

## 🔐 Post-Deployment Setup

After deployment completes:

1. **Update Secrets Manager** with your real credentials:
   - Google OAuth credentials
   - Paystack API keys
   - Flutterwave API keys

2. **Configure Google OAuth Console**:
   - Add your CloudFront domain as authorized redirect URI

3. **Visit your app** at the URL provided in the deployment output!

Detailed instructions are in [DEPLOYMENT_GUIDE.md](aws-architecture/DEPLOYMENT_GUIDE.md).

## 🧹 Cleanup

To avoid charges, delete all resources when done:

```bash
cd aws-architecture/infrastructure
cdk destroy --all --force
```

## 🆘 Troubleshooting

See the [DEPLOYMENT_GUIDE.md](aws-architecture/DEPLOYMENT_GUIDE.md) for common issues and solutions.

## 📞 Support

For issues or questions:
- Check AWS CloudWatch Logs for Lambda errors
- Review CloudFormation Events for deployment issues
- Verify AWS CLI credentials with `aws sts get-caller-identity`

---

**Built with ❤️ for Udodiri Young Social Club**

*100% AWS Native • Zero Third-Party Platforms • Low Cost • Production Ready*

## Project Structure

- `frontend/` - React/TypeScript frontend application
- `aws-architecture/` - AWS CDK infrastructure code
- `docs/code-templates/` - Code templates and implementation guides
- `deploy.sh` - Deployment script

## Getting Started

1. Install dependencies: `npm install`
2. Review code templates in `docs/code-templates/`
3. Deploy infrastructure: `./deploy.sh`


## Project Structure

- `frontend/` - React/TypeScript frontend application
- `aws-architecture/` - AWS CDK infrastructure code
- `docs/code-templates/` - Code templates and implementation guides
- `deploy.sh` - Deployment script

## Getting Started

1. Install dependencies: `npm install`
2. Review code templates in `docs/code-templates/`
3. Deploy infrastructure: `./deploy.sh`

