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
        "metaleon"
    };

    public static bool IsValid(string? code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return false;
        }

        return ValidCodes.Contains(code.Trim());
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
