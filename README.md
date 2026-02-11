# VisitTrack

A visitor management and analytics system for facilities. This repository contains the client (React), server (Express/Sequelize), and a public pre-registration microapp.

## Key Features
- **Live Visitor Monitoring** — Real-time tracking of on-site visitors and personnel.
- **Visitor and Personnel Registration** — Capture details, photos, and check-ins.
- **Visit Logs & Reports** — Searchable logs, trends, and export options.
- **Role-based Access** — Granular permissions for Admin, Staff, Officer, Warden, Analyst, and custom roles.
- **Forecasting** — Next-day visitor forecast with Moving Average or Holt–Winters.
- **Pre-registration** — Public-facing microapp for visitors to pre-register.

## Recent Features

### Live Visitor Monitoring
- **Real-time Dashboard:** View all currently on-site visitors and personnel in the Scan view.
- **Manual Checkout:** Administrators can manually check out visitors who forgot to scan out.
- **Active Visits API:** `GET /api/scan/active` retrieves the current list of active visits.

### Enhanced Role Management
- **Dynamic Roles:** Create and manage custom roles with specific permissions.
- **Granular Permissions:** Fine-grained control over access to features (e.g., `scan:perform`, `visitors:view`, `reports:read`).
- **User Management:** Assign roles to users and manage their access.

### Archived Views
- **Integrated Archives:** Toggle to view archived visitors and personnel directly within the main management views.
- **Restoration:** Easily restore archived records.

### Forecasting & Analytics
- **Actionable Forecasts:** Dashboard badges indicate expected visitor volume (Low, Normal, High, Spike).
- **Advanced Metrics:** MAPE confidence levels and baseline comparisons.

## Tech Stack

### Client (`/client`)
- **Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS
- **State Management:** React Hooks
- **Routing:** React Router v6
- **HTTP Client:** Axios

### Server (`/server`)
- **Runtime:** Node.js
- **Framework:** Express
- **Database:** PostgreSQL (Sequelize ORM)
- **Authentication:** JWT, bcrypt
- **Validation:** Zod

### Pre-registration (`/prereg-online`)
- **Framework:** Next.js

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- npm/yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/randompersononthenet/visit-track.git
    cd visit-track
    ```

2.  **Server Setup**
    ```bash
    cd server
    npm install
    # Configure .env (see .env.example)
    npm run dev
    ```

3.  **Client Setup**
    ```bash
    cd client
    npm install
    # Configure .env (see .env.example)
    npm run dev
    ```

4.  **Pre-registration Setup (Optional)**
    ```bash
    cd prereg-online
    npm install
    npm run dev
    ```

## License
[MIT](LICENSE)
