# VPS Deployment Guide

## 📋 Prerequisites

- Ubuntu 20.04+ VPS
- Root/sudo access
- Domain name pointed to your VPS IP
- MySQL 8.0 (will be installed automatically)

---

## 🚀 One-Command Deployment

SSH into your VPS and run:

```bash
# 1. Clone repository
git clone https://github.com/Phakamas1715/anti-rigging-war-room.git
cd anti-rigging-war-room

# 2. Run deployment script
sudo ./deploy-vps.sh
```

The script will automatically:
- ✅ Install Node.js 20, pnpm, PM2
- ✅ Install MySQL 8.0 and Nginx
- ✅ Setup database and run migrations
- ✅ Build and start application
- ✅ Configure SSL certificate (Let's Encrypt)
- ✅ Setup firewall
- ✅ Configure auto-restart

---

## 🔧 Manual Deployment Steps

If you prefer manual control:

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Install PM2
sudo npm install -g pm2

# Install MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Install Nginx
sudo apt install -y nginx
```

### 2. Setup Application

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/Phakamas1715/anti-rigging-war-room.git
cd anti-rigging-war-room

# Install dependencies
pnpm install --frozen-lockfile

# Create .env file
sudo nano .env
```

Copy from `.env.example` and update with production values:
```env
DATABASE_URL="mysql://anti_rigging:YOUR_PASSWORD@localhost:3306/anti_rigging"
OAUTH_SERVER_URL="https://your-oauth-server.com"
VITE_APP_ID="your-prod-app-id"
JWT_SECRET="$(openssl rand -base64 32)"
BUILT_IN_FORGE_API_URL="https://your-storage-api.com"
BUILT_IN_FORGE_API_KEY="your-storage-key"
NODE_ENV="production"
```

### 3. Setup Database

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE anti_rigging;
CREATE USER 'anti_rigging'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON anti_rigging.* TO 'anti_rigging'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Run migrations:
```bash
pnpm db:push
```

### 4. Build Application

```bash
pnpm build
```

### 5. Start with PM2

```bash
# Start application
pm2 start dist/index.js --name anti-rigging-war-room

# Save PM2 config
pm2 save

# Setup startup script
pm2 startup systemd
```

### 6. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/anti-rigging-war-room
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

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
        
        # Timeouts for uploads
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
    }

    client_max_body_size 50M;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/anti-rigging-war-room /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Setup SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 8. Configure Firewall

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## 🔄 Updating Application

After pushing new code to GitHub:

```bash
cd /var/www/anti-rigging-war-room
sudo ./update.sh
```

Or manually:
```bash
git pull origin main
pnpm install --frozen-lockfile
pnpm db:push
pnpm build
pm2 restart anti-rigging-war-room
```

---

## 💾 Database Backups

Setup automatic daily backups:

```bash
# Make backup script executable
chmod +x /var/www/anti-rigging-war-room/backup.sh

# Add to crontab (runs daily at 2 AM)
sudo crontab -e
```

Add this line:
```
0 2 * * * /var/www/anti-rigging-war-room/backup.sh
```

Manual backup:
```bash
sudo ./backup.sh
```

Restore from backup:
```bash
gunzip < /var/backups/anti-rigging/anti_rigging-20260210.sql.gz | mysql -u root -p anti_rigging
```

---

## 📊 Monitoring

### Check Application Status
```bash
pm2 status
pm2 logs anti-rigging-war-room
pm2 monit
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Check Database
```bash
mysql -u anti_rigging -p -e "SHOW TABLES;" anti_rigging
```

---

## 🆘 Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs anti-rigging-war-room --lines 100

# Restart
pm2 restart anti-rigging-war-room

# Check port
sudo lsof -i :3000
```

### Database Connection Error
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u anti_rigging -p anti_rigging

# Check DATABASE_URL in .env
cat /var/www/anti-rigging-war-room/.env | grep DATABASE_URL
```

### Nginx Errors
```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

---

## 🔐 Security Checklist

- [ ] Changed MySQL root password
- [ ] Strong database user password
- [ ] JWT_SECRET is 32+ characters
- [ ] Firewall enabled (ports 22, 80, 443 only)
- [ ] SSH key authentication (disable password login)
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Fail2ban installed: `sudo apt install fail2ban`
- [ ] Database backups scheduled
- [ ] SSL certificate auto-renewal working

---

## 📞 Support

If you encounter issues:
1. Check logs: `pm2 logs anti-rigging-war-room`
2. Review [DEBUG.md](DEBUG.md)
3. Create GitHub issue with error details

---

## 🎯 Performance Optimization

### Enable Nginx Caching
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### PM2 Cluster Mode
```bash
pm2 start dist/index.js -i max --name anti-rigging-war-room
```

### Database Optimization
```sql
# Add indexes
CREATE INDEX idx_volunteer_code ON volunteer_submissions(volunteerCode);
CREATE INDEX idx_station_created ON volunteer_submissions(stationId, createdAt);
```

---

**Your application will be live at:** `https://your-domain.com`

🎉 Deployment complete!
