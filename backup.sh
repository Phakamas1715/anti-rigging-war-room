#!/bin/bash
# Database backup script
# Add to crontab: 0 2 * * * /var/www/anti-rigging-war-room/backup.sh

BACKUP_DIR="/var/backups/anti-rigging"
DB_NAME="anti_rigging"
DB_USER="root"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
echo "Creating backup: $DB_NAME-$DATE.sql.gz"
mysqldump -u "$DB_USER" -p "$DB_NAME" | gzip > "$BACKUP_DIR/$DB_NAME-$DATE.sql.gz"

# Remove old backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "✓ Backup complete: $BACKUP_DIR/$DB_NAME-$DATE.sql.gz"
