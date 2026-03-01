.DEFAULT_GOAL := help

.PHONY: help dev prod clear-nodemodules stop-containers dev-containers prod-containers

help: ## Show this help message
	@echo "Usage: make <target>"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | \
	awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

stop-containers: ## Stop and remove running Docker containers
	@echo "Cleaning up existing containers..."
	docker-compose down 2>/dev/null || true

clear-nodemodules: ## Remove frontend node_modules and lock file
	@echo "Cleaning frontend dependencies..."
	rm -rf web-app/node_modules web-app/package-lock.json

dev-containers: stop-containers ## Build and start dev Docker containers
	@echo "Starting E-commerce App in Development Mode..."
	docker-compose -f docker-compose.yml up --build --force-recreate
	@echo "Application should be running at:"
	@echo "   Frontend: http://localhost:5173"
	@echo "   Backend:  http://localhost:3000"

prod-containers: stop-containers ## Build and start prod Docker containers
	@echo "Starting AI Prompt Playground in Production Mode..."
	docker-compose up --build
	@echo "Application should be running at:"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Backend:  http://localhost:8001"

