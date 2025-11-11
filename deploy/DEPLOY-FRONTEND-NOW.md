# 🚀 Deploy Frontend to Amplify - Step by Step

## ✅ Backend is Ready!

**Backend URL:** `https://uqjptiyej9.us-east-1.awsapprunner.com`  
**Status:** ✅ Healthy and Running

## 📋 Deploy Frontend (5 minutes)

### Step 1: Push Code to GitHub (if not already)

```bash
# Check if you have a remote
git remote -v

# If no remote, add one:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Step 2: Go to AWS Amplify Console

**Click here:** https://console.aws.amazon.com/amplify/home?region=us-east-1

### Step 3: Create New App

1. Click **"New app"** button (top right)
2. Select **"Host web app"**
3. Choose your Git provider:
   - **GitHub** (most common)
   - Or GitLab/Bitbucket

### Step 4: Authorize & Connect

1. **Authorize AWS** to access your repositories
2. **Select your repository** (the one with your code)
3. **Select branch:** `main` (or `master`)
4. Click **"Next"**

### Step 5: Configure Build Settings

Amplify should **auto-detect** `amplify.yml`. If not, use:

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

### Step 6: Add Environment Variable (IMPORTANT!)

Click **"Advanced settings"** → **"Environment variables"**

Add this variable:
- **Key:** `NEXT_PUBLIC_API_URL`
- **Value:** `https://uqjptiyej9.us-east-1.awsapprunner.com`

**This connects your frontend to your backend!**

### Step 7: Deploy

1. Click **"Save and deploy"**
2. Wait 3-5 minutes for build
3. **Done!** You'll see your frontend URL

## 🎉 Your App Will Be Live!

You'll get a URL like: `https://main.abc123.amplifyapp.com`

Open it in your browser and your full MVP will be running! 🚀

## 🔍 Troubleshooting

**Build fails?**
- Check build logs in Amplify Console
- Make sure `amplify.yml` exists in your repo
- Verify `NEXT_PUBLIC_API_URL` is set correctly

**CORS errors?**
- Backend CORS is already configured
- If issues, update backend `FRONTEND_URL` env var to your Amplify URL

**Need help?**
- Check Amplify build logs
- Verify environment variables are set
- Make sure backend URL is correct

---

**That's it! Your MVP will be live in the cloud in 5 minutes!** 🎉

