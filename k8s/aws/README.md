# AWS EKS Deployment Guide

Deploy Zero-to-Running Developer Environment to Amazon Elastic Kubernetes Service (EKS).

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **kubectl** installed and configured
3. **eksctl** (optional, for cluster creation)
4. **EKS Cluster** created
5. **ECR Repository** created for Docker images

## Setup

### 1. Create EKS Cluster (if not exists)

```bash
# Using eksctl (recommended)
eksctl create cluster \
  --name dev-env-cluster \
  --region us-east-1 \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 3

# Or using AWS Console/CloudFormation
```

### 2. Configure kubectl

```bash
aws eks update-kubeconfig --name dev-env-cluster --region us-east-1
```

### 3. Create ECR Repositories

```bash
# Set variables
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1

# Create repositories
aws ecr create-repository --repository-name dev-env-backend --region $AWS_REGION
aws ecr create-repository --repository-name dev-env-app-frontend --region $AWS_REGION
aws ecr create-repository --repository-name dev-env-dashboard-frontend --region $AWS_REGION
```

### 4. Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push backend
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/dev-env-backend:latest ./backend
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/dev-env-backend:latest

# Build and push app-frontend
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/dev-env-app-frontend:latest ./app-frontend
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/dev-env-app-frontend:latest

# Build and push dashboard-frontend
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/dev-env-dashboard-frontend:latest ./dashboard-frontend
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/dev-env-dashboard-frontend:latest
```

### 5. Update Image References

Update the image references in `../common/` deployment files:
- Replace `YOUR_REGISTRY` with `$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com`

Or use `kubectl set image`:
```bash
kubectl set image deployment/backend backend=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/dev-env-backend:latest -n dev-env
```

## Deploy

```bash
# Apply common manifests
kubectl apply -f ../common/

# Apply AWS-specific manifests
kubectl apply -f storage-class.yaml
kubectl apply -f ingress.yaml

# Or use the deployment script
./deploy.sh
```

## Storage

AWS EKS uses EBS volumes. The storage class uses `gp3` (default) for better performance and cost.

## Ingress

The ingress uses AWS Application Load Balancer (ALB) via AWS Load Balancer Controller.

### Install AWS Load Balancer Controller

```bash
# Add EKS Helm chart
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=dev-env-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

## Access Services

### Port Forwarding
```bash
kubectl port-forward service/backend-service 3003:3003 -n dev-env
```

### Via Ingress
After deploying ingress, get the ALB URL:
```bash
kubectl get ingress -n dev-env
```

## Secrets Management

For production, use AWS Secrets Manager:

```bash
# Store secret
aws secretsmanager create-secret \
  --name dev-env/postgres-password \
  --secret-string "your-password"

# Reference in Kubernetes using External Secrets Operator
```

## Monitoring

- **CloudWatch**: Container Insights for EKS
- **X-Ray**: Distributed tracing
- **CloudWatch Logs**: Centralized logging

## Cleanup

```bash
# Delete resources
kubectl delete namespace dev-env

# Delete ECR repositories (optional)
aws ecr delete-repository --repository-name dev-env-backend --force
aws ecr delete-repository --repository-name dev-env-app-frontend --force
aws ecr delete-repository --repository-name dev-env-dashboard-frontend --force

# Delete EKS cluster (optional)
eksctl delete cluster --name dev-env-cluster --region us-east-1
```

