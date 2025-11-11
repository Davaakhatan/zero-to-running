# Testing AWS EKS Deployment

Complete guide to test the Zero-to-Running Developer Environment on AWS EKS.

## Prerequisites

### 1. AWS Account Setup

```bash
# Install AWS CLI (if not installed)
brew install awscli  # macOS
# or
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

# Configure AWS CLI
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

### 2. Install Required Tools

```bash
# Install kubectl
brew install kubectl  # macOS
# or
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"

# Install eksctl (recommended for EKS)
brew install eksctl  # macOS
# or
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
```

### 3. Verify Installations

```bash
aws --version
kubectl version --client
eksctl version
```

## Step-by-Step Testing Guide

### Step 1: Create EKS Cluster

#### Option A: Using eksctl (Recommended - Easiest)

```bash
# Set variables
CLUSTER_NAME=dev-env-cluster
REGION=us-east-1
NODE_TYPE=t3.medium
NODE_COUNT=2

# Create cluster (takes 15-20 minutes)
eksctl create cluster \
  --name $CLUSTER_NAME \
  --region $REGION \
  --node-type $NODE_TYPE \
  --nodes $NODE_COUNT \
  --nodes-min 1 \
  --nodes-max 3 \
  --managed

# This will automatically configure kubectl
```

#### Option B: Using AWS Console

1. Go to AWS Console → EKS → Clusters
2. Click "Create cluster"
3. Configure:
   - Name: `dev-env-cluster`
   - Kubernetes version: Latest
   - Node group: t3.medium, 2 nodes
4. Wait for cluster creation (~15 minutes)
5. Configure kubectl:
   ```bash
   aws eks update-kubeconfig --name dev-env-cluster --region us-east-1
   ```

### Step 2: Verify Cluster Access

```bash
# Check cluster connection
kubectl cluster-info

# Verify nodes
kubectl get nodes

# Should show 2 nodes in Ready state
```

### Step 3: Create ECR Repositories

```bash
# Set variables
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1

# Create ECR repositories
aws ecr create-repository --repository-name dev-env-backend --region $AWS_REGION
aws ecr create-repository --repository-name dev-env-app-frontend --region $AWS_REGION
aws ecr create-repository --repository-name dev-env-dashboard-frontend --region $AWS_REGION

# Verify repositories
aws ecr describe-repositories --region $AWS_REGION
```

### Step 4: Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push backend
cd ../..  # Go to project root
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/dev-env-backend:latest ./backend
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/dev-env-backend:latest

# Build and push app-frontend
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/dev-env-app-frontend:latest ./app-frontend
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/dev-env-app-frontend:latest

# Build and push dashboard-frontend
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/dev-env-dashboard-frontend:latest ./dashboard-frontend
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/dev-env-dashboard-frontend:latest
```

### Step 5: Update Image References

Update the deployment files with your ECR image URLs:

```bash
# Set your ECR URL
ECR_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Update backend deployment
sed -i.bak "s|YOUR_REGISTRY|$ECR_URL|g" ../common/backend-deployment.yaml

# Update app-frontend deployment
sed -i.bak "s|YOUR_REGISTRY|$ECR_URL|g" ../common/app-frontend-deployment.yaml

# Update dashboard-frontend deployment
sed -i.bak "s|YOUR_REGISTRY|$ECR_URL|g" ../common/dashboard-frontend-deployment.yaml
```

Or manually edit the files:
- `k8s/common/backend-deployment.yaml` - Replace `YOUR_REGISTRY` with your ECR URL
- `k8s/common/app-frontend-deployment.yaml` - Replace `YOUR_REGISTRY` with your ECR URL
- `k8s/common/dashboard-frontend-deployment.yaml` - Replace `YOUR_REGISTRY` with your ECR URL

### Step 6: Deploy to EKS

```bash
# Go to k8s directory
cd k8s

# Deploy using the script
cd aws
./deploy.sh

# Or deploy manually
kubectl apply -f ../common/
kubectl apply -f storage-class.yaml
kubectl apply -f ingress.yaml
```

### Step 7: Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n dev-env

# Should show:
# - postgres-0 (StatefulSet)
# - redis-* (Deployment)
# - backend-* (Deployment)
# - app-frontend-* (Deployment)
# - dashboard-frontend-* (Deployment)

# Check services
kubectl get services -n dev-env

# Check ingress (if configured)
kubectl get ingress -n dev-env
```

### Step 8: Access Services

#### Port Forwarding (Quick Test)

```bash
# Backend API
kubectl port-forward service/backend-service 3003:3003 -n dev-env

# Application Frontend
kubectl port-forward service/app-frontend-service 3000:3000 -n dev-env

# Dashboard Frontend
kubectl port-forward service/dashboard-frontend-service 3001:3000 -n dev-env
```

Then access:
- Backend: http://localhost:3003
- App: http://localhost:3000
- Dashboard: http://localhost:3001

#### Via Ingress (If Configured)

```bash
# Get ALB URL
kubectl get ingress dev-env-ingress -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Access via the ALB URL
# Note: You'll need to configure DNS or use the ALB hostname directly
```

### Step 9: Test Functionality

```bash
# Test backend health
curl http://localhost:3003/health

