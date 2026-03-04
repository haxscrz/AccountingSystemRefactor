using Microsoft.EntityFrameworkCore;
using AccountingApi.Models;

namespace AccountingApi.Data;

public sealed class AccountingDbContext : DbContext
{
    public AccountingDbContext(DbContextOptions<AccountingDbContext> options) : base(options)
    {
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
    
    // Payroll System Tables
    public DbSet<PayMaster> PayMaster { get; set; } = null!;
    public DbSet<PayTmcard> PayTmcard { get; set; } = null!;
    public DbSet<PaySysId> PaySysId { get; set; } = null!;
    public DbSet<PayTaxTab> PayTaxTab { get; set; } = null!;
    public DbSet<PayPremPaid> PayPremPaid { get; set; } = null!;
    public DbSet<PayDept> PayDept { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // FS System Indexes
        modelBuilder.Entity<FSAccount>()
            .HasIndex(a => a.AcctCode)
            .IsUnique();

        modelBuilder.Entity<FSCheckMas>()
            .HasIndex(c => c.JCkNo);

        modelBuilder.Entity<FSCheckVou>()
            .HasIndex(c => new { c.JCkNo, c.AcctCode });

        modelBuilder.Entity<FSPostedJournal>()
            .HasIndex(p => new { p.JJvNo, p.AcctCode });

        modelBuilder.Entity<FSCashRcpt>()
            .HasIndex(c => c.JJvNo);

        modelBuilder.Entity<FSSaleBook>()
            .HasIndex(s => s.JJvNo);

        modelBuilder.Entity<FSPurcBook>()
            .HasIndex(p => p.JJvNo);

        modelBuilder.Entity<FSAdjustment>()
            .HasIndex(a => a.JJvNo);

        modelBuilder.Entity<FSJournal>()
            .HasIndex(j => j.JJvNo);

        modelBuilder.Entity<FSEffect>()
            .HasIndex(e => new { e.GlReport, e.GlEffect });

        modelBuilder.Entity<FSScheduleEntry>()
            .HasIndex(s => new { s.GlHead, s.AcctCode });

        // Payroll System Indexes
        modelBuilder.Entity<PayMaster>()
            .HasIndex(m => m.EmpNo)
            .IsUnique();

        modelBuilder.Entity<PayTmcard>()
            .HasIndex(t => new { t.EmpNo, t.PeriodYear, t.PeriodMonth });

        modelBuilder.Entity<PayTmcard>()
            .HasIndex(t => t.TrnFlag);

        modelBuilder.Entity<PayTaxTab>()
            .HasIndex(t => new { t.Exemption, t.Sequence });

        modelBuilder.Entity<PayDept>()
            .HasIndex(d => d.DepNo)
            .IsUnique();
    }
}
