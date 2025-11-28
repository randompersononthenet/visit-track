# VisitTrack Development Roadmap
## Bureau of Jail Management and Penology – Agoo District Jail
**Project Duration:** 15 Weeks  
**Development Methodology:** Scrumban (Scrum + Kanban Hybrid)  
**Prepared by:** Aedrian R. Sagap, et al.  
**Date:** November 2025  

---

## 1. Overview

The following roadmap outlines the phased development of **VisitTrack**, a LAN-based visitor monitoring system for BJMP Agoo District Jail.  
It translates the system’s SRS and PRD into actionable technical milestones, deliverables, and sprint-based tasks.

Each phase includes clear objectives, deliverables, evaluation checkpoints, and responsible roles.  
This roadmap will guide both development and project documentation up to system defense.

---

### Progress Update (Nov 2025)
- Implemented: Registration (visitors/personnel) with QR, Scan with check-in/out and violation checks, Visit Logs UI/API, Reports CSV with filters (visitors, personnel, visit-logs), RBAC (server + client gating), Dashboard summary metrics, API contract updated.
- In progress next: Dashboard expansion (recent activity, 7-day check-ins chart), Reports PDF generation, RBAC hardening (no-permission UX, stricter write gating for officers).

---

## 2. High-Level Timeline

| Phase | Weeks | Description | Key Deliverables |
|--------|--------|-------------|------------------|
| **Phase 1** | Weeks 1–2 | System Setup & Design | Architecture, schema, and wireframes |
| **Phase 2** | Weeks 3–5 | Core Modules (Registration + QR) | Visitor & Personnel registration |
| **Phase 3** | Weeks 6–8 | Logging & Violation System | Check-in/out + security alert features |
| **Phase 4** | Weeks 9–10 | Analytics & Forecasting | Dashboard & moving average |
| **Phase 5** | Weeks 11–12 | Reports & RBAC | PDF/CSV exports + access control |
| **Phase 6** | Weeks 13–14 | Testing & Optimization | UAT, bug fixes, tuning |
| **Phase 7** | Week 15 | Final Evaluation & Documentation | PSSUQ testing + final report |

---

## 3. Phase Breakdown

### **Phase 1: System Setup and Design (Weeks 1–2)**

**Objectives:**
- Establish the foundational project environment.  
- Finalize database schema and UI prototypes.

**Tasks:**
- Initialize Git repository and configure project folders.  
- Set up local PostgreSQL database and test connectivity.  
- Define entity-relationship diagram (ERD).  
- Build low-fidelity wireframes for all user interfaces.  
- Configure project dependencies (React, Express, Tailwind, etc.).  
- Prepare Trello board with Scrumban workflow.

**Deliverables:**
- Working development environment  
- ERD diagram  
- Approved UI wireframes  
- Updated Trello board setup

**Milestone:** System architecture and schema validated.

---

### **Phase 2: Registration & QR Generation (Weeks 3–5)**

**Objectives:**
- Develop visitor and personnel registration modules.  
- Implement automatic QR code generation.

**Tasks:**
- Create registration forms with input validation.  
- Connect backend API endpoints to PostgreSQL.  
- Integrate `qrcode.react` for QR creation.  
- Store generated QR codes in visitor and personnel records.  
- Implement CRUD operations (Create, Read, Update, Delete).  
- Conduct internal module testing.

**Deliverables:**
- Visitor registration functional  
- Personnel registration functional  
- QR codes generated per record  
- Local database populated with test data

**Milestone:** Successful registration and QR generation demo.

---

### **Phase 3: QR Logging & Violation System (Weeks 6–8)**

**Objectives:**
- Enable check-in/out functionality and security flagging.

**Tasks:**
- Integrate `jsQR` for scanning via webcam or USB reader.  
- Implement check-in/out logic with timestamp recording.  
- Build Visit Log and Violation Record tables.  
- Add alert system (pop-up + sound) for flagged visitors.  
- Conduct basic error handling (invalid QR, duplicates).  
- Perform integration testing between modules.

**Deliverables:**
- Check-in/out scanning fully functional  
- Violation alerts working  
- Audit trail logging enabled  

**Milestone:** System capable of full visitor lifecycle management.

---

