#!/bin/bash

# Check all prerequisites before deployment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Checking prerequisites..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not installed${NC}"
    echo "   Install: brew install awscli (Mac) or https://aws.amazon.com/cli/"
    exit 1
fi
echo -e "${GREEN}✅ AWS CLI installed${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not installed${NC}"
    echo "   Install: https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo -e "${GREEN}✅ Docker installed${NC}"

# Check Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "   Start Docker Desktop and try again"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "   Run: aws configure"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS credentials configured${NC}"
echo -e "   Account ID: ${AWS_ACCOUNT_ID}"

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}⚠️  Git not installed (needed for Amplify)${NC}"
else
    echo -e "${GREEN}✅ Git installed${NC}"
fi

echo ""
echo -e "${GREEN}All prerequisites met! Ready to deploy.${NC}"

