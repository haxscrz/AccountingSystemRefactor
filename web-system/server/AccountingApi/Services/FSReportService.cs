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

        // Detailed report in legacy PRG is based on posted journals (pournals).
        var allPostedJournals = detailed ? await _context.FSPostedJournals.OrderBy(j => j.JDate).ToListAsync() : null;

        foreach (var account in accounts)
        {
            // Calculate ending balance using formula
            decimal endingBalance;
            if (account.Formula == "DC")
                endingBalance = account.OpenBal + account.CurDebit - account.CurCredit;
            else
                endingBalance = account.OpenBal + account.CurCredit - account.CurDebit;

            var line = new TrialBalanceLine
            {
                AccountCode = account.AcctCode,
                AccountDescription = account.AcctDesc,
                OpeningBalance = account.OpenBal,
                DebitMovement = account.CurDebit,
                CreditMovement = account.CurCredit,
                EndingBalance = endingBalance,
                Formula = account.Formula
            };

            // If detailed, include per-transaction details (A_REPDTB.PRG line 145-180)
            if (detailed && allPostedJournals != null)
            {
                line.Transactions = allPostedJournals
                    .Where(j => j.AcctCode == account.AcctCode)
                    .Select(j => new TrialBalanceTransaction
                    {
                        TransactionDate = j.JDate ?? DateTime.MinValue,
                        Reference = j.JJvNo,
                        DebitAmount = j.JDOrC.ToUpper() == "D" ? j.JCkAmt : 0,
                        CreditAmount = j.JDOrC.ToUpper() == "C" ? j.JCkAmt : 0
                    })
                    .ToList();
            }

            lines.Add(line);

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

        // Populate ratios (percentage of gross income, matching A_REPIST.PRG logic)
        foreach (var line in incomeLines)
        {
            line.ThisMonthRatio = totalIncome != 0 ? Math.Round((line.ThisMonthAmount / totalIncome) * 100, 2) : 0;
            line.ToDateRatio    = totalIncomeToDate != 0 ? Math.Round((line.ToDateAmount / totalIncomeToDate) * 100, 2) : 0;
        }
        foreach (var line in expenseLines)
        {
            line.ThisMonthRatio = totalIncome != 0 ? Math.Round((line.ThisMonthAmount / totalIncome) * 100, 2) : 0;
            line.ToDateRatio    = totalIncomeToDate != 0 ? Math.Round((line.ToDateAmount / totalIncomeToDate) * 100, 2) : 0;
        }
        decimal incomeRatioTotal  = incomeLines.Sum(l => l.ThisMonthRatio);
        decimal incomeRatioToDate = incomeLines.Sum(l => l.ToDateRatio);
        decimal expRatioTotal     = expenseLines.Sum(l => l.ThisMonthRatio);
        decimal expRatioToDate    = expenseLines.Sum(l => l.ToDateRatio);

        decimal netIncomeThisMonth = totalIncome - totalExpense;
        decimal netIncomeToDate = totalIncomeToDate - totalExpenseToDate;

        return new IncomeStatementReport
        {
            PeriodEnding = periodEnding,
            IncomeLines = incomeLines,
            ExpenseLines = expenseLines,
            GrossIncome = totalIncome,
            GrossIncomeToDate = totalIncomeToDate,
            GrossIncomeRatio = Math.Round(incomeRatioTotal, 2),
            GrossIncomeToDateRatio = Math.Round(incomeRatioToDate, 2),
            TotalExpenses = totalExpense,
            TotalExpensesToDate = totalExpenseToDate,
            TotalExpensesRatio = Math.Round(expRatioTotal, 2),
            TotalExpensesToDateRatio = Math.Round(expRatioToDate, 2),
            NetIncome = netIncomeThisMonth,
            NetIncomeToDate = netIncomeToDate,
            NetIncomeRatio = Math.Round(incomeRatioTotal - expRatioTotal, 2),
            NetIncomeToDateRatio = Math.Round(incomeRatioToDate - expRatioToDate, 2)
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
        var bsAccounts = await _context.FSAccounts
            .Where(a => a.GlReport != null && a.GlReport.StartsWith("B"))
            .ToListAsync();

        var effects = await _context.FSEffects
            .Where(e => e.GlReport != null && e.GlReport.StartsWith("B"))
            .ToListAsync();

        // Legacy PRG aggregates account ending balances into effects rows (gl_report + gl_effect),
        // then prints by gl_head. We mimic that behavior for report parity.
        var effectRows = effects
            .Select(e => new EffectAccumulator
            {
                GlReport = e.GlReport ?? string.Empty,
                GlEffect = e.GlEffect ?? string.Empty,
                GlHead = e.GlHead ?? string.Empty,
                Amount = 0m
            })
            .ToList();

        var unmappedAccounts = new List<FSAccount>();

        decimal CalculateEndingBalance(FSAccount account)
            => account.Formula == "DC"
                ? account.OpenBal + account.CurDebit - account.CurCredit
                : account.OpenBal + account.CurCredit - account.CurDebit;

        foreach (var account in bsAccounts)
        {
            var endBal = CalculateEndingBalance(account);
            var match = effectRows.FirstOrDefault(e =>
                e.GlReport == (account.GlReport ?? string.Empty) &&
                e.GlEffect == (account.GlEffect ?? string.Empty));

            if (match is not null)
            {
                match.Amount += endBal;
            }
            else
            {
                unmappedAccounts.Add(account);
            }
        }

        List<BalanceSheetLine> BuildLines(string prefix, string? negateKeyword = null)
        {
            var mapped = effectRows
                .Where(e => e.GlReport.StartsWith(prefix) && e.Amount != 0)
                .Select(e =>
                {
                    var amount = e.Amount;
                    if (!string.IsNullOrWhiteSpace(negateKeyword)
                        && (e.GlHead ?? string.Empty).Contains(negateKeyword, StringComparison.OrdinalIgnoreCase))
                    {
                        amount = -amount;
                    }

                    return new BalanceSheetLine
                    {
                        AccountCode = e.GlEffect ?? string.Empty,
                        Description = e.GlHead ?? string.Empty,
                        Amount = amount
                    };
                })
                .OrderBy(l => l.AccountCode)
                .ThenBy(l => l.Description)
                .ToList();

            var unmapped = unmappedAccounts
                .Where(a => (a.GlReport ?? string.Empty).StartsWith(prefix))
                .Select(a => new BalanceSheetLine
                {
                    AccountCode = a.AcctCode,
                    Description = a.AcctDesc,
                    Amount = CalculateEndingBalance(a)
                })
                .Where(l => l.Amount != 0)
                .OrderBy(l => l.AccountCode)
                .ThenBy(l => l.Description)
                .ToList();

            if (unmapped.Count == 0) return mapped;

            mapped.AddRange(unmapped);
            return mapped
                .OrderBy(l => l.AccountCode)
                .ThenBy(l => l.Description)
                .ToList();
        }

        var currentAssets = BuildLines("BAC");
        var fixedAssets = BuildLines("BAF", negateKeyword: "DEPRECIATION");
        var otherAssets = BuildLines("BAO");

        decimal totalCurrentAssets = currentAssets.Sum(a => a.Amount);
        decimal totalFixedAssets = fixedAssets.Sum(a => a.Amount);
        decimal totalOtherAssets = otherAssets.Sum(a => a.Amount);
        decimal totalAssets = totalCurrentAssets + totalFixedAssets + totalOtherAssets;

        var currentLiabilities = BuildLines("BLC");
        var deferredLiabilities = BuildLines("BLD");

        decimal totalCurrentLiabilities = currentLiabilities.Sum(a => a.Amount);
        decimal totalDeferredLiabilities = deferredLiabilities.Sum(a => a.Amount);
        decimal totalLiabilities = totalCurrentLiabilities + totalDeferredLiabilities;

        var capitalAccounts = BuildLines("BLSC", negateKeyword: "SUBSCRIPTION");
        var earningsAccounts = BuildLines("BLSE");

        decimal totalCapital = capitalAccounts.Sum(a => a.Amount);
        decimal totalEarnings = earningsAccounts.Sum(a => a.Amount);

        decimal totalEquity = totalCapital + totalEarnings;
        decimal totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

        var schedules = await _context.FSScheduleEntries
            .OrderBy(s => s.GlHead).ThenBy(s => s.AcctCode)
            .ToListAsync();

        var allAccounts = await _context.FSAccounts.ToListAsync();
        var subsidiarySchedules = new List<SubsidiaryScheduleGroup>();
        var scheduleGroups = schedules.GroupBy(s => s.GlHead);
        
        foreach (var group in scheduleGroups)
        {
            var lines = new List<BalanceSheetLine>();
            decimal total = 0;
            foreach (var s in group)
            {
                var account = allAccounts.FirstOrDefault(a => a.AcctCode == s.AcctCode);
                if (account != null)
                {
                    decimal endBal;
                    if (account.Formula == "CD")
                        endBal = account.OpenBal - account.CurDebit + account.CurCredit;
                    else
                        endBal = account.OpenBal + account.CurDebit - account.CurCredit;
                        
                    if (endBal != 0)
                    {
                        lines.Add(new BalanceSheetLine
                        {
                            AccountCode = account.AcctCode,
                            Description = account.AcctDesc,
                            Amount = endBal
                        });
                        total += endBal;
                    }
                }
            }
            if (lines.Count > 0)
            {
                subsidiarySchedules.Add(new SubsidiaryScheduleGroup
                {
                    GlHead = group.Key ?? string.Empty,
                    Lines = lines,
                    Total = total
                });
            }
        }

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
            InBalance = Math.Abs(totalAssets - totalLiabilitiesAndEquity) < 0.01m,
            SubsidiarySchedules = subsidiarySchedules
        };
    }

    private sealed class EffectAccumulator
    {
        public string GlReport { get; set; } = string.Empty;
        public string GlEffect { get; set; } = string.Empty;
        public string GlHead { get; set; } = string.Empty;
        public decimal Amount { get; set; }
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
    public string Formula { get; set; } = string.Empty;
    public List<TrialBalanceTransaction>? Transactions { get; set; }
}

