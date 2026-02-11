#!/bin/bash
#
# Production Deployment Script for Hello Miami
# 
# This script deploys the complete application stack:
# - PostgreSQL (optional, if self-hosting)
# - Zero Cache (sync engine)
# - Application Server (React Router 7 + Zero client)
#
# Usage:
#   ./scripts/deploy-production.sh [environment]
#
# Examples:
#   ./scripts/deploy-production.sh production
#   ./scripts/deploy-production.sh staging
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Check if environment is provided
ENVIRONMENT=${1:-production}
log_info "Deploying Hello Miami application for environment: $ENVIRONMENT"

# Check if .env file exists
ENV_FILE=".env.${ENVIRONMENT}"
if [ ! -f "$ENV_FILE" ]; then
    log_error "Environment file $ENV_FILE not found!"
    log_info "Please create $ENV_FILE from .env.${ENVIRONMENT}.example"
    exit 1
fi

log_success "Found environment file: $ENV_FILE"

# Load environment variables
set -a
source "$ENV_FILE"
set +a

log_step "Step 1: Pre-flight Checks"

# Validate required environment variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "ZERO_UPSTREAM_DB"
    "ZERO_ADMIN_PASSWORD"
    "ZERO_QUERY_URL"
    "ZERO_MUTATE_URL"
    "VITE_ZERO_CACHE_URL"
    "VITE_CLERK_PUBLISHABLE_KEY"
    "CLERK_SECRET_KEY"
    "VITE_CLOUDINARY_CLOUD_NAME"
    "VITE_CLOUDINARY_UPLOAD_PRESET"
    "LUMA_API_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    log_error "Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

log_success "All required environment variables are set"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    exit 1
fi

log_success "Docker is installed"

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

log_success "Docker Compose is installed"

# Determine docker-compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

log_step "Step 2: Database Setup"

# Check PostgreSQL connectivity
log_info "Testing PostgreSQL connection..."
if docker run --rm postgres:16-alpine psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null; then
    log_success "PostgreSQL connection successful"
else
    log_error "Cannot connect to PostgreSQL at: $DATABASE_URL"
    log_info "Please verify:"
    log_info "  1. PostgreSQL is running"
    log_info "  2. Connection string is correct"
    log_info "  3. Network/firewall allows connections"
    exit 1
fi

# Check if logical replication is enabled
log_info "Checking if logical replication is enabled..."
WAL_LEVEL=$(docker run --rm postgres:16-alpine psql "$DATABASE_URL" -t -c "SHOW wal_level" 2>/dev/null | xargs)
if [ "$WAL_LEVEL" != "logical" ]; then
    log_error "PostgreSQL logical replication is NOT enabled (wal_level=$WAL_LEVEL)"
    log_info "To enable logical replication:"
    log_info "  1. Set wal_level=logical in postgresql.conf"
    log_info "  2. Restart PostgreSQL"
    log_warning "Continuing anyway, but zero-cache may not work correctly..."
else
    log_success "PostgreSQL logical replication is enabled"
fi

# Run database migrations
log_info "Running database migrations..."
if command -v pnpm &> /dev/null; then
    pnpm drizzle-kit push --force
    log_success "Database migrations completed"
else
    log_warning "pnpm not found, skipping migrations"
    log_info "Please run 'pnpm drizzle-kit push' manually before deploying"
fi

log_step "Step 3: Pull Latest Docker Images"

log_info "Pulling latest zero-cache image..."
docker pull rocicorp/zero:latest
log_success "Zero cache image pulled"

log_step "Step 4: Build Application"

log_info "Building application Docker image..."
$DOCKER_COMPOSE -f docker-compose.prod.yml --env-file "$ENV_FILE" build app
log_success "Application image built"

log_step "Step 5: Deploy Services"

# Stop existing containers
log_info "Stopping existing containers (if any)..."
$DOCKER_COMPOSE -f docker-compose.prod.yml --env-file "$ENV_FILE" down
log_success "Existing containers stopped"

# Start services
log_info "Starting services..."
$DOCKER_COMPOSE -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d

log_step "Step 6: Health Checks"

