using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AccountingApi.Data;
using System.Diagnostics;

namespace AccountingApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly AccountingDbContext _db;
    private static readonly DateTime _startTime = DateTime.UtcNow;

    public HealthController(AccountingDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetHealth()
    {
        var dbStatus = "healthy";
        long dbLatencyMs = 0;
        long dbFileSizeBytes = 0;
        double dbFileSizeMb = 0;

        // Database check
        try
        {
            var sw = Stopwatch.StartNew();
            await _db.Database.ExecuteSqlRawAsync("SELECT 1");
            sw.Stop();
            dbLatencyMs = sw.ElapsedMilliseconds;
        }
        catch
        {
            dbStatus = "unhealthy";
            dbLatencyMs = -1;
        }

        // Disk usage (SQLite file size)
        try
        {
            var connStr = _db.Database.GetConnectionString() ?? "";
            var dataSourceMatch = System.Text.RegularExpressions.Regex.Match(connStr, @"Data Source=(.+?)(?:;|$)");
            if (dataSourceMatch.Success)
            {
                var dbPath = dataSourceMatch.Groups[1].Value.Trim();
                if (System.IO.File.Exists(dbPath))
                {
                    var fi = new System.IO.FileInfo(dbPath);
                    dbFileSizeBytes = fi.Length;
                    dbFileSizeMb = Math.Round(fi.Length / (1024.0 * 1024.0), 2);
                }
            }
        }
        catch { /* ignore */ }

        // Runtime stats
        var proc = Process.GetCurrentProcess();
        var memoryMb = Math.Round(proc.WorkingSet64 / (1024.0 * 1024.0), 1);
        var uptimeSeconds = (long)(DateTime.UtcNow - _startTime).TotalSeconds;

        var overallStatus = dbStatus == "healthy" ? "healthy" : "degraded";

        return Ok(new
        {
            status = overallStatus,
            uptimeSeconds,
            timestamp = DateTime.UtcNow.ToString("o"),
            checks = new
            {
                database = new { status = dbStatus, latencyMs = dbLatencyMs },
                diskUsage = new { dbFileSizeBytes, dbFileSizeMb },
                runtime = new
                {
                    memoryMb,
                    gcGen0 = GC.CollectionCount(0),
                    gcGen1 = GC.CollectionCount(1),
                    gcGen2 = GC.CollectionCount(2)
                }
            }
        });
    }

    [HttpGet("telemetry")]
    [Authorize(Roles = "superadmin")]
    public async Task<IActionResult> GetTelemetry([FromQuery] string? localMidnight)
    {
        var totalUsers = await _db.AppUsers.CountAsync();
        
        // Count active sessions — distinct users with non-expired, non-revoked tokens
        var activeSessionCount = await _db.AppRefreshTokens
            .Where(t => t.RevokedAtUtc == null && t.ExpiresAtUtc > DateTime.UtcNow)
            .Select(t => t.UserId)
            .Distinct()
            .CountAsync();

        // Company count
        int totalCompanies;
        try
        {
            using var conn = _db.Database.GetDbConnection();
            if (conn.State != System.Data.ConnectionState.Open) await conn.OpenAsync();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT COUNT(*) FROM app_companies";
            totalCompanies = Convert.ToInt32(await cmd.ExecuteScalarAsync());
        }
        catch
        {
            totalCompanies = 0;
        }

        // Table row counts
        var tableNames = new[]
        {
            "fs_accounts", "fs_checkmas", "fs_checkvou", "fs_cashrcpt",
            "fs_salebook", "fs_purcbook", "fs_adjstmnt", "fs_journals",
            "fs_pournals", "fs_banks", "fs_supplier", "fs_signatories",
            "PayMaster", "PayTmcard", "PayDept", "PayTaxTab"
        };

        var rowCounts = new Dictionary<string, int>();
        try
        {
            using var conn = _db.Database.GetDbConnection();
            if (conn.State != System.Data.ConnectionState.Open) await conn.OpenAsync();
            foreach (var table in tableNames)
            {
                try
                {
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = $"SELECT COUNT(*) FROM {table}";
                    rowCounts[table] = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                }
                catch
                {
                    rowCounts[table] = -1;
                }
            }
        }
        catch { /* ignore connection errors */ }

        // Define the "start of day"
        DateTime since;
        if (!string.IsNullOrEmpty(localMidnight) && DateTime.TryParse(localMidnight, out var parsed))
        {
            since = parsed.ToUniversalTime();
        }
        else
        {
            since = DateTime.UtcNow.Date; // Fallback to UTC midnight
        }

        // Audit events since local midnight
        var recentAuditEvents = await _db.AppAuditLogs
            .Where(l => l.CreatedAtUtc >= since)
            .CountAsync();

        // Complete log entries for the day (up to 500 for the rich timeline chart)
        var recentLogs = await _db.AppAuditLogs
            .Where(l => l.CreatedAtUtc >= since)
            .OrderByDescending(l => l.CreatedAtUtc)
            .Take(500)
            .Select(l => new
            {
                l.Id,
                l.Username,
                l.EventType,
                l.Resource,
                l.Success,
                l.IpAddress,
                l.Details,
                l.CreatedAtUtc
            })
            .ToListAsync();

        return Ok(new
        {
            activeSessionCount,
            totalUsers,
            totalCompanies,
            tableRowCounts = rowCounts,
            recentAuditEvents,
            recentLogs
        });
    }
}
