#!/bin/bash

# Quick script to check backend deployment status

PROJECT_NAME=${1:-zero-to-running}
AWS_REGION=${2:-us-east-1}

echo "Checking App Runner service status..."
echo ""

# List all services
SERVICES=$(aws apprunner list-services --region "$AWS_REGION" --output json)

# Check if our service exists
SERVICE_ARN=$(echo "$SERVICES" | jq -r ".ServiceSummaryList[] | select(.ServiceName==\"${PROJECT_NAME}-backend\") | .ServiceArn" 2>/dev/null)

if [ -z "$SERVICE_ARN" ] || [ "$SERVICE_ARN" = "null" ]; then
  echo "❌ Service '${PROJECT_NAME}-backend' not found"
  echo ""
  echo "Available services:"
  echo "$SERVICES" | jq -r '.ServiceSummaryList[] | "  - \(.ServiceName) (\(.Status))"' 2>/dev/null
  exit 1
fi

echo "✓ Service found: $SERVICE_ARN"
echo ""

# Get service details
SERVICE_INFO=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --region "$AWS_REGION" --output json)

STATUS=$(echo "$SERVICE_INFO" | jq -r '.Service.Status')
SERVICE_URL=$(echo "$SERVICE_INFO" | jq -r '.Service.ServiceUrl')

echo "Status: $STATUS"
echo "URL: $SERVICE_URL"
echo ""

if [ "$STATUS" = "RUNNING" ]; then
  echo "✅ Service is RUNNING!"
  echo ""
  echo "Test it:"
  echo "  curl $SERVICE_URL/health"
  echo ""
  echo "Save URL:"
  echo "  echo '$SERVICE_URL' > deploy/output/backend-url.txt"
elif [ "$STATUS" = "CREATE_FAILED" ]; then
  echo "❌ Service creation failed"
  echo ""
  echo "Check logs in AWS Console:"
  echo "  https://console.aws.amazon.com/apprunner/home?region=${AWS_REGION}#/services/${SERVICE_ARN}"
else
  echo "⏳ Service is $STATUS (still starting...)"
  echo ""
  echo "Wait a few minutes and check again:"
  echo "  ./deploy/scripts/check-backend-status.sh"
fi

