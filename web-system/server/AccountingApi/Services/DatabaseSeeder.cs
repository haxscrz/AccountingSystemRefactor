using AccountingApi.Data;
using AccountingApi.Models;
using Microsoft.EntityFrameworkCore;

namespace AccountingApi.Services;

/// <summary>
/// Database seeder service for initial test data.
/// Creates sample accounts, employees, timecards for testing.
/// </summary>
public sealed class DatabaseSeeder
{
    private readonly AccountingDbContext _context;

    public DatabaseSeeder(AccountingDbContext context)
    {
        _context = context;
    }

    public async Task<bool> SeedAsync()
    {
        // Check if already seeded
        if (await _context.FSAccounts.AnyAsync() || await _context.PayMaster.AnyAsync())
        {
            return false; // Already seeded
        }

        await SeedFSSystemAsync();
        await SeedChartOfAccountsAsync();
        await SeedPayrollSystemAsync();
        await SeedEmployeesAsync();
        await SeedTimecardsAsync();

        await _context.SaveChangesAsync();

        return true;
    }

    private async Task SeedFSSystemAsync()
    {
        _context.FSSysId.Add(new FSSysId
        {
            PresYr = DateTime.Today.Year,
            PresMo = DateTime.Today.Month,
            BegDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1),
            EndDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month, DateTime.DaysInMonth(DateTime.Today.Year, DateTime.Today.Month)),
            UpdatedAt = DateTime.UtcNow
        });
    }

    private async Task SeedChartOfAccountsAsync()
    {
        var accounts = new List<FSAccount>
        {
            // Assets (1xxx) - Formula = DC (Debit increases)
            new FSAccount { AcctCode = "1010", AcctDesc = "Cash on Hand", Formula = "DC", OpenBal = 50000, GlReport = "BAC", GlEffect = "Asset - Current" },
            new FSAccount { AcctCode = "1020", AcctDesc = "Cash in Bank", Formula = "DC", OpenBal = 500000, GlReport = "BAC", GlEffect = "Asset - Current" },
            new FSAccount { AcctCode = "1110", AcctDesc = "Accounts Receivable", Formula = "DC", OpenBal = 150000, GlReport = "BAC", GlEffect = "Asset - Current" },
            new FSAccount { AcctCode = "1210", AcctDesc = "Inventory", Formula = "DC", OpenBal = 300000, GlReport = "BAC", GlEffect = "Asset - Current" },
            new FSAccount { AcctCode = "1510", AcctDesc = "Equipment", Formula = "DC", OpenBal = 800000, GlReport = "BAF", GlEffect = "Asset - Fixed" },
            new FSAccount { AcctCode = "1520", AcctDesc = "Accumulated Depreciation - Equipment", Formula = "CD", OpenBal = 200000, GlReport = "BAF", GlEffect = "Asset - DEPRECIATION" },
            
            // Liabilities (2xxx) - Formula = CD (Credit increases)
            new FSAccount { AcctCode = "2010", AcctDesc = "Accounts Payable", Formula = "CD", OpenBal = 100000, GlReport = "BLC", GlEffect = "Liability - Current" },
            new FSAccount { AcctCode = "2020", AcctDesc = "SSS Payable", Formula = "CD", OpenBal = 25000, GlReport = "BLC", GlEffect = "Liability - Current" },
            new FSAccount { AcctCode = "2030", AcctDesc = "PhilHealth Payable", Formula = "CD", OpenBal = 15000, GlReport = "BLC", GlEffect = "Liability - Current" },
            new FSAccount { AcctCode = "2040", AcctDesc = "Pag-IBIG Payable", Formula = "CD", OpenBal = 10000, GlReport = "BLC", GlEffect = "Liability - Current" },
            new FSAccount { AcctCode = "2050", AcctDesc = "Withholding Tax Payable", Formula = "CD", OpenBal = 35000, GlReport = "BLC", GlEffect = "Liability - Current" },
            new FSAccount { AcctCode = "2510", AcctDesc = "Long-term Loan", Formula = "CD", OpenBal = 500000, GlReport = "BLD", GlEffect = "Liability - Deferred" },
            
            // Equity (3xxx) - Formula = CD (Credit increases)
            new FSAccount { AcctCode = "3010", AcctDesc = "Capital Stock", Formula = "CD", OpenBal = 1000000, GlReport = "BLSC", GlEffect = "Equity - Capital" },
            new FSAccount { AcctCode = "3150", AcctDesc = "Retained Earnings", Formula = "CD", OpenBal = 285000, GlReport = "BLSE", GlEffect = "Equity - Earnings" },
            
            // Income (4xxx) - Formula = CD (Credit increases)
            new FSAccount { AcctCode = "4010", AcctDesc = "Sales Revenue", Formula = "CD", OpenBal = 0, GlReport = "IS", GlEffect = "Income - Sales" },
            new FSAccount { AcctCode = "4020", AcctDesc = "Service Revenue", Formula = "CD", OpenBal = 0, GlReport = "IS", GlEffect = "Income - Services" },
            
            // Expenses (5xxx) - Formula = DC (Debit increases)
            new FSAccount { AcctCode = "5010", AcctDesc = "Salaries and Wages", Formula = "DC", OpenBal = 0, GlReport = "IS", GlEffect = "Overhead - Operating" },
            new FSAccount { AcctCode = "5020", AcctDesc = "SSS Expense", Formula = "DC", OpenBal = 0, GlReport = "IS", GlEffect = "Overhead - Operating" },
            new FSAccount { AcctCode = "5030", AcctDesc = "PhilHealth Expense", Formula = "DC", OpenBal = 0, GlReport = "IS", GlEffect = "Overhead - Operating" },
            new FSAccount { AcctCode = "5040", AcctDesc = "Pag-IBIG Expense", Formula = "DC", OpenBal = 0, GlReport = "IS", GlEffect = "Overhead - Operating" },
            new FSAccount { AcctCode = "5050", AcctDesc = "EC Expense", Formula = "DC", OpenBal = 0, GlReport = "IS", GlEffect = "Overhead - Operating" },
            new FSAccount { AcctCode = "5110", AcctDesc = "Rent Expense", Formula = "DC", OpenBal = 0, GlReport = "IS", GlEffect = "Overhead - Operating" },
            new FSAccount { AcctCode = "5120", AcctDesc = "Utilities Expense", Formula = "DC", OpenBal = 0, GlReport = "IS", GlEffect = "Overhead - Operating" },
            new FSAccount { AcctCode = "5130", AcctDesc = "Depreciation Expense", Formula = "DC", OpenBal = 0, GlReport = "IS", GlEffect = "Overhead - Operating" },
        };

        _context.FSAccounts.AddRange(accounts);
    }

    private async Task SeedPayrollSystemAsync()
    {
        _context.PaySysId.Add(new PaySysId
        {
            PresYr = DateTime.Today.Year,
            PresMo = DateTime.Today.Month,
            BegDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1),
            EndDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month, DateTime.DaysInMonth(DateTime.Today.Year, DateTime.Today.Month)),
            TrnCtr = 1,
            TrnUpd = 0,
            PgLower = 100, // Pag-IBIG lower rate
            PgHigher = 200, // Pag-IBIG higher rate
            TaxBon = 90000, // ₱90,000 tax-free bonus threshold
            BonDays = 30, // Default bonus days
            MDailyWage = false, // Monthly rate mode
            UpdatedAt = DateTime.UtcNow
        });
    }

    private async Task SeedEmployeesAsync()
    {
        var employees = new List<PayMaster>
        {
            new PayMaster
            {
                EmpNo = "E001",
                EmpNm = "Juan Dela Cruz",
                BRate = 25000, // ₱25,000 semi-monthly
                DepNo = "IT",
                EmpStat = "A", // Active
                Status = "S", // Single
                SssNo = "12-3456789-0",
                TinNo = "123-456-789-000",
                PhicNo = "12-345678901-2",
                PgbgNo = "1234-5678-9012"
            },
            new PayMaster
            {
                EmpNo = "E002",
                EmpNm = "Maria Santos",
                BRate = 30000, // ₱30,000 semi-monthly
                DepNo = "ACC",
                EmpStat = "A",
                Status = "M1", // Married with 1 dependent
                SssNo = "98-7654321-0",
                TinNo = "987-654-321-000",
                PhicNo = "98-765432109-8",
                PgbgNo = "9876-5432-1098"
            },
            new PayMaster
            {
                EmpNo = "E003",
                EmpNm = "Pedro Garcia",
                BRate = 20000, // ₱20,000 semi-monthly
                DepNo = "OPS",
                EmpStat = "A",
                Status = "M2", // Married with 2 dependents
                SssNo = "11-2233445-6",
                TinNo = "112-233-445-000",
                PhicNo = "11-223344556-7",
                PgbgNo = "1122-3344-5566"
            },
            new PayMaster
            {
                EmpNo = "E004",
                EmpNm = "Ana Reyes",
                BRate = 18000, // ₱18,000 semi-monthly
                DepNo = "HR",
                EmpStat = "C", // Casual
                Status = "S",
                SssNo = "77-8899001-2",
                TinNo = "778-899-001-000",
                PhicNo = "77-889900112-3",
                PgbgNo = "7788-9900-1122"
            }
        };

        _context.PayMaster.AddRange(employees);
    }

    private async Task SeedTimecardsAsync()
    {
        var currentYear = DateTime.Today.Year;
        var currentMonth = DateTime.Today.Month;

        var timecards = new List<PayTmcard>
        {
            // Juan Dela Cruz - Regular with some OT
            new PayTmcard
            {
                EmpNo = "E001",
                PeriodYear = currentYear,
                PeriodMonth = currentMonth,
                RegHrs = 80, // Full period
                AbsHrs = 0,
                RotHrs = 10, // 10 hours OT
                SphpHrs = 0,
                SpotHrs = 0,
                LghpHrs = 0,
                LgotHrs = 0,
                NsdHrs = 5, // 5 hours night shift
                LvHrs = 0,
                LsHrs = 0,
                TrnFlag = "U" // Uncomputed
            },
            // Maria Santos - Perfect attendance
            new PayTmcard
            {
                EmpNo = "E002",
                PeriodYear = currentYear,
                PeriodMonth = currentMonth,
                RegHrs = 80,
                AbsHrs = 0,
                RotHrs = 0,
                SphpHrs = 0,
                SpotHrs = 0,
                LghpHrs = 0,
                LgotHrs = 0,
                NsdHrs = 0,
                LvHrs = 0,
                LsHrs = 0,
                TrnFlag = "U"
            },
            // Pedro Garcia - With absences and late
            new PayTmcard
            {
                EmpNo = "E003",
                PeriodYear = currentYear,
                PeriodMonth = currentMonth,
                RegHrs = 72,
                AbsHrs = 8, // 1 day absent
                RotHrs = 5,
                SphpHrs = 0,
                SpotHrs = 0,
                LghpHrs = 0,
                LgotHrs = 0,
                NsdHrs = 0,
                LvHrs = 0,
                LsHrs = 0,
                TrnFlag = "U"
            },
            // Ana Reyes (Casual) - With holiday work
            new PayTmcard
            {
                EmpNo = "E004",
                PeriodYear = currentYear,
                PeriodMonth = currentMonth,
                RegHrs = 80,
                AbsHrs = 0,
                RotHrs = 0,
                SphpHrs = 8, // Special holiday
                SpotHrs = 0,
                LghpHrs = 8, // Legal holiday
                LgotHrs = 0,
                NsdHrs = 0,
                LvHrs = 0,
                LsHrs = 0,
                TrnFlag = "U"
            }
        };

        _context.PayTmcard.AddRange(timecards);
    }
}
