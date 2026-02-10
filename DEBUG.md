# 🐛 Debug & Deployment Checklist

## ✅ Pre-Deployment Checklist

### Code Quality
- [x] TypeScript compilation passes (`pnpm check`)
- [x] All tests passing (85/85 tests)
- [x] Production build successful
- [x] No console errors in production build

### Security
- [ ] Changed default passwords in `.env`
- [ ] JWT_SECRET is min 32 characters
- [ ] OAuth credentials configured for production
- [ ] Database credentials are secure
- [ ] Storage API keys are production keys
- [ ] CORS configured correctly
- [ ] Rate limiting enabled

### Database
- [ ] Database migrations applied (`pnpm db:push`)
- [ ] Database backup strategy in place
- [ ] Connection pooling configured
- [ ] Indexes optimized

### Environment Variables
- [ ] All required env vars set in production
- [ ] `.env.example` updated with all variables
- [ ] No sensitive data in git
- [ ] Environment-specific configs separated

### Docker
- [x] Dockerfile created
- [x] .dockerignore configured
- [ ] Docker image builds successfully
- [ ] Docker container runs without errors
- [ ] Health checks configured

### CI/CD
- [x] GitHub Actions workflow created
- [ ] CI pipeline passes
- [ ] Automated tests run on PR
- [ ] Build artifacts generated

---

## 🔍 Debug Guide

### Common Issues & Solutions

#### 1. TypeScript Errors
**Issue:** `error TS2802: Type 'MapIterator' can only be iterated...`
**Solution:** ✅ Fixed - Use `Array.from()` for Map iterations

**Issue:** `error TS2769: No overload matches this call` (volunteerId)
**Solution:** ✅ Fixed - Check nullable volunteerId before update

#### 2. Build Errors
**Issue:** Client bundle too large (1.3 MB)
**Solution:** Consider code splitting:
```javascript
// Use dynamic imports
const Component = lazy(() => import('./Component'));
```

#### 3. Database Connection
**Issue:** `ECONNREFUSED` to MySQL
**Solution:**
```bash
# Check MySQL is running
docker ps | grep mysql

# Start MySQL
docker-compose up -d mysql

# Test connection
mysql -u root -p -h localhost
```

#### 4. OAuth/Authentication
**Issue:** Redirect loop or "Not authenticated"
**Solution:**
- Verify `OAUTH_SERVER_URL` matches your OAuth provider
- Check JWT_SECRET is set
- Ensure cookies are enabled
- Check CORS settings

#### 5. Docker Build
**Issue:** `ENOENT: no such file or directory, open '/app/patches/wouter@3.7.1.patch'`
**Solution:** ✅ Fixed - Copy patches folder in Dockerfile

---

## 🚀 Deployment Steps

### 1. Local Testing
```bash
# Clean build
rm -rf dist node_modules
pnpm install
pnpm check
pnpm test
pnpm build

# Test production build locally
NODE_ENV=production node dist/index.js
```

### 2. Docker Testing
```bash
# Build image
docker build -t anti-rigging-war-room:test .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://..." \
  -e JWT_SECRET="..." \
  anti-rigging-war-room:test

# Test health
curl http://localhost:3000/api/health
```

### 3. Database Migration
```bash
# Backup current database
mysqldump -u root -p anti_rigging > backup_$(date +%Y%m%d).sql

# Apply migrations
pnpm db:push

# Verify schema
mysql -u root -p anti_rigging -e "SHOW TABLES;"
```

### 4. Deploy to Production
See [DEPLOYMENT.md](./DEPLOYMENT.md) for full guide.

---

## 📊 Monitoring & Logs

### Application Logs
```bash
# PM2
pm2 logs anti-rigging-war-room

# Docker
docker-compose logs -f app

# Live monitoring
pm2 monit
```

### Database Logs
```bash
# MySQL error log
docker exec anti-rigging-mysql tail -f /var/log/mysql/error.log

# Query log (if enabled)
docker exec anti-rigging-mysql tail -f /var/log/mysql/query.log
```

### Performance Monitoring
```bash
# Server metrics
curl http://localhost:3000/api/health

# Database connections
mysql -u root -p -e "SHOW PROCESSLIST;"

# Memory usage
docker stats anti-rigging-app
```

---

## 🔧 Troubleshooting Commands

### Application Issues
```bash
# Restart application
pm2 restart anti-rigging-war-room
# OR
docker-compose restart app

# Clear cache
pnpm store prune
rm -rf node_modules dist
pnpm install

# Check port usage
lsof -i :3000
```

### Database Issues
```bash
# Reset database (⚠️ DESTRUCTIVE)
mysql -u root -p -e "DROP DATABASE anti_rigging;"
mysql -u root -p -e "CREATE DATABASE anti_rigging;"
pnpm db:push

# Check database size
mysql -u root -p -e "SELECT table_schema AS 'Database', 
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' 
  FROM information_schema.tables 
  WHERE table_schema = 'anti_rigging';"

# Optimize tables
mysql -u root -p anti_rigging -e "OPTIMIZE TABLE volunteer_submissions;"
```

### Network Issues
```bash
# Test connectivity
ping your-domain.com
curl -I https://your-domain.com

# Check DNS
nslookup your-domain.com
dig your-domain.com

# Test SSL
openssl s_client -connect your-domain.com:443
```

---

## 📈 Performance Optimization

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_volunteer_code ON volunteer_submissions(volunteerCode);
CREATE INDEX idx_station_id ON volunteer_submissions(stationId);
CREATE INDEX idx_created_at ON volunteer_submissions(createdAt);

-- Analyze query performance
EXPLAIN SELECT * FROM volunteer_submissions WHERE volunteerCode = 'ABC123';
```

### Application Optimization
```javascript
// Enable compression
import compression from 'compression';
app.use(compression());

// Cache static assets
app.use(express.static('public', { maxAge: '1y' }));
```

### CDN Setup (Optional)
- Upload static assets to CDN
- Update asset URLs in production
- Configure cache headers

---

## 🆘 Emergency Procedures

### Application Down
1. Check server status: `systemctl status anti-rigging` or `docker ps`
2. Check logs: `pm2 logs` or `docker logs anti-rigging-app`
3. Restart: `pm2 restart all` or `docker-compose restart`
4. If persistent, rollback: `git checkout <previous-commit> && pnpm build`

### Database Corruption
1. Stop application
2. Restore from backup: `mysql -u root -p anti_rigging < backup.sql`
3. Restart application

### Security Breach
1. Rotate all secrets (JWT_SECRET, API keys)
2. Force logout all users
3. Review logs for suspicious activity
4. Update dependencies: `pnpm update`
5. Deploy hotfix

---

## ✅ Final Checklist Before Go-Live

- [ ] All tests passing
- [ ] Production build successful
- [ ] Docker image builds
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Backup strategy in place
- [ ] Monitoring set up
- [ ] SSL/HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Error tracking configured (Sentry/etc)
- [ ] Load testing completed
- [ ] Documentation updated
- [ ] Team trained on deployment process
- [ ] Rollback plan ready

---

## 📞 Support Contacts

- **Technical Issues:** Create GitHub issue
- **Security Issues:** Email security@example.com
- **Emergency:** On-call rotation (set up PagerDuty)

---

**Last Updated:** 2026-02-10
**Version:** 1.0.0
