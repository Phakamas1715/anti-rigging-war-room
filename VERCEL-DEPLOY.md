# 🚀 Deploy บน Vercel - Anti-Rigging War Room

## ⚠️ ข้อควรทราบ

Vercel เป็น **serverless platform** ดังนั้นจะต่างจาก VPS deployment:
- ✅ Frontend (React) - Deploy ได้สมบูรณ์
- ⚠️ Backend (tRPC API) - ทำงานแบบ serverless functions
- ❌ MySQL Local - **ไม่สามารถใช้ได้** (ต้องใช้ external database)

---

## 📋 สิ่งที่ต้องเตรียม

### 1. External MySQL Database
เลือกอย่างใดอย่างหนึ่ง:

**Option A: PlanetScale (แนะนำ - Free tier)**
1. สมัครที่ https://planetscale.com
2. สร้าง database ใหม่
3. คัดลอก `DATABASE_URL` (MySQL connection string)

**Option B: Railway Database**
1. สมัครที่ https://railway.app
2. สร้าง MySQL service
3. คัดลอก connection string

**Option C: Aiven MySQL**
1. สมัครที่ https://aiven.io
2. เลือก MySQL service (free tier)
3. ดู connection details

### 2. OAuth Server (สำหรับ Admin)
- ต้องมี OAuth server ที่รันอยู่แล้ว
- หรือใช้ Manus platform

### 3. Storage Service (สำหรับรูปภาพ)
เลือกอย่างใดอย่างหนึ่ง:
- **Vercel Blob Storage** (แนะนำ)
- AWS S3
- Cloudflare R2
- DigitalOcean Spaces

---

## 🚀 วิธี Deploy (Step-by-Step)

### Step 1: Click Import to Vercel
คุณคลิกลิงก์นี้แล้ว:
```
https://vercel.com/new/import?framework=vite&...
```

### Step 2: Configure Environment Variables
ใน Vercel Dashboard → Settings → Environment Variables

เพิ่มตัวแปรเหล่านี้:

```env
# Database (PlanetScale/Railway/Aiven)
DATABASE_URL=mysql://user:pass@host:3306/dbname

# OAuth (Admin login)
OAUTH_SERVER_URL=https://your-oauth-server.com
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
VITE_APP_ID=your-vercel-app-id

# Security
JWT_SECRET=your-32-character-secret-key-here

# Storage (เลือก 1 ใน 4)
# Option 1: Vercel Blob
BLOB_READ_WRITE_TOKEN=vercel_blob_token

# Option 2: AWS S3
BUILT_IN_FORGE_API_URL=https://s3.amazonaws.com
BUILT_IN_FORGE_API_KEY=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=your-bucket-name

# Option 3: Cloudflare R2
BUILT_IN_FORGE_API_URL=https://your-account.r2.cloudflarestorage.com
BUILT_IN_FORGE_API_KEY=your-r2-access-key

# Option 4: Custom Storage API
BUILT_IN_FORGE_API_URL=https://your-storage-api.com
BUILT_IN_FORGE_API_KEY=your-storage-key

# Optional - Notifications
LINE_NOTIFY_TOKEN=your-line-token
DISCORD_WEBHOOK_URL=your-discord-webhook

# Optional - AI/OCR
GEMINI_API_KEY=your-gemini-key
DEEPSEEK_API_KEY=your-deepseek-key
```

### Step 3: Deploy
1. Vercel จะ detect Vite framework อัตโนมัติ
2. Build command: `pnpm build`
3. Output directory: `dist/public`
4. Install command: `pnpm install`

คลิก **Deploy** และรอ 2-3 นาที

### Step 4: Run Database Migrations
หลัง deploy สำเร็จ ต้อง run migrations:

**Option A: Local Migration (แนะนำ)**
```bash
# ใน local machine
export DATABASE_URL="your-planetscale-url"
pnpm db:push
```

**Option B: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Run migration
vercel env pull .env.local
pnpm db:push
```

### Step 5: Test Application
```
https://your-project.vercel.app
```

---

## 🔧 Vercel-Specific Configuration

### Build Settings
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist/public",
  "installCommand": "pnpm install",
  "framework": "vite"
}
```

### Function Configuration
```json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

---

## 📊 Database Options Comparison

| Service | Free Tier | Pros | Cons |
|---------|-----------|------|------|
| **PlanetScale** | 5GB, 1B reads/mo | มี branching, auto-scaling | ไม่มี foreign keys |
| **Railway** | $5 credit/mo | ง่าย, full MySQL | หมดเครดิตต้องเติม |
| **Aiven** | 1GB, 30 days | Full features | Trial 30 วัน |
| **Neon Postgres** | ฟรีตลอด | Serverless Postgres | ต้องเปลี่ยนจาก MySQL |

---

## 🎯 Vercel Blob Storage Setup

### 1. Enable Blob Storage
```bash
# ใน Vercel Dashboard
Project → Storage → Create Blob Store
```

### 2. Get Token
```bash
vercel env add BLOB_READ_WRITE_TOKEN
```

### 3. Update Code (ถ้าใช้ Vercel Blob)
```typescript
// server/storage.ts
import { put } from '@vercel/blob';