# Wait for zero-cache to be healthy
log_info "Waiting for zero-cache to be healthy..."
CONTAINER_NAME_ZERO="hello_miami_zero_cache_prod"
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    if docker ps --format '{{.Names}} {{.Status}}' | grep "$CONTAINER_NAME_ZERO" | grep -q "healthy"; then
        log_success "Zero-cache is healthy!"
        break
    fi
    
    if [ $ELAPSED -eq $(($TIMEOUT - 10)) ]; then
        log_warning "Zero-cache is taking longer than expected..."
        log_info "Checking logs:"
        docker logs "$CONTAINER_NAME_ZERO" --tail 20
    fi
    
    sleep 2
    ELAPSED=$(($ELAPSED + 2))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    log_error "Zero-cache failed to become healthy within ${TIMEOUT}s"
    log_info "Check logs with: docker logs $CONTAINER_NAME_ZERO"
    exit 1
fi

# Wait for app to be healthy
log_info "Waiting for application to be healthy..."
CONTAINER_NAME_APP="hello_miami_app_prod"
TIMEOUT=90
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    if docker ps --format '{{.Names}} {{.Status}}' | grep "$CONTAINER_NAME_APP" | grep -q "healthy"; then
        log_success "Application is healthy!"
        break
    fi
    
    if [ $ELAPSED -eq $(($TIMEOUT - 10)) ]; then
        log_warning "Application is taking longer than expected..."
        log_info "Checking logs:"
        docker logs "$CONTAINER_NAME_APP" --tail 20
    fi
    
    sleep 2
    ELAPSED=$(($ELAPSED + 2))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    log_error "Application failed to become healthy within ${TIMEOUT}s"
    log_info "Check logs with: docker logs $CONTAINER_NAME_APP"
    exit 1
fi

log_step "Step 7: Verify Endpoints"

# Check zero-cache health endpoint
log_info "Verifying zero-cache health endpoint..."
ZERO_PORT="${ZERO_CACHE_PORT:-4848}"
HEALTH_RESPONSE=$(curl -s "http://localhost:${ZERO_PORT}/" || echo "ERROR")
if [ "$HEALTH_RESPONSE" = "OK" ]; then
    log_success "Zero-cache health endpoint is responding"
else
    log_error "Zero-cache health endpoint is not responding correctly (got: $HEALTH_RESPONSE)"
fi

# Check application health endpoint
log_info "Verifying application health endpoint..."
APP_PORT="${APP_PORT:-3000}"
APP_HEALTH=$(curl -s "http://localhost:${APP_PORT}/health" || echo "ERROR")
if echo "$APP_HEALTH" | grep -q '"status":"OK"'; then
    log_success "Application health endpoint is responding"
else
    log_warning "Application health endpoint is not responding correctly"
fi

log_step "Deployment Complete!"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Hello Miami - Production Deployment Summary${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}Services:${NC}"
echo ""
echo "  📦 Zero Cache:    http://localhost:${ZERO_PORT}/"
echo "  🌐 Application:   http://localhost:${APP_PORT}/"
echo "  🔍 Inspector:     http://localhost:${ZERO_PORT}/inspector"
echo "  ❤️  Health Check:  http://localhost:${APP_PORT}/health"
echo ""
echo -e "${CYAN}Container Status:${NC}"
echo ""
$DOCKER_COMPOSE -f docker-compose.prod.yml --env-file "$ENV_FILE" ps
echo ""
echo -e "${CYAN}Useful Commands:${NC}"
echo ""
echo "  View logs (all):         $DOCKER_COMPOSE -f docker-compose.prod.yml logs -f"
echo "  View logs (app):         docker logs $CONTAINER_NAME_APP -f"
echo "  View logs (zero-cache):  docker logs $CONTAINER_NAME_ZERO -f"
echo "  View stats:              docker stats"
echo "  Stop services:           $DOCKER_COMPOSE -f docker-compose.prod.yml down"
echo "  Restart services:        $DOCKER_COMPOSE -f docker-compose.prod.yml restart"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo ""
echo "  1. Configure reverse proxy (Nginx/Traefik) with SSL/TLS"
echo "  2. Set up DNS records (A/CNAME for app and sync subdomain)"
echo "  3. Configure monitoring and alerts"
echo "  4. Test end-to-end user flows"
echo "  5. Set up automated backups"
echo ""
echo "  See docs/DEPLOYMENT.md for detailed instructions"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

log_success "Deployment script completed successfully!"
