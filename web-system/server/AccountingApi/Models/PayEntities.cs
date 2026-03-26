using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AccountingApi.Models;

[Table("pay_master")]
public sealed class PayMaster : CompanyScopedEntity
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [Column("emp_no")]
    [MaxLength(20)]
    public string EmpNo { get; set; } = string.Empty;
    
    [Required]
    [Column("emp_nm")]
    [MaxLength(160)]
    public string EmpNm { get; set; } = string.Empty;
    
    [Column("dep_no")]
    [MaxLength(30)]
    public string? DepNo { get; set; }
    
    [Column("position")]
    [MaxLength(100)]
    public string? Position { get; set; }
    
    [Column("b_rate")]
    public decimal BRate { get; set; }
    
    [Column("cola")]
    public decimal Cola { get; set; }
    
    [Column("emp_stat")]
    [MaxLength(10)]
    public string EmpStat { get; set; } = "R";
    
    [Column("status")]
    [MaxLength(10)]
    public string? Status { get; set; }
    
    [Column("date_hire")]
    public DateTime? DateHire { get; set; }
    
    [Column("date_resign")]
    public DateTime? DateResign { get; set; }
    
    // Government IDs
    [Column("sss_no")]
    [MaxLength(30)]
    public string? SssNo { get; set; }
    
    [Column("tin_no")]
    [MaxLength(30)]
    public string? TinNo { get; set; }
    
    [Column("phic_no")]
    [MaxLength(30)]
    public string? PhicNo { get; set; }
    
    [Column("pgbg_no")]
    [MaxLength(30)]
    public string? PgbgNo { get; set; }
    
    [Column("sss_member")]
    public bool SssMember { get; set; } = true;
    
    [Column("pgbg")]
    public bool Pgbg { get; set; }
    
    // Salary Loan
    [Column("sln_bal")]
    public decimal SlnBal { get; set; }
    
    [Column("sln_amt")]
    public decimal SlnAmt { get; set; }
    
    [Column("sln_term")]
    public int SlnTerm { get; set; }
    
    [Column("sln_date")]
    public DateTime? SlnDate { get; set; }
    
    // HDMF Loan
    [Column("hdmf_bal")]
    public decimal HdmfBal { get; set; }
    
    [Column("hdmf_amt")]
    public decimal HdmfAmt { get; set; }
    
    [Column("hdmf_term")]
    public int HdmfTerm { get; set; }
    
    [Column("hdmf_date")]
    public DateTime? HdmfDate { get; set; }
    
    // Calamity Loan
    [Column("cal_bal")]
    public decimal CalBal { get; set; }
    
    [Column("cal_amt")]
    public decimal CalAmt { get; set; }
    
    [Column("cal_term")]
    public int CalTerm { get; set; }
    
    [Column("cal_date")]
    public DateTime? CalDate { get; set; }
    
    // Company Loan
    [Column("comp_bal")]
    public decimal CompBal { get; set; }
    
    [Column("comp_amt")]
    public decimal CompAmt { get; set; }
    
    [Column("comp_term")]
    public int CompTerm { get; set; }
    
    [Column("comp_date")]
    public DateTime? CompDate { get; set; }
    
    // Company Deduction
    [Column("comd_bal")]
    public decimal ComdBal { get; set; }
    
    [Column("comd_amt")]
    public decimal ComdAmt { get; set; }
    
    [Column("comd_term")]
    public int ComdTerm { get; set; }
    
    [Column("comd_date")]
    public DateTime? ComdDate { get; set; }
    
    // Monthly Counters
    [Column("m_basic")]
    public decimal MBasic { get; set; }
    
    [Column("m_cola")]
    public decimal MCola { get; set; }
    
    [Column("m_hol")]
    public decimal MHol { get; set; }
    
    [Column("m_ot")]
    public decimal MOt { get; set; }
    
    [Column("m_leave")]
    public decimal MLeave { get; set; }
    
    [Column("m_gross")]
    public decimal MGross { get; set; }
    
    [Column("m_ssee")]
    public decimal MSsee { get; set; }
    
    [Column("m_sser")]
    public decimal MSser { get; set; }
    
    [Column("m_medee")]
    public decimal MMedee { get; set; }
    
    [Column("m_meder")]
    public decimal MMeder { get; set; }
    
    [Column("m_pgee")]
    public decimal MPgee { get; set; }
    
    [Column("m_pger")]
    public decimal MPger { get; set; }
    
    [Column("m_ecer")]
    public decimal MEcer { get; set; }
    
    [Column("m_tax")]
    public decimal MTax { get; set; }
    
    [Column("m_othp1")]
    public decimal MOthp1 { get; set; }
    
    [Column("m_othp2")]
    public decimal MOthp2 { get; set; }
    
    [Column("m_othp3")]
    public decimal MOthp3 { get; set; }
    
    [Column("m_othp4")]
    public decimal MOthp4 { get; set; }
    
    [Column("m_netpay")]
    public decimal MNetpay { get; set; }
    
    // Quarterly Counters
    [Column("q1_gross")]
    public decimal Q1Gross { get; set; }
    
    [Column("q1_ssee")]
    public decimal Q1Ssee { get; set; }
    
    [Column("q1_medee")]
    public decimal Q1Medee { get; set; }
    
    [Column("q1_pgee")]
    public decimal Q1Pgee { get; set; }
    
    [Column("q1_tax")]
    public decimal Q1Tax { get; set; }
    
    [Column("q2_gross")]
    public decimal Q2Gross { get; set; }
    
    [Column("q2_ssee")]
    public decimal Q2Ssee { get; set; }
    
    [Column("q2_medee")]
    public decimal Q2Medee { get; set; }
    
    [Column("q2_pgee")]
    public decimal Q2Pgee { get; set; }
    
    [Column("q2_tax")]
    public decimal Q2Tax { get; set; }
    
    [Column("q3_gross")]
    public decimal Q3Gross { get; set; }
    
    [Column("q3_ssee")]
    public decimal Q3Ssee { get; set; }
    
    [Column("q3_medee")]
    public decimal Q3Medee { get; set; }
    
    [Column("q3_pgee")]
    public decimal Q3Pgee { get; set; }
    
    [Column("q3_tax")]
    public decimal Q3Tax { get; set; }
    
    // Yearly Counters
    [Column("y_basic")]
    public decimal YBasic { get; set; }
    
    [Column("y_cola")]
    public decimal YCola { get; set; }
    
    [Column("y_hol")]
    public decimal YHol { get; set; }
    
    [Column("y_ot")]
    public decimal YOt { get; set; }
    
    [Column("y_leave")]
    public decimal YLeave { get; set; }
    
    [Column("y_gross")]
    public decimal YGross { get; set; }
    
    [Column("y_ssee")]
    public decimal YSsee { get; set; }
    
    [Column("y_sser")]
    public decimal YSser { get; set; }
    
    [Column("y_medee")]
    public decimal YMedee { get; set; }
    
    [Column("y_meder")]
    public decimal YMeder { get; set; }
    
    [Column("y_pgee")]
    public decimal YPgee { get; set; }
    
    [Column("y_pger")]
    public decimal YPger { get; set; }
    
    [Column("y_ecer")]
    public decimal YEcer { get; set; }
    
    [Column("y_tax")]
    public decimal YTax { get; set; }
    
    [Column("y_othp1")]
    public decimal YOthp1 { get; set; }
    
    [Column("y_othp2")]
    public decimal YOthp2 { get; set; }
    
    [Column("y_othp3")]
    public decimal YOthp3 { get; set; }
    
    [Column("y_othp4")]
    public decimal YOthp4 { get; set; }
    
    [Column("y_bonus")]
    public decimal YBonus { get; set; }
    
    [Column("y_btax")]
    public decimal YBtax { get; set; }
    
    [Column("y_netpay")]
    public decimal YNetpay { get; set; }
    
    // Leave Credits
    [Column("sick_leave")]
    public decimal SickLeave { get; set; }
    
    [Column("vacation_leave")]
    public decimal VacationLeave { get; set; }
    
    // Personal Info
    [Column("spouse")]
    [MaxLength(160)]
    public string? Spouse { get; set; }
    
    [Column("address")]
    [MaxLength(300)]
    public string? Address { get; set; }
    
    [Column("birthdate")]
    public DateTime? Birthdate { get; set; }
    
    [Column("legacy_row_hash")]
    [MaxLength(128)]
    public string? LegacyRowHash { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

[Table("pay_tmcard")]
public sealed class PayTmcard : CompanyScopedEntity
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [Column("emp_no")]
    [MaxLength(20)]
    public string EmpNo { get; set; } = string.Empty;
    
    [Column("emp_nm")]
    [MaxLength(160)]
    public string? EmpNm { get; set; }
    
    [Column("dep_no")]
    [MaxLength(30)]
    public string? DepNo { get; set; }
    
    // Earnings Fields (16 fields A-P)
    [Column("reg_hrs")]
    public decimal RegHrs { get; set; }
    
    [Column("abs_hrs")]
    public decimal AbsHrs { get; set; }
    
    [Column("rot_hrs")]
    public decimal RotHrs { get; set; }
    
    [Column("sphp_hrs")]
    public decimal SphpHrs { get; set; }
    
    [Column("spot_hrs")]
    public decimal SpotHrs { get; set; }
    
    [Column("lghp_hrs")]
    public decimal LghpHrs { get; set; }
    
    [Column("lgot_hrs")]
    public decimal LgotHrs { get; set; }
    
    [Column("nsd_hrs")]
    public decimal NsdHrs { get; set; }
    
    [Column("lv_hrs")]
    public decimal LvHrs { get; set; }
    
    [Column("ls_hrs")]
    public decimal LsHrs { get; set; }
    
    [Column("oth_pay1")]
    public decimal OthPay1 { get; set; }
    
    [Column("oth_pay2")]
    public decimal OthPay2 { get; set; }
    
    [Column("oth_pay3")]
    public decimal OthPay3 { get; set; }
    
    [Column("oth_pay4")]
    public decimal OthPay4 { get; set; }
    
    [Column("lv_cashout")]
    public decimal LvCashout { get; set; }
    
    [Column("ls_cashout")]
    public decimal LsCashout { get; set; }
    
    // Deduction Fields (17 fields Q-AG)
    [Column("sln_ded")]
    public decimal SlnDed { get; set; }
    
    [Column("hdmf_ded")]
    public decimal HdmfDed { get; set; }
    
    [Column("cal_ded")]
    public decimal CalDed { get; set; }
    
    [Column("comp_ded")]
    public decimal CompDed { get; set; }
    
    [Column("comd_ded")]
    public decimal ComdDed { get; set; }
    
    [Column("oth_ded1")]
    public decimal OthDed1 { get; set; }
    
    [Column("oth_ded2")]
    public decimal OthDed2 { get; set; }
    
    [Column("oth_ded3")]
    public decimal OthDed3 { get; set; }
    
    [Column("oth_ded4")]
    public decimal OthDed4 { get; set; }
    
    [Column("oth_ded5")]
    public decimal OthDed5 { get; set; }
    
    [Column("oth_ded6")]
    public decimal OthDed6 { get; set; }
    
    [Column("oth_ded7")]
    public decimal OthDed7 { get; set; }
    
    [Column("oth_ded8")]
    public decimal OthDed8 { get; set; }
    
    [Column("oth_ded9")]
    public decimal OthDed9 { get; set; }
    
    [Column("oth_ded10")]
    public decimal OthDed10 { get; set; }
    
    [Column("tax_add")]
    public decimal TaxAdd { get; set; }
    
    [Column("withbonus")]
    public bool Withbonus { get; set; }
    
    // Computed Fields
    [Column("reg_pay")]
    public decimal RegPay { get; set; }
    
    [Column("rot_pay")]
    public decimal RotPay { get; set; }
    
    [Column("sphp_pay")]
    public decimal SphpPay { get; set; }
    
    [Column("spot_pay")]
    public decimal SpotPay { get; set; }
    
    [Column("lghp_pay")]
    public decimal LghpPay { get; set; }
    
    [Column("lgot_pay")]
    public decimal LgotPay { get; set; }
    
    [Column("nsd_pay")]
    public decimal NsdPay { get; set; }
    
    [Column("lv_pay")]
    public decimal LvPay { get; set; }
    
    [Column("lv2_pay")]
    public decimal Lv2Pay { get; set; }
    
    [Column("ls_pay")]
    public decimal LsPay { get; set; }
    
    [Column("grs_pay")]
    public decimal GrsPay { get; set; }
    
    [Column("abs_ded")]
    public decimal AbsDed { get; set; }
    
    [Column("sss_ee")]
    public decimal SssEe { get; set; }
    
    [Column("sss_er")]
    public decimal SssEr { get; set; }
    
    [Column("med_ee")]
    public decimal MedEe { get; set; }
    
    [Column("med_er")]
    public decimal MedEr { get; set; }
    
    [Column("pgbg_ee")]
    public decimal PgbgEe { get; set; }
    
    [Column("pgbg_er")]
    public decimal PgbgEr { get; set; }
    
    [Column("ec_er")]
    public decimal EcEr { get; set; }
    
    [Column("tax_ee")]
    public decimal TaxEe { get; set; }
    
    [Column("tot_ded")]
    public decimal TotDed { get; set; }
    
    [Column("net_pay")]
    public decimal NetPay { get; set; }
    
    [Column("bonus")]
    public decimal Bonus { get; set; }
    
    [Column("bonustax")]
    public decimal Bonustax { get; set; }
    
    [Column("trn_flag")]
    [MaxLength(1)]
    public string TrnFlag { get; set; } = "U";
    
    [Column("period_year")]
    public int PeriodYear { get; set; }
    
    [Column("period_month")]
    public int PeriodMonth { get; set; }
    
    [Column("legacy_row_hash")]
    [MaxLength(128)]
    public string? LegacyRowHash { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

[Table("pay_sys_id")]
public sealed class PaySysId : CompanyScopedEntity
{
    [Key]
    public int Id { get; set; }
    
    [Column("pres_mo")]
    public int PresMo { get; set; }
    
    [Column("pres_yr")]
    public int PresYr { get; set; }
    
    [Column("beg_date")]
    public DateTime BegDate { get; set; }
    
    [Column("end_date")]
    public DateTime EndDate { get; set; }
    
    [Column("trn_ctr")]
    public int TrnCtr { get; set; }
    
    [Column("trn_upd")]
    public int TrnUpd { get; set; }
    
    [Column("trn_prc")]
    public int TrnPrc { get; set; }
    
    [Column("hdmf_pre")]
    public decimal HdmfPre { get; set; } = 0.02m;
    
    [Column("pg_lower")]
    public decimal PgLower { get; set; } = 1500m;
    
    [Column("pg_higher")]
    public decimal PgHigher { get; set; } = 5000m;
    
    [Column("pg_lwper")]
    public decimal PgLwper { get; set; } = 0.01m;
    
    [Column("pg_hiper")]
    public decimal PgHiper { get; set; } = 0.02m;
    
    [Column("bon_days")]
    public int BonDays { get; set; } = 22;
    
    [Column("bon_mont")]
    public decimal BonMont { get; set; } = 1m;
    
    [Column("tax_bon")]
    public decimal TaxBon { get; set; } = 90000m;
    
    [Column("m_daily_wage")]
    public bool MDailyWage { get; set; }

    /// <summary>1 = 1st half, 2 = 2nd half (from INITTIME.PRG / COMPTIME.PRG)</summary>
    [Column("pay_type")]
    public int PayType { get; set; } = 1;

    /// <summary>Standard working hours per period (used in initialization)</summary>
    [Column("work_hours")]
    public int WorkHours { get; set; } = 80;

    /// <summary>Flag set after posting to require a backup before next initialization</summary>
    [Column("need_backup")]
    public bool NeedBackup { get; set; }

    /// <summary>Company / organization name displayed in the status bar</summary>
    [Column("sys_nm")]
    [MaxLength(80)]
    public string SysNm { get; set; } = "";
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// OR/SBR Premium Paid records — stores SSS and Pag-IBIG official receipt / special bank receipt entries.
/// Mirrors the prempaid.dbf table used by ENTORSBR.PRG and ENTORPAG.PRG.
/// preflag = 'S' for SSS, 'T' for Pag-IBIG/HDMF.
/// </summary>
[Table("pay_prempaid")]
public sealed class PayPremPaid : CompanyScopedEntity
{
    [Key]
    public int Id { get; set; }

    /// <summary>'S' = SSS, 'T' = Pag-IBIG/HDMF</summary>
    [Required]
    [Column("preflag")]
    [MaxLength(1)]
    public string PreFlag { get; set; } = "S";

    [Column("month")]
    [MaxLength(2)]
    public string Month { get; set; } = "";

    [Column("year")]
    [MaxLength(4)]
    public string Year { get; set; } = "";

    /// <summary>O.R. / SBR number</summary>
    [Column("or_sbr")]
    [MaxLength(15)]
    public string OrSbr { get; set; } = "";

    [Column("or_date")]
    public DateTime? OrDate { get; set; }

    /// <summary>Period key e.g. "202601"</summary>
    [Column("period")]
    [MaxLength(6)]
    public string Period { get; set; } = "";

    [Column("amount")]
    public decimal Amount { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Department file — mirrors dept.dbf from DEPTEDIT.PRG / FTDEPEDT.PRG.
/// dep_no and dep_nm are the editable keys; financial totals are updated by PostTransactions.
/// </summary>
[Table("pay_dept")]
public sealed class PayDept : CompanyScopedEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    [Column("dep_no")]
    [MaxLength(10)]
    public string DepNo { get; set; } = string.Empty;

    [Column("dep_nm")]
    [MaxLength(50)]
    public string DepNm { get; set; } = string.Empty;

    // Financial totals updated by PostTransactions (read-only in dept edit screen)
    [Column("reg_pay")]     public decimal RegPay    { get; set; }
    [Column("ot_pay")]      public decimal OtPay     { get; set; }
    [Column("hol_pay")]     public decimal HolPay    { get; set; }
    [Column("oth_pay1")]    public decimal OthPay1   { get; set; }
    [Column("oth_pay3")]    public decimal OthPay3   { get; set; }
    [Column("lvenc_pay")]   public decimal LvencPay  { get; set; }
    [Column("lsenc_pay")]   public decimal LsencPay  { get; set; }
    [Column("grs_pay")]     public decimal GrsPay    { get; set; }
    [Column("tax")]         public decimal Tax       { get; set; }
    [Column("oth_pay2")]    public decimal OthPay2   { get; set; }
    [Column("sss_ee")]      public decimal SssEe     { get; set; }
    [Column("sss_er")]      public decimal SssEr     { get; set; }
    [Column("med_ee")]      public decimal MedEe     { get; set; }
    [Column("med_er")]      public decimal MedEr     { get; set; }
    [Column("pgbg_ee")]     public decimal PgbgEe    { get; set; }
    [Column("pgbg_er")]     public decimal PgbgEr    { get; set; }
    [Column("ec_er")]       public decimal EcEr      { get; set; }
    [Column("pbg_loan")]    public decimal PbgLoan   { get; set; }
    [Column("sss_loan")]    public decimal SssLoan   { get; set; }
    [Column("cal_loan")]    public decimal CalLoan   { get; set; }
    [Column("comp_loan")]   public decimal CompLoan  { get; set; }
    [Column("commodloan")]  public decimal Commodloan{ get; set; }
    [Column("oth_ded1")]    public decimal OthDed1   { get; set; }
    [Column("oth_ded2")]    public decimal OthDed2   { get; set; }
    [Column("oth_ded3")]    public decimal OthDed3   { get; set; }
    [Column("oth_ded4")]    public decimal OthDed4   { get; set; }
    [Column("oth_ded5")]    public decimal OthDed5   { get; set; }
    [Column("oth_ded6")]    public decimal OthDed6   { get; set; }
    [Column("oth_ded7")]    public decimal OthDed7   { get; set; }
    [Column("oth_ded8")]    public decimal OthDed8   { get; set; }
    [Column("oth_ded9")]    public decimal OthDed9   { get; set; }
    [Column("oth_ded10")]   public decimal OthDed10  { get; set; }
    [Column("emp_ctr")]     public int    EmpCtr     { get; set; }
    [Column("net_pay")]     public decimal NetPay    { get; set; }
    [Column("bontot")]      public decimal Bontot    { get; set; }
    [Column("bontax")]      public decimal Bontax    { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

[Table("pay_taxtab")]
public sealed class PayTaxTab : CompanyScopedEntity
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [Column("exemption")]
    [MaxLength(10)]
    public string Exemption { get; set; } = string.Empty;
    
    [Column("salary")]
    public decimal Salary { get; set; }
    
    [Column("peso")]
    public decimal Peso { get; set; }
    
    [Column("percent")]
    public decimal Percent { get; set; }
    
    [Column("sequence")]
    public int Sequence { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}
