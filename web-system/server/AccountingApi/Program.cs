using AccountingApi.Services;
using AccountingApi.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;

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
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICompanyContextAccessor, CompanyContextAccessor>();

// Resolve SQLite path relative to app root so Azure doesn't create a blank DB in the wrong directory
// IMPORTANT: The filename must be changed to a NEW name each time we want Azure to deploy a fresh DB.
// Azure App Service's persistent storage will keep the old DB file if the name stays the same.
// Current: accounting_v8.db — Gian fully restored from raw backup with:
//   12 Feb checks (current period) + 18 ADV-prefixed advance CDVs
//   16 journals + 3 cash receipts + 3 sales book + correct fs_sys_id (Feb 2026)
var rawConnStr = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=accounting_v8.db";
if (rawConnStr.Contains("Data Source=") && !Path.IsPathRooted(rawConnStr.Replace("Data Source=", "")))
{
    var dbFileName = rawConnStr.Replace("Data Source=", "").Trim();
    var absoluteDbPath = Path.Combine(builder.Environment.ContentRootPath, dbFileName);
    rawConnStr = $"Data Source={absoluteDbPath}";
}
builder.Services.AddDbContext<AccountingDbContext>(options => options.UseSqlite(rawConnStr));

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
builder.Services.AddScoped<PasswordHashService>();
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<AuditLogService>();

var jwtIssuer = builder.Configuration["JWT_ISSUER"] ?? builder.Configuration["Jwt:Issuer"] ?? "AccountingSystem";
var jwtAudience = builder.Configuration["JWT_AUDIENCE"] ?? builder.Configuration["Jwt:Audience"] ?? "AccountingSystem.Client";
var jwtSigningKey = builder.Configuration["JWT_SIGNING_KEY"] ?? builder.Configuration["Jwt:SigningKey"];

if (string.IsNullOrWhiteSpace(jwtSigningKey))
{
    throw new InvalidOperationException("JWT_SIGNING_KEY is required. Configure it via environment variables.");
}

var jwtKeyBytes = Encoding.UTF8.GetBytes(jwtSigningKey);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(jwtKeyBytes),
            NameClaimType = ClaimTypes.Name,
            RoleClaimType = ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanFs", policy => policy.RequireClaim("can_fs", "true"));
    options.AddPolicy("CanPayroll", policy => policy.RequireClaim("can_payroll", "true"));
    options.AddPolicy("SuperAdminOnly", policy => policy.RequireRole("superadmin"));
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.AddPolicy("auth-login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst
            }));
});

