#!/bin/bash

# Test script for environment profiles
# Tests that different environments load the correct config files

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Environment Profiles${NC}"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq is not installed. Installing basic JSON parsing...${NC}"
    JQ_AVAILABLE=false
else
    JQ_AVAILABLE=true
fi

# Function to check config
check_config() {
    local env=$1
    local expected_db_name=$2
    local expected_interval=$3
    
    echo -e "${YELLOW}Testing ${env} environment...${NC}"
    
    # Wait for backend to be ready
    echo "Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:3003/health > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done
    
    # Get config
    if [ "$JQ_AVAILABLE" = true ]; then
        DB_NAME=$(curl -s http://localhost:3003/api/config | jq -r '.services.database.name')
        INTERVAL=$(curl -s http://localhost:3003/api/config | jq -r '.healthChecks.interval')
    else
        CONFIG=$(curl -s http://localhost:3003/api/config)
        DB_NAME=$(echo "$CONFIG" | grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | cut -d'"' -f4)
        INTERVAL=$(echo "$CONFIG" | grep -o '"interval"[[:space:]]*:[[:space:]]*[0-9]*' | head -1 | grep -o '[0-9]*')
    fi
    
    # Verify database name
    if [ "$DB_NAME" = "$expected_db_name" ]; then
        echo -e "  ${GREEN}✅ Database name: $DB_NAME (correct)${NC}"
    else
        echo -e "  ${RED}❌ Database name: $DB_NAME (expected: $expected_db_name)${NC}"
        return 1
    fi
    
    # Verify health check interval
    if [ "$INTERVAL" = "$expected_interval" ]; then
        echo -e "  ${GREEN}✅ Health check interval: $INTERVAL (correct)${NC}"
    else
        echo -e "  ${RED}❌ Health check interval: $INTERVAL (expected: $expected_interval)${NC}"
        return 1
    fi
    
    echo ""
    return 0
}

# Test Development
echo -e "${BLUE}📋 Test 1: Development Environment${NC}"
cd "$(dirname "$0")/.."
make down > /dev/null 2>&1 || true
make dev > /dev/null 2>&1
sleep 10
if check_config "development" "devenv" "30"; then
    echo -e "${GREEN}✅ Development test passed!${NC}"
else
    echo -e "${RED}❌ Development test failed!${NC}"
    exit 1
fi

# Test Staging
echo -e "${BLUE}📋 Test 2: Staging Environment${NC}"
make down > /dev/null 2>&1 || true
make dev-staging > /dev/null 2>&1
sleep 10
if check_config "staging" "devenv_staging" "30"; then
    echo -e "${GREEN}✅ Staging test passed!${NC}"
else
    echo -e "${RED}❌ Staging test failed!${NC}"
    exit 1
fi

# Test Production
echo -e "${BLUE}📋 Test 3: Production Environment${NC}"
make down > /dev/null 2>&1 || true
make dev-production > /dev/null 2>&1
sleep 10
if check_config "production" "devenv_production" "15"; then
    echo -e "${GREEN}✅ Production test passed!${NC}"
else
    echo -e "${RED}❌ Production test failed!${NC}"
    exit 1
fi

# Cleanup
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
make down > /dev/null 2>&1 || true

echo ""
echo -e "${GREEN}🎉 All environment profile tests passed!${NC}"

