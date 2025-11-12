# Architecture Documentation
## Zero-to-Running Developer Environment

## Architecture Overview

The Zero-to-Running Developer Environment is a **framework/template** that provides infrastructure services and a monitoring dashboard. You add your own applications to this framework. The architecture follows a multi-service pattern with a central backend API, all orchestrated via Docker Compose for local development and Kubernetes for production.

```
┌─────────────────────────────────────────────────────────┐
│              Developer's Local Machine                 │
│                                                         │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │  Application     │         │  Dashboard       │    │
│  │  Frontend        │         │  Frontend        │    │
│  │  (Port 3000)     │         │  (Port 3001)     │    │
│  │                  │         │                  │    │
│  │  - Your App      │         │  - Monitoring UI │    │
│  │  - User-facing   │         │  - Service Status│    │
│  │  - What you      │         │  - Logs Viewer   │    │
│  │    build         │         │  - Resources     │    │
│  └────────┬─────────┘         └────────┬─────────┘    │
│           │                            │               │
│           │                            │               │
│           └────────────┬───────────────┘               │
│                        │                               │
│                  ┌─────▼─────┐                        │
│                  │  Backend   │                        │
│                  │  API       │                        │
│                  │  (3003)    │                        │
│                  └─────┬─────┘                        │
│                        │                               │
│           ┌────────────┴────────────┐                 │
│           │                         │                 │
│      ┌────▼─────┐            ┌─────▼─────┐           │
│      │PostgreSQL│            │   Redis   │           │
│      │  (5432)  │            │  (6379)   │           │
│      └──────────┘            └───────────┘           │
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │         Docker Compose Orchestration         │      │
│  │  - Service definitions                      │      │
│  │  - Health checks                            │      │
│  │  - Volume persistence                       │      │
│  │  - Network isolation                        │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## Framework Architecture

### Core Components

The framework provides:

1. **Infrastructure Services** (Core)
   - PostgreSQL database
   - Redis cache
   - Backend API server
   - Dashboard Frontend (monitoring)

2. **Your Applications** (You Add These)
   - Your application frontend(s)
   - Any additional services you need
   - The dashboard automatically discovers and monitors them

### Dashboard Frontend (Port 3001)

**Purpose**: Monitoring and management tool for the entire environment

**Technology Stack**:
- React 19.2.0
- Next.js 16 (App Router)
- TypeScript 5.x
- Tailwind CSS 4.1.9
- shadcn/ui component library

**Responsibilities**:
- Real-time service monitoring (dynamically discovers all services)
- Log aggregation and viewing
- Resource usage tracking
- Configuration management
- Service control (start/stop/restart)
- Cloud-aware setup wizard

**Pages**:
- Setup Wizard (cloud-aware prerequisites)
- Dashboard Overview
- Services Status (all discovered services)
- Logs & Health Checks
- Configuration
- Environments
- Dependencies Graph
- Resource Usage

## Adding Your Own Applications

### Framework vs. Your Applications

This is a **framework/template**. The core infrastructure (PostgreSQL, Redis, Backend API, Dashboard) is provided. You need to:

1. **Add your application** to the `docker-compose.yml`
2. **Configure it** to use the Backend API
3. **Add health check endpoint** (optional but recommended)
4. **Create Kubernetes manifests** for production (if needed)
5. **Create build scripts** for your cloud provider

### Example: Adding an Application

```yaml
# docker-compose.yml
services:
  your-app:
    build: ./your-app
    ports:
      - "3000:3000"
    environment:
      - BACKEND_URL=http://backend:3003
      - DATABASE_URL=postgresql://user:pass@postgres:5432/dbname
    depends_on:
      - backend
      - postgres
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Health Check Requirements

For your application to be monitored by the dashboard:

