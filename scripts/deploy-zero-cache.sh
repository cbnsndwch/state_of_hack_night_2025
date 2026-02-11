#!/bin/bash
#
# Zero Cache Deployment Script
# 
# This script helps deploy the zero-cache container for production.
# 
# Usage:
#   ./scripts/deploy-zero-cache.sh [environment]
#
# Examples:
#   ./scripts/deploy-zero-cache.sh production
#   ./scripts/deploy-zero-cache.sh staging
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if environment is provided
ENVIRONMENT=${1:-production}
log_info "Deploying zero-cache for environment: $ENVIRONMENT"

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

# Validate required environment variables
REQUIRED_VARS=(
    "ZERO_UPSTREAM_DB"
    "ZERO_ADMIN_PASSWORD"
    "ZERO_QUERY_URL"
    "ZERO_MUTATE_URL"
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

# Check PostgreSQL connectivity
log_info "Testing PostgreSQL connection..."
if docker run --rm postgres:16-alpine psql "$ZERO_UPSTREAM_DB" -c "SELECT 1" &> /dev/null; then
    log_success "PostgreSQL connection successful"
else
    log_error "Cannot connect to PostgreSQL at: $ZERO_UPSTREAM_DB"
    log_info "Please verify:"
    log_info "  1. PostgreSQL is running"
    log_info "  2. Connection string is correct"
    log_info "  3. Network/firewall allows connections"
    exit 1
fi

# Check if logical replication is enabled
log_info "Checking if logical replication is enabled..."
WAL_LEVEL=$(docker run --rm postgres:16-alpine psql "$ZERO_UPSTREAM_DB" -t -c "SHOW wal_level" 2>/dev/null | xargs)
if [ "$WAL_LEVEL" != "logical" ]; then
    log_error "PostgreSQL logical replication is NOT enabled (wal_level=$WAL_LEVEL)"
    log_info "To enable logical replication:"
    log_info "  1. Set wal_level=logical in postgresql.conf"
    log_info "  2. Restart PostgreSQL"
    log_warning "Continuing anyway, but zero-cache may not work correctly..."
else
    log_success "PostgreSQL logical replication is enabled"
fi

# Pull latest zero-cache image
log_info "Pulling latest zero-cache image..."
docker pull rocicorp/zero:latest
log_success "Image pulled successfully"

# Stop existing container if running
CONTAINER_NAME="hello_miami_zero_cache_prod"
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log_warning "Stopping existing container: $CONTAINER_NAME"
    docker stop "$CONTAINER_NAME" || true
    docker rm "$CONTAINER_NAME" || true
fi

# Start zero-cache container
log_info "Starting zero-cache container..."
$DOCKER_COMPOSE -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d zero-cache

# Wait for container to be healthy
log_info "Waiting for zero-cache to be healthy..."
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    if docker ps --format '{{.Names}} {{.Status}}' | grep "$CONTAINER_NAME" | grep -q "healthy"; then
        log_success "Zero-cache is healthy!"
        break
    fi
    
    if [ $ELAPSED -eq $(($TIMEOUT - 10)) ]; then
        log_warning "Container is taking longer than expected to start..."
        log_info "Checking logs:"
        docker logs "$CONTAINER_NAME" --tail 20
    fi
    
    sleep 2
    ELAPSED=$(($ELAPSED + 2))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    log_error "Zero-cache failed to become healthy within ${TIMEOUT}s"
    log_info "Check logs with: docker logs $CONTAINER_NAME"
    exit 1
fi

# Check health endpoint
log_info "Verifying health endpoint..."
ZERO_PORT="${ZERO_CACHE_PORT:-4848}"
HEALTH_RESPONSE=$(curl -s "http://localhost:${ZERO_PORT}/" || echo "ERROR")
if [ "$HEALTH_RESPONSE" = "OK" ]; then
    log_success "Health endpoint is responding"
else
    log_error "Health endpoint is not responding correctly (got: $HEALTH_RESPONSE)"
    log_info "Check logs with: docker logs $CONTAINER_NAME"
    exit 1
fi

# Display container info
log_success "Deployment complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Zero Cache Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Container Name:  $CONTAINER_NAME"
echo "  Status:          $(docker ps --format '{{.Status}}' --filter "name=$CONTAINER_NAME")"
echo "  Port:            $ZERO_PORT"
echo ""
echo "  Health Check:    http://localhost:${ZERO_PORT}/"
echo "  Inspector:       http://localhost:${ZERO_PORT}/inspector"
echo ""
echo "  Admin Password:  $ZERO_ADMIN_PASSWORD"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Useful commands
log_info "Useful commands:"
echo ""
echo "  View logs:       docker logs $CONTAINER_NAME -f"
echo "  View stats:      docker stats $CONTAINER_NAME"
echo "  Stop container:  docker stop $CONTAINER_NAME"
echo "  Restart:         docker restart $CONTAINER_NAME"
echo ""

# Next steps
log_info "Next steps:"
echo ""
echo "  1. Configure reverse proxy (Nginx/Traefik) with SSL"
echo "  2. Set up monitoring and alerts"
echo "  3. Deploy your application"
echo "  4. Test realtime sync across clients"
echo ""
echo "  See docs/DEPLOYMENT.md for detailed instructions"
echo ""

log_success "Deployment script completed successfully!"
