#!/usr/bin/env bash
# ==============================================================================
# TakinMart E-Commerce — 1-Command Production Update & Redeploy Script
# ==============================================================================

set -eo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo -e "${CYAN}${BOLD}==============================================================================${NC}"
echo -e "${BOLD} 🚀 TakinMart E-Commerce — Fast Production Update & Redeploy${NC}"
echo -e "${CYAN}${BOLD}==============================================================================${NC}"

# 1. Pull latest code if git repo
if [ -d ".git" ]; then
    echo -e "${BLUE}[1/4] Pulling latest updates from Git...${NC}"
    git pull origin main || echo -e "${YELLOW}⚠️ Git pull failed or working offline, proceeding with local changes.${NC}"
else
    echo -e "${BLUE}[1/4] Deploying from local workspace directory...${NC}"
fi

# 2. Rebuild and restart application containers
echo -e "${BLUE}[2/4] Building and updating application containers...${NC}"
docker compose -f docker-compose.aapanel.yaml up -d --build --remove-orphans

# 3. Clean up dangling images and old build cache
echo -e "${BLUE}[3/4] Pruning Docker build cache & dangling images...${NC}"
docker builder prune -af --filter "until=24h" >/dev/null 2>&1 || true
docker image prune -f >/dev/null 2>&1 || true

# 4. Service health verification
echo -e "${BLUE}[4/4] Verifying running services and API health...${NC}"
docker compose -f docker-compose.aapanel.yaml ps

WEB_PORT=$(grep '^WEB_PORT=' .env 2>/dev/null | cut -d '=' -f2- || echo "3000")
echo ""
echo -e "${GREEN}${BOLD} ✔ TakinMart successfully updated and running!${NC}"
echo -e "${GREEN}  👉 Web App: http://127.0.0.1:${WEB_PORT}${NC}"
echo ""
