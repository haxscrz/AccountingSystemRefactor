# Accounting System — Web Application

A full-stack, browser-based accounting system that modernizes a legacy dBASE/FoxPro desktop application. The system covers two major functional modules: **Financial System (FS)** and **Payroll System (PAY)**, with full support for Philippine statutory compliance (BIR, SSS, Pag-IBIG, PhilHealth).

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Modules & Features](#modules--features)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
- [Legacy Data Migration](#legacy-data-migration)
- [API Overview](#api-overview)
- [Default Credentials](#default-credentials)

---

## Project Overview

This system was built as a migration of a legacy dBASE/FoxPro accounting application into a modern web platform. It preserves all original business logic and computation rules while providing a browser-based UI with a familiar ribbon-style navigation interface.

Key goals:
- Replace the desktop `.PRG`-based system with a fully web-accessible application
- Retain all payroll computation parity (tax brackets, 13th month, year-end BIR)
- Support legacy `.DBF` data file import for historical data migration
- Run as a self-contained local application — no cloud services required

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI component framework |
| TypeScript | 5.3 | Strongly-typed JavaScript |
| Vite | 5.0 | Build tool and dev server |
| React Router DOM | 6.21 | Client-side routing |
| TanStack React Query | 5.20 | Server state, data fetching & caching |
| Zustand | 4.4 | Global client state management |
| Axios | 1.6 | HTTP API client |
| jsPDF + AutoTable | 2.5 / 5.0 | PDF report generation |
| xlsx | 0.18 | Excel file export |
| dbffile | 1.12 | Reading legacy dBASE `.DBF` files |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| ASP.NET Core | 9.0 | REST API web framework |
| C# | 13 / .NET 9 | Server-side language |
| Entity Framework Core | 9.0 | ORM — database access & migrations |
| SQLite | — | Embedded single-file database |
| Microsoft.AspNetCore.OpenApi | 9.0 | API documentation (Swagger/OpenAPI) |

---

## Architecture

```
Browser (React SPA)
       │
       │  HTTP /api/*
       ▼
ASP.NET Core 9 REST API  (port 5081)
       │
       │  Entity Framework Core
       ▼
SQLite Database  (accounting.db)
       │
       │  Legacy seed scripts (Node.js)
       ▼
Legacy .DBF Files  (dBASE/FoxPro source data)
```

**Key design decisions:**

- **Single deployable unit** — The React frontend is built into static files and served directly by the ASP.NET backend. In production, only one process is needed.
- **Dev proxy** — During development, Vite runs on port 3000 and proxies all `/api` requests to the backend on port 5081, eliminating CORS issues.
- **Runtime schema patching** — On startup, `Program.cs` checks for missing database columns and applies patches automatically, allowing the server to handle incremental schema changes without running `dotnet ef` migrations manually.
- **Legacy import pipeline** — A Node.js script reads source `.DBF` files and converts them to JSON, which a seeding service then loads into SQLite on first run.

---

## Project Structure

```
web-system/
├── src/                          # Frontend source (React + TypeScript)
│   ├── pages/
│   │   ├── Login.tsx             # Authentication screen
│   │   ├── Dashboard.tsx         # Module selector
│   │   ├── FSSystem.tsx          # Financial System root
│   │   └── PayrollSystem.tsx     # Payroll System root (ribbon nav + router)
│   ├── components/
│   │   ├── payroll/              # 21 payroll feature components
│   │   ├── fs/                   # 11 financial system components
│   │   ├── RibbonNav.tsx         # Shared ribbon navigation bar
│   │   └── ModalPortal.tsx       # React portal for modal dialogs
│   └── index.css                 # Global CSS variables & base styles
├── public/
│   └── migrated/                 # JSON files output from legacy DBF import
├── scripts/
│   ├── import-legacy-data.mjs    # Step 1: Read .DBF → JSON
│   └── seed-legacy.mjs           # Step 2: POST JSON → API (seeds SQLite)
├── server/
│   └── AccountingApi/            # ASP.NET Core 9 backend
│       ├── Controllers/
│       │   ├── AuthController.cs
│       │   ├── FSController.cs
│       │   ├── PayrollController.cs
│       │   ├── AdminController.cs
│       │   └── LegacyMigrationController.cs
│       ├── Services/
│       │   ├── PayrollComputationService.cs
│       │   ├── TimecardService.cs
│       │   ├── FSJournalService.cs
│       │   ├── FSPostingService.cs
│       │   ├── FSMonthEndService.cs
│       │   ├── FSReportService.cs
│       │   ├── FSVoucherService.cs
│       │   ├── FSAccountService.cs
│       │   ├── EmployeeService.cs
│       │   ├── LegacyDataService.cs
│       │   ├── LegacySeedingService.cs
│       │   └── DatabaseSeeder.cs
│       ├── Models/
│       │   └── PayEntities.cs    # EF Core entity models
│       ├── Data/
│       │   ├── AccountingDbContext.cs
│       │   └── Migrations/       # EF Core migration files
│       ├── Program.cs            # App startup, DI, middleware, schema patches
│       ├── appsettings.json
│       └── accounting.db         # SQLite database file
├── vite.config.ts                # Vite config (port 3000, /api proxy)
├── tsconfig.json
└── package.json
```

---

## Modules & Features

### Financial System (FS)

| Component | Description |
|---|---|
| Chart of Accounts | Account code CRUD with group/subsidiary assignment |
| Group Codes | Account group definitions |
| Subsidiary Groups | Sub-account grouping maintenance |
| Journal Entry | General journal with debit/credit lines |
| Voucher Entry | Cash voucher entry |
| Posting | Post journal entries to ledger |
| Month-End Closing | Period close process |
| Query Browser | Ledger and transaction query interface |
| Reports | Financial report generation |

### Payroll System (PAY)

| Component | Description |
|---|---|
| Employee Master | Full employee CRUD — 5-screen form (personal, compensation, government IDs, etc.) |
| Timecard Entry | Semi-monthly, monthly, daily pay type timecards (33-field form) |
| Timecard Query | Browse and filter timecard records |
| Payroll Compute | Compute payroll with real-time progress; casual employee tax dialog |
| 13th Month Compute | Annual 13th month bonus computation per BIR rules |
| Year-End Tax Compute | BIR year-end income tax computation |
| Post Transactions | Post computed payroll to financial ledger |
| SSS / Pag-IBIG Entry | Government contribution record maintenance |
| Tax Table Edit | BIR tax bracket CRUD (active/inactive) |
| Department Edit | Department CRUD with financial totals view |
| Update Employee Rate | Bulk salary adjustment by department / union / salary range |
| Append from Datafile | Import timecards from CSV file |
| Edit Employee Number | Rename employee codes |
| Initialize Timecard | Set up timecard period for new payroll cycle |
| Initialize New Year | Year-end accumulator reset for new fiscal year |
| System ID Edit | Payroll system configuration (company name, current period, payroll parameters) |
| Backup Databases | Database backup utility |
| Payroll Reports | Payroll register, payslip, and summary reports |

---

## Prerequisites

Ensure the following are installed before setup:

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| .NET SDK | 9.0+ | [dotnet.microsoft.com](https://dotnet.microsoft.com/download) |

---

## Setup & Installation

### 1. Install Frontend Dependencies

```bash
cd web-system
npm install
```

### 2. Build the Backend

```bash
cd web-system/server/AccountingApi
dotnet build
```

The backend creates `accounting.db` (SQLite) automatically on first run. No manual database setup is required.

---

## Running the Application

### Development Mode (two terminals)

**Terminal 1 — Backend:**
```bash
cd web-system/server/AccountingApi
dotnet run
# API available at http://localhost:5081
```

**Terminal 2 — Frontend:**
```bash
cd web-system
npm run dev
# App available at http://localhost:3000
```

### Production Mode (single process)

```bash
cd web-system
npm run build
# Outputs static files to dist/

cd web-system/server/AccountingApi
dotnet run
# Serves both API and static frontend from http://localhost:5081
```

---

## Legacy Data Migration

If you have the original `.DBF` source files from the legacy dBASE/FoxPro system, you can import historical data:

**Source folders expected:**
- `FS/CTSI/DATA/` — Financial system DBF files
- `PAY/RANK/` — Payroll rank/regular employee data
- `PAY/OTHR/` — Payroll other/casual employee data

**Step 1 — Convert DBF to JSON:**
```bash
cd web-system
npm run import:legacy
# Output: public/migrated/*.json + public/migrated/manifest.json
```

**Step 2 — Seed JSON into SQLite:**
```bash
npm run seed:legacy
# Posts migrated JSON data to the running API
```

**Or run both steps together:**
```bash
npm run setup:legacy
```

**Migration API endpoints (for validation):**
- `GET /api/LegacyMigration/manifest` — Lists all imported datasets
- `GET /api/LegacyMigration/dataset/{key}` — Returns a specific dataset

---

## API Overview

All API routes are prefixed with `/api`.

| Controller | Base Route | Description |
|---|---|---|
| AuthController | `/api/auth` | Login, session |
| FSController | `/api/fs` | Financial system CRUD + operations |
| PayrollController | `/api/payroll` | Payroll CRUD + computation endpoints |
| AdminController | `/api/admin` | Admin utilities |
| LegacyMigrationController | `/api/LegacyMigration` | Legacy data access |

Swagger/OpenAPI documentation is available at `http://localhost:5081/swagger` when running in development mode.

---

## Default Credentials

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin` |

---

## Philippine Compliance Notes

This system is designed for Philippine payroll compliance:

- **BIR (Bureau of Internal Revenue)** — Tax tables, year-end ITR computation, 13th month pay
- **SSS (Social Security System)** — Contribution records and bracket schedules
- **Pag-IBIG (HDMF)** — Housing fund contribution records
- **PhilHealth** — Health insurance contribution records

Tax tables and bracket rates are fully configurable through the Tax Table Edit screen and are not hardcoded.
