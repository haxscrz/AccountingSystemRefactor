using AccountingApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AccountingApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "SuperAdminOnly")]
public sealed class LegacyMigrationController : ControllerBase
{
    private readonly LegacyDataService _legacyDataService;

    public LegacyMigrationController(LegacyDataService legacyDataService)
    {
        _legacyDataService = legacyDataService;
    }

    [HttpGet("manifest")]
    public async Task<IActionResult> GetManifest(CancellationToken cancellationToken)
    {
        var manifest = await _legacyDataService.GetManifestAsync(cancellationToken);
        if (manifest is null)
        {
            return NotFound(new { message = "Manifest not found. Run npm run import:legacy first." });
        }

        return Ok(manifest);
    }

    [HttpGet("dataset/{key}")]
    public async Task<IActionResult> GetDataset(string key, CancellationToken cancellationToken)
    {
        var manifest = await _legacyDataService.GetManifestAsync(cancellationToken);
        if (manifest is null)
        {
            return NotFound(new { message = "Manifest not found. Run npm run import:legacy first." });
        }

        var dataset = manifest.Datasets.FirstOrDefault(item => item.Key.Equals(key, StringComparison.OrdinalIgnoreCase));
        if (dataset is null)
        {
            return NotFound(new { message = $"Dataset '{key}' not found in manifest." });
        }

        var payload = await _legacyDataService.GetDatasetAsync(dataset.OutputFile, cancellationToken);
        if (payload is null)
        {
            return NotFound(new { message = $"Dataset file '{dataset.OutputFile}' is missing." });
        }

        return Ok(payload);
    }
}
