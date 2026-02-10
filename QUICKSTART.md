# 🚀 Quick Start Guide

## การรันระบบครั้งแรก

### 1. ติดตั้ง Dependencies
```bash
pnpm install
```

### 2. Setup Environment Variables
สร้างไฟล์ `.env` ที่ root directory:
```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/anti_rigging"

# OAuth (Manus Platform)
OAUTH_SERVER_URL="https://oauth.manus.com"
VITE_APP_ID="your-app-id"
JWT_SECRET="your-jwt-secret-key"

# Storage (S3-like)
BUILT_IN_FORGE_API_URL="https://storage-api.com"
BUILT_IN_FORGE_API_KEY="your-storage-key"

# Optional - External Services
LINE_NOTIFY_TOKEN="your-line-token"
DISCORD_WEBHOOK_URL="your-discord-webhook"
```

### 3. Setup Database
```bash
# Generate and apply migrations
pnpm db:push
```

### 4. รัน Development Server
```bash
pnpm dev
```

Server จะรันที่: **http://localhost:3000**

## 📋 คำสั่งที่ใช้บ่อย

```bash
# Development
pnpm dev              # รัน dev server (HMR enabled)
pnpm build            # Build production
pnpm start            # รัน production server

# Database
pnpm db:push          # Apply schema changes

# Testing
pnpm test             # รัน unit tests
pnpm check            # TypeScript type check

# Code Quality
pnpm format           # Format code with Prettier
```

## 🌐 เข้าถึงระบบ

- **Frontend:** http://localhost:3000
- **API (tRPC):** http://localhost:3000/api/trpc
- **Admin Dashboard:** http://localhost:3000/admin
- **Volunteer App:** http://localhost:3000/volunteer

## 🔧 Troubleshooting

### Port 3000 ถูกใช้งานอยู่
ระบบจะหา port ว่างอัตโนมัติ หรือระบุ port เอง:
```bash
PORT=4000 pnpm dev
```

### Database Connection Error
ตรวจสอบ `DATABASE_URL` ใน `.env` ให้ถูกต้อง

### Build Error
ลองลบ cache และ rebuild:
```bash
rm -rf node_modules/.vite dist
pnpm install
pnpm build
```

## 📚 เอกสารเพิ่มเติม

- [User Manual](docs/user-manual.md)
- [Gap Alert Guide](docs/gap-alert-user-guide.md)
- [Copilot Instructions](.github/copilot-instructions-new.md)

## 🎯 Features ที่พร้อมใช้งาน

✅ **Forensic Analysis**
- Klimek Model (Vote Stuffing/Stealing Detection)
- Benford's Law Analysis
- Network Analysis
- Spatial Correlation

✅ **PVT System**
- Parallel Vote Tabulation
- Gap Detection & Alerts
- Real-time Dashboard

✅ **Volunteer System**
- Mobile App Interface
- Photo Upload with OCR
- Code-based Registration

✅ **Admin Features**
- Import/Export Data
- Alert Management
- Report Generation
- Volunteer Management

## 🏗️ Architecture Improvements (10/10)

✨ **ปรับปรุงใหม่:**
- ✅ Modular Router Architecture
- ✅ Repository Pattern
- ✅ Service Layer
- ✅ Transaction Management
- ✅ Custom Error Handling
- ✅ Rate Limiting
- ✅ Event-Driven Alerts
- ✅ Database Indexes
- ✅ Optimistic Updates
- ✅ Comprehensive Tests

เริ่มใช้งานได้เลย! 🚀
