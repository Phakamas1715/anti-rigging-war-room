# 🚀 การ Deploy บน VPS - Anti-Rigging War Room

## ✅ โค้ดพร้อม Deploy แล้ว!

GitHub Repository: `https://github.com/Phakamas1715/anti-rigging-war-room`
Branch: `main`
Commit: `994a2f4`

---

## 📋 ข้อมูลที่คุณต้องเตรียม

- [ ] **VPS หรือ Server** (Ubuntu 20.04+)
  - RAM: อย่างน้อย 2GB
  - Storage: 20GB+
  - CPU: 2 cores+

- [ ] **Domain Name** (ถ้ามี)
  - ตั้ง DNS A record ชี้ไป VPS IP
  - www subdomain (optional)

- [ ] **OAuth Credentials** (สำหรับ Admin login)
  - OAUTH_SERVER_URL
  - VITE_APP_ID
  - JWT_SECRET

- [ ] **Storage API** (สำหรับเก็บรูปภาพ)
  - BUILT_IN_FORGE_API_URL
  - BUILT_IN_FORGE_API_KEY

---

## 🎯 วิธี Deploy (แบบง่าย - 1 คำสั่งเดียว)

### Step 1: SSH เข้า VPS
```bash
ssh root@YOUR_VPS_IP
```

### Step 2: Run Deployment Script
```bash
# Clone repository
git clone https://github.com/Phakamas1715/anti-rigging-war-room.git
cd anti-rigging-war-room

# Run auto-deployment script
sudo ./deploy-vps.sh
```

