# Architecture Documentation
## Zero-to-Running Developer Environment

## Architecture Overview

The Zero-to-Running Developer Environment follows a **two-frontend architecture** with a multi-service backend, all orchestrated via Docker Compose for local development.

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

## Two-Frontend Architecture

### Why Two Frontends?

The project separates concerns into two distinct frontends:

1. **Application Frontend** (Port 3000)
   - The actual application developers build
   - User-facing application
   - Example: Random Quote Generator
   - Monitored by the dashboard

2. **Dashboard Frontend** (Port 3001)
   - Monitoring and management tool
   - Service status, logs, resources
   - Configuration management
   - Does NOT monitor itself (avoids confusion)

### Application Frontend

**Purpose**: The actual application being developed

**Technology Stack**:
- React 19.2.0
- Next.js 16 (App Router)
- TypeScript 5.x
- Tailwind CSS 4.1.9

**Responsibilities**:
- User-facing application logic
- Business features
- Application-specific UI

**Health Check**: Exposes `/api/health` endpoint for monitoring

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

**Services**:
1. `postgres` - PostgreSQL database
2. `redis` - Redis cache
3. `backend` - Backend API server
4. `app-frontend` - Application frontend
5. `dashboard-frontend` - Dashboard frontend

**Features**:
- Service dependencies and startup ordering
- Health checks for all services
- Volume persistence for data
- Network isolation
- Log rotation (10MB max, 3 files per service)

### Service Dependencies

```
postgres (no dependencies)
redis (no dependencies)
backend (depends on: postgres, redis)
app-frontend (depends on: backend)
dashboard-frontend (depends on: backend, app-frontend)
```

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

All services expose health check endpoints:

- **Backend**: `GET /health`
- **App Frontend**: `GET /api/health`
- **Dashboard Frontend**: `GET /api/health`
- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`

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
2. **Develop Application**: Edit code in `app-frontend/`
3. **Monitor Services**: View dashboard at http://localhost:3001
4. **Check Logs**: Use Logs & Health page
5. **Control Services**: Use Quick Actions panel
6. **Stop Environment**: `make down`

## Production Considerations

### Current State
- ✅ Local development fully functional
- ⏳ Kubernetes manifests (planned for AKS)
- ⏳ Production deployment automation (planned)

### Future Enhancements
- Kubernetes orchestration (AKS)
- Production Docker images
- CI/CD pipeline
- Environment-specific configurations
- Secrets management
- Monitoring and alerting

---

**Note**: This architecture is optimized for local development. Production deployment will use Kubernetes (AKS) with similar service structure but different orchestration.
