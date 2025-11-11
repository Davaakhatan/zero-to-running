# Quick Start Guide - Choose Your Cloud

## 🎯 Simple 3-Step Process

### Step 1: Choose Your Cloud Provider

Run the interactive deployment script:

```bash
cd k8s
./deploy.sh
```

You'll see:
```
🚀 Zero-to-Running Developer Environment - Kubernetes Deployment
================================================================

Which cloud provider do you want to deploy to?

  1) AWS EKS (Amazon Elastic Kubernetes Service)
  2) Azure AKS (Azure Kubernetes Service)
  3) GCP GKE (Google Kubernetes Engine)

Enter your choice (1-3):
```

### Step 2: Follow the Prerequisites

The script will show you what you need. Here's a quick checklist:

#### For AWS EKS:
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] EKS cluster created (or use `eksctl create cluster`)
- [ ] kubectl configured (`aws eks update-kubeconfig`)
- [ ] ECR repositories created (or the script can help)

#### For Azure AKS:
- [ ] Azure CLI installed and configured (`az login`)
- [ ] AKS cluster created (`az aks create`)
- [ ] kubectl configured (`az aks get-credentials`)
- [ ] ACR registry created (`az acr create`)

#### For GCP GKE:
- [ ] gcloud CLI installed and configured (`gcloud init`)
- [ ] GKE cluster created (`gcloud container clusters create`)
- [ ] kubectl configured (`gcloud container clusters get-credentials`)
- [ ] GCR or Artifact Registry enabled

### Step 3: Build Images and Deploy

The deployment script will guide you, but here's what happens:

1. **Build Docker Images** - The script will show you commands to build and push images
2. **Update Image References** - Update the image names in deployment files
3. **Deploy** - Run `./deploy.sh` in your chosen cloud directory

## 📋 Complete Example: AWS EKS

```bash
# 1. Choose AWS
cd k8s
./deploy.sh
# Select option 1

# 2. Build and push images (shown in AWS README)
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/dev-env-backend:latest ./backend
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/dev-env-backend:latest

# 3. Update image references in k8s/common/backend-deployment.yaml
# Replace YOUR_REGISTRY with your ECR URL

# 4. Deploy
cd aws
./deploy.sh
```

## 🤔 Still Not Sure Which Cloud?

**Pick the one you know best!** All three work identically:

- **Same Kubernetes manifests** (just different storage/ingress configs)
- **Same deployment process**
- **Same application code**

The only differences are:
- Container registry URLs (ECR vs ACR vs GCR)
- Storage classes (EBS vs Azure Disk vs GCE Persistent Disk)
- Ingress controllers (ALB vs NGINX vs GKE Ingress)

## 💡 Need Help?

- **AWS**: See [k8s/aws/README.md](aws/README.md)
- **Azure**: See [k8s/azure/README.md](azure/README.md)
- **GCP**: See [k8s/gcp/README.md](gcp/README.md)

## 🚀 Quick Test (Local)

Want to test locally first? Use minikube or kind:

```bash
# Install minikube
brew install minikube  # macOS
# or
curl -Lo minikube https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64

# Start cluster
minikube start

# Use common manifests (works with any Kubernetes)
kubectl apply -f k8s/common/
```

