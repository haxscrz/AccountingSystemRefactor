using AccountingApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace AccountingApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AdminController : ControllerBase
{
    private readonly DatabaseSeeder _seeder;

    public AdminController(DatabaseSeeder seeder)
    {
        _seeder = seeder;
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
}
