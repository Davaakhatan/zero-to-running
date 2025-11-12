#!/bin/bash
# Build and push CollabCanva Docker image to GCP Artifact Registry

set -e

GCP_PROJECT_ID=${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}
GCP_REGION=${GCP_REGION:-us-central1}
ARTIFACT_REGISTRY=${ARTIFACT_REGISTRY:-true}
REPO_NAME="dev-env-collabcanva"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [ -z "$GCP_PROJECT_ID" ]; then
    echo "❌ GCP_PROJECT_ID is not set. Please set it or configure gcloud:"
    echo "   export GCP_PROJECT_ID=your-project-id"
    echo "   or: gcloud config set project your-project-id"
    exit 1
fi

if [ "$ARTIFACT_REGISTRY" = "true" ]; then
    REPO="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/dev-env/${REPO_NAME}"
else
    REPO="gcr.io/${GCP_PROJECT_ID}/${REPO_NAME}"
fi

echo "🐳 Building and pushing CollabCanva to GCP"
echo "==========================================="
echo "Project: $GCP_PROJECT_ID"
echo "Repository: $REPO"
echo ""

# Check/create Artifact Registry repository
if [ "$ARTIFACT_REGISTRY" = "true" ]; then
    echo "📦 Checking Artifact Registry repository..."
    if ! gcloud artifacts repositories describe dev-env --location=$GCP_REGION --project=$GCP_PROJECT_ID >/dev/null 2>&1; then
        echo "  Creating Artifact Registry repository..."
        gcloud artifacts repositories create dev-env \
            --repository-format=docker \
            --location=$GCP_REGION \
            --project=$GCP_PROJECT_ID \
            --description="Dev Environment Docker images"
        echo "  ✅ Repository created"
    else
        echo "  ✅ Repository exists"
    fi
fi

# Configure Docker authentication
echo ""
echo "🔐 Configuring Docker authentication..."
gcloud auth configure-docker ${GCP_REGION}-docker.pkg.dev --quiet 2>/dev/null || \
gcloud auth configure-docker gcr.io --quiet 2>/dev/null || true

# Build image
echo ""
echo "🔨 Building CollabCanva Docker image..."
cd "$PROJECT_ROOT/collabcanva-app"

# Build with production target and API URL
docker build \
  --target production \
  --build-arg VITE_API_URL=http://backend-service:3003 \
  -t dev-env-collabcanva:latest .

# Tag for GCP
echo ""
echo "🏷️  Tagging image..."
docker tag dev-env-collabcanva:latest $REPO:latest

# Push to GCP
echo ""
echo "📤 Pushing to GCP (this may take a few minutes)..."
docker push $REPO:latest

echo ""
echo "✅ CollabCanva image pushed successfully!"
echo "   Image: $REPO:latest"

