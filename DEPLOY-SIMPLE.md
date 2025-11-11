# 🚀 Simple Cloud Deployment Guide (MVP)

**Goal**: Get your app running in the cloud in 30 minutes - no domain needed!

## What You'll Get

- ✅ Frontend: `https://your-app-12345.amplifyapp.com` (free domain)
- ✅ Backend: `https://abc123.us-east-1.awsapprunner.com` (free domain)
- ✅ Automatic HTTPS (SSL included)
- ✅ Auto-deployments (updates when you push code)

---

## Step 1: Prerequisites (5 minutes)

### 1.1 Install AWS CLI

**Mac:**
```bash
brew install awscli
```

**Windows:**
Download from: https://aws.amazon.com/cli/

**Linux:**
```bash
sudo apt-get install awscli
```

### 1.2 Configure AWS

```bash
aws configure
```

You'll need:
- **AWS Access Key ID**: Get from https://console.aws.amazon.com/iam → Users → Your User → Security Credentials → Create Access Key
- **AWS Secret Access Key**: Same place
- **Default region**: `us-east-1` (or your preferred region)
- **Default output format**: `json`

### 1.3 Verify Setup

```bash
aws sts get-caller-identity
```

Should show your AWS account ID.

### 1.4 Install Docker (for backend)

**Mac:** Download Docker Desktop from https://www.docker.com/products/docker-desktop

**Verify:**
```bash
docker --version
```

---

## Step 2: Prepare Your Code (2 minutes)

### 2.1 Make sure you're in the project directory

```bash
cd /Users/davaakhatanzorigtbaatar/Downloads/Private/2024/2025/CLassboxes/Gauntlet\ AI/Projects/Silver/DevEnv
```

### 2.2 Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit"
```

---

## Step 3: Deploy Backend (10 minutes)

### 3.1 Run the backend deployment script

```bash
cd deploy/scripts/amplify
chmod +x 01-deploy-backend-apprunner.sh
./01-deploy-backend-apprunner.sh us-east-1 $(aws sts get-caller-identity --query Account --output text) zero-to-running
```

**What this does:**
- Creates a container registry (ECR)
- Builds your backend Docker image
- Pushes it to AWS
- Creates an App Runner service
- Gives you a backend URL

**Wait 5-10 minutes** for the service to start.

### 3.2 Get Your Backend URL

```bash
cat ../../output/backend-url.txt
```

**Save this URL!** You'll need it for the frontend. It looks like:
```
https://abc123.us-east-1.awsapprunner.com
```

---

## Step 4: Deploy Frontend (15 minutes)

### 4.1 Push Code to GitHub (if not already)

**Option A: Create new GitHub repo**

1. Go to https://github.com/new
2. Create a new repository (e.g., `zero-to-running`)
3. Don't initialize with README
4. Copy the repository URL

**Option B: Use existing repo**

Just use your existing GitHub repo URL.

### 4.2 Add Remote and Push

```bash
cd /Users/davaakhatanzorigtbaatar/Downloads/Private/2024/2025/CLassboxes/Gauntlet\ AI/Projects/Silver/DevEnv

# Replace YOUR_USERNAME and YOUR_REPO with your actual values
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 4.3 Deploy to Amplify via Console (Easiest Way)

1. **Go to AWS Amplify Console:**
   https://console.aws.amazon.com/amplify/home?region=us-east-1

2. **Click "New app" → "Host web app"**

3. **Choose your Git provider** (GitHub, GitLab, or Bitbucket)

4. **Authorize AWS** to access your repositories

5. **Select your repository** and branch (`main`)

6. **Configure build settings:**
   - Amplify should auto-detect `amplify.yml`
   - If not, use this:
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

7. **Add environment variable:**
   - Click "Advanced settings"
   - Add environment variable:
     - **Key**: `NEXT_PUBLIC_API_URL`
     - **Value**: Your backend URL from Step 3.2 (e.g., `https://abc123.us-east-1.awsapprunner.com`)

8. **Click "Save and deploy"**

9. **Wait 3-5 minutes** for the build to complete

10. **Get your frontend URL:**
    - Once build completes, you'll see a URL like:
    - `https://main.abc123.amplifyapp.com`

---

## Step 5: Test Your App (2 minutes)

### 5.1 Test Backend

```bash
# Replace with your actual backend URL
curl https://your-backend-url.us-east-1.awsapprunner.com/health
```

Should return: `{"status":"healthy",...}`

### 5.2 Test Frontend

Open your Amplify URL in browser:
```
https://main.abc123.amplifyapp.com
```

You should see your dashboard!

---

## 🎉 You're Done!

Your app is now live in the cloud:
- **Frontend**: Your Amplify URL
- **Backend**: Your App Runner URL

---

## Quick Reference: Your URLs

Save these somewhere:

```
Frontend: https://main.abc123.amplifyapp.com
Backend:  https://abc123.us-east-1.awsapprunner.com
```

---

## Updating Your App

### Update Frontend:
```bash
git add .
git commit -m "Update frontend"
git push
```
Amplify will automatically rebuild and deploy (takes 3-5 minutes)

### Update Backend:
```bash
cd deploy/scripts/amplify
./01-deploy-backend-apprunner.sh us-east-1 $(aws sts get-caller-identity --query Account --output text) zero-to-running
```
App Runner will automatically pull the new image

---

## Troubleshooting

### "AWS credentials not configured"
```bash
aws configure
# Enter your Access Key ID and Secret Access Key
```

### "Docker not running"
- Mac: Open Docker Desktop app
- Wait for it to start (whale icon in menu bar)

### "Backend health check failing"
- Wait 5-10 minutes for App Runner to fully start
- Check logs: AWS Console → App Runner → Your service → Logs

### "Frontend build failing"
- Check build logs in Amplify Console
- Make sure `NEXT_PUBLIC_API_URL` environment variable is set correctly
- Verify `amplify.yml` exists in your repo

### "CORS errors in browser"
- Update backend CORS to allow your Amplify domain
- In AWS Console → App Runner → Your service → Configuration
- Add environment variable: `FRONTEND_URL` = your Amplify URL

---

## Cost

**Free tier:**
- Amplify: 1000 build minutes/month free
- App Runner: First 5GB-hours free

**After free tier:**
- ~$15-25/month total

---

## Need Help?

1. Check AWS Console for error messages
2. View logs in CloudWatch
3. Verify all environment variables are set
4. Make sure Docker is running for backend builds

---

## Next Steps (Optional)

1. **Add custom domain** (later):
   - Amplify Console → Domain management → Add domain

2. **Set up monitoring**:
   - CloudWatch dashboards
   - Alarms for errors

3. **Add database** (if needed):
   - AWS RDS (PostgreSQL)
   - Or use a managed service

---

**That's it! Your MVP is now in the cloud! 🚀**

