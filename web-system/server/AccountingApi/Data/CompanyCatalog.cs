using Microsoft.EntityFrameworkCore;
using Dapper;

namespace AccountingApi.Data;

public static class CompanyCatalog
{
    public const string HeaderName = "X-Company-Code";
    public const string DefaultCompanyCode = "cyberfridge";

    private static readonly HashSet<string> ValidCodes = new(StringComparer.OrdinalIgnoreCase)
    {
        "cyberfridge",
        "johntrix",
        "thermalex",
        "gmixteam",
        "dynamiq",
        "metaleon",
        "lmjay",
        "3jcrt",
        "gian",
        "jimi"    
    };

    private static readonly object _lock = new();

    public static IReadOnlyCollection<string> AllCodes 
    {
        get { lock(_lock) { return ValidCodes.ToList(); } }
    }

    public static async Task LoadFromDatabaseAsync(AccountingDbContext db)
    {
        using var conn = db.Database.GetDbConnection();
        var codes = await conn.QueryAsync<string>("SELECT code FROM app_companies");
        lock(_lock)
        {
            foreach (var code in codes)
            {
                if (!string.IsNullOrWhiteSpace(code))
                    ValidCodes.Add(code.Trim());
            }
        }
    }

    public static void AddCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return;
        lock(_lock)
        {
            ValidCodes.Add(code.Trim());
        }
    }

    public static void RemoveCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return;
        lock(_lock)
        {
            ValidCodes.Remove(code.Trim());
        }
    }

    public static bool IsValid(string? code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return false;
        }

        lock(_lock)
        {
            return ValidCodes.Contains(code.Trim());
        }
    }

    public static string NormalizeOrDefault(string? code)
    {
        if (IsValid(code))
        {
            return code!.Trim().ToLowerInvariant();
        }

        return DefaultCompanyCode;
    }
}
