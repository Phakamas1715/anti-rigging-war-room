# Anti-Rigging War Room - Project TODO

## Database & Schema
- [x] Database schema for polling stations, election data, evidence, and network analysis
- [x] Schema for parallel vote tabulation (PVT) data

## Backend API - Forensic Analysis
- [x] Klimek Model API with Vote Stuffing detection (Alpha coefficient)
- [x] Klimek Model API with Vote Stealing detection (Beta coefficient)
- [x] Second Digit Benford's Law (2BL) analysis API
- [x] Z-Score Spatial Correlation analysis (Thai context)
- [x] ProofMode verification API (Cryptographic Hash)
- [x] Social Network Analysis API (Centrality Score)

## Backend API - Systemic Fraud Detection (PVT)
- [x] Parallel Vote Tabulation (PVT) system - compare crowdsourced vs official
- [x] Gap Analysis API (Real vs Reported comparison)
- [x] Time-Series Anomaly Detection (Magic Jump detection)
- [x] Data Snapshotting system for official data feeds

## Frontend - Dashboard & Visualization
- [x] Dashboard UI with real-time statistics and alerts
- [x] Klimek Model Heatmap visualization with Fraud Zone detection
- [x] Benford's Law frequency chart visualization
- [x] SNA network graph visualization with Hub detection
- [x] Spatial correlation map visualization
- [x] PVT comparison dashboard (Our Sum vs Their Sum)
- [x] Time-series chart for detecting data jumps

## Evidence & Storage
- [x] Evidence upload system with S3 storage
- [x] ProofMode metadata extraction and verification
- [x] Polling station management system
- [x] Immutable evidence storage (hash-based verification)

## Alerts & Reports
- [x] Alert system for anomaly detection (Alpha > 0.05)
- [x] Alert for PVT gap detection
- [x] Report generation and export for legal use

## New Features - Phase 2

### Import System (Admin Panel)
- [x] Admin page for data import
- [x] CSV file upload and parsing
- [x] Excel file upload and parsing
- [x] Bulk import polling station data
- [x] Bulk import election results
- [x] Data validation and error handling
- [ ] Import history and logs

### Export System (PDF Reports)
- [x] PDF report generation API
- [x] Klimek Model analysis report with heatmap
- [ ] Benford's Law analysis report with charts
- [x] SNA network analysis report
- [ ] PVT comparison report
- [x] Combined forensic evidence report for legal use
- [x] Report download functionality

### Z-Score Spatial Map
- [x] Thailand map visualization
- [x] Province-level anomaly display
- [ ] District-level drill-down
- [x] Color-coded Z-Score indicators
- [x] Interactive map with tooltips
- [x] Neighbor comparison visualization

## New Features - Phase 3: Mobile App for Volunteers

### Volunteer Registration & Auth
- [x] Volunteer registration page
- [x] Volunteer login system
- [x] Assign volunteer to polling station
- [x] Volunteer status tracking (active/inactive)

### Mobile Camera & Photo Upload
- [x] Mobile-friendly camera interface
- [x] Photo capture with timestamp
- [x] Photo preview before upload
- [x] Upload to S3 with progress indicator
- [x] Automatic GPS location tagging

### Vote Data Entry
- [x] Mobile form for entering vote counts
- [x] Candidate selection interface
- [x] Vote count input with validation
- [x] Summary before submission
- [ ] Offline mode with sync

### Real-time PVT Integration
- [x] Submit data to PVT system
- [x] Real-time comparison with official results
- [x] Alert when discrepancy detected
- [x] Station submission status dashboard

### Volunteer Dashboard
- [x] List of assigned stations
- [x] Submission history
- [ ] Station coverage map
- [x] Progress statistics

## New Features - Phase 4: Offline Mode, LINE Notify, QR Code

### Offline Mode (PWA)
- [x] Service Worker for caching static assets
- [x] IndexedDB for storing offline submissions
- [x] Offline detection and status indicator
- [x] Auto-sync when back online
- [x] PWA manifest for installable app

### LINE Notify Integration
- [x] LINE Notify API integration
- [x] Alert notification when Alpha > 5%
- [x] Alert notification when PVT gap detected
- [x] Alert notification when suspicious hub detected
- [x] Admin settings for LINE token configuration

### QR Code System
- [x] QR Code generation for volunteer registration link
- [x] QR Code for specific polling station assignment
- [x] Downloadable QR Code image
- [x] QR Code display in admin dashboard

