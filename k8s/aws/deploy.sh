#!/bin/bash

# Deploy Zero-to-Running Developer Environment to AWS EKS
# Usage: ./deploy.sh [namespace]

set -e

NAMESPACE=${1:-dev-env}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../common"

echo "🚀 Deploying Zero-to-Running Developer Environment to AWS EKS"
echo "📦 Namespace: $NAMESPACE"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if connected to cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Not connected to a Kubernetes cluster. Please configure kubectl."
    echo "💡 Run: aws eks update-kubeconfig --name <cluster-name> --region <region>"
    exit 1
fi

echo "✅ Connected to cluster: $(kubectl config current-context)"
echo ""

# Apply common manifests
echo "📝 Applying common manifests..."
kubectl apply -f "$COMMON_DIR/namespace.yaml"
kubectl apply -f "$COMMON_DIR/configmap.yaml"
kubectl apply -f "$COMMON_DIR/secrets.yaml"

# Apply AWS-specific storage class
echo "📝 Applying AWS storage class..."
kubectl apply -f "$SCRIPT_DIR/storage-class.yaml"

# Update postgres statefulset to use AWS storage class
echo "📝 Updating PostgreSQL to use AWS storage class..."
kubectl apply -f "$COMMON_DIR/postgres-statefulset.yaml"
kubectl patch statefulset postgres -n $NAMESPACE -p '{"spec":{"volumeClaimTemplates":[{"metadata":{"name":"postgres-data"},"spec":{"storageClassName":"gp3","accessModes":["ReadWriteOnce"],"resources":{"requests":{"storage":"10Gi"}}}]}]}}' || true

echo "📝 Deploying Redis..."
kubectl apply -f "$COMMON_DIR/redis-deployment.yaml"

echo "📝 Deploying Backend API..."
kubectl apply -f "$COMMON_DIR/backend-deployment.yaml"

echo "📝 Deploying Application Frontend..."
kubectl apply -f "$COMMON_DIR/app-frontend-deployment.yaml"

echo "📝 Deploying Dashboard Frontend..."
kubectl apply -f "$COMMON_DIR/dashboard-frontend-deployment.yaml"

echo "📝 Applying AWS Ingress..."
kubectl apply -f "$SCRIPT_DIR/ingress.yaml"

echo ""
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/backend -n $NAMESPACE || true
kubectl wait --for=condition=available --timeout=300s deployment/app-frontend -n $NAMESPACE || true
kubectl wait --for=condition=available --timeout=300s deployment/dashboard-frontend -n $NAMESPACE || true

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Status:"
kubectl get pods -n $NAMESPACE
echo ""
echo "🌐 Services:"
kubectl get services -n $NAMESPACE
echo ""
echo "🌍 Ingress:"
kubectl get ingress -n $NAMESPACE
echo ""
echo "💡 To access services:"
echo "   kubectl port-forward service/backend-service 3003:3003 -n $NAMESPACE"
echo "   kubectl port-forward service/app-frontend-service 3000:3000 -n $NAMESPACE"
echo "   kubectl port-forward service/dashboard-frontend-service 3001:3000 -n $NAMESPACE"
echo ""
echo "   Or use the ALB URL from ingress:"
echo "   kubectl get ingress dev-env-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'"