public sealed class TrialBalanceTransaction
{
    public DateTime TransactionDate { get; set; }
    public string Reference { get; set; } = string.Empty;
    public decimal DebitAmount { get; set; }
    public decimal CreditAmount { get; set; }
}

public sealed class IncomeStatementReport
{
    public DateTime PeriodEnding { get; set; }
    public List<IncomeStatementLine> IncomeLines { get; set; } = new();
    public decimal GrossIncome { get; set; }
    public decimal GrossIncomeToDate { get; set; }
    public decimal GrossIncomeRatio { get; set; }
    public decimal GrossIncomeToDateRatio { get; set; }
    public List<IncomeStatementLine> ExpenseLines { get; set; } = new();
    public decimal TotalExpenses { get; set; }
    public decimal TotalExpensesToDate { get; set; }
    public decimal TotalExpensesRatio { get; set; }
    public decimal TotalExpensesToDateRatio { get; set; }
    public decimal NetIncome { get; set; }
    public decimal NetIncomeToDate { get; set; }
    public decimal NetIncomeRatio { get; set; }
    public decimal NetIncomeToDateRatio { get; set; }
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
    
    // Subsidiary Schedules
    public List<SubsidiaryScheduleGroup> SubsidiarySchedules { get; set; } = new();
}

public sealed class SubsidiaryScheduleGroup
{
    public string GlHead { get; set; } = string.Empty;
    public List<BalanceSheetLine> Lines { get; set; } = new();
    public decimal Total { get; set; }
}

public sealed class BalanceSheetLine
{
    public string AccountCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
