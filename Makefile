.PHONY: help dev down up build clean logs status health check test dev-staging dev-production

# Default target
.DEFAULT_GOAL := help

# Environment selection (dev, staging, production)
ENV ?= dev

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Zero-to-Running Developer Environment$(NC)"
	@echo ""
	@echo "$(GREEN)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

dev: ## Start all services in development mode (default)
	@echo "$(BLUE)🚀 Starting Zero-to-Running Developer Environment ($(ENV))...$(NC)"
	@echo ""
	@echo "$(YELLOW)Environment: $(ENV)$(NC)"
	@echo "$(YELLOW)Config file: config/$(ENV).yaml$(NC)"
	@echo ""
	@if [ ! -f "config/$(ENV).yaml" ]; then \
		echo "$(RED)❌ Config file config/$(ENV).yaml not found!$(NC)"; \
		echo "$(YELLOW)💡 Available environments: dev, staging, production$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Checking Docker...$(NC)"
	@if ! pgrep -f "Docker.app" > /dev/null 2>&1 && ! pgrep -f "com.docker.backend" > /dev/null 2>&1; then \
		echo "$(RED)❌ Docker Desktop is not running. Please start Docker Desktop and try again.$(NC)"; \
		echo "$(YELLOW)💡 Tip: Open Docker Desktop from Applications or Spotlight.$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ Docker Desktop is running$(NC)"
	@echo ""
	@echo "$(GREEN)Starting services with Docker Compose...$(NC)"
	@echo "$(YELLOW)This may take a few minutes on first run...$(NC)"
	CONFIG_PATH=config/$(ENV).yaml docker-compose up -d --build
	@echo ""
	@echo "$(GREEN)✅ Services started!$(NC)"
	@echo ""
	@echo "$(BLUE)Services:$(NC)"
	@echo "  • Application Frontend: http://localhost:3000"
	@echo "  • Dashboard Frontend:   http://localhost:3001"
	@echo "  • Backend API:           http://localhost:3003"
	@echo "  • PostgreSQL:            localhost:5432"
	@echo "  • Redis:                 localhost:6379"
	@echo ""
	@echo "$(YELLOW)Waiting for services to be healthy...$(NC)"
	@sleep 5
	@$(MAKE) health
	@echo ""
	@echo "$(GREEN)🎉 Environment ready!$(NC)"
	@echo "$(BLUE)Access your application at: http://localhost:3000$(NC)"
	@echo "$(BLUE)Access the dashboard at: http://localhost:3001$(NC)"

up: dev ## Alias for dev

dev-staging: ## Start services in staging mode
	@$(MAKE) dev ENV=staging

dev-production: ## Start services in production mode (local)
	@$(MAKE) dev ENV=production

down: ## Stop and remove all services (clean teardown)
	@echo "$(YELLOW)🛑 Stopping all services...$(NC)"
	docker-compose down -v
	@echo "$(GREEN)✅ All services stopped and volumes removed$(NC)"

stop: ## Stop services without removing volumes
	@echo "$(YELLOW)⏸️  Stopping services...$(NC)"
	docker-compose stop
	@echo "$(GREEN)✅ Services stopped$(NC)"

restart: ## Restart all services
	@echo "$(YELLOW)🔄 Restarting services...$(NC)"
	docker-compose restart
	@echo "$(GREEN)✅ Services restarted$(NC)"

build: ## Build Docker images
	@echo "$(BLUE)🔨 Building Docker images...$(NC)"
	docker-compose build
	@echo "$(GREEN)✅ Images built$(NC)"

clean: ## Remove all containers, volumes, and images
	@echo "$(RED)🧹 Cleaning up...$(NC)"
	docker-compose down -v --rmi all
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

logs: ## View logs from all services
	docker-compose logs -f

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-db: ## View database logs
	docker-compose logs -f postgres

logs-redis: ## View Redis logs
	docker-compose logs -f redis

status: ## Show status of all services
	@echo "$(BLUE)📊 Service Status:$(NC)"
	@echo ""
	@docker-compose ps
	@echo ""
	@echo "$(BLUE)Health Checks:$(NC)"
	@$(MAKE) health

health: ## Check health of all services
	@echo ""
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo ""
	@echo -n "$(YELLOW)App Frontend:$(NC) "
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 > /dev/null 2>&1 && echo "$(GREEN)✅ Healthy$(NC)" || echo "$(RED)❌ Not responding$(NC)"
	@echo -n "$(YELLOW)Dashboard:$(NC)   "
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 > /dev/null 2>&1 && echo "$(GREEN)✅ Healthy$(NC)" || echo "$(RED)❌ Not responding$(NC)"
	@echo -n "$(YELLOW)Backend:$(NC)  "
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/health > /dev/null 2>&1 && echo "$(GREEN)✅ Healthy$(NC)" || echo "$(RED)❌ Not responding$(NC)"
	@echo -n "$(YELLOW)PostgreSQL:$(NC) "
	@docker-compose exec -T postgres pg_isready -U devuser > /dev/null 2>&1 && echo "$(GREEN)✅ Healthy$(NC)" || echo "$(RED)❌ Not responding$(NC)"
	@echo -n "$(YELLOW)Redis:$(NC)     "
	@docker-compose exec -T redis redis-cli ping > /dev/null 2>&1 && echo "$(GREEN)✅ Healthy$(NC)" || echo "$(RED)❌ Not responding$(NC)"

check: ## Run type checks on frontend and backend
	@echo "$(BLUE)🔍 Running type checks...$(NC)"
	@pnpm type-check:all
	@echo "$(GREEN)✅ Type checks passed$(NC)"

test: ## Run tests (placeholder)
	@echo "$(YELLOW)⚠️  Tests not yet implemented$(NC)"

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend sh

shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U devuser -d devenv

shell-redis: ## Open Redis CLI
	docker-compose exec redis redis-cli

