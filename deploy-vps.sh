#!/bin/bash
# Anti-Rigging War Room - VPS Deployment Script
# Run this script on your VPS after cloning the repository

set -e

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root (use sudo)${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Running as root"

# 1. Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# 2. Install Node.js 20
echo -e "${YELLOW}Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 3. Install pnpm
echo -e "${YELLOW}Installing pnpm...${NC}"
npm install -g pnpm

# 4. Install PM2
echo -e "${YELLOW}Installing PM2...${NC}"
npm install -g pm2

# 5. Install MySQL 8.0 (if not installed)
echo -e "${YELLOW}Checking MySQL installation...${NC}"
if ! command -v mysql &> /dev/null; then
    echo "Installing MySQL 8.0..."
    apt-get install -y mysql-server
    
    # Secure MySQL installation
    mysql_secure_installation
else
    echo -e "${GREEN}✓${NC} MySQL already installed"
fi

# 6. Install Nginx
echo -e "${YELLOW}Installing Nginx...${NC}"
apt-get install -y nginx

# 7. Setup application directory
APP_DIR="/var/www/anti-rigging-war-room"
echo -e "${YELLOW}Setting up application directory: ${APP_DIR}${NC}"

# Create app user if doesn't exist
if ! id "appuser" &>/dev/null; then
    useradd -m -s /bin/bash appuser
    echo -e "${GREEN}✓${NC} Created appuser"
fi

# 8. Clone repository (if not already cloned)
if [ ! -d "$APP_DIR" ]; then
    echo -e "${YELLOW}Cloning repository...${NC}"
    mkdir -p /var/www
    cd /var/www
    
    # Replace with your actual repo URL
    read -p "Enter GitHub repository URL: " REPO_URL
    git clone "$REPO_URL" anti-rigging-war-room
    cd anti-rigging-war-room
else
    echo -e "${GREEN}✓${NC} Application directory exists"
    cd "$APP_DIR"
    git pull origin main
fi

# 9. Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pnpm install --frozen-lockfile

# 10. Setup environment file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << 'EOL'
# Database
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/anti_rigging"

# OAuth
OAUTH_SERVER_URL="https://your-oauth-server.com"
VITE_OAUTH_PORTAL_URL="https://your-oauth-portal.com"
VITE_APP_ID="your-prod-app-id"

# Security
JWT_SECRET="$(openssl rand -base64 32)"

# Storage
BUILT_IN_FORGE_API_URL="https://your-storage-api.com"
BUILT_IN_FORGE_API_KEY="your-storage-key"

# Environment
NODE_ENV="production"
PORT="3000"
EOL
    
    echo -e "${RED}⚠️  IMPORTANT: Edit .env file with your production values!${NC}"
    echo "Run: nano $APP_DIR/.env"
    read -p "Press Enter after editing .env file..."
fi

# 11. Create MySQL database
echo -e "${YELLOW}Setting up database...${NC}"
read -sp "Enter MySQL root password: " MYSQL_PASSWORD
echo

mysql -u root -p"$MYSQL_PASSWORD" << 'EOF'
CREATE DATABASE IF NOT EXISTS anti_rigging;
CREATE USER IF NOT EXISTS 'anti_rigging'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON anti_rigging.* TO 'anti_rigging'@'localhost';
FLUSH PRIVILEGES;
EOF

echo -e "${GREEN}✓${NC} Database created"

# 12. Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
pnpm db:push

# 13. Build application
echo -e "${YELLOW}Building application...${NC}"
pnpm build

# 14. Set permissions
chown -R appuser:appuser "$APP_DIR"
echo -e "${GREEN}✓${NC} Permissions set"

# 15. Setup PM2
echo -e "${YELLOW}Setting up PM2...${NC}"
sudo -u appuser pm2 start "$APP_DIR/dist/index.js" --name anti-rigging-war-room
sudo -u appuser pm2 save
pm2 startup systemd -u appuser --hp /home/appuser
echo -e "${GREEN}✓${NC} PM2 configured"

# 16. Setup Nginx
echo -e "${YELLOW}Configuring Nginx...${NC}"
read -p "Enter your domain name (e.g., example.com): " DOMAIN

cat > /etc/nginx/sites-available/anti-rigging-war-room << EOL
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase timeouts for large uploads
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    client_max_body_size 50M;
}
EOL

ln -sf /etc/nginx/sites-available/anti-rigging-war-room /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
echo -e "${GREEN}✓${NC} Nginx configured"

# 17. Setup SSL with Let's Encrypt
echo -e "${YELLOW}Setting up SSL...${NC}"
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN"
echo -e "${GREEN}✓${NC} SSL configured"

# 18. Setup firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable
echo -e "${GREEN}✓${NC} Firewall configured"

# 19. Setup automatic renewal for SSL
systemctl enable certbot.timer
systemctl start certbot.timer

# 20. Final checks
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Deployment Complete! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Application URL: https://$DOMAIN"
echo "PM2 Status: pm2 status"
echo "PM2 Logs: pm2 logs anti-rigging-war-room"
echo "Nginx Status: systemctl status nginx"
echo ""
echo "Next steps:"
echo "1. Test the application: https://$DOMAIN"
echo "2. Setup database backups"
echo "3. Configure monitoring"
echo ""
echo -e "${YELLOW}Important commands:${NC}"
echo "- Restart app: pm2 restart anti-rigging-war-room"
echo "- View logs: pm2 logs"
echo "- Update app: cd $APP_DIR && git pull && pnpm install && pnpm build && pm2 restart all"
echo ""
