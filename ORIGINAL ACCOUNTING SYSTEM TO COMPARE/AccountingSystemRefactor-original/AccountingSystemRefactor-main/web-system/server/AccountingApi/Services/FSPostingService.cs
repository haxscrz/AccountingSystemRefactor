using Microsoft.EntityFrameworkCore;
using AccountingApi.Data;
using AccountingApi.Models;

namespace AccountingApi.Services;

public sealed class FSPostingService
{
    private readonly AccountingDbContext _context;
    private readonly ICompanyContextAccessor _companyContextAccessor;

    public FSPostingService(AccountingDbContext context, ICompanyContextAccessor companyContextAccessor)
    {
        _context = context;
        _companyContextAccessor = companyContextAccessor;
    }

    public async Task<FSSysId?> GetSysIdAsync(CancellationToken cancellationToken = default)
    {
        return await _context.FSSysId.FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<int> GetTableCountAsync(string tableName, CancellationToken cancellationToken = default)
    {
        try
        {
            return tableName switch
            {
                "fs_checkmas" => await _context.FSCheckMas.CountAsync(cancellationToken),
                "fs_cashrcpt" => await _context.FSCashRcpt.CountAsync(cancellationToken),
                "fs_salebook" => await _context.FSSaleBook.CountAsync(cancellationToken),
                "fs_journals" => await _context.FSJournals.CountAsync(cancellationToken),
                "fs_purcbook" => await _context.FSPurcBook.CountAsync(cancellationToken),
                "fs_adjstmnt" => await _context.FSAdjustment.CountAsync(cancellationToken),
                "fs_checkvou" => await _context.FSCheckVou.CountAsync(cancellationToken),
                _ => 0
            };
        }
        catch { return 0; }
    }

    public async Task<(bool Success, string Message, int RecordsPosted)> PostTransactionsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var companyCode = _companyContextAccessor.CompanyCode;
            if (!CompanyCatalog.IsValid(companyCode))
            {
                return (false, "Invalid company context.", 0);
            }

            // Step 1: Clear posted journals table
            await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM fs_pournals WHERE company_code = {companyCode}", cancellationToken);

            // Step 2: Zero out current period balances in accounts
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE fs_accounts SET cur_debit = 0, cur_credit = 0 WHERE company_code = {companyCode}", 
                cancellationToken);

            int totalRecords = 0;

            // Step 3: Post from Check Vouchers (checkvou + checkmas for dates)
            var checkVouchers = await _context.FSCheckVou.ToListAsync(cancellationToken);
            foreach (var voucher in checkVouchers)
            {
                var checkMaster = await _context.FSCheckMas
                    .FirstOrDefaultAsync(m => m.JCkNo == voucher.JCkNo, cancellationToken);

                var postedJournal = new FSPostedJournal
                {
                    CompanyCode = companyCode,
                    JJvNo = checkMaster?.JJvNo ?? voucher.JCkNo,
                    JDate = checkMaster?.JDate,
                    AcctCode = voucher.AcctCode,
                    JCkAmt = voucher.JCkAmt,
                    JDOrC = voucher.JDOrC,
                    CreatedAt = DateTime.UtcNow
                };
                _context.FSPostedJournals.Add(postedJournal);

                // Update account balances
                await UpdateAccountBalanceAsync(voucher.AcctCode, voucher.JCkAmt, voucher.JDOrC, cancellationToken);
                totalRecords++;
            }

            // Step 4: Post from Cash Receipts
            var cashReceipts = await _context.FSCashRcpt.ToListAsync(cancellationToken);
            foreach (var receipt in cashReceipts)
            {
                var postedJournal = new FSPostedJournal
                {
                    CompanyCode = companyCode,
                    JJvNo = receipt.JJvNo,
                    JDate = receipt.JDate,
                    AcctCode = receipt.AcctCode,
                    JCkAmt = receipt.JCkAmt,
                    JDOrC = receipt.JDOrC,
                    CreatedAt = DateTime.UtcNow
                };
                _context.FSPostedJournals.Add(postedJournal);

                await UpdateAccountBalanceAsync(receipt.AcctCode, receipt.JCkAmt, receipt.JDOrC, cancellationToken);
                totalRecords++;
            }

