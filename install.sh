#!/usr/bin/env bash
# ==============================================================================
# TakinMart E-Commerce — Automated aaPanel Installation & Database Provisioning
# Database: takinmart | User: takinmart | Password: takinmart
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

log_info() { echo -e "${BLUE}[INFO]${NC} $1" >&2; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1" >&2; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

clear || true
echo -e "${CYAN}${BOLD}"
cat << "EOF"
  _____     _    _       __  __            _   
 |_   _|_ _| | _(_)_ __ |  \/  |__ _ _ _ _| |_ 
   | |/ _` | |/ / | '_ \| |\/| / _` | '_|_   _|
   |_|\__,_|_|\_\_|_| |_|_|  |_\__,_|_|   |_|  
     Bhutan Artisan E-Commerce Platform
EOF
echo -e "${NC}"
echo -e "${BOLD}==============================================================================${NC}"
echo -e " 🚀 aaPanel Direct Installer (Pure Node.js + aaPanel PostgreSQL)"
echo -e " 🗄️ Database: ${BOLD}takinmart${NC} | User: ${BOLD}takinmart${NC} | Password: ${BOLD}takinmart${NC}"
echo -e "${BOLD}==============================================================================${NC}\n"

# 1. Ensure .env is written with exact user credentials
log_info "[1/4] Configuring .env with aaPanel credentials..."
cat > .env << "ENVEOF"
POSTGRES_HOST="127.0.0.1"
POSTGRES_PORT="5432"
POSTGRES_DB="takinmart"
POSTGRES_USER="takinmart"
POSTGRES_PASSWORD="takinmart"
DATABASE_URL="postgresql://takinmart:takinmart@127.0.0.1:5432/takinmart"
APP_URL="https://takinmart.bt"
PORT=3000
NODE_ENV="production"
ENVEOF
log_success "Updated .env file with takinmart database credentials!"

# 2. Check Node.js and npm
log_info "[2/4] Checking Node.js environment..."
if ! command -v node >/dev/null 2>&1; then
    log_error "Node.js is not found. Please install Node.js 20+ via aaPanel Node Version Manager or 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs'"
    exit 1
fi
log_success "Node.js $(node -v) and npm $(npm -v) detected!"

# 3. Automatically import database schema into aaPanel PostgreSQL
log_info "[3/4] Importing database schema into PostgreSQL (database: takinmart)..."
PSQL_BIN=""
if command -v psql >/dev/null 2>&1; then
    PSQL_BIN="psql"
elif [ -f "/www/server/pgsql/bin/psql" ]; then
    PSQL_BIN="/www/server/pgsql/bin/psql"
elif [ -f "/usr/lib/postgresql/16/bin/psql" ]; then
    PSQL_BIN="/usr/lib/postgresql/16/bin/psql"
elif [ -f "/usr/lib/postgresql/15/bin/psql" ]; then
    PSQL_BIN="/usr/lib/postgresql/15/bin/psql"
fi

if [ -n "$PSQL_BIN" ]; then
    export PGPASSWORD="takinmart"
    if $PSQL_BIN -h 127.0.0.1 -p 5432 -U takinmart -d takinmart -f database/aapanel-init.sql >/dev/null 2>&1; then
        log_success "Database schema & seed products imported into 'takinmart' successfully!"
    else
        log_warn "Direct psql execution had a notice. You can also import 'database/aapanel-init.sql' via aaPanel's phpPgAdmin or Database tab."
    fi
    unset PGPASSWORD
else
    log_warn "psql client not found in PATH. Please click 'Import' in aaPanel PostgreSQL tab to upload 'database/aapanel-init.sql'."
fi

# 4. Install dependencies and build standalone production bundle
log_info "[4/4] Installing dependencies and building production server..."
npm install --legacy-peer-deps
export NITRO_PRESET="node-server"
npm run build
log_success "Production build completed (.output/server/index.mjs ready)!"

echo ""
echo -e "${GREEN}${BOLD}==============================================================================${NC}"
echo -e "${GREEN}${BOLD} ✔ TakinMart E-Commerce is fully configured & built!${NC}"
echo -e "${GREEN}${BOLD}==============================================================================${NC}"
echo ""
echo -e "${CYAN}${BOLD}📋 NEXT STEP IN aaPanel (Takes 30 seconds):${NC}"
echo -e " 1. Go to aaPanel -> ${BOLD}Website${NC} -> ${BOLD}Node project${NC} tab"
echo -e " 2. Click ${BOLD}Add Node project${NC}:"
echo -e "    - Path: ${BOLD}${APP_DIR}${NC}"
echo -e "    - Run Opt: ${BOLD}node .output/server/index.mjs${NC}"
echo -e "    - Port: ${BOLD}3000${NC}"
echo -e "    - Domain name: ${BOLD}yourdomain.com${NC} (e.g. takinmart.bt)"
echo -e " 3. Click ${BOLD}Submit${NC}"
echo -e " 4. Click site name -> ${BOLD}SSL${NC} -> Enable Let's Encrypt SSL & Force HTTPS"
echo ""
echo -e "${GREEN}${BOLD}🚀 To test right now in terminal, run: ${NC}${BOLD}node .output/server/index.mjs${NC}"
echo ""
