# Production Deployment Guide

This guide covers deploying the Hello Miami community site with PostgreSQL + Zero Sync to production.

## Overview

The production stack consists of:

1. **PostgreSQL 16+** - Primary database with logical replication
2. **zero-cache** - Sync engine for realtime client updates
3. **Application** - React Router 7 SSR application
4. **Clerk** - Authentication service
5. **Cloudinary** - Media storage

## Infrastructure Options

### Option 1: Managed PostgreSQL (Recommended)

**Providers**:

- **Neon** (https://neon.tech) - Serverless PostgreSQL with automatic scaling
- **Supabase** (https://supabase.com) - PostgreSQL with built-in tools
- **AWS RDS** - Managed PostgreSQL on AWS
- **Google Cloud SQL** - Managed PostgreSQL on GCP
- **Azure Database** - Managed PostgreSQL on Azure

**Requirements**:

- PostgreSQL 16+
- Logical replication enabled (`wal_level=logical`)
- SSL/TLS enabled
- Connection pooling (pgBouncer or built-in)
- Automated backups

### Option 2: Self-Hosted PostgreSQL

Use Docker Compose or Kubernetes to deploy PostgreSQL.

## Step 1: Set Up PostgreSQL on Production

### Option A: Using Neon (Recommended for MVPs)

1. **Create a Neon Account** at https://neon.tech
2. **Create a new project**
    - Name: `hello-miami-prod`
    - Region: Choose closest to your users (e.g., `us-east-1`)
3. **Create a database**
    - Database name: `hello_miami`
    - Default user is auto-created
4. **Enable logical replication**
    ```sql
    ALTER SYSTEM SET wal_level = logical;
    SELECT pg_reload_conf();
    ```
5. **Get connection string**
    - Format: `postgresql://user:password@hostname/hello_miami?sslmode=require`
    - Save as `DATABASE_URL` environment variable

### Option B: Using Supabase

1. **Create a Supabase Account** at https://supabase.com
2. **Create a new project**
    - Name: `hello-miami-prod`
    - Database password: (strong password)
    - Region: Choose closest to your users
3. **Enable logical replication** (already enabled by default)
4. **Get connection string**
    - Go to Project Settings → Database
    - Copy "Connection string" (URI format)
    - Add `?sslmode=require` to the end
    - Save as `DATABASE_URL` environment variable

### Option C: Self-Hosted with Docker

1. **Create a `docker-compose.prod.yml`**:

```yaml
services:
    postgres:
        image: postgres:16-alpine
        container_name: hello_miami_postgres_prod
        restart: always
        environment:
            POSTGRES_DB: hello_miami
            POSTGRES_USER: ${DB_USER}
            POSTGRES_PASSWORD: ${DB_PASSWORD}
        ports:
            - '5432:5432'
        command: >
            postgres
            -c wal_level=logical
            -c max_connections=200
            -c shared_buffers=256MB
            -c effective_cache_size=1GB
            -c maintenance_work_mem=64MB
            -c checkpoint_completion_target=0.9
            -c wal_buffers=16MB
            -c default_statistics_target=100
            -c random_page_cost=1.1
            -c effective_io_concurrency=200
            -c work_mem=2621kB
            -c min_wal_size=1GB
            -c max_wal_size=4GB
        volumes:
            - postgres-data:/var/lib/postgresql/data
            - ./backups:/backups
        healthcheck:
            test: ['CMD-SHELL', 'pg_isready -U ${DB_USER}']
            interval: 10s
            timeout: 5s
            retries: 5

volumes:
    postgres-data:
        driver: local
```

2. **Start PostgreSQL**:

```bash
docker-compose -f docker-compose.prod.yml up -d postgres
```

3. **Verify connection**:

```bash
docker exec -it hello_miami_postgres_prod psql -U postgres -d hello_miami
```

## Step 2: Run Database Migrations

1. **Set DATABASE_URL environment variable**:

```bash
export DATABASE_URL="postgresql://user:password@hostname/hello_miami?sslmode=require"
```

2. **Run Drizzle migrations**:

```bash
pnpm drizzle-kit migrate
```

Or manually:

```bash
pnpm drizzle-kit push
```

3. **Verify tables were created**:

```bash
psql $DATABASE_URL -c "\dt"
```

Expected output:

```
             List of relations
 Schema |       Name        | Type  |  Owner
--------+-------------------+-------+----------
 public | attendance        | table | postgres
 public | badges            | table | postgres
 public | demo_slots        | table | postgres
 public | event_attendance  | table | postgres
 public | events            | table | postgres
 public | luma_webhooks     | table | postgres
 public | pending_users     | table | postgres
 public | profiles          | table | postgres
 public | projects          | table | postgres
 public | survey_responses  | table | postgres
 public | surveys           | table | postgres
 public | user_badges       | table | postgres
```

4. **Create indexes** (if not already in migrations):

```sql
-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_luma_email ON profiles(luma_email);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_profile_id ON projects(profile_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Events
CREATE INDEX IF NOT EXISTS idx_events_luma_event_id ON events(luma_event_id);
CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at DESC);

-- Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance(event_id);

-- User Badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
```

## Step 3: Deploy zero-cache Container

### Option A: Docker Compose (Single Server)

1. **Update `docker-compose.prod.yml`** to include zero-cache:

```yaml
services:
    zero-cache:
        image: rocicorp/zero:latest
        container_name: hello_miami_zero_cache_prod
        restart: always
        ports:
            - '4848:4848'
        environment:
            ZERO_UPSTREAM_DB: ${DATABASE_URL}
            ZERO_REPLICA_FILE: /data/zero.db
            ZERO_ADMIN_PASSWORD: ${ZERO_ADMIN_PASSWORD}
            ZERO_QUERY_URL: https://hellomiami.co/api/zero/query
            ZERO_MUTATE_URL: https://hellomiami.co/api/zero/mutate
            ZERO_QUERY_FORWARD_COOKIES: 'true'
            ZERO_MUTATE_FORWARD_COOKIES: 'true'
            ZERO_NUM_SYNC_WORKERS: '8'
            ZERO_UPSTREAM_MAX_CONNS: '50'
        volumes:
            - zero-cache-data:/data
        depends_on:
            postgres:
                condition: service_healthy

volumes:
    zero-cache-data:
        driver: local
```

2. **Start zero-cache**:

```bash
docker-compose -f docker-compose.prod.yml up -d zero-cache
```

3. **Verify zero-cache is running**:

```bash
curl http://localhost:4848/health
```

Expected output:

```json
{ "status": "ok" }
```

### Option B: Kubernetes Deployment

1. **Create `k8s/zero-cache-deployment.yaml`**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
    name: zero-cache
    labels:
        app: zero-cache
spec:
    replicas: 2
    selector:
        matchLabels:
            app: zero-cache
    template:
        metadata:
            labels:
                app: zero-cache
        spec:
            containers:
                - name: zero-cache
                  image: rocicorp/zero:latest
                  ports:
                      - containerPort: 4848
                  env:
                      - name: ZERO_UPSTREAM_DB
                        valueFrom:
                            secretKeyRef:
                                name: postgres-credentials
                                key: database-url
                      - name: ZERO_REPLICA_FILE
                        value: /data/zero.db
                      - name: ZERO_ADMIN_PASSWORD
                        valueFrom:
                            secretKeyRef:
                                name: zero-credentials
                                key: admin-password
                      - name: ZERO_QUERY_URL
                        value: https://hellomiami.co/api/zero/query
                      - name: ZERO_MUTATE_URL
                        value: https://hellomiami.co/api/zero/mutate
                      - name: ZERO_QUERY_FORWARD_COOKIES
                        value: 'true'
                      - name: ZERO_MUTATE_FORWARD_COOKIES
                        value: 'true'
                      - name: ZERO_NUM_SYNC_WORKERS
                        value: '8'
                  volumeMounts:
                      - name: zero-cache-storage
                        mountPath: /data
            volumes:
                - name: zero-cache-storage
                  persistentVolumeClaim:
                      claimName: zero-cache-pvc
---
apiVersion: v1
kind: Service
metadata:
    name: zero-cache
spec:
    selector:
        app: zero-cache
    ports:
        - protocol: TCP
          port: 4848
          targetPort: 4848
    type: LoadBalancer
```

2. **Apply Kubernetes configuration**:

```bash
kubectl apply -f k8s/zero-cache-deployment.yaml
```

### Option C: Fly.io

1. **Create `fly.toml`**:

```toml
app = "hello-miami-zero-cache"
primary_region = "mia"

[build]
  image = "rocicorp/zero:latest"

[env]
  ZERO_REPLICA_FILE = "/data/zero.db"
  ZERO_QUERY_URL = "https://hellomiami.co/api/zero/query"
  ZERO_MUTATE_URL = "https://hellomiami.co/api/zero/mutate"
  ZERO_QUERY_FORWARD_COOKIES = "true"
  ZERO_MUTATE_FORWARD_COOKIES = "true"
  ZERO_NUM_SYNC_WORKERS = "4"

[mounts]
  source = "zero_cache_data"
  destination = "/data"

[[services]]
  internal_port = 4848
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

2. **Deploy to Fly.io**:

```bash
fly launch --config fly.toml
fly secrets set ZERO_UPSTREAM_DB="your-database-url"
fly secrets set ZERO_ADMIN_PASSWORD="your-admin-password"
fly deploy
```

## Step 4: Deploy Application

### Option A: Vercel (Recommended for SSR)

1. **Install Vercel CLI**:

```bash
pnpm add -g vercel
```

2. **Configure environment variables** in Vercel dashboard:

```env
# Database
DATABASE_URL=postgresql://user:password@hostname/hello_miami?sslmode=require

# Zero Sync
VITE_ZERO_CACHE_URL=https://sync.hellomiami.co
ZERO_UPSTREAM_DB=postgresql://user:password@hostname/hello_miami?sslmode=require
ZERO_ADMIN_PASSWORD=your-strong-password

# Authentication (Clerk)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# File Storage (Cloudinary)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# Event Integration (Luma)
LUMA_API_KEY=luma_sk_...
LUMA_WEBHOOK_SECRET=your-webhook-secret

# Email Notifications (Resend)
RESEND_API_KEY=re_...
```

3. **Deploy**:

```bash
vercel --prod
```

### Option B: Docker + VPS

1. **Create `Dockerfile`**:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/server/index.js"]
```

2. **Build and push Docker image**:

```bash
docker build -t hello-miami-app:latest .
docker tag hello-miami-app:latest your-registry/hello-miami-app:latest
docker push your-registry/hello-miami-app:latest
```

3. **Deploy to VPS**:

```bash
ssh your-server
docker pull your-registry/hello-miami-app:latest
docker run -d \
  --name hello-miami-app \
  -p 3000:3000 \
  --env-file .env.production \
  your-registry/hello-miami-app:latest
```

### Option C: Fly.io

1. **Create `fly.app.toml`**:

```toml
app = "hello-miami"
primary_region = "mia"

[build]
  [build.args]
    NODE_VERSION = "20"

[env]
  PORT = "3000"

[[services]]
  internal_port = 3000
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

2. **Deploy**:

```bash
fly launch --config fly.app.toml
fly secrets set DATABASE_URL="..."
fly secrets set CLERK_SECRET_KEY="..."
# ... set other secrets
fly deploy
```

## Step 5: Configure DNS and SSL

### Set up subdomain for zero-cache

Zero Sync requires cookie forwarding, which works best with a subdomain:

1. **Add DNS A record**:
    - Name: `sync`
    - Type: `A` or `CNAME`
    - Value: Your zero-cache server IP or hostname
    - TTL: `300`

2. **Set up SSL certificate** (Let's Encrypt via Certbot):

```bash
sudo certbot --nginx -d sync.hellomiami.co
```

3. **Configure nginx** to proxy to zero-cache:

```nginx
server {
    listen 443 ssl http2;
    server_name sync.hellomiami.co;

    ssl_certificate /etc/letsencrypt/live/sync.hellomiami.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sync.hellomiami.co/privkey.pem;

    location / {
        proxy_pass http://localhost:4848;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Cookie forwarding
        proxy_cookie_domain localhost $host;
        proxy_cookie_path / /;
    }
}
```

4. **Update application environment variables**:

```env
VITE_ZERO_CACHE_URL=https://sync.hellomiami.co
```

## Step 6: Set Up Monitoring and Alerts

### PostgreSQL Monitoring

1. **Enable pg_stat_statements**:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

2. **Monitor key metrics**:
    - Connection count
    - Query performance
    - Disk usage
    - Replication lag

3. **Set up alerts** (example with Grafana + Prometheus):
    - CPU > 80% for 5 minutes
    - Disk usage > 85%
    - Replication lag > 1MB
    - Connection count > 180

### Zero Cache Monitoring

1. **Access Zero Inspector**:
    - URL: `https://sync.hellomiami.co/inspector`
    - Password: Your `ZERO_ADMIN_PASSWORD`

2. **Monitor metrics**:
    - Active connections
    - Sync lag
    - Query performance
    - Error rate

3. **Set up alerts**:
    - Sync lag > 10 seconds
    - Error rate > 1%
    - Memory usage > 80%

### Application Monitoring

1. **Set up Sentry** for error tracking:

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1
});
```

2. **Set up logging** (example with Pino):

```typescript
import pino from 'pino';

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty'
    }
});

