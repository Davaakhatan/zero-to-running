# Setup Guide

## Prerequisites

Before running `make dev`, ensure you have the following installed:

### Required Software

1. **Docker** (v20.10+)
   - Install: https://docs.docker.com/get-docker/
   - Verify: `docker --version`

2. **Docker Compose** (v2.0+)
   - Usually included with Docker Desktop
   - Verify: `docker-compose --version`

3. **pnpm** (v8.0+)
   - Install: `npm install -g pnpm`
   - Verify: `pnpm --version`

4. **Make** (optional, for `make` commands)
   - macOS/Linux: Usually pre-installed
   - Windows: Install via Chocolatey or use WSL
   - Verify: `make --version`

### Optional (for local development without Docker)

- **Node.js** (v20+)
- **PostgreSQL** (v16+)
- **Redis** (v7+)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Davaakhatan/zero-to-running.git
cd zero-to-running
```

### 2. Start Everything (Single Command)

```bash
make dev
```

This single command will:
- Start PostgreSQL database
- Start Redis cache
- Start Backend API server
- Start Frontend application
- Wait for all services to be healthy
- Display access URLs

### 3. Access the Dashboard

Open your browser to: **http://localhost:3000**

## Manual Setup (Without Docker)

If you prefer to run services locally without Docker:

### 1. Install Dependencies

```bash
# Frontend
pnpm install

# Backend
cd backend
pnpm install
cd ..
```

### 2. Start PostgreSQL

```bash
# macOS (with Homebrew)
brew services start postgresql@16

# Or using Docker
docker run -d \
  --name postgres \
  -e POSTGRES_USER=devuser \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=devenv \
  -p 5432:5432 \
  postgres:16-alpine
```

### 3. Start Redis

```bash
# macOS (with Homebrew)
brew services start redis

# Or using Docker
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine
```

### 4. Start Backend

```bash
cd backend
pnpm dev
```

Backend will run on: **http://localhost:3003**

### 5. Start Frontend

```bash
# In a new terminal
pnpm dev
```

Frontend will run on: **http://localhost:3000**

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
POSTGRES_USER=devuser
POSTGRES_PASSWORD=devpass
POSTGRES_DB=devenv
DATABASE_URL=postgresql://devuser:devpass@localhost:5432/devenv

# Redis
REDIS_URL=redis://localhost:6379

# Backend
PORT=3003
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3003
```

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start all services |
| `make down` | Stop and remove all services |
| `make up` | Alias for `make dev` |
| `make stop` | Stop services (keep volumes) |
| `make restart` | Restart all services |
| `make build` | Build Docker images |
| `make clean` | Remove everything (containers, volumes, images) |
| `make logs` | View all service logs |
| `make logs-frontend` | View frontend logs |
| `make logs-backend` | View backend logs |
| `make status` | Show service status |
| `make health` | Check service health |
| `make check` | Run TypeScript type checks |
| `make help` | Show all available commands |

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

1. **Find what's using the port:**
   ```bash
   # macOS/Linux
   lsof -i :3000
   lsof -i :3003
   lsof -i :5432
   lsof -i :6379
   ```

2. **Stop the conflicting service or change ports in `docker-compose.yml`**

### Docker Not Running

```bash
# Check Docker status
docker ps

# Start Docker Desktop (if installed)
# Or start Docker daemon
```

### Services Not Starting

1. **Check logs:**
   ```bash
   make logs
   ```

2. **Check service status:**
   ```bash
   make status
   ```

3. **Rebuild images:**
   ```bash
   make build
   make dev
   ```

### Database Connection Issues

1. **Verify PostgreSQL is running:**
   ```bash
   docker-compose ps postgres
   ```

2. **Check connection:**
   ```bash
   make shell-db
   ```

3. **Verify environment variables in `docker-compose.yml`**

### TypeScript Errors

Run type checking:
```bash
make check
# or
pnpm type-check:all
```

## Next Steps

After setup:
1. Access the dashboard at http://localhost:3000
2. Explore the service monitoring interface
3. Check health endpoints: http://localhost:3003/health
4. Review API documentation in `docs/`

## Support

For issues or questions:
- Check `docs/` directory for detailed documentation
- Review `docs/TROUBLESHOOTING.md` (if available)
- Check service logs: `make logs`

