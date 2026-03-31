using AccountingApi.Services;
using AccountingApi.Data;
using AccountingApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccountingApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class AdminController : ControllerBase
{
    private readonly DatabaseSeeder _seeder;
    private readonly AccountingDbContext _db;
    private readonly PasswordHashService _passwordHasher;

    public AdminController(DatabaseSeeder seeder, AccountingDbContext db, PasswordHashService passwordHasher)
    {
        _seeder = seeder;
        _db = db;
        _passwordHasher = passwordHasher;
    }

    [HttpPost("seed")]
    [Authorize(Policy = "SuperAdminOnly")]
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

    // Audit logs: accessible to any authenticated FS user (not superadmin-only)
    [HttpGet("audit-logs")]
    [Authorize(Policy = "CanFs")]
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

    // ══════════════════════════════════════════════════════════════════════════
    // USER MANAGEMENT (SuperAdmin Only)
    // ══════════════════════════════════════════════════════════════════════════

    public sealed record UserListItem(
        int Id, string Username, string Role,
        bool CanAccessFs, bool CanAccessPayroll,
        bool IsActive, string? ProfileImageUrl, string[]? AssignedCompanies,
        DateTime? LastLoginUtc, DateTime CreatedAtUtc);

    public sealed record CreateUserRequest(
        string Username, string Password, string Role,
        bool CanAccessFs, bool CanAccessPayroll, string[]? AssignedCompanies);

    public sealed record UpdateUserRequest(
        string? Username, string? Role, bool? CanAccessFs, bool? CanAccessPayroll,
        bool? IsActive, string? ProfileImageUrl, string? PreferencesJson,
        string[]? AssignedCompanies);

    public sealed record ResetPasswordRequest(string NewPassword);

    // GET /api/admin/users
    [HttpGet("users")]
    [Authorize(Policy = "SuperAdminOnly")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _db.AppUsers
            .AsNoTracking()
            .OrderBy(u => u.Username)
            .Select(u => new UserListItem(
                u.Id, u.Username, u.Role,
                u.CanAccessFs, u.CanAccessPayroll,
                u.IsActive, u.ProfileImageUrl, 
                string.IsNullOrWhiteSpace(u.AssignedCompaniesJson) ? null : System.Text.Json.JsonSerializer.Deserialize<string[]>(u.AssignedCompaniesJson, (System.Text.Json.JsonSerializerOptions)null),
                u.LastLoginUtc, u.CreatedAtUtc))
            .ToListAsync();

        return Ok(users);
    }

    // GET /api/admin/users/{id}
    [HttpGet("users/{id:int}")]
    [Authorize(Policy = "SuperAdminOnly")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _db.AppUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null) return NotFound(new { message = "User not found" });

        return Ok(new UserListItem(
            user.Id, user.Username, user.Role,
            user.CanAccessFs, user.CanAccessPayroll,
            user.IsActive, user.ProfileImageUrl,
            string.IsNullOrWhiteSpace(user.AssignedCompaniesJson) ? null : System.Text.Json.JsonSerializer.Deserialize<string[]>(user.AssignedCompaniesJson, (System.Text.Json.JsonSerializerOptions)null),
            user.LastLoginUtc, user.CreatedAtUtc));
    }

    // POST /api/admin/users
    [HttpPost("users")]
    [Authorize(Policy = "SuperAdminOnly")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Username and password are required." });

        if (request.Password.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters." });

        var normalizedLower = request.Username.Trim().ToLowerInvariant();
        var exists = await _db.AppUsers.AnyAsync(u => u.Username.ToLower() == normalizedLower, ct);
        if (exists)
            return Conflict(new { message = "Username already exists." });

        var validRoles = new[] { "superadmin", "accountant", "tester" };
        var role = validRoles.Contains(request.Role?.ToLower()) ? request.Role.ToLower() : "accountant";

        var (hash, salt, iterations) = _passwordHasher.HashPassword(request.Password);

        var user = new AppUser
        {
            Username = request.Username.Trim(),
            PasswordHash = hash,
            PasswordSalt = salt,
            HashIterations = iterations,
            Role = role,
            CanAccessFs = request.CanAccessFs,
            CanAccessPayroll = request.CanAccessPayroll,
            AssignedCompaniesJson = request.AssignedCompanies != null ? System.Text.Json.JsonSerializer.Serialize(request.AssignedCompanies) : null,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _db.AppUsers.Add(user);
        await _db.SaveChangesAsync(ct);

        return Ok(new UserListItem(
            user.Id, user.Username, user.Role,
            user.CanAccessFs, user.CanAccessPayroll,
            user.IsActive, user.ProfileImageUrl,
            string.IsNullOrWhiteSpace(user.AssignedCompaniesJson) ? null : System.Text.Json.JsonSerializer.Deserialize<string[]>(user.AssignedCompaniesJson, (System.Text.Json.JsonSerializerOptions)null),
            user.LastLoginUtc, user.CreatedAtUtc));
    }

    // PUT /api/admin/users/{id}
    [HttpPut("users/{id:int}")]
    [Authorize(Policy = "SuperAdminOnly")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        var user = await _db.AppUsers.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return NotFound(new { message = "User not found" });

        if (!string.IsNullOrWhiteSpace(request.Username) && !string.Equals(user.Username, request.Username, StringComparison.OrdinalIgnoreCase))
        {
            var exists = await _db.AppUsers.AnyAsync(u => u.Username.ToLower() == request.Username.ToLower(), ct);
            if (exists) return BadRequest(new { message = "Username already taken." });
            user.Username = request.Username;
        }

        if (request.Role is not null)
        {
            var validRoles = new[] { "superadmin", "accountant", "tester" };
            if (validRoles.Contains(request.Role.ToLower()))
                user.Role = request.Role.ToLower();
        }

        if (request.CanAccessFs.HasValue) user.CanAccessFs = request.CanAccessFs.Value;
        if (request.CanAccessPayroll.HasValue) user.CanAccessPayroll = request.CanAccessPayroll.Value;
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;
        if (request.ProfileImageUrl is not null) user.ProfileImageUrl = request.ProfileImageUrl;
        if (request.PreferencesJson is not null) user.PreferencesJson = request.PreferencesJson;
        if (request.AssignedCompanies is not null) user.AssignedCompaniesJson = System.Text.Json.JsonSerializer.Serialize(request.AssignedCompanies);

        user.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Ok(new UserListItem(
            user.Id, user.Username, user.Role,
            user.CanAccessFs, user.CanAccessPayroll,
            user.IsActive, user.ProfileImageUrl,
            string.IsNullOrWhiteSpace(user.AssignedCompaniesJson) ? null : System.Text.Json.JsonSerializer.Deserialize<string[]>(user.AssignedCompaniesJson, (System.Text.Json.JsonSerializerOptions)null),
            user.LastLoginUtc, user.CreatedAtUtc));
    }

    // POST /api/admin/users/{id}/reset-password
    [HttpPost("users/{id:int}/reset-password")]
    [Authorize(Policy = "SuperAdminOnly")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters." });

        var user = await _db.AppUsers.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return NotFound(new { message = "User not found" });

        var (hash, salt, iterations) = _passwordHasher.HashPassword(request.NewPassword);
        user.PasswordHash = hash;
        user.PasswordSalt = salt;
        user.HashIterations = iterations;
        user.FailedLoginCount = 0;
        user.LockoutEndUtc = null;
        user.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Password reset successfully." });
    }

    // DELETE /api/admin/users/{id}
    [HttpDelete("users/{id:int}")]
    [Authorize(Policy = "SuperAdminOnly")]
    public async Task<IActionResult> DeleteUser(int id, CancellationToken ct)
    {
        var user = await _db.AppUsers.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return NotFound(new { message = "User not found" });

        // Prevent deleting own account
        var currentUsername = User.Identity?.Name;
        if (string.Equals(user.Username, currentUsername, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "You cannot delete your own account." });

        _db.AppUsers.Remove(user);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "User deleted." });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // USER PREFERENCES (per-user settings persistence)
    // ══════════════════════════════════════════════════════════════════════════

    // GET /api/admin/my-preferences
    [HttpGet("my-preferences")]
    [Authorize]
    public async Task<IActionResult> GetMyPreferences()
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrWhiteSpace(username))
            return Unauthorized();

        var user = await _db.AppUsers.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());

        if (user is null) return NotFound();

        return Ok(new { preferencesJson = user.PreferencesJson ?? "{}", profileImageUrl = user.ProfileImageUrl });
    }

    // PUT /api/admin/my-preferences
    [HttpPut("my-preferences")]
    [Authorize]
    public async Task<IActionResult> UpdateMyPreferences([FromBody] UpdatePreferencesRequest request, CancellationToken ct)
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrWhiteSpace(username))
            return Unauthorized();

        var user = await _db.AppUsers
            .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower(), ct);

        if (user is null) return NotFound();

        if (request.PreferencesJson is not null) user.PreferencesJson = request.PreferencesJson;
        if (request.ProfileImageUrl is not null) user.ProfileImageUrl = request.ProfileImageUrl;

        user.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Preferences saved." });
    }

    public sealed record UpdatePreferencesRequest(string? PreferencesJson, string? ProfileImageUrl);
}
