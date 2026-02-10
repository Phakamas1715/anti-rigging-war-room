# Deployment Guide - Anti-Rigging War Room

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended)

#### 1. Clone Repository
```bash
git clone https://github.com/Phakamas1715/anti-rigging-war-room.git
cd anti-rigging-war-room
```

#### 2. Configure Environment
Create `.env` file:
```env
# Database
DATABASE_URL="mysql://root:YOUR_PASSWORD@mysql:3306/anti_rigging"

# OAuth (Manus Platform)
OAUTH_SERVER_URL="https://your-oauth-server.com"
VITE_OAUTH_PORTAL_URL="https://your-oauth-portal.com"
VITE_APP_ID="your-prod-app-id"
JWT_SECRET="your-secure-jwt-secret-min-32-chars"

# Storage
BUILT_IN_FORGE_API_URL="https://your-storage-api.com"
BUILT_IN_FORGE_API_KEY="your-storage-api-key"

# Optional - Notifications
LINE_NOTIFY_TOKEN="your-line-token"
DISCORD_WEBHOOK_URL="your-discord-webhook"

# AI/OCR (Optional)
GEMINI_API_KEY="your-gemini-api-key"
DEEPSEEK_API_KEY="your-deepseek-api-key"
```

#### 3. Update docker-compose.yml
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: anti-rigging-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: anti_rigging
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - app-network
    restart: unless-stopped

  app:
    build: .
    container_name: anti-rigging-app
    depends_on:
      - mysql
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - OAUTH_SERVER_URL=${OAUTH_SERVER_URL}
      - VITE_APP_ID=${VITE_APP_ID}
      - JWT_SECRET=${JWT_SECRET}
      - BUILT_IN_FORGE_API_URL=${BUILT_IN_FORGE_API_URL}
      - BUILT_IN_FORGE_API_KEY=${BUILT_IN_FORGE_API_KEY}
    ports:
      - "3000:3000"
    networks:
      - app-network
    restart: unless-stopped

volumes:
  mysql_data:

networks:
  app-network:
```

#### 4. Deploy
```bash
# Build and start
docker-compose up -d

# Check logs
docker-compose logs -f app

# Access: http://localhost:3000
```

---

### Option 2: Traditional VPS/Server

#### 1. Prerequisites
- Node.js 20+
- MySQL 8.0+
- pnpm 8+
- Nginx (reverse proxy)

#### 2. Setup Application
```bash
# Clone and install
git clone https://github.com/Phakamas1715/anti-rigging-war-room.git
cd anti-rigging-war-room
pnpm install --frozen-lockfile

# Configure .env (see above)

# Build
pnpm build

# Run database migrations
pnpm db:push
```

#### 3. Setup PM2
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/index.js --name anti-rigging-war-room

# Save PM2 config
pm2 save
pm2 startup
```

#### 4. Configure Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 5. Setup SSL (Let's Encrypt)
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Option 3: Cloud Platforms

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

#### Render
1. Connect GitHub repository
2. Create new Web Service
3. Build Command: `pnpm build`
4. Start Command: `pnpm start`
5. Add environment variables in dashboard

#### Vercel (Frontend + Serverless)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

---

## 🔒 Security Checklist

- [ ] Change default passwords
- [ ] Use strong JWT_SECRET (min 32 chars)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS appropriately
- [ ] Set secure cookie options in production
- [ ] Use environment-specific API keys
- [ ] Enable database backups
- [ ] Configure rate limiting
- [ ] Setup monitoring/logging
- [ ] Regular security updates

---

## 📊 Monitoring

### Health Check Endpoint
```bash
curl http://your-domain.com/api/health
```

### PM2 Monitoring
```bash
pm2 monit
pm2 logs anti-rigging-war-room
```

### Database Backup
```bash
# MySQL backup
mysqldump -u root -p anti_rigging > backup_$(date +%Y%m%d).sql

# Restore
mysql -u root -p anti_rigging < backup_20260210.sql
```

---

## 🔄 Updates

```bash
# Pull latest code
git pull origin main

# Install dependencies
pnpm install --frozen-lockfile

# Build
pnpm build

# Run migrations
pnpm db:push

# Restart
pm2 restart anti-rigging-war-room
# OR
docker-compose restart app
```

---

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
docker ps | grep mysql
# OR
systemctl status mysql

# Test connection
mysql -u root -p -h localhost
```

### Application Won't Start
```bash
# Check logs
docker-compose logs app
# OR
pm2 logs anti-rigging-war-room

# Check port availability
lsof -i :3000
```

### Build Failures
```bash
# Clear cache and rebuild
pnpm store prune
rm -rf node_modules dist
pnpm install
pnpm build
```

---

## 📞 Support

- GitHub Issues: https://github.com/Phakamas1715/anti-rigging-war-room/issues
- Documentation: See `/docs` folder
