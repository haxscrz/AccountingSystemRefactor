using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AccountingApi.Data;

namespace AccountingApi.Models;

public interface ICompanyScopedEntity
{
    string CompanyCode { get; set; }
}

public abstract class CompanyScopedEntity : ICompanyScopedEntity
{
    [Required]
    [Column("company_code")]
    [MaxLength(32)]
    public string CompanyCode { get; set; } = CompanyCatalog.DefaultCompanyCode;

    [Column("created_by_user_id")]
    public int? CreatedByUserId { get; set; }
}
