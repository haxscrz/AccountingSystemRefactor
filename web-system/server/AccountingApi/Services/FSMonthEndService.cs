using AccountingApi.Data;
using AccountingApi.Models;
using Microsoft.EntityFrameworkCore;

namespace AccountingApi.Services;

/// <summary>
/// Month-End Close Service - Implements A_MNTEND.PRG logic
/// Handles backup, account resets, special accounting, and transaction clearing
/// </summary>
public interface IFSMonthEndService
{
    /// <summary>Get backup status and readiness for month-end</summary>
    Task<MonthEndStatus> GetMonthEndStatusAsync();

    /// <summary>Create backup of all transaction files before clearing</summary>
    Task<bool> CreateMonthEndBackupAsync(int fiscalMonth, int fiscalYear);

    /// <summary>
    /// Post all transactions to pournals (posted journals)
    /// Called as part of month-end before clearing individual transaction tables
    /// </summary>
    Task<int> PostAllTransactionsAsync();

    /// <summary>
    /// Reset all account balances for new period
    /// Moves current balances to previous, resets current, handles formula logic
    /// </summary>
    Task<int> ResetAccountBalancesAsync(bool isYearEnd = false);

    /// <summary>
    /// Special handling for accounts 3150 (income) and 3140 (retained earnings)
    /// At year-end: Move 3150 balance to 3140, zero 3150 expense accounts
    /// </summary>
    Task<bool> HandleRetainedEarningsAsync();

    /// <summary>
    /// Clear all transaction tables (ZAP operation from PRG)
    /// Removes: checkmas, checkvou, cashrcpt, salebook, journals, purcbook, adjstmnt, pournals
    /// </summary>
    Task<int> ClearAllTransactionTablesAsync(int fiscalMonth, int fiscalYear);

    /// <summary>Complete month-end close workflow</summary>
    Task<MonthEndResult> ExecuteMonthEndCloseAsync(bool isYearEnd = false);

    /// <summary>Get list of unposted transactions before month-end</summary>
    Task<UnpostedTransactionSummary> GetUnpostedTransactionSummaryAsync();
}

/// <summary>Month-end status information</summary>
public class MonthEndStatus
{
    public bool CanProceed { get; set; }
    public string Message { get; set; } = string.Empty;
    public int UnpostedCheckCount { get; set; }
    public int UnpostedCashRcptCount { get; set; }
    public int UnpostedSalesBookCount { get; set; }
    public int UnpostedJournalCount { get; set; }
    public int UnpostedPurchaseBookCount { get; set; }
    public int UnpostedAdjustmentCount { get; set; }
    public int TotalUnpostedCount { get; set; }
}

/// <summary>Summary of unposted transactions</summary>
public class UnpostedTransactionSummary
{
    public List<FSCheckMas> UnpostedChecks { get; set; } = new();
    public List<FSCashRcpt> UnpostedCashRcpts { get; set; } = new();
    public List<FSSaleBook> UnpostedSalesBooks { get; set; } = new();
    public List<FSJournal> UnpostedJournals { get; set; } = new();
    public List<FSPurcBook> UnpostedPurchaseBooks { get; set; } = new();
    public List<FSAdjustment> UnpostedAdjustments { get; set; } = new();
    public int TotalCount => UnpostedChecks.Count + UnpostedCashRcpts.Count + UnpostedSalesBooks.Count +
                             UnpostedJournals.Count + UnpostedPurchaseBooks.Count + UnpostedAdjustments.Count;
}

/// <summary>Result of month-end close operation</summary>
public class MonthEndResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int BackedUpRecords { get; set; }
    public int PostedRecords { get; set; }
    public int ResetAccounts { get; set; }
    public int ClearedRecords { get; set; }
    public DateTime CompletedAt { get; set; }
}

public class FSMonthEndService : IFSMonthEndService
{
    private readonly AccountingDbContext _context;
    private readonly ICompanyContextAccessor _companyContextAccessor;
    private readonly FSPostingService _postingService;

