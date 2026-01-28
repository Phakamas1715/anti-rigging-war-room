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
