# VisitTrack – Online Pre-Registration Integration Plan

## 1. Purpose

This document defines the design and implementation plan for an **optional online pre-registration module** to support the VisitTrack system.

The goal is to **reduce on-site data entry time** for BJMP personnel **without compromising security**, **LAN isolation**, or system integrity.

VisitTrack remains a **LAN-based system** and the **sole system of record**.

---

## 2. Design Principles (Non-Negotiable)

1. VisitTrack **must remain LAN-isolated**.
2. No external system may directly access VisitTrack.
3. External data is considered **untrusted** until reviewed.
4. All integrations are **pull-based**, never push-based.
5. Final approval and authority remain with BJMP personnel.

---

## 3. System Overview

The solution introduces a **separate online pre-registration web application** hosted on Supabase. This application only collects preliminary visitor information.

VisitTrack will provide a **manual import function** that allows staff to pull pending pre-registrations into the system for review and approval.

There is **no live synchronization** and **no direct exposure** of the LAN system.

---

## 4. System Components

### 4.1 Online Pre-Registration Web App (Supabase)

**Purpose:** Visitor data intake only

- Hosted online (Supabase)
- Accessible via any internet connection
- Does NOT require access to BJMP LAN
- Does NOT communicate directly with VisitTrack

**Characteristics:**
- Simple form interface
- No authentication required for visitors
- Stores records as **UNVERIFIED**

---

### 4.2 VisitTrack (LAN-Based System)

**Purpose:** Verification, approval, and official record keeping

- Hosted on a LAN-isolated environment
- Not publicly accessible
- Acts as the **system of record**
- Provides a staff-only import interface

---

## 5. Data Flow

### 5.1 Visitor Pre-Registration Flow

1. Visitor accesses the online pre-registration web app.
2. Visitor enters basic visit information.
3. Data is saved to the online database with status `PENDING`.
4. No further processing occurs online.

---

### 5.2 Staff Import and Approval Flow

1. BJMP staff opens VisitTrack.
2. Staff selects **Import Pending Pre-Registrations**.
3. VisitTrack performs an **outbound request** to fetch pending records.
4. Imported records appear in a **staging view**.
5. Staff reviews each record.
6. Staff either:
   - Approves the record → becomes an official VisitTrack entry
   - Rejects the record → discarded

---

## 6. Data Model

### 6.1 Online Database Table: `pre_registrations`

**Fields:**
- `id`
- `full_name`
- `contact_number`
- `purpose_of_visit`
- `intended_visit_date`
- `created_at`
- `status` (`PENDING`, `IMPORTED`, `REJECTED`)

**Restrictions:**
- No government IDs
- No photos
- No sensitive personal data

Sensitive information is collected **only during on-site verification**.

---

## 7. Security Considerations

- VisitTrack never accepts inbound connections from the internet.
- All external data is treated as untrusted.
- Import requires manual staff action.
- No automatic synchronization is implemented.
- Internet exposure is limited to the pre-registration web app only.

This approach preserves LAN isolation while allowing controlled use of modern web tools.

---

## 8. Scope Limitations

The following are **explicitly out of scope**:

- Real-time data synchronization
- Automatic approvals
- QR codes containing personal data
- External system push access
- Public APIs for VisitTrack

Any additional features must be evaluated separately.

---

## 9. Summary

This design provides a **practical compromise** between operational convenience and security requirements.

- Visitors may pre-register online for convenience.
- BJMP personnel retain full control over approval.
- VisitTrack remains secure, LAN-based, and authoritative.

This solution reduces registration time while respecting institutional and technical constraints.

---

**End of Document**

