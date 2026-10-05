#!/usr/bin/env bash
# ==============================================================================
# TakinMart E-Commerce — 1-Command Production Update & Redeploy Script
# ==============================================================================

set -eo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo -e "${CYAN}${BOLD}==============================================================================${NC}"
echo -e "${BOLD} 🚀 TakinMart E-Commerce — Fast Production Update & Redeploy${NC}"
echo -e "${CYAN}${BOLD}==============================================================================${NC}"

# 1. Pull latest code if git repo
if [ -d ".git" ]; then
    echo -e "${BLUE}[1/3] Pulling latest updates from Git...${NC}"
    git pull origin main || echo -e "${YELLOW}⚠️ Git pull failed or working offline, proceeding with local changes.${NC}"
else
    echo -e "${BLUE}[1/3] Deploying from local workspace directory...${NC}"
fi

# 2. Build production server
echo -e "${BLUE}[2/3] Installing dependencies and building production server...${NC}"
npm install --legacy-peer-deps
export NITRO_PRESET="node-server"
npm run build

# 3. Restart process (supports aaPanel Node manager / PM2 / Docker)
echo -e "${BLUE}[3/3] Restarting application...${NC}"
if command -v pm2 >/dev/null 2>&1; then
    pm2 reload takinmart 2>/dev/null || pm2 restart takinmart 2>/dev/null || true
fi

if [ -f "docker-compose.aapanel.yaml" ] && command -v docker >/dev/null 2>&1 && docker ps -q --filter "name=takinmart" | grep -q .; then
    docker compose -f docker-compose.aapanel.yaml restart web 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}${BOLD} ✔ TakinMart successfully updated and running!${NC}"
echo -e "${GREEN}  👉 Server bundle: .output/server/index.mjs${NC}"
echo ""
