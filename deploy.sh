#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Pynemonk Monolith — Unified Deployment Script
# ─────────────────────────────────────────────────────────────────────────────
# This script handles the building, starting, and database initialization 
# for the entire Pynemonk platform.
# ─────────────────────────────────────────────────────────────────────────────

set -e # Exit immediately if a command exits with a non-zero status.

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper functions
log() { echo -e "${BLUE}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

log "Starting deployment sequence..."

# 1. Environment Check
if [ ! -f .env ]; then
    warn "No root .env file found. Copying from monolith template..."
    cp apps/pynemonk-monolith/.env .env || { error "Failed to create .env file."; exit 1; }
fi

# 2. Docker Services
log "Orchestrating Docker containers..."
docker compose up -d --build

# 3. Database Health Check
log "Waiting for PostgreSQL to be healthy..."
MAX_RETRIES=30
COUNT=0
until docker exec pynemonk-postgres pg_isready -U postgres &> /dev/null; do
    if [ $COUNT -ge $MAX_RETRIES ]; then
        error "Database failed to start in time."
        exit 1
    fi
    sleep 1
    COUNT=$((COUNT+1))
done
success "Database is online."

# 4. Run Consolidated Migrations
log "Executing platform migrations..."
# This triggers the MigrationRunner in each module (Auth, School, Accounting)
docker exec pynemonk-api npm run migrate

# 5. Seed Data (Optional)
# Usage: ./deploy.sh --seed
if [[ $* == *--seed* ]]; then
    log "Seeding consolidated Auth data..."
    if [ -f services/pynemonk-core-auth/sql/seeders/001_seed_auth_data.sql ]; then
        cat services/pynemonk-core-auth/sql/seeders/001_seed_auth_data.sql | docker exec -i pynemonk-postgres psql -U postgres -d pynemonk_core
        success "Auth data seeded."
    else
        warn "Auth seeder not found. Skipping."
    fi

    log "Seeding consolidated Accounting data..."
    if [ -f services/pynemonk-core-accounting/sql/seeders/001_seed_accounting_data.sql ]; then
        cat services/pynemonk-core-accounting/sql/seeders/001_seed_accounting_data.sql | docker exec -i pynemonk-postgres psql -U postgres -d pynemonk_core
        success "Accounting data seeded."
    else
        warn "Accounting seeder not found. Skipping."
    fi
fi

# 6. Final Status
log "Verifying service health..."
sleep 2
if docker ps | grep -q pynemonk-api; then
    success "Pynemonk is LIVE at http://localhost:3000"
    echo -e "${BLUE}Logs are available via: ${NC}docker compose logs -f api"
else
    error "API container failed to stay up. Check logs: docker compose logs api"
    exit 1
fi
