# ⚡ Quick Start - Deploy to Cloud in 3 Commands

## Prerequisites Check

```bash
# 1. Check AWS CLI
aws --version

# 2. Check Docker
docker --version

# 3. Check AWS credentials
aws sts get-caller-identity
```

If any fail, see `DEPLOY-SIMPLE.md` for setup instructions.

---

## Deploy in 3 Steps

### Step 1: Deploy Backend

```bash
cd deploy/scripts/amplify
chmod +x 01-deploy-backend-apprunner.sh
./01-deploy-backend-apprunner.sh us-east-1 $(aws sts get-caller-identity --query Account --output text) zero-to-running
```

**Wait 5-10 minutes**, then get your backend URL:
```bash
cat ../../output/backend-url.txt
```

### Step 2: Push Code to GitHub

```bash
cd ../../..
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 3: Deploy Frontend in Amplify Console

1. Go to: https://console.aws.amazon.com/amplify
2. Click "New app" → "Host web app"
3. Connect GitHub → Select your repo
4. Add environment variable: `NEXT_PUBLIC_API_URL` = (your backend URL from Step 1)
5. Click "Save and deploy"
6. Wait 3-5 minutes
7. **Done!** Get your URL from Amplify

---

## That's It! 🎉

Your app is live:
- Frontend: `https://main.abc123.amplifyapp.com`
- Backend: `https://abc123.us-east-1.awsapprunner.com`

---

**For detailed instructions, see `DEPLOY-SIMPLE.md`**

