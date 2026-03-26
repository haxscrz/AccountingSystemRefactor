using Microsoft.AspNetCore.Http;

namespace AccountingApi.Data;

public interface ICompanyContextAccessor
{
    string CompanyCode { get; }
}

public sealed class CompanyContextAccessor : ICompanyContextAccessor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CompanyContextAccessor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string CompanyCode
    {
        get
        {
            var context = _httpContextAccessor.HttpContext;
            if (context is null)
            {
                return CompanyCatalog.DefaultCompanyCode;
            }

            var fromItems = context.Items[CompanyContextKeys.SelectedCompanyCodeItem] as string;
            if (!string.IsNullOrWhiteSpace(fromItems))
            {
                return CompanyCatalog.NormalizeOrDefault(fromItems);
            }

            var fromHeader = context.Request.Headers[CompanyCatalog.HeaderName].FirstOrDefault();
            return CompanyCatalog.NormalizeOrDefault(fromHeader);
        }
    }
}
