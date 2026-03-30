using System.Text.Json;
using AccountingApi.Models;

namespace AccountingApi.Services;

public sealed class LegacyDataService
{
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public LegacyDataService(IConfiguration configuration, IWebHostEnvironment environment)
    {
        _configuration = configuration;
        _environment = environment;
    }

    private string ResolveLegacyPath()
    {
        var configured = _configuration["LegacyData:Path"] ?? "../../public/migrated";
        var candidates = new[]
        {
            Path.GetFullPath(Path.Combine(_environment.ContentRootPath, configured)),
            Path.GetFullPath(Path.Combine(_environment.ContentRootPath, "public", "migrated")),
            Path.GetFullPath(Path.Combine(_environment.ContentRootPath, "..", "..", "public", "migrated")),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "public", "migrated")),
        };

        foreach (var path in candidates)
        {
            if (Directory.Exists(path)) return path;
        }

        // Return first candidate as fallback for diagnostics / future file drops.
        return candidates[0];
    }

    public async Task<LegacyManifest?> GetManifestAsync(CancellationToken cancellationToken = default)
    {
        var root = ResolveLegacyPath();
        var manifestPath = Path.Combine(root, "manifest.json");
        if (!File.Exists(manifestPath))
        {
            return null;
        }

        await using var stream = File.OpenRead(manifestPath);
        var data = await JsonSerializer.DeserializeAsync<LegacyManifest>(stream, JsonOptions, cancellationToken);
        return data;
    }

    public async Task<LegacyDatasetPayload?> GetDatasetAsync(string outputFile, CancellationToken cancellationToken = default)
    {
        var root = ResolveLegacyPath();
        var filePath = Path.Combine(root, outputFile);
        if (!File.Exists(filePath))
        {
            return null;
        }

        await using var stream = File.OpenRead(filePath);
        var data = await JsonSerializer.DeserializeAsync<LegacyDatasetPayload>(stream, JsonOptions, cancellationToken);
        return data;
    }

    public async Task<LegacyDatasetPayload?> GetDatasetByKeyAsync(string key, CancellationToken cancellationToken = default)
    {
        var manifest = await GetManifestAsync(cancellationToken);
        if (manifest is null)
        {
            return null;
        }

        var dataset = manifest.Datasets.FirstOrDefault(item =>
            item.Key.Equals(key, StringComparison.OrdinalIgnoreCase));

        if (dataset is null)
        {
            return null;
        }

        return await GetDatasetAsync(dataset.OutputFile, cancellationToken);
    }
}
