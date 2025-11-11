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

See [k8s/README.md](k8s/README.md) for detailed deployment guides.

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
- **Production Deployment**: Kubernetes on Azure Kubernetes Service (AKS) - *Planned*
- **Containerization**: Docker

## 📁 Project Structure

```
DevEnv/
├── app-frontend/           # Application Frontend (Next.js) - Port 3000
├── dashboard-frontend/     # Dashboard Frontend (Next.js) - Port 3001
├── backend/                 # Backend API (Fastify) - Port 3003
├── config/                 # Configuration files
├── docs/                   # Documentation
│   ├── PRD.md
│   ├── Architecture.md
│   ├── Phases.md
│   └── tasks.md
├── docker-compose.yml      # Docker Compose configuration
├── Makefile                # Orchestration commands
└── README.md               # This file
```

## 🎯 Key Features

- ✅ **Setup Wizard**: Visual prerequisites checker and progress tracking
- ✅ **Service Monitoring**: Real-time status of all services
- ✅ **Health Checks**: Automatic health monitoring
- ✅ **Log Aggregation**: Centralized log viewing
- ✅ **Configuration Management**: Externalized config with UI
- ✅ **Resource Monitoring**: CPU, memory, disk usage tracking
- ✅ **Quick Actions**: Start/stop/restart services individually
- ✅ **Dependency Graph**: Visual service dependency visualization

## 📚 Documentation

All documentation is located in the [`docs/`](./docs/) directory:

- [Product Requirements Document (PRD)](./docs/PRD.md) - Complete product requirements and specifications
- [Architecture Documentation](./docs/Architecture.md) - System architecture and design patterns
- [Project Phases](./docs/Phases.md) - Development phases and timeline
- [Task Breakdown](./docs/tasks.md) - Detailed task list and progress tracking
- [Project Summary](./docs/SUMMARY.md) - Quick status overview
- [Backend Status](./docs/BACKEND_STATUS.md) - Backend development status

## 🚦 Current Status

- ✅ **Frontend**: 100% Complete
- 🚧 **Backend**: 90% Complete (needs testing)
- ⏳ **Infrastructure**: 0% Complete
- ⏳ **Orchestration**: 0% Complete

## 🎯 Success Metrics

- **Setup Time**: < 10 minutes for new developers
- **Coding Time**: 80%+ time spent writing code vs managing infrastructure
- **Support Reduction**: 90% decrease in environment-related tickets

## 🤝 Contributing

This is a developer environment setup tool. See [docs/tasks.md](./docs/tasks.md) for current development tasks.

## 📝 License

[Add your license here]

---

**Organization**: Wander  
**Project ID**: 3MCcAvCyK7F77BpbXUSI_1762376408364

