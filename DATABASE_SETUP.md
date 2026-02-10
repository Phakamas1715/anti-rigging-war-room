# Database Setup Guide

## Quick Start (Docker)

If you don't have MySQL installed locally, use Docker Compose:

```bash
# Start MySQL container
docker-compose up -d

# Verify it's running
docker ps | grep mysql

# Run migrations to create database schema
pnpm db:push

# Test the connection
pnpm db:check
```

The MySQL container will:
- Run on `localhost:3306`
- Create database `anti_rigging`
- Root user: `root` / `password`
- Default user: `dev` / `devpass`
- Persist data in `mysql_data` volume

## Manual Setup (Linux/Mac with system MySQL)

```bash
# 1. Start MySQL if not running
sudo systemctl start mysql

# 2. Create database and user
mysql -p root -e "
  CREATE DATABASE IF NOT EXISTS anti_rigging;
  CREATE USER IF NOT EXISTS 'dev'@'localhost' IDENTIFIED BY 'devpass';
  GRANT ALL PRIVILEGES ON anti_rigging.* TO 'dev'@'localhost';
  FLUSH PRIVILEGES;
"

# 3. Run migrations
pnpm db:push

# 4. Test connection
pnpm db:check
```

## Troubleshooting

### "pnpm db:check" shows connection error

Run the diagnostic check script:
```bash
pnpm db:check
```

It will show:
- ✅ Connection successful → ready to develop
- ❌ Connection failed → shows exact error, code, and host/port

### MySQL not found

- **Docker:** `docker-compose up -d`
- **System:** `sudo mysql-server`, or install via `brew install mysql` (Mac), `apt install mysql-server` (Linux)

### Database doesn't exist yet

Run migrations:
```bash
pnpm db:push
```

This generates and applies all Drizzle migrations from `drizzle/` directory.

### Permission denied / user not found

Update `.env` `DATABASE_URL` to match your MySQL user:
```
DATABASE_URL="mysql://root:password@localhost:3306/anti_rigging"
```

## Verify Setup

After setup, check:

```bash
# 1. Dev server running
pnpm dev

# 2. Database connection working
pnpm db:check

# 3. All unit tests pass
pnpm test
```

## Database Structure

Main tables managed by Drizzle ORM:
- `users` — Authentication (OAuth + JWT)
- `polling_stations` — Voting locations
- `election_data` — Vote counts + analysis
- `evidence` — Uploaded ballot photos
- `fraud_alerts` — Detected anomalies
- `volunteer_*` — Volunteer submissions + codes
- `system_settings` — Config key-value pairs

See [drizzle/schema.ts](../drizzle/schema.ts) for full schema definition.

## Docker Cleanup

```bash
# Stop containers
docker-compose down

# Remove data volume (warning: deletes saved data)
docker-compose down -v

# View logs
docker-compose logs mysql -f
```
