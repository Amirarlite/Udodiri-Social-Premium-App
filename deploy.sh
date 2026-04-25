#!/bin/bash

# ============================================================================
# Udodiri Social Club - One-Click AWS Deployment Script
# ============================================================================
# This script automates the complete deployment of the Udodiri Social Club
# application to AWS using 100% AWS-native services.
#
# Prerequisites:
# - AWS Account with admin access
# - AWS CLI configured (aws configure)
# - Node.js 18+ installed
# - AWS CDK installed (npm install -g aws-cdk)
#
# Usage: ./deploy.sh
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-1"
STACK_NAME="UdodiriSocialClubStack"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$PROJECT_ROOT/aws-architecture/infrastructure"
FRONTEND_DIR="$PROJECT_ROOT/aws-architecture/frontend"

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

# ============================================================================
# Step 1: Check Prerequisites
# ============================================================================

echo ""
echo "============================================================================"
echo "  Udodiri Social Club - AWS Deployment"
echo "============================================================================"
echo ""

log_info "Step 1/8: Checking prerequisites..."

check_command "node"
check_command "npm"
check_command "aws"
check_command "cdk"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
log_success "AWS Account ID: $AWS_ACCOUNT_ID"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi
log_success "Node.js version: $(node -v)"

log_success "All prerequisites met!"
echo ""

# ============================================================================
# Step 2: Install Dependencies
# ============================================================================

log_info "Step 2/8: Installing dependencies..."

cd "$INFRA_DIR"
if [ ! -d "node_modules" ]; then
    npm install
    log_success "Infrastructure dependencies installed"
else
    log_info "Infrastructure dependencies already installed"
fi

cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    npm install
    log_success "Frontend dependencies installed"
else
    log_info "Frontend dependencies already installed"
fi

echo ""

# ============================================================================
# Step 3: Bootstrap AWS CDK
# ============================================================================

log_info "Step 3/8: Bootstrapping AWS CDK..."

cd "$INFRA_DIR"
cdk bootstrap aws://${AWS_ACCOUNT_ID}/${AWS_REGION} || {
    log_warning "Bootstrap may have already been completed"
}

log_success "AWS CDK bootstrapped"
echo ""

# ============================================================================
# Step 4: Create Secrets in AWS Secrets Manager
# ============================================================================

log_info "Step 4/8: Creating secrets in AWS Secrets Manager..."

# Google OAuth credentials
log_info "Creating Google OAuth secret..."
aws secretsmanager create-secret \
    --name udodiri-google-credentials \
    --secret-string '{"clientId":"YOUR_GOOGLE_CLIENT_ID","clientSecret":"YOUR_GOOGLE_CLIENT_SECRET","apiKey":"YOUR_GOOGLE_API_KEY"}' \
    2>/dev/null || log_warning "Google secret may already exist"

# Paystack credentials
log_info "Creating Paystack secret..."
aws secretsmanager create-secret \
    --name udodiri-paystack-credentials \
    --secret-string '{"publicKey":"pk_live_XXX","secretKey":"sk_live_XXX"}' \
    2>/dev/null || log_warning "Paystack secret may already exist"

# Flutterwave credentials
log_info "Creating Flutterwave secret..."
aws secretsmanager create-secret \
    --name udodiri-flutterwave-credentials \
    --secret-string '{"publicKey":"FLWPUBK_XXX","secretKey":"FLWSECK_XXX"}' \
    2>/dev/null || log_warning "Flutterwave secret may already exist"

log_success "Secrets created (update with your actual credentials later)"
echo ""

# ============================================================================
# Step 5: Deploy Infrastructure with CDK
# ============================================================================

log_info "Step 5/8: Deploying infrastructure with AWS CDK..."
log_warning "This may take 10-15 minutes..."

cd "$INFRA_DIR"
cdk deploy --require-approval never

log_success "Infrastructure deployed successfully!"
echo ""

# ============================================================================
# Step 6: Get Stack Outputs
# ============================================================================