**Script จะทำอะไรบ้าง:**
1. ติดตั้ง Node.js 20, pnpm, PM2
2. ติดตั้ง MySQL 8.0
3. ติดตั้ง Nginx
4. สร้าง database
5. Build application
6. ตั้งค่า PM2 (auto-restart)
7. ตั้งค่า Nginx reverse proxy
8. ติดตั้ง SSL certificate (Let's Encrypt)
9. ตั้งค่า firewall

### Step 3: กรอกข้อมูลตามที่ถาม
- MySQL root password
- Domain name
- Email สำหรับ SSL certificate

### Step 4: แก้ไข .env
```bash
nano /var/www/anti-rigging-war-room/.env
```

ใส่ค่า production ที่ถูกต้อง:
```env
DATABASE_URL="mysql://anti_rigging:YOUR_DB_PASSWORD@localhost:3306/anti_rigging"
OAUTH_SERVER_URL="https://your-oauth-server.com"
VITE_OAUTH_PORTAL_URL="https://your-oauth-portal.com"
VITE_APP_ID="your-prod-app-id"
JWT_SECRET="your-32-char-secret"
BUILT_IN_FORGE_API_URL="https://your-storage-api.com"
BUILT_IN_FORGE_API_KEY="your-storage-key"
NODE_ENV="production"
```

### Step 5: Restart Application
```bash
cd /var/www/anti-rigging-war-room
pm2 restart anti-rigging-war-room
```

### Step 6: เปิดใช้งาน
```
https://yourdomain.com
```

---

## 🎉 เสร็จแล้ว!

**URL สำหรับผู้ใช้ต่างๆ:**
- แอดมิน: `https://yourdomain.com/admin`
- อาสาสมัคร: `https://yourdomain.com/volunteer/login`
- ลงทะเบียนอาสา: `https://yourdomain.com/volunteer/register`

---

## 🔧 คำสั่งที่ใช้บ่อย

### ตรวจสอบสถานะ
```bash
# สถานะ Application
pm2 status

# ดู logs
pm2 logs anti-rigging-war-room

# Monitor real-time
pm2 monit

# สถานะ Nginx
sudo systemctl status nginx

# สถานะ MySQL
sudo systemctl status mysql
```

### อัปเดตโค้ด (เมื่อมีการ push ใหม่)
```bash
cd /var/www/anti-rigging-war-room
sudo ./update.sh
```

### Restart Services
```bash
# Restart application
pm2 restart anti-rigging-war-room

# Restart Nginx
sudo systemctl restart nginx

# Restart MySQL
sudo systemctl restart mysql
```

---

## 🔐 สร้างรหัสอาสาสมัคร

### วิธีที่ 1: ผ่าน Admin Dashboard
1. เข้า `https://yourdomain.com/admin/volunteer-codes`
2. คลิก "สร้างรหัสใหม่"
3. ระบุจำนวนและ station (ถ้ามี)
4. แจกรหัส 6 หลักให้อาสาสมัคร

### วิธีที่ 2: Bulk Create ผ่าน API
```javascript
// ใช้ trpc client หรือ curl
curl -X POST https://yourdomain.com/api/trpc/volunteerCode.bulkCreate \
  -H "Content-Type: application/json" \
  -d '{"count": 100}'
```

---

## 📊 การใช้งานของอาสาสมัคร

### 1. อาสาได้รับรหัส 6 หลัก (เช่น `AB12CD`)

### 2. เข้าระบบ
```
https://yourdomain.com/volunteer/login
```
ป้อนรหัส 6 หลัก → เข้าได้เลย ไม่ต้อง OAuth!

### 3. ส่งผลคะแนน
- ถ่ายรูปบัตรคะแนน
- กรอกตัวเลข
- ส่ง → บันทึกทันที

### 4. ดูประวัติ
- แท็บ "ประวัติ" แสดงการส่งทั้งหมด

---

## 🔄 Workflow การทำงาน

```
┌──────────────────────────────────────────────┐
│  1. แอดมินสร้างรหัสอาสา (6 หลัก)           │
│     /admin/volunteer-codes                  │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  2. แจกรหัสให้อาสาผ่าน LINE/Facebook       │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  3. อาสาเปิดลิงก์ + ป้อนรหัส               │
│     /volunteer/login                        │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  4. ส่งผลคะแนน + รูปถ่าย                    │
│     /volunteer/app                          │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  5. ระบบวิเคราะห์ + แสดงใน Dashboard       │
│     /admin + /admin/realtime                │
└──────────────────────────────────────────────┘
```

---

## 📱 QR Code สำหรับแจกอาสา

สร้าง QR Code ผ่าน admin:
```
https://yourdomain.com/admin/volunteer-codes
→ คลิก "Generate QR"
→ Print ให้อาสาสแกน
```

---

## 💾 Backup Database

### Auto Backup (ทุกวัน 2:00 AM)
```bash
# เพิ่มใน crontab
sudo crontab -e

# เพิ่มบรรทัดนี้
0 2 * * * /var/www/anti-rigging-war-room/backup.sh
```

### Manual Backup
```bash
cd /var/www/anti-rigging-war-room
sudo ./backup.sh
```

### Restore
```bash
gunzip < /var/backups/anti-rigging/anti_rigging-20260210.sql.gz | \
  mysql -u root -p anti_rigging
```

---

## 🆘 Troubleshooting

### ปัญหา: Application ไม่ตอบสนอง
```bash
# ตรวจสอบ logs
pm2 logs anti-rigging-war-room --lines 100

# Restart
pm2 restart anti-rigging-war-room
```

### ปัญหา: Database connection error
```bash
# Test MySQL
mysql -u anti_rigging -p anti_rigging

# ตรวจสอบ .env
cat /var/www/anti-rigging-war-room/.env | grep DATABASE_URL
```

### ปัญหา: SSL certificate หมดอายุ
```bash
# Renew ด้วยตนเอง
sudo certbot renew

# ตรวจสอบ auto-renewal
sudo systemctl status certbot.timer
```

### ปัญหา: Port 3000 ถูกใช้งานแล้ว
```bash
# ดู process ที่ใช้ port
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

---

## 📈 Performance Monitoring

```bash
# CPU & Memory
htop

# Disk usage
df -h

# Database size
mysql -u root -p -e "SELECT 
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'anti_rigging';"

# PM2 monitoring
pm2 monit
```

---

## 🎯 Next Steps

1. **ทดสอบระบบ**
   - Login แอดมิน
   - สร้างรหัสอาสา
   - ทดสอบส่งผลคะแนน

2. **นำเข้าข้อมูลหน่วยเลือกตั้ง**
   - `/admin/import`
   - Upload CSV/Excel

3. **Setup Monitoring**
   - ติดตั้ง monitoring tools (optional)
   - Setup alerts

4. **เทรนทีม**
   - อธิบายวิธีใช้งาน
   - สร้างคู่มือสำหรับอาสา

---

## 🎊 พร้อมใช้งานแล้ว!

**Repository:** https://github.com/Phakamas1715/anti-rigging-war-room

**Documentation:**
- [VPS-DEPLOY.md](VPS-DEPLOY.md) - คู่มือ deploy แบบละเอียด
- [DEPLOYMENT.md](DEPLOYMENT.md) - ตัวเลือก deployment อื่นๆ
- [DEBUG.md](DEBUG.md) - Troubleshooting guide
- [QUICKSTART.md](QUICKSTART.md) - Development setup

**ติดต่อ/Support:**
- GitHub Issues
- [docs/user-manual.md](docs/user-manual.md)

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-10  
**Status:** 🟢 **PRODUCTION READY**
