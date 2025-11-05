# Product Requirements Document (PRD)
## for
# VisitTrack: A LAN-Based Visitor Monitoring System
### Bureau of Jail Management and Penology – Agoo District Jail
---

**Version:** 1.0  
**Date:** November 2025  
**Authors:** Aedrian R. Sagap, et al.  
**Institution:** Don Mariano Marcos Memorial State University – South La Union Campus  
**Program:** BS Computer Science  
**Methodology:** Scrumban  

---

## 1. Product Overview

### 1.1 Summary
**VisitTrack** is a LAN-based visitor monitoring system designed to digitize and automate the Bureau of Jail Management and Penology’s (BJMP) manual logbook process. The system enables QR code-based visitor and personnel tracking, real-time logging, violation flagging, analytics, and visitor forecasting.

This PRD defines the **key features, user experience flow, milestones, success criteria, and deliverables** necessary to translate the approved SRS into a working prototype and final product.

---

## 2. Objectives and Success Metrics

### 2.1 Objectives
- Replace manual logbooks with a secure digital logging system.  
- Reduce logging and verification time by at least **60%**.  
- Ensure complete visitor data accuracy and integrity.  
- Generate analytics for administrative insights.  
- Achieve **High Usability (≥3.40 mean)** on the PSSUQ evaluation.

### 2.2 Key Metrics
| Metric | Target |
|--------|--------|
| System Uptime | 99% within local environment |
| Log Processing Time | ≤2 seconds per scan |
| Database Accuracy | ≥98% correct entries |
| Usability (PSSUQ) | ≥3.40 mean score |
| Violation Detection Accuracy | 100% on known flagged visitors |

---

## 3. Target Users and Personas

### 3.1 Administrator
**Goal:** Manage users, system backups, and reports.  
**Pain Points:** Manual backups, lost visitor records, and human error.  
**Success Criteria:** Seamless report generation and data recovery.

### 3.2 Gate Officer
**Goal:** Quickly log and verify visitors and personnel using QR codes.  
**Pain Points:** Slow manual verification and visitor queues.  
**Success Criteria:** QR scans and alerts within seconds.

### 3.3 Administrative Staff
**Goal:** View analytics, generate reports, and monitor trends.  
**Pain Points:** Time-consuming data analysis.  
**Success Criteria:** Accessible, one-click report generation and visualization.

---

## 4. Core Features and Requirements

### 4.1 Visitor Management
- Register visitor details (name, address, PDL relation, contact info).
- Generate and print unique QR codes per visitor.
- Store historical visit logs and blacklist status.

### 4.2 Personnel Management
- Register BJMP personnel details and roles.
- Generate individual QR codes for attendance.
- Maintain attendance records per shift.

### 4.3 Check-in/Check-out Module
- Scan QR codes for entry/exit using camera or scanner.
- Display visitor name, purpose, and validity.
- Prevent unauthorized entry or duplicate scans.

### 4.4 Violation Flagging
- Cross-check visitor ID with violation records.
- Trigger alert (visual + sound) on flagged entry.
- Allow officers to record violation notes.

### 4.5 Attendance Monitoring
- Automatically log personnel attendance.
- Generate attendance summaries by date or shift.

### 4.6 Reports and Analytics
- Generate PDF and CSV reports.
- Display charts of visitor frequency, peak times, and personnel attendance.
- Predict future visitor volume using **moving average forecasting**.

### 4.7 Role-Based Access Control (RBAC)
- Three main roles: Admin, Officer, Staff.
- RBAC enforced through JWT authentication.
- Passwords hashed using bcrypt.

---

## 5. System Architecture Overview

### 5.1 Architecture Model
**Architecture:** Client-Server within LAN  
- **Frontend:** React.js + Tailwind CSS  
- **Backend:** Node.js (Express.js)  
- **Database:** PostgreSQL with Sequelize ORM  
- **Cache:** Redis  
- **Realtime:** Socket.IO  
- **Reports:** PDFKit + CSV Export  
- **QR Handling:** `jsQR`, `qrcode.react`  

### 5.2 Deployment
- Runs on BJMP local server.  
- Accessed by LAN-connected client terminals.  
- Offline-first; no external dependencies.

---

## 6. User Experience Flow (UX)