log_info "Step 6/8: Retrieving stack outputs..."

CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomain'].OutputValue" \
    --output text)

USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" \
    --output text)

USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" \
    --output text)

API_GATEWAY_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" \
    --output text)

CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
    --output text)

FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
    --output text)

DOCUMENTS_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='DocumentsBucketName'].OutputValue" \
    --output text)

log_success "Stack outputs retrieved:"
echo "  - CloudFront Domain: $CLOUDFRONT_DOMAIN"
echo "  - User Pool ID: $USER_POOL_ID"
echo "  - User Pool Client ID: $USER_POOL_CLIENT_ID"
echo "  - API Gateway URL: $API_GATEWAY_URL"
echo "  - CloudFront Distribution ID: $CLOUDFRONT_DISTRIBUTION_ID"
echo ""

# ============================================================================
# Step 7: Update Cognito User Pool Client
# ============================================================================

log_info "Step 7/8: Updating Cognito User Pool Client..."

aws cognito-idp update-user-pool-client \
    --user-pool-id "$USER_POOL_ID" \
    --client-id "$USER_POOL_CLIENT_ID" \
    --callback-urls "https://${CLOUDFRONT_DOMAIN}" \
    --logout-urls "https://${CLOUDFRONT_DOMAIN}" \
    --allowed-o-auth-flows "code" \
    --allowed-o-auth-scopes "openid" "email" "profile" \
    --allowed-o-auth-flows-user-pool-client

log_success "Cognito User Pool Client updated"
echo ""

# ============================================================================
# Step 8: Build and Deploy Frontend
# ============================================================================

log_info "Step 8/8: Building and deploying frontend..."

cd "$FRONTEND_DIR"

# Create .env file
cat > .env << EOF
VITE_AWS_REGION=${AWS_REGION}
VITE_USER_POOL_ID=${USER_POOL_ID}
VITE_USER_POOL_CLIENT_ID=${USER_POOL_CLIENT_ID}
VITE_API_GATEWAY_URL=${API_GATEWAY_URL}
VITE_CLOUDFRONT_DOMAIN=${CLOUDFRONT_DOMAIN}
EOF

log_info "Environment file created"

# Build production bundle
log_info "Building frontend..."
npm run build

# Deploy to S3
log_info "Deploying to S3..."
aws s3 sync dist/ s3://${FRONTEND_BUCKET} --delete

# Invalidate CloudFront cache
log_info "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/*"

log_success "Frontend deployed successfully!"
echo ""

# ============================================================================
# Deployment Complete
# ============================================================================

echo ""
echo "============================================================================"
echo "  🎉 DEPLOYMENT COMPLETE!"
echo "============================================================================"
echo ""
echo "Your Udodiri Social Club application is now live on AWS!"
echo ""
echo "📱 Application URL: https://${CLOUDFRONT_DOMAIN}"
echo "🔐 Cognito User Pool: ${USER_POOL_ID}"
echo "🌐 API Gateway: ${API_GATEWAY_URL}"
echo "📦 Frontend Bucket: ${FRONTEND_BUCKET}"
echo "📄 Documents Bucket: ${DOCUMENTS_BUCKET}"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo ""
echo "1. Update Secrets Manager with your actual credentials:"
echo "   - Google OAuth (udodiri-google-credentials)"
echo "   - Paystack (udodiri-paystack-credentials)"
echo "   - Flutterwave (udodiri-flutterwave-credentials)"
echo ""
echo "2. Configure your Google OAuth Console:"
echo "   - Add authorized redirect URI: https://${CLOUDFRONT_DOMAIN}"
echo ""
echo "3. Test the application by visiting: https://${CLOUDFRONT_DOMAIN}"
echo ""
echo "4. To destroy all resources (avoid charges):"
echo "   cd ${INFRA_DIR} && cdk destroy --all --force"
echo ""
echo "============================================================================"
echo ""

log_success "Deployment completed successfully!"

exit 0
