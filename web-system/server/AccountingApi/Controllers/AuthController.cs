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
        var validUsers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["admin"] = "admin",
            ["accountant"] = "accountant123"
        };

        if (!validUsers.TryGetValue(request.Username, out var password) || password != request.Password)
        {
            return Unauthorized(new LoginResponse(false, "Invalid username or password", null, null));
        }

        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        var user = new UserInfo(request.Username, "admin");
        return Ok(new LoginResponse(true, "Login successful", user, token));
    }
}
