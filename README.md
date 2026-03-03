# Accounting System

A web-based accounting system with Financial Statements (FS) and Payroll modules.

---

## Requirements

Make sure these are installed before running:

- [Node.js](https://nodejs.org) v18 or higher
- [.NET SDK](https://dotnet.microsoft.com/download) v9

---

## Quick Start (Recommended)

Double-click **`start.bat`** in the root folder.

It will automatically:
1. Install frontend dependencies (first run only)
2. Build the backend
3. Seed the legacy data
4. Start the backend and frontend in separate terminal windows
5. Open `http://localhost:3000` in your browser

> **Login:** username `admin` / password `admin`

---

## Manual Setup

If you prefer to run things yourself, open **three separate terminals**:

**Terminal 1  Backend**
```bash
cd web-system/server/AccountingApi
dotnet run
```

**Terminal 2  Frontend**
```bash
cd web-system
npm install          # first run only
npm run seed:legacy  # first run only
npm run dev
```

Then open your browser at `http://localhost:3000`.

---

## Ports

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:5081 |