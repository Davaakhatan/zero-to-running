# Configuration Files

This directory contains environment-specific configuration files for the Zero-to-Running Developer Environment.

## Available Environments

### `dev.yaml` (Development)
- **Purpose**: Local development environment
- **Usage**: Default when running `make dev`
- **Features**:
  - Localhost connections
  - Development-friendly settings
  - Relaxed health check intervals

### `staging.yaml` (Staging)
- **Purpose**: Staging/pre-production environment
- **Usage**: `make dev-staging` or `ENV=staging make dev`
- **Features**:
  - Staging domain names
  - Production-like settings
  - Moderate health check intervals

### `production.yaml` (Production)
- **Purpose**: Production environment (for local testing)
- **Usage**: `make dev-production` or `ENV=production make dev`
- **Features**:
  - Production domain names
  - Optimized health check intervals
  - Production-ready settings

## Usage

### Via Makefile

```bash
# Development (default)
make dev

# Staging
make dev-staging

# Production
make dev-production
```

### Via Environment Variable

```bash
# Set environment
ENV=staging make dev

# Or export it
export ENV=production
make dev
```

### Via Backend Environment Variable

The backend automatically selects the config file based on `NODE_ENV`:

```bash
# Development
NODE_ENV=development  # Uses dev.yaml

# Staging
NODE_ENV=staging      # Uses staging.yaml

# Production
NODE_ENV=production  # Uses production.yaml
```

Or explicitly set `CONFIG_PATH`:

```bash
CONFIG_PATH=config/staging.yaml make dev
```

## Configuration Structure

All config files follow this structure:

```yaml
services:
  app-frontend:
    port: 3000
    host: localhost  # or domain name
  
  backend:
    port: 3003
    host: localhost  # or domain name
  
  database:
    host: localhost  # or domain name
    port: 5432
    name: devenv
    user: devuser
  
  redis:
    host: localhost  # or domain name
    port: 6379

healthChecks:
  interval: 30  # seconds
  timeout: 5000  # milliseconds
```

## Customizing Configurations

1. **Edit the YAML file** for your environment
2. **Update domain names** to match your infrastructure
3. **Adjust health check intervals** based on your needs
4. **Modify ports** if needed (though defaults are recommended)

## Backend Integration

The backend service (`backend/src/services/config.ts`) automatically:
- Loads the appropriate config file based on `NODE_ENV` or `CONFIG_PATH`
- Falls back to `dev.yaml` if the specified file doesn't exist
- Caches the config for performance
- Provides API endpoints to read/update config

## Docker Compose Integration

The `docker-compose.yml` passes the `CONFIG_PATH` environment variable to the backend container, allowing it to load the correct configuration file.

## Notes

- **Secrets**: Sensitive data (passwords, API keys) should be managed via environment variables or secrets management systems, not in these config files
- **Version Control**: These files can be committed to version control as they contain non-sensitive configuration
- **Production**: For actual production deployments, use Kubernetes ConfigMaps or cloud-specific secret managers

