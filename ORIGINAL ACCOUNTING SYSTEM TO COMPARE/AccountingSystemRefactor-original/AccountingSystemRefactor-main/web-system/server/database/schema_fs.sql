CREATE TABLE fs_accounts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    acct_code VARCHAR(30) NOT NULL UNIQUE,
    acct_desc VARCHAR(150) NOT NULL,
    acct_type VARCHAR(30) NULL,
    group_code VARCHAR(30) NULL,
    sub_group VARCHAR(30) NULL,
    formula VARCHAR(10) NULL DEFAULT 'DC',
    open_bal DECIMAL(18,2) NOT NULL DEFAULT 0,
    cur_debit DECIMAL(18,2) NOT NULL DEFAULT 0,
    cur_credit DECIMAL(18,2) NOT NULL DEFAULT 0,
    end_bal DECIMAL(18,2) NOT NULL DEFAULT 0,
    gl_report VARCHAR(30) NULL,
    gl_effect VARCHAR(30) NULL,
    schedule VARCHAR(30) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    legacy_row_hash VARCHAR(128) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE fs_checkmas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    j_ck_no VARCHAR(50) NOT NULL,
    j_date DATE NOT NULL,
    j_payee VARCHAR(200) NULL,
    j_particulars VARCHAR(500) NULL,
    j_status VARCHAR(30) NOT NULL DEFAULT 'U',
    legacy_row_hash VARCHAR(128) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE fs_checkvou (
    id INT IDENTITY(1,1) PRIMARY KEY,
    j_ck_no VARCHAR(50) NOT NULL,
    acct_code VARCHAR(30) NOT NULL,
    j_ck_amt DECIMAL(18,2) NOT NULL DEFAULT 0,
    j_d_or_c VARCHAR(1) NOT NULL DEFAULT 'D',
    legacy_row_hash VARCHAR(128) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE fs_cashrcpt (
    id INT IDENTITY(1,1) PRIMARY KEY,
    j_jv_no VARCHAR(50) NOT NULL,
    j_date DATE NOT NULL,
    acct_code VARCHAR(30) NOT NULL,
    j_ck_amt DECIMAL(18,2) NOT NULL DEFAULT 0,
    j_d_or_c VARCHAR(1) NOT NULL DEFAULT 'D',
    legacy_row_hash VARCHAR(128) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE fs_salebook (
    id INT IDENTITY(1,1) PRIMARY KEY,
    j_jv_no VARCHAR(50) NOT NULL,
    j_date DATE NOT NULL,
    acct_code VARCHAR(30) NOT NULL,
    j_ck_amt DECIMAL(18,2) NOT NULL DEFAULT 0,
    j_d_or_c VARCHAR(1) NOT NULL DEFAULT 'D',
    legacy_row_hash VARCHAR(128) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE fs_purcbook (
    id INT IDENTITY(1,1) PRIMARY KEY,
    j_jv_no VARCHAR(50) NOT NULL,
    j_date DATE NOT NULL,
    acct_code VARCHAR(30) NOT NULL,
    j_ck_amt DECIMAL(18,2) NOT NULL DEFAULT 0,
    j_d_or_c VARCHAR(1) NOT NULL DEFAULT 'D',
    legacy_row_hash VARCHAR(128) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE fs_adjstmnt (
    id INT IDENTITY(1,1) PRIMARY KEY,
    j_jv_no VARCHAR(50) NOT NULL,
    j_date DATE NOT NULL,
    acct_code VARCHAR(30) NOT NULL,
    j_ck_amt DECIMAL(18,2) NOT NULL DEFAULT 0,
    j_d_or_c VARCHAR(1) NOT NULL DEFAULT 'D',
    legacy_row_hash VARCHAR(128) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE fs_journals (
    id INT IDENTITY(1,1) PRIMARY KEY,
    j_jv_no VARCHAR(50) NOT NULL,
    j_date DATE NOT NULL,
    acct_code VARCHAR(30) NOT NULL,
    j_ck_amt DECIMAL(18,2) NOT NULL DEFAULT 0,
    j_d_or_c VARCHAR(1) NOT NULL DEFAULT 'D',
    legacy_row_hash VARCHAR(128) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE fs_pournals (
    id INT IDENTITY(1,1) PRIMARY KEY,
    j_jv_no VARCHAR(50) NOT NULL,
    j_date DATE NULL,
    acct_code VARCHAR(30) NOT NULL,
    j_ck_amt DECIMAL(18,2) NOT NULL DEFAULT 0,
    j_d_or_c VARCHAR(1) NOT NULL DEFAULT 'D',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE fs_effects (
    id INT IDENTITY(1,1) PRIMARY KEY,
    acct_code VARCHAR(30) NOT NULL,
    gl_report VARCHAR(30) NULL,
    gl_effect VARCHAR(30) NULL,
    sequence INT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE fs_schedule (
    id INT IDENTITY(1,1) PRIMARY KEY,
    acct_code VARCHAR(30) NOT NULL,
    schedule VARCHAR(30) NULL,
    sequence INT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE fs_sys_id (
    id INT IDENTITY(1,1) PRIMARY KEY,
    pres_mo INT NOT NULL,
    pres_yr INT NOT NULL,
    beg_date DATE NOT NULL,
    end_date DATE NOT NULL,
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE INDEX ix_fs_accounts_acct_code ON fs_accounts(acct_code);
CREATE INDEX ix_fs_checkmas_j_ck_no ON fs_checkmas(j_ck_no);
CREATE INDEX ix_fs_checkvou_j_ck_no ON fs_checkvou(j_ck_no);
CREATE INDEX ix_fs_checkvou_acct_code ON fs_checkvou(acct_code);
CREATE INDEX ix_fs_cashrcpt_j_jv_no ON fs_cashrcpt(j_jv_no);
CREATE INDEX ix_fs_salebook_j_jv_no ON fs_salebook(j_jv_no);
CREATE INDEX ix_fs_purcbook_j_jv_no ON fs_purcbook(j_jv_no);
CREATE INDEX ix_fs_adjstmnt_j_jv_no ON fs_adjstmnt(j_jv_no);
CREATE INDEX ix_fs_journals_j_jv_no ON fs_journals(j_jv_no);
CREATE INDEX ix_fs_journals_date ON fs_journals(j_date);
CREATE INDEX ix_fs_pournals_j_jv_no ON fs_pournals(j_jv_no);
CREATE INDEX ix_fs_pournals_acct_code ON fs_pournals(acct_code);
CREATE INDEX ix_fs_effects_acct_code ON fs_effects(acct_code);
CREATE INDEX ix_fs_schedule_acct_code ON fs_schedule(acct_code);
