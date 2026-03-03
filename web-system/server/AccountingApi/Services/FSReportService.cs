using AccountingApi.Data;
using AccountingApi.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace AccountingApi.Services;

/// <summary>
/// Service for generating financial statement reports (Trial Balance, Income Statement, Balance Sheet).
/// Implements logic from A_REPDTB.PRG, A_REPIST.PRG, A_REPBSH.PRG
/// </summary>
public sealed class FSReportService
{
    private readonly AccountingDbContext _context;

    public FSReportService(AccountingDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Generate Trial Balance report showing all accounts with non-zero activity.
    /// Based on A_REPDTB.PRG (f_a_repdtb function, m_which=2 for summary).
    /// </summary>
    /// <param name="periodEnding">Period ending date</param>
    /// <param name="detailed">If true, shows transaction detail; if false, summary only</param>
    public async Task<TrialBalanceReport> GenerateTrialBalanceAsync(DateTime periodEnding, bool detailed = false)
    {
        var accounts = await _context.FSAccounts
            .Where(a => a.OpenBal != 0 || a.CurDebit != 0 || a.CurCredit != 0)
            .OrderBy(a => a.AcctCode)
            .ToListAsync();

        var lines = new List<TrialBalanceLine>();
        decimal totalDebit = 0;
        decimal totalCredit = 0;

        foreach (var account in accounts)
        {
            // Calculate ending balance using formula
            decimal endingBalance;
            if (account.Formula == "DC")
                endingBalance = account.OpenBal + account.CurDebit - account.CurCredit;
            else
                endingBalance = account.OpenBal + account.CurCredit - account.CurDebit;

            lines.Add(new TrialBalanceLine
            {
                AccountCode = account.AcctCode,
                AccountDescription = account.AcctDesc,
                OpeningBalance = account.OpenBal,
                DebitMovement = account.CurDebit,
                CreditMovement = account.CurCredit,
                EndingBalance = endingBalance
            });

            totalDebit += account.CurDebit;
            totalCredit += account.CurCredit;
        }

        return new TrialBalanceReport
        {
            PeriodEnding = periodEnding,
            Detailed = detailed,
            Lines = lines,
            TotalDebit = totalDebit,
            TotalCredit = totalCredit,
            InBalance = Math.Abs(totalDebit - totalCredit) < 0.01m
        };
    }

    /// <summary>
    /// Generate Income Statement report showing revenue and expenses.
    /// Based on A_REPIST.PRG (f_a_repist function).
    /// </summary>
    /// <param name="periodEnding">Period ending date</param>
    public async Task<IncomeStatementReport> GenerateIncomeStatementAsync(DateTime periodEnding)
    {
        // Get all accounts for Income Statement (gl_report starts with 'IS')
        var isAccounts = await _context.FSAccounts
            .Where(a => a.GlReport != null && a.GlReport.StartsWith("IS"))
            .OrderBy(a => a.AcctCode)
            .ToListAsync();

        // Separate Income (gl_effect starts with 'I') and Expenses (gl_effect starts with 'O' for overhead variance)
        var incomeAccounts = isAccounts.Where(a => a.GlEffect != null && a.GlEffect.StartsWith("I")).ToList();
        var expenseAccounts = isAccounts.Where(a => a.GlEffect != null && a.GlEffect.StartsWith("O")).ToList();

        decimal totalIncome = 0;
        decimal totalIncomeToDate = 0;
        var incomeLines = new List<IncomeStatementLine>();

        foreach (var account in incomeAccounts)
        {
            if (account.CurDebit != 0 || account.CurCredit != 0 || account.OpenBal != 0)
            {
                // Calculate this month amount using formula
                decimal thisMonth;
                if (account.Formula != "DC")
                    thisMonth = account.CurCredit - account.CurDebit;
                else
                    thisMonth = account.CurDebit - account.CurCredit;

                decimal toDate = account.OpenBal + thisMonth;

                incomeLines.Add(new IncomeStatementLine
                {
                    AccountCode = account.AcctCode,
                    AccountDescription = account.AcctDesc,
                    ThisMonthAmount = thisMonth,
                    ToDateAmount = toDate
                });

                totalIncome += thisMonth;
                totalIncomeToDate += toDate;
            }
        }

        decimal totalExpense = 0;
        decimal totalExpenseToDate = 0;
        var expenseLines = new List<IncomeStatementLine>();

        foreach (var account in expenseAccounts)
        {
            if (account.CurDebit != 0 || account.CurCredit != 0 || account.OpenBal != 0)
            {
                // Calculate this month amount using formula
                decimal thisMonth;
                if (account.Formula != "DC")
                    thisMonth = account.CurCredit - account.CurDebit;
                else
                    thisMonth = account.CurDebit - account.CurCredit;

                decimal toDate = account.OpenBal + thisMonth;

                expenseLines.Add(new IncomeStatementLine
                {
                    AccountCode = account.AcctCode,
                    AccountDescription = account.AcctDesc,
                    ThisMonthAmount = thisMonth,
                    ToDateAmount = toDate
                });

                totalExpense += thisMonth;
                totalExpenseToDate += toDate;
            }
        }

        decimal netIncomeThisMonth = totalIncome - totalExpense;
        decimal netIncomeToDate = totalIncomeToDate - totalExpenseToDate;

        return new IncomeStatementReport
        {
            PeriodEnding = periodEnding,
            IncomeLines = incomeLines,
            ExpenseLines = expenseLines,
            GrossIncome = totalIncome,
            GrossIncomeToDate = totalIncomeToDate,
            TotalExpenses = totalExpense,
            TotalExpensesToDate = totalExpenseToDate,
            NetIncome = netIncomeThisMonth,
            NetIncomeToDate = netIncomeToDate
        };
    }

    /// <summary>
    /// Generate Balance Sheet report showing Assets, Liabilities, and Stockholder's Equity.
    /// Based on A_REPBSH.PRG (f_a_repbsh function).
    /// Uses gl_report codes: BA (Assets), BL (Liabilities), BLS (Stockholder's Equity).
    /// </summary>
    /// <param name="periodEnding">Period ending date</param>
    public async Task<BalanceSheetReport> GenerateBalanceSheetAsync(DateTime periodEnding)
    {
        // Get all accounts for Balance Sheet (gl_report starts with 'B')
        var bsAccounts = await _context.FSAccounts
            .Where(a => a.GlReport != null && a.GlReport.StartsWith("B"))
            .OrderBy(a => a.GlReport)
            .ThenBy(a => a.AcctCode)
            .ToListAsync();

        // Helper to calculate ending balance
        decimal CalculateEndingBalance(FSAccount account)
        {
            if (account.Formula == "DC")
                return account.OpenBal + account.CurDebit - account.CurCredit;
            else
                return account.OpenBal + account.CurCredit - account.CurDebit;
        }

        // === ASSETS SECTION (BA) ===
        var assetAccounts = bsAccounts.Where(a => a.GlReport != null && a.GlReport.StartsWith("BA")).ToList();

        // Current Assets (BAC)
        var currentAssets = assetAccounts
            .Where(a => a.GlReport != null && a.GlReport.StartsWith("BAC"))
            .Select(a => new BalanceSheetLine
            {
                AccountCode = a.AcctCode,
                Description = a.AcctDesc ?? "",
                Amount = CalculateEndingBalance(a)
            })
            .Where(line => line.Amount != 0)
            .ToList();
        decimal totalCurrentAssets = currentAssets.Sum(a => a.Amount);

        // Fixed Assets (BAF)
        var fixedAssets = assetAccounts
            .Where(a => a.GlReport != null && a.GlReport.StartsWith("BAF"))
            .Select(a => new BalanceSheetLine
            {
                AccountCode = a.AcctCode,
                Description = a.AcctDesc ?? "",
                // Depreciation accounts are negative
                Amount = (a.GlEffect?.Contains("DEPRECIATION") == true) 
                    ? -CalculateEndingBalance(a) 
                    : CalculateEndingBalance(a)
            })
            .Where(line => line.Amount != 0)
            .ToList();
        decimal totalFixedAssets = fixedAssets.Sum(a => a.Amount);

        // Other Assets (BAO)
        var otherAssets = assetAccounts
            .Where(a => a.GlReport != null && a.GlReport.StartsWith("BAO"))
            .Select(a => new BalanceSheetLine
            {
                AccountCode = a.AcctCode,
                Description = a.AcctDesc ?? "",
                Amount = CalculateEndingBalance(a)
            })
            .Where(line => line.Amount != 0)
            .ToList();
        decimal totalOtherAssets = otherAssets.Sum(a => a.Amount);

        decimal totalAssets = totalCurrentAssets + totalFixedAssets + totalOtherAssets;

        // === LIABILITIES SECTION (BL) ===
        var liabilityAccounts = bsAccounts.Where(a => a.GlReport != null && a.GlReport.StartsWith("BL") && !a.GlReport.StartsWith("BLS")).ToList();

        // Current Liabilities (BLC)
        var currentLiabilities = liabilityAccounts
            .Where(a => a.GlReport != null && a.GlReport.StartsWith("BLC"))
            .Select(a => new BalanceSheetLine
            {
                AccountCode = a.AcctCode,
                Description = a.AcctDesc ?? "",
                Amount = CalculateEndingBalance(a)
            })
            .Where(line => line.Amount != 0)
            .ToList();
        decimal totalCurrentLiabilities = currentLiabilities.Sum(a => a.Amount);

        // Deferred Liabilities (BLD)
        var deferredLiabilities = liabilityAccounts
            .Where(a => a.GlReport != null && a.GlReport.StartsWith("BLD"))
            .Select(a => new BalanceSheetLine
            {
                AccountCode = a.AcctCode,
                Description = a.AcctDesc ?? "",
                Amount = CalculateEndingBalance(a)
            })
            .Where(line => line.Amount != 0)
            .ToList();
        decimal totalDeferredLiabilities = deferredLiabilities.Sum(a => a.Amount);

        decimal totalLiabilities = totalCurrentLiabilities + totalDeferredLiabilities;

        // === STOCKHOLDER'S EQUITY SECTION (BLS) ===
        var equityAccounts = bsAccounts.Where(a => a.GlReport != null && a.GlReport.StartsWith("BLS")).ToList();

        // Capital (BLSC)
        var capitalAccounts = equityAccounts
            .Where(a => a.GlReport != null && a.GlReport.StartsWith("BLSC"))
            .Select(a => new BalanceSheetLine
            {
                AccountCode = a.AcctCode,
                Description = a.AcctDesc ?? "",
                // Subscription accounts are negative
                Amount = (a.GlEffect?.Contains("SUBSCRIPTION") == true)
                    ? -CalculateEndingBalance(a)
                    : CalculateEndingBalance(a)
            })
            .Where(line => line.Amount != 0)
            .ToList();
        decimal totalCapital = capitalAccounts.Sum(a => a.Amount);

        // Earnings (BLSE)
        var earningsAccounts = equityAccounts
            .Where(a => a.GlReport != null && a.GlReport.StartsWith("BLSE"))
            .Select(a => new BalanceSheetLine
            {
                AccountCode = a.AcctCode,
                Description = a.AcctDesc ?? "",
                Amount = CalculateEndingBalance(a)
            })
            .Where(line => line.Amount != 0)
            .ToList();
        decimal totalEarnings = earningsAccounts.Sum(a => a.Amount);

        decimal totalEquity = totalCapital + totalEarnings;
        decimal totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

        return new BalanceSheetReport
        {
            PeriodEnding = periodEnding,
            CurrentAssets = currentAssets,
            TotalCurrentAssets = totalCurrentAssets,
            FixedAssets = fixedAssets,
            TotalFixedAssets = totalFixedAssets,
            OtherAssets = otherAssets,
            TotalOtherAssets = totalOtherAssets,
            TotalAssets = totalAssets,
            CurrentLiabilities = currentLiabilities,
            TotalCurrentLiabilities = totalCurrentLiabilities,
            DeferredLiabilities = deferredLiabilities,
            TotalDeferredLiabilities = totalDeferredLiabilities,
            TotalLiabilities = totalLiabilities,
            CapitalAccounts = capitalAccounts,
            TotalCapital = totalCapital,
            EarningsAccounts = earningsAccounts,
            TotalEarnings = totalEarnings,
            TotalEquity = totalEquity,
            TotalLiabilitiesAndEquity = totalLiabilitiesAndEquity,
            InBalance = Math.Abs(totalAssets - totalLiabilitiesAndEquity) < 0.01m
        };
    }
}

// === REPORT MODELS ===

public sealed class TrialBalanceReport
{
    public DateTime PeriodEnding { get; set; }
    public bool Detailed { get; set; }
    public List<TrialBalanceLine> Lines { get; set; } = new();
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public bool InBalance { get; set; }
}

public sealed class TrialBalanceLine
{
    public string AccountCode { get; set; } = string.Empty;
    public string AccountDescription { get; set; } = string.Empty;
    public decimal OpeningBalance { get; set; }
    public decimal DebitMovement { get; set; }
    public decimal CreditMovement { get; set; }
    public decimal EndingBalance { get; set; }
}

public sealed class IncomeStatementReport
{
    public DateTime PeriodEnding { get; set; }
    public List<IncomeStatementLine> IncomeLines { get; set; } = new();
    public decimal GrossIncome { get; set; }
    public decimal GrossIncomeToDate { get; set; }
    public List<IncomeStatementLine> ExpenseLines { get; set; } = new();
    public decimal TotalExpenses { get; set; }
    public decimal TotalExpensesToDate { get; set; }
    public decimal NetIncome { get; set; }
    public decimal NetIncomeToDate { get; set; }
}

public sealed class IncomeStatementLine
{
    public string AccountCode { get; set; } = string.Empty;
    public string AccountDescription { get; set; } = string.Empty;
    public decimal ThisMonthAmount { get; set; }
    public decimal ToDateAmount { get; set; }
    public decimal ThisMonthRatio { get; set; }
    public decimal ToDateRatio { get; set; }
}

public sealed class BalanceSheetReport
{
    public DateTime PeriodEnding { get; set; }
    
