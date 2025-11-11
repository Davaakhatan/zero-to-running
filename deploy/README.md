# AWS Deployment Guide

This directory contains scripts and documentation for deploying the Zero-to-Running Developer Environment to AWS.

## Prerequisites

1. **AWS CLI** installed and configured
   ```bash
   aws --version
   aws configure
   ```

2. **Docker** installed and running
   ```bash
   docker --version
   ```

3. **jq** installed (for JSON parsing)
   ```bash
   brew install jq  # macOS
   # or
   sudo apt-get install jq  # Linux
   ```

4. **AWS Permissions**: Your AWS user/role needs permissions for:
   - ECS (Elastic Container Service)
   - ECR (Elastic Container Registry)
   - RDS (Relational Database Service)
   - ElastiCache
   - VPC (Virtual Private Cloud)
   - EC2 (for networking)
   - IAM (for roles)
   - Secrets Manager
   - CloudWatch Logs
   - Application Load Balancer

## Quick Start

### 1. Configure Environment Variables

Edit `deploy/deploy.sh` or set environment variables:

```bash
export AWS_REGION=us-east-1
export FRONTEND_DOMAIN=yourdomain.com
export API_DOMAIN=api.yourdomain.com
```

### 2. Run Deployment Script

```bash
cd deploy
./deploy.sh
```

This will:
1. Create ECR repositories
2. Build and push Docker images
3. Create VPC and networking
4. Create RDS PostgreSQL
5. Create ElastiCache Redis
6. Create secrets in Secrets Manager
7. Create ECS cluster and task definitions
8. Create Application Load Balancer
9. Create ECS services

### 3. Manual Steps After Deployment

#### A. Get SSL Certificate

1. Request certificate in AWS Certificate Manager (ACM):
   ```bash
   aws acm request-certificate \
     --domain-name yourdomain.com \
     --subject-alternative-names api.yourdomain.com \
     --validation-method DNS \
     --region us-east-1
   ```

2. Validate certificate via DNS (add CNAME records to your domain)

3. Get certificate ARN:
   ```bash
   aws acm list-certificates --region us-east-1
   ```

#### B. Create HTTPS Listener

```bash
# Get values from deploy/output/alb-info.json
ALB_ARN=$(cat deploy/output/alb-info.json | jq -r '.albArn')
FRONTEND_TG_ARN=$(cat deploy/output/alb-info.json | jq -r '.frontendTargetGroupArn')
CERT_ARN="arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID"

aws elbv2 create-listener \
  --load-balancer-arn "$ALB_ARN" \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn="$CERT_ARN" \
  --default-actions Type=forward,TargetGroupArn="$FRONTEND_TG_ARN" \
  --region us-east-1
```

#### C. Add API Route Rule

```bash
ALB_ARN=$(cat deploy/output/alb-info.json | jq -r '.albArn')
BACKEND_TG_ARN=$(cat deploy/output/alb-info.json | jq -r '.backendTargetGroupArn')
LISTENER_ARN=$(aws elbv2 describe-listeners --load-balancer-arn "$ALB_ARN" --query 'Listeners[?Port==`443`].ListenerArn' --output text)

aws elbv2 create-rule \
  --listener-arn "$LISTENER_ARN" \
  --priority 100 \
  --conditions Field=host-header,Values=api.yourdomain.com \
  --actions Type=forward,TargetGroupArn="$BACKEND_TG_ARN" \
  --region us-east-1
```

#### D. Configure Route53 DNS

1. Get ALB DNS name:
   ```bash
   cat deploy/output/alb-info.json | jq -r '.albDns'
   ```

2. Create A record in Route53:
   - `yourdomain.com` → ALB DNS (Alias)
   - `api.yourdomain.com` → ALB DNS (Alias)

#### E. Update CORS

The backend CORS is already configured to use `FRONTEND_URL` environment variable. Verify it's set correctly in the ECS task definition.

## Manual Deployment (Step by Step)

If you prefer to run steps individually:

