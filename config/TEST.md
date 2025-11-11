# Testing Environment Profiles

## Quick Test Guide

### 1. Test Development Environment (Default)

```bash
# Start in development mode
make dev

# Check which config is being used
docker-compose exec backend cat /app/config/dev.yaml 2>/dev/null || echo "Config loaded from: config/dev.yaml"

# Verify backend loaded the config
curl http://localhost:3003/api/config | jq .
```

### 2. Test Staging Environment

```bash
# Stop current services
make down

# Start in staging mode
make dev-staging

# Verify staging config is loaded
curl http://localhost:3003/api/config | jq .

# Check the config shows staging values
curl http://localhost:3003/api/config | jq '.services.database.name'
# Should show: "devenv_staging"
```

### 3. Test Production Environment

```bash
# Stop current services
make down

# Start in production mode
make dev-production

# Verify production config is loaded
curl http://localhost:3003/api/config | jq .

# Check the config shows production values
curl http://localhost:3003/api/config | jq '.services.database.name'
# Should show: "devenv_production"
```

### 4. Test Environment Variable Override

```bash
# Stop current services
make down

# Start with explicit environment variable
ENV=staging make dev

# Verify it works the same as make dev-staging
curl http://localhost:3003/api/config | jq '.services.database.name'
```

## Automated Test Script

Run the test script:

```bash
chmod +x config/test-environments.sh
./config/test-environments.sh
```

## Manual Verification Steps

### Step 1: Verify Config Files Exist

```bash
ls -la config/
# Should show: dev.yaml, staging.yaml, production.yaml
```

### Step 2: Check Makefile Help

```bash
make help
# Should show: dev-staging and dev-production commands
```

### Step 3: Test Each Environment

For each environment (dev, staging, production):

1. **Start the environment:**
   ```bash
   make dev              # or make dev-staging, make dev-production
   ```

2. **Wait for services to be healthy:**
   ```bash
   make health
   ```

3. **Check backend config API:**
   ```bash
   curl http://localhost:3003/api/config
   ```

4. **Verify expected values:**
   - **dev**: `database.name` should be `devenv`
   - **staging**: `database.name` should be `devenv_staging`
   - **production**: `database.name` should be `devenv_production`

5. **Check health check intervals:**
   ```bash
   curl http://localhost:3003/api/config | jq '.healthChecks'
   ```
   - **dev**: `interval: 30`
   - **staging**: `interval: 30`
   - **production**: `interval: 15` (more frequent)

### Step 4: Test Backend Logs

Check backend logs to see which config file was loaded:

```bash
docker-compose logs backend | grep -i config
# Should show config loading messages
```

## Expected Results

### Development Environment
- Config file: `config/dev.yaml`
- Database name: `devenv`
- Health check interval: `30` seconds
- Hosts: `localhost`

### Staging Environment
- Config file: `config/staging.yaml`
- Database name: `devenv_staging`
- Health check interval: `30` seconds
- Hosts: `staging-*.yourdomain.com`

### Production Environment
- Config file: `config/production.yaml`
- Database name: `devenv_production`
- Health check interval: `15` seconds (more frequent)
- Hosts: `*.yourdomain.com`

## Troubleshooting

### Issue: Config file not found
**Error**: `❌ Config file config/staging.yaml not found!`

**Solution**: Make sure all config files exist:
```bash
ls config/*.yaml
```

### Issue: Backend still using dev config
**Check**: Verify `CONFIG_PATH` is set in docker-compose:
```bash
docker-compose exec backend env | grep CONFIG_PATH
```

**Solution**: Restart services after changing environment:
```bash
make down
make dev-staging  # or your chosen environment
```

### Issue: Config API returns wrong values
**Check**: Verify backend container has the correct config:
```bash
docker-compose exec backend cat /app/config/dev.yaml
```

**Solution**: Rebuild containers:
```bash
make down
make build
make dev-staging
```

