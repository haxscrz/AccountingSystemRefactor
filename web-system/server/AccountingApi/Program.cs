using AccountingApi.Services;
using AccountingApi.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Data Source=accounting.db";
builder.Services.AddDbContext<AccountingDbContext>(options =>
    options.UseSqlite(connectionString));

// Services
builder.Services.AddSingleton<LegacyDataService>();

// FS (Financial Statement) Services
builder.Services.AddScoped<IFSAccountService, FSAccountService>();
builder.Services.AddScoped<IFSVoucherService, FSVoucherService>();
builder.Services.AddScoped<IFSJournalService, FSJournalService>();
builder.Services.AddScoped<IFSMonthEndService, FSMonthEndService>();
builder.Services.AddScoped<FSPostingService>();
builder.Services.AddScoped<FSReportService>();

// Payroll Services
builder.Services.AddScoped<PayrollComputationService>();
builder.Services.AddScoped<EmployeeService>();
builder.Services.AddScoped<TimecardService>();

builder.Services.AddScoped<DatabaseSeeder>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy
            .SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost" || new Uri(origin).Host == "127.0.0.1")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Ensure new tables exist (SQLite safe – no-op if already created)
using (var initScope = app.Services.CreateScope())
{
    var db = initScope.ServiceProvider.GetRequiredService<AccountingDbContext>();
    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS fs_effects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            gl_report TEXT NOT NULL DEFAULT '',
            gl_effect TEXT NOT NULL DEFAULT '',
            gl_head   TEXT
        );");
    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS fs_schedule (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            gl_head   TEXT NOT NULL DEFAULT '',
            acct_code TEXT NOT NULL DEFAULT '',
            acct_desc TEXT
        );");
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("frontend");
app.MapControllers();

app.Run();
