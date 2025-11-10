# Architecture Documentation
## Zero-to-Running Developer Environment

## Architecture Overview

The Zero-to-Running Developer Environment follows a multi-service architecture orchestrated via Kubernetes on AKS (Azure Kubernetes Service).

```
┌─────────────────────────────────────────────────────────┐
│                    Developer Machine                    │
│                                                         │
│  ┌──────────────┐         ┌──────────────┐            │
│  │   Frontend   │────────▶│  Backend API │            │
│  │  (Next.js)   │         │  (Fastify)   │            │
│  │  Port 3000   │         │  Port 3003   │            │
│  └──────────────┘         └──────┬───────┘            │
│                                   │                    │
│                          ┌────────┴────────┐          │
│                          │                 │           │
│                    ┌─────▼─────┐    ┌─────▼─────┐     │
│                    │ PostgreSQL │    │   Redis   │     │
│                    │  Database  │    │   Cache   │     │
│                    └────────────┘    └──────────┘     │
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │         Kubernetes (AKS) Orchestration      │      │
│  │  - Service definitions                      │      │
│  │  - Deployment configs                       │      │
│  │  - Health checks                            │      │
│  │  - Service discovery                        │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend (Next.js)

**Purpose**: Developer dashboard and monitoring UI

**Technology Stack**:
- React 19.2.0
- Next.js 16 (App Router)
- TypeScript 5.x
- Tailwind CSS 4.1.9
- shadcn/ui component library

**Responsibilities**:
- Display service status in real-time
- Show logs and health checks
- Configuration management UI
- Environment setup dashboard
- Setup wizard and prerequisites checker
- Resource usage monitoring
- Service dependency visualization

**Key Components**:
- `MainDashboard`: Navigation and layout
- `ServiceStatusMonitor`: Service health monitoring
- `LogViewerHealthChecks`: Log aggregation and health checks
- `ConfigurationPanel`: Configuration management
- `EnvSetupDashboard`: Environment variable management
- `SetupWizard`: Onboarding and setup flow
- `ServiceDependencyGraph`: Dependency visualization
- `QuickActionsPanel`: Service control
- `ResourceUsageDashboard`: Resource monitoring

### Backend API (Fastify)

**Purpose**: Service orchestration and health monitoring

**Technology Stack**:
- Node.js
- Fastify 4.x
- TypeScript 5.9.3
- PostgreSQL client (pg)
- Redis client (redis)

**Responsibilities**:
- Service lifecycle management
- Health check endpoints (`/health`, `/health/detailed`)
- Service status API (`/api/services`)
- Configuration API (`/api/config`, `PUT /api/config`)
- Log aggregation API (`/api/logs`)
- Database and cache health monitoring

**API Endpoints**:
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with dependencies
- `GET /api/services` - Service status list
- `GET /api/config` - Get configuration
- `PUT /api/config` - Update configuration
- `GET /api/logs` - Get aggregated logs

### PostgreSQL Database

**Purpose**: Primary data store

**Responsibilities**:
- Application data persistence
- Connection pooling
- Health check endpoint
- Transaction management

**Configuration**:
- Connection via `DATABASE_URL` environment variable
- Default: `postgresql://user:password@localhost:5432/devdb`

### Redis Cache

**Purpose**: Caching layer

**Responsibilities**:
- Session storage
- Cache management
- Health check endpoint
- Fast data access

**Configuration**:
- Connection via `REDIS_URL` environment variable
- Default: `redis://localhost:6379`

## Design Patterns

### 1. Orchestration Pattern

- Kubernetes manages service lifecycle
- Makefile provides developer-friendly interface (`make dev`, `make down`)
- Dependency ordering handled by K8s init containers or startup scripts
- Health checks ensure services are ready before dependent services start

### 2. Configuration Externalization

- All configuration in `config/` directory
- Environment-specific files (`dev.yaml`, `staging.yaml`, `production.yaml`)
- Secrets in separate secure files
- No hardcoded values in code
- Configuration API for runtime updates

### 3. Health Check Pattern

- Each service exposes `/health` endpoint
- Orchestrator polls health checks
- Status displayed in dashboard
- Startup waits for healthy services before proceeding
- Detailed health includes dependency status

### 4. Service Discovery

- Kubernetes DNS for inter-service communication
- Services reference each other by service name
- Ports exposed via K8s services
- Environment variables for service URLs