    // Assets Section
    public List<BalanceSheetLine> CurrentAssets { get; set; } = new();
    public decimal TotalCurrentAssets { get; set; }
    public List<BalanceSheetLine> FixedAssets { get; set; } = new();
    public decimal TotalFixedAssets { get; set; }
    public List<BalanceSheetLine> OtherAssets { get; set; } = new();
    public decimal TotalOtherAssets { get; set; }
    public decimal TotalAssets { get; set; }
    
    // Liabilities Section
    public List<BalanceSheetLine> CurrentLiabilities { get; set; } = new();
    public decimal TotalCurrentLiabilities { get; set; }
    public List<BalanceSheetLine> DeferredLiabilities { get; set; } = new();
    public decimal TotalDeferredLiabilities { get; set; }
    public decimal TotalLiabilities { get; set; }
    
    // Equity Section
    public List<BalanceSheetLine> CapitalAccounts { get; set; } = new();
    public decimal TotalCapital { get; set; }
    public List<BalanceSheetLine> EarningsAccounts { get; set; } = new();
    public decimal TotalEarnings { get; set; }
    public decimal TotalEquity { get; set; }
    
    public decimal TotalLiabilitiesAndEquity { get; set; }
    public bool InBalance { get; set; }
}

public sealed class BalanceSheetLine
{
    public string AccountCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
