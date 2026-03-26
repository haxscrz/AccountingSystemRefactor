using AccountingApi.Data;
using AccountingApi.Models;
using Microsoft.EntityFrameworkCore;

namespace AccountingApi.Services;

public class JournalBalance
{
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public decimal Balance => TotalDebit - TotalCredit;
    public bool IsBalanced => Math.Abs(Balance) < 0.01m; // Tolerance for floating point
}

public interface IFSJournalService
{
    // Cash Receipts (Type 1)
    Task<List<FSCashRcpt>> GetAllCashReceiptsAsync();
    Task<FSCashRcpt?> GetCashReceiptAsync(string jvNo);
    Task<FSCashRcpt> CreateCashReceiptAsync(FSCashRcpt entry);
    Task<FSCashRcpt> UpdateCashReceiptAsync(int id, FSCashRcpt entry);
    Task<bool> DeleteCashReceiptAsync(int id);

    // Sales Book Journals (Type 2)
    Task<List<FSSaleBook>> GetAllSalesBookAsync();
    Task<FSSaleBook?> GetSalesBookAsync(string jvNo);
    Task<FSSaleBook> CreateSalesBookAsync(FSSaleBook entry);
    Task<FSSaleBook> UpdateSalesBookAsync(int id, FSSaleBook entry);
    Task<bool> DeleteSalesBookAsync(int id);

    // Journal Vouchers (Type 3)
    Task<List<FSJournal>> GetAllJournalsAsync();
    Task<FSJournal?> GetJournalAsync(string jvNo);
    Task<FSJournal> CreateJournalAsync(FSJournal entry);
    Task<FSJournal> UpdateJournalAsync(int id, FSJournal entry);
    Task<bool> DeleteJournalAsync(int id);

    // Purchase Book Journals (Type 4)
    Task<List<FSPurcBook>> GetAllPurchaseBookAsync();
    Task<FSPurcBook?> GetPurchaseBookAsync(string jvNo);
    Task<FSPurcBook> CreatePurchaseBookAsync(FSPurcBook entry);
    Task<FSPurcBook> UpdatePurchaseBookAsync(int id, FSPurcBook entry);
    Task<bool> DeletePurchaseBookAsync(int id);

    // Adjustments (Type 5)
    Task<List<FSAdjustment>> GetAllAdjustmentsAsync();
    Task<FSAdjustment?> GetAdjustmentAsync(string jvNo);
    Task<FSAdjustment> CreateAdjustmentAsync(FSAdjustment entry);
    Task<FSAdjustment> UpdateAdjustmentAsync(int id, FSAdjustment entry);
    Task<bool> DeleteAdjustmentAsync(int id);

    // Validation methods for all types
    Task<JournalBalance> GetJournalBalanceAsync<T>(string jvNo) where T : class;

    /// <summary>
    /// Validate that a complete journal is balanced (MANDATORY per A_EDTJNL.PRG line 196)
    /// Throws InvalidOperationException if journal is not balanced
    /// </summary>
    Task<bool> ValidateJournalIsBalancedAsync<T>(string jvNo) where T : class;
}

public class FSJournalService : IFSJournalService
{
    private readonly AccountingDbContext _context;

    public FSJournalService(AccountingDbContext context)
    {
        _context = context;
    }

    #region Cash Receipts (Type 1)

    public async Task<List<FSCashRcpt>> GetAllCashReceiptsAsync()
    {
        return await _context.FSCashRcpt
            .AsNoTracking()
            .OrderByDescending(c => c.JDate)
            .ThenBy(c => c.JJvNo)
            .ToListAsync();
    }

