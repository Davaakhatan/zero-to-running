#!/bin/bash

# Create ECR Repositories

set -e

AWS_REGION=$1
PROJECT_NAME=$2

echo "Creating ECR repositories..."

# Create backend repository
aws ecr describe-repositories --repository-names "${PROJECT_NAME}-backend" --region "$AWS_REGION" >/dev/null 2>&1 || \
aws ecr create-repository \
  --repository-name "${PROJECT_NAME}-backend" \
  --region "$AWS_REGION" \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256 \
  --image-tag-mutability MUTABLE

# Create frontend repository
aws ecr describe-repositories --repository-names "${PROJECT_NAME}-frontend" --region "$AWS_REGION" >/dev/null 2>&1 || \
aws ecr create-repository \
  --repository-name "${PROJECT_NAME}-frontend" \
  --region "$AWS_REGION" \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256 \
  --image-tag-mutability MUTABLE

echo "✓ ECR repositories created"

