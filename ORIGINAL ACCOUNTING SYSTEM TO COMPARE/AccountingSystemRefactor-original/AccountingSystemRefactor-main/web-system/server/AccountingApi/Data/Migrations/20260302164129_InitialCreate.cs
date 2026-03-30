using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AccountingApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "fs_accounts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    acct_code = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    acct_desc = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    acct_type = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    group_code = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    sub_group = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    formula = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    open_bal = table.Column<decimal>(type: "TEXT", nullable: false),
                    cur_debit = table.Column<decimal>(type: "TEXT", nullable: false),
                    cur_credit = table.Column<decimal>(type: "TEXT", nullable: false),
                    end_bal = table.Column<decimal>(type: "TEXT", nullable: false),
                    gl_report = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    gl_effect = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    schedule = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    is_active = table.Column<bool>(type: "INTEGER", nullable: false),
                    legacy_row_hash = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fs_accounts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fs_adjstmnt",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    j_jv_no = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    j_date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    acct_code = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    j_ck_amt = table.Column<decimal>(type: "TEXT", nullable: false),
                    j_d_or_c = table.Column<string>(type: "TEXT", maxLength: 1, nullable: false),
                    legacy_row_hash = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fs_adjstmnt", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fs_cashrcpt",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    j_jv_no = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    j_date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    acct_code = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    j_ck_amt = table.Column<decimal>(type: "TEXT", nullable: false),
                    j_d_or_c = table.Column<string>(type: "TEXT", maxLength: 1, nullable: false),
                    legacy_row_hash = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fs_cashrcpt", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fs_checkmas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    j_ck_no = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    j_date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    j_payee = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    j_particulars = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    j_status = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    legacy_row_hash = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fs_checkmas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fs_checkvou",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    j_ck_no = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    acct_code = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    j_ck_amt = table.Column<decimal>(type: "TEXT", nullable: false),
                    j_d_or_c = table.Column<string>(type: "TEXT", maxLength: 1, nullable: false),
                    legacy_row_hash = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fs_checkvou", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fs_journals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    j_jv_no = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    j_date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    acct_code = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    j_ck_amt = table.Column<decimal>(type: "TEXT", nullable: false),
                    j_d_or_c = table.Column<string>(type: "TEXT", maxLength: 1, nullable: false),
                    legacy_row_hash = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fs_journals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fs_pournals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    j_jv_no = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    j_date = table.Column<DateTime>(type: "TEXT", nullable: true),
                    acct_code = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    j_ck_amt = table.Column<decimal>(type: "TEXT", nullable: false),
                    j_d_or_c = table.Column<string>(type: "TEXT", maxLength: 1, nullable: false),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fs_pournals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fs_purcbook",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    j_jv_no = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    j_date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    acct_code = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    j_ck_amt = table.Column<decimal>(type: "TEXT", nullable: false),
                    j_d_or_c = table.Column<string>(type: "TEXT", maxLength: 1, nullable: false),
                    legacy_row_hash = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fs_purcbook", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fs_salebook",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    j_jv_no = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    j_date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    acct_code = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    j_ck_amt = table.Column<decimal>(type: "TEXT", nullable: false),
                    j_d_or_c = table.Column<string>(type: "TEXT", maxLength: 1, nullable: false),
                    legacy_row_hash = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fs_salebook", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fs_sys_id",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    pres_mo = table.Column<int>(type: "INTEGER", nullable: false),
                    pres_yr = table.Column<int>(type: "INTEGER", nullable: false),
                    beg_date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    end_date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fs_sys_id", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "pay_master",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    emp_no = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    emp_nm = table.Column<string>(type: "TEXT", maxLength: 160, nullable: false),
                    dep_no = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    position = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    b_rate = table.Column<decimal>(type: "TEXT", nullable: false),
                    cola = table.Column<decimal>(type: "TEXT", nullable: false),
                    emp_stat = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    status = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true),
                    date_hire = table.Column<DateTime>(type: "TEXT", nullable: true),
                    date_resign = table.Column<DateTime>(type: "TEXT", nullable: true),
                    sss_no = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    tin_no = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    phic_no = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    pgbg_no = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    sss_member = table.Column<bool>(type: "INTEGER", nullable: false),
                    pgbg = table.Column<bool>(type: "INTEGER", nullable: false),
                    sln_bal = table.Column<decimal>(type: "TEXT", nullable: false),
                    sln_amt = table.Column<decimal>(type: "TEXT", nullable: false),
                    sln_term = table.Column<int>(type: "INTEGER", nullable: false),
                    sln_date = table.Column<DateTime>(type: "TEXT", nullable: true),
                    hdmf_bal = table.Column<decimal>(type: "TEXT", nullable: false),
                    hdmf_amt = table.Column<decimal>(type: "TEXT", nullable: false),
                    hdmf_term = table.Column<int>(type: "INTEGER", nullable: false),
                    hdmf_date = table.Column<DateTime>(type: "TEXT", nullable: true),
                    cal_bal = table.Column<decimal>(type: "TEXT", nullable: false),
                    cal_amt = table.Column<decimal>(type: "TEXT", nullable: false),
                    cal_term = table.Column<int>(type: "INTEGER", nullable: false),
                    cal_date = table.Column<DateTime>(type: "TEXT", nullable: true),
                    comp_bal = table.Column<decimal>(type: "TEXT", nullable: false),
                    comp_amt = table.Column<decimal>(type: "TEXT", nullable: false),
                    comp_term = table.Column<int>(type: "INTEGER", nullable: false),
                    comp_date = table.Column<DateTime>(type: "TEXT", nullable: true),
                    comd_bal = table.Column<decimal>(type: "TEXT", nullable: false),
                    comd_amt = table.Column<decimal>(type: "TEXT", nullable: false),
                    comd_term = table.Column<int>(type: "INTEGER", nullable: false),
                    comd_date = table.Column<DateTime>(type: "TEXT", nullable: true),
                    m_basic = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_cola = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_hol = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_ot = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_leave = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_gross = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_ssee = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_sser = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_medee = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_meder = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_pgee = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_pger = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_ecer = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_tax = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_othp1 = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_othp2 = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_othp3 = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_othp4 = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_netpay = table.Column<decimal>(type: "TEXT", nullable: false),
                    q1_gross = table.Column<decimal>(type: "TEXT", nullable: false),
                    q1_ssee = table.Column<decimal>(type: "TEXT", nullable: false),
                    q1_medee = table.Column<decimal>(type: "TEXT", nullable: false),
                    q1_pgee = table.Column<decimal>(type: "TEXT", nullable: false),
                    q1_tax = table.Column<decimal>(type: "TEXT", nullable: false),
                    q2_gross = table.Column<decimal>(type: "TEXT", nullable: false),
                    q2_ssee = table.Column<decimal>(type: "TEXT", nullable: false),
                    q2_medee = table.Column<decimal>(type: "TEXT", nullable: false),
                    q2_pgee = table.Column<decimal>(type: "TEXT", nullable: false),
                    q2_tax = table.Column<decimal>(type: "TEXT", nullable: false),
                    q3_gross = table.Column<decimal>(type: "TEXT", nullable: false),
                    q3_ssee = table.Column<decimal>(type: "TEXT", nullable: false),
                    q3_medee = table.Column<decimal>(type: "TEXT", nullable: false),
                    q3_pgee = table.Column<decimal>(type: "TEXT", nullable: false),
                    q3_tax = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_basic = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_cola = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_hol = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_ot = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_leave = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_gross = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_ssee = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_sser = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_medee = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_meder = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_pgee = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_pger = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_ecer = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_tax = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_othp1 = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_othp2 = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_othp3 = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_othp4 = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_bonus = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_btax = table.Column<decimal>(type: "TEXT", nullable: false),
                    y_netpay = table.Column<decimal>(type: "TEXT", nullable: false),
                    sick_leave = table.Column<decimal>(type: "TEXT", nullable: false),
                    vacation_leave = table.Column<decimal>(type: "TEXT", nullable: false),
                    spouse = table.Column<string>(type: "TEXT", maxLength: 160, nullable: true),
                    address = table.Column<string>(type: "TEXT", maxLength: 300, nullable: true),
                    birthdate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    legacy_row_hash = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pay_master", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "pay_sys_id",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    pres_mo = table.Column<int>(type: "INTEGER", nullable: false),
                    pres_yr = table.Column<int>(type: "INTEGER", nullable: false),
                    beg_date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    end_date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    trn_ctr = table.Column<int>(type: "INTEGER", nullable: false),
                    trn_upd = table.Column<int>(type: "INTEGER", nullable: false),
                    trn_prc = table.Column<int>(type: "INTEGER", nullable: false),
                    hdmf_pre = table.Column<decimal>(type: "TEXT", nullable: false),
                    pg_lower = table.Column<decimal>(type: "TEXT", nullable: false),
                    pg_higher = table.Column<decimal>(type: "TEXT", nullable: false),
                    pg_lwper = table.Column<decimal>(type: "TEXT", nullable: false),
                    pg_hiper = table.Column<decimal>(type: "TEXT", nullable: false),
                    bon_days = table.Column<int>(type: "INTEGER", nullable: false),
                    bon_mont = table.Column<decimal>(type: "TEXT", nullable: false),
                    tax_bon = table.Column<decimal>(type: "TEXT", nullable: false),
                    m_daily_wage = table.Column<bool>(type: "INTEGER", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pay_sys_id", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "pay_taxtab",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    exemption = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    salary = table.Column<decimal>(type: "TEXT", nullable: false),
                    peso = table.Column<decimal>(type: "TEXT", nullable: false),
                    percent = table.Column<decimal>(type: "TEXT", nullable: false),
                    sequence = table.Column<int>(type: "INTEGER", nullable: false),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pay_taxtab", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "pay_tmcard",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    emp_no = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    emp_nm = table.Column<string>(type: "TEXT", maxLength: 160, nullable: true),
                    dep_no = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    reg_hrs = table.Column<decimal>(type: "TEXT", nullable: false),
                    abs_hrs = table.Column<decimal>(type: "TEXT", nullable: false),
                    rot_hrs = table.Column<decimal>(type: "TEXT", nullable: false),
                    sphp_hrs = table.Column<decimal>(type: "TEXT", nullable: false),
                    spot_hrs = table.Column<decimal>(type: "TEXT", nullable: false),
                    lghp_hrs = table.Column<decimal>(type: "TEXT", nullable: false),
                    lgot_hrs = table.Column<decimal>(type: "TEXT", nullable: false),
                    nsd_hrs = table.Column<decimal>(type: "TEXT", nullable: false),
                    lv_hrs = table.Column<decimal>(type: "TEXT", nullable: false),
                    ls_hrs = table.Column<decimal>(type: "TEXT", nullable: false),
                    oth_pay1 = table.Column<decimal>(type: "TEXT", nullable: false),
                    oth_pay2 = table.Column<decimal>(type: "TEXT", nullable: false),
                    oth_pay3 = table.Column<decimal>(type: "TEXT", nullable: false),
                    oth_pay4 = table.Column<decimal>(type: "TEXT", nullable: false),
                    lv_cashout = table.Column<decimal>(type: "TEXT", nullable: false),
                    ls_cashout = table.Column<decimal>(type: "TEXT", nullable: false),
                    sln_ded = table.Column<decimal>(type: "TEXT", nullable: false),
                    hdmf_ded = table.Column<decimal>(type: "TEXT", nullable: false),
                    cal_ded = table.Column<decimal>(type: "TEXT", nullable: false),
                    comp_ded = table.Column<decimal>(type: "TEXT", nullable: false),
                    comd_ded = table.Column<decimal>(type: "TEXT", nullable: false),
                    oth_ded1 = table.Column<decimal>(type: "TEXT", nullable: false),
                    oth_ded2 = table.Column<decimal>(type: "TEXT", nullable: false),
                    oth_ded3 = table.Column<decimal>(type: "TEXT", nullable: false),
                    oth_ded4 = table.Column<decimal>(type: "TEXT", nullable: false),
                    oth_ded5 = table.Column<decimal>(type: "TEXT", nullable: false),
                    oth_ded6 = table.Column<decimal>(type: "TEXT", nullable: false),
                    oth_ded7 = table.Column<decimal>(type: "TEXT", nullable: false),
                    oth_ded8 = table.Column<decimal>(type: "TEXT", nullable: false),
                    oth_ded9 = table.Column<decimal>(type: "TEXT", nullable: false),
                    oth_ded10 = table.Column<decimal>(type: "TEXT", nullable: false),
                    tax_add = table.Column<decimal>(type: "TEXT", nullable: false),
                    withbonus = table.Column<bool>(type: "INTEGER", nullable: false),
                    reg_pay = table.Column<decimal>(type: "TEXT", nullable: false),
                    rot_pay = table.Column<decimal>(type: "TEXT", nullable: false),
                    sphp_pay = table.Column<decimal>(type: "TEXT", nullable: false),
                    spot_pay = table.Column<decimal>(type: "TEXT", nullable: false),
                    lghp_pay = table.Column<decimal>(type: "TEXT", nullable: false),
                    lgot_pay = table.Column<decimal>(type: "TEXT", nullable: false),
                    nsd_pay = table.Column<decimal>(type: "TEXT", nullable: false),
                    lv_pay = table.Column<decimal>(type: "TEXT", nullable: false),
                    lv2_pay = table.Column<decimal>(type: "TEXT", nullable: false),
                    ls_pay = table.Column<decimal>(type: "TEXT", nullable: false),
                    grs_pay = table.Column<decimal>(type: "TEXT", nullable: false),
                    abs_ded = table.Column<decimal>(type: "TEXT", nullable: false),
                    sss_ee = table.Column<decimal>(type: "TEXT", nullable: false),
                    sss_er = table.Column<decimal>(type: "TEXT", nullable: false),
                    med_ee = table.Column<decimal>(type: "TEXT", nullable: false),
                    med_er = table.Column<decimal>(type: "TEXT", nullable: false),
                    pgbg_ee = table.Column<decimal>(type: "TEXT", nullable: false),
                    pgbg_er = table.Column<decimal>(type: "TEXT", nullable: false),
                    ec_er = table.Column<decimal>(type: "TEXT", nullable: false),
                    tax_ee = table.Column<decimal>(type: "TEXT", nullable: false),
                    tot_ded = table.Column<decimal>(type: "TEXT", nullable: false),
                    net_pay = table.Column<decimal>(type: "TEXT", nullable: false),
                    bonus = table.Column<decimal>(type: "TEXT", nullable: false),
                    bonustax = table.Column<decimal>(type: "TEXT", nullable: false),
                    trn_flag = table.Column<string>(type: "TEXT", maxLength: 1, nullable: false),
                    period_year = table.Column<int>(type: "INTEGER", nullable: false),
                    period_month = table.Column<int>(type: "INTEGER", nullable: false),
                    legacy_row_hash = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pay_tmcard", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_fs_accounts_acct_code",
                table: "fs_accounts",
                column: "acct_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_fs_adjstmnt_j_jv_no",
                table: "fs_adjstmnt",
                column: "j_jv_no");

            migrationBuilder.CreateIndex(
                name: "IX_fs_cashrcpt_j_jv_no",
                table: "fs_cashrcpt",
                column: "j_jv_no");

            migrationBuilder.CreateIndex(
                name: "IX_fs_checkmas_j_ck_no",
                table: "fs_checkmas",
                column: "j_ck_no");

            migrationBuilder.CreateIndex(
                name: "IX_fs_checkvou_j_ck_no_acct_code",
                table: "fs_checkvou",
                columns: new[] { "j_ck_no", "acct_code" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_journals_j_jv_no",
                table: "fs_journals",
                column: "j_jv_no");

            migrationBuilder.CreateIndex(
                name: "IX_fs_pournals_j_jv_no_acct_code",
                table: "fs_pournals",
                columns: new[] { "j_jv_no", "acct_code" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_purcbook_j_jv_no",
                table: "fs_purcbook",
                column: "j_jv_no");

            migrationBuilder.CreateIndex(
                name: "IX_fs_salebook_j_jv_no",
                table: "fs_salebook",
                column: "j_jv_no");

            migrationBuilder.CreateIndex(
                name: "IX_pay_master_emp_no",
                table: "pay_master",
                column: "emp_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pay_taxtab_exemption_sequence",
                table: "pay_taxtab",
                columns: new[] { "exemption", "sequence" });

            migrationBuilder.CreateIndex(
                name: "IX_pay_tmcard_emp_no_period_year_period_month",
                table: "pay_tmcard",
                columns: new[] { "emp_no", "period_year", "period_month" });

            migrationBuilder.CreateIndex(
                name: "IX_pay_tmcard_trn_flag",
                table: "pay_tmcard",
                column: "trn_flag");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "fs_accounts");

            migrationBuilder.DropTable(
                name: "fs_adjstmnt");

            migrationBuilder.DropTable(
                name: "fs_cashrcpt");

            migrationBuilder.DropTable(
                name: "fs_checkmas");

            migrationBuilder.DropTable(
                name: "fs_checkvou");

            migrationBuilder.DropTable(
                name: "fs_journals");

            migrationBuilder.DropTable(
                name: "fs_pournals");

            migrationBuilder.DropTable(
                name: "fs_purcbook");

            migrationBuilder.DropTable(
                name: "fs_salebook");

            migrationBuilder.DropTable(
                name: "fs_sys_id");

            migrationBuilder.DropTable(
                name: "pay_master");

            migrationBuilder.DropTable(
                name: "pay_sys_id");

            migrationBuilder.DropTable(
                name: "pay_taxtab");

            migrationBuilder.DropTable(
                name: "pay_tmcard");
        }
    }
}
