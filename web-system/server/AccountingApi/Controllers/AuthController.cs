using AccountingApi.Models;
using Microsoft.AspNetCore.Mvc;

namespace AccountingApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    [HttpPost("login")]
    public ActionResult<LoginResponse> Login([FromBody] LoginRequest request)
    {
        var validUsers = new Dictionary<string, (string Password, string Role, bool CanFs, bool CanPayroll)>(StringComparer.OrdinalIgnoreCase)
        {
            ["superadmin"] = ("SUPERadmin", "superadmin", true, true),
            ["tester"] = ("tester", "tester", true, false)
        };

        if (!validUsers.TryGetValue(request.Username, out var account) || account.Password != request.Password)
        {
            return Unauthorized(new LoginResponse(false, "Invalid username or password", null, null));
        }

        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        var user = new UserInfo(request.Username, account.Role, account.CanFs, account.CanPayroll);
        return Ok(new LoginResponse(true, "Login successful", user, token));
    }
}