1. **Expose a health endpoint** (e.g., `/health` or `/api/health`)
2. **Return JSON** with status information:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-01-01T00:00:00Z"
   }
   ```
3. **The dashboard will automatically discover it** via the Backend API's service discovery

### Integration with Backend API

Your applications should communicate with the Backend API:

```typescript
// Example: Your app calling the backend
const response = await fetch('http://backend:3003/api/your-endpoint');
```

The Backend API provides:
- Database access (PostgreSQL)
- Cache access (Redis)
- Service monitoring
- Log aggregation
- Configuration management

### Dashboard Frontend

**Purpose**: Monitoring and management interface

**Technology Stack**:
- React 19.2.0
- Next.js 16 (App Router)
- TypeScript 5.x
- Tailwind CSS 4.1.9
- shadcn/ui component library

**Responsibilities**:
- Real-time service monitoring
- Log aggregation and viewing
- Resource usage tracking
- Configuration management
- Service control (start/stop/restart)

**Pages**:
- Setup Wizard
- Dashboard Overview
- Services Status
- Logs & Health Checks
- Configuration
- Environments
- Dependencies Graph
- Resource Usage

## Backend API

**Purpose**: Central API server for all services

**Technology Stack**:
- Node.js 20+
- Fastify (TypeScript)
- PostgreSQL client (pg)
- Redis client (redis)
- Docker SDK (dockerode)

**Responsibilities**:
- Service health checks
- Service status monitoring
- Log aggregation from Docker containers
- Resource monitoring (CPU, memory, network)
- Service control (start/stop/restart)
- Configuration management
- Setup wizard data

**Endpoints**:
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with dependencies
- `GET /api/services` - Service status list
- `GET /api/services/:id` - Individual service status
- `POST /api/services/:id/start` - Start service
- `POST /api/services/:id/stop` - Stop service
- `POST /api/services/:id/restart` - Restart service
- `GET /api/logs` - Aggregated logs from all containers
- `GET /api/resources` - Container resource usage
- `GET /api/config` - Get configuration
- `PUT /api/config` - Update configuration
- `GET /api/setup/status` - Setup wizard status

## Data Layer

### PostgreSQL

**Purpose**: Primary database

**Configuration**:
- Port: 5432
- Database: `devenv`
- User: `devuser`
- Password: `devpass` (development only)
- Volume: `postgres_data` (persistent)

**Usage**:
- Application data storage
- Backend API data persistence

### Redis

**Purpose**: Caching layer

**Configuration**:
- Port: 6379
- Volume: `redis_data` (persistent)

**Usage**:
- Session caching
- Application caching
- Rate limiting

## Infrastructure

### Docker Compose

**Purpose**: Local development orchestration

**Core Services** (Framework Provided):
1. `postgres` - PostgreSQL database
2. `redis` - Redis cache
3. `backend` - Backend API server
4. `dashboard-frontend` - Dashboard frontend

**Your Services** (You Add These):
- Your application(s) - Add to `docker-compose.yml` as needed
- The dashboard automatically discovers and monitors all services

**Features**:
- Service dependencies and startup ordering
- Health checks for all services
- Volume persistence for data
- Network isolation
- Log rotation (10MB max, 3 files per service)

### Service Dependencies

**Core Framework Dependencies**:
```
postgres (no dependencies)
redis (no dependencies)
backend (depends on: postgres, redis)
dashboard-frontend (depends on: backend)
```

**Your Applications**:
- Should depend on `backend` (and optionally `postgres`, `redis`)
- The dashboard will automatically discover them

## Communication Flow

### Frontend to Backend
- Both frontends communicate with backend via REST API
- Backend API URL: `http://localhost:3003` (or `http://backend:3003` from containers)
- CORS enabled for localhost origins

### Backend to Services
- Backend uses Docker SDK to interact with containers
- Health checks via HTTP endpoints
- Log aggregation via Docker logs API
- Resource monitoring via Docker stats API

### Inter-Container Communication
- Services communicate via Docker network: `dev-env-network`
- Service names resolve via Docker DNS
- Example: `http://backend:3003` from frontend containers

## Health Checks

**Core Framework Services**:
- **Backend**: `GET /health`
- **Dashboard Frontend**: `GET /api/health`
- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`

**Your Applications**:
- Should expose a health endpoint (e.g., `GET /health` or `GET /api/health`)
- Return JSON with `status` field
- Backend will automatically discover and monitor it

Backend aggregates all health checks in `/health/detailed`.

## Log Management

### Log Sources
- All Docker containers output logs
- Backend parses Docker logs via Docker SDK
- Logs include timestamps, levels, and service names

### Log Rotation
- Configured in `docker-compose.yml`
- Max size: 10MB per log file
- Max files: 3 per service
- Prevents disk full issues

### Log Aggregation
- Backend fetches logs from all containers
- Parses Docker log format (8-byte headers)
- Supports filtering by service, level, and time
- Real-time updates via polling (5-second intervals)

## Resource Monitoring

### Metrics Collected
- CPU usage per container
- Memory usage and limits
- Network I/O (inbound/outbound)

### Data Source
- Docker SDK (`dockerode`)
- Real-time stats from Docker daemon
- Updated every 10 seconds

## Service Control

### Supported Actions
- **Start**: Start a stopped container
- **Stop**: Stop a running container
- **Restart**: Restart a container

### Implementation
- Backend uses Docker SDK to control containers
- Checks container state before actions
- Returns success/failure status

## Configuration Management

### Configuration File
- Location: `config/dev.yaml`
- Format: YAML
- Services: Database, Redis, Backend, Frontends

### Configuration API
- `GET /api/config` - Read current configuration
- `PUT /api/config` - Update configuration
- Changes persist to `config/dev.yaml`

## Development Workflow

1. **Start Environment**: `make dev`
2. **Add Your Application**: Add your app to `docker-compose.yml`
3. **Develop Application**: Edit your application code
4. **Monitor Services**: View dashboard at http://localhost:3001 (automatically discovers all services)
5. **Check Logs**: Use Logs & Health page
6. **Control Services**: Use Quick Actions panel
7. **Stop Environment**: `make down`

## Production Considerations

### Current State
- ✅ Local development fully functional
- ✅ Kubernetes manifests for AWS EKS, Azure AKS, GCP GKE
- ✅ Multi-cloud build scripts
- ✅ Cloud-aware setup wizard
- ✅ Dynamic service discovery

### Production Deployment
- Kubernetes orchestration (AWS/Azure/GCP)
- Build scripts for all cloud providers
- Environment-specific configurations
- Secrets management (cloud-native)
- Monitoring and alerting

---

**Note**: This is a framework/template. Add your own applications by configuring them in `docker-compose.yml` and creating Kubernetes manifests for production. The dashboard will automatically discover and monitor all services you add.
