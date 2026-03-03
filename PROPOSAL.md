# PROJECT PROPOSAL
## Modernization of Financial Statements (FS) and Payroll (PAY) Systems

**Date:** February 25, 2026  
**Company:** CTSI  
**Document Type:** High-Level Functional Specification & Cost Estimate  

---

## EXECUTIVE SUMMARY

This proposal outlines the modernization of the existing legacy FS (Financial Statements) and PAY (Payroll) systems into a modern web-based application. The new system will maintain 100% functional parity with the current PRG-based programs while providing a contemporary user interface and improved data management capabilities.

**Key Benefits:**
- Modern, browser-based interface accessible from any device
- Maintains exact workflow and feature parity with legacy system
- Enhanced reporting with PDF and CSV/Excel export options
- Centralized SQL database replacing distributed DBF files
- Improved backup and recovery capabilities
- Multi-user support with role-based access control

---

## HIGH-LEVEL FUNCTIONAL SPECIFICATIONS

### 1. FINANCIAL STATEMENTS (FS) MODULE

#### 1.1 Data Entry & Processing
- **Cash Disbursement Voucher Entry** - Entry and validation of check disbursements
- **Cash Receipts Entry** - Recording of all cash receipt transactions
- **Sales Book Journals** - Sales transaction journal entries
- **Journal Vouchers** - General journal voucher entry
- **Purchase Book Journals** - Purchase transaction entries
- **Adjustments** - Period-end adjustment entries
- **Advance CDB Entry** - Pre-period check disbursement entry
- **Transaction Posting** - Post all transactions to general ledger accounts

#### 1.2 File Maintenance
- **Chart of Accounts Management** - Add, edit, delete account codes
- **Group Codes Management** - Balance sheet grouping maintenance
- **Subsidiary Groups** - Subsidiary schedule groupings
- **Reindex Operations** - Rebuild database indexes
- **Backup/Restore** - Database backup and recovery
- **Month-End Processing** - Period close with balance rollover
- **Advance CDB Transfer** - Transfer advance entries to current period

#### 1.3 Query & Reports
**Query Functions:**
- View spooled report files
- Browse chart of accounts
- Review vouchers and journal entries by type

**Reports:**
- Cash Disbursement Register (detailed and summary)
- Cash Receipts, Sales, Purchase, Journal, and Adjustment reports
- Detailed Trial Balance
- Trial Balance Summary
- Income Statement
- Balance Sheet
- Code file listings (Accounts, Groups, Schedules)

**Export Options:** PDF, CSV, Excel

---

### 2. PAYROLL (PAY) MODULE

#### 2.1 Core Processing
- **Payroll Type Selection** - Regular vs. Casual employee processing
- **Timecard Management** - Add/Edit/Initialize timecard data
- **Payroll Computation** - Calculate gross pay, deductions, net pay
- **Transaction Posting** - Post payroll to master and history files
- **OR/SBR Entry** - SSS and Pag-ibig certification data entry

#### 2.2 Deductions & Contributions
- Regular pay and overtime calculations (REOT, SPHP, SPOT, LGHP, LGOT, NSD)
- Withholding tax computation (graduated tax table)
- SSS premium (employee and employer share)
- PhilHealth/Medicare premium
- Pag-ibig/HDMF premium
- Configurable loan deductions (up to 5 types: Salary, Calamity, House, Company, COD)
- Other deductions (up to 10 configurable types)

#### 2.3 Year-End Processing
- **13th Month Pay Computation** - Automated bonus calculation with tax threshold
- **Year-End Tax Reconciliation** - Annualized tax computation with refund/additional
- **Bonus Processing** - Separate bonus runs with advance bonus support

#### 2.4 File Maintenance
- **Employee Master File** - Personal info, rates, loan balances, leave balances
- **Department Management** - Department codes and names
- **Tax Table Maintenance** - Update tax brackets and exemptions
- **System ID/Period Configuration** - Payroll period and system settings
- **Rate Adjustment** - Bulk or individual employee rate updates
- **Year Initialization** - Reset counters and year-to-date fields
- **Backup/Restore** - Pre/post-posting backup options