### Discord Webhook Integration (Added)
- [x] Discord Webhook API integration
- [x] Rich embed alerts with severity colors
- [x] Klimek, PVT, Network Hub, Benford, Spatial alerts
- [x] Daily summary report
- [x] Settings page for webhook configuration

## New Features - Phase 5: OCR System for Vote Counting

### OCR Engine (DeepSeek Vision)
- [x] DeepSeek Vision API integration for image analysis
- [x] Structured prompt for extracting vote counts from tally board images
- [x] Multi-candidate vote extraction
- [x] Confidence score calculation for each extracted number
- [x] Error handling for unclear or damaged images

### OCR Frontend Integration
- [x] Image upload with OCR trigger in Volunteer App
- [x] Real-time OCR processing status indicator
- [x] Auto-fill vote count form with OCR results
- [x] Side-by-side view: original image vs extracted data
- [x] Manual correction interface for low-confidence results
- [ ] Confirmation dialog before submission

### OCR Data Validation
- [x] Cross-check total votes vs sum of individual candidates
- [x] Flag suspicious results (e.g., total > registered voters)
- [ ] Store original image alongside OCR results for audit
- [ ] OCR history and accuracy tracking

## Update - Phase 5.1: DeepSeek-OCR Hugging Face Model

### Model Integration
- [x] Hugging Face Inference API integration
- [x] Create API endpoint for HF DeepSeek-OCR
- [x] Update frontend to support both HF and DeepSeek providers
- [x] Provider selection UI in OCR Scanner
- [x] Token configuration for Hugging Face

## New Features - Phase 6: Batch OCR System

### Multi-file Upload
- [x] Drag and drop multiple files
- [x] File type validation (jpg, png, webp)
- [x] File size limit check
- [x] Preview thumbnails for all uploaded files
- [x] Remove individual files from queue

### Queue Processing
- [x] Sequential OCR processing
- [ ] Concurrent processing (max 3 at a time)
- [x] Retry failed items
- [x] Cancel processing option

### Progress Tracking
- [x] Overall progress bar
- [x] Individual file status (pending/processing/done/error)
- [x] Processing time per file
- [x] Error messages for failed items

### Batch Results
- [x] Summary statistics (total/success/failed)
- [x] Results table with all extracted data
- [ ] Edit individual results
- [x] Export to CSV
- [ ] Export to Excel
- [x] Bulk submit to PVT system

## New Features - Phase 7: Auto-submit Batch OCR to PVT

### Auto-submit System
- [x] Auto-submit toggle in Batch OCR settings
- [x] Bulk submit all OCR results to PVT
- [ ] Individual submit for selected results
- [x] Submission queue with retry logic

### PVT Integration
- [x] Create crowdsourced results from OCR data
- [ ] Link OCR image evidence to PVT submission
- [x] Gap detection after submission
- [ ] Discord/LINE alert when gap detected

### Submission Status
- [x] Status indicator for each result (pending/submitted/failed)
- [ ] Submission history log
- [x] Re-submit failed items
- [x] Summary of submitted vs pending

### UI Updates
- [x] Submit All button in Batch OCR
- [ ] Submit Selected button
- [x] Status column in results table
- [ ] Confirmation dialog before bulk submit


## New Features - Phase 7.1: Gap Alert Notifications

### Discord Gap Alert
- [x] Trigger Discord webhook when Gap detected after PVT submission
- [x] Rich embed with station code, our sum, their sum, and gap amount
- [x] Severity color coding (red for large gaps)

### LINE Gap Alert
- [x] Trigger LINE Notify when Gap detected
- [x] Include station details and gap information
- [ ] Link to dashboard for investigation

### Integration with Batch OCR
- [x] Auto-trigger alert after bulk submit detects gaps
- [x] Summary alert for multiple gaps in batch


## New Features - Phase 7.2: Gemini Vision OCR

### Gemini OCR Provider
- [x] Add Gemini Vision API integration for OCR
- [x] Add Gemini tab in OCR settings
- [x] Use existing GEMINI_API_KEY from environment
- [x] Update BatchOcr to support Gemini provider


## New Features - Phase 8: Volunteer Code Login (No Registration)

### Volunteer Code System
- [x] Generate unique 6-digit volunteer codes
- [x] Admin can create codes and assign to polling stations
- [x] Volunteer enters code to access the system
- [x] No email/phone/password required

