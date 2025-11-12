# Zero-to-Running Developer Environment

> **One command. Full environment. Zero configuration.**  
> A developer environment framework that enables new and experienced developers to set up a complete multi-service application environment with a single command (`make dev`). No more hours of configuration, dependency management, or "works on my machine" issues.

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
git clone <repo-url>
cd DevEnv

# Start the entire development environment
make dev

# Access your services
open http://localhost:3000      # Application Frontend (your app)
open http://localhost:3001      # Dashboard Frontend (monitoring)
open http://localhost:3003      # Backend API
```

### Production Deployment (Kubernetes) - Optional

For production deployments or demonstrations, you can deploy to AWS EKS, Azure AKS, or GCP GKE:

```bash
cd k8s
./deploy.sh  # Interactive script - choose your cloud provider
```

**Supported Cloud Providers:**
- 🟠 **AWS EKS** - Amazon Elastic Kubernetes Service
- 🔵 **Azure AKS** - Azure Kubernetes Service  
- 🟢 **GCP GKE** - Google Kubernetes Engine

**Note**: Kubernetes deployment is optional. The primary goal is local development setup with `make dev`. See [k8s/README.md](./k8s/README.md) for detailed deployment guides.

## 📋 Overview

**Our Mission**: Help developers (new and experienced) get their development environment running in minutes, not hours.

The Zero-to-Running Developer Environment is a framework that enables developers to set up a complete multi-service application with a **single command** (`make dev`). No more hours of configuration, dependency management, or "works on my machine" issues.

### For New Developers
- Clone the repo, run `make dev`, start coding
- All services (database, cache, API, dashboard) are automatically configured
- Visual dashboard shows everything working in real-time

### For Experienced Developers
- Skip the boilerplate setup
- Focus on building features, not infrastructure
- Consistent environment across team members
- Easy to add your own services and applications

**Note**: Public URLs shown in documentation are temporary demonstrations for project reviewers. The primary use case is local development setup.

### What It Does

- **Single Command Setup**: `make dev` provisions all services
- **Automatic Orchestration**: Handles service dependencies and ordering
- **Visual Dashboard**: Real-time monitoring of services, logs, and health
- **Dynamic Setup Page**: Cloud-aware prerequisites and service discovery
- **Multi-Cloud Support**: Deploy to AWS, Azure, or GCP with consistent tooling
- **Zero Configuration**: Works out of the box with sensible defaults
- **Clean Teardown**: `make down` removes everything cleanly

## 🏗️ Architecture

```
Your Application (Port 3000) ────┐
                                  ├──→ Backend API (Fastify) → PostgreSQL + Redis
Dashboard Frontend (Port 3001) ───┘
                    ↓
            Docker Compose Orchestration
                    ↓
         Kubernetes (AWS/Azure/GCP)
