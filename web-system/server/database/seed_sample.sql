-- =============================================================
--  SAMPLE DATA SEED  (15 employees for payroll testing)
--  Run against accounting.db  (SQLite)
--  Period: January 1–15, 2026  (pres_mo=1, pres_yr=2026)
--  b_rate = MONTHLY salary (m_daily_wage = 0 → monthly mode)
-- =============================================================

-- -----------------------------------------------------------
-- 1.  Update system header
-- -----------------------------------------------------------
UPDATE pay_sys_id SET
    sys_nm      = 'SAMPLE COMPANY INC.',
    beg_date    = '2026-01-01',
    end_date    = '2026-01-15',
    pres_mo     = 1,
    pres_yr     = 2026,
    pay_type    = 1,
    m_daily_wage = 0,
    trn_ctr     = 1,
    trn_upd     = 0,
    trn_prc     = 0,
    hdmf_pre    = 0.02,
    pg_lower    = 1500,
    pg_higher   = 5000,
    pg_lwper    = 0.01,
    pg_hiper    = 0.02,
    updated_at  = CURRENT_TIMESTAMP
WHERE Id = 1;

-- -----------------------------------------------------------
-- 2.  Departments  (01 Admin · 02 Operations · 03 Finance)
-- -----------------------------------------------------------
INSERT OR IGNORE INTO pay_dept (dep_no, dep_nm, emp_ctr, updated_at)
VALUES
  ('01', 'ADMINISTRATION', 0, CURRENT_TIMESTAMP),
  ('02', 'OPERATIONS',     0, CURRENT_TIMESTAMP),
  ('03', 'FINANCE',        0, CURRENT_TIMESTAMP);