### 6.1 Visitor Flow
1. Visitor registers at front desk → System generates QR code.  
2. On next visit, visitor presents QR code → officer scans code.  
3. System verifies visitor, logs entry, and checks for violations.  
4. Upon exit, QR code is scanned again for time-out logging.  
5. Admin can later generate reports and view visitor trends.

### 6.2 Personnel Flow
1. Personnel scans their assigned QR code at start of shift.  
2. System logs attendance (date, time-in).  
3. At end of shift, personnel scans again for time-out.  
4. Admin staff view and export attendance summary.

---

## 7. Technical Requirements

| Category | Specification |
|-----------|----------------|
| **Frontend** | React.js, Tailwind CSS, Chart.js |
| **Backend** | Express.js (Node.js), Socket.IO |
| **Database** | PostgreSQL + Sequelize ORM |
| **Authentication** | JWT + bcrypt |
| **QR Processing** | jsQR, qrcode.react |
| **Reporting** | PDFKit, CSV Export |
| **Version Control** | Git & GitHub |
| **Project Board** | Trello (Scrumban workflow) |
| **Testing Tools** | Postman, UAT Checklist |
| **Evaluation Tool** | PSSUQ |

---

## 8. Development Plan and Roadmap

### 8.1 Methodology: Scrumban
Scrumban combines **Scrum’s sprint structure** with **Kanban’s continuous flow**, ideal for small teams managing academic software development.

**Core Workflow Stages:**
1. **Backlog** – Requirement analysis and feature listing.  
2. **Impact Analysis** – Prioritization based on need and feasibility.  
3. **Build** – Development of modules in mini-sprints.  
4. **UAT** – User Acceptance Testing per module.  
5. **Release** – Internal deployment within LAN.  
6. **Documentation** – Final reporting and evaluation.  
7. **Done** – Final handover and presentation.

---

### 8.2 Development Phases

| Phase | Duration | Deliverables |
|--------|-----------|--------------|
| **Phase 1: Setup and Design** | 2 weeks | Database schema, UI wireframes, architecture setup |
| **Phase 2: Registration & QR Generation** | 3 weeks | Visitor and personnel registration modules |
| **Phase 3: Scanning & Logging** | 3 weeks | Check-in/out, attendance, and violation flagging |
| **Phase 4: Analytics & Forecasting** | 2 weeks | Dashboard with charts and moving average predictions |
| **Phase 5: Reports & RBAC** | 2 weeks | PDF/CSV reports, role-based access implementation |
| **Phase 6: Testing & Optimization** | 2 weeks | UAT, bug fixes, performance tuning |
| **Phase 7: Final Evaluation** | 1 week | PSSUQ evaluation and thesis documentation |

**Estimated Total Duration:** ~15 weeks  

---

## 9. Evaluation and Quality Assurance

### 9.1 Testing Plan
- **Unit Testing:** Conducted for each module.  
- **Integration Testing:** Ensures compatibility between modules.  
- **UAT:** Conducted with 60 BJMP personnel (total enumeration).  
- **Performance Testing:** Stress test for concurrent QR scans.  

### 9.2 Evaluation Criteria
| Metric | Method | Target |
|---------|---------|--------|
| Usability | PSSUQ | ≥3.40 (High Usability) |
| Accuracy | Manual verification | ≥98% correct log entries |
| Performance | Time measurement | ≤2 seconds per scan |
| Reliability | Downtime monitoring | ≤1% downtime |

---

## 10. Risks and Mitigation

| Risk | Impact | Mitigation Strategy |
|------|---------|---------------------|
| Network downtime | High | Implement auto-retry and local cache |
| Hardware scanner malfunction | Medium | Allow manual input backup |
| Data corruption | High | Daily local backups |
| User error | Medium | Provide training and tooltips |
| Feature creep | Medium | Enforce Scrumban backlog discipline |

---

## 11. Future Enhancements
- Cloud deployment option for inter-branch integration.  
- Biometric authentication for added security.  
- AI-based anomaly detection (visitor behavior analysis).  
- Mobile companion app for remote monitoring.  

---

## 12. Appendices

### 12.1 Tools
- **IDE:** Visual Studio Code  
- **Version Control:** GitHub  
- **Task Board:** Trello  
- **Database Tool:** pgAdmin  
- **Documentation:** Markdown + LaTeX (for reports)  

### 12.2 References
Based on *Final Manuscript – VisitTrack: A LAN-Based Visitor Monitoring System for BJMP Agoo District Jail*, October 2025.

---

**End of Document**