export default logger;
```

## Step 7: Post-Deployment Verification

Run through this checklist after deployment:

### Functionality Tests

- [ ] Visit homepage at `https://hellomiami.co`
- [ ] Test user authentication (sign up, sign in, sign out)
- [ ] Create a profile
- [ ] Upload a project with image
- [ ] Check realtime updates (open app in 2 browsers, make changes in one)
- [ ] Test offline mode (disconnect network, verify read-only access)
- [ ] Test event check-in
- [ ] Verify badge awards
- [ ] Test survey submission

### Performance Tests

- [ ] Run Lighthouse audit (target: Performance > 90)
- [ ] Test Time to First Byte (TTFB < 200ms)
- [ ] Verify realtime sync latency (< 1 second)
- [ ] Load test with 100 concurrent users

### Security Tests

- [ ] Verify HTTPS is enforced
- [ ] Test authentication flows
- [ ] Verify authorization (can't access other users' data)
- [ ] Check for exposed secrets in client bundle
- [ ] Test CORS configuration

### Monitoring Tests

- [ ] Verify Sentry is receiving errors
- [ ] Check PostgreSQL metrics in dashboard
- [ ] Access Zero Inspector
- [ ] Verify logs are being collected

## Rollback Procedure

If deployment issues occur:

1. **Application rollback**:

    ```bash
    vercel rollback  # For Vercel
    # OR
    docker-compose down && docker-compose up -d  # For Docker
    ```

