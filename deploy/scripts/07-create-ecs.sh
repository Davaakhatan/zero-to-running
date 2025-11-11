#!/bin/bash

# Create ECS Cluster and Task Definitions

set -e

AWS_REGION=$1
AWS_ACCOUNT_ID=$2
PROJECT_NAME=$3
FRONTEND_DOMAIN=$4
API_DOMAIN=$5

ECR_BASE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "Creating ECS cluster..."
aws ecs create-cluster \
  --cluster-name "${PROJECT_NAME}-cluster" \
  --region "$AWS_REGION" \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
  2>/dev/null || echo "Cluster already exists"

echo "Creating IAM role for ECS tasks..."

# Create IAM role for ECS task execution
aws iam create-role \
  --role-name "${PROJECT_NAME}-ecs-task-role" \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' 2>/dev/null || echo "Role already exists"

# Attach policy
aws iam attach-role-policy \
  --role-name "${PROJECT_NAME}-ecs-task-role" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy \
  2>/dev/null || echo "Policy already attached"

# Add Secrets Manager access
cat > /tmp/secrets-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "secretsmanager:GetSecretValue"
    ],
    "Resource": [
      "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:${PROJECT_NAME}/*"
    ]
  }]
}
EOF

aws iam put-role-policy \
  --role-name "${PROJECT_NAME}-ecs-task-role" \
  --policy-name SecretsManagerAccess \
  --policy-document file:///tmp/secrets-policy.json \
  2>/dev/null || echo "Secrets policy already exists"

ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${PROJECT_NAME}-ecs-task-role"

echo "Creating CloudWatch log groups..."
aws logs create-log-group \
  --log-group-name "/ecs/${PROJECT_NAME}-backend" \
  --region "$AWS_REGION" 2>/dev/null || echo "Log group exists"

aws logs create-log-group \
  --log-group-name "/ecs/${PROJECT_NAME}-frontend" \
  --region "$AWS_REGION" 2>/dev/null || echo "Log group exists"

echo "Creating backend task definition..."

# Backend task definition
cat > /tmp/backend-task-def.json <<EOF
{
  "family": "${PROJECT_NAME}-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "${ROLE_ARN}",
  "taskRoleArn": "${ROLE_ARN}",
  "containerDefinitions": [{
    "name": "backend",
    "image": "${ECR_BASE}/${PROJECT_NAME}-backend:latest",
    "portMappings": [{
      "containerPort": 3003,
      "protocol": "tcp"
    }],
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "PORT", "value": "3003"},
      {"name": "HOST", "value": "0.0.0.0"},
      {"name": "FRONTEND_URL", "value": "https://${FRONTEND_DOMAIN}"},
      {"name": "LOG_LEVEL", "value": "info"}
    ],
    "secrets": [
      {
        "name": "DATABASE_URL",
        "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:${PROJECT_NAME}/database-url"
      },
      {
        "name": "REDIS_URL",
        "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:${PROJECT_NAME}/redis-url"
      }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/${PROJECT_NAME}-backend",
        "awslogs-region": "${AWS_REGION}",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "healthCheck": {
      "command": ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3003/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""],
      "interval": 30,
      "timeout": 5,
      "retries": 3,
      "startPeriod": 60
    }
  }]
}
EOF

aws ecs register-task-definition \
  --cli-input-json file:///tmp/backend-task-def.json \
  --region "$AWS_REGION"

echo "Creating frontend task definition..."

# Frontend task definition
cat > /tmp/frontend-task-def.json <<EOF
{
  "family": "${PROJECT_NAME}-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "${ROLE_ARN}",
  "taskRoleArn": "${ROLE_ARN}",
  "containerDefinitions": [{
    "name": "frontend",
    "image": "${ECR_BASE}/${PROJECT_NAME}-frontend:latest",
    "portMappings": [{
      "containerPort": 3000,
      "protocol": "tcp"
    }],
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "NEXT_PUBLIC_API_URL", "value": "https://${API_DOMAIN}"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/${PROJECT_NAME}-frontend",
        "awslogs-region": "${AWS_REGION}",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "healthCheck": {
      "command": ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""],
      "interval": 30,
      "timeout": 5,
      "retries": 3,
      "startPeriod": 60
    }
  }]
}
EOF

aws ecs register-task-definition \
  --cli-input-json file:///tmp/frontend-task-def.json \
  --region "$AWS_REGION"

echo "✓ ECS cluster and task definitions created"

