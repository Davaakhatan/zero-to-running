#!/bin/bash

# Deploy Zero-to-Running Developer Environment to AKS
# Usage: ./deploy.sh [namespace]

set -e

NAMESPACE=${1:-dev-env}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Deploying Zero-to-Running Developer Environment to AKS"
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
    exit 1
fi

echo "✅ Connected to cluster: $(kubectl config current-context)"
echo ""

# Apply manifests in order
echo "📝 Creating namespace..."
kubectl apply -f "$SCRIPT_DIR/namespace.yaml"

echo "📝 Creating ConfigMap..."
kubectl apply -f "$SCRIPT_DIR/configmap.yaml"

echo "📝 Creating Secrets..."
kubectl apply -f "$SCRIPT_DIR/secrets.yaml"

echo "📝 Deploying PostgreSQL..."
kubectl apply -f "$SCRIPT_DIR/postgres-statefulset.yaml"

echo "📝 Deploying Redis..."
kubectl apply -f "$SCRIPT_DIR/redis-deployment.yaml"

echo "📝 Deploying Backend API..."
kubectl apply -f "$SCRIPT_DIR/backend-deployment.yaml"

echo "📝 Deploying Application Frontend..."
kubectl apply -f "$SCRIPT_DIR/app-frontend-deployment.yaml"

echo "📝 Deploying Dashboard Frontend..."
kubectl apply -f "$SCRIPT_DIR/dashboard-frontend-deployment.yaml"

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
echo "💡 To access services, use port-forwarding:"
echo "   kubectl port-forward service/backend-service 3003:3003 -n $NAMESPACE"
echo "   kubectl port-forward service/app-frontend-service 3000:3000 -n $NAMESPACE"
echo "   kubectl port-forward service/dashboard-frontend-service 3001:3000 -n $NAMESPACE"