    public async Task<FSCashRcpt?> GetCashReceiptAsync(string jvNo)
    {
        if (string.IsNullOrWhiteSpace(jvNo))
            return null;

        return await _context.FSCashRcpt
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.JJvNo == jvNo.Trim());
    }

    public async Task<FSCashRcpt> CreateCashReceiptAsync(FSCashRcpt entry)
    {
        if (string.IsNullOrWhiteSpace(entry.JJvNo))
            throw new ArgumentException("JV Number is required");

        if (string.IsNullOrWhiteSpace(entry.AcctCode))
            throw new ArgumentException("Account code is required");

        ValidateJournalEntry(entry.JDOrC);

        entry.JJvNo = entry.JJvNo.Trim();
        entry.AcctCode = entry.AcctCode.Trim();

        entry.CreatedAt = DateTime.UtcNow;

        _context.FSCashRcpt.Add(entry);
        await _context.SaveChangesAsync();

        return entry;
    }

    public async Task<FSCashRcpt> UpdateCashReceiptAsync(int id, FSCashRcpt entry)
    {
        ValidateJournalEntry(entry.JDOrC);

        var existing = await _context.FSCashRcpt.FirstOrDefaultAsync(c => c.Id == id);
        if (existing == null)
            throw new KeyNotFoundException($"Cash receipt {id} not found");

        existing.JDate = entry.JDate;
        existing.AcctCode = entry.AcctCode ?? existing.AcctCode;
        existing.JCkAmt = entry.JCkAmt;
        existing.JDOrC = entry.JDOrC;

        _context.FSCashRcpt.Update(existing);
        await _context.SaveChangesAsync();

        return existing;
    }

    public async Task<bool> DeleteCashReceiptAsync(int id)
    {
        var entry = await _context.FSCashRcpt.FirstOrDefaultAsync(c => c.Id == id);
        if (entry == null)
            return false;

        _context.FSCashRcpt.Remove(entry);
        await _context.SaveChangesAsync();

        return true;
    }

    #endregion

    #region Sales Book Journals (Type 2)

    public async Task<List<FSSaleBook>> GetAllSalesBookAsync()
    {
        return await _context.FSSaleBook
            .AsNoTracking()
            .OrderByDescending(s => s.JDate)
            .ThenBy(s => s.JJvNo)
            .ToListAsync();
    }

    public async Task<FSSaleBook?> GetSalesBookAsync(string jvNo)
    {
        if (string.IsNullOrWhiteSpace(jvNo))
            return null;

        return await _context.FSSaleBook
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.JJvNo == jvNo.Trim());
    }

    public async Task<FSSaleBook> CreateSalesBookAsync(FSSaleBook entry)
    {
        if (string.IsNullOrWhiteSpace(entry.JJvNo))
            throw new ArgumentException("JV Number is required");

        if (string.IsNullOrWhiteSpace(entry.AcctCode))
            throw new ArgumentException("Account code is required");

        ValidateJournalEntry(entry.JDOrC);

        entry.JJvNo = entry.JJvNo.Trim();
        entry.AcctCode = entry.AcctCode.Trim();

        entry.CreatedAt = DateTime.UtcNow;

        _context.FSSaleBook.Add(entry);
        await _context.SaveChangesAsync();

        return entry;
    }

    public async Task<FSSaleBook> UpdateSalesBookAsync(int id, FSSaleBook entry)
    {
        ValidateJournalEntry(entry.JDOrC);

        var existing = await _context.FSSaleBook.FirstOrDefaultAsync(s => s.Id == id);
        if (existing == null)
            throw new KeyNotFoundException($"Sales book entry {id} not found");

        existing.JDate = entry.JDate;
        existing.AcctCode = entry.AcctCode ?? existing.AcctCode;
        existing.JCkAmt = entry.JCkAmt;
        existing.JDOrC = entry.JDOrC;

        _context.FSSaleBook.Update(existing);
        await _context.SaveChangesAsync();

        return existing;
    }

    public async Task<bool> DeleteSalesBookAsync(int id)
    {
        var entry = await _context.FSSaleBook.FirstOrDefaultAsync(s => s.Id == id);
        if (entry == null)
            return false;

        _context.FSSaleBook.Remove(entry);
        await _context.SaveChangesAsync();

        return true;
    }

    #endregion

    #region Journal Vouchers (Type 3)

    public async Task<List<FSJournal>> GetAllJournalsAsync()
    {
        return await _context.FSJournals
            .AsNoTracking()
            .OrderByDescending(j => j.JDate)
            .ThenBy(j => j.JJvNo)
            .ToListAsync();
    }

    public async Task<FSJournal?> GetJournalAsync(string jvNo)
    {
        if (string.IsNullOrWhiteSpace(jvNo))
            return null;

        return await _context.FSJournals
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.JJvNo == jvNo.Trim());
    }

    public async Task<FSJournal> CreateJournalAsync(FSJournal entry)
    {
        if (string.IsNullOrWhiteSpace(entry.JJvNo))
            throw new ArgumentException("JV Number is required");

        if (string.IsNullOrWhiteSpace(entry.AcctCode))
            throw new ArgumentException("Account code is required");

        ValidateJournalEntry(entry.JDOrC);

        entry.JJvNo = entry.JJvNo.Trim();
        entry.AcctCode = entry.AcctCode.Trim();

        entry.CreatedAt = DateTime.UtcNow;

        _context.FSJournals.Add(entry);
        await _context.SaveChangesAsync();

        return entry;
    }

    public async Task<FSJournal> UpdateJournalAsync(int id, FSJournal entry)
    {
        ValidateJournalEntry(entry.JDOrC);

        var existing = await _context.FSJournals.FirstOrDefaultAsync(j => j.Id == id);
        if (existing == null)
            throw new KeyNotFoundException($"Journal entry {id} not found");

        existing.JDate = entry.JDate;
        existing.AcctCode = entry.AcctCode ?? existing.AcctCode;
        existing.JCkAmt = entry.JCkAmt;
        existing.JDOrC = entry.JDOrC;

        _context.FSJournals.Update(existing);
        await _context.SaveChangesAsync();

        return existing;
    }

    public async Task<bool> DeleteJournalAsync(int id)
    {
        var entry = await _context.FSJournals.FirstOrDefaultAsync(j => j.Id == id);
        if (entry == null)
            return false;

        _context.FSJournals.Remove(entry);
        await _context.SaveChangesAsync();

        return true;
    }

    #endregion

    #region Purchase Book Journals (Type 4)

    public async Task<List<FSPurcBook>> GetAllPurchaseBookAsync()
    {
        return await _context.FSPurcBook
            .AsNoTracking()
            .OrderByDescending(p => p.JDate)
            .ThenBy(p => p.JJvNo)
            .ToListAsync();
    }

    public async Task<FSPurcBook?> GetPurchaseBookAsync(string jvNo)
    {
        if (string.IsNullOrWhiteSpace(jvNo))
            return null;

        return await _context.FSPurcBook
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.JJvNo == jvNo.Trim());
    }

    public async Task<FSPurcBook> CreatePurchaseBookAsync(FSPurcBook entry)
    {
        if (string.IsNullOrWhiteSpace(entry.JJvNo))
            throw new ArgumentException("JV Number is required");

        if (string.IsNullOrWhiteSpace(entry.AcctCode))
            throw new ArgumentException("Account code is required");

        ValidateJournalEntry(entry.JDOrC);

        entry.JJvNo = entry.JJvNo.Trim();
        entry.AcctCode = entry.AcctCode.Trim();

        entry.CreatedAt = DateTime.UtcNow;

        _context.FSPurcBook.Add(entry);
        await _context.SaveChangesAsync();

        return entry;
    }

    public async Task<FSPurcBook> UpdatePurchaseBookAsync(int id, FSPurcBook entry)
    {
        ValidateJournalEntry(entry.JDOrC);

        var existing = await _context.FSPurcBook.FirstOrDefaultAsync(p => p.Id == id);
        if (existing == null)
            throw new KeyNotFoundException($"Purchase book entry {id} not found");

        existing.JDate = entry.JDate;
        existing.AcctCode = entry.AcctCode ?? existing.AcctCode;
        existing.JCkAmt = entry.JCkAmt;
        existing.JDOrC = entry.JDOrC;

        _context.FSPurcBook.Update(existing);
        await _context.SaveChangesAsync();

        return existing;
    }

    public async Task<bool> DeletePurchaseBookAsync(int id)
    {
        var entry = await _context.FSPurcBook.FirstOrDefaultAsync(p => p.Id == id);
        if (entry == null)
            return false;

        _context.FSPurcBook.Remove(entry);
        await _context.SaveChangesAsync();

        return true;
    }

    #endregion

    #region Adjustments (Type 5)

    public async Task<List<FSAdjustment>> GetAllAdjustmentsAsync()
    {
        return await _context.FSAdjustment
            .AsNoTracking()
            .OrderByDescending(a => a.JDate)
            .ThenBy(a => a.JJvNo)
            .ToListAsync();
    }

    public async Task<FSAdjustment?> GetAdjustmentAsync(string jvNo)
    {
        if (string.IsNullOrWhiteSpace(jvNo))
            return null;

        return await _context.FSAdjustment
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.JJvNo == jvNo.Trim());
    }

    public async Task<FSAdjustment> CreateAdjustmentAsync(FSAdjustment entry)
    {
        if (string.IsNullOrWhiteSpace(entry.JJvNo))
            throw new ArgumentException("JV Number is required");

        if (string.IsNullOrWhiteSpace(entry.AcctCode))
            throw new ArgumentException("Account code is required");

        ValidateJournalEntry(entry.JDOrC);

        entry.JJvNo = entry.JJvNo.Trim();
        entry.AcctCode = entry.AcctCode.Trim();

        entry.CreatedAt = DateTime.UtcNow;

        _context.FSAdjustment.Add(entry);
        await _context.SaveChangesAsync();

        return entry;
    }

    public async Task<FSAdjustment> UpdateAdjustmentAsync(int id, FSAdjustment entry)
    {
        ValidateJournalEntry(entry.JDOrC);

        var existing = await _context.FSAdjustment.FirstOrDefaultAsync(a => a.Id == id);
        if (existing == null)
            throw new KeyNotFoundException($"Adjustment entry {id} not found");

        existing.JDate = entry.JDate;
        existing.AcctCode = entry.AcctCode ?? existing.AcctCode;
        existing.JCkAmt = entry.JCkAmt;
        existing.JDOrC = entry.JDOrC;

        _context.FSAdjustment.Update(existing);
        await _context.SaveChangesAsync();

        return existing;
    }

    public async Task<bool> DeleteAdjustmentAsync(int id)
    {
        var entry = await _context.FSAdjustment.FirstOrDefaultAsync(a => a.Id == id);
        if (entry == null)
            return false;

        _context.FSAdjustment.Remove(entry);
        await _context.SaveChangesAsync();

        return true;
    }

    #endregion

    #region Validation and Utilities

    private void ValidateJournalEntry(string debitCredit)
    {
        if (debitCredit != "D" && debitCredit != "C")
            throw new ArgumentException("Debit/Credit must be 'D' or 'C'");
    }

    public async Task<JournalBalance> GetJournalBalanceAsync<T>(string jvNo) where T : class
    {
        if (string.IsNullOrWhiteSpace(jvNo))
            return new();

        var refNo = jvNo.Trim();
        if (typeof(T) == typeof(FSCashRcpt))
        {
            var lines = await _context.FSCashRcpt
                .Where(x => x.JJvNo == refNo)
                .ToListAsync();
            return new JournalBalance
            {
                TotalDebit = lines.Where(x => x.JDOrC == "D").Sum(x => x.JCkAmt),
                TotalCredit = lines.Where(x => x.JDOrC == "C").Sum(x => x.JCkAmt)
            };
        }

        if (typeof(T) == typeof(FSSaleBook))
        {
            var lines = await _context.FSSaleBook
                .Where(x => x.JJvNo == refNo)
                .ToListAsync();
            return new JournalBalance
            {
                TotalDebit = lines.Where(x => x.JDOrC == "D").Sum(x => x.JCkAmt),
                TotalCredit = lines.Where(x => x.JDOrC == "C").Sum(x => x.JCkAmt)
            };
        }

        if (typeof(T) == typeof(FSJournal))
        {
            var lines = await _context.FSJournals
                .Where(x => x.JJvNo == refNo)
                .ToListAsync();
            return new JournalBalance
            {
                TotalDebit = lines.Where(x => x.JDOrC == "D").Sum(x => x.JCkAmt),
                TotalCredit = lines.Where(x => x.JDOrC == "C").Sum(x => x.JCkAmt)
            };
        }

        if (typeof(T) == typeof(FSPurcBook))
        {
            var lines = await _context.FSPurcBook
                .Where(x => x.JJvNo == refNo)
                .ToListAsync();
            return new JournalBalance
            {
                TotalDebit = lines.Where(x => x.JDOrC == "D").Sum(x => x.JCkAmt),
                TotalCredit = lines.Where(x => x.JDOrC == "C").Sum(x => x.JCkAmt)
            };
        }

        if (typeof(T) == typeof(FSAdjustment))
        {
            var lines = await _context.FSAdjustment
                .Where(x => x.JJvNo == refNo)
                .ToListAsync();
            return new JournalBalance
            {
                TotalDebit = lines.Where(x => x.JDOrC == "D").Sum(x => x.JCkAmt),
                TotalCredit = lines.Where(x => x.JDOrC == "C").Sum(x => x.JCkAmt)
            };
        }

        throw new NotSupportedException($"Unsupported journal type '{typeof(T).Name}' for balance validation.");
    }

    /// <summary>
    /// Validate complete journal is balanced (MANDATORY per PRG A_EDTJNL.PRG line 196)
    /// THROWS exception if unbalanced - user cannot exit unbalanced journal
    /// </summary>
    public async Task<bool> ValidateJournalIsBalancedAsync<T>(string jvNo) where T : class
    {
        if (string.IsNullOrWhiteSpace(jvNo))
            throw new InvalidOperationException("JV Number is required for balance validation");

        var balance = await GetJournalBalanceAsync<T>(jvNo);

        if (!balance.IsBalanced)
        {
            throw new InvalidOperationException(
                $"Journal '{jvNo}' is NOT balanced. Total Debit: {balance.TotalDebit:F2}, " +
                $"Total Credit: {balance.TotalCredit:F2}, Balance: {balance.Balance:F2}. " +
                $"Cannot exit unbalanced journal (per PRG requirement)");
        }

        return true;
    }

    #endregion
}
