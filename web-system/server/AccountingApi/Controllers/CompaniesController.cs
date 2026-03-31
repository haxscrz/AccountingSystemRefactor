using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using AccountingApi.Data;

namespace AccountingApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CompaniesController : ControllerBase
{
    private readonly AccountingDbContext _db;

    public CompaniesController(AccountingDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetCompanies()
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();

        var user = await _db.AppUsers.FindAsync(userId);
        if (user == null) return Unauthorized();

        using var conn = _db.Database.GetDbConnection();
        var companies = await conn.QueryAsync("SELECT code, name FROM app_companies ORDER BY name");

        if (user.Role != "superadmin")
        {
            if (string.IsNullOrWhiteSpace(user.AssignedCompaniesJson))
            {
                companies = Array.Empty<dynamic>();
            }
            else
            {
                var assigned = System.Text.Json.JsonSerializer.Deserialize<string[]>(user.AssignedCompaniesJson);
                if (assigned != null)
                {
                    companies = companies.Where(c => assigned.Contains((string)c.code));
                }
                else
                {
                    companies = Array.Empty<dynamic>();
                }
            }
        }

        return Ok(companies);
    }

    [HttpPost]
    [Authorize(Policy = "SuperAdminOnly")]
    public async Task<IActionResult> CreateCompany([FromBody] CreateCompanyRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Code and Name are required." });

        using var conn = _db.Database.GetDbConnection();
        var exists = await conn.QuerySingleOrDefaultAsync<int>("SELECT COUNT(1) FROM app_companies WHERE code = @Code", new { request.Code });
        if (exists > 0) return BadRequest(new { message = "Company code already exists." });

        await conn.ExecuteAsync("INSERT INTO app_companies (code, name, created_at_utc) VALUES (@Code, @Name, datetime('now'))", new { request.Code, request.Name });
        return Ok(new { message = "Company created." });
    }

    [HttpDelete("{code}")]
    [Authorize(Policy = "SuperAdminOnly")]
    public async Task<IActionResult> DeleteCompany(string code)
    {
        using var conn = _db.Database.GetDbConnection();
        await conn.ExecuteAsync("DELETE FROM app_companies WHERE code = @code", new { code });
        return Ok(new { message = "Company deleted." });
    }

    public sealed record CreateCompanyRequest(string Code, string Name);
}
