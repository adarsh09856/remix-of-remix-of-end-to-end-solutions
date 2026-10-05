#!/usr/bin/env bash
set -eo pipefail
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo "=================================================================="
echo " Updating TakinMart E-Commerce from GitHub..."
echo "=================================================================="
git pull origin main
bash install.sh
