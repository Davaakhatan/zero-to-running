#!/bin/bash

# Create RDS PostgreSQL Database

set -e

AWS_REGION=$1
PROJECT_NAME=$2

VPC_INFO=$(cat deploy/output/vpc-info.json)
VPC_ID=$(echo "$VPC_INFO" | jq -r '.vpcId')
PRIVATE_SUBNET_1=$(echo "$VPC_INFO" | jq -r '.privateSubnet1')
PRIVATE_SUBNET_2=$(echo "$VPC_INFO" | jq -r '.privateSubnet2')

echo "Creating DB subnet group..."

# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name "${PROJECT_NAME}-db-subnet" \
  --db-subnet-group-description "Subnet group for ${PROJECT_NAME} RDS" \
  --subnet-ids "$PRIVATE_SUBNET_1" "$PRIVATE_SUBNET_2" \
  --region "$AWS_REGION" 2>/dev/null || echo "DB subnet group already exists"

echo "Creating security group for RDS..."

# Create security group for RDS
DB_SG_ID=$(aws ec2 create-security-group \
  --group-name "${PROJECT_NAME}-db-sg" \
  --description "Security group for ${PROJECT_NAME} RDS" \
  --vpc-id "$VPC_ID" \
  --region "$AWS_REGION" \
  --query 'GroupId' --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${PROJECT_NAME}-db-sg" "Name=vpc-id,Values=${VPC_ID}" \
    --region "$AWS_REGION" \
    --query 'SecurityGroups[0].GroupId' --output text)

# Get backend security group ID (will be created later, but we'll update this)
# For now, allow from VPC CIDR
aws ec2 authorize-security-group-ingress \
  --group-id "$DB_SG_ID" \
  --protocol tcp \
  --port 5432 \
  --cidr 10.0.0.0/16 \
  --region "$AWS_REGION" 2>/dev/null || echo "Rule already exists"

echo "Creating RDS instance..."

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier "${PROJECT_NAME}-db" \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username admin \
  --master-user-password "$DB_PASSWORD" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids "$DB_SG_ID" \
  --db-subnet-group-name "${PROJECT_NAME}-db-subnet" \
  --backup-retention-period 7 \
  --publicly-accessible false \
  --storage-encrypted \
  --region "$AWS_REGION" \
  --no-multi-az || echo "RDS instance already exists"

echo "Waiting for RDS instance to be available (this may take 5-10 minutes)..."
aws rds wait db-instance-available \
  --db-instance-identifier "${PROJECT_NAME}-db" \
  --region "$AWS_REGION" || echo "RDS instance creation in progress..."

# Get RDS endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "${PROJECT_NAME}-db" \
  --region "$AWS_REGION" \
  --query 'DBInstances[0].Endpoint.Address' --output text)

# Save to file
cat > deploy/output/rds-info.json <<EOF
{
  "dbEndpoint": "$DB_ENDPOINT",
  "dbPassword": "$DB_PASSWORD",
  "securityGroupId": "$DB_SG_ID"
}
EOF

echo "✓ RDS PostgreSQL created"
echo "  Endpoint: $DB_ENDPOINT"
echo "  Password saved to deploy/output/rds-info.json"