var corsAllowedOrigins = (builder.Configuration["CORS_ALLOWED_ORIGINS"] ?? string.Empty)
    .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        if (corsAllowedOrigins.Length > 0)
        {
            policy
                .WithOrigins(corsAllowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            policy
                .SetIsOriginAllowed(origin =>
                {
                    var host = new Uri(origin).Host;
                    return host == "localhost" || host == "127.0.0.1";
                })
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
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

        // Multi-company (single DB): add tenant discriminator to all business tables.
        var tenantTables = new[]
        {
            "fs_accounts", "fs_checkmas", "fs_checkvou", "fs_pournals", "fs_cashrcpt", "fs_salebook",
            "fs_purcbook", "fs_adjstmnt", "fs_journals", "fs_effects", "fs_schedule", "fs_sys_id",
            "fs_banks", "fs_supplier", "fs_signatories",
            "pay_master", "pay_tmcard", "pay_sys_id", "pay_taxtab", "pay_prempaid", "pay_dept"
        };

        foreach (var table in tenantTables)
        {
            var cols = GetColumns(table);
            if (!cols.Contains("company_code"))
            {
                AddColumn(table, "company_code", $"TEXT NOT NULL DEFAULT '{CompanyCatalog.DefaultCompanyCode}'");
            }

            RunSql($"UPDATE {table} SET company_code = '{CompanyCatalog.DefaultCompanyCode}' WHERE company_code IS NULL OR trim(company_code) = ''");
            RunSql($"CREATE INDEX IF NOT EXISTS ix_{table}_company_code ON {table}(company_code)");
        }

        var softDeleteTables = new[]
        {
            "fs_checkmas", "fs_checkvou", "fs_cashrcpt", "fs_salebook", "fs_journals", "fs_purcbook", "fs_adjstmnt"
        };

        foreach (var table in softDeleteTables)
        {
            var cols = GetColumns(table);
            if (!cols.Contains("is_deleted"))
            {
                AddColumn(table, "is_deleted", "INTEGER NOT NULL DEFAULT 0");
            }
            if (!cols.Contains("deleted_at"))
            {
                AddColumn(table, "deleted_at", "TEXT NULL");
            }

            RunSql($"CREATE INDEX IF NOT EXISTS ix_{table}_is_deleted ON {table}(company_code, is_deleted)");
        }

        // Rebuild uniqueness to be company-scoped.
        RunSql("DROP INDEX IF EXISTS IX_fs_accounts_acct_code");
        RunSql("DROP INDEX IF EXISTS IX_pay_master_emp_no");
        RunSql("DROP INDEX IF EXISTS IX_pay_dept_dep_no");
        RunSql("CREATE UNIQUE INDEX IF NOT EXISTS IX_fs_accounts_company_acct_code ON fs_accounts(company_code, acct_code)");
        RunSql("CREATE UNIQUE INDEX IF NOT EXISTS IX_pay_master_company_emp_no ON pay_master(company_code, emp_no)");
        RunSql("CREATE UNIQUE INDEX IF NOT EXISTS IX_pay_dept_company_dep_no ON pay_dept(company_code, dep_no)");

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
                updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                company_code TEXT NOT NULL DEFAULT 'CS'
            )");

        RunSql(@"
            CREATE TABLE IF NOT EXISTS fs_banks (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                bank_no      INTEGER NOT NULL DEFAULT 0,
                bank_name    TEXT NOT NULL DEFAULT '',
                bank_addr    TEXT,
                bank_acct    TEXT,
                company_code TEXT NOT NULL DEFAULT 'CS'
            )");

        RunSql(@"
            CREATE TABLE IF NOT EXISTS fs_supplier (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                sup_no       INTEGER NOT NULL DEFAULT 0,
                sup_name     TEXT NOT NULL DEFAULT '',
                sup_addr     TEXT,
                sup_phone    TEXT,
                sup_fax      TEXT,
                sup_contak   TEXT,
                company_code TEXT NOT NULL DEFAULT 'CS'
            )");

        RunSql(@"
            CREATE TABLE IF NOT EXISTS fs_signatories (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                sign_name    TEXT NOT NULL DEFAULT '',
                sign_title   TEXT,
                is_active    INTEGER NOT NULL DEFAULT 1,
                company_code TEXT NOT NULL DEFAULT 'CS'
            )");

        // Company registry
        RunSql(@"
            CREATE TABLE IF NOT EXISTS app_companies (
                code TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                created_at_utc TEXT NOT NULL DEFAULT (datetime('now'))
            )");

        RunSql("INSERT OR IGNORE INTO app_companies (code, name) VALUES ('cyberfridge', 'CYBERFRIDGE GENERAL SERVICES INC')");
        RunSql("INSERT OR IGNORE INTO app_companies (code, name) VALUES ('johntrix', 'JOHNTRIX TECHNICAL SERVICES INC.')");
        RunSql("INSERT OR IGNORE INTO app_companies (code, name) VALUES ('thermalex', 'THERMALEX GENERAL SERVICES INC')");
        RunSql("INSERT OR IGNORE INTO app_companies (code, name) VALUES ('gmixteam', 'GMIXTEAM GENERAL SERVICES INC')");
        RunSql("INSERT OR IGNORE INTO app_companies (code, name) VALUES ('dynamiq', 'DYNAMIQ CIRQUE GENERAL SERVICES INC')");
        RunSql("INSERT OR IGNORE INTO app_companies (code, name) VALUES ('metaleon', 'METALEON GENERAL SERVICES INC')");
        RunSql("INSERT OR IGNORE INTO app_companies (code, name) VALUES ('3jcrt', '3JCRT GENERAL SERVICES INC')");
        RunSql("INSERT OR IGNORE INTO app_companies (code, name) VALUES ('gian', 'GIAN GENERAL SERVICES INC')");
        RunSql("INSERT OR IGNORE INTO app_companies (code, name) VALUES ('jimi', 'JIMI GENERAL SERVICES INC')");
        RunSql("INSERT OR IGNORE INTO app_companies (code, name) VALUES ('lmjay', 'LMJAY GENERAL SERVICES INC')");

        // Security tables
        RunSql(@"
            CREATE TABLE IF NOT EXISTS app_users (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                username            TEXT NOT NULL UNIQUE,
                password_hash       TEXT NOT NULL,
                password_salt       TEXT NOT NULL,
                hash_iterations     INTEGER NOT NULL,
                role                TEXT NOT NULL,
                can_access_fs       INTEGER NOT NULL DEFAULT 0,
                can_access_payroll  INTEGER NOT NULL DEFAULT 0,
                is_active           INTEGER NOT NULL DEFAULT 1,
                failed_login_count  INTEGER NOT NULL DEFAULT 0,
                lockout_end_utc     TEXT NULL,
                last_failed_login_utc TEXT NULL,
                last_login_utc      TEXT NULL,
                created_at_utc      TEXT NOT NULL,
                updated_at_utc      TEXT NOT NULL
            )");

        RunSql(@"
            CREATE TABLE IF NOT EXISTS app_refresh_tokens (
                id                    INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id               INTEGER NOT NULL,
                token_hash            TEXT NOT NULL UNIQUE,
                expires_at_utc        TEXT NOT NULL,
                created_at_utc        TEXT NOT NULL,
                revoked_at_utc        TEXT NULL,
                replaced_by_token_hash TEXT NULL,
                created_by_ip         TEXT NULL,
                user_agent            TEXT NULL
            )");

        RunSql(@"
            CREATE TABLE IF NOT EXISTS app_audit_logs (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id          INTEGER NULL,
                username         TEXT NULL,
                event_type       TEXT NOT NULL,
                resource         TEXT NOT NULL,
                success          INTEGER NOT NULL,
                ip_address       TEXT NULL,
                user_agent       TEXT NULL,
                details          TEXT NULL,
                created_at_utc   TEXT NOT NULL
            )");

        RunSql("CREATE INDEX IF NOT EXISTS ix_app_users_username ON app_users(username)");
        RunSql("CREATE INDEX IF NOT EXISTS ix_app_refresh_tokens_hash ON app_refresh_tokens(token_hash)");
        RunSql("CREATE INDEX IF NOT EXISTS ix_app_refresh_tokens_user_expiry ON app_refresh_tokens(user_id, expires_at_utc)");
        RunSql("CREATE INDEX IF NOT EXISTS ix_app_audit_created_at ON app_audit_logs(created_at_utc)");

        // Command Center tables
        RunSql(@"
            CREATE TABLE IF NOT EXISTS app_support_tickets (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                from_username   TEXT NOT NULL DEFAULT '',
                message         TEXT NOT NULL DEFAULT '',
                status          TEXT NOT NULL DEFAULT 'open',
                resolved_by     TEXT NULL,
                admin_notes     TEXT NULL,
                created_at_utc  TEXT NOT NULL DEFAULT (datetime('now')),
                resolved_at_utc TEXT NULL
            )");

        RunSql(@"
            CREATE TABLE IF NOT EXISTS app_announcements (
                id                INTEGER PRIMARY KEY AUTOINCREMENT,
                author_id         INTEGER NOT NULL,
                author_username   TEXT NOT NULL DEFAULT '',
                title             TEXT NOT NULL DEFAULT '',
                body              TEXT NOT NULL DEFAULT '',
                image_data        TEXT NULL,
                priority          TEXT NOT NULL DEFAULT 'normal',
                target_type       TEXT NOT NULL DEFAULT 'all',
                target_users_json TEXT NULL,
                created_at_utc    TEXT NOT NULL DEFAULT (datetime('now')),
                expires_at_utc    TEXT NULL
            )");

        RunSql(@"
            CREATE TABLE IF NOT EXISTS app_announcement_reactions (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                announcement_id INTEGER NOT NULL,
                user_id         INTEGER NOT NULL,
                username        TEXT NOT NULL DEFAULT '',
                reaction_type   TEXT NOT NULL DEFAULT 'like',
                created_at_utc  TEXT NOT NULL DEFAULT (datetime('now'))
            )");

        RunSql("CREATE INDEX IF NOT EXISTS ix_app_support_tickets_status ON app_support_tickets(status)");
        RunSql("CREATE INDEX IF NOT EXISTS ix_app_announcements_created ON app_announcements(created_at_utc)");
        RunSql("CREATE UNIQUE INDEX IF NOT EXISTS ix_app_reactions_unique ON app_announcement_reactions(announcement_id, user_id)");

        // ── User data isolation: add created_by_user_id to all tenant tables ──
        foreach (var table in tenantTables)
        {
            var cols = GetColumns(table);
            if (!cols.Contains("created_by_user_id"))
            {
                AddColumn(table, "created_by_user_id", "INTEGER NULL");
            }
        }

        // ── User profile fields ──
        var userCols = GetColumns("app_users");
        if (!userCols.Contains("profile_image_url"))
            AddColumn("app_users", "profile_image_url", "TEXT NULL");
        if (!userCols.Contains("preferences_json"))
            AddColumn("app_users", "preferences_json", "TEXT NULL");
        if (!userCols.Contains("assigned_companies_json"))
            AddColumn("app_users", "assigned_companies_json", "TEXT NULL");

        var resetAllBusinessData = string.Equals(
            builder.Configuration["RESET_ALL_BUSINESS_DATA_ON_STARTUP"],
            "true",
            StringComparison.OrdinalIgnoreCase);

        if (resetAllBusinessData)
        {
            var businessTables = new[]
            {
                "fs_checkvou", "fs_checkmas", "fs_cashrcpt", "fs_salebook", "fs_purcbook", "fs_adjstmnt", "fs_journals", "fs_pournals",
                "fs_schedule", "fs_effects", "fs_accounts", "fs_sys_id", "fs_banks", "fs_supplier", "fs_signatories",
                "pay_tmcard", "pay_master", "pay_dept", "pay_prempaid", "pay_taxtab", "pay_sys_id"
            };

            foreach (var table in businessTables)
            {
                RunSql($"DELETE FROM {table}");
            }

            Console.WriteLine("[startup] RESET_ALL_BUSINESS_DATA_ON_STARTUP enabled: all FS/Payroll business data was deleted.");
        }

        conn.Close();
    }

    var superadminPassword = builder.Configuration["SUPERADMIN_PASSWORD"] ?? "SUPERadmin!234";
    var bingPassword = builder.Configuration["BING_PASSWORD"] ?? "Bing123";
    var ellenPassword = builder.Configuration["ELLEN_PASSWORD"] ?? "Ellen456";
    var resetBootstrapUsers = string.Equals(
        builder.Configuration["RESET_BOOTSTRAP_USERS"],
        "true",
        StringComparison.OrdinalIgnoreCase);

    var allCompaniesJson = System.Text.Json.JsonSerializer.Serialize(new[]
    {
        "cyberfridge", "johntrix", "thermalex", "gmixteam", "dynamiq",
        "metaleon", "3jcrt", "gian", "jimi", "lmjay"
    });

    // Ensure auth users exist (passwords via env vars with fallbacks).
    if (!db.AppUsers.Any())
    {
        var hasher = initScope.ServiceProvider.GetRequiredService<PasswordHashService>();
        var now = DateTime.UtcNow;

        var superadminHash = hasher.HashPassword(superadminPassword);
        db.AppUsers.Add(new AccountingApi.Models.AppUser
        {
            Username = "superadmin",
            Role = "superadmin",
            CanAccessFs = true,
            CanAccessPayroll = true,
            IsActive = true,
            PasswordHash = superadminHash.Hash,
            PasswordSalt = superadminHash.Salt,
            HashIterations = superadminHash.Iterations,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        });

        var bingHash = hasher.HashPassword(bingPassword);
        db.AppUsers.Add(new AccountingApi.Models.AppUser
        {
            Username = "Bing",
            Role = "accountant",
            CanAccessFs = true,
            CanAccessPayroll = true,
            IsActive = true,
            AssignedCompaniesJson = allCompaniesJson,
            PasswordHash = bingHash.Hash,
            PasswordSalt = bingHash.Salt,
            HashIterations = bingHash.Iterations,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        });

        var ellenHash = hasher.HashPassword(ellenPassword);
        db.AppUsers.Add(new AccountingApi.Models.AppUser
        {
            Username = "Ellen",
            Role = "accountant",
            CanAccessFs = true,
            CanAccessPayroll = true,
            IsActive = true,
            AssignedCompaniesJson = allCompaniesJson,
            PasswordHash = ellenHash.Hash,
            PasswordSalt = ellenHash.Salt,
            HashIterations = ellenHash.Iterations,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        });

        db.SaveChanges();
        Console.WriteLine("[startup] Bootstrapped 3 users: superadmin, Bing, Ellen");
    }

    // Optional emergency reset for known bootstrap users.
    // Enable only when credentials need to be recovered after deployment.
    if (resetBootstrapUsers)
    {
        if (string.IsNullOrWhiteSpace(superadminPassword))
        {
            throw new InvalidOperationException(
                "RESET_BOOTSTRAP_USERS=true requires env vars to be set.");
        }

        var hasher = initScope.ServiceProvider.GetRequiredService<PasswordHashService>();
        var now = DateTime.UtcNow;

        void UpsertBootstrapUser(string username, string role, bool canFs, bool canPayroll, string password, string? assignedCompaniesJson)
        {
            var existing = db.AppUsers.FirstOrDefault(u => u.Username == username);
            var hash = hasher.HashPassword(password);

            if (existing is null)
            {
                db.AppUsers.Add(new AccountingApi.Models.AppUser
                {
                    Username = username,
                    Role = role,
                    CanAccessFs = canFs,
                    CanAccessPayroll = canPayroll,
                    IsActive = true,
                    FailedLoginCount = 0,
                    LockoutEndUtc = null,
                    AssignedCompaniesJson = assignedCompaniesJson,
                    PasswordHash = hash.Hash,
                    PasswordSalt = hash.Salt,
                    HashIterations = hash.Iterations,
                    CreatedAtUtc = now,
                    UpdatedAtUtc = now
                });
                return;
            }

            existing.Role = role;
            existing.CanAccessFs = canFs;
            existing.CanAccessPayroll = canPayroll;
            existing.IsActive = true;
            existing.FailedLoginCount = 0;
            existing.LockoutEndUtc = null;
            existing.AssignedCompaniesJson = assignedCompaniesJson;
            existing.PasswordHash = hash.Hash;
            existing.PasswordSalt = hash.Salt;
            existing.HashIterations = hash.Iterations;
            existing.UpdatedAtUtc = now;
        }

        UpsertBootstrapUser("superadmin", "superadmin", true, true, superadminPassword, null);
        UpsertBootstrapUser("Bing", "accountant", true, true, bingPassword, allCompaniesJson);
        UpsertBootstrapUser("Ellen", "accountant", true, true, ellenPassword, allCompaniesJson);
        
        db.SaveChanges();
        Console.WriteLine("[startup] RESET_BOOTSTRAP_USERS enabled: 3 account credentials were updated.");
    }

    var legacyAutoSeedOnEmpty = string.Equals(
        builder.Configuration["LEGACY_AUTO_SEED_ON_EMPTY"],
        "true",
        StringComparison.OrdinalIgnoreCase);

    var seedLegacyToCompany = builder.Configuration["SEED_LEGACY_TO_COMPANY_ON_STARTUP"];

    // Optional explicit seed target (used for one-time controlled imports, e.g. THERMALEX only).
    if (!string.IsNullOrWhiteSpace(seedLegacyToCompany) && CompanyCatalog.IsValid(seedLegacyToCompany))
    {
        var normalizedCompany = CompanyCatalog.NormalizeOrDefault(seedLegacyToCompany);
        var hasExistingData = db.FSAccounts.IgnoreQueryFilters().Any(a => a.CompanyCode == normalizedCompany);
        
        if (!hasExistingData)
        {
            var seeder = initScope.ServiceProvider.GetRequiredService<LegacySeedingService>();
            var result = seeder.SeedAsync(companyCodeOverride: normalizedCompany).GetAwaiter().GetResult();
            var total = result.Values.Sum();

            if (total > 0)
                Console.WriteLine($"[startup] Seeded {total} legacy records into company '{normalizedCompany}' across {result.Count} tables.");
            else
                Console.WriteLine($"[startup] No legacy JSON files found for SEED_LEGACY_TO_COMPANY_ON_STARTUP={normalizedCompany}.");
        }
        else
        {
            Console.WriteLine($"[startup] Skipped seeding: Company '{normalizedCompany}' already contains data.");
        }
    }
    else if (legacyAutoSeedOnEmpty && !db.FSAccounts.IgnoreQueryFilters().Any())
    {
        // Disabled by default to avoid accidental cross-company seeding.
        var seeder = initScope.ServiceProvider.GetRequiredService<LegacySeedingService>();
        var result = seeder.SeedAsync(companyCodeOverride: CompanyCatalog.DefaultCompanyCode).GetAwaiter().GetResult();
        var total = result.Values.Sum();
        if (total > 0)
            Console.WriteLine($"[startup] Auto-seeded {total} legacy records into '{CompanyCatalog.DefaultCompanyCode}'.");
        else
            Console.WriteLine("[startup] LEGACY_AUTO_SEED_ON_EMPTY=true but no legacy JSON files were found.");
    }

    // Ensure fs_sys_id has at least one row (main menu needs it)
    // IMPORTANT: derive the period from the EARLIEST unposted check for that company,
    // NOT from DateTime.UtcNow — otherwise a fresh deploy would initialize to the current
    // real-world month even when backup data belongs to an earlier period (e.g. February).
    foreach (var companyCode in CompanyCatalog.AllCodes)
    {
        var hasFsSysId = db.FSSysId
            .IgnoreQueryFilters()
            .Any(x => x.CompanyCode == companyCode);

        if (hasFsSysId)
        {
            continue;
        }

        // Try to derive the period from the earliest check in the database for this company.
        // Exclude future-dated checks (potential advance CDVs) when determining current period.
        var earliestCheck = db.FSCheckMas
            .IgnoreQueryFilters()
            .Where(c => c.CompanyCode == companyCode)
            .OrderBy(c => c.JDate)
            .FirstOrDefault();

        DateTime periodDate;
        if (earliestCheck != null)
        {
            // Use the earliest check date as the period anchor
            periodDate = earliestCheck.JDate;
            Console.WriteLine($"[startup] fs_sys_id for '{companyCode}': derived from earliest check {earliestCheck.JCkNo} dated {periodDate:yyyy-MM-dd}");
        }
        else
        {
            // No checks at all — fall back to current date
            periodDate = DateTime.UtcNow;
            Console.WriteLine($"[startup] fs_sys_id for '{companyCode}': no checks found, defaulting to current month {periodDate:yyyy-MM}");
        }

        db.FSSysId.Add(new AccountingApi.Models.FSSysId
        {
            CompanyCode = companyCode,
            PresMo    = periodDate.Month,
            PresYr    = periodDate.Year,
            BegDate   = new DateTime(periodDate.Year, periodDate.Month, 1),
            EndDate   = new DateTime(periodDate.Year, periodDate.Month, DateTime.DaysInMonth(periodDate.Year, periodDate.Month)),
            UpdatedAt = DateTime.UtcNow
        });
    }
    db.SaveChanges();

    // ── Period Correction ─────────────────────────────────────────────────────
    // Gian's backup data belongs to February 2026. If a prior bad deployment or
    // an incorrect startup seeding set the period to March/April, forcibly reset
    // it back to February. This runs on every startup so it self-heals.
    // Add other companies here if they also need a pinned period.
    var periodCorrections = new Dictionary<string, (int Mo, int Yr)>
    {
        { "gian",     (2, 2026) },
        { "3jcrt",   (2, 2026) },
        { "jimi",    (2, 2026) },
        { "lmjay",   (2, 2026) },
        { "thermalex", (2, 2026) },
    };

    foreach (var (code, target) in periodCorrections)
    {
        var rows = db.FSSysId.IgnoreQueryFilters().Where(x => x.CompanyCode == code).ToList();

        // Remove duplicates — keep only the most recently updated row
        if (rows.Count > 1)
        {
            var keep = rows.OrderByDescending(r => r.UpdatedAt).First();
            db.FSSysId.RemoveRange(rows.Where(r => r.Id != keep.Id));
            rows = new List<AccountingApi.Models.FSSysId> { keep };
        }

        if (rows.Count == 1)
        {
            var row = rows[0];
            if (row.PresMo != target.Mo || row.PresYr != target.Yr)
            {
                Console.WriteLine($"[startup] Correcting period for '{code}': {row.PresMo}/{row.PresYr} → {target.Mo}/{target.Yr}");
                row.PresMo  = target.Mo;
                row.PresYr  = target.Yr;
                row.BegDate = new DateTime(target.Yr, target.Mo, 1);
                row.EndDate = new DateTime(target.Yr, target.Mo, DateTime.DaysInMonth(target.Yr, target.Mo));
                row.UpdatedAt = DateTime.UtcNow;
                db.FSSysId.Update(row);
            }
            else
            {
                Console.WriteLine($"[startup] Period for '{code}' is already correct: {target.Mo}/{target.Yr}");
            }
        }
        else if (rows.Count == 0)
        {
            // No row at all — insert the correct one
            Console.WriteLine($"[startup] Inserting missing period row for '{code}': {target.Mo}/{target.Yr}");
            db.FSSysId.Add(new AccountingApi.Models.FSSysId
            {
                CompanyCode = code,
                PresMo    = target.Mo,
                PresYr    = target.Yr,
                BegDate   = new DateTime(target.Yr, target.Mo, 1),
                EndDate   = new DateTime(target.Yr, target.Mo, DateTime.DaysInMonth(target.Yr, target.Mo)),
                UpdatedAt = DateTime.UtcNow
            });
        }
    }
    db.SaveChanges();
    // ── End Period Correction ──────────────────────────────────────────────────

    // Ensure pay_sys_id has at least one row (payroll module needs it)
    foreach (var companyCode in CompanyCatalog.AllCodes)
    {
        var hasPaySysId = db.PaySysId
            .IgnoreQueryFilters()
            .Any(x => x.CompanyCode == companyCode);

        if (hasPaySysId)
        {
            continue;
        }

        var now = DateTime.UtcNow;
        db.PaySysId.Add(new AccountingApi.Models.PaySysId
        {
            CompanyCode = companyCode,
            PresMo   = now.Month,
            PresYr   = now.Year,
            BegDate  = new DateTime(now.Year, now.Month, 1),
            EndDate  = new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month))
        });
    }
    db.SaveChanges();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseForwardedHeaders();
app.UseHttpsRedirection();
app.UseCors("frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.Use(async (context, next) =>
{
    var path = context.Request.Path;
    var requiresCompanyContext = path.StartsWithSegments("/api/fs")
                                 || path.StartsWithSegments("/api/payroll")
                                 || path.StartsWithSegments("/api/legacymigration");

    if (!requiresCompanyContext)
    {
        await next();
        return;
    }

    var companyCode = context.Request.Headers[CompanyCatalog.HeaderName].FirstOrDefault();
    if (!CompanyCatalog.IsValid(companyCode))
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        await context.Response.WriteAsJsonAsync(new
        {
            message = $"Missing or invalid {CompanyCatalog.HeaderName} header.",
            acceptedCompanyCodes = CompanyCatalog.AllCodes
        });
        return;
    }

    context.Items[CompanyContextKeys.SelectedCompanyCodeItem] = companyCode!.Trim().ToLowerInvariant();
    await next();
});

// Audit mutating API calls — MUST be before MapControllers() to execute
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? "";
    var method = context.Request.Method;
    var isApi = path.StartsWith("/api", StringComparison.OrdinalIgnoreCase);
    var isMutating = method is "POST" or "PUT" or "PATCH" or "DELETE";

    // Skip auth endpoints (AuthController has its own explicit audit calls)
    var isAuth = path.StartsWith("/api/auth", StringComparison.OrdinalIgnoreCase);
    var shouldAudit = isApi && isMutating && !isAuth;

    await next();

    if (!shouldAudit) return;

    try
    {
        using var scope = app.Services.CreateScope();
        var audit = scope.ServiceProvider.GetRequiredService<AuditLogService>();
        var username = context.User.Identity?.IsAuthenticated == true ? context.User.Identity?.Name : null;
        var uidClaim = context.User.FindFirst("uid")?.Value;
        _ = int.TryParse(uidClaim, out var uid);

        // Derive a descriptive event type from HTTP method + URL pattern
        var lowerPath = path.ToLowerInvariant();
        string eventType;
        if (lowerPath.Contains("/restore"))
            eventType = "restore";
        else if (lowerPath.Contains("/clone"))
            eventType = "clone";
        else if (lowerPath.Contains("/posting") || lowerPath.Contains("/post-all"))
            eventType = "post";
        else if (lowerPath.Contains("/month-end"))
            eventType = "month-end";
        else if (lowerPath.Contains("/backup"))
            eventType = "backup";
        else if (lowerPath.Contains("/import") || lowerPath.Contains("/seed"))
            eventType = "import";
        else if (method == "POST")
            eventType = "create";
        else if (method is "PUT" or "PATCH")
            eventType = "update";
        else if (method == "DELETE")
            eventType = "delete";
        else
            eventType = "api_write";

        // Derive a clean resource name from the URL
        var resource = path;
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        // Typical: api / fs / vouchers / masters / {id}
        // We want the module + entity portion
        if (segments.Length >= 3)
        {
            var module = segments[1]; // fs, payroll, admin, etc.
            var entity = segments[2]; // accounts, vouchers, journals, etc.
            resource = $"{module}/{entity}";
            // Append sub-entity if present and not an ID
            if (segments.Length >= 4 && !int.TryParse(segments[3], out _))
                resource += $"/{segments[3]}";
        }

        // Get company context if available
        var companyCode = context.Request.Headers["X-Company-Code"].FirstOrDefault();
        var details = $"method={method};status={context.Response.StatusCode}";
        if (!string.IsNullOrEmpty(companyCode))
            details += $";company={companyCode}";

        await audit.WriteAsync(
            eventType: eventType,
            resource: resource,
            success: context.Response.StatusCode < 400,
            userId: uid == 0 ? null : uid,
            username: username,
            ipAddress: context.Connection.RemoteIpAddress?.ToString(),
            userAgent: context.Request.Headers.UserAgent.ToString(),
            details: details);
    }
    catch
    {
        // best-effort logging only
    }
});

// Serve React frontend static files from wwwroot/
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();

// SPA fallback: serve index.html for non-existent routes (React Router)
app.MapFallback(async context =>
{
    context.Response.ContentType = "text/html";
    var path = Path.Combine(app.Environment.WebRootPath, "index.html");
    if (File.Exists(path))
    {
        await context.Response.SendFileAsync(path);
    }
    else
    {
        context.Response.StatusCode = 404;
    }
});

app.Run();
