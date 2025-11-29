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

## 8. Feature Spec: Printable ID (Visitors & Personnel)

**Objective:** Allow staff to generate a printable ID card for visitors and personnel that includes the QR code and key identity details. IDs must be printable directly and downloadable as an image file.

### Scope
- Applies to both `Visitors` and `Personnel` records.
- Single-record ID generation in Phase 1; batch/merge printing is optional (Phase 2).

### UX Flows
- From `Register` → after creating a record, show a "Generate ID" button alongside the QR preview.
- From `Visitors` and `Personnel` tables → action column adds "Generate ID" per row.
- Clicking opens a modal with an ID preview (credit-card aspect) and buttons: `Print`, `Download PNG`, `Close`.

### Data Shown
- For Visitors: Full name, ID number (if available), relation (if available), QR code.
- For Personnel: Full name, role title (if available), QR code.
- Common: System/agency name, optional logo placeholder, generated date.

### ID Layout
- Size: 3.375in x 2.125in (CR80, 1011x638 px @ 300 DPI equivalent for screen preview; print scales via CSS).
- Light/Dark agnostic design; force light theme for print stylesheet to maximize contrast on paper.
- Sections: Header (logo/name), Body (name + attribute lines), QR block, Footer (issued date).
- Placeholders: include three logo placeholders in the header (left, center, right) to accommodate agency seals/logos. These are neutral boxes until real assets are provided.

### Implementation Plan
- Frontend (React)
  - Add `Generate ID` button in `client/src/views/Register.tsx` (QR preview area) and in each row actions for `Register` and `Personnel` tables.
  - New shared component `PrintableIdCard` in `client/src/components/PrintableIdCard.tsx` that accepts props:
    - `type: 'visitor' | 'personnel'`
    - `fullName: string`
    - `secondaryLabel?: string` (e.g., `ID #xxxxx` or role title)
    - `qrValue: string`
    - `issuedAt?: string`
  - Modal container renders the component and provides actions:
    - `Print`: opens browser print for the card area only (print CSS targets card div).
    - `Download PNG`: uses `html-to-image` or `dom-to-image-more` to rasterize the card node and trigger download.
  - Add print stylesheet rules to force white background and hide app chrome.
- Backend
  - No API changes needed for Phase 1 (QR and details already available in records).
- Optional Phase 2 (Batch/Sheets)
  - Select multiple rows and generate a printable sheet (A4/Letter) with multiple IDs (n-up).
  - Add CSV/templating for mail-merge if required later.

### Photo ID Extension (Identity Image)

**Goal:** Include a face photo on the ID card and store it with the record to mitigate lending/theft misuse.

#### Capture & Upload (Frontend)
- Add photo capture to registration/edit forms in `client/src/views/Register.tsx` and `client/src/views/Personnel.tsx`:
  - Options: `Upload` (file input, jpg/png, ≤ 2 MB) or `Capture` via webcam (getUserMedia + canvas snapshot).
  - Provide square crop tool to 1:1 aspect ratio (simple center-crop acceptable for Phase 1).
  - Preview before save; allow replace/remove.
  - Enforcement: photo is required for both Visitors and Personnel before saving.
- On save, upload image first, then include stored URL/path in the create/update payload.

#### Storage (Backend)
- Add upload endpoint (Phase 1 simple local storage): `POST /api/uploads/image` returning `{ url }`.
- Validate: content-type (image/jpeg|png), size limit (e.g., 2 MB), basic scan.
- Save under server `uploads/` with unique filename; serve via static path `/uploads/*`.
- Future: pluggable storage (S3/minio) behind the same API.

#### Schema
- `visitors` table: add nullable `photoUrl TEXT`.
- `personnel` table: add nullable `photoUrl TEXT`.

#### ID Card Rendering
- `PrintableIdCard` accepts optional `photoUrl?: string`.
- Layout: left column photo (square 1:1, rounded subtle), right column name/secondary + QR below/right depending on space.
- If no photo available, show a neutral silhouette placeholder.

#### Verification UX (Later Phase)
- At scan result view (`client/src/views/Scan.tsx`), display stored photo for visual verification.
- Optional: add “Mark as suspected mismatch” note to the log (out of scope for Phase 1).

### Acceptance Criteria
- A `Generate ID` action exists for both Visitors and Personnel (per-row + post-create context).
- The modal preview shows QR and correct name + secondary label.
- `Print` prints only the card with proper margins; background is white; no app UI.
- `Download PNG` saves a clear, readable image (≥ 600px on the short edge).
- Works in both light and dark app themes; print output is always light.
- No backend changes required; feature functions offline (beyond existing APIs).
  
Photo ID specific:
- Registration/edit supports uploading or capturing a face image with preview and basic 1:1 center-crop.
- Photo is required for both Visitors and Personnel to complete registration or edits that remove a photo.
- Stored `photoUrl` is persisted on the record and appears on the ID card preview when present.
- Uploads are validated by size and type; images are accessible via served URLs.

### Risks & Considerations
- Browser print scaling differences; mitigate with explicit CSS size and margin.
- PNG rasterization quality; allow 2x scaling to improve clarity.
- Future requirement for official logo and officer signature space; reserve header space and leave placeholders.

### Tasks
- Add `PrintableIdCard` shared component.
- Wire actions and modal in `Register` and `Personnel` views.
- Add print CSS and image download utility.
- Optional: Multi-select batch print in tables (Phase 2).

**Milestone:** Staff can print or download a single ID card for any visitor/personnel record directly from the app.

---

**End of Document**