### **Phase 4: Analytics & Visitor Forecasting (Weeks 9–10)**

**Objectives:**
- Visualize visit and attendance data.  
- Implement visitor forecasting using the moving average method.

**Tasks:**
- Develop admin dashboard using Chart.js.  
- Generate graphs for visitor volume, peak hours, and attendance.  
- Implement backend endpoint for forecasting algorithm.  
- Display predictive visitor traffic graph.  
- Validate moving average calculations with test datasets.

**Deliverables:**
- Interactive analytics dashboard  
- Working forecasting module  
- Visualization verified for accuracy  

**Milestone:** Analytics and forecasting dashboard approved.

---

### **Phase 5: Reports & Role-Based Access Control (Weeks 11–12)**

**Objectives:**
- Add exportable reports and secure access control system.

**Tasks:**
- Implement PDF/CSV report generation using PDFKit.  
- Add filters by date, visitor, or personnel.  
- Set up JWT authentication for login sessions.  
- Integrate bcrypt for password hashing.  
- Create admin, officer, and staff role permissions.  
- Conduct internal security testing.

**Deliverables:**
- Fully functional report module  
- Role-based access control (RBAC) system operational  
- Encrypted user authentication  

**Milestone:** System ready for user acceptance testing.

---

### **Phase 6: Testing, Optimization, and Debugging (Weeks 13–14)**

**Objectives:**
- Validate all system functionalities.  
- Optimize performance and ensure stability.

**Tasks:**
- Conduct **unit testing** per module.  
- Perform **integration and stress testing**.  
- Gather user feedback through pilot testing.  
- Fix detected bugs and optimize query performance.  
- Prepare user guide documentation.

**Deliverables:**
- Bug-free stable build  
- User guide/manual draft  
- UAT report from test personnel  

**Milestone:** UAT approval and stable system release.

---

### **Phase 7: Final Evaluation and Documentation (Week 15)**

**Objectives:**
- Conduct final evaluation and system presentation.

**Tasks:**
- Administer **PSSUQ usability evaluation** to 60 BJMP personnel.  
- Compute mean scores and analyze results.  
- Compile technical report and appendices.  
- Prepare presentation slides and defense documents.  

**Deliverables:**
- PSSUQ evaluation results  
- Final manuscript and technical documentation  
- Defense presentation materials  

**Milestone:** Project defense-ready and documentation complete.

---

## 4. Roles and Responsibilities

| Role | Name/Team | Responsibilities |
|------|------------|------------------|
| **Project Leader / Full-stack Dev** | Aedrian R. Sagap | System architecture, backend integration, and testing |
| **Frontend Developer** | Team Member 1 | UI implementation and React module design |
| **Backend Developer** | Team Member 2 | API logic, database connectivity |
| **QA / Tester** | Team Member 3 | Test plan design and evaluation |
| **Documentation Lead** | Team Member 4 | SRS, PRD, and report compilation |

*(Adjust names as needed based on your team composition.)*

---

## 5. Tools and Technologies

| Category | Tools |
|-----------|--------|
| **Frontend** | React.js, Tailwind CSS, Chart.js |
| **Backend** | Node.js (Express), Socket.IO |
| **Database** | PostgreSQL + Sequelize |
| **Version Control** | Git, GitHub |
| **Task Board** | Trello (Scrumban) |
| **Testing** | Postman, Manual QA |
| **Documentation** | Markdown, LaTeX |
| **Reporting** | PDFKit, CSV Export |
| **Analytics** | Chart.js |
| **Forecasting** | Moving Average Algorithm |

---

## 6. Evaluation Metrics

| Metric | Description | Target |
|---------|--------------|--------|
| **Usability** | PSSUQ mean score | ≥3.40 |
| **Performance** | QR scan response time | ≤2 seconds |
| **Reliability** | System uptime | ≥99% |
| **Accuracy** | Record correctness | ≥98% |
| **Security** | Unauthorized access | 0 incidents |

---

## 7. Future Scalability Path

Upon successful defense and deployment, VisitTrack can evolve into:
- **Web-based version** with secure cloud hosting.  
- **Multi-branch integration** across BJMP facilities.  
- **Mobile app companion** for real-time monitoring.  
- **AI module** for predictive violation analysis.

---

**End of Document**
