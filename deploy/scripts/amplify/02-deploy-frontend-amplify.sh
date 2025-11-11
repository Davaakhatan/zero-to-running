#!/bin/bash

# Deploy Frontend to AWS Amplify (Free default domain included!)

set -e

AWS_REGION=$1
PROJECT_NAME=$2
BACKEND_URL=$3

echo "Preparing frontend for Amplify deployment..."

cd "$(dirname "$0")/../../.."

# Create amplify.yml for build configuration
cat > amplify.yml <<'AMPLIFYEOF'
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g pnpm
        - pnpm install --frozen-lockfile
    build:
      commands:
        - pnpm build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
AMPLIFYEOF

# Update next.config.mjs to use backend URL from environment
if [ -n "$BACKEND_URL" ]; then
  # Create .env.production for Amplify
  echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" > .env.production
  echo "Created .env.production with BACKEND_URL=$BACKEND_URL"
fi

# Check if git repo exists
if [ ! -d .git ]; then
  echo "Initializing git repository..."
  git init
  git add .
  git commit -m "Initial commit for Amplify deployment" || echo "Already committed"
fi

# Check if remote exists
if ! git remote get-url origin >/dev/null 2>&1; then
  echo ""
  echo "⚠️  No Git remote found. You need to:"
  echo "1. Create a GitHub/GitLab/Bitbucket repository"
  echo "2. Add it as remote: git remote add origin YOUR_REPO_URL"
  echo "3. Push: git push -u origin main"
  echo ""
  echo "Or use Amplify Console to connect your repository directly."
  echo ""
  read -p "Press Enter to continue to Amplify Console setup..."
fi

echo "Creating Amplify app..."

# Create Amplify app
APP_ID=$(aws amplify create-app \
  --name "${PROJECT_NAME}-frontend" \
  --region "$AWS_REGION" \
  --environment-variables "NEXT_PUBLIC_API_URL=$BACKEND_URL" \
  --query 'app.appId' --output text 2>/dev/null || \
  aws amplify list-apps --region "$AWS_REGION" --query "apps[?name=='${PROJECT_NAME}-frontend'].appId" --output text | head -1)

if [ -z "$APP_ID" ]; then
  echo "Failed to create Amplify app"
  exit 1
fi

echo "Amplify App ID: $APP_ID"

# Get default domain
AMPLIFY_URL=$(aws amplify get-app \
  --app-id "$APP_ID" \
  --region "$AWS_REGION" \
  --query 'app.defaultDomain' --output text)

if [ -n "$AMPLIFY_URL" ]; then
  FULL_URL="https://${AMPLIFY_URL}"
else
  FULL_URL="https://${APP_ID}.amplifyapp.com"
fi

mkdir -p deploy/output
echo "$FULL_URL" > deploy/output/frontend-url.txt

echo "✓ Amplify app created"
echo "  App ID: $APP_ID"
echo "  URL: $FULL_URL"
echo ""
echo "⚠️  IMPORTANT: Connect your Git repository in Amplify Console:"
echo "   1. Go to: https://console.aws.amazon.com/amplify/home?region=${AWS_REGION}#/${APP_ID}"
echo "   2. Click 'Connect branch'"
echo "   3. Connect your GitHub/GitLab/Bitbucket repository"
echo "   4. Amplify will automatically build and deploy"
echo ""
echo "Or use AWS CLI to connect branch:"
echo "   aws amplify create-branch --app-id $APP_ID --branch-name main --region $AWS_REGION"

