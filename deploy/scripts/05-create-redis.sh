#!/bin/bash

# Create ElastiCache Redis

set -e

AWS_REGION=$1
PROJECT_NAME=$2

VPC_INFO=$(cat deploy/output/vpc-info.json)
VPC_ID=$(echo "$VPC_INFO" | jq -r '.vpcId')
PRIVATE_SUBNET_1=$(echo "$VPC_INFO" | jq -r '.privateSubnet1')
PRIVATE_SUBNET_2=$(echo "$VPC_INFO" | jq -r '.privateSubnet2')

echo "Creating ElastiCache subnet group..."

# Create subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name "${PROJECT_NAME}-redis-subnet" \
  --cache-subnet-group-description "Subnet group for ${PROJECT_NAME} Redis" \
  --subnet-ids "$PRIVATE_SUBNET_1" "$PRIVATE_SUBNET_2" \
  --region "$AWS_REGION" 2>/dev/null || echo "Subnet group already exists"

echo "Creating security group for Redis..."

# Create security group
REDIS_SG_ID=$(aws ec2 create-security-group \
  --group-name "${PROJECT_NAME}-redis-sg" \
  --description "Security group for ${PROJECT_NAME} Redis" \
  --vpc-id "$VPC_ID" \
  --region "$AWS_REGION" \
  --query 'GroupId' --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${PROJECT_NAME}-redis-sg" "Name=vpc-id,Values=${VPC_ID}" \
    --region "$AWS_REGION" \
    --query 'SecurityGroups[0].GroupId' --output text)

# Allow from VPC
aws ec2 authorize-security-group-ingress \
  --group-id "$REDIS_SG_ID" \
  --protocol tcp \
  --port 6379 \
  --cidr 10.0.0.0/16 \
  --region "$AWS_REGION" 2>/dev/null || echo "Rule already exists"

echo "Creating ElastiCache cluster..."

# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id "${PROJECT_NAME}-redis" \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --vpc-security-group-ids "$REDIS_SG_ID" \
  --cache-subnet-group-name "${PROJECT_NAME}-redis-subnet" \
  --region "$AWS_REGION" 2>/dev/null || echo "Redis cluster already exists"

echo "Waiting for Redis cluster to be available (this may take 5-10 minutes)..."
aws elasticache wait cache-cluster-available \
  --cache-cluster-id "${PROJECT_NAME}-redis" \
  --region "$AWS_REGION" || echo "Redis cluster creation in progress..."

# Get Redis endpoint
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id "${PROJECT_NAME}-redis" \
  --show-cache-node-info \
  --region "$AWS_REGION" \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' --output text)

# Save to file
cat > deploy/output/redis-info.json <<EOF
{
  "redisEndpoint": "$REDIS_ENDPOINT",
  "securityGroupId": "$REDIS_SG_ID"
}
EOF

echo "✓ ElastiCache Redis created"
echo "  Endpoint: $REDIS_ENDPOINT"

