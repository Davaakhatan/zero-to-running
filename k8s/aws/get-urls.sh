#!/bin/bash
# Get public URLs for your applications

echo "🌐 Getting LoadBalancer URLs..."
echo ""

DASHBOARD_LB=$(kubectl get svc dashboard-frontend-service -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
COLLABCANVA_LB=$(kubectl get svc collabcanva-service -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)

if [ -n "$DASHBOARD_LB" ]; then
    echo "✅ Dashboard is ready!"
    echo "   URL: http://$DASHBOARD_LB"
    echo ""
else
    echo "⏳ Dashboard LoadBalancer is still being provisioned..."
    echo "   Run this script again in a few minutes"
    echo ""
fi

if [ -n "$COLLABCANVA_LB" ]; then
    echo "✅ CollabCanva is ready!"
    echo "   URL: http://$COLLABCANVA_LB"
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
    echo "   http://$DASHBOARD_LB"
    echo ""
    echo "📋 CollabCanva:"
    echo "   http://$COLLABCANVA_LB"
    echo ""
    echo "💡 These URLs are publicly accessible from anywhere!"
fi

