namespace AccountingApi.Data;

public sealed class CompanyDatabasePathResolver
{
    private readonly string _baseConnectionString;

    public CompanyDatabasePathResolver(IConfiguration configuration)
    {
        var configuredConnectionString = configuration.GetConnectionString("DefaultConnection");
        var isAzureAppService = !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("WEBSITE_SITE_NAME"));
        var fallbackConnectionString = isAzureAppService
            ? "Data Source=/home/accounting.db"
            : "Data Source=accounting.db";

        _baseConnectionString = string.IsNullOrWhiteSpace(configuredConnectionString)
            ? fallbackConnectionString
            : configuredConnectionString;
    }

    public string GetBaseConnectionString()
    {
        return _baseConnectionString;
    }

    public string GetConnectionStringForCompany(string? companyCode)
    {
        var code = CompanyCatalog.NormalizeOrDefault(companyCode);
        var path = GetPathForCompany(code);
        return $"Data Source={path}";
    }

    public string GetPathForCompany(string companyCode)
    {
        var basePath = ExtractSqliteDataSourcePath(_baseConnectionString);

        var extension = Path.GetExtension(basePath);
        if (string.IsNullOrWhiteSpace(extension))
        {
            extension = ".db";
        }

        var directory = Path.GetDirectoryName(basePath);
        var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(basePath);
        var resolvedFileName = $"{fileNameWithoutExtension}_{companyCode}{extension}";

        return string.IsNullOrWhiteSpace(directory)
            ? resolvedFileName
            : Path.Combine(directory, resolvedFileName);
    }

    private static string ExtractSqliteDataSourcePath(string connectionString)
    {
        const string prefix = "Data Source=";
        var parts = connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (var part in parts)
        {
            if (!part.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var path = part.Substring(prefix.Length).Trim();
            if (!string.IsNullOrWhiteSpace(path))
            {
                return path;
            }
        }

        return "accounting.db";
    }
}