2. **Database rollback**:

    ```bash
    psql $DATABASE_URL < backups/backup_YYYY-MM-DD.sql
    ```

3. **Monitor error rates** and verify rollback success

## Backup Strategy

### PostgreSQL Backups

1. **Automated daily backups**:

```bash
#!/bin/bash
# /root/scripts/backup-postgres.sh

BACKUP_DIR=/backups
DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="hello_miami_$DATE.sql.gz"

pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/$FILENAME

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $FILENAME"
```

2. **Add to crontab**:

```bash
0 2 * * * /root/scripts/backup-postgres.sh
```

### Zero Cache Backups

Zero cache uses ephemeral SQLite replica - no backups needed (syncs from PostgreSQL).

## Scaling Considerations

### Horizontal Scaling

1. **Application**: Deploy multiple instances behind load balancer
2. **zero-cache**: Deploy multiple instances (stateless)
3. **PostgreSQL**: Consider read replicas for read-heavy workloads

### Vertical Scaling

Start with:

- **PostgreSQL**: 2 vCPU, 4GB RAM, 20GB SSD
- **zero-cache**: 1 vCPU, 2GB RAM, 10GB SSD
- **Application**: 1 vCPU, 2GB RAM

Scale up based on metrics:

- CPU consistently > 70% → Add vCPUs
- Memory consistently > 80% → Add RAM
- Disk I/O wait times high → Upgrade to faster SSD

