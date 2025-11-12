#!/bin/bash
# Fix security groups to allow public access to LoadBalancers

set -e

echo "🔧 Fixing LoadBalancer Security Groups..."
echo ""

# Get LoadBalancer security groups
DASHBOARD_SG=$(aws elb describe-load-balancers --region us-east-1 --load-balancer-names a25328365da404a76b0dbd435dc9fb92 --query "LoadBalancerDescriptions[0].SecurityGroups[0]" --output text 2>/dev/null || echo "")
COLLABCANVA_SG=$(aws elb describe-load-balancers --region us-east-1 --load-balancer-names aced1a3814886479d8c3e47097b8a097 --query "LoadBalancerDescriptions[0].SecurityGroups[0]" --output text 2>/dev/null || echo "")

if [ -z "$DASHBOARD_SG" ] || [ -z "$COLLABCANVA_SG" ]; then
    echo "❌ Could not find LoadBalancer security groups"
    echo "   Run: kubectl get svc -n dev-env | grep LoadBalancer"
    echo "   Then check security groups manually"
    exit 1
fi

echo "📋 Found security groups:"
echo "   Dashboard: $DASHBOARD_SG"
echo "   CollabCanva: $COLLABCANVA_SG"
echo ""

# Check if rules already exist
check_rule() {
    local sg=$1
    local port=$2
    aws ec2 describe-security-groups --region us-east-1 --group-ids $sg --query "SecurityGroups[0].IpPermissions[?FromPort==\`$port\` && IpProtocol==\`tcp\`]" --output json | grep -q "0.0.0.0/0" 2>/dev/null
}

# Add HTTP rule (port 80)
add_http_rule() {
    local sg=$1
    local name=$2
    
    if check_rule $sg 80; then
        echo "✅ $name: HTTP (port 80) rule already exists"
    else
        echo "➕ Adding HTTP (port 80) rule to $name..."
        aws ec2 authorize-security-group-ingress \
            --region us-east-1 \
            --group-id $sg \
            --protocol tcp \
            --port 80 \
            --cidr 0.0.0.0/0 \
            --output json > /dev/null 2>&1
        echo "   ✅ Added HTTP rule"
    fi
}

# Add HTTPS rule (port 443) - optional
add_https_rule() {
    local sg=$1
    local name=$2
    
    if check_rule $sg 443; then
        echo "✅ $name: HTTPS (port 443) rule already exists"
    else
        echo "➕ Adding HTTPS (port 443) rule to $name..."
        aws ec2 authorize-security-group-ingress \
            --region us-east-1 \
            --group-id $sg \
            --protocol tcp \
            --port 443 \
            --cidr 0.0.0.0/0 \
            --output json > /dev/null 2>&1
        echo "   ✅ Added HTTPS rule"
    fi
}

add_http_rule $DASHBOARD_SG "Dashboard"
add_http_rule $COLLABCANVA_SG "CollabCanva"

echo ""
echo "✅ Security groups updated!"
echo ""
echo "⏳ Wait 10-30 seconds for rules to propagate, then test:"
echo "   curl http://a25328365da404a76b0dbd435dc9fb92-215160859.us-east-1.elb.amazonaws.com"
echo "   curl http://aced1a3814886479d8c3e47097b8a097-1410118245.us-east-1.elb.amazonaws.com"

