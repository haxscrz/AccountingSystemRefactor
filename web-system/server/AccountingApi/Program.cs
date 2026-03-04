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

// Ensure all tables exist on first run (fresh DB from GitHub clone)
using (var initScope = app.Services.CreateScope())
{
    var db = initScope.ServiceProvider.GetRequiredService<AccountingDbContext>();

    // Creates ALL tables defined in DbContext if they don't exist yet.
    // Safe to call every startup — no-op when tables already exist.
    db.Database.EnsureCreated();

    // Seed a default fs_sys_id row so the FS Main Menu works on first boot
    if (!db.FSSysId.Any())
    {
        var now = DateTime.UtcNow;
        db.FSSysId.Add(new AccountingApi.Models.FSSysId
        {
            PresMo    = now.Month,
            PresYr    = now.Year,
            BegDate   = new DateTime(now.Year, now.Month, 1),
            EndDate   = new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month)),
            UpdatedAt = now
        });
        db.SaveChanges();
    }

    // Seed a default pay_sys_id row so the Payroll module works on first boot
    if (!db.PaySysId.Any())
    {
        var now = DateTime.UtcNow;
        db.PaySysId.Add(new AccountingApi.Models.PaySysId
        {
            PresMo   = now.Month,
            PresYr   = now.Year,
            BegDate  = new DateTime(now.Year, now.Month, 1),
            EndDate  = new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month))
        });
        db.SaveChanges();
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("frontend");
app.MapControllers();

app.Run();
