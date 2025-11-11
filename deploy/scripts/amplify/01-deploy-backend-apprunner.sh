#!/bin/bash

# Deploy Backend to AWS App Runner (Simpler than ECS, no domain needed)

set -e

AWS_REGION=$1
AWS_ACCOUNT_ID=$2
PROJECT_NAME=$3

ECR_BASE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "Creating ECR repository for backend..."
aws ecr create-repository \
  --repository-name "${PROJECT_NAME}-backend" \
  --region "$AWS_REGION" \
  --image-scanning-configuration scanOnPush=true \
  2>/dev/null || echo "Repository exists"

echo "Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_BASE"

echo "Building backend image..."
cd "$(dirname "$0")/../../.."
docker build -f backend/Dockerfile.production -t "${PROJECT_NAME}-backend:latest" ./backend

echo "Tagging and pushing image..."
docker tag "${PROJECT_NAME}-backend:latest" "${ECR_BASE}/${PROJECT_NAME}-backend:latest"
docker push "${ECR_BASE}/${PROJECT_NAME}-backend:latest"

echo "Creating App Runner service..."

# Create IAM role for App Runner
ROLE_NAME="${PROJECT_NAME}-apprunner-role"
aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "build.apprunner.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' 2>/dev/null || echo "Role exists"

aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess \
  2>/dev/null || echo "Policy attached"

ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ROLE_NAME}"

# Create App Runner service configuration
cat > /tmp/apprunner-config.json <<EOF
{
  "ImageRepository": {
    "ImageIdentifier": "${ECR_BASE}/${PROJECT_NAME}-backend:latest",
    "ImageRepositoryType": "ECR",
    "ImageConfiguration": {
      "Port": "3003",
      "RuntimeEnvironmentVariables": {
        "NODE_ENV": "production",
        "PORT": "3003",
        "HOST": "0.0.0.0",
        "LOG_LEVEL": "info"
      }
    }
  },
  "AutoDeploymentsEnabled": true,
  "Source": {
    "ImageRepository": {
      "ImageIdentifier": "${ECR_BASE}/${PROJECT_NAME}-backend:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "3003",
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production",
          "PORT": "3003",
          "HOST": "0.0.0.0",
          "LOG_LEVEL": "info"
        }
      },
      "ImageRepositoryType": "ECR"
    }
  },
  "InstanceConfiguration": {
    "Cpu": "0.5 vCPU",
    "Memory": "1 GB"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }
}
EOF

# Check if service already exists
EXISTING_SERVICE=$(aws apprunner list-services --region "$AWS_REGION" --query "ServiceSummaryList[?ServiceName=='${PROJECT_NAME}-backend'].ServiceArn" --output text)

if [ -n "$EXISTING_SERVICE" ] && [ "$EXISTING_SERVICE" != "None" ]; then
  echo "Service already exists, using existing service..."
  SERVICE_ARN="$EXISTING_SERVICE"
else
  echo "Creating App Runner service..."
  
  # Get role ARN for ECR access
  ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${PROJECT_NAME}-apprunner-role"
  
  # Create source configuration JSON file with access role
  cat > /tmp/source-config.json <<EOF
{
  "ImageRepository": {
    "ImageIdentifier": "${ECR_BASE}/${PROJECT_NAME}-backend:latest",
    "ImageRepositoryType": "ECR",
    "ImageConfiguration": {
      "Port": "3003",
      "RuntimeEnvironmentVariables": {
        "NODE_ENV": "production",
        "PORT": "3003",
        "HOST": "0.0.0.0",
        "LOG_LEVEL": "info"
      }
    }
  },
  "AutoDeploymentsEnabled": true,
  "AuthenticationConfiguration": {
    "AccessRoleArn": "${ROLE_ARN}"
  }
}
EOF

  # Create App Runner service
  echo "Creating service with configuration..."
  CREATE_OUTPUT=$(aws apprunner create-service \
    --service-name "${PROJECT_NAME}-backend" \
    --source-configuration file:///tmp/source-config.json \
    --instance-configuration "Cpu=0.5 vCPU,Memory=1 GB" \
    --health-check-configuration "Protocol=HTTP,Path=/health,Interval=10,Timeout=5,HealthyThreshold=1,UnhealthyThreshold=5" \
    --region "$AWS_REGION" 2>&1)
  
  if [ $? -eq 0 ]; then
    SERVICE_ARN=$(echo "$CREATE_OUTPUT" | grep -oP '"ServiceArn":\s*"\K[^"]+' || echo "$CREATE_OUTPUT" | jq -r '.Service.ServiceArn' 2>/dev/null || echo "")
  else
    echo "Create service output: $CREATE_OUTPUT"
    SERVICE_ARN=""
  fi
  
  # If creation failed or ARN is empty, check if service exists
  if [ -z "$SERVICE_ARN" ] || [ "$SERVICE_ARN" = "None" ] || [ "$SERVICE_ARN" = "null" ]; then
    echo "Service creation may have failed or service already exists. Checking..."
    SERVICE_ARN=$(aws apprunner list-services --region "$AWS_REGION" --query "ServiceSummaryList[?ServiceName=='${PROJECT_NAME}-backend'].ServiceArn" --output text 2>/dev/null || echo "")
    
    if [ -z "$SERVICE_ARN" ] || [ "$SERVICE_ARN" = "None" ]; then
      echo ""
      echo "❌ Failed to create App Runner service."
      echo "Error output: $CREATE_OUTPUT"
      echo ""
      echo "Please check:"
      echo "1. AWS Console: https://console.aws.amazon.com/apprunner"
      echo "2. IAM permissions for App Runner"
      echo "3. ECR image exists: aws ecr describe-images --repository-name ${PROJECT_NAME}-backend --region $AWS_REGION"
      exit 1
    else
      echo "✓ Service already exists, using existing service"
    fi
  else
    echo "✓ Service created successfully"
  fi
fi

echo "Service ARN: $SERVICE_ARN"
echo "Waiting for service to be ready (this may take 2-3 minutes)..."
sleep 60

# Wait for service to be in RUNNING state
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  STATUS=$(aws apprunner describe-service \
    --service-arn "$SERVICE_ARN" \
    --region "$AWS_REGION" \
    --query 'Service.Status' --output text 2>/dev/null || echo "NOT_FOUND")
  
  if [ "$STATUS" = "RUNNING" ]; then
    break
  fi
  
  echo "Service status: $STATUS (waiting...)"
  sleep 10
  ATTEMPT=$((ATTEMPT + 1))
done

# Get service URL
SERVICE_URL=$(aws apprunner describe-service \
  --service-arn "$SERVICE_ARN" \
  --region "$AWS_REGION" \
  --query 'Service.ServiceUrl' --output text 2>/dev/null || echo "")

mkdir -p deploy/output
echo "$SERVICE_URL" > deploy/output/backend-url.txt

echo "✓ Backend deployed to App Runner"
echo "  URL: $SERVICE_URL"

