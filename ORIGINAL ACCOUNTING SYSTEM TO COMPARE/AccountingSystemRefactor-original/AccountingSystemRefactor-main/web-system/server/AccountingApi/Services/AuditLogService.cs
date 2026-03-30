using AccountingApi.Data;
using AccountingApi.Models;

namespace AccountingApi.Services;

public sealed class AuditLogService
{
    private readonly AccountingDbContext _db;

    public AuditLogService(AccountingDbContext db)
    {
        _db = db;
    }

    public async Task WriteAsync(
        string eventType,
        string resource,
        bool success,
        int? userId = null,
        string? username = null,
        string? ipAddress = null,
        string? userAgent = null,
        string? details = null,
        CancellationToken cancellationToken = default)
    {
        _db.AppAuditLogs.Add(new AppAuditLog
        {
            EventType = eventType,
            Resource = resource,
            Success = success,
            UserId = userId,
            Username = username,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Details = details,
            CreatedAtUtc = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(cancellationToken);
    }
}