### Volunteer Login Page
- [x] Simple login page with code input only
- [x] Validate code and redirect to volunteer app
- [x] Show assigned polling station info after login
- [x] Session management for volunteers

### Admin Management
- [x] Bulk generate volunteer codes
- [x] Export codes as CSV/PDF for distribution
- [x] Revoke/deactivate codes
- [x] View code usage status


## New Features - Phase 9: Real-time Admin Dashboard

### Overview Statistics
- [x] Total votes counted (our data vs official)
- [x] Stations reported vs total stations
- [x] Coverage percentage by province/district
- [x] Gap summary (total gaps, average gap size)

### Real-time Updates
- [x] Auto-refresh data every 30 seconds
- [x] Live submission feed (latest 10 submissions)
- [x] Real-time gap detection alerts
- [x] Progress bar for station coverage

### Visualizations
- [ ] Province-level coverage map
- [x] Vote distribution pie chart by candidate
- [ ] Timeline of submissions
- [ ] Gap severity heatmap

### Quick Actions
- [x] Jump to station with largest gap
- [x] View pending submissions
- [x] Export current snapshot
- [x] Send bulk alerts


## New Features - Phase 10: Pre-Deploy Improvements

### Confirmation Dialog
- [x] Add confirmation dialog before Bulk Submit to PVT
- [x] Show summary of items to be submitted
- [x] Prevent accidental submissions

### Discord Webhook Persistent Storage
- [x] Create database table for system settings
- [x] Store Discord Webhook URL in database
- [x] Store LINE Notify Token in database
- [ ] Load settings on page load (UI integration pending)
- [x] Settings persist across browsers/sessions

### Help/Tutorial Page
- [x] Create Help page for volunteers
- [x] Step-by-step guide for submitting data
- [x] OCR usage tutorial with screenshots
- [x] FAQ section
- [x] Contact/support information


## New Features - Phase 11: Final Polish & Production Ready

### Batch OCR Settings Integration
- [x] Load Discord Webhook URL from database on page load
- [x] Load LINE Token from database on page load
- [x] Load Gap Threshold from database on page load
- [x] Save settings to database when changed
- [x] Remove localStorage dependency for settings

### Admin-only Formula/Equation Display
- [x] Hide Klimek Model formula from non-admin users
- [x] Hide Benford's Law formula from non-admin users
- [x] Hide Z-Score formula from non-admin users (in Dashboard)
- [x] Add admin check to forensic analysis pages
- [x] Show simplified results for regular users

### Code Review & Bug Fixes
- [x] Review all server routers for errors
- [x] Review all client pages for bugs
- [x] Fix any TypeScript errors (0 errors)
- [x] Test all API endpoints (78 tests passed)
- [x] Verify database operations

### OCR Testing Section
- [x] Add OCR test button with sample image
- [x] Include sample tally board image
- [x] Allow users to test OCR accuracy before real use
- [x] Support all 3 providers (Gemini, DeepSeek, Hugging Face)


## New Features - Phase 12: UX Redesign (Completed)

## New Features - Phase 13: Admin Access Control & UX Improvements

### Landing Page Redesign
- [x] แบ่งหน้าหลักเป็น 2 ส่วน (อาสาสมัคร vs Admin)
- [x] ปุ่มใหญ่ 2 ปุ่มสำหรับแต่ละบทบาท
- [x] ลด Feature Grid ที่ซับซ้อน
- [x] เพิ่ม Quick Links สำหรับอาสาสมัคร

### Admin Dashboard with Sidebar
- [x] สร้าง AdminLayout component พร้อม Sidebar
- [x] จัดกลุ่มเมนูตามหมวดหมู่ (ภาพรวม, วิเคราะห์, อาสาสมัคร, ข้อมูล, ตั้งค่า)
- [x] สร้างหน้า AdminDashboard ใหม่
- [x] อัปเดต RealTimeDashboard ให้ใช้ AdminLayout
- [x] อัปเดต VolunteerCodes ให้ใช้ AdminLayout

### Volunteer Portal Simplification
- [x] สร้าง VolunteerLayout component พร้อม Bottom Tabs
- [ ] รวมหน้า Volunteer เป็น Tabbed Interface
- [ ] เพิ่ม Bottom Navigation สำหรับ Mobile

### Route Structure Update
- [x] เพิ่ม /admin routes ใหม่
- [x] รักษา Legacy routes สำหรับ backward compatibility
- [x] อัปเดต App.tsx


