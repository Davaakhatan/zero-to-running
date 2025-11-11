#!/bin/bash
# AWS Cost Estimate Calculator
# Estimates cost based on cluster runtime

set -e

AWS_REGION=${AWS_REGION:-us-east-1}
CLUSTER_NAME=${CLUSTER_NAME:-dev-env-cluster}
NODE_TYPE=${NODE_TYPE:-t3.small}
NODE_COUNT=${NODE_COUNT:-1}

# Cost per hour (as of 2024)
EKS_CONTROL_PLANE_HOURLY=0.10

# EC2 instance hourly costs (us-east-1)
declare -A INSTANCE_COSTS=(
    ["t3.small"]=0.0208
    ["t3.medium"]=0.0416
    ["t3.large"]=0.0832
)

NODE_HOURLY=${INSTANCE_COSTS[$NODE_TYPE]:-0.0208}

echo "💰 AWS EKS Cost Estimate"
echo "========================"
echo "Region: $AWS_REGION"
echo "Cluster: $CLUSTER_NAME"
echo "Node Type: $NODE_TYPE"
echo "Node Count: $NODE_COUNT"
echo ""

# Calculate hourly cost
TOTAL_HOURLY=$(echo "$EKS_CONTROL_PLANE_HOURLY + ($NODE_HOURLY * $NODE_COUNT)" | bc)

echo "📊 Hourly Costs:"
echo "   EKS Control Plane: \$$EKS_CONTROL_PLANE_HOURLY/hour"
echo "   EC2 Nodes ($NODE_COUNT x $NODE_TYPE): \$$(echo "$NODE_HOURLY * $NODE_COUNT" | bc)/hour"
echo "   Total: \$$TOTAL_HOURLY/hour"
echo ""

# Estimate for different durations
echo "💵 Estimated Costs:"
echo "   15 minutes (quick test): \$$(echo "scale=4; $TOTAL_HOURLY * 0.25" | bc)"
echo "   1 hour (full test): \$$TOTAL_HOURLY"
echo "   24 hours: \$$(echo "scale=2; $TOTAL_HOURLY * 24" | bc)"
echo "   1 month (if forgotten): \$$(echo "scale=2; $TOTAL_HOURLY * 730" | bc)"
echo ""

echo "⚠️  REMEMBER:"
echo "   - Charges are per hour (billed per second)"
echo "   - Always run cleanup.sh after testing!"
echo "   - Use smaller instances (t3.small) to minimize cost"
echo ""

# Check if cluster exists and estimate current cost
if eksctl get cluster --name $CLUSTER_NAME --region $AWS_REGION >/dev/null 2>&1; then
    echo "🔍 Cluster Status:"
    CLUSTER_INFO=$(eksctl get cluster --name $CLUSTER_NAME --region $AWS_REGION --output json 2>/dev/null)
    CREATED=$(echo "$CLUSTER_INFO" | jq -r '.[0].CreatedAt' 2>/dev/null || echo "")
    
    if [ -n "$CREATED" ] && [ "$CREATED" != "null" ]; then
        echo "   Cluster exists since: $CREATED"
        echo "   ⚠️  You are currently being charged!"
        echo "   💡 Run: ./cleanup.sh to stop charges"
    fi
fi

