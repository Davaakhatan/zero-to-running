# System Patterns & Architecture

## Architecture Overview

### Local Development (Current Implementation)

The Zero-to-Running Developer Environment uses Docker Compose for local development orchestration.

```
┌─────────────────────────────────────────────────────────┐
│                    Developer Machine                    │
│                                                         │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │ Application      │         │ Dashboard        │    │
│  │ Frontend         │         │ Frontend         │    │
│  │ (Next.js)        │         │ (Next.js)        │    │
│  │ Port 3000        │         │ Port 3001        │    │
│  └────────┬─────────┘         └────────┬─────────┘    │
│           │                            │               │
│           └────────────┬───────────────┘               │
│                        │                               │
│                 ┌──────▼───────┐                      │
│                 │  Backend API │                      │
│                 │  (Fastify)   │                      │
│                 │  Port 3003    │                      │
│                 └──────┬────────┘                      │
│                        │                               │
│           ┌────────────┴────────────┐                 │
│           │                         │                  │
│     ┌─────▼─────┐           ┌─────▼─────┐            │
│     │ PostgreSQL │           │   Redis   │            │
│     │  Database  │           │   Cache   │            │
│     └────────────┘           └──────────┘            │
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │      Docker Compose Orchestration            │      │
│  │  - Service definitions                       │      │
│  │  - Health checks                             │      │
│  │  - Volume management                         │      │
│  │  - Network isolation                          │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

### Production Deployment (Planned)

Production deployment will use Kubernetes on AKS (Azure Kubernetes Service).

## Component Relationships

### Frontend (Next.js)
- **Purpose**: Developer dashboard and monitoring UI
- **Technology**: React 19, Next.js 16, TypeScript, Tailwind CSS
- **Responsibilities**:
  - Display service status
  - Show logs and health checks
  - Configuration management UI
  - Environment setup dashboard

### Backend API (Node.js/Fastify)
- **Purpose**: Service orchestration and health monitoring
- **Technology**: Node.js, TypeScript, Fastify framework
- **Responsibilities**:
  - Service lifecycle management
  - Health check endpoints
  - Configuration API
  - Log aggregation

### PostgreSQL Database
- **Purpose**: Primary data store
- **Responsibilities**:
  - Application data persistence
  - Connection pooling
  - Health check endpoint

### Redis Cache
- **Purpose**: Caching layer
- **Responsibilities**:
  - Session storage
  - Cache management
  - Health check endpoint

## Design Patterns

### 1. Orchestration Pattern
- **Local Development**: Docker Compose manages service lifecycle
- **Production**: Kubernetes will manage service lifecycle (planned)
- Makefile provides developer-friendly interface
- Dependency ordering handled by Docker Compose `depends_on` or K8s init containers

### 2. Configuration Externalization
- All config in `config/` directory
- Environment-specific files (dev.yaml, staging.yaml)
- Secrets in separate secure files
- No hardcoded values in code

### 3. Health Check Pattern
- Each service exposes `/health` endpoint
- Orchestrator polls health checks
- Status displayed in dashboard
- Startup waits for healthy services

### 4. Service Discovery
- Kubernetes DNS for inter-service communication
- Services reference each other by name
- Ports exposed via K8s services

### 5. Logging Pattern
- Centralized log aggregation
- Structured logging format
- Real-time log streaming to dashboard
- Log levels: debug, info, warning, error

## Key Technical Decisions

### Why Kubernetes?
- **Scalability**: Easy to add new services
- **Portability**: Works across environments
- **Service Management**: Built-in health checks, service discovery
- **Resource Management**: Efficient container orchestration

### Why AKS?
- **Managed Service**: Reduces operational overhead
- **Integration**: Seamless with Azure services and AWS
- **Developer Experience**: Good tooling and documentation
- **Multi-Cloud**: Supports both Azure and AWS infrastructure

### Why Makefile?
- **Simplicity**: Single command interface
- **Familiarity**: Standard tool developers know
- **Flexibility**: Can orchestrate complex workflows

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
    └─ WebSocket ─▶ Backend API (for real-time logs)
```

## Data Flow

1. **Configuration**: `config/dev.yaml` → Makefile → K8s manifests
2. **Service Startup**: Makefile → kubectl → K8s → Containers
3. **Health Checks**: Services → `/health` → Backend API → Frontend
4. **Logs**: Services → stdout → K8s → Backend API → Frontend

## Security Patterns

- **Secrets Management**: Mock secrets in config files (demonstrates pattern)
- **Network Policies**: K8s network policies for service isolation
- **Health Checks**: No sensitive data in health endpoints
- **Configuration**: Secrets separate from non-sensitive config

## Scalability Considerations

- **Horizontal Scaling**: K8s supports easy scaling
- **Resource Limits**: Defined in K8s manifests
- **Service Isolation**: Each service in separate pod
- **Future Services**: Easy to add via K8s manifests

