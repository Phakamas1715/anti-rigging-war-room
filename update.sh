#!/bin/bash
# Quick update script - Run this when you push new code
# Usage: ./update.sh

set -e

APP_DIR="/var/www/anti-rigging-war-room"

echo "🔄 Updating Anti-Rigging War Room..."

cd "$APP_DIR"

# Pull latest code
echo "→ Pulling latest code..."
git pull origin main

# Install dependencies
echo "→ Installing dependencies..."
pnpm install --frozen-lockfile

# Run migrations
echo "→ Running database migrations..."
pnpm db:push

# Build
echo "→ Building application..."
pnpm build

# Restart PM2
echo "→ Restarting application..."
pm2 restart anti-rigging-war-room

echo "✓ Update complete!"
echo ""
echo "Status: pm2 status"
echo "Logs: pm2 logs anti-rigging-war-room"
