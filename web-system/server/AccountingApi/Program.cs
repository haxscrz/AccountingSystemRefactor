using AccountingApi.Services;
using AccountingApi.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Use camelCase so frontend TypeScript mappers receive camelCase property names
        // (e.g. JJvNo → jJvNo, CurrentMonth → currentMonth)
        // Snake_case payroll properties (emp_no etc.) are unaffected as their first letter is already lowercase
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
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
builder.Services.AddScoped<LegacySeedingService>();

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

    // ── Schema patches: add new columns to existing tables if they don't exist ──
    // SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we use PRAGMA to check.
    using (var conn = db.Database.GetDbConnection())
    {
        conn.Open();

        // Helper: returns set of column names already in a table
        System.Collections.Generic.HashSet<string> GetColumns(string table)
        {
            var cols = new System.Collections.Generic.HashSet<string>(StringComparer.OrdinalIgnoreCase);
            using var cmd = conn.CreateCommand();
            cmd.CommandText = $"PRAGMA table_info({table})";
            using var r = cmd.ExecuteReader();
            while (r.Read()) cols.Add(r.GetString(1));
            return cols;
        }

        void AddColumn(string table, string column, string sqlType)
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = $"ALTER TABLE {table} ADD COLUMN {column} {sqlType}";
            try { cmd.ExecuteNonQuery(); } catch { /* column already exists */ }
        }

        void RunSql(string sql)
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = sql;
            try { cmd.ExecuteNonQuery(); } catch { }
        }

        // Patch pay_sys_id: add pay_type, work_hours, need_backup, sys_nm
        var sysIdCols = GetColumns("pay_sys_id");
        if (!sysIdCols.Contains("pay_type"))    AddColumn("pay_sys_id", "pay_type",   "INTEGER DEFAULT 1");
        if (!sysIdCols.Contains("work_hours"))  AddColumn("pay_sys_id", "work_hours", "INTEGER DEFAULT 80");
        if (!sysIdCols.Contains("need_backup")) AddColumn("pay_sys_id", "need_backup","INTEGER DEFAULT 0");
        if (!sysIdCols.Contains("sys_nm"))      AddColumn("pay_sys_id", "sys_nm",     "TEXT NOT NULL DEFAULT ''");

        // Create pay_prempaid if it doesn't exist
        RunSql(@"
            CREATE TABLE IF NOT EXISTS pay_prempaid (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                preflag   TEXT NOT NULL DEFAULT 'S',
                month     TEXT NOT NULL DEFAULT '',
                year      TEXT NOT NULL DEFAULT '',
                or_sbr    TEXT NOT NULL DEFAULT '',
                or_date   TEXT,
                period    TEXT NOT NULL DEFAULT '',
                amount    REAL NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            )");

        conn.Close();
    }

    // Auto-seed from legacy JSON files if the database is empty (fresh clone)
    if (!db.FSAccounts.Any())
    {
        var seeder = initScope.ServiceProvider.GetRequiredService<LegacySeedingService>();
        var result = seeder.SeedAsync().GetAwaiter().GetResult();
        var total  = result.Values.Sum();
        if (total > 0)
            Console.WriteLine($"[startup] Auto-seeded {total} legacy records across {result.Count} tables.");
        else
            Console.WriteLine("[startup] No legacy JSON files found — starting with empty database.");
    }

    // Ensure fs_sys_id has at least one row (main menu needs it)
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

    // Ensure pay_sys_id has at least one row (payroll module needs it)
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
