using Microsoft.EntityFrameworkCore;
using AccountingApi.Models;

namespace AccountingApi.Data;

public sealed class AccountingDbContext : DbContext
{
    private readonly ICompanyContextAccessor _companyContextAccessor;

    public AccountingDbContext(
        DbContextOptions<AccountingDbContext> options,
        ICompanyContextAccessor companyContextAccessor) : base(options)
    {
        _companyContextAccessor = companyContextAccessor;
    }

    // FS System Tables
    public DbSet<FSAccount> FSAccounts { get; set; } = null!;
    public DbSet<FSCheckMas> FSCheckMas { get; set; } = null!;
    public DbSet<FSCheckVou> FSCheckVou { get; set; } = null!;
    public DbSet<FSPostedJournal> FSPostedJournals { get; set; } = null!;
    public DbSet<FSCashRcpt> FSCashRcpt { get; set; } = null!;
    public DbSet<FSSaleBook> FSSaleBook { get; set; } = null!;
    public DbSet<FSPurcBook> FSPurcBook { get; set; } = null!;
    public DbSet<FSAdjustment> FSAdjustment { get; set; } = null!;
    public DbSet<FSJournal> FSJournals { get; set; } = null!;
    public DbSet<FSSysId> FSSysId { get; set; } = null!;
    public DbSet<FSEffect> FSEffects { get; set; } = null!;
    public DbSet<FSScheduleEntry> FSScheduleEntries { get; set; } = null!;
    public DbSet<FSBank> FSBanks { get; set; } = null!;
    public DbSet<FSSupplier> FSSuppliers { get; set; } = null!;
    public DbSet<FSSignatory> FSSignatories { get; set; } = null!;
    
    // Payroll System Tables
    public DbSet<PayMaster> PayMaster { get; set; } = null!;
    public DbSet<PayTmcard> PayTmcard { get; set; } = null!;
    public DbSet<PaySysId> PaySysId { get; set; } = null!;
    public DbSet<PayTaxTab> PayTaxTab { get; set; } = null!;
    public DbSet<PayPremPaid> PayPremPaid { get; set; } = null!;
    public DbSet<PayDept> PayDept { get; set; } = null!;

