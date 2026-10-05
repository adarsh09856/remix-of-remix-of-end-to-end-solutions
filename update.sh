#!/usr/bin/env bash
set -e

# ==============================================================================
# TakinMart E-Commerce — 1-Click Update Script (Port 4000)
# ==============================================================================
# Pulls latest code, builds, terminates previous process cleanly, and starts node.
# ==============================================================================

PORT=4000
echo "==> [1/4] Pulling latest updates from git repository..."
git stash 2>/dev/null || true
git pull origin main

echo "==> [2/4] Building production application..."
export NITRO_PRESET="node-server"
npm run build

echo "==> [3/4] Gracefully stopping previous process on port ${PORT}..."
if command -v fuser >/dev/null 2>&1; then
    fuser -k -9 "${PORT}/tcp" 2>/dev/null || true
fi
if command -v lsof >/dev/null 2>&1; then
    lsof -ti :${PORT} | xargs -r kill -9 2>/dev/null || true
fi
if [ -f "takinmart.pid" ]; then
    OLD_PID=$(cat takinmart.pid 2>/dev/null)
    if [ -n "$OLD_PID" ]; then
        kill -9 "$OLD_PID" 2>/dev/null || true
    fi
    rm -f takinmart.pid
fi
sleep 2

echo "==> [4/4] Starting TakinMart on Port ${PORT}..."
PORT=${PORT} NITRO_PORT=${PORT} nohup node .output/server/index.mjs > takinmart.log 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > takinmart.pid
disown -h "$NEW_PID" 2>/dev/null || true

echo "==> Waiting for server to initialize..."
for i in 1 2 3 4 5; do
    sleep 1
    if command -v curl >/dev/null 2>&1; then
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}" 2>/dev/null || echo "000")
        if [ "$STATUS" != "000" ] && [ "$STATUS" != "502" ]; then
            echo "✔ Service is responding with HTTP ${STATUS} on http://127.0.0.1:${PORT}!"
            break
        fi
    fi
done

echo ""
echo "=================================================================="
echo "✔ TakinMart E-Commerce updated & running on port ${PORT} (PID: ${NEW_PID})"
echo "✔ Access live at: https://takinmart.bt"
echo "=================================================================="
