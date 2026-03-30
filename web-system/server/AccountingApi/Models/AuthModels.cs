using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AccountingApi.Models;

public sealed record LoginRequest(string Username, string Password);
public sealed record RefreshRequest(string RefreshToken);
public sealed record LogoutRequest(string RefreshToken);

public sealed record LoginResponse(bool Success, string Message, UserInfo? User, TokenPair? Tokens);

public sealed record UserInfo(string Username, string Role, bool CanAccessFs, bool CanAccessPayroll, string[]? AssignedCompanies);

public sealed record TokenPair(
	string AccessToken,
	DateTime AccessTokenExpiresAtUtc,
	string RefreshToken,
	DateTime RefreshTokenExpiresAtUtc);

[Table("app_users")]
public sealed class AppUser
{
	[Key]
	public int Id { get; set; }

	[Required]
	[Column("username")]
	[MaxLength(80)]
	public string Username { get; set; } = string.Empty;

	[Required]
	[Column("password_hash")]
	[MaxLength(256)]
	public string PasswordHash { get; set; } = string.Empty;

	[Required]
	[Column("password_salt")]
	[MaxLength(128)]
	public string PasswordSalt { get; set; } = string.Empty;

	[Column("hash_iterations")]
	public int HashIterations { get; set; }

	[Column("role")]
	[MaxLength(40)]
	public string Role { get; set; } = "tester";

	[Column("can_access_fs")]
	public bool CanAccessFs { get; set; }

	[Column("can_access_payroll")]
	public bool CanAccessPayroll { get; set; }

	[Column("is_active")]
	public bool IsActive { get; set; } = true;

	[Column("failed_login_count")]
	public int FailedLoginCount { get; set; }

	[Column("profile_image_url")]
	[MaxLength(1000)]
	public string? ProfileImageUrl { get; set; }

	[Column("assigned_companies_json")]
	public string? AssignedCompaniesJson { get; set; }

	[Column("preferences_json")]
	public string? PreferencesJson { get; set; }

	[Column("lockout_end_utc")]
	public DateTime? LockoutEndUtc { get; set; }

	[Column("last_failed_login_utc")]
	public DateTime? LastFailedLoginUtc { get; set; }

	[Column("last_login_utc")]
	public DateTime? LastLoginUtc { get; set; }

	[Column("created_at_utc")]
	public DateTime CreatedAtUtc { get; set; }

	[Column("updated_at_utc")]
	public DateTime UpdatedAtUtc { get; set; }
}

[Table("app_refresh_tokens")]
public sealed class AppRefreshToken
{
	[Key]
	public int Id { get; set; }

	[Column("user_id")]
	public int UserId { get; set; }

	[Column("token_hash")]
	[MaxLength(128)]
	public string TokenHash { get; set; } = string.Empty;

	[Column("expires_at_utc")]
	public DateTime ExpiresAtUtc { get; set; }

	[Column("created_at_utc")]
	public DateTime CreatedAtUtc { get; set; }

	[Column("revoked_at_utc")]
	public DateTime? RevokedAtUtc { get; set; }

	[Column("replaced_by_token_hash")]
	[MaxLength(128)]
	public string? ReplacedByTokenHash { get; set; }

	[Column("created_by_ip")]
	[MaxLength(128)]
	public string? CreatedByIp { get; set; }

	[Column("user_agent")]
	[MaxLength(512)]
	public string? UserAgent { get; set; }
}

[Table("app_audit_logs")]
public sealed class AppAuditLog
{
	[Key]
	public long Id { get; set; }

	[Column("user_id")]
	public int? UserId { get; set; }

	[Column("username")]
	[MaxLength(80)]
	public string? Username { get; set; }

	[Column("event_type")]
	[MaxLength(64)]
	public string EventType { get; set; } = string.Empty;

	[Column("resource")]
	[MaxLength(200)]
	public string Resource { get; set; } = string.Empty;

	[Column("success")]
	public bool Success { get; set; }

	[Column("ip_address")]
	[MaxLength(128)]
	public string? IpAddress { get; set; }

	[Column("user_agent")]
	[MaxLength(512)]
	public string? UserAgent { get; set; }

	[Column("details")]
	[MaxLength(2000)]
	public string? Details { get; set; }

	[Column("created_at_utc")]
	public DateTime CreatedAtUtc { get; set; }
}
