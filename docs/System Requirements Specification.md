# System Requirements Specification (SRS)
## for
# VisitTrack: A LAN-Based Visitor Monitoring System
### for the Bureau of Jail Management and Penology (BJMP)
---

### Document Version
**Version:** 1.0  
**Date:** November 2025  
**Authors:** Aedrian R. Sagap, et al.  
**Institution:** Don Mariano Marcos Memorial State University – South La Union Campus  
**Degree Program:** Bachelor of Science in Computer Science  

---

## 1. Introduction

### 1.1 Purpose
This System Requirements Specification (SRS) defines the functional and non-functional requirements for **VisitTrack**, a LAN-based visitor monitoring system designed for the **Bureau of Jail Management and Penology (BJMP), Agoo District Jail**.  
The primary purpose of this document is to guide the system’s design, development, and evaluation phases, ensuring alignment with institutional objectives, user needs, and data security standards.

### 1.2 Scope
VisitTrack aims to replace the manual visitor logbook system with a secure, automated, and analytics-driven platform.  
The system will:
- Digitize visitor and personnel registration.
- Automate attendance and visit tracking through unique QR codes.
- Enhance security through violation flagging and access control.
- Generate analytics and predictive reports using the moving average method.

The system operates entirely within the **Local Area Network (LAN)** of the BJMP facility, ensuring data isolation, security, and operational reliability.

### 1.3 Definitions, Acronyms, and Abbreviations
- **BJMP:** Bureau of Jail Management and Penology  
- **PDL:** Person Deprived of Liberty  
- **LAN:** Local Area Network  
- **RBAC:** Role-Based Access Control  
- **PSSUQ:** Post-Study System Usability Questionnaire  
- **QR Code:** Quick Response Code  
- **Scrumban:** A hybrid of Scrum and Kanban methodologies  
- **UAT:** User Acceptance Testing  

### 1.4 References
Derived from the final manuscript titled *VisitTrack: A LAN-Based Visitor Monitoring System for the Bureau of Jail Management and Penology*, October 2025, College of Computer Science, DMMMSU–SLUC.

---

## 2. Overall Description

### 2.1 Product Perspective
VisitTrack is an independent, LAN-based system that operates within BJMP’s internal network.  
It consists of multiple client terminals connected to a centralized local server that hosts the database and backend logic.

The architecture follows a **client-server model**:
- **Frontend (Client):** React.js web interface for BJMP personnel.
- **Backend (Server):** Node.js (Express.js) API server with PostgreSQL database.
- **LAN Deployment:** Ensures local accessibility, low latency, and enhanced security.

### 2.2 Product Functions
The system provides the following major functions:
1. **Visitor Registration** – Register visitors and generate unique QR codes.
2. **Personnel Registration** – Record BJMP personnel details and attendance.
3. **QR Code Check-in/Check-out** – Log entry/exit via QR scanning.
4. **Security Violation Flagging** – Automatically alert personnel of flagged visitors.
5. **Attendance Logging** – Record staff entry and exit.
6. **Reports Generation** – Generate reports in PDF/CSV format.
7. **Data Analytics Dashboard** – Display metrics like visit frequency and trends.
8. **Visitor Forecasting** – Predict future visitor volumes using the moving average method.
9. **RBAC Security** – Restrict access by user roles (Admin, Officer, Staff).

### 2.3 User Characteristics
| User Role | Description | Access Level |
|------------|-------------|--------------|
| **Administrator** | Manages user accounts, backups, and reports. | Full Access |
| **Gate Officer** | Handles visitor and personnel scanning. | Operational Access |
| **Administrative Staff** | Views logs and generates reports. | Limited Access |

Users are assumed to have basic computer literacy and familiarity with BJMP’s current manual procedures.

### 2.4 Constraints
- System is **LAN-based only** and not connected to the internet.  
- Must comply with the **Data Privacy Act of 2012 (RA 10173)**.  
- Deployment limited to BJMP hardware infrastructure.  
- Must operate under typical jail network conditions (limited bandwidth, restricted hardware).  

### 2.5 Assumptions and Dependencies
- All client terminals have stable LAN connections.  
- QR code scanners are operational and compatible.  
- PostgreSQL server runs continuously within the jail’s local environment.  
- User feedback during UAT will guide system refinements.

---

## 3. System Features

