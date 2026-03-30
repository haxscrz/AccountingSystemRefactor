using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AccountingApi.Models;
using Microsoft.IdentityModel.Tokens;

namespace AccountingApi.Services;

public sealed class TokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public TokenPair CreateTokenPair(AppUser user)
    {
        var now = DateTime.UtcNow;
        var accessExpiry = now.AddMinutes(15);
        var refreshExpiry = now.AddDays(30);

        var accessToken = CreateAccessToken(user, accessExpiry);
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

        return new TokenPair(accessToken, accessExpiry, refreshToken, refreshExpiry);
    }

    public string HashRefreshToken(string refreshToken)
    {
        using var sha = SHA256.Create();
        var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToHexString(hash);
    }

    private string CreateAccessToken(AppUser user, DateTime expiresAtUtc)
    {
        var issuer = _configuration["JWT_ISSUER"] ?? _configuration["Jwt:Issuer"] ?? "AccountingSystem";
        var audience = _configuration["JWT_AUDIENCE"] ?? _configuration["Jwt:Audience"] ?? "AccountingSystem.Client";
        var signingKey = _configuration["JWT_SIGNING_KEY"] ?? _configuration["Jwt:SigningKey"];

        if (string.IsNullOrWhiteSpace(signingKey))
        {
            throw new InvalidOperationException("JWT_SIGNING_KEY is not configured. Set it as an environment variable.");
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Username),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Role, user.Role),
            new("uid", user.Id.ToString()),
            new("can_fs", user.CanAccessFs ? "true" : "false"),
            new("can_payroll", user.CanAccessPayroll ? "true" : "false")
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAtUtc,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
