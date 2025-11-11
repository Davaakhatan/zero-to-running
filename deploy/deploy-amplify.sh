#!/bin/bash

# AWS Amplify Deployment Script (No Domain Required!)
# This script deploys using AWS Amplify for frontend (free default domain)
# and ECS/App Runner for backend

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="zero-to-running"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AWS Amplify Deployment${NC}"
echo -e "${BLUE}  (No Domain Required!)${NC}"
echo -e "${BLUE}  Project: ${PROJECT_NAME}${NC}"
echo -e "${BLUE}  Region: ${AWS_REGION}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
command -v aws >/dev/null 2>&1 || { echo -e "${RED}AWS CLI required${NC}"; exit 1; }
command -v git >/dev/null 2>&1 || { echo -e "${RED}Git required${NC}"; exit 1; }

if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}AWS credentials not configured. Run 'aws configure'${NC}"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS Account: ${AWS_ACCOUNT_ID}${NC}"
echo ""

# Step 1: Deploy Backend to App Runner (simpler than ECS)
echo -e "${BLUE}Step 1: Deploying Backend to App Runner...${NC}"
./deploy/scripts/amplify/01-deploy-backend-apprunner.sh "$AWS_REGION" "$AWS_ACCOUNT_ID" "$PROJECT_NAME"
BACKEND_URL=$(cat deploy/output/backend-url.txt 2>/dev/null || echo "")
echo ""

# Step 2: Deploy Frontend to Amplify
echo -e "${BLUE}Step 2: Deploying Frontend to AWS Amplify...${NC}"
./deploy/scripts/amplify/02-deploy-frontend-amplify.sh "$AWS_REGION" "$PROJECT_NAME" "$BACKEND_URL"
FRONTEND_URL=$(cat deploy/output/frontend-url.txt 2>/dev/null || echo "")
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Your Application URLs:${NC}"
echo -e "  Frontend: ${GREEN}${FRONTEND_URL}${NC}"
echo -e "  Backend:  ${GREEN}${BACKEND_URL}${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Wait 2-3 minutes for Amplify to finish building"
echo "2. Visit your frontend URL above"
echo "3. (Optional) Add custom domain in Amplify Console later"
echo ""