### 5. Logging Pattern

- Centralized log aggregation
- Structured logging format (JSON)
- Real-time log streaming to dashboard
- Log levels: debug, info, warning, error
- Log filtering and search capabilities

### 6. Monorepo Pattern

- Single repository for frontend and backend
- Shared configuration and orchestration
- Unified development workflow
- Single command setup

## Service Communication Flow

```
Frontend (Browser)
    │
    ├─ HTTP ──▶ Backend API
    │              │
    │              ├─ SQL ──▶ PostgreSQL
    │              │
    │              └─ Redis ─▶ Redis Cache
    │
    └─ WebSocket ─▶ Backend API (for real-time logs - optional)
```

## Data Flow

1. **Configuration**: `config/dev.yaml` → Makefile → K8s ConfigMaps → Services
2. **Service Startup**: Makefile → kubectl → K8s → Containers
3. **Health Checks**: Services → `/health` → Backend API → Frontend Dashboard
4. **Logs**: Services → stdout → K8s → Backend API → Frontend Dashboard
5. **Service Status**: Backend API → Frontend Dashboard (real-time updates)

## Deployment Architecture

### Local Development
- Docker Compose or local Kubernetes (minikube/kind)
- Services run in containers
- Port forwarding for local access
- Hot reload for frontend and backend

### Cloud Deployment (AKS)
- Azure Kubernetes Service cluster
- Kubernetes deployments for each service
- Service definitions for inter-service communication
- ConfigMaps and Secrets for configuration
- Ingress for external access (optional)

## Security Patterns

- **Secrets Management**: Mock secrets in config files (demonstrates pattern)
- **Network Policies**: K8s network policies for service isolation
- **Health Checks**: No sensitive data in health endpoints
- **Configuration**: Secrets separate from non-sensitive config
- **CORS**: Configured for frontend-backend communication

## Scalability Considerations

- **Horizontal Scaling**: K8s supports easy scaling of services
- **Resource Limits**: Defined in K8s manifests
- **Service Isolation**: Each service in separate pod
- **Future Services**: Easy to add via K8s manifests
- **Load Balancing**: K8s service load balancing

## Key Technical Decisions

### Why Kubernetes?
- **Scalability**: Easy to add new services
- **Portability**: Works across environments (local, cloud)
- **Service Management**: Built-in health checks, service discovery
- **Resource Management**: Efficient container orchestration
- **Industry Standard**: Widely adopted and well-documented

### Why AKS?
- **Managed Service**: Reduces operational overhead
- **Integration**: Seamless with Azure services and AWS
- **Developer Experience**: Good tooling and documentation
- **Multi-Cloud**: Supports both Azure and AWS infrastructure
- **Production-Ready**: Enterprise-grade Kubernetes service

### Why Fastify?
- **Performance**: High-performance HTTP framework
- **TypeScript**: Native TypeScript support
- **Modern**: Active development and modern features
- **Ecosystem**: Good plugin ecosystem
- **Alternative**: Chosen over non-existent "Dora" framework

### Why Monorepo?
- **Single Command Setup**: Easier orchestration
- **Version Consistency**: Frontend and backend stay in sync
- **Shared Configuration**: Common config files
- **Developer Experience**: One clone, one setup
- **Simplified Workflow**: Unified development process

## Project Structure

```
DevEnv/
├── app/                    # Frontend (Next.js)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── backend/                # Backend API (Fastify)
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── main-dashboard.tsx
│   ├── service-status-monitor.tsx
│   └── ...
├── config/                # Configuration files
│   ├── dev.yaml
│   └── staging.yaml
├── k8s/                   # Kubernetes manifests
│   ├── frontend.yaml
│   ├── backend.yaml
│   ├── postgresql.yaml
│   └── redis.yaml
├── docs/                  # Documentation
│   ├── PRD.md
│   ├── Architecture.md
│   ├── Phases.md
│   └── tasks.md
├── Makefile               # Orchestration commands
├── package.json           # Frontend dependencies
└── README.md
```

## Future Enhancements

- WebSocket support for real-time updates
- Advanced monitoring and alerting
- Multi-environment profiles
- Database migrations automation
- Performance optimization
- Advanced security features

---

**Last Updated**: 2024  
**Status**: Architecture defined, implementation in progress