export async function storagePut(key: string, data: Buffer, mimeType: string) {
  const blob = await put(key, data, {
    access: 'public',
    contentType: mimeType,
  });
  return { url: blob.url, key: blob.pathname };
}
```

---

## 🚨 ข้อจำกัดของ Vercel

### 1. Serverless Functions
- **Timeout:** Max 60 seconds (Hobby plan)
- **Size:** Max 50MB per function
- **Cold Start:** First request อาจช้า 1-2 วินาที

### 2. Database
- ❌ ไม่สามารถรัน MySQL locally บน Vercel
- ✅ ต้องใช้ external database (PlanetScale/Railway)

### 3. File Storage
- ❌ Filesystem ไม่ persistent (ไฟล์หายเมื่อ function restart)
- ✅ ต้องใช้ Vercel Blob หรือ S3

### 4. WebSocket
- ⚠️ Vercel รองรับ WebSocket แต่มีข้อจำกัด
- Real-time features อาจต้องใช้ Vercel's streaming API

---

## 🔄 Alternative: Hybrid Deployment

ถ้า Vercel ไม่ตอบโจทย์ ลองแบบ Hybrid:

### Frontend on Vercel
- Deploy เฉพาะ React app
- Fast CDN delivery
- Auto-scaling

### Backend on Railway/Render
- Full Node.js server
- MySQL database included
- No serverless limitations

```bash
# Frontend .env
VITE_API_URL=https://your-backend.up.railway.app

# Backend deploy on Railway
railway up
```

---

## 📱 Vercel URL Structure

```
Production:  https://your-project.vercel.app
Preview:     https://your-project-git-branch.vercel.app
Development: http://localhost:3000
```

---

## ⚡ Performance Optimization

### 1. Edge Functions (ถ้าต้องการ)
```typescript
// api/edge/health.ts
export const config = { runtime: 'edge' };

export default function handler() {
  return new Response('OK', { status: 200 });
}
```

### 2. Image Optimization
```typescript
// ใช้ Vercel Image Optimization
import Image from 'next/image'; // ถ้าใช้ Next.js
```

### 3. Caching
```typescript
// api/cached-data.ts
export const config = {
  runtime: 'edge',
  cache: 'public, s-maxage=3600, stale-while-revalidate',
};
```

---

## 🆘 Troubleshooting

### Build Failed
```bash
# ตรวจสอบ logs
vercel logs

# Local build test
pnpm build
```

### Database Connection Error
```bash
# Test connection string
mysql -h your-host -u user -p dbname

# ตรวจสอบ SSL requirement
# PlanetScale ต้องใช้ SSL=true
DATABASE_URL="mysql://...?ssl=true"
```

### Environment Variables Not Working
```bash
# Pull env vars locally
vercel env pull .env.local

# ตรวจสอบค่า
cat .env.local
```

### Function Timeout
```json
// vercel.json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

---

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs
- **PlanetScale Docs:** https://planetscale.com/docs
- **GitHub Issues:** https://github.com/Phakamas1715/anti-rigging-war-room/issues

---

## ✅ Deployment Checklist

- [ ] External MySQL database setup (PlanetScale/Railway)
- [ ] Database migrations applied (`pnpm db:push`)
- [ ] Environment variables configured in Vercel
- [ ] Storage solution selected (Vercel Blob/S3)
- [ ] OAuth credentials updated for Vercel domain
- [ ] Build successful
- [ ] Test admin login
- [ ] Test volunteer code system
- [ ] Test image upload

---

## 🎊 Deploy Now!

1. **Click:** [Your Vercel Import Link](https://vercel.com/new/import?framework=vite&hasTrialAvailable=1&id=1143766057&name=anti-rigging-war-room&owner=Phakamas1715&project-name=anti-rigging-war-room&provider=github&remainingProjects=1&s=https%3A%2F%2Fgithub.com%2FPhakamas1715%2Fanti-rigging-war-room&teamSlug=phakas-projects&totalProjects=1)

2. **Add Environment Variables** (ตาม Step 2 ด้านบน)

3. **Deploy** และรอ 2-3 นาที

4. **Run Migrations** (`pnpm db:push`)

5. **Test!** 🎉

---

**Version:** 1.0.0  
**Platform:** Vercel Serverless  
**Status:** 🟢 Ready to Deploy