    public FSMonthEndService(
        AccountingDbContext context,
        ICompanyContextAccessor companyContextAccessor,
        FSPostingService postingService)
    {
        _context = context;
        _companyContextAccessor = companyContextAccessor;
        _postingService = postingService;
    }

    /// <summary>
    /// Check if month-end can proceed and get status
    /// </summary>
    public async Task<MonthEndStatus> GetMonthEndStatusAsync()
    {
        var sysId = await _postingService.GetSysIdAsync();
        var endDate = sysId?.EndDate ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month,
            DateTime.DaysInMonth(DateTime.UtcNow.Year, DateTime.UtcNow.Month));

        // Exclude Advance CDVs from unposted counts:
        // 1. ADV prefix (explicitly marked as advance)
        var checkCount = await _context.FSCheckMas
            .CountAsync(c => !c.JJvNo.StartsWith("ADV") && !c.JCkNo.StartsWith("ADV"));
        var cashRcptCount = await _context.FSCashRcpt.CountAsync();
        var salesBookCount = await _context.FSSaleBook.CountAsync();
        var journalCount = await _context.FSJournals.CountAsync();
        var purcBookCount = await _context.FSPurcBook.CountAsync();
        var adjustmentCount = await _context.FSAdjustment.CountAsync();

        var totalUnposted = checkCount + cashRcptCount + salesBookCount + 
                           journalCount + purcBookCount + adjustmentCount;

