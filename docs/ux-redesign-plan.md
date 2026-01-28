# Anti-Rigging War Room - UX Redesign Plan

## ปัญหา UI/UX ปัจจุบัน

### 1. Navigation สับสน
- มี 22 หน้าแต่ไม่มี Sidebar หรือ Menu ที่ชัดเจน
- ผู้ใช้ต้องกลับไปหน้า Home หรือ Dashboard ทุกครั้งเพื่อเปลี่ยนหน้า
- ไม่มีการแบ่งกลุ่มเมนูตามบทบาท (Admin vs อาสาสมัคร)

### 2. ไม่แยก Flow ตามบทบาท
- อาสาสมัครเห็นเมนูเดียวกับ Admin
- หน้า Dashboard แสดงทุกอย่างรวมกัน ทำให้สับสน
- อาสาสมัครไม่จำเป็นต้องเห็น Forensic Tools (Klimek, Benford, SNA)

### 3. Entry Points หลายทาง
- `/volunteer` - ต้อง Login ด้วย OAuth
- `/volunteer/login` - Login ด้วยรหัส 6 หลัก
- `/volunteer/app` - หน้าหลักอาสาสมัคร
- ทำให้สับสนว่าควรเข้าทางไหน

### 4. หน้าหลักไม่ชัดเจน
- หน้า Home แสดง Features ทั้งหมดโดยไม่แยกว่าใครควรใช้อะไร
- ไม่มี Quick Action สำหรับแต่ละบทบาท

---

## User Roles & Personas

### 1. Admin (ผู้ดูแลระบบ)
**งานหลัก:**
- Import ข้อมูลหน่วยเลือกตั้ง
- สร้างและจัดการรหัสอาสาสมัคร
- ดู Real-time Dashboard และ Alerts
- วิเคราะห์ข้อมูลด้วย Forensic Tools
- ตั้งค่า Discord/LINE Notifications
- Export รายงาน

**ต้องการ:**
- เห็นภาพรวมทั้งหมดในที่เดียว
- เข้าถึง Forensic Tools ได้ง่าย
- จัดการอาสาสมัครได้สะดวก

### 2. Volunteer (อาสาสมัคร)
**งานหลัก:**
- ถ่ายรูปกระดานนับคะแนน
- กรอกหรือ OCR ผลคะแนน
- ส่งข้อมูลเข้าระบบ PVT
- ดูประวัติการส่งของตัวเอง

**ต้องการ:**
- UI ง่าย ไม่ซับซ้อน
- เข้าระบบเร็ว (รหัส 6 หลัก)
- ขั้นตอนน้อย ส่งข้อมูลเร็ว
- ไม่ต้องเห็นเครื่องมือวิเคราะห์

---

## New Information Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     LANDING PAGE (/)                        │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │  อาสาสมัคร       │    │  ผู้ดูแลระบบ / นักวิเคราะห์      │ │
│  │  [เข้าด้วยรหัส]   │    │  [เข้าสู่ระบบ Admin]             │ │
│  └────────┬────────┘    └────────────────┬────────────────┘ │
└───────────┼──────────────────────────────┼──────────────────┘
            │                              │
            ▼                              ▼
