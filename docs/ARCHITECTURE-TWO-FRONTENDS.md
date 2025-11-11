# Architecture: Two Frontends Approach

## Overview

The project will have **two separate frontends**:

1. **Application Frontend** - The actual application developers build
2. **Dashboard Frontend** - The monitoring/management tool

---

## Architecture

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
└─────────────────────────────────────────────────────────┘
```

---

## Frontend A: Application Frontend

**Purpose**: The actual application that developers build and work on

**Port**: `3000`

**What it is**:
- A simple example application (starter template)
- Could be a TODO app, blog, or basic CRUD app
- Demonstrates the full stack working together
- This is what developers modify and build upon

**Technology**:
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

**Responsibilities**:
- User-facing application
- Business logic
- API calls to backend
- What developers actually code

**Example Features** (simple starter):
- Home page
- Basic CRUD operations
- API integration with backend
- Simple UI

---

## Frontend B: Dashboard Frontend

**Purpose**: Monitoring and management tool for the development environment

**Port**: `3001`

**What it is**:
- Developer tool for monitoring the environment
- Shows status of all services (including Application Frontend)
- Logs, health checks, resources, configuration

**Technology**:
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui

**Responsibilities**:
- Monitor Application Frontend (port 3000)
- Monitor Backend API (port 3003)
- Monitor Database (port 5432)
- Monitor Redis (port 6379)
- Show logs, health checks, resources
- Configuration management
- Setup wizard

**Pages**:
- Setup
- Dashboard (overview)
- Services (monitors all services including App Frontend)
- Logs & Health
- Configuration
- Environments
- Dependencies
- Resources

---

## Service Monitoring

The Dashboard Frontend monitors:

1. **Application Frontend** (`localhost:3000`)
   - Health check: `http://localhost:3000/api/health`
   - Status: Operational/Down/Degraded
   - Response time
   - Uptime

2. **Backend API** (`localhost:3003`)
   - Health check: `http://localhost:3003/health`
   - Status: Operational/Down/Degraded
   - Response time
   - Uptime

3. **PostgreSQL** (`localhost:5432`)
   - Health check: Connection test
   - Status: Operational/Down

4. **Redis** (`localhost:6379`)
   - Health check: PING command
   - Status: Operational/Down

---

## Docker Compose Structure

```yaml
services:
  postgres:
    # Database service
    
  redis:
    # Cache service
    
  backend:
    # Backend API (port 3003)
    
  app-frontend:  # NEW - Application Frontend
    build:
      context: ./app-frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3003
    depends_on:
      - backend
    
  dashboard-frontend:  # RENAMED - Dashboard Frontend
    build:
      context: ./dashboard-frontend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3003
      NEXT_PUBLIC_APP_FRONTEND_URL: http://localhost:3000
    depends_on:
      - backend
```

---

## Directory Structure

```
DevEnv/
├── app-frontend/          # NEW - Application Frontend
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── package.json
│   └── Dockerfile
│
├── dashboard-frontend/    # RENAMED - Dashboard Frontend
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── package.json
│   └── Dockerfile
│
├── backend/               # Backend API
│   └── ...
│
├── docker-compose.yml
└── Makefile
```

---

## Benefits

1. **Clear Separation**: Dashboard monitors the app, not itself
2. **No Confusion**: "Frontend: Down" means the app is down, not the dashboard
3. **Realistic**: Matches real-world scenarios where you monitor your app
4. **Template**: Application frontend serves as a starter template
5. **Professional**: Proper architecture for multi-service apps

---

## Migration Plan

1. **Rename current frontend to dashboard-frontend**
2. **Create new app-frontend** (simple starter app)
3. **Update docker-compose.yml** (two frontend services)
4. **Update backend service monitoring** (monitor app-frontend on port 3000)
5. **Update dashboard** (monitor app-frontend, not itself)
6. **Update Makefile** (start both frontends)
7. **Update documentation**

---

## Next Steps

1. Confirm this architecture approach
2. Create app-frontend directory structure
3. Build simple starter application
4. Rename current frontend to dashboard-frontend
5. Update all configurations
6. Test both frontends working together

