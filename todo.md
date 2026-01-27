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
- [ ] Spatial correlation map visualization
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
- [ ] Report generation and export for legal use
