# Accounting System - Setup and Migration Guide

## Prerequisites
- Node.js 20+
- .NET SDK 9.0+
- SQL Server Express 2022+

## Frontend Setup
1. Open terminal in `web-system`
2. Install packages:
   - `npm install`
3. Import legacy DBF data to JSON datasets:
   - `npm run import:legacy`
4. Run frontend:
   - `npm run dev`
5. Open `http://localhost:3000`

## Backend Setup
1. Open terminal in `web-system/server/AccountingApi`
2. Build API:
   - `dotnet build`
3. Run API:
   - `dotnet run`
4. API base URL:
   - `https://localhost:5001` or `http://localhost:5000`

## SQL Schema Setup
1. Open SQL Server Management Studio
2. Create database:
   - `CREATE DATABASE AccountingModern;`
3. Execute schema scripts in order:
   - `web-system/server/database/schema_fs.sql`
   - `web-system/server/database/schema_pay.sql`

## Data Migration (Legacy DBF)
- Source folders:
  - `FS/CTSI/DATA`
  - `PAY/RANK`
  - `PAY/OTHR`
- Migration output:
  - `web-system/public/migrated/manifest.json`
  - `web-system/public/migrated/*.json`

### Validation
- Imported dataset count is listed in `manifest.json`
- Frontend FS/PAY report pages load data from these migrated JSON files immediately
- Backend migration endpoints:
  - `GET /api/LegacyMigration/manifest`
  - `GET /api/LegacyMigration/dataset/{key}`

## Working Demo Credentials
- Username: `admin`
- Password: `admin`

## Notes
- Report preview is immediate and data-backed from migrated legacy records.
- Export buttons currently export CSV payload for downloaded report files.
- Full payroll tax/benefit computation parity with all PRG formulas is the next implementation phase.