### 3.1 Visitor and Personnel Registration
**Description:** Allows secure registration of visitors and personnel. Generates a unique QR code per individual.  
**Inputs:** Name, contact info, ID, relationship to PDL, or assigned role.  
**Outputs:** Unique QR code; confirmation of record creation.  
**Functional Requirements:**
- FR1.1: The system shall store registration details in PostgreSQL.
- FR1.2: The system shall generate a unique, non-duplicable QR code per record.

---

### 3.2 QR Code Check-in/Check-out
**Description:** Allows visitors and personnel to check in and out through QR code scanning.  
**Functional Requirements:**
- FR2.1: The system shall log the exact timestamp of every scan.
- FR2.2: The system shall store check-in and check-out times in the visit log table.
- FR2.3: The system shall restrict access to valid, registered users only.

---

### 3.3 Security Violation Flag
**Description:** Automatically detects and alerts staff of visitors with previous security incidents.  
**Functional Requirements:**
- FR3.1: The system shall cross-reference scanned QR codes with the Violation Record table.
- FR3.2: The system shall trigger a visual and auditory alert for flagged visitors.

---

### 3.4 Attendance Logging
**Description:** Records personnel attendance automatically through QR scans.  
**Functional Requirements:**
- FR4.1: The system shall generate daily attendance summaries.
- FR4.2: The system shall allow report generation by date, role, or shift.

---

### 3.5 Reports Generation
**Description:** Enables the generation of visitor, personnel, and violation reports.  
**Functional Requirements:**
- FR5.1: The system shall export reports in PDF and CSV formats.
- FR5.2: Reports shall include filters for date range, PDL, or personnel.

---

### 3.6 Data Analytics & Visitor Forecasting
**Description:** Provides data visualization and predictive analytics.  
**Functional Requirements:**
- FR6.1: The system shall use the moving average method to forecast future visitor traffic.
- FR6.2: The system shall display analytics using Chart.js visualizations.

---

### 3.7 Role-Based Access Control (RBAC)
**Description:** Enforces security by restricting access to modules by role.  
**Functional Requirements:**
- FR7.1: Only authorized users shall access sensitive modules.
- FR7.2: Authentication shall use bcrypt for password hashing and JWT for token management.

---

## 4. External Interface Requirements

### 4.1 User Interface
- **Framework:** React.js with Tailwind CSS.  
- **Design:** Responsive, minimalist, and accessible.  
- **Components:**  
  - Dashboard (analytics, recent logs)  
  - Registration forms  
  - QR scan module  
  - Report viewer and export dialog  

### 4.2 Hardware Interface
- Local server with PostgreSQL.
- Client computers connected through LAN.
- USB or camera-based QR scanners.

### 4.3 Software Interface
- **Database:** PostgreSQL  
- **Cache:** Redis  
- **Libraries:** Sequelize, Chart.js, jsQR, qrcode.react, jsonwebtoken, bcrypt  
- **Version Control:** Git & GitHub  

### 4.4 Communications Interface
- Operates solely via LAN.
- Real-time updates through Socket.IO.

---

## 5. Non-Functional Requirements

| Category | Requirement |
|-----------|--------------|
| **Performance** | System must handle up to 1,000 visitor records and 60 concurrent users. |
| **Security** | All data stored locally; encrypted; RBAC enforced. |
| **Reliability** | Must recover automatically after local network interruptions. |
| **Maintainability** | Modular architecture using RESTful APIs. |
| **Usability** | Must achieve ≥ 3.40 mean on PSSUQ evaluation. |
| **Scalability** | Capable of transitioning to a web-deployed architecture if required. |

---

## 6. Other Requirements

### 6.1 Ethical and Legal Compliance
- Compliance with the **Data Privacy Act of 2012 (RA 10173)**.  
- Ethical clearance from the **DMMMSU Research Ethics Committee**.  
- Secure handling and anonymization of test data.  

### 6.2 Evaluation and Testing
- **Testing Tools:** Postman, manual unit testing, and UAT checklist.  
- **Usability Evaluation:** PSSUQ with total enumeration of 60 personnel.  
- **Success Criteria:** Mean PSSUQ score between 1.00 and 3.40 (High Usability).  

---

## 7. Appendices

### 7.1 Tools and Frameworks
- React.js  
- Tailwind CSS  
- Express.js  
- PostgreSQL  
- Redis  
- Socket.IO  
- Chart.js  
- Sequelize ORM  

### 7.2 Development Methodology
**Scrumban** – blending iterative sprint planning with Kanban’s continuous flow.  
Stages include:
1. Backlog  
2. Impact Analysis  
3. Build  
4. User Acceptance Testing  
5. Release  
6. Documentation  
7. Done  

---

**End of Document**
