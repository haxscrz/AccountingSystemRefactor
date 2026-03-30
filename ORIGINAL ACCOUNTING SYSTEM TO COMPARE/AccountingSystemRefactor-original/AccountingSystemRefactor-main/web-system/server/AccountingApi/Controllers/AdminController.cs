using AccountingApi.Services;
using AccountingApi.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccountingApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "SuperAdminOnly")]
public sealed class AdminController : ControllerBase
{
    private readonly DatabaseSeeder _seeder;
    private readonly AccountingDbContext _db;

    public AdminController(DatabaseSeeder seeder, AccountingDbContext db)
    {
        _seeder = seeder;
        _db = db;
    }

    [HttpPost("seed")]
    public async Task<IActionResult> SeedDatabase()
    {
        var seeded = await _seeder.SeedAsync();

        if (!seeded)
        {
            return BadRequest(new { Message = "Database already contains data. Seeding skipped." });
        }

        return Ok(new
        {
            Success = true,
            Message = "Database seeded successfully with test data.",
            SeededAt = DateTime.UtcNow
        });
    }

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? username,
        [FromQuery] string? eventType,
        [FromQuery] bool? success,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 500);

        var query = _db.AppAuditLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(username))
        {
            var u = username.Trim();
            query = query.Where(x => x.Username != null && x.Username.Contains(u));
        }
        if (!string.IsNullOrWhiteSpace(eventType))
        {
            var e = eventType.Trim();
            query = query.Where(x => x.EventType.Contains(e));
        }
        if (success.HasValue)
        {
            query = query.Where(x => x.Success == success.Value);
        }
        if (from.HasValue)
        {
            query = query.Where(x => x.CreatedAtUtc >= from.Value);
        }
        if (to.HasValue)
        {
            query = query.Where(x => x.CreatedAtUtc <= to.Value);
        }

        var total = await query.CountAsync();
        var data = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { data, total, page, pageSize });
    }
}
