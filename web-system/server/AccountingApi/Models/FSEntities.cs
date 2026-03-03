using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace AccountingApi.Models;

[Table("fs_accounts")]
public sealed class FSAccount
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [Column("acct_code")]
    [MaxLength(30)]
    public string AcctCode { get; set; } = string.Empty;
    
    [Required]
    [Column("acct_desc")]
    [MaxLength(150)]
    public string AcctDesc { get; set; } = string.Empty;
    
    [Column("acct_type")]
    [MaxLength(30)]
    public string? AcctType { get; set; }
    
    [Column("group_code")]
    [MaxLength(30)]
    public string? GroupCode { get; set; }
    
    [Column("sub_group")]
    [MaxLength(30)]
    public string? SubGroup { get; set; }
    
    [Column("formula")]
    [MaxLength(10)]
    public string Formula { get; set; } = "DC";
    
    [Column("open_bal")]
    public decimal OpenBal { get; set; }
    
    [Column("cur_debit")]
    public decimal CurDebit { get; set; }
    
    [Column("cur_credit")]
    public decimal CurCredit { get; set; }
    
    [Column("end_bal")]
    public decimal EndBal { get; set; }
    
    [Column("gl_report")]
    [MaxLength(30)]
    public string? GlReport { get; set; }
    
    [Column("gl_effect")]
    [MaxLength(30)]
    public string? GlEffect { get; set; }
    
    [Column("schedule")]
    [MaxLength(30)]
    public string? Schedule { get; set; }
    
    [Column("initialize")]
    public bool Initialize { get; set; }
    
    [Column("is_active")]
    public bool IsActive { get; set; } = true;
    
    [Column("legacy_row_hash")]
    [MaxLength(128)]
    public string? LegacyRowHash { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

[Table("fs_checkmas")]
public sealed class FSCheckMas
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [Column("j_jv_no")]
    [MaxLength(50)]
    public string JJvNo { get; set; } = string.Empty;
    
    [Required]
    [Column("j_ck_no")]
    [MaxLength(50)]
    public string JCkNo { get; set; } = string.Empty;
    
    [Column("j_date")]
    public DateTime JDate { get; set; }
    
    [Column("j_pay_to")]
    [MaxLength(200)]
    public string? JPayTo { get; set; }
    
    [Column("j_ck_amt")]
    public decimal JCkAmt { get; set; }
    
    [Column("j_desc")]
    [MaxLength(500)]
    public string? JDesc { get; set; }
    
    [Column("bank_no")]
    public int BankNo { get; set; }
    
    [Column("sup_no")]
    public int SupNo { get; set; }
    
    [Column("legacy_row_hash")]
    [MaxLength(128)]
    public string? LegacyRowHash { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

[Table("fs_checkvou")]
public sealed class FSCheckVou
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [Column("j_ck_no")]
    [MaxLength(50)]
    public string JCkNo { get; set; } = string.Empty;
    
    [Required]
    [Column("acct_code")]
    [MaxLength(30)]
    public string AcctCode { get; set; } = string.Empty;
    
    [Column("j_ck_amt")]
    public decimal JCkAmt { get; set; }
    
    [Required]
    [Column("j_d_or_c")]
    [MaxLength(1)]
    [JsonPropertyName("jDOrC")]
    public string JDOrC { get; set; } = "D";
    
    [Column("legacy_row_hash")]
    [MaxLength(128)]
    public string? LegacyRowHash { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

[Table("fs_pournals")]
public sealed class FSPostedJournal
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [Column("j_jv_no")]
    [MaxLength(50)]
    public string JJvNo { get; set; } = string.Empty;
    
    [Column("j_date")]
    public DateTime? JDate { get; set; }
    
    [Required]
    [Column("acct_code")]
    [MaxLength(30)]
    public string AcctCode { get; set; } = string.Empty;
    
    [Column("j_ck_amt")]
    public decimal JCkAmt { get; set; }
    
    [Required]
    [Column("j_d_or_c")]
    [MaxLength(1)]
    [JsonPropertyName("jDOrC")]
    public string JDOrC { get; set; } = "D";
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}

[Table("fs_cashrcpt")]
public sealed class FSCashRcpt
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [Column("j_jv_no")]
    [MaxLength(50)]
    public string JJvNo { get; set; } = string.Empty;
    
    [Column("j_date")]
    public DateTime JDate { get; set; }
    
    [Required]
    [Column("acct_code")]
    [MaxLength(30)]
    public string AcctCode { get; set; } = string.Empty;
    
    [Column("j_ck_amt")]
    public decimal JCkAmt { get; set; }
    
    [Required]
    [Column("j_d_or_c")]
    [MaxLength(1)]
    [JsonPropertyName("jDOrC")]
    public string JDOrC { get; set; } = "D";
    
    [Column("legacy_row_hash")]
    [MaxLength(128)]
    public string? LegacyRowHash { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

[Table("fs_salebook")]
public sealed class FSSaleBook
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [Column("j_jv_no")]
    [MaxLength(50)]
    public string JJvNo { get; set; } = string.Empty;
    
    [Column("j_date")]
    public DateTime JDate { get; set; }
    
    [Required]
    [Column("acct_code")]
    [MaxLength(30)]
    public string AcctCode { get; set; } = string.Empty;
    
    [Column("j_ck_amt")]
    public decimal JCkAmt { get; set; }
    
    [Required]
    [Column("j_d_or_c")]
    [MaxLength(1)]
    [JsonPropertyName("jDOrC")]
    public string JDOrC { get; set; } = "D";
    
    [Column("legacy_row_hash")]
    [MaxLength(128)]
    public string? LegacyRowHash { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

[Table("fs_purcbook")]
public sealed class FSPurcBook
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [Column("j_jv_no")]
    [MaxLength(50)]
    public string JJvNo { get; set; } = string.Empty;
    
    [Column("j_date")]
    public DateTime JDate { get; set; }
    
    [Required]
    [Column("acct_code")]
    [MaxLength(30)]
    public string AcctCode { get; set; } = string.Empty;
    
    [Column("j_ck_amt")]
    public decimal JCkAmt { get; set; }
    
    [Required]
    [Column("j_d_or_c")]
    [MaxLength(1)]
    [JsonPropertyName("jDOrC")]
    public string JDOrC { get; set; } = "D";
    
    [Column("legacy_row_hash")]
    [MaxLength(128)]
    public string? LegacyRowHash { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

[Table("fs_adjstmnt")]
public sealed class FSAdjustment
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [Column("j_jv_no")]
    [MaxLength(50)]
    public string JJvNo { get; set; } = string.Empty;
    
    [Column("j_date")]
    public DateTime JDate { get; set; }
    
    [Required]
    [Column("acct_code")]
    [MaxLength(30)]
    public string AcctCode { get; set; } = string.Empty;
    
    [Column("j_ck_amt")]
    public decimal JCkAmt { get; set; }
    
    [Required]
    [Column("j_d_or_c")]
    [MaxLength(1)]
    [JsonPropertyName("jDOrC")]
    public string JDOrC { get; set; } = "D";
    
    [Column("legacy_row_hash")]
    [MaxLength(128)]
    public string? LegacyRowHash { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

[Table("fs_journals")]
public sealed class FSJournal
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [Column("j_jv_no")]
    [MaxLength(50)]
    public string JJvNo { get; set; } = string.Empty;
    
    [Column("j_date")]
    public DateTime JDate { get; set; }
    
    [Required]
    [Column("acct_code")]
    [MaxLength(30)]
    public string AcctCode { get; set; } = string.Empty;
    
    [Column("j_ck_amt")]
    public decimal JCkAmt { get; set; }
    
    [Required]
    [Column("j_d_or_c")]
    [MaxLength(1)]
    [JsonPropertyName("jDOrC")]
    public string JDOrC { get; set; } = "D";
    
    [Column("legacy_row_hash")]
    [MaxLength(128)]
    public string? LegacyRowHash { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

[Table("fs_effects")]
public sealed class FSEffect
{
    [Key]
    public int Id { get; set; }

    [Required]
    [Column("gl_report")]
    [MaxLength(4)]
    public string GlReport { get; set; } = string.Empty;

    [Required]
    [Column("gl_effect")]
    [MaxLength(3)]
    public string GlEffect { get; set; } = string.Empty;

    [Column("gl_head")]
    [MaxLength(25)]
    public string? GlHead { get; set; }
}

[Table("fs_schedule")]
public sealed class FSScheduleEntry
{
    [Key]
    public int Id { get; set; }

    [Required]
    [Column("gl_head")]
    [MaxLength(30)]
    public string GlHead { get; set; } = string.Empty;

    [Required]
    [Column("acct_code")]
    [MaxLength(4)]
    public string AcctCode { get; set; } = string.Empty;

    [Column("acct_desc")]
    [MaxLength(30)]
    public string? AcctDesc { get; set; }
}

[Table("fs_sys_id")]
public sealed class FSSysId
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
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
