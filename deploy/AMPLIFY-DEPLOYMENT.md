# AWS Amplify Deployment Guide (No Domain Required!)

This guide shows you how to deploy using **AWS Amplify** for the frontend (includes free default domain) and **AWS App Runner** for the backend.

## ✅ Advantages of Amplify Deployment

- **No domain required** - Amplify provides free default domain (e.g., `yourapp-12345.amplifyapp.com`)
- **Simpler setup** - No VPC, ALB, or complex networking needed
- **Automatic HTTPS** - SSL certificate included
- **Auto-deployments** - Deploys automatically on git push
- **Free tier** - 1000 build minutes/month free
- **Lower cost** - ~$15-50/month vs $140-200/month for full ECS setup

## Prerequisites

1. **AWS CLI** configured
2. **Git** repository (GitHub, GitLab, or Bitbucket)
3. **Docker** (for building backend image)

## Quick Start

### Option 1: Automated Script

```bash
cd deploy
./deploy-amplify.sh
```

### Option 2: Manual Steps

#### Step 1: Deploy Backend to App Runner

```bash
./deploy/scripts/amplify/01-deploy-backend-apprunner.sh us-east-1 YOUR_ACCOUNT_ID zero-to-running
```

This will:
- Create ECR repository
- Build and push backend Docker image
- Create App Runner service
- Provide backend URL (e.g., `https://abc123.us-east-1.awsapprunner.com`)

**Save the backend URL** - you'll need it for the frontend!

#### Step 2: Deploy Frontend to Amplify

```bash
# Set your backend URL
export BACKEND_URL="https://your-backend-url.us-east-1.awsapprunner.com"

./deploy/scripts/amplify/02-deploy-frontend-amplify.sh us-east-1 zero-to-running "$BACKEND_URL"
```

#### Step 3: Connect Git Repository

1. **Push your code to GitHub/GitLab/Bitbucket** (if not already):
   ```bash
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

2. **Connect in Amplify Console**:
   - Go to: https://console.aws.amazon.com/amplify
   - Click "New app" → "Host web app"
   - Connect your Git provider
   - Select your repository and branch
   - Amplify will detect `amplify.yml` automatically
   - Add environment variable: `NEXT_PUBLIC_API_URL` = your backend URL
   - Click "Save and deploy"

3. **Wait for build** (2-5 minutes)

4. **Get your URL**: Amplify will provide a URL like `https://main.abc123.amplifyapp.com`

## Manual Amplify Setup (Alternative)

If you prefer using the AWS Console:

### 1. Create Amplify App

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click "New app" → "Host web app"
3. Connect your Git provider (GitHub/GitLab/Bitbucket)
4. Select your repository
5. Select branch (usually `main` or `master`)

### 2. Configure Build Settings

Amplify should auto-detect `amplify.yml`. If not, use:

```yaml
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
```

### 3. Add Environment Variables

In Amplify Console → App settings → Environment variables:

- `NEXT_PUBLIC_API_URL` = `https://your-backend-url.us-east-1.awsapprunner.com`

### 4. Deploy

Click "Save and deploy" - Amplify will:
- Install dependencies
- Build your Next.js app
- Deploy to CDN
- Provide you with a URL

## Backend Setup (App Runner)

### Why App Runner?

- **Simpler** than ECS (no VPC, ALB, or task definitions)
- **Auto-scaling** built-in
- **HTTPS included** (no certificate management)
- **Free default domain** provided

### App Runner Configuration

The script creates:
- **ECR repository** for your Docker image
- **App Runner service** with:
  - Auto-deployments enabled
  - Health checks on `/health`
  - 0.5 vCPU, 1GB RAM (scalable)
  - Environment variables configured

### Manual App Runner Setup

If you prefer manual setup:

1. **Build and push image**:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
   
   docker build -f backend/Dockerfile.production -t zero-to-running-backend ./backend
   docker tag zero-to-running-backend:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/zero-to-running-backend:latest
   docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/zero-to-running-backend:latest
   ```

2. **Create App Runner service** in AWS Console:
   - Go to App Runner
   - Create service
   - Source: ECR
   - Select your image
   - Port: 3003
   - Environment variables:
     - `NODE_ENV=production`
     - `PORT=3003`
     - `HOST=0.0.0.0`
   - Health check: `/health`

## Cost Comparison

### Amplify + App Runner (This Guide)
- **App Runner**: ~$7/month (0.5 vCPU, 1GB, minimal traffic)
- **Amplify**: Free tier (1000 build min/month) or ~$15/month
- **ECR**: ~$0.10/GB/month
- **Total**: ~$15-25/month

### Full ECS Setup (Previous Guide)
- **ECS Fargate**: ~$30-50/month
- **RDS**: ~$30/month
- **ElastiCache**: ~$15/month
- **ALB**: ~$20/month
- **NAT Gateway**: ~$35/month
- **Total**: ~$140-200/month

## Updating Your App

### Frontend (Amplify)
- **Automatic**: Push to your Git repository
- Amplify detects changes and redeploys automatically
- Build takes 2-5 minutes

### Backend (App Runner)
- **Automatic**: If you enabled auto-deployments
- Or manually: Push new image to ECR, App Runner will pull it

## Custom Domain (Optional)

You can add a custom domain later:

1. In Amplify Console → Domain management
2. Click "Add domain"
3. Enter your domain
4. Follow DNS instructions
5. Amplify handles SSL certificate automatically

## Troubleshooting

### Frontend Build Fails

1. Check build logs in Amplify Console
2. Verify `amplify.yml` is correct
3. Check environment variables are set
4. Ensure `NEXT_PUBLIC_API_URL` is set correctly

### Backend Not Responding

1. Check App Runner service status
2. View logs in CloudWatch
3. Verify health check endpoint: `https://your-backend-url/health`
4. Check environment variables in App Runner

### CORS Errors

Update backend CORS to allow Amplify domain:
```typescript
// In backend/src/index.ts
FRONTEND_URL: "https://your-app.amplifyapp.com"
```

## Next Steps

1. ✅ Deploy using the script or manual steps above
2. ✅ Test your application
3. ✅ (Optional) Add custom domain
4. ✅ Set up monitoring in CloudWatch
5. ✅ Configure auto-scaling in App Runner if needed

## Resources

- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [AWS App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [Amplify Console](https://console.aws.amazon.com/amplify)