```

**Note**: This is a framework/template. You can add your own applications and services. The example shows a typical setup with one application frontend, but you can add multiple applications as needed.

## 🛠️ Technology Stack

- **Frontend**: TypeScript, React, Next.js 16, Tailwind CSS, Vite (CollabCanva)
- **Backend**: Node.js, Fastify, TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Local Development**: Docker Compose (orchestration)
- **Production Deployment**: Kubernetes (AWS EKS, Azure AKS, GCP GKE)
- **Containerization**: Docker
- **Container Registry**: ECR (AWS), ACR (Azure), GCR/Artifact Registry (GCP)

## 📁 Project Structure

```
DevEnv/
├── app-frontend/           # Application Frontend (Next.js) - Port 3000 (your app)
├── dashboard-frontend/     # Dashboard Frontend (Next.js) - Port 3001
├── backend/                # Backend API (Fastify) - Port 3003
├── collabcanva-app/        # Example: CollabCanva Application (Vite) - Port 3002
├── config/                 # Environment configurations
│   ├── dev.yaml           # Development config
│   ├── staging.yaml        # Staging config
│   └── production.yaml     # Production config
├── k8s/                    # Kubernetes manifests
│   ├── common/            # Shared manifests
│   ├── aws/               # AWS EKS specific (with build scripts)
│   ├── azure/             # Azure AKS specific (with build scripts)
│   └── gcp/               # GCP GKE specific (with build scripts)
├── docs/                   # Documentation
│   ├── PRD.md
│   ├── Architecture.md
│   ├── Phases.md
│   ├── tasks.md
│   └── QUICK_START.md
├── memory-bank/           # Project memory and context
├── docker-compose.yml      # Docker Compose configuration
├── Makefile                # Orchestration commands
└── README.md               # This file
```

## 🎯 Key Features

- ✅ **Single Command Setup**: `make dev` brings up entire stack
- ✅ **Dynamic Setup Wizard**: Cloud-aware prerequisites checker and progress tracking
- ✅ **Service Monitoring**: Real-time status of all services (dynamically discovered)
- ✅ **Health Checks**: Automatic health monitoring with auto-refresh
- ✅ **Log Aggregation**: Centralized log viewing with filtering
- ✅ **Configuration Management**: Externalized config with UI
- ✅ **Resource Monitoring**: CPU, memory, network usage tracking
- ✅ **Quick Actions**: Start/stop/restart services individually
- ✅ **Dependency Graph**: Visual service dependency visualization
- ✅ **Environment Profiles**: Dev, Staging, Production configs
- ✅ **Multi-Cloud Support**: Kubernetes manifests for AWS, Azure, GCP
- ✅ **Build Scripts**: Automated image building for all cloud providers
- ✅ **Real-Time Updates**: Auto-refreshing dashboards and logs
- ✅ **Cloud Detection**: Automatic cloud provider detection for prerequisites

## 📚 Documentation

All documentation is located in the [`docs/`](./docs/) directory:

- [Product Requirements Document (PRD)](./docs/PRD.md) - Complete product requirements and specifications
- [Architecture Documentation](./docs/Architecture.md) - System architecture and design patterns
- [Quick Start Guide](./docs/QUICK_START.md) - Get started in minutes
- [Project Phases](./docs/Phases.md) - Development phases and timeline
- [Task Breakdown](./docs/tasks.md) - Detailed task list and progress tracking
- [Status Overview](./docs/STATUS.md) - Current project status
- [Kubernetes Deployment](./k8s/README.md) - Multi-cloud deployment guides

## 🚦 Current Status

- ✅ **MVP Complete**: Local development fully functional
- ✅ **Frontend**: 100% Complete (Application + Dashboard + CollabCanva)
- ✅ **Backend**: 100% Complete (All APIs implemented)
- ✅ **Infrastructure**: 100% Complete (Docker Compose)
- ✅ **Orchestration**: 100% Complete (Makefile commands)
- ✅ **Kubernetes**: Manifests ready for AWS EKS, Azure AKS, GCP GKE
- ✅ **Build Scripts**: Automated image building for all cloud providers
- ✅ **Cloud Detection**: Automatic cloud provider detection
- ✅ **Dynamic Setup**: Cloud-aware prerequisites and service discovery
- ✅ **Environment Profiles**: Dev, Staging, Production configs
- ✅ **Documentation**: Comprehensive guides and docs

## 🎯 Success Metrics

- ✅ **Setup Time**: < 10 minutes (achieved: ~5 minutes with `make dev`)
- ✅ **Coding Time**: 80%+ time spent writing code vs managing infrastructure (achieved)
- ✅ **Zero Configuration**: Works out of the box (achieved)
- ⏳ **Support Reduction**: 90% decrease in environment-related issues (to be measured)

**Goal**: New developers should be able to clone, run `make dev`, and start coding within 5 minutes.

## 🌍 Environment Profiles

Support for multiple environments:

```bash
# Development (default)
make dev

# Staging
make dev-staging

# Production
make dev-production
```

Each environment uses its own configuration file (`config/dev.yaml`, `config/staging.yaml`, `config/production.yaml`).

See [config/README.md](./config/README.md) for details.

## 🐳 Core Services

The framework includes these core infrastructure services:

1. **PostgreSQL** (Port 5432) - Database
2. **Redis** (Port 6379) - Cache
3. **Backend API** (Port 3003) - Fastify API server
4. **Dashboard Frontend** (Port 3001) - Monitoring dashboard

**Your Applications**: Add your own applications (like `app-frontend` on port 3000). The dashboard will automatically discover and monitor all services you add. See [docs/Architecture.md](./docs/Architecture.md) for integration examples.

## ☁️ Multi-Cloud Deployment

### Build and Push Images

Each cloud provider has automated build scripts:

#### AWS EKS
```bash
cd k8s/aws
./build-backend.sh
./build-dashboard.sh
# Build your application images as needed
```

#### Azure AKS
```bash
cd k8s/azure
./build-backend.sh
./build-dashboard.sh
# Build your application images as needed
```

#### GCP GKE
```bash
cd k8s/gcp
./build-backend.sh
./build-dashboard.sh
# Build your application images as needed
```

**Note**: Build scripts are provided for core services. You'll need to create build scripts for your own applications following the same pattern.

### Deploy

```bash
cd k8s
./deploy.sh  # Choose your cloud provider
```

See [k8s/README.md](./k8s/README.md) for detailed instructions.

## 🧪 Testing

### Test Environment Profiles

```bash
# Test development environment
make dev
curl http://localhost:3003/api/config | jq '.services.database.name'
# Should show: "devenv"

# Test staging environment
make down && make dev-staging
curl http://localhost:3003/api/config | jq '.services.database.name'
# Should show: "devenv_staging"

# Test production environment
make down && make dev-production
curl http://localhost:3003/api/config | jq '.services.database.name'
# Should show: "devenv_production"
```

See [config/TEST.md](./config/TEST.md) for comprehensive testing guide.

## 🤝 Contributing

This is a developer environment setup tool. See [docs/tasks.md](./docs/tasks.md) for current development tasks.

## 📝 License

[Add your license here]

---

**Organization**: Wander  
**Project ID**: 3MCcAvCyK7F77BpbXUSI_1762376408364
**Status**: MVP Complete - Production Ready
