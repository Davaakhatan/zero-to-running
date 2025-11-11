#!/bin/bash

# Create VPC and Networking Components

set -e

AWS_REGION=$1
PROJECT_NAME=$2

echo "Creating VPC..."

# Create VPC
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --region "$AWS_REGION" \
  --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${PROJECT_NAME}-vpc}]" \
  --query 'Vpc.VpcId' --output text)

echo "VPC ID: $VPC_ID"

# Enable DNS hostnames
aws ec2 modify-vpc-attribute --vpc-id "$VPC_ID" --enable-dns-hostnames --region "$AWS_REGION"
aws ec2 modify-vpc-attribute --vpc-id "$VPC_ID" --enable-dns-support --region "$AWS_REGION"

# Get availability zones
AZ1=$(aws ec2 describe-availability-zones --region "$AWS_REGION" --query 'AvailabilityZones[0].ZoneName' --output text)
AZ2=$(aws ec2 describe-availability-zones --region "$AWS_REGION" --query 'AvailabilityZones[1].ZoneName' --output text)

# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway \
  --region "$AWS_REGION" \
  --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-igw}]" \
  --query 'InternetGateway.InternetGatewayId' --output text)

aws ec2 attach-internet-gateway --vpc-id "$VPC_ID" --internet-gateway-id "$IGW_ID" --region "$AWS_REGION"

# Create public subnets
PUBLIC_SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id "$VPC_ID" \
  --cidr-block 10.0.1.0/24 \
  --availability-zone "$AZ1" \
  --region "$AWS_REGION" \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-subnet-1}]" \
  --query 'Subnet.SubnetId' --output text)

PUBLIC_SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id "$VPC_ID" \
  --cidr-block 10.0.2.0/24 \
  --availability-zone "$AZ2" \
  --region "$AWS_REGION" \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-subnet-2}]" \
  --query 'Subnet.SubnetId' --output text)

# Create private subnets
PRIVATE_SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id "$VPC_ID" \
  --cidr-block 10.0.3.0/24 \
  --availability-zone "$AZ1" \
  --region "$AWS_REGION" \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-subnet-1}]" \
  --query 'Subnet.SubnetId' --output text)

PRIVATE_SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id "$VPC_ID" \
  --cidr-block 10.0.4.0/24 \
  --availability-zone "$AZ2" \
  --region "$AWS_REGION" \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-subnet-2}]" \
  --query 'Subnet.SubnetId' --output text)

# Allocate Elastic IP for NAT Gateway
EIP_ALLOC=$(aws ec2 allocate-address \
  --domain vpc \
  --region "$AWS_REGION" \
  --query 'AllocationId' --output text)

# Create NAT Gateway
NAT_GW_ID=$(aws ec2 create-nat-gateway \
  --subnet-id "$PUBLIC_SUBNET_1" \
  --allocation-id "$EIP_ALLOC" \
  --region "$AWS_REGION" \
  --tag-specifications "ResourceType=nat-gateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-nat}]" \
  --query 'NatGateway.NatGatewayId' --output text)

echo "Waiting for NAT Gateway to be available..."
aws ec2 wait nat-gateway-available --nat-gateway-ids "$NAT_GW_ID" --region "$AWS_REGION"

# Create route tables
PUBLIC_RT=$(aws ec2 create-route-table \
  --vpc-id "$VPC_ID" \
  --region "$AWS_REGION" \
  --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-rt}]" \
  --query 'RouteTable.RouteTableId' --output text)

PRIVATE_RT=$(aws ec2 create-route-table \
  --vpc-id "$VPC_ID" \
  --region "$AWS_REGION" \
  --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-rt}]" \
  --query 'RouteTable.RouteTableId' --output text)

# Add routes
aws ec2 create-route --route-table-id "$PUBLIC_RT" --destination-cidr-block 0.0.0.0/0 --gateway-id "$IGW_ID" --region "$AWS_REGION"
aws ec2 create-route --route-table-id "$PRIVATE_RT" --destination-cidr-block 0.0.0.0/0 --nat-gateway-id "$NAT_GW_ID" --region "$AWS_REGION"

# Associate subnets with route tables
aws ec2 associate-route-table --subnet-id "$PUBLIC_SUBNET_1" --route-table-id "$PUBLIC_RT" --region "$AWS_REGION"
aws ec2 associate-route-table --subnet-id "$PUBLIC_SUBNET_2" --route-table-id "$PUBLIC_RT" --region "$AWS_REGION"
aws ec2 associate-route-table --subnet-id "$PRIVATE_SUBNET_1" --route-table-id "$PRIVATE_RT" --region "$AWS_REGION"
aws ec2 associate-route-table --subnet-id "$PRIVATE_SUBNET_2" --route-table-id "$PRIVATE_RT" --region "$AWS_REGION"

# Save to file for other scripts
mkdir -p deploy/output
cat > deploy/output/vpc-info.json <<EOF
{
  "vpcId": "$VPC_ID",
  "publicSubnet1": "$PUBLIC_SUBNET_1",
  "publicSubnet2": "$PUBLIC_SUBNET_2",
  "privateSubnet1": "$PRIVATE_SUBNET_1",
  "privateSubnet2": "$PRIVATE_SUBNET_2",
  "natGatewayId": "$NAT_GW_ID"
}
EOF

echo "✓ VPC and networking created"
echo "  VPC ID: $VPC_ID"
echo "  Public Subnets: $PUBLIC_SUBNET_1, $PUBLIC_SUBNET_2"
echo "  Private Subnets: $PRIVATE_SUBNET_1, $PRIVATE_SUBNET_2"

