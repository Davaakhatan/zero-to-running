#!/bin/bash

# Create Secrets in AWS Secrets Manager

set -e

AWS_REGION=$1
PROJECT_NAME=$2

RDS_INFO=$(cat deploy/output/rds-info.json)
REDIS_INFO=$(cat deploy/output/redis-info.json)

DB_ENDPOINT=$(echo "$RDS_INFO" | jq -r '.dbEndpoint')
DB_PASSWORD=$(echo "$RDS_INFO" | jq -r '.dbPassword')
REDIS_ENDPOINT=$(echo "$REDIS_INFO" | jq -r '.redisEndpoint')

echo "Creating secrets in Secrets Manager..."

# Database URL secret
DATABASE_URL="postgresql://admin:${DB_PASSWORD}@${DB_ENDPOINT}:5432/devenv"

aws secretsmanager create-secret \
  --name "${PROJECT_NAME}/database-url" \
  --description "Database connection URL for ${PROJECT_NAME}" \
  --secret-string "$DATABASE_URL" \
  --region "$AWS_REGION" 2>/dev/null || \
aws secretsmanager update-secret \
  --secret-id "${PROJECT_NAME}/database-url" \
  --secret-string "$DATABASE_URL" \
  --region "$AWS_REGION"

# Redis URL secret
REDIS_URL="redis://${REDIS_ENDPOINT}:6379"

aws secretsmanager create-secret \
  --name "${PROJECT_NAME}/redis-url" \
  --description "Redis connection URL for ${PROJECT_NAME}" \
  --secret-string "$REDIS_URL" \
  --region "$AWS_REGION" 2>/dev/null || \
aws secretsmanager update-secret \
  --secret-id "${PROJECT_NAME}/redis-url" \
  --secret-string "$REDIS_URL" \
  --region "$AWS_REGION"

echo "✓ Secrets created in Secrets Manager"

