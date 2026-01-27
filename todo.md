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