### Admin Access Control
- [x] ตรวจสอบ role ก่อนเข้า Admin Dashboard
- [x] แสดงหน้า "ไม่มีสิทธิ์เข้าถึง" สำหรับ non-admin users
- [x] กำหนด Admin เฉพาะ Owner (OWNER_OPEN_ID) เท่านั้น

### Navigation Improvements
- [x] เพิ่มปุ่ม "กลับหน้าหลัก" ในหน้า Volunteer Login
- [x] ปรับปรุง Home page ให้แสดงปุ่มตาม role
- [x] เพิ่มปุ่ม Logout ใน Header


## New Features - Phase 14: Mobile-first Volunteer UI

### Bottom Tabs Navigation
- [x] สร้าง VolunteerMobileApp component
- [x] เพิ่ม Bottom Tabs สำหรับ Mobile
- [x] Tab: ส่งผลคะแนน, ประวัติ, คู่มือ

### Swipe Gestures
- [x] เพิ่ม Swipe ซ้าย-ขวาเพื่อเปลี่ยน Tab
- [x] แสดง Indicator บอกตำแหน่ง Tab ปัจจุบัน

### Mobile-first Design
- [x] ปรับ Layout ให้เหมาะกับหน้าจอเล็ก
- [x] ปรับขนาดปุ่มและ Input ให้ใหญ่ขึ้น
- [x] ปรับ Font size ให้อ่านง่าย


## New Features - Phase 15: Auto-generate Volunteer Code

### Self-Registration System
- [x] สร้างหน้าลงทะเบียนอาสาสมัคร (VolunteerRegister.tsx)
- [x] สร้าง API สำหรับลงทะเบียนและออกรหัสอัตโนมัติ
- [x] ระบบสร้างรหัส 6 หลักอัตโนมัติเมื่อลงทะเบียน
- [x] แสดงรหัสให้อาสาสมัครหลังลงทะเบียนสำเร็จ
- [x] อัปเดต Navigation และ Routes


## New Features - Phase 16: Demo Dashboard with Mock Data

### Mock Data Generation
- [x] สร้างข้อมูลจำลองหน่วยเลือกตั้ง 50 หน่วย
- [x] สร้างข้อมูลจำลองผลคะแนน
- [x] สร้างข้อมูลจำลองการแจ้งเตือน
- [x] สร้างข้อมูลจำลอง PVT Comparison

### Demo Mode Toggle
- [x] เพิ่มปุ่ม Demo Mode ใน Dashboard
- [x] สลับระหว่างข้อมูลจริงและข้อมูลจำลอง
- [x] แสดง Banner บอกว่าอยู่ใน Demo Mode

### Dashboard Visualizations
- [x] กราฟแท่งแสดงคะแนนผู้สมัคร
- [x] กราฟวงกลมแสดงสัดส่วนคะแนน
- [x] แสดงความครอบคลุมรายจังหวัด
- [x] แสดงสรุป Klimek และ Benford Analysis


## New Features - Phase 17: Enhanced Demo Dashboard

### Chart Animations
- [x] เพิ่ม Animation สำหรับกราฟแท่ง (Bar Chart)
- [x] เพิ่ม Animation สำหรับกราฟวงกลม (Pie Chart)
- [x] เพิ่ม Count-up Animation สำหรับตัวเลข
- [x] เพิ่ม Fade-in Animation สำหรับ Cards

### Scenario Selection
- [x] เพิ่มตัวเลือกสถานการณ์: การเลือกตั้งปกติ
- [x] เพิ่มตัวเลือกสถานการณ์: มีการโกง 5%
- [x] เพิ่มตัวเลือกสถานการณ์: มีการโกงรุนแรง

### Export PDF
- [x] เพิ่มปุ่ม Export Demo Report เป็น PDF

### Demo Pages for Public
- [x] สร้างหน้า Demo สำหรับผู้ใช้ทั่วไป (ไม่ต้อง login)
- [x] แสดงตัวอย่างการทำงานแต่ละฟีเจอร์


## New Features - Phase 18: System Documentation

### Documentation
- [x] สร้างเอกสารอธิบายระบบตรวจจับการโกง
- [x] อธิบาย Klimek Model
- [x] อธิบาย Benford's Law
- [x] อธิบาย Network Analysis (SNA)
- [x] อธิบาย PVT Comparison
- [x] อธิบาย Spatial Analysis