#### 2.5 Reports (40+ report types)

**Core Reports:**
- Timecard Validation
- Payroll Register
- Payroll Slips (all employees, selected, summary, ATM format)
- Denomination Breakdown

**Monthly Reports:**
- Monthly Payroll Recap
- SSS/PHIC/EC/Pag-ibig remittances (multiple formats)
- Tax withheld summary
- Departmental summary
- Loan deduction summaries (by type)
- SSS-LMS Diskette Project
- SSS R-3 Tape/Diskette Project
- HDMF Loan Diskette Project
- PhilHealth RF-1

**Quarterly Reports:**
- Quarterly SSS, PhilHealth, EC
- Quarterly Pag-ibig Premium
- Quarterly Withholding Tax
- Quarterly SSS Loan Payments
- Quarterly Pag-ibig Loan Payments
- Quarterly PHIC Remittance (Hard Copy and Diskette)

**Year-End Reports:**
- Year-End Payroll Recap
- Bonus Pay Sheet and Slips
- Tax Reconciliation Report
- Tax Refund Report and Slips
- BIR Tax Withheld Report
- Individual BIR W2 Forms
- Alpha List (BIR format)
- Form 1604CF - Schedule 7.1 and 7.3

**Master File Reports:**
- Employee Master List
- Personal Information
- Salary Rate Listing
- Loan Balance Report
- VL/SL Balance Report

**Premium Certification:**
- SSS Premium Payment Certification
- Medicare Premium Payment Certification
- Pag-ibig Premium Payment Certification

**Export Options:** PDF, CSV, Excel for all reports

---

### 3. TECHNICAL SPECIFICATIONS

#### 3.1 Technology Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** .NET 8 Web API (C#)
- **Database:** SQL Server 2022 Express (free, local installation)
- **Reporting:** Server-side PDF generation + CSV/Excel export
- **Deployment:** Local Windows Server (on-premises)

#### 3.2 Data Migration
- **DBF Import Utility** - One-time migration of existing DBF data to SQL Server
- **Data Validation** - Automated validation during import
- **Mapping Documentation** - Complete field mapping from legacy to new schema

#### 3.3 System Features
- **Multi-user Support** - Concurrent access with row-level locking
- **Role-Based Access** - Admin, Accounting, Payroll, Read-Only roles
- **Audit Trail** - Complete transaction logging
- **Automated Backup** - Scheduled SQL Server backups
- **Data Security** - Encrypted connections, password policies

---

## PROJECT TIMELINE & DELIVERABLES

### Phase 1: Foundation (4 weeks)
- Database schema design and creation
- DBF data migration utility
- Import and validate existing data
- **Deliverable:** Working database with imported legacy data

### Phase 2: FS Module (6 weeks)
- Backend API development (accounts, vouchers, journals, posting)
- Frontend UI implementation (ribbon navigation, entry screens)
- Report generation engine (all FS reports)
- **Deliverable:** Fully functional FS module with all features

### Phase 3: PAY Module (8 weeks)
- Backend API development (master, timecard, computation, posting)
- Tax, SSS, PHIC, Pag-ibig calculation engines
- Frontend UI implementation (timecard, reports)
- Report generation (all 40+ payroll reports)
- **Deliverable:** Fully functional PAY module with all features

### Phase 4: Integration & Testing (3 weeks)
- End-to-end testing (normal cycle, month-end, year-end)
- User acceptance testing (UAT)
- Performance optimization
- Bug fixes and refinements
- **Deliverable:** Production-ready system

### Phase 5: Deployment & Training (2 weeks)
- Production server setup and configuration
- Data migration from legacy to production
- User training (hands-on sessions)
- Documentation (user manual, admin guide)
- Go-live support
- **Deliverable:** Live system with trained users

**Total Duration: 23 weeks (approximately 5.5 months)**

---

## COST BREAKDOWN

### Development Costs

