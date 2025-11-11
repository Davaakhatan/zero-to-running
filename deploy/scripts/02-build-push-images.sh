#!/bin/bash

# Build and Push Docker Images to ECR

set -e

AWS_REGION=$1
AWS_ACCOUNT_ID=$2
PROJECT_NAME=$3
API_DOMAIN=$4

ECR_BASE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_BASE"

echo "Building backend image..."
cd "$(dirname "$0")/../.."
docker build -f backend/Dockerfile.production -t "${PROJECT_NAME}-backend:latest" ./backend

echo "Tagging backend image..."
docker tag "${PROJECT_NAME}-backend:latest" "${ECR_BASE}/${PROJECT_NAME}-backend:latest"

echo "Pushing backend image..."
docker push "${ECR_BASE}/${PROJECT_NAME}-backend:latest"

echo "Building frontend image..."
docker build -f Dockerfile.frontend.production \
  --build-arg NEXT_PUBLIC_API_URL="https://${API_DOMAIN}" \
  -t "${PROJECT_NAME}-frontend:latest" .

echo "Tagging frontend image..."
docker tag "${PROJECT_NAME}-frontend:latest" "${ECR_BASE}/${PROJECT_NAME}-frontend:latest"

echo "Pushing frontend image..."
docker push "${ECR_BASE}/${PROJECT_NAME}-frontend:latest"

echo "✓ Images built and pushed to ECR"

