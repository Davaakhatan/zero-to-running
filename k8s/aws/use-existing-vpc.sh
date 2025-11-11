#!/bin/bash
# Deploy to EKS using an existing VPC
# This avoids hitting VPC limits

set -e

AWS_REGION=${AWS_REGION:-us-east-1}
CLUSTER_NAME=${CLUSTER_NAME:-dev-env-cluster}

echo "🔧 EKS Deployment with Existing VPC"
echo "===================================="
echo ""

# List available VPCs
echo "📋 Available VPCs in $AWS_REGION:"
aws ec2 describe-vpcs --region $AWS_REGION \
  --query 'Vpcs[*].[VpcId,Tags[?Key==`Name`].Value|[0],CidrBlock,IsDefault]' \
  --output table

echo ""
read -p "Enter VPC ID to use (or press Enter to use default VPC): " VPC_ID

if [ -z "$VPC_ID" ]; then
    # Use default VPC
    VPC_ID=$(aws ec2 describe-vpcs --region $AWS_REGION \
      --filters "Name=isDefault,Values=true" \
      --query 'Vpcs[0].VpcId' --output text)
    echo "Using default VPC: $VPC_ID"
fi

# Get subnets for the VPC
echo ""
echo "📋 Getting subnets for VPC $VPC_ID..."
SUBNETS=$(aws ec2 describe-subnets --region $AWS_REGION \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[*].SubnetId' --output text)

SUBNET_COUNT=$(echo $SUBNETS | wc -w | tr -d ' ')

if [ "$SUBNET_COUNT" -lt 2 ]; then
    echo "❌ Error: VPC needs at least 2 subnets in different AZs"
    echo "   Found: $SUBNET_COUNT subnet(s)"
    exit 1
fi

echo "✅ Found $SUBNET_COUNT subnets"
echo ""

# Create cluster config file
CLUSTER_CONFIG="/tmp/eks-cluster-config.yaml"
cat > $CLUSTER_CONFIG <<EOF
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: $CLUSTER_NAME
  region: $AWS_REGION

vpc:
  id: $VPC_ID
  subnets:
    public:
EOF

# Add public subnets
for subnet in $SUBNETS; do
    AZ=$(aws ec2 describe-subnets --region $AWS_REGION \
      --subnet-ids $subnet \
      --query 'Subnets[0].AvailabilityZone' --output text)
    echo "      $AZ: { id: $subnet }" >> $CLUSTER_CONFIG
done

cat >> $CLUSTER_CONFIG <<EOF

nodeGroups:
  - name: ng-1
    instanceType: t3.small
    desiredCapacity: 1
    minSize: 1
    maxSize: 2
    ssh:
      allow: false
EOF

echo "📝 Cluster configuration created: $CLUSTER_CONFIG"
echo ""
echo "🚀 Creating cluster with existing VPC..."
eksctl create cluster -f $CLUSTER_CONFIG

echo ""
echo "✅ Cluster created!"
echo "💡 Continue with the rest of the deployment steps from quick-test.sh"