# Test backend API
curl http://localhost:3003/api/services

# Test configuration
curl http://localhost:3003/api/config

# Check logs
kubectl logs -f deployment/backend -n dev-env
```

## Troubleshooting

### Issue: Pods not starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n dev-env

# Check events
kubectl get events -n dev-env --sort-by='.lastTimestamp'

# Common issues:
# - Image pull errors → Check ECR permissions
# - Resource limits → Check node capacity
# - Init container failures → Check dependencies
```

### Issue: Image pull errors

```bash
# Verify ECR access
aws ecr describe-images --repository-name dev-env-backend --region $AWS_REGION

# Check IAM permissions
aws iam get-user

# Ensure EKS nodes have ECR access (should be automatic with eksctl)
```

### Issue: Services not accessible

```bash
# Check service endpoints
kubectl get endpoints -n dev-env

# Check service selectors match pod labels
kubectl get pods -n dev-env --show-labels
kubectl get services -n dev-env -o yaml
```

### Issue: Storage class not working

```bash
# Check storage class
kubectl get storageclass

# Check PVC status
kubectl get pvc -n dev-env

# Check persistent volumes
kubectl get pv
```

## Cleanup

### Remove Deployment

```bash
# Delete all resources
kubectl delete namespace dev-env

# Or delete individually
kubectl delete -f ../common/
kubectl delete -f storage-class.yaml
kubectl delete -f ingress.yaml
```

### Delete EKS Cluster

```bash
# Using eksctl
eksctl delete cluster --name dev-env-cluster --region us-east-1

# Or using AWS Console
# Go to EKS → Clusters → Delete
```

### Delete ECR Repositories

```bash
# Delete images first
aws ecr batch-delete-image --repository-name dev-env-backend --region $AWS_REGION --image-ids imageTag=latest
aws ecr batch-delete-image --repository-name dev-env-app-frontend --region $AWS_REGION --image-ids imageTag=latest
aws ecr batch-delete-image --repository-name dev-env-dashboard-frontend --region $AWS_REGION --image-ids imageTag=latest

# Delete repositories
aws ecr delete-repository --repository-name dev-env-backend --region $AWS_REGION --force
aws ecr delete-repository --repository-name dev-env-app-frontend --region $AWS_REGION --force
aws ecr delete-repository --repository-name dev-env-dashboard-frontend --region $AWS_REGION --force
```

## Cost Estimation

### EKS Cluster
- **Control Plane**: ~$0.10/hour (~$73/month)
- **Nodes** (2x t3.medium): ~$0.0832/hour each (~$60/month each)
- **Total**: ~$193/month for 2 nodes

### ECR Storage
- **Storage**: ~$0.10/GB/month
- **Data Transfer**: First 1GB free, then $0.09/GB

### Tips to Reduce Costs
- Use smaller instance types for testing (t3.small)
- Use fewer nodes (1 node for testing)
- Delete cluster when not in use
- Use Spot instances for nodes (50-90% savings)

## Quick Test Script

Save this as `k8s/aws/quick-test.sh`:

```bash
#!/bin/bash
set -e

AWS_REGION=${AWS_REGION:-us-east-1}
CLUSTER_NAME=${CLUSTER_NAME:-dev-env-cluster}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🚀 Quick AWS EKS Test"
echo "Region: $AWS_REGION"
echo "Cluster: $CLUSTER_NAME"
echo ""

# 1. Create cluster
echo "📦 Creating EKS cluster..."
eksctl create cluster --name $CLUSTER_NAME --region $AWS_REGION --node-type t3.small --nodes 1 --managed

# 2. Create ECR repos
echo "📦 Creating ECR repositories..."
aws ecr create-repository --repository-name dev-env-backend --region $AWS_REGION 2>/dev/null || true
aws ecr create-repository --repository-name dev-env-app-frontend --region $AWS_REGION 2>/dev/null || true
aws ecr create-repository --repository-name dev-env-dashboard-frontend --region $AWS_REGION 2>/dev/null || true

# 3. Build and push images
echo "🔨 Building and pushing images..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

cd ../..
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/dev-env-backend:latest ./backend
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/dev-env-backend:latest

# 4. Update image references
ECR_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
sed -i.bak "s|YOUR_REGISTRY|$ECR_URL|g" k8s/common/backend-deployment.yaml

# 5. Deploy
echo "🚀 Deploying to EKS..."
cd k8s/aws
./deploy.sh

echo "✅ Deployment complete!"
echo "💡 Use port-forwarding to access services"
```

## Next Steps

After successful deployment:
1. ✅ Test all services are accessible
2. ✅ Verify health checks work
3. ✅ Test service control (start/stop/restart)
4. ✅ Monitor resource usage
5. ✅ Test log aggregation
6. ✅ Configure ingress for external access (optional)

