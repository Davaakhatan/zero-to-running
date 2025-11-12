#!/bin/bash
# Quick script to get access URLs for your applications

echo "🔍 Checking AWS Load Balancer Controller..."
if kubectl get deployment -n kube-system aws-load-balancer-controller >/dev/null 2>&1; then
    echo "✅ AWS Load Balancer Controller is installed"
    
    echo ""
    echo "🌐 Checking Ingress ALB..."
    ALB_HOSTNAME=$(kubectl get ingress dev-env-ingress -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
    
    if [ -n "$ALB_HOSTNAME" ]; then
        echo "✅ ALB is provisioned!"
        echo ""
        echo "📋 Access URLs (using Host header or DNS):"
        echo "   Dashboard: http://$ALB_HOSTNAME (Host: dashboard.yourdomain.com)"
        echo "   CollabCanva: http://$ALB_HOSTNAME (Host: collabcanva.yourdomain.com)"
        echo ""
        echo "💡 To use with browser, install 'ModHeader' extension and set Host header"
    else
        echo "⏳ ALB is still being provisioned. Wait 2-5 minutes and run again."
        echo ""
        echo "🔄 Checking status..."
        kubectl get ingress dev-env-ingress -n dev-env
    fi
else
    echo "❌ AWS Load Balancer Controller is NOT installed"
    echo ""
    echo "📦 Quick fix: Create LoadBalancer services instead"
    echo ""
    read -p "Create LoadBalancer services for quick access? (y/n): " answer
    if [ "$answer" = "y" ]; then
        echo "Creating LoadBalancer services..."
        kubectl patch svc dashboard-frontend-service -n dev-env -p '{"spec":{"type":"LoadBalancer"}}'
        kubectl patch svc collabcanva-service -n dev-env -p '{"spec":{"type":"LoadBalancer"}}'
        echo ""
        echo "⏳ Waiting for AWS to provision load balancers (2-5 minutes)..."
        echo "Run this script again in a few minutes to get URLs"
    fi
fi

echo ""
echo "🔍 Checking LoadBalancer services..."
DASHBOARD_LB=$(kubectl get svc dashboard-frontend-service -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
COLLABCANVA_LB=$(kubectl get svc collabcanva-service -n dev-env -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)

if [ -n "$DASHBOARD_LB" ]; then
    echo "✅ Dashboard LoadBalancer: http://$DASHBOARD_LB"
fi

if [ -n "$COLLABCANVA_LB" ]; then
    echo "✅ CollabCanva LoadBalancer: http://$COLLABCANVA_LB"
fi
