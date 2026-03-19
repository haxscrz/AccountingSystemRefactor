namespace AccountingApi.Models;

public sealed record LoginRequest(string Username, string Password);

public sealed record LoginResponse(bool Success, string Message, UserInfo? User, string? Token);

public sealed record UserInfo(string Username, string Role, bool CanAccessFs, bool CanAccessPayroll);
