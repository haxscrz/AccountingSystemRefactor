CREATE TABLE pay_master (
    id INT IDENTITY(1,1) PRIMARY KEY,
    emp_no VARCHAR(20) NOT NULL UNIQUE,
    emp_nm VARCHAR(160) NOT NULL,
    dep_no VARCHAR(30) NULL,
    position VARCHAR(100) NULL,
    b_rate DECIMAL(18,2) NOT NULL DEFAULT 0,
    cola DECIMAL(18,2) NOT NULL DEFAULT 0,
    emp_stat VARCHAR(10) NOT NULL DEFAULT 'R',
    status VARCHAR(10) NULL,
    date_hire DATE NULL,
    date_resign DATE NULL,
    
    -- Government IDs
    sss_no VARCHAR(30) NULL,
    tin_no VARCHAR(30) NULL,
    phic_no VARCHAR(30) NULL,
    pgbg_no VARCHAR(30) NULL,
    sss_member BIT NOT NULL DEFAULT 1,
    pgbg BIT NOT NULL DEFAULT 0,
    
    -- Loan Balances (5 types)
    sln_bal DECIMAL(18,2) NOT NULL DEFAULT 0,
    sln_amt DECIMAL(18,2) NOT NULL DEFAULT 0,
    sln_term INT NOT NULL DEFAULT 0,
    sln_date DATE NULL,
    
    hdmf_bal DECIMAL(18,2) NOT NULL DEFAULT 0,
    hdmf_amt DECIMAL(18,2) NOT NULL DEFAULT 0,
    hdmf_term INT NOT NULL DEFAULT 0,
    hdmf_date DATE NULL,
    
    cal_bal DECIMAL(18,2) NOT NULL DEFAULT 0,
    cal_amt DECIMAL(18,2) NOT NULL DEFAULT 0,
    cal_term INT NOT NULL DEFAULT 0,
    cal_date DATE NULL,
    
    comp_bal DECIMAL(18,2) NOT NULL DEFAULT 0,
    comp_amt DECIMAL(18,2) NOT NULL DEFAULT 0,
    comp_term INT NOT NULL DEFAULT 0,
    comp_date DATE NULL,
    
    comd_bal DECIMAL(18,2) NOT NULL DEFAULT 0,
    comd_amt DECIMAL(18,2) NOT NULL DEFAULT 0,
    comd_term INT NOT NULL DEFAULT 0,
    comd_date DATE NULL,
    
    -- Monthly Counters (18 fields)
    m_basic DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_cola DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_hol DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_ot DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_leave DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_gross DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_ssee DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_sser DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_medee DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_meder DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_pgee DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_pger DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_ecer DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_tax DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_othp1 DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_othp2 DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_othp3 DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_othp4 DECIMAL(18,2) NOT NULL DEFAULT 0,
    m_netpay DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    -- Quarterly Counters (5 fields × 3 months = 15)
    q1_gross DECIMAL(18,2) NOT NULL DEFAULT 0,
    q1_ssee DECIMAL(18,2) NOT NULL DEFAULT 0,
    q1_medee DECIMAL(18,2) NOT NULL DEFAULT 0,
    q1_pgee DECIMAL(18,2) NOT NULL DEFAULT 0,
    q1_tax DECIMAL(18,2) NOT NULL DEFAULT 0,
    q2_gross DECIMAL(18,2) NOT NULL DEFAULT 0,
    q2_ssee DECIMAL(18,2) NOT NULL DEFAULT 0,
    q2_medee DECIMAL(18,2) NOT NULL DEFAULT 0,
    q2_pgee DECIMAL(18,2) NOT NULL DEFAULT 0,
    q2_tax DECIMAL(18,2) NOT NULL DEFAULT 0,
    q3_gross DECIMAL(18,2) NOT NULL DEFAULT 0,
    q3_ssee DECIMAL(18,2) NOT NULL DEFAULT 0,
    q3_medee DECIMAL(18,2) NOT NULL DEFAULT 0,
    q3_pgee DECIMAL(18,2) NOT NULL DEFAULT 0,
    q3_tax DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    -- Yearly Counters (25+ fields)
    y_basic DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_cola DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_hol DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_ot DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_leave DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_gross DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_ssee DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_sser DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_medee DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_meder DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_pgee DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_pger DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_ecer DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_tax DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_othp1 DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_othp2 DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_othp3 DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_othp4 DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_bonus DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_btax DECIMAL(18,2) NOT NULL DEFAULT 0,
    y_netpay DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    -- Leave Credits
    sick_leave DECIMAL(10,2) NOT NULL DEFAULT 0,
    vacation_leave DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Personal Info
    spouse VARCHAR(160) NULL,
    address VARCHAR(300) NULL,
    birthdate DATE NULL,
    
    legacy_row_hash VARCHAR(128) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE pay_tmcard (
    id INT IDENTITY(1,1) PRIMARY KEY,
    emp_no VARCHAR(20) NOT NULL,
    emp_nm VARCHAR(160) NULL,
    dep_no VARCHAR(30) NULL,
    
    -- Earnings Fields (16 fields A-P)
    reg_hrs DECIMAL(10,2) NOT NULL DEFAULT 0,
    abs_hrs DECIMAL(10,2) NOT NULL DEFAULT 0,
    rot_hrs DECIMAL(10,2) NOT NULL DEFAULT 0,
    sphp_hrs DECIMAL(10,2) NOT NULL DEFAULT 0,
    spot_hrs DECIMAL(10,2) NOT NULL DEFAULT 0,
    lghp_hrs DECIMAL(10,2) NOT NULL DEFAULT 0,
    lgot_hrs DECIMAL(10,2) NOT NULL DEFAULT 0,
    nsd_hrs DECIMAL(10,2) NOT NULL DEFAULT 0,
    lv_hrs DECIMAL(10,2) NOT NULL DEFAULT 0,
    ls_hrs DECIMAL(10,2) NOT NULL DEFAULT 0,
    oth_pay1 DECIMAL(18,2) NOT NULL DEFAULT 0,
    oth_pay2 DECIMAL(18,2) NOT NULL DEFAULT 0,
    oth_pay3 DECIMAL(18,2) NOT NULL DEFAULT 0,
    oth_pay4 DECIMAL(18,2) NOT NULL DEFAULT 0,
    lv_cashout DECIMAL(18,2) NOT NULL DEFAULT 0,
    ls_cashout DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    -- Deduction Fields (17 fields Q-AG)
    sln_ded DECIMAL(18,2) NOT NULL DEFAULT 0,
    hdmf_ded DECIMAL(18,2) NOT NULL DEFAULT 0,
    cal_ded DECIMAL(18,2) NOT NULL DEFAULT 0,
    comp_ded DECIMAL(18,2) NOT NULL DEFAULT 0,
    comd_ded DECIMAL(18,2) NOT NULL DEFAULT 0,
    oth_ded1 DECIMAL(18,2) NOT NULL DEFAULT 0,
    oth_ded2 DECIMAL(18,2) NOT NULL DEFAULT 0,
    oth_ded3 DECIMAL(18,2) NOT NULL DEFAULT 0,
    oth_ded4 DECIMAL(18,2) NOT NULL DEFAULT 0,
    oth_ded5 DECIMAL(18,2) NOT NULL DEFAULT 0,
    oth_ded6 DECIMAL(18,2) NOT NULL DEFAULT 0,
    oth_ded7 DECIMAL(18,2) NOT NULL DEFAULT 0,
    oth_ded8 DECIMAL(18,2) NOT NULL DEFAULT 0,
    oth_ded9 DECIMAL(18,2) NOT NULL DEFAULT 0,
    oth_ded10 DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_add DECIMAL(18,2) NOT NULL DEFAULT 0,
    withbonus BIT NOT NULL DEFAULT 0,
    
    -- Computed Fields (populated by computation)
    reg_pay DECIMAL(18,2) NOT NULL DEFAULT 0,
    rot_pay DECIMAL(18,2) NOT NULL DEFAULT 0,
    sphp_pay DECIMAL(18,2) NOT NULL DEFAULT 0,
    spot_pay DECIMAL(18,2) NOT NULL DEFAULT 0,
    lghp_pay DECIMAL(18,2) NOT NULL DEFAULT 0,
    lgot_pay DECIMAL(18,2) NOT NULL DEFAULT 0,
    nsd_pay DECIMAL(18,2) NOT NULL DEFAULT 0,
    lv_pay DECIMAL(18,2) NOT NULL DEFAULT 0,
    lv2_pay DECIMAL(18,2) NOT NULL DEFAULT 0,
    ls_pay DECIMAL(18,2) NOT NULL DEFAULT 0,
    grs_pay DECIMAL(18,2) NOT NULL DEFAULT 0,
    abs_ded DECIMAL(18,2) NOT NULL DEFAULT 0,
    sss_ee DECIMAL(18,2) NOT NULL DEFAULT 0,
    sss_er DECIMAL(18,2) NOT NULL DEFAULT 0,
    med_ee DECIMAL(18,2) NOT NULL DEFAULT 0,
    med_er DECIMAL(18,2) NOT NULL DEFAULT 0,
    pgbg_ee DECIMAL(18,2) NOT NULL DEFAULT 0,
    pgbg_er DECIMAL(18,2) NOT NULL DEFAULT 0,
    ec_er DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_ee DECIMAL(18,2) NOT NULL DEFAULT 0,
    tot_ded DECIMAL(18,2) NOT NULL DEFAULT 0,
    net_pay DECIMAL(18,2) NOT NULL DEFAULT 0,
    bonus DECIMAL(18,2) NOT NULL DEFAULT 0,
    bonustax DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    trn_flag VARCHAR(1) NOT NULL DEFAULT 'U',
    period_year INT NOT NULL,
    period_month INT NOT NULL,
    
    legacy_row_hash VARCHAR(128) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE pay_history (
    id INT IDENTITY(1,1) PRIMARY KEY,
    emp_no VARCHAR(20) NOT NULL,
    period_year INT NOT NULL,
    period_month INT NOT NULL,
    gross_pay DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_ded DECIMAL(18,2) NOT NULL DEFAULT 0,
    net_pay DECIMAL(18,2) NOT NULL DEFAULT 0,
    posted_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    legacy_row_hash VARCHAR(128) NULL
);

CREATE TABLE pay_rates_audit (
    id INT IDENTITY(1,1) PRIMARY KEY,
    emp_no VARCHAR(20) NOT NULL,
    old_rate DECIMAL(18,2) NOT NULL,
    new_rate DECIMAL(18,2) NOT NULL,
    changed_by VARCHAR(80) NOT NULL,
    changed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    reason VARCHAR(300) NULL
);

CREATE TABLE pay_sys_id (
    id INT IDENTITY(1,1) PRIMARY KEY,
    pres_mo INT NOT NULL,
    pres_yr INT NOT NULL,
    beg_date DATE NOT NULL,
    end_date DATE NOT NULL,
    trn_ctr INT NOT NULL DEFAULT 0,
    trn_upd INT NOT NULL DEFAULT 0,
    trn_prc INT NOT NULL DEFAULT 0,
    hdmf_pre DECIMAL(10,4) NOT NULL DEFAULT 0.02,
    pg_lower DECIMAL(18,2) NOT NULL DEFAULT 1500,
    pg_higher DECIMAL(18,2) NOT NULL DEFAULT 5000,
    pg_lwper DECIMAL(10,4) NOT NULL DEFAULT 0.01,
    pg_hiper DECIMAL(10,4) NOT NULL DEFAULT 0.02,
    bon_days INT NOT NULL DEFAULT 22,
    bon_mont DECIMAL(10,2) NOT NULL DEFAULT 1,
    tax_bon DECIMAL(18,2) NOT NULL DEFAULT 90000,
    m_daily_wage BIT NOT NULL DEFAULT 0,
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE pay_taxtab (
    id INT IDENTITY(1,1) PRIMARY KEY,
    exemption VARCHAR(10) NOT NULL,
    salary DECIMAL(18,2) NOT NULL,
    peso DECIMAL(18,2) NOT NULL DEFAULT 0,
    percent DECIMAL(10,2) NOT NULL DEFAULT 0,
    sequence INT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE INDEX ix_pay_master_emp_no ON pay_master(emp_no);
CREATE INDEX ix_pay_master_dep_no ON pay_master(dep_no);
CREATE INDEX ix_pay_master_emp_stat ON pay_master(emp_stat);
CREATE INDEX ix_pay_tmcard_emp_no ON pay_tmcard(emp_no);
CREATE INDEX ix_pay_tmcard_emp_period ON pay_tmcard(emp_no, period_year, period_month);
CREATE INDEX ix_pay_tmcard_trn_flag ON pay_tmcard(trn_flag);
CREATE INDEX ix_pay_history_emp_period ON pay_history(emp_no, period_year, period_month);
CREATE INDEX ix_pay_taxtab_exemption ON pay_taxtab(exemption, sequence);