-- -----------------------------------------------------------
-- 3.  Employees  (skip if emp_no already exists)
-- -----------------------------------------------------------
INSERT OR IGNORE INTO pay_master (
    emp_no, emp_nm, dep_no, position,
    b_rate, cola, emp_stat, status,
    date_hire,
    sss_no, tin_no, phic_no, pgbg_no,
    sss_member, pgbg,
    -- loans
    sln_bal, hdmf_bal, comp_bal,
    -- monthly accumulators start at 0
    m_basic, m_gross, m_ssee, m_sser, m_medee, m_meder, m_pgee, m_pger,
    m_ecer, m_tax, m_netpay,
    -- yearly accumulators start at 0
    y_gross, y_tax, y_ssee, y_sser, y_medee, y_meder, y_pgee, y_pger, y_ecer,
    -- personal info
    birthdate, address,
    sick_leave, vacation_leave,
    created_at, updated_at
) VALUES
-- 1  Director · ADMIN
('SD0001','SAMPLE DATA 1','01','DIRECTOR',
 80000.00,0.00,'R',NULL,'2015-03-15',
 '34-1234567-1','123-456-789-000','121234567890','121234567890',
 1,1,
 0,0,0,
 0,0,0,0,0,0,0,0,0,0,0,
 0,0,0,0,0,0,0,0,0,
 '1980-06-15','123 Rizal St., Makati City',
 15.00,15.00,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- 2  Manager · ADMIN  (has SSS salary loan)
('SD0002','SAMPLE DATA 2','01','MANAGER',
 45000.00,0.00,'R',NULL,'2016-07-01',
 '34-2345678-2','234-567-890-001','122345678901','122345678901',
 1,1,
 30000,0,0,
 0,0,0,0,0,0,0,0,0,0,0,
 0,0,0,0,0,0,0,0,0,
 '1985-09-22','456 Mabini Ave., Quezon City',
 10.00,10.00,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- 3  Staff · ADMIN
('SD0003','SAMPLE DATA 3','01','STAFF',
 32000.00,0.00,'R',NULL,'2018-01-10',
 '34-3456789-3','345-678-901-002','123456789012','123456789012',
 1,1,
 0,0,0,
 0,0,0,0,0,0,0,0,0,0,0,
 0,0,0,0,0,0,0,0,0,
 '1990-03-05','789 Luna Rd., Pasig City',
 10.00,10.00,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- 4  Staff · ADMIN  (1-day absence in timecard)
('SD0004','SAMPLE DATA 4','01','STAFF',
 30000.00,0.00,'R',NULL,'2019-04-20',
 '34-4567890-4','456-789-012-003','124567890123','124567890123',
 1,1,
 0,0,0,
 0,0,0,0,0,0,0,0,0,0,0,
 0,0,0,0,0,0,0,0,0,
 '1992-11-30','321 Bonifacio Blvd., Mandaluyong',
 10.00,10.00,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- 5  Supervisor · OPERATIONS
('SD0005','SAMPLE DATA 5','02','SUPERVISOR',
 38000.00,0.00,'R',NULL,'2017-06-15',
 '34-5678901-5','567-890-123-004','125678901234','125678901234',
 1,1,
 0,0,0,
 0,0,0,0,0,0,0,0,0,0,0,
 0,0,0,0,0,0,0,0,0,
 '1988-04-18','654 Del Pilar St., Taguig City',
 10.00,10.00,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- 6  Worker · OPERATIONS  (OT + Night Shift Diff)
('SD0006','SAMPLE DATA 6','02','WORKER',
 25000.00,0.00,'R',NULL,'2019-08-01',
 '34-6789012-6','678-901-234-005','126789012345','126789012345',
 1,1,
 0,0,0,
 0,0,0,0,0,0,0,0,0,0,0,
 0,0,0,0,0,0,0,0,0,
 '1993-07-25','987 Burgos St., Pasay City',
 10.00,10.00,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- 7  Worker · OPERATIONS  (1-day absence)
('SD0007','SAMPLE DATA 7','02','WORKER',
 22000.00,0.00,'R',NULL,'2020-02-14',
 '34-7890123-7','789-012-345-006','127890123456','127890123456',
 1,1,
 0,0,0,
 0,0,0,0,0,0,0,0,0,0,0,
 0,0,0,0,0,0,0,0,0,
 '1994-12-08','111 Aguinaldo Rd., Caloocan City',
 10.00,10.00,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- 8  Worker · OPERATIONS  (OT)
('SD0008','SAMPLE DATA 8','02','WORKER',
 23500.00,0.00,'R',NULL,'2020-05-18',
 '34-8901234-8','890-123-456-007','128901234567','128901234567',
 1,1,
 0,0,0,
 0,0,0,0,0,0,0,0,0,0,0,
 0,0,0,0,0,0,0,0,0,
 '1993-02-14','222 Magsaysay Ave., Valenzuela',
 10.00,10.00,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- 9  Worker · OPERATIONS  (2-day absence)
('SD0009','SAMPLE DATA 9','02','WORKER',
 21000.00,0.00,'R',NULL,'2021-01-04',
 '34-9012345-9','901-234-567-008','129012345678','129012345678',
 1,1,
 0,0,0,
 0,0,0,0,0,0,0,0,0,0,0,
 0,0,0,0,0,0,0,0,0,
 '1995-08-20','333 Marcos Hwy., Antipolo',
 10.00,10.00,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- 10 Helper · OPERATIONS  (casual, no tax)
('SD0010','SAMPLE DATA 10','02','HELPER',
 18000.00,0.00,'C',NULL,'2022-06-01',
 '34-0123456-0','012-345-678-009','120123456789','120123456789',
 1,1,
 0,0,0,
 0,0,0,0,0,0,0,0,0,0,0,
 0,0,0,0,0,0,0,0,0,
 '1998-03-11','444 Katipunan Rd., Quezon City',
 5.00,5.00,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- 11 Accountant · FINANCE  (OT, HDMF loan)
('SD0011','SAMPLE DATA 11','03','ACCOUNTANT',
 55000.00,0.00,'R',NULL,'2016-03-01',
 '34-1122334-1','111-222-333-010','131122334455','131122334455',
 1,1,
 0,15000,0,
 0,0,0,0,0,0,0,0,0,0,0,
 0,0,0,0,0,0,0,0,0,
 '1987-05-30','555 C. Palanca St., Makati City',
 15.00,15.00,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- 12 Bookkeeper · FINANCE  (company loan)
('SD0012','SAMPLE DATA 12','03','BOOKKEEPER',
 48000.00,0.00,'R',NULL,'2017-11-20',
 '34-2233445-2','222-333-444-011','132233445566','132233445566',
 1,1,
 0,0,20000,
 0,0,0,0,0,0,0,0,0,0,0,
 0,0,0,0,0,0,0,0,0,
 '1989-10-14','666 Salcedo St., Makati City',
 10.00,10.00,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- 13 Analyst · FINANCE  (OT)
('SD0013','SAMPLE DATA 13','03','ANALYST',
 35000.00,0.00,'R',NULL,'2019-09-09',
 '34-3344556-3','333-444-555-012','133344556677','133344556677',
 1,1,
 0,0,0,
 0,0,0,0,0,0,0,0,0,0,0,
 0,0,0,0,0,0,0,0,0,
 '1991-01-27','777 Ayala Ave., Makati City',
 10.00,10.00,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- 14 Staff · FINANCE  (Night Shift)
('SD0014','SAMPLE DATA 14','03','STAFF',
 33000.00,0.00,'R',NULL,'2020-07-13',
 '34-4455667-4','444-555-666-013','134455667788','134455667788',
 1,1,
 0,0,0,
 0,0,0,0,0,0,0,0,0,0,0,
 0,0,0,0,0,0,0,0,0,
 '1993-06-03','888 EDSA, Mandaluyong City',
 10.00,10.00,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- 15 Encoder · FINANCE  (casual, no tax)
('SD0015','SAMPLE DATA 15','03','ENCODER',
 20000.00,0.00,'C',NULL,'2023-03-06',
 '34-5566778-5','555-666-777-014','135566778899','135566778899',
 1,1,
 0,0,0,
 0,0,0,0,0,0,0,0,0,0,0,
 0,0,0,0,0,0,0,0,0,
 '1997-09-17','999 Shaw Blvd., Pasig City',
 5.00,5.00,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- -----------------------------------------------------------
-- 4.  Timecards  (trn_flag = 'U' = unprocessed → run Compute)
--     b_rate is MONTHLY;  hrate = b_rate / 240
--     reg_pay = (b_rate/2) – (abs_hrs * hrate)  [computed by engine]
--     rot_pay = rot_hrs * hrate * 1.25           [computed by engine]
--     All computed pay fields are left 0 here.
-- -----------------------------------------------------------
DELETE FROM pay_tmcard WHERE emp_no LIKE 'SD%';

INSERT INTO pay_tmcard (
    emp_no, emp_nm, dep_no,
    -- hours / inputs
    reg_hrs, abs_hrs, rot_hrs, sphp_hrs, spot_hrs,
    lghp_hrs, lgot_hrs, nsd_hrs, lv_hrs, ls_hrs,
    oth_pay1, oth_pay2, oth_pay3, oth_pay4,
    -- loan deductions (manual entry)
    sln_ded, hdmf_ded, cal_ded, comp_ded, comd_ded,
    oth_ded1,oth_ded2,oth_ded3,oth_ded4,oth_ded5,
    oth_ded6,oth_ded7,oth_ded8,oth_ded9,oth_ded10,
    tax_add, withbonus,
    -- computed fields (left 0, filled by /api/payroll/compute)
    reg_pay,rot_pay,sphp_pay,spot_pay,lghp_pay,lgot_pay,nsd_pay,
    lv_pay,lv2_pay,ls_pay,grs_pay,abs_ded,
    sss_ee,sss_er,med_ee,med_er,pgbg_ee,pgbg_er,ec_er,
    tax_ee,tot_ded,net_pay,bonus,bonustax,
    trn_flag, period_year, period_month,
    created_at, updated_at
) VALUES
-- SD0001 Director  80k/mo · 16 OT hrs · no absence
('SD0001','SAMPLE DATA 1','01',
 104,0,16,0,0, 0,0,0,0,0,
 0,0,0,0,
 0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,
 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
 'U',2026,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- SD0002 Manager  45k/mo · 8 OT hrs · SSS loan ded 1,000
('SD0002','SAMPLE DATA 2','01',
 104,0,8,0,0, 0,0,0,0,0,
 0,0,0,0,
 1000,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,
 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
 'U',2026,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- SD0003 Staff    32k/mo · no OT · no absence
('SD0003','SAMPLE DATA 3','01',
 104,0,0,0,0, 0,0,0,0,0,
 0,0,0,0,
 0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,
 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
 'U',2026,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- SD0004 Staff    30k/mo · 1-day absence (8 hrs)
('SD0004','SAMPLE DATA 4','01',
 96,8,0,0,0, 0,0,0,0,0,
 0,0,0,0,
 0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,
 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
 'U',2026,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- SD0005 Supervisor 38k/mo · 16 OT hrs
('SD0005','SAMPLE DATA 5','02',
 104,0,16,0,0, 0,0,0,0,0,
 0,0,0,0,
 0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,
 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
 'U',2026,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- SD0006 Worker   25k/mo · 8 OT hrs · 8 NSD hrs
('SD0006','SAMPLE DATA 6','02',
 104,0,8,0,0, 0,0,8,0,0,
 0,0,0,0,
 0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,
 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
 'U',2026,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- SD0007 Worker   22k/mo · 1-day absence  
('SD0007','SAMPLE DATA 7','02',
 96,8,0,0,0, 0,0,0,0,0,
 0,0,0,0,
 0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,
 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
 'U',2026,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- SD0008 Worker   23.5k/mo · 8 OT hrs
('SD0008','SAMPLE DATA 8','02',
 104,0,8,0,0, 0,0,0,0,0,
 0,0,0,0,
 0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,
 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
 'U',2026,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- SD0009 Worker   21k/mo · 2-day absence
('SD0009','SAMPLE DATA 9','02',
 88,16,0,0,0, 0,0,0,0,0,
 0,0,0,0,
 0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,
 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
 'U',2026,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- SD0010 Helper   18k/mo · casual · no OT
('SD0010','SAMPLE DATA 10','02',
 104,0,0,0,0, 0,0,0,0,0,
 0,0,0,0,
 0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,
 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
 'U',2026,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- SD0011 Accountant 55k/mo · 8 OT hrs · HDMF loan ded 1,500
('SD0011','SAMPLE DATA 11','03',
 104,0,8,0,0, 0,0,0,0,0,
 0,0,0,0,
 0,1500,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,
 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
 'U',2026,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- SD0012 Bookkeeper 48k/mo · company loan ded 2,000
('SD0012','SAMPLE DATA 12','03',
 104,0,0,0,0, 0,0,0,0,0,
 0,0,0,0,
 0,0,0,2000,0, 0,0,0,0,0,0,0,0,0,0, 0,0,
 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
 'U',2026,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- SD0013 Analyst   35k/mo · 8 OT hrs
('SD0013','SAMPLE DATA 13','03',
 104,0,8,0,0, 0,0,0,0,0,
 0,0,0,0,
 0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,
 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
 'U',2026,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- SD0014 Staff (Finance) 33k/mo · 16 NSD hrs
('SD0014','SAMPLE DATA 14','03',
 104,0,0,0,0, 0,0,16,0,0,
 0,0,0,0,
 0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,
 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
 'U',2026,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

-- SD0015 Encoder  20k/mo · casual · no OT
('SD0015','SAMPLE DATA 15','03',
 104,0,0,0,0, 0,0,0,0,0,
 0,0,0,0,
 0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,
 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
 'U',2026,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- -----------------------------------------------------------
-- 5.  Verify
-- -----------------------------------------------------------
SELECT 'pay_master sample rows: ' || COUNT(*) FROM pay_master WHERE emp_no LIKE 'SD%';
SELECT 'pay_tmcard sample rows: ' || COUNT(*) FROM pay_tmcard WHERE emp_no LIKE 'SD%';
SELECT 'pay_dept rows: '          || COUNT(*) FROM pay_dept;
SELECT 'sys_nm: ' || sys_nm, 'period: ' || pres_mo || '/' || pres_yr FROM pay_sys_id LIMIT 1;