### Website Integration
- [x] เพิ่มหน้า "วิธีการทำงาน" ในเว็บไซต์
- [x] เพิ่มลิงก์ในหน้าหลัก


## New Features - Phase 19: Interactive Tutorial

### Tour Component
- [ ] สร้าง TourProvider และ useTour hook
- [ ] สร้าง TourStep component สำหรับแสดง tooltip
- [ ] สร้าง TourOverlay สำหรับ highlight element
- [ ] เพิ่ม Animation และ Transition

### Home Page Tutorial
- [ ] Tutorial แนะนำหน้าหลัก
- [ ] อธิบายปุ่มสำหรับอาสาสมัคร
- [ ] อธิบายปุ่มสำหรับ Admin

### Admin Dashboard Tutorial
- [ ] Tutorial แนะนำ Sidebar navigation
- [ ] อธิบายเครื่องมือวิเคราะห์แต่ละตัว
- [ ] อธิบาย Quick Actions

### Volunteer Tutorial
- [ ] Tutorial แนะนำหน้าลงทะเบียน
- [ ] Tutorial แนะนำหน้า Mobile App
- [ ] อธิบาย Bottom Tabs และ Swipe


## New Features - Phase 20: Admin Code Login

### Admin Access by Code
- [x] สร้างหน้า Admin Login ด้วยรหัส 464646
- [x] เพิ่ม route สำหรับ Admin Code Login
- [x] เพิ่มลิงก์ในหน้าหลัก
- [x] อัปเดต AdminLayout ให้ตรวจสอบ adminSession


## UI/UX Modernization - Orange Theme

