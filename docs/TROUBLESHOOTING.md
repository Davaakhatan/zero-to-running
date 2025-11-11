# Troubleshooting Guide

## Docker Issues

### Docker Daemon Not Running

**Error**: `Cannot connect to the Docker daemon`

**Solution**:
1. **Start Docker Desktop**
   - Open Docker Desktop application
   - Wait for it to fully start (whale icon in menu bar should be steady)
   - Verify: `docker ps` should work

2. **If Docker Desktop keeps crashing**:
   - Increase Docker Desktop memory limit:
     - Docker Desktop → Settings → Resources → Advanced
     - Increase Memory to at least 4GB (8GB recommended)
   - Restart Docker Desktop
   - Try again: `make dev`

### Docker Build Fails / Timeout

**Error**: Build process hangs or times out

**Solutions**:

1. **Clean up Docker**:
   ```bash
   # Remove old containers and images
   make clean
   
   # Or manually:
   docker system prune -a --volumes
   ```

2. **Increase Docker Resources**:
   - Docker Desktop → Settings → Resources
   - Memory: 4-8GB
   - CPUs: 2-4 cores
   - Disk: At least 20GB free

3. **Build with more verbose output**:
   ```bash
   docker-compose build --progress=plain
   ```

4. **Build services individually**:
   ```bash
   # Build backend first
   docker-compose build backend
   
   # Then frontend
   docker-compose build frontend
   ```

### Frontend Build Context Too Large

**Error**: Build context is 500MB+ and takes forever

**Solution**: `.dockerignore` file is now included to exclude:
- `node_modules`
- `.next` build artifacts
- Documentation files
- Git files
- Backend directory (from frontend build)

If still slow, check what's being copied:
```bash
docker build -f Dockerfile.frontend --progress=plain .
```

## Port Conflicts

### Port Already in Use

**Error**: `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solutions**:

1. **Find what's using the port**:
   ```bash
   # macOS/Linux
   lsof -i :3000
   lsof -i :3003
   lsof -i :5432
   lsof -i :6379
   ```

2. **Stop the conflicting service**:
   ```bash
   # Kill process (replace PID with actual process ID)
   kill -9 <PID>
   ```

3. **Change ports in docker-compose.yml**:
   ```yaml
   ports:
     - "3001:3000"  # Change host port
   ```

## Container Issues

### Container Exits Immediately

**Check logs**:
```bash
make logs
# or
docker-compose logs <service-name>
```

**Common causes**:
- Environment variables missing
- Database connection failed
- Port conflict
- Build error

### Services Not Healthy

**Check health**:
```bash
make health
```

**Manual checks**:
```bash
# Frontend
curl http://localhost:3000

# Backend
curl http://localhost:3003/health

# PostgreSQL
docker-compose exec postgres pg_isready -U devuser

# Redis
docker-compose exec redis redis-cli ping
```

### Database Connection Errors

**Error**: `Connection refused` or `ECONNREFUSED`

**Solutions**:

1. **Wait for database to be ready**:
   ```bash
   # Check if postgres is healthy
   docker-compose ps postgres
   
   # Check logs
   docker-compose logs postgres
   ```

2. **Verify connection string**:
   - Check `docker-compose.yml` environment variables
   - Ensure `DATABASE_URL` matches PostgreSQL credentials

3. **Reset database**:
   ```bash
   make down
   docker volume rm devenv_postgres_data
   make dev
   ```

## Performance Issues

### Build Takes Too Long

**Optimizations**:

1. **Use Docker layer caching**:
   - Don't change `package.json` unnecessarily
   - Copy package files before source code (already done)

2. **Build in stages**:
   ```bash
   # Build images separately
   docker-compose build postgres redis  # Fast
   docker-compose build backend        # Medium
   docker-compose build frontend      # Slow
   ```

3. **Use BuildKit** (faster builds):
   ```bash
   DOCKER_BUILDKIT=1 docker-compose build
   ```

### High Memory Usage

**Solutions**:

1. **Increase Docker Desktop memory**:
   - Settings → Resources → Memory → 8GB+

2. **Limit container resources** in `docker-compose.yml`:
   ```yaml
   services:
     frontend:
       deploy:
         resources:
           limits:
             memory: 2G
   ```

## Network Issues

### Services Can't Communicate

**Error**: `Connection refused` between containers

**Solutions**:

1. **Check network**:
   ```bash
   docker network ls
   docker network inspect devenv_dev-env-network
   ```

2. **Use service names** (not localhost):
   - ✅ `postgres:5432`
   - ❌ `localhost:5432` (inside containers)

3. **Restart network**:
   ```bash
   make down
   make dev
   ```

## Quick Fixes

### Reset Everything

```bash
# Stop and remove everything
make down

# Clean Docker system
docker system prune -a --volumes

# Restart Docker Desktop

# Try again
make dev
```

### View All Logs

```bash
# All services
make logs

# Specific service
make logs-backend
make logs-frontend
make logs-db
```

### Check Service Status

```bash
# Docker Compose status
make status

# Docker containers
docker ps -a

# Health checks
make health
```

## Common Error Messages

| Error | Solution |
|-------|----------|
| `Cannot connect to Docker daemon` | Start Docker Desktop |
| `Port already in use` | Stop conflicting service or change port |
| `Build context too large` | Check `.dockerignore` is working |
| `Container exits immediately` | Check logs with `make logs` |
| `Connection refused` | Wait for dependencies, check service names |
| `Out of memory` | Increase Docker Desktop memory limit |

## Still Having Issues?

1. **Check Docker Desktop logs**:
   - Docker Desktop → Troubleshoot → View logs

2. **Verify system requirements**:
   - macOS: 10.15+ with 8GB+ RAM
   - Windows: Windows 10+ with WSL2
   - Linux: Docker Engine installed

3. **Try minimal setup**:
   ```bash
   # Start just database and cache
   docker-compose up -d postgres redis
   
   # Then start backend manually
   cd backend && pnpm dev
   ```

4. **Check for updates**:
   - Docker Desktop: Check for updates
   - Docker Compose: `docker-compose version`

