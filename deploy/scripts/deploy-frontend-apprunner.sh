#!/bin/bash

# Deploy Frontend to App Runner (Alternative to Amplify)

set -e

AWS_REGION=${1:-us-east-1}
AWS_ACCOUNT_ID=${2:-$(aws sts get-caller-identity --query Account --output text)}
PROJECT_NAME=${3:-zero-to-running}
BACKEND_URL=${4:-"https://uqjptiyej9.us-east-1.awsapprunner.com"}

ECR_BASE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "Deploying Frontend to App Runner..."
echo "Region: $AWS_REGION"
echo "Account: $AWS_ACCOUNT_ID"
echo "Backend URL: $BACKEND_URL"
echo ""

# Create ECR repository for frontend
echo "Creating ECR repository for frontend..."
aws ecr create-repository \
  --repository-name "${PROJECT_NAME}-frontend" \
  --region "$AWS_REGION" \
  --image-scanning-configuration scanOnPush=true \
  2>/dev/null || echo "Repository exists"

echo "Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_BASE"

echo "Building frontend image..."
cd "$(dirname "$0")/../../.."
docker build -f Dockerfile.frontend.production \
  --build-arg NEXT_PUBLIC_API_URL="$BACKEND_URL" \
  -t "${PROJECT_NAME}-frontend:latest" .

echo "Tagging and pushing image..."
docker tag "${PROJECT_NAME}-frontend:latest" "${ECR_BASE}/${PROJECT_NAME}-frontend:latest"
docker push "${ECR_BASE}/${PROJECT_NAME}-frontend:latest"

# Check if IAM role exists
ROLE_NAME="${PROJECT_NAME}-apprunner-role"
ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ROLE_NAME}"

echo "Checking IAM role..."
if ! aws iam get-role --role-name "$ROLE_NAME" &>/dev/null; then
  echo "Creating IAM role..."
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "build.apprunner.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }' 2>/dev/null || echo "Role creation attempted"
  
  aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess \
    2>/dev/null || echo "Policy attachment attempted"
  
  echo "Waiting 5 seconds for IAM to propagate..."
  sleep 5
fi

# Create source config
cat > /tmp/frontend-source.json <<EOF
{
  "ImageRepository": {
    "ImageIdentifier": "${ECR_BASE}/${PROJECT_NAME}-frontend:latest",
    "ImageRepositoryType": "ECR",
    "ImageConfiguration": {
      "Port": "3000",
      "RuntimeEnvironmentVariables": {
        "NODE_ENV": "production",
        "NEXT_PUBLIC_API_URL": "${BACKEND_URL}"
      }
    }
  },
  "AutoDeploymentsEnabled": true,
  "AuthenticationConfiguration": {
    "AccessRoleArn": "${ROLE_ARN}"
  }
}
EOF

echo "Creating App Runner service for frontend..."
aws apprunner create-service \
  --service-name "${PROJECT_NAME}-frontend" \
  --source-configuration file:///tmp/frontend-source.json \
  --instance-configuration "Cpu=0.5 vCPU,Memory=1 GB" \
  --health-check-configuration "Protocol=HTTP,Path=/,Interval=10,Timeout=5,HealthyThreshold=1,UnhealthyThreshold=5" \
  --region "$AWS_REGION" \
  --output json > /tmp/frontend-create-output.json

if [ $? -eq 0 ]; then
  SERVICE_ARN=$(cat /tmp/frontend-create-output.json | jq -r '.Service.ServiceArn')
  echo ""
  echo "✅ Frontend service created successfully!"
  echo "Service ARN: $SERVICE_ARN"
  echo ""
  echo "Service is starting. It will take 2-3 minutes to be ready."
  echo ""
  echo "Check status:"
  echo "  aws apprunner describe-service --service-arn '$SERVICE_ARN' --region $AWS_REGION --query 'Service.{Status:Status,Url:ServiceUrl}'"
  
  # Save URL
  mkdir -p deploy/output
  aws apprunner describe-service --service-arn "$SERVICE_ARN" --region "$AWS_REGION" --query 'Service.ServiceUrl' --output text > deploy/output/frontend-url.txt 2>/dev/null || echo ""
  
  echo ""
  echo "Frontend URL will be available in 2-3 minutes!"
else
  echo ""
  echo "❌ Failed to create service"
  cat /tmp/frontend-create-output.json
  exit 1
fi

