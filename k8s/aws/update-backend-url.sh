#!/bin/bash
# Update backend LoadBalancer URL in ConfigMap and inject into dashboard

set -e

NAMESPACE=${NAMESPACE:-dev-env}

echo "🔧 Updating Backend LoadBalancer URL..."
echo ""

# Get backend LoadBalancer URL
BACKEND_LB=$(kubectl get svc backend-service -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)

if [ -z "$BACKEND_LB" ]; then
    echo "❌ Backend LoadBalancer not found. Is backend-service exposed as LoadBalancer?"
    exit 1
fi

BACKEND_URL="http://$BACKEND_LB:3003"
echo "✅ Backend LoadBalancer URL: $BACKEND_URL"
echo ""

# Update ConfigMap
echo "📝 Updating ConfigMap..."
kubectl patch configmap dev-env-config -n $NAMESPACE --type merge -p "{\"data\":{\"BACKEND_LOADBALANCER_URL\":\"$BACKEND_URL\"}}"
echo "✅ ConfigMap updated"
echo ""

# Note: Dashboard needs to be rebuilt or use runtime injection
echo "⚠️  IMPORTANT: Dashboard needs to be rebuilt with NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL"
echo ""
echo "Or use runtime injection by adding this to dashboard's HTML:"
echo "  <script>window.__BACKEND_URL__ = '$BACKEND_URL';</script>"
echo ""
echo "To rebuild dashboard:"
echo "  cd k8s/aws"
echo "  NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL ./build-dashboard.sh"