### Color Theme Update
- [x] Update primary color from red to orange (#F97316)
- [x] Update accent colors to complement orange theme
- [x] Update gradient backgrounds with orange tones
- [x] Update button styles with modern orange theme

### Modern UI Elements
- [x] Add modern glassmorphism effects
- [x] Update card styles with subtle shadows
- [x] Improve typography and spacing
- [x] Add smooth micro-interactions


## New Features - Phase 21: GLUE-FIN Integration

### GLUE-FIN Module
- [x] Design GLUE-FIN formula and documentation
- [x] Create glueFin.ts module with calculateGlueFin function
- [x] Create glueFin.test.ts with 17 test cases
- [x] All 95 tests passing (including GLUE-FIN)
- [ ] Integrate GLUE-FIN into Dashboard UI
- [ ] Add GLUE-FIN score to polling station reports


### GLUE-FIN Heatmap
- [x] Create Thailand map SVG component
- [x] Add province-level GLUE-FIN score coloring
- [x] Add interactive tooltips with province details
- [x] Create GlueFinHeatmap page in Admin Dashboard
- [x] Add legend for risk levels


## Bug Fix
- [x] Fix API Query Error "The string did not match the expected pattern" on Home page (transient, not reproducible)

## Phase 22: Help Update & GLUE-FIN API Integration
- [ ] Update Help.tsx with GLUE-FIN documentation
- [ ] Update Help.tsx with Klimek Model documentation
- [ ] Update Help.tsx with Benford's Law documentation
- [ ] Update Help.tsx with Admin tools guide
- [ ] Create GLUE-FIN tRPC API endpoint in routers.ts
- [ ] Create GLUE-FIN database schema in drizzle/schema.ts
- [ ] Add GLUE-FIN db helpers in server/db.ts
- [ ] Update GlueFinHeatmap.tsx to use real API data
- [ ] Run database migration (pnpm db:push)
- [ ] Test all endpoints and UI

## Phase 22: Help Update & GLUE-FIN API Integration
- [x] Update Help.tsx with GLUE-FIN documentation
- [x] Add Klimek Model explanation to Help
- [x] Add Benford's Law explanation to Help
- [x] Add Admin tools guide to Help
- [x] Create tRPC API endpoint for GLUE-FIN
- [x] Connect GlueFinHeatmap to real API data
- [x] Add data source indicator (real/demo)
- [x] Add auto-refresh every 30 seconds

## Phase 23: GLUE-FIN Drill-down ระดับอำเภอ
- [x] Create tRPC API endpoint for district-level GLUE-FIN data
- [x] Add district data generation with realistic Thai district names
- [x] Update GlueFinHeatmap with drill-down UI (click province → show districts)
- [x] Add district detail panel with component scores
- [x] Add back navigation from district view to province view
- [x] Test drill-down functionality

## Phase 24: Constituency Search - ค้นหาตามเขตเลือกตั้ง
- [x] Create constituencyData.ts module (province → constituency → districts)
- [x] Create tRPC endpoints: constituency.search, constituency.detail, constituency.provinces, constituency.provinceZones
- [x] Create ConstituencySearch.tsx page with search/filter UI
- [x] Add Yasothon Zone 1, 2, 3 data with real candidate info (9 candidates zone 2)
- [x] Add constituency search to AdminLayout sidebar
- [x] Add route in App.tsx (/admin/constituency)
- [x] Write vitest tests for constituency module (20 tests passed)
- [x] Province zone count for all 77 provinces
- [x] GLUE-FIN Score per constituency
- [x] Stats from 2566 election (registered voters, turnout, valid/invalid votes)
- [x] Candidate vote history from 2566 (where available)

## Phase 25: Tally Mark OCR - อ่านคะแนนแบบขีดจำนวน
- [x] ปรับปรุง OCR prompt ให้รองรับการอ่านขีดคะแนน (Tally marks ||||)
- [x] เพิ่มโหมด "ขีดคะแนน" ใน OCR Scanner (ส.ส.5/11 และ ส.ส.5/18)
- [x] สร้างตัวอย่างภาพกระดานนับคะแนนแบบขีด (ยโสธร เขต 2)
- [x] ทดสอบ OCR กับภาพจำลองยโสธร เขต 2
- [x] เชื่อมต่อกับข้อมูลผู้สมัครยโสธร เขต 2
- [x] Write vitest tests (16 tests passed)
## Phase 25b: OCR รองรับ ส.ส.5/11 (ขีดคะแนน) และ ส.ส.5/18 (ตาราง)
- [x] ปรับปรุง geminiOcr.ts เพิ่ม prompt สำหรับ ส.ส.5/11 (กระดานขีดคะแนน)
- [x] ปรับปรุง geminiOcr.ts เพิ่ม prompt สำหรับ ส.ส.5/18 (แบบฟอร์มรายงานผล)
- [x] เพิ่ม ocrMode parameter ใน batchProcessSingle router (ss5_11, ss5_18)
- [x] เพิ่ม UI เลือกประเภทเอกสาร (ส.ส.5/11 / ส.ส.5/18 / Auto) พร้อมคำอธิบาย
- [x] ทดสอบ UI แสดงผลถูกต้อง
- [x] Write vitest tests (16 tests passed)

## Phase 26: OCR Real Test + Cross-validation + เพิ่มผู้สมัครจังหวัดเป้าหมาย
- [x] หาภาพจริง ส.ส.5/11 (กระดานขีดคะแนน) จากเลือกตั้งผู้ว่าฯ กทม. 2565
- [x] หาภาพจริง ส.ส.5/18 (แบบรายงานผล) จากเลือกตั้ง 2566
- [x] สร้างภาพจำลอง ส.ส.5/11 ยโสธร เขต 2 (5 หน่วย, 9 ผู้สมัคร)
- [x] สร้าง Cross-validation module (crossValidate function in hfOcr.ts)
- [x] เพิ่ม Cross-validation tRPC endpoint
- [x] เพิ่ม Cross-validation toggle ใน BatchOcr UI
- [x] โฟกัสเฉพาะยโสธร เขต 2 (ไม่เพิ่มจังหวัดอื่น)
- [x] เขียน vitest tests สำหรับ cross-validation (19 tests)
- [x] ทดสอบระบบทั้งหมด (143 tests ผ่านทั้งหมด)

## Phase 26b: Hugging Face OCR + Cross-validation + เพิ่มจังหวัดเป้าหมาย
- [x] ขอ HF Token จากผู้ใช้ (auto-matched from BYOK)
- [x] สร้าง server/hfOcr.ts module (Qwen2-VL via Inference API + crossValidate)
- [x] เพิ่ม HF OCR provider (hf-qwen) ใน routers.ts
- [x] สร้าง Cross-validation module เปรียบเทียบ ส.ส.5/11 กับ ส.ส.5/18
- [x] โฟกัสเฉพาะยโสธร เขต 2 (ตามที่ผู้ใช้ต้องการ)
- [x] อัพเดท BatchOcr.tsx เพิ่ม HF provider + Cross-validation UI
- [x] เขียน Vitest tests (19 tests in hfOcr.test.ts, 143 total passed)
