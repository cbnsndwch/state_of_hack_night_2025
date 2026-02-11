# Deployment Checklist

Use this checklist to verify your production deployment is configured correctly.

## Pre-Deployment

### Environment Configuration

- [ ] Created `.env.production` from `.env.production.example`
- [ ] Set strong `ZERO_ADMIN_PASSWORD` (min 16 chars, alphanumeric + symbols)
- [ ] Set strong `POSTGRES_PASSWORD` (if self-hosting PostgreSQL)
- [ ] Configured production Clerk keys (`pk_live_*` and `sk_live_*`)
- [ ] Configured Cloudinary production account
- [ ] Configured Luma API key
- [ ] Configured Resend API key (optional)
- [ ] All environment variables validated (no test/development keys)

### Infrastructure

- [ ] PostgreSQL 16+ deployed and accessible
- [ ] PostgreSQL logical replication enabled (`wal_level=logical`)
- [ ] PostgreSQL connection string tested and working
- [ ] Database migrations applied (`pnpm drizzle-kit push`)
- [ ] Database tables verified (11 tables created)
- [ ] Initial badges seeded (optional: `pnpm seed:badges`)
- [ ] SSL/TLS certificates obtained (Let's Encrypt or similar)
- [ ] Domain DNS records configured (A/AAAA for app, CNAME for sync subdomain)

### Security

- [ ] Firewall rules configured (open only necessary ports)
- [ ] PostgreSQL access restricted to application servers only
- [ ] API keys rotated from development to production
- [ ] Secrets stored securely (not in version control)
- [ ] 2FA enabled on all service accounts (Clerk, Cloudinary, etc.)

---

## Zero Cache Deployment

### Container Setup

- [ ] Docker installed on server
- [ ] Docker Compose installed on server
- [ ] `docker-compose.prod.yml` configured
- [ ] Zero cache image pulled (`docker pull rocicorp/zero:latest`)

### Deployment

Run the deployment script:

```bash
./scripts/deploy-zero-cache.sh production
```

Or manually:

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d zero-cache
```

### Verification

- [ ] Container started successfully
- [ ] Container status is "healthy" (`docker ps`)
- [ ] Health endpoint responding (`curl http://localhost:4848/` returns "OK")
- [ ] Zero Inspector accessible (`http://localhost:4848/inspector`)
- [ ] Can login to Zero Inspector with admin password
- [ ] All 11 tables visible in Zero Inspector schema tab
- [ ] No errors in container logs (`docker logs hello_miami_zero_cache_prod`)

---

## Application Deployment

### Build

```bash
pnpm install
pnpm build
```

- [ ] Build completed without errors
- [ ] `build/` directory created with server and client assets
- [ ] TypeScript types generated without errors

### Deploy

- [ ] Application deployed to server/platform
- [ ] Environment variables configured on server
- [ ] Application started successfully
- [ ] Application accessible at production domain

### Reverse Proxy (Nginx/Traefik)

- [ ] Nginx/Traefik configured with SSL/TLS
- [ ] Main domain proxying to application (port 3000)
- [ ] Sync subdomain proxying to zero-cache (port 4848)
- [ ] WebSocket connections working (Upgrade header forwarded)
- [ ] Cookies forwarded correctly (for authentication)
- [ ] HTTPS redirects configured (HTTP → HTTPS)
- [ ] SSL certificates auto-renewal configured

---

## Post-Deployment Verification

### Application Health

- [ ] Application homepage loads (`https://your-domain.com`)
- [ ] Zero cache accessible via subdomain (`https://sync.your-domain.com`)
- [ ] Health check endpoint responding (`https://your-domain.com/health`)
- [ ] No JavaScript errors in browser console
- [ ] No network errors in browser dev tools

### Authentication (Clerk)

- [ ] Sign up flow works (GitHub OAuth)
- [ ] Sign in flow works
- [ ] Sign out works
- [ ] Protected routes redirect to sign in when unauthenticated
- [ ] User session persists across page refreshes

### Database Operations

- [ ] Profile created on first sign up
- [ ] Profile data syncs to client in realtime
- [ ] Can edit profile information
- [ ] Changes persist after page refresh

### Zero Sync Features

- [ ] Client connects to zero-cache successfully
- [ ] Data syncs from PostgreSQL to client
- [ ] Client shows "Live" connection status indicator
- [ ] Mutations work (create/update/delete)
- [ ] Changes reflect in realtime across multiple browser tabs
- [ ] Offline mode works (data readable when disconnected)
- [ ] Changes sync when reconnected after offline

### File Storage (Cloudinary)

- [ ] Can upload project images
- [ ] Images display correctly
- [ ] Image URLs are publicly accessible
- [ ] Proper transformations applied (if configured)

### Event Integration (Luma)

- [ ] Events sync from Luma to database
- [ ] Events display on `/events` page
- [ ] Can check in to events (during event hours)
- [ ] Check-ins recorded in database
- [ ] Badges awarded on check-in (if eligible)

### Projects

- [ ] Can create project
- [ ] Can upload project image
- [ ] Project displays on showcase page (`/showcase`)
- [ ] Can view individual project page (`/showcase/:id`)
- [ ] Can filter projects by tags
- [ ] Can search projects

### Badges

- [ ] Badges display on dashboard
- [ ] Badge icons render correctly
- [ ] Badge criteria visible
- [ ] Toast notification shows when badge earned

---

## Monitoring & Observability

### Health Checks

Set up health check monitoring:

- [ ] Application health check endpoint monitored
- [ ] Zero cache health check endpoint monitored
- [ ] PostgreSQL connection monitored
- [ ] Uptime monitoring configured (UptimeRobot, BetterStack, etc.)

### Logging

- [ ] Application logs aggregated (Papertrail, Logtail, etc.)
- [ ] Zero cache logs aggregated
- [ ] PostgreSQL logs accessible
- [ ] Error tracking configured (Sentry, etc.)

### Alerts

Configure alerts for:

- [ ] Application downtime (> 1 minute)
- [ ] Zero cache downtime (> 1 minute)
- [ ] PostgreSQL downtime
- [ ] High error rate (> 5% of requests)
- [ ] High response time (> 1 second p95)
- [ ] PostgreSQL replication lag (> 5 seconds)
- [ ] High memory usage (> 90%)
- [ ] Low disk space (< 10% free)

### Metrics

- [ ] Zero Inspector dashboard accessible
- [ ] Database query performance monitored
- [ ] Client sync performance monitored
- [ ] Application performance monitored (APM tool)

---

## Backup & Recovery

### Database Backups

- [ ] Automated PostgreSQL backups configured
- [ ] Backup schedule: daily minimum
- [ ] Backup retention: 7-30 days
- [ ] Point-in-time recovery enabled
- [ ] Backup restoration tested

### Data Recovery

- [ ] Backup restoration procedure documented
- [ ] Backup restoration tested on staging
- [ ] Zero cache data volume backed up
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined

---

## Performance

### Load Testing

- [ ] Load test with expected concurrent users
- [ ] API response times acceptable (< 500ms p95)
- [ ] Zero sync latency acceptable (< 100ms p95)
- [ ] Database query performance optimized
- [ ] No memory leaks detected

### Optimization

- [ ] Database indexes created for slow queries
- [ ] Static assets cached (CDN or edge caching)
- [ ] Images optimized (WebP, responsive sizes)
- [ ] JavaScript bundle size optimized
- [ ] CSS bundle size optimized

---

## Documentation

- [ ] Deployment procedure documented
- [ ] Environment variables documented
- [ ] Architecture diagram created
- [ ] Runbook created for common issues
- [ ] On-call rotation defined
- [ ] Incident response procedure documented

---

## Sign-Off

### Stakeholder Approval

- [ ] Technical lead approved
- [ ] Product owner approved
- [ ] Security team approved (if applicable)
- [ ] DevOps team approved (if applicable)

### Go-Live

- [ ] Deployment window scheduled
- [ ] Stakeholders notified
- [ ] Rollback plan ready
- [ ] Support team briefed
- [ ] Communication plan ready (status page, social media, etc.)

---

## Post-Go-Live

### First 24 Hours

- [ ] Monitor error rates closely
- [ ] Monitor performance metrics
- [ ] Monitor user feedback
- [ ] Address critical issues immediately
- [ ] Communicate status to stakeholders

### First Week

- [ ] Review error logs daily
- [ ] Optimize slow queries
- [ ] Fine-tune performance
- [ ] Gather user feedback
- [ ] Plan fixes for non-critical issues

### First Month

- [ ] Review and optimize costs
- [ ] Analyze user behavior
- [ ] Plan feature improvements
- [ ] Conduct post-mortem (if issues occurred)
- [ ] Update documentation based on learnings

---

## Rollback Procedure

If critical issues arise:

1. **Stop accepting new traffic**

    ```bash
    # Update DNS to point to old version, or
    # Update load balancer to route to old version
    ```

2. **Communicate the issue**
    - Update status page
    - Notify stakeholders
    - Post on social media (if public-facing)

3. **Revert to previous version**

    ```bash
    # Option 1: Revert container to previous image
    docker-compose -f docker-compose.prod.yml down
    docker tag hello-miami-app:previous hello-miami-app:latest
    docker-compose -f docker-compose.prod.yml up -d

    # Option 2: Restore from backup
    # Follow backup restoration procedure
    ```

4. **Verify rollback**
    - Test critical user flows
    - Verify data integrity
    - Check error rates

5. **Post-mortem**
    - Document what went wrong
    - Identify root cause
    - Create action items to prevent recurrence

---

## Support

For issues during deployment:

- **Zero Sync**: [Zero Docs](https://zero.rocicorp.dev/docs) | [GitHub Issues](https://github.com/rocicorp/zero/issues)
- **React Router**: [Docs](https://reactrouter.com/docs) | [Discord](https://rmx.as/discord)
- **Clerk**: [Docs](https://clerk.com/docs) | [Support](https://clerk.com/support)
- **Project Issues**: [GitHub Issues](../../issues)

---

## Next Steps After Successful Deployment

1. **Monitor** application health and performance
2. **Gather** user feedback and analytics
3. **Optimize** based on real-world usage patterns
4. **Plan** next features and improvements
5. **Document** lessons learned
6. **Celebrate** the successful launch! 🎉