## Troubleshooting

### Issue: zero-cache can't connect to PostgreSQL

**Solution**:

1. Verify `ZERO_UPSTREAM_DB` is correct
2. Check PostgreSQL is accepting connections:
    ```bash
    psql $DATABASE_URL -c "SELECT 1"
    ```
3. Verify firewall rules allow connection on port 5432

### Issue: Clients can't sync with zero-cache

**Solution**:

1. Check `VITE_ZERO_CACHE_URL` is set correctly
2. Verify zero-cache is accessible:
    ```bash
    curl https://sync.hellomiami.co/health
    ```
3. Check browser console for WebSocket errors
4. Verify cookie domain settings (must be same parent domain)

### Issue: High PostgreSQL CPU usage

**Solution**:

1. Check slow queries:
    ```sql
    SELECT query, calls, total_time, mean_time
    FROM pg_stat_statements
    ORDER BY total_time DESC
    LIMIT 10;
    ```
2. Add missing indexes
3. Consider read replicas
4. Optimize queries

### Issue: zero-cache sync lag increasing

**Solution**:

1. Check Zero Inspector for bottlenecks
2. Increase `ZERO_NUM_SYNC_WORKERS`
3. Scale zero-cache vertically (more RAM/CPU)
4. Check PostgreSQL replication slot lag

## Cost Estimation (Monthly)

### Option A: Managed Services (Neon + Fly.io)

- **Neon PostgreSQL**: $19-50/month (Pro plan)
- **Fly.io zero-cache**: $5-15/month (shared-cpu-1x)
- **Vercel**: $20/month (Pro plan)
- **Total**: ~$45-85/month

### Option B: Self-Hosted (DigitalOcean/Hetzner)

- **VPS (4GB RAM, 2 vCPU)**: $24/month
- **PostgreSQL (managed)**: $15/month
- **Total**: ~$40/month

### Option C: AWS/GCP/Azure (Enterprise)

- **RDS PostgreSQL (db.t3.small)**: $50/month
- **ECS/Cloud Run**: $30/month
- **Total**: ~$80-150/month

## Support and Resources

- **Zero Sync Docs**: https://zero.rocicorp.dev/docs
- **Drizzle ORM**: https://orm.drizzle.team/
- **Clerk Auth**: https://clerk.com/docs
- **React Router**: https://reactrouter.com/

## Next Steps

After successful deployment:

1. [ ] Set up automated database backups
2. [ ] Configure monitoring dashboards
3. [ ] Set up CI/CD pipeline for automated deployments
4. [ ] Enable PostgreSQL query performance insights
5. [ ] Configure CDN for static assets
6. [ ] Set up log aggregation (e.g., Datadog, Logtail)
7. [ ] Create runbook for common operational tasks
8. [ ] Schedule regular load testing