```bash
# 1. Create ECR repositories
./deploy/scripts/01-create-ecr.sh us-east-1 zero-to-running

# 2. Build and push images
./deploy/scripts/02-build-push-images.sh us-east-1 ACCOUNT_ID zero-to-running api.yourdomain.com

# 3. Create VPC
./deploy/scripts/03-create-vpc.sh us-east-1 zero-to-running

# 4. Create RDS
./deploy/scripts/04-create-rds.sh us-east-1 zero-to-running

# 5. Create Redis
./deploy/scripts/05-create-redis.sh us-east-1 zero-to-running

# 6. Create secrets
./deploy/scripts/06-create-secrets.sh us-east-1 zero-to-running

# 7. Create ECS
./deploy/scripts/07-create-ecs.sh us-east-1 ACCOUNT_ID zero-to-running yourdomain.com api.yourdomain.com

# 8. Create ALB
./deploy/scripts/08-create-alb.sh us-east-1 zero-to-running

# 9. Create services
./deploy/scripts/09-create-services.sh us-east-1 zero-to-running
```

## Verification

### Check Service Status

```bash
aws ecs describe-services \
  --cluster zero-to-running-cluster \
  --services zero-to-running-backend-service zero-to-running-frontend-service \
  --region us-east-1
```

### Check Health

```bash
# Get ALB DNS
ALB_DNS=$(cat deploy/output/alb-info.json | jq -r '.albDns')

# Test backend health
curl http://$ALB_DNS/health

# Test frontend
curl http://$ALB_DNS/
```

### View Logs

```bash
# Backend logs
aws logs tail /ecs/zero-to-running-backend --follow --region us-east-1

# Frontend logs
aws logs tail /ecs/zero-to-running-frontend --follow --region us-east-1
```

## Cost Estimation

Approximate monthly costs (us-east-1):

- **RDS PostgreSQL** (db.t3.micro, Multi-AZ): ~$30
- **ElastiCache Redis** (cache.t3.micro): ~$15
- **ECS Fargate** (2 tasks × 0.5 vCPU, 1GB RAM): ~$30-50
- **Application Load Balancer**: ~$20
- **NAT Gateway**: ~$35
- **Data Transfer**: Variable (~$10-50)
- **ECR Storage**: ~$1-5

**Total: ~$140-200/month** (starting costs)

## Troubleshooting

### Services Not Starting

1. Check task status:
   ```bash
   aws ecs list-tasks --cluster zero-to-running-cluster --region us-east-1
   ```

2. Check task logs:
   ```bash
   TASK_ARN=$(aws ecs list-tasks --cluster zero-to-running-cluster --query 'taskArns[0]' --output text)
   aws ecs describe-tasks --cluster zero-to-running-cluster --tasks $TASK_ARN --region us-east-1
   ```

### Database Connection Issues

1. Verify security groups allow traffic
2. Check RDS endpoint is correct
3. Verify secrets in Secrets Manager

### Image Pull Errors

1. Verify ECR login:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
   ```

2. Check image exists:
   ```bash
   aws ecr describe-images --repository-name zero-to-running-backend --region us-east-1
   ```

## Cleanup

To remove all resources:

```bash
# Delete ECS services
aws ecs update-service --cluster zero-to-running-cluster --service zero-to-running-backend-service --desired-count 0 --region us-east-1
aws ecs update-service --cluster zero-to-running-cluster --service zero-to-running-frontend-service --desired-count 0 --region us-east-1

# Delete ALB
ALB_ARN=$(cat deploy/output/alb-info.json | jq -r '.albArn')
aws elbv2 delete-load-balancer --load-balancer-arn "$ALB_ARN" --region us-east-1

# Delete RDS
aws rds delete-db-instance --db-instance-identifier zero-to-running-db --skip-final-snapshot --region us-east-1

# Delete Redis
aws elasticache delete-cache-cluster --cache-cluster-id zero-to-running-redis --region us-east-1

# Delete VPC (after removing all resources)
# ... (manual cleanup required)
```

## Next Steps

1. Set up CloudWatch alarms for monitoring
2. Configure auto-scaling policies
3. Set up CI/CD pipeline
4. Configure backup strategies
5. Set up monitoring dashboards

See `deploy/aws-best-practices.md` for detailed best practices.