            // Step 5: Post from Sales Book
            var saleBooks = await _context.FSSaleBook.ToListAsync(cancellationToken);
            foreach (var sale in saleBooks)
            {
                var postedJournal = new FSPostedJournal
                {
                    CompanyCode = companyCode,
                    JJvNo = sale.JJvNo,
                    JDate = sale.JDate,
                    AcctCode = sale.AcctCode,
                    JCkAmt = sale.JCkAmt,
                    JDOrC = sale.JDOrC,
                    CreatedAt = DateTime.UtcNow
                };
                _context.FSPostedJournals.Add(postedJournal);

                await UpdateAccountBalanceAsync(sale.AcctCode, sale.JCkAmt, sale.JDOrC, cancellationToken);
                totalRecords++;
            }

            // Step 6: Post from Journals
            var journals = await _context.FSJournals.ToListAsync(cancellationToken);
            foreach (var journal in journals)
            {
                var postedJournal = new FSPostedJournal
                {
                    CompanyCode = companyCode,
                    JJvNo = journal.JJvNo,
                    JDate = journal.JDate,
                    AcctCode = journal.AcctCode,
                    JCkAmt = journal.JCkAmt,
                    JDOrC = journal.JDOrC,
                    CreatedAt = DateTime.UtcNow
                };
                _context.FSPostedJournals.Add(postedJournal);

                await UpdateAccountBalanceAsync(journal.AcctCode, journal.JCkAmt, journal.JDOrC, cancellationToken);
                totalRecords++;
            }

            // Step 7: Post from Purchase Book
            var purcBooks = await _context.FSPurcBook.ToListAsync(cancellationToken);
            foreach (var purchase in purcBooks)
            {
                var postedJournal = new FSPostedJournal
                {
                    CompanyCode = companyCode,
                    JJvNo = purchase.JJvNo,
                    JDate = purchase.JDate,
                    AcctCode = purchase.AcctCode,
                    JCkAmt = purchase.JCkAmt,
                    JDOrC = purchase.JDOrC,
                    CreatedAt = DateTime.UtcNow
                };
                _context.FSPostedJournals.Add(postedJournal);

                await UpdateAccountBalanceAsync(purchase.AcctCode, purchase.JCkAmt, purchase.JDOrC, cancellationToken);
                totalRecords++;
            }

            // Step 8: Post from Adjustments
            var adjustments = await _context.FSAdjustment.ToListAsync(cancellationToken);
            foreach (var adjustment in adjustments)
            {
                var postedJournal = new FSPostedJournal
                {
                    CompanyCode = companyCode,
                    JJvNo = adjustment.JJvNo,
                    JDate = adjustment.JDate,
                    AcctCode = adjustment.AcctCode,
                    JCkAmt = adjustment.JCkAmt,
                    JDOrC = adjustment.JDOrC,
                    CreatedAt = DateTime.UtcNow
                };
                _context.FSPostedJournals.Add(postedJournal);

                await UpdateAccountBalanceAsync(adjustment.AcctCode, adjustment.JCkAmt, adjustment.JDOrC, cancellationToken);
                totalRecords++;
            }

            // Step 9: Calculate ending balances using formula logic
            var accounts = await _context.FSAccounts.ToListAsync(cancellationToken);
            foreach (var account in accounts)
            {
                if (account.Formula != "DC")
                {
                    // Credit-based accounts (Liabilities, Equity, Revenue)
                    account.EndBal = account.OpenBal + account.CurCredit - account.CurDebit;
                }
                else
                {
                    // Debit-based accounts (Assets, Expenses)
                    account.EndBal = account.OpenBal + account.CurDebit - account.CurCredit;
                }
                account.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);

