#!/bin/bash
# Get public URLs for your applications

echo "🌐 Getting LoadBalancer URLs..."
echo ""

DASHBOARD_LB=$(kubectl get svc dashboard-frontend-service -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
COLLABCANVA_LB=$(kubectl get svc collabcanva-service -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)

# Get port numbers from services
DASHBOARD_PORT=$(kubectl get svc dashboard-frontend-service -n dev-env -o jsonpath='{.spec.ports[0].port}' 2>/dev/null || echo "3000")
COLLABCANVA_PORT=$(kubectl get svc collabcanva-service -n dev-env -o jsonpath='{.spec.ports[0].port}' 2>/dev/null || echo "3002")

if [ -n "$DASHBOARD_LB" ]; then
    echo "✅ Dashboard is ready!"
    echo "   URL: http://$DASHBOARD_LB:$DASHBOARD_PORT"
    echo ""
else
    echo "⏳ Dashboard LoadBalancer is still being provisioned..."
    echo "   Run this script again in a few minutes"
    echo ""
fi

if [ -n "$COLLABCANVA_LB" ]; then
    echo "✅ CollabCanva is ready!"
    echo "   URL: http://$COLLABCANVA_LB:$COLLABCANVA_PORT"
    echo ""
else
    echo "⏳ CollabCanva LoadBalancer is still being provisioned..."
    echo "   Run this script again in a few minutes"
    echo ""
fi

if [ -n "$DASHBOARD_LB" ] && [ -n "$COLLABCANVA_LB" ]; then
    echo "🎉 Both services are ready! Share these URLs:"
    echo ""
    echo "📋 Dashboard:"
    echo "   http://$DASHBOARD_LB:$DASHBOARD_PORT"
    echo ""
    echo "📋 CollabCanva:"
    echo "   http://$COLLABCANVA_LB:$COLLABCANVA_PORT"
    echo ""
    echo "💡 These URLs are publicly accessible from anywhere!"
    echo "⚠️  Note: Port numbers (:3000 and :3002) are required in the URLs"
fi

