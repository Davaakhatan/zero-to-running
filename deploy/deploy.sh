#!/bin/bash

# AWS Deployment Script for Zero-to-Running Developer Environment
# This script automates the deployment process to AWS

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="zero-to-running"
FRONTEND_DOMAIN=${FRONTEND_DOMAIN:-"yourdomain.com"}
API_DOMAIN=${API_DOMAIN:-"api.yourdomain.com"}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AWS Deployment Script${NC}"
echo -e "${BLUE}  Project: ${PROJECT_NAME}${NC}"
echo -e "${BLUE}  Region: ${AWS_REGION}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

command -v aws >/dev/null 2>&1 || { echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}" >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is not installed. Please install it first.${NC}" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo -e "${YELLOW}jq is not installed. Some features may not work.${NC}" >&2; }

# Check AWS credentials
echo -e "${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"
echo ""

# Step 1: Create ECR Repositories
echo -e "${BLUE}Step 1: Creating ECR Repositories...${NC}"
./deploy/scripts/01-create-ecr.sh "$AWS_REGION" "$PROJECT_NAME"
echo ""

# Step 2: Build and Push Docker Images
echo -e "${BLUE}Step 2: Building and Pushing Docker Images...${NC}"
./deploy/scripts/02-build-push-images.sh "$AWS_REGION" "$AWS_ACCOUNT_ID" "$PROJECT_NAME" "$API_DOMAIN"
echo ""

# Step 3: Create VPC and Networking
echo -e "${BLUE}Step 3: Creating VPC and Networking...${NC}"
./deploy/scripts/03-create-vpc.sh "$AWS_REGION" "$PROJECT_NAME"
echo ""

# Step 4: Create RDS PostgreSQL
echo -e "${BLUE}Step 4: Creating RDS PostgreSQL Database...${NC}"
./deploy/scripts/04-create-rds.sh "$AWS_REGION" "$PROJECT_NAME"
echo ""

# Step 5: Create ElastiCache Redis
echo -e "${BLUE}Step 5: Creating ElastiCache Redis...${NC}"
./deploy/scripts/05-create-redis.sh "$AWS_REGION" "$PROJECT_NAME"
echo ""

# Step 6: Create Secrets in Secrets Manager
echo -e "${BLUE}Step 6: Creating Secrets in Secrets Manager...${NC}"
./deploy/scripts/06-create-secrets.sh "$AWS_REGION" "$PROJECT_NAME"
echo ""

# Step 7: Create ECS Cluster and Task Definitions
echo -e "${BLUE}Step 7: Creating ECS Cluster and Task Definitions...${NC}"
./deploy/scripts/07-create-ecs.sh "$AWS_REGION" "$AWS_ACCOUNT_ID" "$PROJECT_NAME" "$FRONTEND_DOMAIN" "$API_DOMAIN"
echo ""

# Step 8: Create Application Load Balancer
echo -e "${BLUE}Step 8: Creating Application Load Balancer...${NC}"
./deploy/scripts/08-create-alb.sh "$AWS_REGION" "$PROJECT_NAME"
echo ""

# Step 9: Create ECS Services
echo -e "${BLUE}Step 9: Creating ECS Services...${NC}"
./deploy/scripts/09-create-services.sh "$AWS_REGION" "$PROJECT_NAME"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Wait for services to become healthy (5-10 minutes)"
echo "2. Get ALB DNS name: aws elbv2 describe-load-balancers --names ${PROJECT_NAME}-alb --region ${AWS_REGION}"
echo "3. Configure Route53 DNS records pointing to ALB"
echo "4. Update CORS in backend to allow your frontend domain"
echo "5. Test the application: https://${FRONTEND_DOMAIN}"
echo ""