| Item | Details | Cost (PHP) |
|------|---------|------------|
| **Database Design & Migration** | Schema design, DBF import utility, data validation | ₱120,000 |
| **FS Module Development** | Complete accounting module (backend + frontend + reports) | ₱360,000 |
| **PAY Module Development** | Complete payroll module (backend + frontend + 40+ reports) | ₱480,000 |
| **Integration & Testing** | E2E testing, UAT, QA, bug fixes | ₱180,000 |
| **Deployment & Training** | Server setup, go-live, user training, documentation | ₱140,000 |
| **Project Management** | Coordination, stakeholder communication, delivery management | ₱80,000 |
| **Subtotal** | | **₱1,360,000** |

### Infrastructure Costs (One-Time)

| Item | Details | Cost (PHP) |
|------|---------|------------|
| **Development Server** | Mid-range Windows server for development/staging | ₱80,000 |
| **SQL Server License** | SQL Server 2022 Express (FREE) | ₱0 |
| **Development Tools** | Visual Studio, dev licenses | ₱30,000 |
| **Subtotal** | | **₱110,000** |

### Optional Add-Ons

| Item | Details | Cost (PHP) |
|------|---------|------------|
| **Mobile-Responsive Design** | Tablet/phone optimization | ₱120,000 |
| **Cloud Deployment** | Azure/AWS hosting instead of on-prem | ₱60,000 + monthly hosting |
| **Advanced Analytics Dashboard** | Charts, KPIs, trend analysis | ₱150,000 |
| **Multi-Company Support** | Manage multiple legal entities | ₱100,000 |

---

## TOTAL PROJECT COST

| Category | Amount (PHP) |
|----------|--------------|
| **Development** | ₱1,360,000 |
| **Infrastructure** | ₱110,000 |
| **TOTAL** | **₱1,470,000** |

**Payment Terms:**
- 30% upon contract signing (₱441,000)
- 30% upon Phase 2 completion (₱441,000)
- 30% upon Phase 4 completion (₱441,000)
- 10% upon go-live and acceptance (₱147,000)

---

## ASSUMPTIONS & SCOPE

**In Scope:**
- 100% feature parity with legacy FS and PAY programs
- All reports replicated with PDF/CSV/Excel export
- Data migration from existing DBF files
- Local Windows server deployment
- User training for up to 10 users
- 30 days post-launch support

**Out of Scope:**
- Hardware procurement (client to provide production server)
- Network infrastructure setup
- Features not present in legacy system
- Ongoing support/maintenance after 30-day period

**Ongoing Support (Optional):**
- Monthly retainer: ₱25,000/month
- Includes bug fixes, minor enhancements, user support

---

## RISK MITIGATION

| Risk | Mitigation Strategy |
|------|---------------------|
| Data migration errors | Comprehensive validation, test imports, parallel run period |
| User adoption resistance | Familiar UI design, comprehensive training, support period |
| Calculation discrepancies | Unit testing against legacy outputs, UAT validation |
| Timeline delays | Phased delivery, regular progress reviews, buffer time built in |

---

## ACCEPTANCE CRITERIA

The project will be considered complete when:
1. All FS and PAY features are implemented and tested
2. All reports produce output matching legacy system
3. Data migration is validated 100% accurate
4. UAT sign-off from designated users
5. Training completed for all users
6. Documentation delivered (user manual, admin guide, technical docs)
7. System runs successfully in production for 30 days

---

## NEXT STEPS

1. **Approval** - Review and approve this proposal
2. **Contract** - Sign development agreement
3. **Kickoff** - Initial meeting with stakeholders and users
4. **Discovery** - Detailed walkthrough of current system workflows
5. **Development** - Begin Phase 1

---

## CONTACT & APPROVALS

**Prepared by:** AI Development Team  
**Date:** February 25, 2026  

**For Approval:**
- [ ] Management Approval
- [ ] Finance Approval
- [ ] IT/Operations Approval

---

*This proposal is valid for 60 days from the date above.*
