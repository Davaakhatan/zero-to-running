# Zero-to-Running Developer Environment

> Single-command developer environment setup for multi-service applications

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
git clone <repo-url>
cd DevEnv

# Start the entire development environment
make dev

# Access your application
open http://localhost:3000

# Access the dashboard
open http://localhost:3001
```

### Production Deployment (Kubernetes)

Deploy to AWS EKS, Azure AKS, or GCP GKE:

```bash
cd k8s
./deploy.sh  # Interactive script - choose your cloud provider
```

**Supported Cloud Providers:**
- 🟠 **AWS EKS** - Amazon Elastic Kubernetes Service
- 🔵 **Azure AKS** - Azure Kubernetes Service  
- 🟢 **GCP GKE** - Google Kubernetes Engine

See [k8s/README.md](./k8s/README.md) for detailed deployment guides for each cloud provider.

## 📋 Overview

The Zero-to-Running Developer Environment enables new engineers to set up a complete multi-service application with a single command. No more hours of configuration, dependency management, or "works on my machine" issues.

### What It Does

- **Single Command Setup**: `make dev` provisions all services
- **Automatic Orchestration**: Handles service dependencies and ordering
- **Visual Dashboard**: Real-time monitoring of services, logs, and health
- **Zero Configuration**: Works out of the box with sensible defaults
- **Clean Teardown**: `make down` removes everything cleanly

## 🏗️ Architecture

```
Application Frontend (Port 3000) ──┐
                                    ├──→ Backend API (Fastify) → PostgreSQL + Redis
Dashboard Frontend (Port 3001) ────┘
                    ↓
            Docker Compose Orchestration
```

## 🛠️ Technology Stack

- **Frontend**: TypeScript, React, Next.js 16, Tailwind CSS
- **Backend**: Node.js, Fastify, TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Local Development**: Docker Compose (orchestration)
- **Production Deployment**: Kubernetes (AWS EKS, Azure AKS, GCP GKE)
- **Containerization**: Docker

## 📁 Project Structure

```
DevEnv/
├── app-frontend/           # Application Frontend (Next.js) - Port 3000
├── dashboard-frontend/     # Dashboard Frontend (Next.js) - Port 3001
├── backend/                # Backend API (Fastify) - Port 3003
├── config/                 # Environment configurations
│   ├── dev.yaml           # Development config
│   ├── staging.yaml        # Staging config
│   └── production.yaml     # Production config
├── k8s/                    # Kubernetes manifests
│   ├── common/            # Shared manifests
│   ├── aws/               # AWS EKS specific
│   ├── azure/             # Azure AKS specific
│   └── gcp/               # GCP GKE specific
├── docs/                   # Documentation
│   ├── PRD.md
│   ├── Architecture.md
│   ├── Phases.md
│   ├── tasks.md
│   └── QUICK_START.md
├── docker-compose.yml      # Docker Compose configuration
├── Makefile                # Orchestration commands
└── README.md               # This file
```

## 🎯 Key Features

- ✅ **Single Command Setup**: `make dev` brings up entire stack
- ✅ **Setup Wizard**: Visual prerequisites checker and progress tracking
- ✅ **Service Monitoring**: Real-time status of all 5 services
- ✅ **Health Checks**: Automatic health monitoring with auto-refresh
- ✅ **Log Aggregation**: Centralized log viewing with filtering
- ✅ **Configuration Management**: Externalized config with UI
- ✅ **Resource Monitoring**: CPU, memory, network usage tracking
- ✅ **Quick Actions**: Start/stop/restart services individually
- ✅ **Dependency Graph**: Visual service dependency visualization
- ✅ **Environment Profiles**: Dev, Staging, Production configs
- ✅ **Multi-Cloud Support**: Kubernetes manifests for AWS, Azure, GCP
- ✅ **Real-Time Updates**: Auto-refreshing dashboards and logs

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
- ✅ **Frontend**: 100% Complete (Application + Dashboard)
- ✅ **Backend**: 100% Complete (All APIs implemented)
- ✅ **Infrastructure**: 100% Complete (Docker Compose)
- ✅ **Orchestration**: 100% Complete (Makefile commands)
- ✅ **Kubernetes**: Manifests ready for AWS EKS, Azure AKS, GCP GKE
- ✅ **Environment Profiles**: Dev, Staging, Production configs
- ✅ **Documentation**: Comprehensive guides and docs

## 🎯 Success Metrics

- ✅ **Setup Time**: < 10 minutes (achieved: ~5 minutes)
- ✅ **Coding Time**: 80%+ time spent writing code (achieved)
- ⏳ **Support Reduction**: 90% decrease (to be measured)

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

## 🤝 Contributing

This is a developer environment setup tool. See [docs/tasks.md](./docs/tasks.md) for current development tasks.

## 📝 License

[Add your license here]

---

**Organization**: Wander  
**Project ID**: 3MCcAvCyK7F77BpbXUSI_1762376408364  
**Status**: MVP Complete - Production Ready

