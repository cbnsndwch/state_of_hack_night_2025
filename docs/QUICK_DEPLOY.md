# Quick Deployment Guide

This guide helps you deploy Hello Miami application with Zero Sync to production in minutes.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL 16+ database (Neon, Supabase, or self-hosted)
- Domain with SSL certificates
- API keys for Clerk, Cloudinary, and Luma

## Step 1: Clone and Setup

```bash
git clone <repository-url>
cd state-of-the-hack-night-2025
```

## Step 2: Configure Environment

Create `.env.production` from the example:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and fill in your values:

```bash
# Required: Database
DATABASE_URL=postgresql://user:password@your-host:5432/hello_miami
ZERO_UPSTREAM_DB=postgresql://user:password@your-host:5432/hello_miami

# Required: Zero Sync
VITE_ZERO_CACHE_URL=https://sync.yourdomain.com
ZERO_ADMIN_PASSWORD=$(openssl rand -base64 32)
ZERO_QUERY_URL=https://yourdomain.com/api/zero/query
ZERO_MUTATE_URL=https://yourdomain.com/api/zero/mutate

# Required: Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Required: Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset

# Required: Luma
LUMA_API_KEY=your-luma-key

# Optional: Resend
RESEND_API_KEY=re_...
```

## Step 3: Deploy

Run the deployment script:

```bash
./scripts/deploy-production.sh production
```

This will:

1. ✅ Validate environment variables
2. ✅ Check database connectivity
3. ✅ Run database migrations
4. ✅ Build application Docker image
5. ✅ Start Zero Cache container
6. ✅ Start Application container
7. ✅ Verify health checks

## Step 4: Configure Reverse Proxy

### Nginx Example

```nginx
# Main application
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Zero Cache (sync subdomain)
server {
    listen 443 ssl http2;
    server_name sync.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/sync.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sync.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4848;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_pass_request_headers on;
        proxy_set_header Cookie $http_cookie;
    }
}
```

Reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 5: Verify Deployment

Check all services are running:

```bash
docker ps
```

Expected output:

```
CONTAINER ID   NAME                          STATUS
xxx            hello_miami_app_prod          Up (healthy)
yyy            hello_miami_zero_cache_prod   Up (healthy)
```

Test endpoints:

```bash
# Application health
curl https://yourdomain.com/health

# Zero cache health
curl https://sync.yourdomain.com/

# Zero Inspector (requires admin password)
open https://sync.yourdomain.com/inspector
```

## Step 6: Test Application

1. **Visit your application**: `https://yourdomain.com`
2. **Sign in with GitHub**: Test authentication flow
3. **Create profile**: Complete onboarding
4. **Add project**: Test file upload
5. **Check realtime sync**: Open two browser tabs, verify changes sync

## Monitoring

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Application only
docker logs hello_miami_app_prod -f

# Zero cache only
docker logs hello_miami_zero_cache_prod -f
```

### View Stats

```bash
docker stats
```

### Zero Inspector

Access the Zero Inspector at `https://sync.yourdomain.com/inspector` to monitor:

- Connected clients
- Sync status
- Schema replication
- Query performance

## Troubleshooting

### Application won't start

```bash
# Check logs
docker logs hello_miami_app_prod --tail 100

# Common issues:
# - Missing environment variable
# - Cannot connect to database
# - Cannot reach zero-cache
```

### Zero cache won't start

```bash
# Check logs
docker logs hello_miami_zero_cache_prod --tail 100

# Common issues:
# - PostgreSQL logical replication not enabled
# - Cannot connect to PostgreSQL
# - Cannot reach application API endpoints
```

### Clients not syncing

1. Open browser DevTools → Network tab
2. Check for WebSocket connection to sync subdomain
3. Verify no CORS errors
4. Check Zero Inspector for connected clients

## Useful Commands

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Rebuild application
docker-compose -f docker-compose.prod.yml build app
docker-compose -f docker-compose.prod.yml up -d app

# View service status
docker-compose -f docker-compose.prod.yml ps

# Clean up old images
docker system prune -a
```

## Backup & Recovery

### Database Backup

```bash
# Backup PostgreSQL
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20260211.sql
```

### Zero Cache Data

```bash
# Backup zero-cache data volume
docker run --rm -v hello_miami_zero_cache_data_prod:/data -v $(pwd):/backup \
  alpine tar czf /backup/zero-cache-backup-$(date +%Y%m%d).tar.gz /data

# Restore
docker run --rm -v hello_miami_zero_cache_data_prod:/data -v $(pwd):/backup \
  alpine tar xzf /backup/zero-cache-backup-20260211.tar.gz -C /
```

## Scaling

### Single Server (Current Setup)

- Capacity: ~1,000 concurrent users
- Cost: ~$50-100/month

### Multi-Server (Future)

For higher scale:

1. Deploy multiple zero-cache containers
2. Add load balancer (HAProxy, Nginx)
3. Use managed PostgreSQL with read replicas
4. Add Redis for session management

See [DEPLOYMENT.md](DEPLOYMENT.md#scaling-considerations) for details.

## Support

- **Documentation**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Checklist**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **Zero Sync**: https://zero.rocicorp.dev/docs
- **Issues**: GitHub Issues

## Next Steps After Deployment

1. ✅ Set up monitoring (UptimeRobot, BetterStack)
2. ✅ Configure alerts (Sentry, PagerDuty)
3. ✅ Set up automated backups
4. ✅ Configure CDN for static assets
5. ✅ Set up log aggregation (Papertrail, Logtail)
6. ✅ Load test with expected traffic
7. ✅ Document incident response procedures

---

**Deployment Complete!** 🎉

Your Hello Miami application is now live with realtime sync powered by Zero.
