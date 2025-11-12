#!/bin/bash
# Build and push App Frontend Docker image to ECR

set -e

AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/dev-env-app-frontend"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "🐳 Building and pushing App Frontend to ECR"
echo "==========================================="
echo "ECR Repository: $ECR_REPO"
echo ""

# Check if ECR repo exists, create if not
echo "📦 Checking ECR repository..."
if ! aws ecr describe-repositories --repository-names dev-env-app-frontend --region $AWS_REGION >/dev/null 2>&1; then
    echo "  Creating ECR repository..."
    aws ecr create-repository \
        --repository-name dev-env-app-frontend \
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
echo "🔨 Building App Frontend Docker image..."
cd "$PROJECT_ROOT/app-frontend"

# Get backend LoadBalancer URL if backend is exposed
BACKEND_LB=$(kubectl get svc backend-service -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
BACKEND_URL=""
if [ -n "$BACKEND_LB" ]; then
    BACKEND_URL="http://$BACKEND_LB:3003"
    echo "  Using backend LoadBalancer URL: $BACKEND_URL"
else
    echo "  ⚠️  Backend LoadBalancer not found. App Frontend will use localhost:3003 (may not work via LoadBalancer)"
    echo "  💡 Expose backend as LoadBalancer first, then rebuild App Frontend"
    BACKEND_URL="http://backend-service:3003"
fi

# Build with backend URL
docker build \
  --build-arg NEXT_PUBLIC_API_URL="$BACKEND_URL" \
  -t dev-env-app-frontend:latest .

# Tag for ECR
echo ""
echo "🏷️  Tagging image..."
docker tag dev-env-app-frontend:latest $ECR_REPO:latest

# Push to ECR
echo ""
echo "📤 Pushing to ECR (this may take a few minutes)..."
docker push $ECR_REPO:latest

echo ""
echo "✅ App Frontend image pushed successfully!"
echo "   Image: $ECR_REPO:latest"