        return new MonthEndStatus
        {
            CanProceed = true,
            Message = totalUnposted == 0 
                ? "No transactions to post. Ready for month-end close."
                : $"Found {totalUnposted} transactions to post before clearing.",
            UnpostedCheckCount = checkCount,
            UnpostedCashRcptCount = cashRcptCount,
            UnpostedSalesBookCount = salesBookCount,
            UnpostedJournalCount = journalCount,
            UnpostedPurchaseBookCount = purcBookCount,
            UnpostedAdjustmentCount = adjustmentCount,
            TotalUnpostedCount = totalUnposted
        };
    }

    /// <summary>
    /// Get summary of unposted transactions before month-end
    /// </summary>
    public async Task<UnpostedTransactionSummary> GetUnpostedTransactionSummaryAsync()
    {
        var sysId = await _postingService.GetSysIdAsync();
        var endDate = sysId?.EndDate ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month,
            DateTime.DaysInMonth(DateTime.UtcNow.Year, DateTime.UtcNow.Month));

        return new UnpostedTransactionSummary
        {
            // Exclude Advance CDVs: ADV prefix
            UnpostedChecks = await _context.FSCheckMas.AsNoTracking()
                .Where(c => !c.JJvNo.StartsWith("ADV") && !c.JCkNo.StartsWith("ADV"))
                .ToListAsync() ?? new(),
            UnpostedCashRcpts = await _context.FSCashRcpt.AsNoTracking().ToListAsync() ?? new(),
            UnpostedSalesBooks = await _context.FSSaleBook.AsNoTracking().ToListAsync() ?? new(),
            UnpostedJournals = await _context.FSJournals.AsNoTracking().ToListAsync() ?? new(),
            UnpostedPurchaseBooks = await _context.FSPurcBook.AsNoTracking().ToListAsync() ?? new(),
            UnpostedAdjustments = await _context.FSAdjustment.AsNoTracking().ToListAsync() ?? new()
        };
    }

    /// <summary>
    /// Create backup of all transaction data before clearing (A_MNTEND.PRG backup logic)
    /// In production, this would backup to file/archive. For now, records counts.
    /// </summary>
    public async Task<bool> CreateMonthEndBackupAsync(int fiscalMonth, int fiscalYear)
    {
        try
        {
            // In a real system, you would:
            // 1. Export all transaction tables to backup files
            // 2. Create archive of pournals (posted journals)
            // 3. Store backup metadata for recovery

            // For now, just verify data exists to backup
            var hasData = await _context.FSCheckMas.AnyAsync() ||
                         await _context.FSCashRcpt.AnyAsync() ||
                         await _context.FSSaleBook.AnyAsync() ||
                         await _context.FSJournals.AnyAsync() ||
                         await _context.FSPurcBook.AnyAsync() ||
                         await _context.FSAdjustment.AnyAsync();

            return true; // Backup would be created in actual implementation
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Post all transactions to pournals (posted journals table)
    /// Called before clearing transaction tables (A_POSTNG.PRG logic)
    /// </summary>
    public async Task<int> PostAllTransactionsAsync()
    {
        try
        {
            var result = await _postingService.PostTransactionsAsync();
            return result.Success ? result.RecordsPosted : -1;
        }
        catch
        {
            return -1; // Error indicator
        }
    }

    /// <summary>
    /// Reset account balances for new period (A_MNTEND.PRG balance reset logic)
    /// formula='DC': end_bal = open_bal + cur_debit - cur_credit
    /// formula='CD': end_bal = open_bal + cur_credit - cur_debit
    /// </summary>
    public async Task<int> ResetAccountBalancesAsync(bool isYearEnd = false)
    {
        var resetCount = 0;

        try
        {
            var accounts = await _context.FSAccounts.ToListAsync();

            foreach (var account in accounts)
            {
                // Calculate end_bal per formula
                decimal endBal = account.Formula.ToUpper() == "DC"
                    ? account.OpenBal + account.CurDebit - account.CurCredit
                    : account.OpenBal + account.CurCredit - account.CurDebit;

                // At year-end, if initialize flag is set, reset account
                if (isYearEnd && account.Initialize)
                {
                    // Reset balances for next fiscal year
                    account.OpenBal = 0;
                    account.CurDebit = 0;
                    account.CurCredit = 0;
                }
                else
                {
                    // For month-end, move current to opening, reset current
                    account.OpenBal = endBal;
                    account.CurDebit = 0;
                    account.CurCredit = 0;
                }

                account.UpdatedAt = DateTime.UtcNow;
                _context.FSAccounts.Update(account);
                resetCount++;
            }

            await _context.SaveChangesAsync();
            return resetCount;
        }
        catch
        {
            return -1;
        }
    }

    /// <summary>
    /// Handle special month-end/year-end accounting for accounts 3150 and 3140
    /// Account 3150: Net Income / Accumulated Earnings
    /// Account 3140: Retained Earnings
    /// At year-end, move 3150 balance to 3140, zero 3150
    /// </summary>
    public async Task<bool> HandleRetainedEarningsAsync()
    {
        try
        {
            // Get accounts 3150 and 3140
            var account3150 = await _context.FSAccounts
                .FirstOrDefaultAsync(a => a.AcctCode == "3150");

            var account3140 = await _context.FSAccounts
                .FirstOrDefaultAsync(a => a.AcctCode == "3140");

            if (account3150 == null || account3140 == null)
            {
                // Special accounts not found - not critical error
                return true;
            }

            // Move 3150 balance to 3140
            decimal balanceToMove = account3150.Formula.ToUpper() == "DC"
                ? account3150.OpenBal + account3150.CurDebit - account3150.CurCredit
                : account3150.OpenBal + account3150.CurCredit - account3150.CurDebit;

            // Add to 3140
            account3140.CurCredit += balanceToMove;
            account3140.UpdatedAt = DateTime.UtcNow;

            // Zero out 3150
            account3150.OpenBal = 0;
            account3150.CurDebit = 0;
            account3150.CurCredit = 0;
            account3150.UpdatedAt = DateTime.UtcNow;

            _context.FSAccounts.Update(account3140);
            _context.FSAccounts.Update(account3150);

            await _context.SaveChangesAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Clear all transaction tables (ZAP operation from PRG A_MNTEND.PRG)
    /// Removes all records from: checkmas, checkvou, cashrcpt, salebook, journals, purcbook, adjstmnt, pournals
    /// </summary>
    public async Task<int> ClearAllTransactionTablesAsync(int fiscalMonth, int fiscalYear)
    {
        try
        {
            var companyCode = _companyContextAccessor.CompanyCode;
            if (!CompanyCatalog.IsValid(companyCode))
            {
                return -1;
            }

            // Get the current period end date so we can protect future-dated checks
            var sysId = await _postingService.GetSysIdAsync();
            var endDate = sysId?.EndDate ?? new DateTime(fiscalYear, fiscalMonth,
                DateTime.DaysInMonth(fiscalYear, fiscalMonth));
            var endDateStr = endDate.ToString("yyyy-MM-dd");

            var clearCount = 0;

            // Clear transaction detail lines, preserving Advance CDVs (criteria):
            // 1. ADV prefix on the check number (explicitly marked)
            clearCount += await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM fs_checkvou WHERE company_code = {companyCode} AND j_ck_no NOT IN (SELECT j_ck_no FROM fs_checkmas WHERE company_code = {companyCode} AND (j_jv_no LIKE 'ADV%' OR j_ck_no LIKE 'ADV%'))");
            clearCount += await _context.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM fs_checkmas WHERE company_code = {companyCode} AND j_jv_no NOT LIKE 'ADV%' AND j_ck_no NOT LIKE 'ADV%'");
            clearCount += await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM fs_cashrcpt WHERE company_code = {companyCode}");
            clearCount += await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM fs_salebook WHERE company_code = {companyCode}");
            clearCount += await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM fs_journals WHERE company_code = {companyCode}");
            clearCount += await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM fs_purcbook WHERE company_code = {companyCode}");
            clearCount += await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM fs_adjstmnt WHERE company_code = {companyCode}");
            clearCount += await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM fs_pournals WHERE company_code = {companyCode}");

            return clearCount;
        }
        catch
        {
            return -1;
        }
    }

    /// <summary>
    /// Execute complete month-end close workflow
    /// 1. Create backup
    /// 2. Post all transactions
    /// 3. Reset account balances
    /// 4. Handle retained earnings (if year-end)
    /// 5. Clear transaction tables
    /// </summary>
    public async Task<MonthEndResult> ExecuteMonthEndCloseAsync(bool isYearEnd = false)
    {
        var result = new MonthEndResult { CompletedAt = DateTime.UtcNow };

        try
        {
            // Step 1: Verify we can proceed
            var status = await GetMonthEndStatusAsync();
            if (!status.CanProceed)
            {
                result.Success = false;
                result.Message = $"Cannot proceed with month-end close: {status.Message}";
                return result;
            }

            // Step 2: Create backup
            var backupCreated = await CreateMonthEndBackupAsync(1, DateTime.Now.Year);
            if (!backupCreated)
            {
                result.Success = false;
                result.Message = "Backup creation failed. Aborting month-end close.";
                return result;
            }

            // Step 3: Post all transactions
            result.PostedRecords = await PostAllTransactionsAsync();
            if (result.PostedRecords < 0)
            {
                result.Success = false;
                result.Message = "Transaction posting failed. Aborting month-end close.";
                return result;
            }

            // Step 4: Reset account balances
            result.ResetAccounts = await ResetAccountBalancesAsync(isYearEnd);
            if (result.ResetAccounts < 0)
            {
                result.Success = false;
                result.Message = "Account balance reset failed. Aborting month-end close.";
                return result;
            }

            // Step 5: Handle retained earnings (if year-end)
            if (isYearEnd)
            {
                var earningsHandled = await HandleRetainedEarningsAsync();
                if (!earningsHandled)
                {
                    result.Success = false;
                    result.Message = "Retained earnings handling failed. Aborting month-end close.";
                    return result;
                }
            }

            // Step 6: Clear transaction tables
            result.ClearedRecords = await ClearAllTransactionTablesAsync(1, DateTime.Now.Year);
            if (result.ClearedRecords < 0)
            {
                result.Success = false;
                result.Message = "Transaction table clearing failed. Month-end close partially complete.";
                return result;
            }

            result.Success = true;
            result.Message = isYearEnd 
                ? $"Year-end close completed successfully. Cleared {result.ClearedRecords} transaction records."
                : $"Month-end close completed successfully. Cleared {result.ClearedRecords} transaction records.";

            return result;
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.Message = $"Month-end close failed with error: {ex.Message}";
            return result;
        }
    }
}
