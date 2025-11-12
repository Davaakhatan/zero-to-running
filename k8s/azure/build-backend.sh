#!/bin/bash
# Build and push Backend Docker image to Azure Container Registry

set -e

AZURE_RESOURCE_GROUP=${AZURE_RESOURCE_GROUP:-dev-env-rg}
AZURE_REGION=${AZURE_REGION:-eastus}
ACR_NAME=${ACR_NAME:-devenvregistry}
REPO_NAME="dev-env-backend"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [ -z "$AZURE_RESOURCE_GROUP" ] || [ -z "$ACR_NAME" ]; then
    echo "❌ Azure configuration missing. Please set:"
    echo "   export AZURE_RESOURCE_GROUP=your-resource-group"
    echo "   export ACR_NAME=your-acr-name"
    exit 1
fi

REPO="${ACR_NAME}.azurecr.io/${REPO_NAME}"

echo "🐳 Building and pushing Backend to Azure Container Registry"
echo "==========================================="
echo "Resource Group: $AZURE_RESOURCE_GROUP"
echo "ACR: $ACR_NAME"
echo "Repository: $REPO"
echo ""

# Check if ACR exists
echo "📦 Checking Azure Container Registry..."
if ! az acr show --name $ACR_NAME --resource-group $AZURE_RESOURCE_GROUP >/dev/null 2>&1; then
    echo "  Creating ACR..."
    az acr create \
        --resource-group $AZURE_RESOURCE_GROUP \
        --name $ACR_NAME \
        --sku Basic \
        --admin-enabled true
    echo "  ✅ ACR created"
else
    echo "  ✅ ACR exists"
fi

# Login to ACR
echo ""
echo "🔐 Logging in to ACR..."
az acr login --name $ACR_NAME

# Build image
echo ""
echo "🔨 Building Backend Docker image..."
cd "$PROJECT_ROOT/backend"
docker build -t dev-env-backend:latest .

# Tag for ACR
echo ""
echo "🏷️  Tagging image..."
docker tag dev-env-backend:latest $REPO:latest

# Push to ACR
echo ""
echo "📤 Pushing to ACR (this may take a few minutes)..."
docker push $REPO:latest

echo ""
echo "✅ Backend image pushed successfully!"
echo "   Image: $REPO:latest"

