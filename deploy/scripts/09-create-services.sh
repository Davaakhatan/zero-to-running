#!/bin/bash

# Create ECS Services

set -e

AWS_REGION=$1
PROJECT_NAME=$2

VPC_INFO=$(cat deploy/output/vpc-info.json)
ALB_INFO=$(cat deploy/output/alb-info.json)

PRIVATE_SUBNET_1=$(echo "$VPC_INFO" | jq -r '.privateSubnet1')
PRIVATE_SUBNET_2=$(echo "$VPC_INFO" | jq -r '.privateSubnet2')
BACKEND_TG_ARN=$(echo "$ALB_INFO" | jq -r '.backendTargetGroupArn')
FRONTEND_TG_ARN=$(echo "$ALB_INFO" | jq -r '.frontendTargetGroupArn')

# Get security groups
DB_SG_ID=$(cat deploy/output/rds-info.json | jq -r '.securityGroupId')
REDIS_SG_ID=$(cat deploy/output/redis-info.json | jq -r '.securityGroupId')
ALB_SG_ID=$(echo "$ALB_INFO" | jq -r '.securityGroupId')

# Create security groups for ECS tasks
echo "Creating security groups for ECS tasks..."

# Backend security group
BACKEND_SG_ID=$(aws ec2 create-security-group \
  --group-name "${PROJECT_NAME}-backend-sg" \
  --description "Security group for ${PROJECT_NAME} backend tasks" \
  --vpc-id "$(echo "$VPC_INFO" | jq -r '.vpcId')" \
  --region "$AWS_REGION" \
  --query 'GroupId' --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${PROJECT_NAME}-backend-sg" \
    --region "$AWS_REGION" \
    --query 'SecurityGroups[0].GroupId' --output text)

# Allow from ALB
aws ec2 authorize-security-group-ingress \
  --group-id "$BACKEND_SG_ID" \
  --protocol tcp \
  --port 3003 \
  --source-group "$ALB_SG_ID" \
  --region "$AWS_REGION" 2>/dev/null || echo "Backend ingress rule exists"

# Allow to RDS and Redis
aws ec2 authorize-security-group-egress \
  --group-id "$BACKEND_SG_ID" \
  --protocol tcp \
  --port 5432 \
  --source-group "$DB_SG_ID" \
  --region "$AWS_REGION" 2>/dev/null || echo "DB egress rule exists"

aws ec2 authorize-security-group-egress \
  --group-id "$BACKEND_SG_ID" \
  --protocol tcp \
  --port 6379 \
  --source-group "$REDIS_SG_ID" \
  --region "$AWS_REGION" 2>/dev/null || echo "Redis egress rule exists"

# Frontend security group
FRONTEND_SG_ID=$(aws ec2 create-security-group \
  --group-name "${PROJECT_NAME}-frontend-sg" \
  --description "Security group for ${PROJECT_NAME} frontend tasks" \
  --vpc-id "$(echo "$VPC_INFO" | jq -r '.vpcId')" \
  --region "$AWS_REGION" \
  --query 'GroupId' --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${PROJECT_NAME}-frontend-sg" \
    --region "$AWS_REGION" \
    --query 'SecurityGroups[0].GroupId' --output text)

# Allow from ALB
aws ec2 authorize-security-group-ingress \
  --group-id "$FRONTEND_SG_ID" \
  --protocol tcp \
  --port 3000 \
  --source-group "$ALB_SG_ID" \
  --region "$AWS_REGION" 2>/dev/null || echo "Frontend ingress rule exists"

echo "Creating ECS services..."

# Create backend service
aws ecs create-service \
  --cluster "${PROJECT_NAME}-cluster" \
  --service-name "${PROJECT_NAME}-backend-service" \
  --task-definition "${PROJECT_NAME}-backend" \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[${PRIVATE_SUBNET_1},${PRIVATE_SUBNET_2}],securityGroups=[${BACKEND_SG_ID}],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=${BACKEND_TG_ARN},containerName=backend,containerPort=3003" \
  --health-check-grace-period-seconds 60 \
  --region "$AWS_REGION" 2>/dev/null || echo "Backend service already exists"

# Create frontend service
aws ecs create-service \
  --cluster "${PROJECT_NAME}-cluster" \
  --service-name "${PROJECT_NAME}-frontend-service" \
  --task-definition "${PROJECT_NAME}-frontend" \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[${PRIVATE_SUBNET_1},${PRIVATE_SUBNET_2}],securityGroups=[${FRONTEND_SG_ID}],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=${FRONTEND_TG_ARN},containerName=frontend,containerPort=3000" \
  --health-check-grace-period-seconds 60 \
  --region "$AWS_REGION" 2>/dev/null || echo "Frontend service already exists"

echo "✓ ECS services created"
echo "  Backend service: ${PROJECT_NAME}-backend-service"
echo "  Frontend service: ${PROJECT_NAME}-frontend-service"
echo ""
echo "Services are starting. This may take 5-10 minutes."
echo "Check status: aws ecs describe-services --cluster ${PROJECT_NAME}-cluster --services ${PROJECT_NAME}-backend-service ${PROJECT_NAME}-frontend-service --region $AWS_REGION"