            return (true, $"Re-posting completed. {totalRecords} records posted.", totalRecords);
        }
        catch (Exception ex)
        {
            return (false, $"Posting failed: {ex.Message}", 0);
        }
    }

    private async Task UpdateAccountBalanceAsync(string acctCode, decimal amount, string debitOrCredit, CancellationToken cancellationToken)
    {
        var account = await _context.FSAccounts
            .FirstOrDefaultAsync(a => a.AcctCode == acctCode, cancellationToken);

        if (account is not null)
        {
            if (debitOrCredit == "D")
            {
                account.CurDebit += amount;
            }
            else
            {
                account.CurCredit += amount;
            }
            account.UpdatedAt = DateTime.UtcNow;
        }
    }

    public async Task<(bool Success, string Message)> MonthEndProcessingAsync(int year, int month, CancellationToken cancellationToken = default)
    {
        try
        {
            var companyCode = _companyContextAccessor.CompanyCode;
            if (!CompanyCatalog.IsValid(companyCode))
            {
                return (false, "Invalid company context.");
            }

            // Step 1: Get or create sys_id record
            var sysId = await _context.FSSysId.FirstOrDefaultAsync(cancellationToken);
            if (sysId is null)
            {
                return (false, "System ID not configured. Please initialize FS system.");
            }

            // Validate month
            if (sysId.PresMo != month || sysId.PresYr != year)
            {
                return (false, $"Month-end mismatch. System is on {sysId.PresYr}-{sysId.PresMo:00}, but you requested {year}-{month:00}.");
            }

            var unpostedCount = await _context.FSCheckMas.CountAsync(cancellationToken)
                               + await _context.FSCashRcpt.CountAsync(cancellationToken)
                               + await _context.FSSaleBook.CountAsync(cancellationToken)
                               + await _context.FSJournals.CountAsync(cancellationToken)
                               + await _context.FSPurcBook.CountAsync(cancellationToken)
                               + await _context.FSAdjustment.CountAsync(cancellationToken);

            if (unpostedCount > 0)
            {
                var postingResult = await PostTransactionsAsync(cancellationToken);
                if (!postingResult.Success)
                {
                    return (false, $"Month-end aborted: {postingResult.Message}");
                }
            }

            // Step 2: Calculate retained earnings (from account 3150 per PRG logic)
            var incomeAccounts = await _context.FSAccounts
                .Where(a => a.AcctCode.StartsWith("4") || a.AcctCode.StartsWith("5"))
                .ToListAsync(cancellationToken);

            decimal totalIncome = incomeAccounts
                .Where(a => a.AcctCode.StartsWith("4"))
                .Sum(a => a.EndBal);
            decimal totalExpense = incomeAccounts
                .Where(a => a.AcctCode.StartsWith("5"))
                .Sum(a => a.EndBal);
            decimal netIncome = totalIncome - totalExpense;

            var retainedEarningsAcct = await _context.FSAccounts
                .FirstOrDefaultAsync(a => a.AcctCode == "3150", cancellationToken);
            
            if (retainedEarningsAcct is not null)
            {
                retainedEarningsAcct.EndBal += netIncome;
                retainedEarningsAcct.UpdatedAt = DateTime.UtcNow;
            }

            // Step 3: Roll balances forward (end_bal -> open_bal)
            var allAccounts = await _context.FSAccounts.ToListAsync(cancellationToken);
            foreach (var account in allAccounts)
            {
                account.OpenBal = account.EndBal;
                account.CurDebit = 0;
                account.CurCredit = 0;
                account.EndBal = account.OpenBal;
                account.UpdatedAt = DateTime.UtcNow;
            }

            // Step 4: Clear all transaction files (ZAP equivalent)
            await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM fs_checkvou WHERE company_code = {companyCode}", cancellationToken);
            await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM fs_checkmas WHERE company_code = {companyCode}", cancellationToken);
            await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM fs_cashrcpt WHERE company_code = {companyCode}", cancellationToken);
            await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM fs_salebook WHERE company_code = {companyCode}", cancellationToken);
            await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM fs_purcbook WHERE company_code = {companyCode}", cancellationToken);
            await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM fs_adjstmnt WHERE company_code = {companyCode}", cancellationToken);
            await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM fs_journals WHERE company_code = {companyCode}", cancellationToken);
            await _context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM fs_pournals WHERE company_code = {companyCode}", cancellationToken);

            // Step 5: Update system period
            var nextMonth = month + 1;
            var nextYear = year;
            if (nextMonth > 12)
            {
                nextMonth = 1;
                nextYear++;
            }

            sysId.PresMo = nextMonth;
            sysId.PresYr = nextYear;
            sysId.BegDate = new DateTime(nextYear, nextMonth, 1);
            sysId.EndDate = new DateTime(nextYear, nextMonth, DateTime.DaysInMonth(nextYear, nextMonth));
            sysId.UpdatedAt = DateTime.UtcNow;

            // Initialize yearly counters if new year
            if (nextMonth == 1)
            {
                foreach (var account in allAccounts.Where(a => a.AcctCode.StartsWith("4") || a.AcctCode.StartsWith("5")))
                {
                    account.OpenBal = 0;
                    account.EndBal = 0;
                    account.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync(cancellationToken);

            return (true, $"Month-end for {year}-{month:00} completed successfully. System is now on {nextYear}-{nextMonth:00}.");
        }
        catch (Exception ex)
        {
            return (false, $"Month-end processing failed: {ex.Message}");
        }
    }
}
