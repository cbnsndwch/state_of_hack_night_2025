# Deployment Guide

This guide covers deploying the Hello Miami application with PostgreSQL + Zero Sync to production.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [1. PostgreSQL Setup](#1-postgresql-setup)
- [2. Zero Cache Deployment](#2-zero-cache-deployment)
- [3. Application Deployment](#3-application-deployment)
- [4. Environment Configuration](#4-environment-configuration)
- [5. Monitoring & Health Checks](#5-monitoring--health-checks)
- [6. Troubleshooting](#6-troubleshooting)

---

## Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│   Clients   │────────▶│  zero-cache  │────────▶│ PostgreSQL │
│  (Browser)  │◀────────│   (Docker)   │◀────────│  (Server)  │
└─────────────┘         └──────────────┘         └────────────┘
       │                      │                         │
       │                      │                         │
       └──────────────────────┴─────────────────────────┘
                              │
                     ┌────────▼────────┐
                     │  React Router 7 │
                     │  (API Routes)   │
                     └─────────────────┘
```

**Key Components**:

1. **PostgreSQL**: Primary data store with logical replication enabled
2. **Zero Cache**: Sync engine that replicates data to clients in realtime
3. **React Router 7**: Server-side API routes for queries and mutations
4. **Client Apps**: Browser applications with local SQLite replicas

---

## Prerequisites

- [ ] PostgreSQL 16+ (Neon, Supabase, AWS RDS, or self-hosted)
- [ ] Docker host for zero-cache container
- [ ] Domain/subdomain for zero-cache (e.g., `sync.hellomiami.co`)
- [ ] SSL/TLS certificates (Let's Encrypt recommended)
- [ ] Container orchestration (Docker Compose, Kubernetes, or similar)

---

## 1. PostgreSQL Setup

### Option A: Managed PostgreSQL (Recommended)

**Neon** (Recommended for development/staging):

```bash
# Create a new project at https://neon.tech
# Enable logical replication in the database settings
```

**Supabase**:

```bash
# Create a new project at https://supabase.com
# Logical replication is enabled by default
```

**AWS RDS**:

```sql
-- Enable logical replication
ALTER SYSTEM SET wal_level = logical;
ALTER SYSTEM SET max_replication_slots = 10;
ALTER SYSTEM SET max_wal_senders = 10;

-- Restart the database instance
```

### Option B: Self-Hosted PostgreSQL

**Docker Compose**:

```yaml
services:
    postgres:
        image: postgres:16-alpine
        environment:
            POSTGRES_DB: hello_miami
            POSTGRES_USER: ${DB_USER}
            POSTGRES_PASSWORD: ${DB_PASSWORD}
        ports:
            - '5432:5432'
        command: postgres -c wal_level=logical -c max_connections=200
        volumes:
            - postgres-data:/var/lib/postgresql/data
        healthcheck:
            test: ['CMD-SHELL', 'pg_isready -U ${DB_USER}']
            interval: 10s
            timeout: 5s
            retries: 5

volumes:
    postgres-data:
```

### Run Migrations

```bash
# From your project directory
pnpm drizzle-kit push
```

This will create all tables, indexes, and constraints in PostgreSQL.

---

## 2. Zero Cache Deployment

### Production Docker Compose

Create a `docker-compose.prod.yml` file:

```yaml
services:
    zero-cache:
        image: rocicorp/zero:latest
        container_name: hello_miami_zero_cache
        restart: unless-stopped
        ports:
            - '4848:4848'
        environment:
            # PostgreSQL connection (must have logical replication enabled)
            ZERO_UPSTREAM_DB: ${ZERO_UPSTREAM_DB}

            # Replica storage
            ZERO_REPLICA_FILE: /data/zero.db

            # Admin password for Zero Inspector
            ZERO_ADMIN_PASSWORD: ${ZERO_ADMIN_PASSWORD}

            # API endpoints (your application's URLs)
            ZERO_QUERY_URL: ${ZERO_QUERY_URL}
            ZERO_MUTATE_URL: ${ZERO_MUTATE_URL}

            # Cookie forwarding for authentication
            ZERO_QUERY_FORWARD_COOKIES: 'true'
            ZERO_MUTATE_FORWARD_COOKIES: 'true'

            # Performance tuning
            ZERO_NUM_SYNC_WORKERS: '4'
            ZERO_UPSTREAM_MAX_CONNS: '100'

            # Optional: HTTPS configuration
            # ZERO_TLS_CERT_FILE: /certs/fullchain.pem
            # ZERO_TLS_KEY_FILE: /certs/privkey.pem
        volumes:
            - zero-cache-data:/data
            # - /path/to/certs:/certs:ro  # Optional: for SSL/TLS
        healthcheck:
            test:
                [
                    'CMD',
                    'wget',
                    '--spider',
                    '-q',
                    'http://localhost:4848/health'
                ]
            interval: 30s
            timeout: 10s
            retries: 3
            start_period: 10s

volumes:
    zero-cache-data:
```

### Environment Variables

Create a `.env.production` file:

```bash
# PostgreSQL connection
ZERO_UPSTREAM_DB=postgresql://user:password@your-postgres-host:5432/hello_miami

# Admin password (use a strong password)
ZERO_ADMIN_PASSWORD=your-secure-admin-password

# API endpoints (your production domain)
ZERO_QUERY_URL=https://hellomiami.co/api/zero/query
ZERO_MUTATE_URL=https://hellomiami.co/api/zero/mutate
```

### Deploy Zero Cache

```bash
# Start the container
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Check logs
docker logs hello_miami_zero_cache -f

# Verify health
curl http://localhost:4848/health
```

**Expected output**:

```json
{ "status": "OK" }
```

### Verify Schema Replication

```bash
# Open Zero Inspector
open http://localhost:4848/inspector

# Login with ZERO_ADMIN_PASSWORD
# Check that all tables are listed in the "Schema" tab
```

---

## 3. Application Deployment

### Build Application

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Output will be in build/ directory
```

### Deploy to Server

**Option A: Node.js Server**:

```bash
# Copy build files to server
scp -r build/ user@server:/var/www/hello_miami/

# Install dependencies on server
ssh user@server
cd /var/www/hello_miami
pnpm install --prod

# Start with PM2
pm2 start build/server/index.js --name hello_miami
pm2 save
```

**Option B: Docker**:

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --prod

# Copy build output
COPY build ./build

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "build/server/index.js"]
```

Build and run:

```bash
docker build -t hello-miami-app .
docker run -d -p 3000:3000 --env-file .env.production hello-miami-app
```

### Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/hellomiami.co
server {
    listen 80;
    server_name hellomiami.co;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hellomiami.co;

    ssl_certificate /etc/letsencrypt/live/hellomiami.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hellomiami.co/privkey.pem;

    # Application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Zero Cache (subdomain)
server {
    listen 443 ssl http2;
    server_name sync.hellomiami.co;

    ssl_certificate /etc/letsencrypt/live/sync.hellomiami.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sync.hellomiami.co/privkey.pem;

    location / {
        proxy_pass http://localhost:4848;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Forward cookies for authentication
        proxy_pass_request_headers on;
        proxy_set_header Cookie $http_cookie;
    }
}
```

Enable and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/hellomiami.co /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 4. Environment Configuration

### Application `.env.production`

```bash
# Database
DATABASE_URL=postgresql://user:password@your-postgres-host:5432/hello_miami

# Zero Sync (use subdomain for production)
VITE_ZERO_CACHE_URL=https://sync.hellomiami.co
ZERO_UPSTREAM_DB=postgresql://user:password@your-postgres-host:5432/hello_miami
ZERO_ADMIN_PASSWORD=your-secure-admin-password

# Authentication (Clerk)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# File Storage (Cloudinary)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# Event Integration (Luma)
LUMA_API_KEY=your-luma-api-key
LUMA_WEBHOOK_SECRET=your-webhook-secret

# Email Notifications (Resend)
RESEND_API_KEY=your-resend-api-key

# Application
NODE_ENV=production
PORT=3000
```

### Security Checklist

- [ ] Use strong passwords for `ZERO_ADMIN_PASSWORD`
- [ ] Enable SSL/TLS for all services
- [ ] Configure CORS policies appropriately
- [ ] Use environment-specific API keys (not test keys)
- [ ] Enable PostgreSQL connection pooling
- [ ] Configure rate limiting on API routes
- [ ] Set up firewall rules to restrict database access

---

## 5. Monitoring & Health Checks

### Zero Cache Health Check

```bash
# HTTP health check (root endpoint)
curl https://sync.hellomiami.co/

# Expected response
OK
```

### Zero Inspector

Access the Zero Inspector at:

```
https://sync.hellomiami.co/inspector
```

Login with `ZERO_ADMIN_PASSWORD` to view:

- Current sync status
- Connected clients
- Schema information
- Replication lag
- Query performance

### Application Health Check

Create a health check endpoint in `app/routes/health.tsx`:

```typescript
import type { LoaderFunctionArgs } from 'react-router';
import { json } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
    // Check database connection
    // Check Zero cache connection
    // Return status

    return json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
}
```

### Monitoring Tools

**Recommended monitoring setup**:

1. **Uptime monitoring**: Use [UptimeRobot](https://uptimerobot.com/) or [BetterStack](https://betterstack.com/)
2. **Log aggregation**: Use [Papertrail](https://www.papertrail.com/) or [Logtail](https://logtail.com/)
3. **Error tracking**: Use [Sentry](https://sentry.io/)
4. **Database monitoring**: Use [pgAnalyze](https://pganalyze.com/) or native provider tools

### Alert Configuration

Set up alerts for:

- Zero cache container down
- PostgreSQL replication lag > 5 seconds
- API error rate > 5%
- High memory usage (> 90%)
- Disk space low (< 10% free)

---

## 6. Troubleshooting

### Zero Cache Not Starting

**Check logs**:

```bash
docker logs hello_miami_zero_cache --tail 100
```

**Common issues**:

1. **Cannot connect to PostgreSQL**:

    ```
    Error: connection refused
    ```

    - Verify `ZERO_UPSTREAM_DB` is correct
    - Check PostgreSQL is accessible from Docker network
    - Verify PostgreSQL user has replication permissions

2. **Logical replication not enabled**:

    ```
    Error: wal_level must be set to 'logical'
    ```

    - Enable logical replication in PostgreSQL (see [PostgreSQL Setup](#1-postgresql-setup))
    - Restart PostgreSQL after changing settings

3. **Cannot reach API endpoints**:

    ```
    Error: ECONNREFUSED connecting to ZERO_QUERY_URL
    ```

    - Use `host.docker.internal` for local development
    - Use public URLs for production
    - Verify application is running and accessible

### Clients Not Syncing

**Check Zero Inspector**:

1. Open `https://sync.hellomiami.co/inspector`
2. Check "Clients" tab for connected clients
3. Check "Schema" tab for table replication status

**Common issues**:

1. **CORS errors**:
    - Ensure Zero cache allows requests from your domain
    - Check browser console for CORS errors

2. **Authentication errors**:
    - Verify `ZERO_QUERY_FORWARD_COOKIES` is set to `true`
    - Check that Clerk session cookies are being sent
    - Verify API endpoints return correct auth context

3. **Schema mismatch**:
    - Regenerate Zero schema: `npx drizzle-zero generate`
    - Rebuild application with updated schema
    - Clear client SQLite cache (delete browser IndexedDB)

### High Replication Lag

**Check PostgreSQL**:

```sql
-- Check replication slots
SELECT * FROM pg_replication_slots;

-- Check replication lag
SELECT
  slot_name,
  pg_current_wal_lsn() - confirmed_flush_lsn AS lag_bytes
FROM pg_replication_slots;
```

**Solutions**:

- Increase `ZERO_UPSTREAM_MAX_CONNS`
- Scale PostgreSQL instance (more CPU/memory)
- Add read replicas for query load
- Optimize slow queries (add indexes)

### Container Crashes

**Check memory usage**:

```bash
docker stats hello_miami_zero_cache
```

**Increase memory limit**:

```yaml
services:
    zero-cache:
        # ...
        deploy:
            resources:
                limits:
                    memory: 2G
                reservations:
                    memory: 1G
```

**Enable swap** (if memory is constrained):

```bash
# Add swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## Deployment Checklist

Before going live:

- [ ] PostgreSQL deployed with logical replication enabled
- [ ] Database migrations applied successfully
- [ ] Zero cache container running and healthy
- [ ] Application built and deployed
- [ ] SSL/TLS certificates installed and verified
- [ ] Environment variables configured correctly
- [ ] Health checks passing for all services
- [ ] Monitoring and alerting configured
- [ ] Backup strategy in place for PostgreSQL
- [ ] DNS records configured (A/CNAME for app and sync subdomain)
- [ ] Test authentication flow end-to-end
- [ ] Test realtime sync across multiple clients
- [ ] Load test with expected traffic

---

## Scaling Considerations

### Single-Node (MVP - Current Setup)

- **Capacity**: ~1,000 concurrent users
- **Setup**: Single zero-cache container + PostgreSQL
- **Cost**: Low (~$50-100/month)

### Multi-Node (Production Scale)

- **Capacity**: ~10,000+ concurrent users
- **Setup**: Multiple zero-cache containers behind load balancer
- **Requirements**:
    - Shared PostgreSQL instance
    - Redis for coordination (optional)
    - Load balancer (HAProxy, Nginx, or cloud LB)

**Example Multi-Node Setup**:

```yaml
services:
    zero-cache-1:
        image: rocicorp/zero:latest
        environment:
            ZERO_UPSTREAM_DB: ${ZERO_UPSTREAM_DB}
            # ... other configs
        deploy:
            replicas: 3
```

Use a load balancer to distribute connections:

```nginx
upstream zero_cache {
    least_conn;
    server zero-cache-1:4848;
    server zero-cache-2:4848;
    server zero-cache-3:4848;
}
```

---

## Support

For issues with:

- **Zero Sync**: Check [Zero Docs](https://zero.rocicorp.dev/docs) or [GitHub](https://github.com/rocicorp/zero)
- **Deployment**: Open an issue in this repository
- **Application**: Contact the Hello Miami team

---

## References

- [Zero Sync Documentation](https://zero.rocicorp.dev/docs)
- [React Router 7 Deployment](https://reactrouter.com/docs/en/v7/guides/deployment)
- [PostgreSQL Logical Replication](https://www.postgresql.org/docs/current/logical-replication.html)
- [Docker Compose Production Guide](https://docs.docker.com/compose/production/)
