# Zero-to-Running Developer Environment

> Single-command developer environment setup for multi-service applications

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd DevEnv

# Start the entire development environment
make dev

# Access the dashboard
open http://localhost:3000
```

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
Frontend (Next.js) → Backend API (Fastify) → PostgreSQL + Redis
                    ↓
            Kubernetes (AKS) Orchestration
```

## 🛠️ Technology Stack

- **Frontend**: TypeScript, React, Next.js 16, Tailwind CSS
- **Backend**: Node.js, Fastify, TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Orchestration**: Kubernetes on Azure Kubernetes Service (AKS)
- **Containerization**: Docker

## 📁 Project Structure

```
DevEnv/
├── app/                    # Frontend (Next.js)
├── backend/                # Backend API (Fastify)
├── config/                 # Configuration files
├── k8s/                    # Kubernetes manifests
├── docs/                   # Documentation
│   ├── PRD.md
│   ├── Architecture.md
│   ├── Phases.md
│   └── tasks.md
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

