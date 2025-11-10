# Technical Context

## Technology Stack

### Frontend
- **Framework**: Next.js 16.0.0
- **Language**: TypeScript 5.x
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS 4.1.9
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **State Management**: React hooks (useState)
- **Form Handling**: React Hook Form + Zod validation

### Backend (To Be Built)
- **Runtime**: Node.js
- **Framework**: Dora (TypeScript framework)
- **Language**: TypeScript
- **API Style**: RESTful API

### Infrastructure (To Be Built)
- **Orchestration**: Kubernetes (k8s)
- **Platform**: Azure Kubernetes Service (AKS)
- **Containerization**: Docker
- **Service Discovery**: Kubernetes DNS
- **Configuration**: YAML files

### Data Layer (To Be Built)
- **Database**: PostgreSQL
- **Cache**: Redis

## Development Setup

### Prerequisites
- Node.js (v18+)
- pnpm (package manager)
- Docker Desktop
- kubectl (Kubernetes CLI)
- Azure CLI (for AKS)
- Make (for `make dev` command)

### Current Project Structure
```
DevEnv/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── env-setup-dashboard.tsx
│   ├── service-status-monitor.tsx
│   ├── configuration-panel.tsx
│   ├── log-viewer.tsx
│   └── log-viewer-health-checks.tsx
├── hooks/                 # React hooks
├── lib/                   # Utilities
├── public/                # Static assets
├── styles/                # Additional styles
├── package.json
├── tsconfig.json
├── next.config.mjs
├── postcss.config.mjs
└── components.json        # shadcn/ui config
```

### Package Management
- **Manager**: pnpm
- **Lock File**: pnpm-lock.yaml
- **Installation**: `pnpm install`

### Development Commands
```bash
pnpm dev      # Start Next.js dev server (port 3000)
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

## Technical Constraints

### Frontend Constraints
- Must work in modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for desktop and tablet
- Dark mode support (via next-themes)

### Backend Constraints (Planned)
- Must support health check endpoints
- Must handle service orchestration
- Must aggregate logs from services
- Must support configuration API

### Infrastructure Constraints
- Kubernetes cluster required
- AKS access required
- Docker must be running locally
- Sufficient resources for all services

## Dependencies

### Frontend Dependencies
- **Core**: next, react, react-dom
- **UI**: @radix-ui/* (various components)
- **Styling**: tailwindcss, tailwindcss-animate
- **Forms**: react-hook-form, @hookform/resolvers, zod
- **Utils**: clsx, tailwind-merge, class-variance-authority
- **Icons**: lucide-react
- **Analytics**: @vercel/analytics

### Backend Dependencies (Planned)
- Node.js runtime
- Dora framework
- Database client (PostgreSQL)
- Redis client
- Health check libraries

### Infrastructure Dependencies (Planned)
- Kubernetes cluster
- Docker images for services
- kubectl configuration
- Azure subscription access

## Development Workflow

### Current Workflow
1. Clone repository
2. Run `pnpm install`
3. Run `pnpm dev`
4. Access frontend at `http://localhost:3000`

### Target Workflow (Post-Implementation)
1. Clone repository
2. Run `make dev`
3. Wait for all services to be healthy
4. Access frontend at `http://localhost:3000`
5. Start coding

## Build & Deployment

### Frontend Build
- Next.js production build: `pnpm build`
- Output: `.next/` directory
- Static assets: `public/` directory

### Backend Build (Planned)
- TypeScript compilation
- Docker image creation
- Kubernetes deployment manifests

## Environment Variables

### Frontend (Current)
- `NEXT_PUBLIC_API_URL`: Backend API URL

### Backend (Planned)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `PORT`: API server port
- `NODE_ENV`: Environment (development/production)

## Configuration Files

### Current
- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript configuration
- `next.config.mjs`: Next.js configuration
- `postcss.config.mjs`: PostCSS configuration
- `components.json`: shadcn/ui configuration

### Planned
- `config/dev.yaml`: Development configuration
- `config/staging.yaml`: Staging configuration
- `k8s/*.yaml`: Kubernetes manifests
- `Dockerfile`: Container definitions
- `Makefile`: Developer commands
- `.env.example`: Environment variable template

## Performance Considerations

### Frontend
- Next.js automatic code splitting
- Image optimization via Next.js Image component
- CSS optimization via Tailwind
- Client-side state management (minimal)

### Backend (Planned)
- Connection pooling for database
- Redis caching for frequently accessed data
- Health check optimization (cached results)
- Log aggregation efficiency

## Security Considerations

### Frontend
- No sensitive data in client-side code
- Environment variables prefixed with `NEXT_PUBLIC_` only

### Backend (Planned)
- Secrets in separate config files
- Health checks don't expose sensitive data
- Network policies in Kubernetes
- Secure inter-service communication

