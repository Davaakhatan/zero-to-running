#!/bin/bash
# Build and push Dashboard Frontend Docker image to ECR

set -e

AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/dev-env-dashboard-frontend"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "🐳 Building and pushing Dashboard Frontend to ECR"
echo "==========================================="
echo "ECR Repository: $ECR_REPO"
echo ""

# Check if ECR repo exists, create if not
echo "📦 Checking ECR repository..."
if ! aws ecr describe-repositories --repository-names dev-env-dashboard-frontend --region $AWS_REGION >/dev/null 2>&1; then
    echo "  Creating ECR repository..."
    aws ecr create-repository \
        --repository-name dev-env-dashboard-frontend \
        --region $AWS_REGION \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256
    echo "  ✅ Repository created"
else
    echo "  ✅ Repository exists"
fi

# Login to ECR
echo ""
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

# Build image
echo ""
echo "🔨 Building Dashboard Frontend Docker image..."
cd "$PROJECT_ROOT/dashboard-frontend"
docker build -t dev-env-dashboard-frontend:latest .

# Tag for ECR
echo ""
echo "🏷️  Tagging image..."
docker tag dev-env-dashboard-frontend:latest $ECR_REPO:latest

# Push to ECR
echo ""
echo "📤 Pushing to ECR (this may take a few minutes)..."
docker push $ECR_REPO:latest

echo ""
echo "✅ Dashboard Frontend image pushed successfully!"
echo "   Image: $ECR_REPO:latest"
