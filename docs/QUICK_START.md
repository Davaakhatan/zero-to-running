# 🚀 Quick Start Guide

Get your development environment running in minutes!

## Prerequisites

### Required
- **Docker Desktop** (v20.10+) - [Download](https://docs.docker.com/get-docker/)
- **Docker Compose** (v2.0+) - Usually included with Docker Desktop
- **Make** (optional but recommended) - Usually pre-installed on macOS/Linux

### Verify Installation
```bash
docker --version
docker-compose --version
make --version  # Optional
```

## Start Everything

```bash
# Single command to start all services
make dev
```

This will:
1. ✅ Pull Docker images (PostgreSQL, Redis)
2. ✅ Build frontend and backend images
3. ✅ Start all services with proper dependencies
4. ✅ Run health checks
5. ✅ Show access URLs

**Wait 30-60 seconds** for all services to start.

## Access Your Application

Once `make dev` completes:

- **Application Frontend**: http://localhost:3000
  - Your actual application (Random Quote Generator example)
  
- **Dashboard Frontend**: http://localhost:3001
  - Monitoring and management dashboard
  - Service status, logs, resources, configuration

- **Backend API**: http://localhost:3003
  - Health check: http://localhost:3003/health

## Verify Everything Works

```bash
# Check service status
make status

# Check health
make health

# View logs
make logs
```

## Stop Everything

```bash
# Stop and remove all containers
make down
```

## Common Issues

### Port Conflicts
```bash
# Check what's using ports (macOS/Linux)
lsof -i :3000
lsof -i :3001
lsof -i :3003

# Stop conflicting services or update ports in docker-compose.yml
```

### Docker Not Starting
- Ensure Docker Desktop is running
- Check Docker daemon: `docker ps`

### Services Not Healthy
```bash
# Check logs
make logs

# Rebuild and restart
make build && make dev
```

## What's Running?

The environment includes:
- **Application Frontend** (Next.js) - Port 3000
- **Dashboard Frontend** (Next.js) - Port 3001
- **Backend API** (Fastify) - Port 3003
- **PostgreSQL** - Port 5432
- **Redis** - Port 6379

All services are containerized and orchestrated via Docker Compose.

## Next Steps

- Explore the dashboard at http://localhost:3001
- Check service health and logs
- Monitor resource usage
- Configure settings via the Configuration page

## Need More Help?

- **Troubleshooting**: See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Architecture**: See [Architecture.md](./Architecture.md)
- **Project Status**: See [STATUS.md](./STATUS.md)
