# 🚀 Vercel Deployment - Quick Start

## ✅ พร้อม Deploy แล้ว!

Repository ของคุณถูกเตรียมพร้อมสำหรับ Vercel แล้ว

---

## 📝 Step-by-Step (3 ขั้นตอน)

### Step 1: Click Import Link
[👉 **Click ที่นี่เพื่อ Import**](https://vercel.com/new/import?framework=vite&hasTrialAvailable=1&id=1143766057&name=anti-rigging-war-room&owner=Phakamas1715&project-name=anti-rigging-war-room&provider=github&remainingProjects=1&s=https%3A%2F%2Fgithub.com%2FPhakamas1715%2Fanti-rigging-war-room&teamSlug=phakas-projects&totalProjects=1)

### Step 2: Add Environment Variables

**Environment Variables (คัดลอกไปวางใน Vercel):**

```env
# ⚠️ Database - ต้องเตรียมก่อน!
# เลือก 1 จาก: PlanetScale, Railway, หรือ Aiven
DATABASE_URL=mysql://user:password@host:3306/dbname

# OAuth (Admin Login)
OAUTH_SERVER_URL=https://your-oauth-server.com
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
VITE_APP_ID=your-app-id

# Security
JWT_SECRET=minimum-32-characters-secret-key

# Storage (เลือก 1 ตัวเลือก)
BUILT_IN_FORGE_API_URL=https://your-storage-api.com
BUILT_IN_FORGE_API_KEY=your-storage-key

# Optional
LINE_NOTIFY_TOKEN=your-line-token
DISCORD_WEBHOOK_URL=your-webhook-url
```

**📌 สำคัญ! ต้องเตรียม:**
1. **MySQL Database** → ดู "Database Options" ด้านล่าง
2. **OAuth Credentials** → สำหรับ admin login
3. **Storage Solution** → สำหรับเก็บรูปภาพ

### Step 3: Deploy & Migrate
1. คลิก **Deploy** ใน Vercel
2. รอ 2-3 นาที
3. Run database migration:
```bash
# Local machine
export DATABASE_URL="your-database-url"
pnpm db:push
```

**เสร็จแล้ว!** 🎉 เข้าใช้งานที่ `https://your-project.vercel.app`

---

## 🗄️ Database Options (เลือก 1 อัน)

### Option 1: PlanetScale (แนะนำ - ฟรี)
1. สมัครที่ https://planetscale.com
2. Create Database → Copy connection string
3. Format: `mysql://user:pass@aws.connect.psdb.cloud/dbname?ssl={"rejectUnauthorized":true}`

**Free Tier:**
- 5GB storage
- 1 billion row reads/month
- Auto-scaling

### Option 2: Railway ($5 credit ฟรี)
1. สมัครที่ https://railway.app
2. New Project → Add MySQL
3. Copy `DATABASE_URL` from Variables tab

**ข้อดี:**
- Setup ง่าย 1 คลิก
- Full MySQL features
- $5 credit ฟรี

### Option 3: Aiven (Trial 30 วัน)
1. สมัครที่ https://aiven.io
2. Create MySQL service
3. Download CA cert + connection string

---

## 📦 Storage Options (เลือก 1 อัน)

### Option 1: Vercel Blob (แนะนำ)
```bash
# ใน Vercel Dashboard
Storage → Create Blob Store → Copy Token
```
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx
```

### Option 2: AWS S3
```env
BUILT_IN_FORGE_API_URL=https://s3.amazonaws.com
BUILT_IN_FORGE_API_KEY=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET_NAME=your-bucket
```

### Option 3: Cloudflare R2
```env
BUILT_IN_FORGE_API_URL=https://your-account.r2.cloudflarestorage.com
BUILT_IN_FORGE_API_KEY=your-r2-key
```

---

## ⚙️ Build Settings (ตรวจสอบใน Vercel)

```
Framework Preset: Vite
Build Command: pnpm vercel-build
Output Directory: dist/public
Install Command: pnpm install
```

---

## ✅ Checklist หลัง Deploy

- [ ] Database พร้อม (PlanetScale/Railway)
- [ ] Migration สำเร็จ (`pnpm db:push`)
- [ ] Admin login ได้ (`/admin`)
- [ ] สร้างรหัสอาสา ได้ (`/admin/volunteer-codes`)
- [ ] อาสาล็อกอินได้ (`/volunteer/login`)
- [ ] อัปโหลดรูปได้

---

## 🔗 URLs หลัง Deploy

```
Production:  https://anti-rigging-war-room.vercel.app
Admin:       https://anti-rigging-war-room.vercel.app/admin
Volunteer:   https://anti-rigging-war-room.vercel.app/volunteer/login
```

---

## 🆘 ปัญหาที่พบบ่อย

### Build Failed
```bash
# ตรวจสอบ logs
vercel logs your-project --since 1h

# Test build locally
pnpm build
```

### Database Connection Error
```bash
# ตรวจสอบ connection string
# PlanetScale ต้องมี ?ssl={"rejectUnauthorized":true}
# Railway อาจต้อง ?sslmode=require
```

### Environment Variables ไม่ทำงาน
1. ตรวจสอบว่าเพิ่มใน Production environment
2. Redeploy หลังเพิ่ม env vars
3. ตรวจสอบชื่อตัวแปร (case-sensitive)

---

## 📚 เอกสารเพิ่มเติม

- [VERCEL-DEPLOY.md](VERCEL-DEPLOY.md) - คู่มือแบบละเอียด
- [DEPLOYMENT.md](DEPLOYMENT.md) - ตัวเลือก deployment อื่นๆ
- [DEBUG.md](DEBUG.md) - Troubleshooting

---

## 🎯 Ready to Deploy?

1. **เตรียม Database** → เลือก PlanetScale/Railway/Aiven
2. **เตรียม Storage** → เลือก Vercel Blob/S3/R2
3. **Click Link** → [Import to Vercel](https://vercel.com/new/import?framework=vite&hasTrialAvailable=1&id=1143766057&name=anti-rigging-war-room&owner=Phakamas1715&project-name=anti-rigging-war-room&provider=github&remainingProjects=1&s=https%3A%2F%2Fgithub.com%2FPhakamas1715%2Fanti-rigging-war-room&teamSlug=phakas-projects&totalProjects=1)
4. **Add Env Vars** → วางตาม Step 2
5. **Deploy!** → รอ 2-3 นาที
6. **Run Migration** → `pnpm db:push`
7. **Test** → เข้าใช้งานได้เลย! 🎊

---

**Status:** 🟢 Ready for Vercel  
**Version:** 1.0.0  
**Last Updated:** 2026-02-10
