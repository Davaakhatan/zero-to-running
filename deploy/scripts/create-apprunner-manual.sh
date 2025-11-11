#!/bin/bash

# Manual App Runner service creation with better error handling

set -e

AWS_REGION=${1:-us-east-1}
AWS_ACCOUNT_ID=${2:-$(aws sts get-caller-identity --query Account --output text)}
PROJECT_NAME=${3:-zero-to-running}

ECR_BASE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "Creating App Runner service manually..."
echo "Region: $AWS_REGION"
echo "Account: $AWS_ACCOUNT_ID"
echo "Project: $PROJECT_NAME"
echo ""

# Check if IAM role exists (for ECR access) - MUST be done first
ROLE_NAME="${PROJECT_NAME}-apprunner-role"
ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ROLE_NAME}"

echo "Checking IAM role..."
if aws iam get-role --role-name "$ROLE_NAME" &>/dev/null; then
  echo "✓ Role exists: $ROLE_ARN"
else
  echo "Creating IAM role for ECR access..."
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
  
  echo "✓ Role created/updated"
  echo "Waiting 5 seconds for IAM to propagate..."
  sleep 5
fi

echo ""

# Now create source config with access role (after ROLE_ARN is defined)
cat > /tmp/apprunner-source.json <<EOF
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

echo "Source configuration:"
cat /tmp/apprunner-source.json
echo ""

echo "Creating App Runner service..."
echo "This may take 30-60 seconds..."

# Create service with explicit output
aws apprunner create-service \
  --service-name "${PROJECT_NAME}-backend" \
  --source-configuration file:///tmp/apprunner-source.json \
  --instance-configuration "Cpu=0.5 vCPU,Memory=1 GB" \
  --health-check-configuration "Protocol=HTTP,Path=/health,Interval=10,Timeout=5,HealthyThreshold=1,UnhealthyThreshold=5" \
  --region "$AWS_REGION" \
  --output json > /tmp/apprunner-create-output.json

if [ $? -eq 0 ]; then
  SERVICE_ARN=$(cat /tmp/apprunner-create-output.json | jq -r '.Service.ServiceArn')
  echo ""
  echo "✅ Service created successfully!"
  echo "Service ARN: $SERVICE_ARN"
  echo ""
  echo "Service is starting. It will take 2-3 minutes to be ready."
  echo ""
  echo "Check status with:"
  echo "  aws apprunner describe-service --service-arn '$SERVICE_ARN' --region $AWS_REGION --query 'Service.{Status:Status,Url:ServiceUrl}'"
  echo ""
  echo "Or use the status checker:"
  echo "  ./deploy/scripts/check-backend-status.sh"
else
  echo ""
  echo "❌ Failed to create service"
  echo "Check output:"
  cat /tmp/apprunner-create-output.json
  exit 1
fi

