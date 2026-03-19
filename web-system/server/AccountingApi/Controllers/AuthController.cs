using AccountingApi.Models;
using AccountingApi.Data;
using AccountingApi.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;

namespace AccountingApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    private const int MaxFailedLogins = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    private readonly AccountingDbContext _db;
    private readonly PasswordHashService _passwordHasher;
    private readonly TokenService _tokenService;
    private readonly AuditLogService _audit;

    public AuthController(
        AccountingDbContext db,
        PasswordHashService passwordHasher,
        TokenService tokenService,
        AuditLogService audit)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _audit = audit;
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth-login")]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Unauthorized(new LoginResponse(false, "Invalid username or password", null, null));
        }

        var normalized = request.Username.Trim();
        var user = await _db.AppUsers.FirstOrDefaultAsync(u => u.Username == normalized, cancellationToken);
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        if (user is null || !user.IsActive)
        {
            await _audit.WriteAsync("login", "/api/auth/login", false, null, normalized, ipAddress, userAgent, "Unknown or inactive user", cancellationToken);
            return Unauthorized(new LoginResponse(false, "Invalid username or password", null, null));
        }

        if (user.LockoutEndUtc.HasValue && user.LockoutEndUtc > DateTime.UtcNow)
        {
            await _audit.WriteAsync("login", "/api/auth/login", false, user.Id, user.Username, ipAddress, userAgent, "Locked out", cancellationToken);
            return Unauthorized(new LoginResponse(false, "Account temporarily locked due to repeated failed logins.", null, null));
        }

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash, user.PasswordSalt, user.HashIterations))
        {
            user.FailedLoginCount += 1;
            user.LastFailedLoginUtc = DateTime.UtcNow;
            if (user.FailedLoginCount >= MaxFailedLogins)
            {
                user.LockoutEndUtc = DateTime.UtcNow.Add(LockoutDuration);
                user.FailedLoginCount = 0;
            }
            user.UpdatedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            await _audit.WriteAsync("login", "/api/auth/login", false, user.Id, user.Username, ipAddress, userAgent, "Invalid password", cancellationToken);
            return Unauthorized(new LoginResponse(false, "Invalid username or password", null, null));
        }

        user.FailedLoginCount = 0;
        user.LockoutEndUtc = null;
        user.LastLoginUtc = DateTime.UtcNow;
        user.UpdatedAtUtc = DateTime.UtcNow;

        var tokens = _tokenService.CreateTokenPair(user);
        var refreshHash = _tokenService.HashRefreshToken(tokens.RefreshToken);

        _db.AppRefreshTokens.Add(new AppRefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshHash,
            ExpiresAtUtc = tokens.RefreshTokenExpiresAtUtc,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedByIp = ipAddress,
            UserAgent = userAgent
        });
        await _db.SaveChangesAsync(cancellationToken);

        await _audit.WriteAsync("login", "/api/auth/login", true, user.Id, user.Username, ipAddress, userAgent, null, cancellationToken);

        var userInfo = new UserInfo(user.Username, user.Role, user.CanAccessFs, user.CanAccessPayroll);
        return Ok(new LoginResponse(true, "Login successful", userInfo, tokens));
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<ActionResult<LoginResponse>> Refresh([FromBody] RefreshRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            return Unauthorized(new LoginResponse(false, "Invalid refresh token", null, null));

        var refreshHash = _tokenService.HashRefreshToken(request.RefreshToken);
        var existing = await _db.AppRefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == refreshHash, cancellationToken);
        if (existing is null || existing.RevokedAtUtc.HasValue || existing.ExpiresAtUtc <= DateTime.UtcNow)
            return Unauthorized(new LoginResponse(false, "Invalid refresh token", null, null));

        var user = await _db.AppUsers.FirstOrDefaultAsync(u => u.Id == existing.UserId, cancellationToken);
        if (user is null || !user.IsActive)
            return Unauthorized(new LoginResponse(false, "Invalid refresh token", null, null));

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        var newTokens = _tokenService.CreateTokenPair(user);
        var newRefreshHash = _tokenService.HashRefreshToken(newTokens.RefreshToken);

        existing.RevokedAtUtc = DateTime.UtcNow;
        existing.ReplacedByTokenHash = newRefreshHash;

        _db.AppRefreshTokens.Add(new AppRefreshToken
        {
            UserId = user.Id,
            TokenHash = newRefreshHash,
            ExpiresAtUtc = newTokens.RefreshTokenExpiresAtUtc,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedByIp = ipAddress,
            UserAgent = userAgent
        });
        await _db.SaveChangesAsync(cancellationToken);

        await _audit.WriteAsync("refresh", "/api/auth/refresh", true, user.Id, user.Username, ipAddress, userAgent, null, cancellationToken);
        var userInfo = new UserInfo(user.Username, user.Role, user.CanAccessFs, user.CanAccessPayroll);
        return Ok(new LoginResponse(true, "Token refreshed", userInfo, newTokens));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            var hash = _tokenService.HashRefreshToken(request.RefreshToken);
            var token = await _db.AppRefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);
            if (token is not null && !token.RevokedAtUtc.HasValue)
            {
                token.RevokedAtUtc = DateTime.UtcNow;
                await _db.SaveChangesAsync(cancellationToken);
            }
        }

        var username = User.Identity?.Name;
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();
        await _audit.WriteAsync("logout", "/api/auth/logout", true, null, username, ipAddress, userAgent, null, cancellationToken);
        return Ok(new { success = true });
    }
}
