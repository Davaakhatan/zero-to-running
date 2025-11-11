#!/bin/bash

# Create Application Load Balancer

set -e

AWS_REGION=$1
PROJECT_NAME=$2

VPC_INFO=$(cat deploy/output/vpc-info.json)
VPC_ID=$(echo "$VPC_INFO" | jq -r '.vpcId')
PUBLIC_SUBNET_1=$(echo "$VPC_INFO" | jq -r '.publicSubnet1')
PUBLIC_SUBNET_2=$(echo "$VPC_INFO" | jq -r '.publicSubnet2')

echo "Creating security group for ALB..."

# Create ALB security group
ALB_SG_ID=$(aws ec2 create-security-group \
  --group-name "${PROJECT_NAME}-alb-sg" \
  --description "Security group for ${PROJECT_NAME} ALB" \
  --vpc-id "$VPC_ID" \
  --region "$AWS_REGION" \
  --query 'GroupId' --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${PROJECT_NAME}-alb-sg" "Name=vpc-id,Values=${VPC_ID}" \
    --region "$AWS_REGION" \
    --query 'SecurityGroups[0].GroupId' --output text)

# Allow HTTP and HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id "$ALB_SG_ID" \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region "$AWS_REGION" 2>/dev/null || echo "HTTP rule exists"

aws ec2 authorize-security-group-ingress \
  --group-id "$ALB_SG_ID" \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region "$AWS_REGION" 2>/dev/null || echo "HTTPS rule exists"

echo "Creating Application Load Balancer..."

# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name "${PROJECT_NAME}-alb" \
  --subnets "$PUBLIC_SUBNET_1" "$PUBLIC_SUBNET_2" \
  --security-groups "$ALB_SG_ID" \
  --scheme internet-facing \
  --type application \
  --region "$AWS_REGION" \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || \
  aws elbv2 describe-load-balancers \
    --names "${PROJECT_NAME}-alb" \
    --region "$AWS_REGION" \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text)

ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns "$ALB_ARN" \
  --region "$AWS_REGION" \
  --query 'LoadBalancers[0].DNSName' --output text)

echo "Creating target groups..."

# Backend target group
BACKEND_TG_ARN=$(aws elbv2 create-target-group \
  --name "${PROJECT_NAME}-backend-tg" \
  --protocol HTTP \
  --port 3003 \
  --vpc-id "$VPC_ID" \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region "$AWS_REGION" \
  --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || \
  aws elbv2 describe-target-groups \
    --names "${PROJECT_NAME}-backend-tg" \
    --region "$AWS_REGION" \
    --query 'TargetGroups[0].TargetGroupArn' --output text)

# Frontend target group
FRONTEND_TG_ARN=$(aws elbv2 create-target-group \
  --name "${PROJECT_NAME}-frontend-tg" \
  --protocol HTTP \
  --port 3000 \
  --vpc-id "$VPC_ID" \
  --health-check-path / \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region "$AWS_REGION" \
  --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || \
  aws elbv2 describe-target-groups \
    --names "${PROJECT_NAME}-frontend-tg" \
    --region "$AWS_REGION" \
    --query 'TargetGroups[0].TargetGroupArn' --output text)

echo "Creating listeners..."

# HTTP listener (redirect to HTTPS)
aws elbv2 create-listener \
  --load-balancer-arn "$ALB_ARN" \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}" \
  --region "$AWS_REGION" 2>/dev/null || echo "HTTP listener exists"

# HTTPS listener (default to frontend)
# Note: You'll need to add SSL certificate ARN manually
echo "⚠️  HTTPS listener requires SSL certificate"
echo "   Create certificate in ACM and update listener manually"
echo "   Command: aws elbv2 create-listener --load-balancer-arn $ALB_ARN --protocol HTTPS --port 443 --certificates CertificateArn=YOUR_CERT_ARN --default-actions Type=forward,TargetGroupArn=$FRONTEND_TG_ARN"

# Save to file
cat > deploy/output/alb-info.json <<EOF
{
  "albArn": "$ALB_ARN",
  "albDns": "$ALB_DNS",
  "backendTargetGroupArn": "$BACKEND_TG_ARN",
  "frontendTargetGroupArn": "$FRONTEND_TG_ARN",
  "securityGroupId": "$ALB_SG_ID"
}
EOF

echo "✓ Application Load Balancer created"
echo "  DNS Name: $ALB_DNS"
echo "  Backend TG: $BACKEND_TG_ARN"
echo "  Frontend TG: $FRONTEND_TG_ARN"

