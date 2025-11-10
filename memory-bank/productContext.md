# Product Context: Zero-to-Running Developer Environment

## Why This Project Exists

The Zero-to-Running Developer Environment addresses a critical pain point in software development: the friction between cloning a repository and actually writing code. Traditional setup processes can take hours or even days, especially for complex multi-service applications.

## Problems It Solves

### 1. Onboarding Friction
- **Problem**: New developers spend days setting up environments
- **Solution**: Single command gets them coding in under 10 minutes

### 2. Environment Inconsistency
- **Problem**: "Works on my machine" - different setups across team
- **Solution**: Standardized, reproducible environment via containers/K8s

### 3. Infrastructure Management Overhead
- **Problem**: Developers spend 20%+ time managing infrastructure
- **Solution**: Automated provisioning and configuration

### 4. Configuration Complexity
- **Problem**: Manual configuration of databases, caches, services
- **Solution**: Externalized config with sensible defaults

## How It Should Work

### User Journey

1. **Clone Repository**
   ```bash
   git clone <repo-url>
   cd <project>
   ```

2. **Start Environment**
   ```bash
   make dev
   ```

3. **System Actions**
   - Validates prerequisites (Docker, kubectl, etc.)
   - Reads configuration from `config/dev.yaml`
   - Provisions services in dependency order:
     - PostgreSQL database
     - Redis cache
     - Backend API
     - Frontend dev server
   - Performs health checks
   - Displays status dashboard

4. **Developer Actions**
   - Access frontend at `http://localhost:3000`
   - Access API at `http://localhost:3001`
   - View logs and health status in dashboard
   - Start coding immediately

5. **Teardown**
   ```bash
   make down
   ```

## User Experience Goals

### Clarity
- Clear feedback at every step
- Meaningful error messages
- Visual status indicators

### Speed
- Fast startup (< 10 minutes)
- Parallel operations where possible
- Efficient resource usage

### Reliability
- Consistent results across machines
- Graceful error handling
- Automatic recovery where possible

### Flexibility
- Configurable without code changes
- Support for different profiles
- Easy customization

## Key User Stories

1. **As a new developer**, I want to clone and run `make dev` so I can start coding immediately
2. **As an ops-savvy engineer**, I want to configure via config file so I can customize my setup
3. **As a developer**, I want clear feedback during setup so I know if everything is working
4. **As a developer**, I want to tear down with one command so I can maintain a clean setup

## Success Indicators

- New developers productive within first hour
- Zero environment-related support tickets
- Consistent experience across team members
- Positive developer feedback on onboarding process

