#!/bin/bash
# Cleanup script for AWS EKS test deployment
# Removes all resources created during testing

set -e

AWS_REGION=${AWS_REGION:-us-east-1}
CLUSTER_NAME=${CLUSTER_NAME:-dev-env-cluster}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")

echo "🧹 AWS EKS Test Cleanup"
echo "======================"
echo "Region: $AWS_REGION"
echo "Cluster: $CLUSTER_NAME"
echo ""

# Confirm deletion
read -p "⚠️  This will DELETE the EKS cluster and all resources. Continue? (y/n): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Cancelled."
    exit 0
fi

# 1. Delete Kubernetes resources
echo ""
echo "🗑️  Step 1: Deleting Kubernetes resources..."
if kubectl get namespace dev-env >/dev/null 2>&1; then
    kubectl delete namespace dev-env --wait=true --timeout=300s || true
    echo "  ✅ Namespace deleted"
else
    echo "  ℹ️  Namespace not found, skipping"
fi

# 2. Delete EKS cluster
echo ""
echo "🗑️  Step 2: Deleting EKS cluster (this takes 10-15 minutes)..."
if eksctl get cluster --name $CLUSTER_NAME --region $AWS_REGION >/dev/null 2>&1; then
    eksctl delete cluster --name $CLUSTER_NAME --region $AWS_REGION --wait
    echo "  ✅ Cluster deleted"
else
    echo "  ℹ️  Cluster not found, skipping"
fi

# 3. Delete ECR repositories
echo ""
echo "🗑️  Step 3: Deleting ECR repositories..."
if [ -n "$AWS_ACCOUNT_ID" ]; then
    for repo in dev-env-backend dev-env-app-frontend dev-env-dashboard-frontend; do
        if aws ecr describe-repositories --repository-names $repo --region $AWS_REGION >/dev/null 2>&1; then
            echo "  Deleting $repo..."
            # Delete all images first
            aws ecr list-images --repository-name $repo --region $AWS_REGION --query 'imageIds[*]' --output json | \
                jq -r '.[] | "\(.imageDigest)"' | \
                xargs -I {} aws ecr batch-delete-image --repository-name $repo --region $AWS_REGION --image-ids imageDigest={} 2>/dev/null || true
            
            # Delete repository
            aws ecr delete-repository --repository-name $repo --region $AWS_REGION --force >/dev/null 2>&1
            echo "  ✅ $repo deleted"
        else
            echo "  ℹ️  $repo not found, skipping"
        fi
    done
else
    echo "  ⚠️  Could not get AWS account ID, skipping ECR cleanup"
fi

# 4. Restore original deployment files
echo ""
echo "📝 Step 4: Restoring original deployment files..."
cd "$(dirname "${BASH_SOURCE[0]}")/../common"

if [ -f "backend-deployment.yaml.bak" ]; then
    mv backend-deployment.yaml.bak backend-deployment.yaml
    echo "  ✅ Backend deployment restored"
fi

if [ -f "app-frontend-deployment.yaml.bak" ]; then
    mv app-frontend-deployment.yaml.bak app-frontend-deployment.yaml
    echo "  ✅ App frontend deployment restored"
fi

if [ -f "dashboard-frontend-deployment.yaml.bak" ]; then
    mv dashboard-frontend-deployment.yaml.bak dashboard-frontend-deployment.yaml
    echo "  ✅ Dashboard frontend deployment restored"
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "💡 To verify:"
echo "   eksctl get cluster --region $AWS_REGION"
echo "   aws ecr describe-repositories --region $AWS_REGION"