    // Security/Auth Tables
    public DbSet<AppUser> AppUsers { get; set; } = null!;
    public DbSet<AppRefreshToken> AppRefreshTokens { get; set; } = null!;
    public DbSet<AppAuditLog> AppAuditLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<FSAccount>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode);
        modelBuilder.Entity<FSCheckMas>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode && !e.IsDeleted);
        modelBuilder.Entity<FSCheckVou>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode && !e.IsDeleted);
        modelBuilder.Entity<FSPostedJournal>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode);
        modelBuilder.Entity<FSCashRcpt>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode && !e.IsDeleted);
        modelBuilder.Entity<FSSaleBook>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode && !e.IsDeleted);
        modelBuilder.Entity<FSPurcBook>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode && !e.IsDeleted);
        modelBuilder.Entity<FSAdjustment>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode && !e.IsDeleted);
        modelBuilder.Entity<FSJournal>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode && !e.IsDeleted);
        modelBuilder.Entity<FSEffect>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode);
        modelBuilder.Entity<FSScheduleEntry>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode);
        modelBuilder.Entity<FSSysId>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode);
        modelBuilder.Entity<FSBank>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode);
        modelBuilder.Entity<FSSupplier>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode);
        modelBuilder.Entity<FSSignatory>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode);

        modelBuilder.Entity<PayMaster>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode);
        modelBuilder.Entity<PayTmcard>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode);
        modelBuilder.Entity<PaySysId>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode);
        modelBuilder.Entity<PayTaxTab>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode);
        modelBuilder.Entity<PayPremPaid>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode);
        modelBuilder.Entity<PayDept>().HasQueryFilter(e => e.CompanyCode == _companyContextAccessor.CompanyCode);

        // FS System Indexes
        modelBuilder.Entity<FSAccount>()
            .HasIndex(a => new { a.CompanyCode, a.AcctCode })
            .IsUnique();

        modelBuilder.Entity<FSCheckMas>()
            .HasIndex(c => new { c.CompanyCode, c.JCkNo });

        modelBuilder.Entity<FSCheckVou>()
            .HasIndex(c => new { c.CompanyCode, c.JCkNo, c.AcctCode });

        modelBuilder.Entity<FSPostedJournal>()
            .HasIndex(p => new { p.CompanyCode, p.JJvNo, p.AcctCode });

        modelBuilder.Entity<FSCashRcpt>()
            .HasIndex(c => new { c.CompanyCode, c.JJvNo });

        modelBuilder.Entity<FSSaleBook>()
            .HasIndex(s => new { s.CompanyCode, s.JJvNo });

        modelBuilder.Entity<FSPurcBook>()
            .HasIndex(p => new { p.CompanyCode, p.JJvNo });

        modelBuilder.Entity<FSAdjustment>()
            .HasIndex(a => new { a.CompanyCode, a.JJvNo });

        modelBuilder.Entity<FSJournal>()
            .HasIndex(j => new { j.CompanyCode, j.JJvNo });

        modelBuilder.Entity<FSEffect>()
            .HasIndex(e => new { e.CompanyCode, e.GlReport, e.GlEffect });

        modelBuilder.Entity<FSScheduleEntry>()
            .HasIndex(s => new { s.CompanyCode, s.GlHead, s.AcctCode });

        modelBuilder.Entity<FSBank>()
            .HasIndex(b => new { b.CompanyCode, b.BankNo });

        modelBuilder.Entity<FSSupplier>()
            .HasIndex(s => new { s.CompanyCode, s.SupNo });

        modelBuilder.Entity<FSSignatory>()
            .HasIndex(s => new { s.CompanyCode, s.SignName });

        // Payroll System Indexes
        modelBuilder.Entity<PayMaster>()
            .HasIndex(m => new { m.CompanyCode, m.EmpNo })
            .IsUnique();

        modelBuilder.Entity<PayTmcard>()
            .HasIndex(t => new { t.CompanyCode, t.EmpNo, t.PeriodYear, t.PeriodMonth });

        modelBuilder.Entity<PayTmcard>()
            .HasIndex(t => new { t.CompanyCode, t.TrnFlag });

        modelBuilder.Entity<PayTaxTab>()
            .HasIndex(t => new { t.CompanyCode, t.Exemption, t.Sequence });

        modelBuilder.Entity<PayDept>()
            .HasIndex(d => new { d.CompanyCode, d.DepNo })
            .IsUnique();

        // Security/Auth Indexes
        modelBuilder.Entity<AppUser>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<AppRefreshToken>()
            .HasIndex(t => t.TokenHash)
            .IsUnique();

        modelBuilder.Entity<AppRefreshToken>()
            .HasIndex(t => new { t.UserId, t.ExpiresAtUtc });

        modelBuilder.Entity<AppAuditLog>()
            .HasIndex(l => l.CreatedAtUtc);

        modelBuilder.Entity<AppAuditLog>()
            .HasIndex(l => new { l.Username, l.CreatedAtUtc });
    }

    public override int SaveChanges()
    {
        ApplyCompanyScope();
        return base.SaveChanges();
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ApplyCompanyScope();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyCompanyScope();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        ApplyCompanyScope();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void ApplyCompanyScope()
    {
        var companyCode = _companyContextAccessor.CompanyCode;
        foreach (var entry in ChangeTracker.Entries<ICompanyScopedEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CompanyCode = companyCode;
                continue;
            }

            if (entry.State == EntityState.Modified)
            {
                entry.Property(nameof(ICompanyScopedEntity.CompanyCode)).IsModified = false;
            }
        }
    }
}