┌───────────────────────┐    ┌────────────────────────────────┐
│   VOLUNTEER PORTAL    │    │       ADMIN DASHBOARD          │
│   /volunteer          │    │       /admin                   │
│                       │    │                                │
│  ┌─────────────────┐  │    │  ┌─────────────────────────┐   │
│  │ 📷 ส่งผลคะแนน    │  │    │  │ Sidebar Navigation      │   │
│  │ (OCR + Manual)  │  │    │  │                         │   │
│  └─────────────────┘  │    │  │ 📊 Overview             │   │
│                       │    │  │ 📈 Real-time Dashboard  │   │
│  ┌─────────────────┐  │    │  │ ⚠️ Alerts               │   │
│  │ 📋 ประวัติการส่ง  │  │    │  │ ─────────────────────  │   │
│  └─────────────────┘  │    │  │ 🔬 Forensic Tools       │   │
│                       │    │  │   • Klimek Model        │   │
│  ┌─────────────────┐  │    │  │   • Benford's Law       │   │
│  │ ❓ วิธีใช้งาน    │  │    │  │   • Network Analysis   │   │
│  └─────────────────┘  │    │  │   • Spatial Map         │   │
│                       │    │  │ ─────────────────────   │   │
└───────────────────────┘    │  │ 👥 Volunteer Mgmt       │   │
                             │  │   • Volunteer Codes     │   │
                             │  │   • Volunteer List      │   │
                             │  │ ─────────────────────   │   │
                             │  │ 📥 Data Management      │   │
                             │  │   • Import Data         │   │
                             │  │   • Batch OCR           │   │
                             │  │   • PVT Comparison      │   │
                             │  │ ─────────────────────   │   │
                             │  │ 📤 Export & Reports     │   │
                             │  │ ⚙️ Settings             │   │
                             │  └─────────────────────────┘   │
                             └────────────────────────────────┘
```

---

## New User Flows

### Flow 1: อาสาสมัครส่งผลคะแนน (3 ขั้นตอน)

```
1. เข้าหน้าหลัก → กดปุ่ม "อาสาสมัคร"
2. กรอกรหัส 6 หลัก → เข้าสู่ระบบ
3. ถ่ายรูป/OCR → ยืนยัน → ส่งสำเร็จ ✓
```

### Flow 2: Admin ดู Dashboard และ Alerts

```
1. เข้าหน้าหลัก → กดปุ่ม "Admin"
2. Login OAuth → เข้า Admin Dashboard
3. เห็น Overview + Alerts ทันที
4. คลิก Alert → ไปหน้า Forensic ที่เกี่ยวข้อง
```

### Flow 3: Admin สร้างรหัสอาสาสมัคร

```
1. Admin Dashboard → Sidebar "Volunteer Codes"
2. กด "สร้างรหัสใหม่" → ระบุจำนวน
3. Export CSV/PDF → แจกจ่ายอาสาสมัคร
```

---

## UI Changes Required

### 1. Landing Page (Home.tsx)
- แบ่งเป็น 2 ส่วนชัดเจน: อาสาสมัคร vs Admin
- ปุ่มใหญ่ 2 ปุ่มแทน Feature Grid
- ลบ Stats Section ที่ไม่จำเป็น

### 2. Admin Dashboard Layout
- ใช้ DashboardLayout พร้อม Sidebar
- จัดกลุ่มเมนูตามหมวดหมู่
- แสดง Overview เป็นหน้าแรก

### 3. Volunteer Portal
- หน้าเดียวที่รวมทุกอย่าง (Single Page App style)
- Tabs: ส่งผลคะแนน | ประวัติ | วิธีใช้
- ไม่มี Navigation ไปหน้าอื่น

### 4. Navigation Simplification
- Admin: Sidebar ตลอด
- Volunteer: Bottom Tabs (Mobile-first)
- ลบปุ่ม Back ที่ไม่จำเป็น

---

## Implementation Priority

### Phase 1: Landing Page Redesign
- [x] วิเคราะห์ปัญหา
- [ ] แก้ไข Home.tsx - แบ่ง 2 ส่วน
- [ ] เพิ่ม Quick Entry Points

### Phase 2: Admin Dashboard with Sidebar
- [ ] สร้าง AdminLayout component
- [ ] ย้ายหน้า Admin ทั้งหมดใช้ Layout เดียวกัน
- [ ] จัดกลุ่มเมนู

### Phase 3: Volunteer Portal Simplification
- [ ] รวมหน้า Volunteer เป็น Tabbed Interface
- [ ] เพิ่ม Bottom Navigation
- [ ] ลด Steps ในการส่งข้อมูล

### Phase 4: Polish & Test
- [ ] ทดสอบ User Flow ทั้งหมด
- [ ] ปรับ Responsive Design
- [ ] เพิ่ม Loading States
