# Backend API

Backend API server for the Zero-to-Running Developer Environment.

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL (via `pg`)
- **Cache**: Redis (via `redis`)

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

4. Start development server:
```bash
pnpm dev
```

The server will run on `http://localhost:3003` by default (configurable via `PORT` environment variable).

## API Endpoints

### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health check with dependencies

### Services
- `GET /api/services` - Get all service statuses
- `GET /api/services/:serviceId` - Get specific service status

### Configuration
- `GET /api/config` - Get current configuration
- `PUT /api/config` - Update configuration

### Logs
- `GET /api/logs` - Get logs with optional filters
  - Query params: `service`, `level`, `limit`, `since`

## Development

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm type-check` - Run TypeScript type checking

