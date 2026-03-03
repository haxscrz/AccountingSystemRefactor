using AccountingApi.Data;
using AccountingApi.Models;
using Microsoft.EntityFrameworkCore;

namespace AccountingApi.Services;

public interface IFSAccountService
{
    Task<List<FSAccount>> GetAllAccountsAsync();
    Task<FSAccount?> GetAccountByCodeAsync(string accountCode);
    Task<FSAccount> CreateAccountAsync(FSAccount account);
    Task<FSAccount> UpdateAccountAsync(string accountCode, FSAccount account);
    Task<bool> DeleteAccountAsync(string accountCode);
    Task<List<FSAccount>> SearchAccountsAsync(string searchTerm);
    Task<bool> AccountCodeExistsAsync(string accountCode);

    #region Navigation Methods (PRG NEXT/PREVIOUS - A_EDTCOD.PRG lines 143-152)
    /// <summary>Get NEXT account master from current position</summary>
    Task<FSAccount?> GetNextAccountAsync(string currentCode);

    /// <summary>Get PREVIOUS account master from current position</summary>
    Task<FSAccount?> GetPreviousAccountAsync(string currentCode);

    /// <summary>Get FIRST account (BOF operation)</summary>
    Task<FSAccount?> GetFirstAccountAsync();

    /// <summary>Get LAST account (EOF operation)</summary>
    Task<FSAccount?> GetLastAccountAsync();

    /// <summary>Soft-seek find: Get first account code >= searchTerm</summary>
    Task<FSAccount?> SoftSeekAccountAsync(string searchTerm);
    #endregion
}

public class FSAccountService : IFSAccountService
{
    private readonly AccountingDbContext _context;

    public FSAccountService(AccountingDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all Chart of Accounts records (all 9 fields)
    /// </summary>
    public async Task<List<FSAccount>> GetAllAccountsAsync()
    {
        return await _context.FSAccounts
            .AsNoTracking()
            .OrderBy(a => a.AcctCode)
            .ToListAsync();
    }

    /// <summary>
    /// Get specific account by code
    /// </summary>
    public async Task<FSAccount?> GetAccountByCodeAsync(string accountCode)
    {
        if (string.IsNullOrWhiteSpace(accountCode))
            return null;

        return await _context.FSAccounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.AcctCode == accountCode.Trim());
    }

    /// <summary>
    /// Create new Chart of Account (validates duplicate code)
    /// </summary>
    public async Task<FSAccount> CreateAccountAsync(FSAccount account)
    {
        if (string.IsNullOrWhiteSpace(account.AcctCode))
            throw new ArgumentException("Account code is required");

        account.AcctCode = account.AcctCode.Trim();

        // Check for duplicate account code
        var exists = await _context.FSAccounts
            .AnyAsync(a => a.AcctCode == account.AcctCode);

        if (exists)
            throw new InvalidOperationException($"Account code '{account.AcctCode}' already exists");

        account.CreatedAt = DateTime.UtcNow;
        account.UpdatedAt = DateTime.UtcNow;
        account.IsActive = true;

        // Default formula to DC (Debit-Credit) if not specified
        if (string.IsNullOrWhiteSpace(account.Formula))
            account.Formula = "DC";

        _context.FSAccounts.Add(account);
        await _context.SaveChangesAsync();

        return account;
    }

    /// <summary>
    /// Update existing Chart of Account
    /// </summary>
    public async Task<FSAccount> UpdateAccountAsync(string accountCode, FSAccount account)
    {
        if (string.IsNullOrWhiteSpace(accountCode))
            throw new ArgumentException("Account code is required");

        var existing = await _context.FSAccounts
            .FirstOrDefaultAsync(a => a.AcctCode == accountCode.Trim());

        if (existing == null)
            throw new KeyNotFoundException($"Account '{accountCode}' not found");

        // Update all fields (9 fields from PRG)
        existing.AcctDesc = account.AcctDesc ?? existing.AcctDesc;
        existing.AcctType = account.AcctType;
        existing.GroupCode = account.GroupCode;
        existing.SubGroup = account.SubGroup;
        existing.Formula = string.IsNullOrWhiteSpace(account.Formula) ? "DC" : account.Formula;
        existing.OpenBal = account.OpenBal;
        existing.CurDebit = account.CurDebit;
        existing.CurCredit = account.CurCredit;
        existing.GlReport = account.GlReport;
        existing.GlEffect = account.GlEffect;
        existing.Initialize = account.Initialize;
        existing.UpdatedAt = DateTime.UtcNow;

        _context.FSAccounts.Update(existing);
        await _context.SaveChangesAsync();

        return existing;
    }

    /// <summary>
    /// Delete Chart of Account
    /// </summary>
    public async Task<bool> DeleteAccountAsync(string accountCode)
    {
        if (string.IsNullOrWhiteSpace(accountCode))
            return false;

        var account = await _context.FSAccounts
            .FirstOrDefaultAsync(a => a.AcctCode == accountCode.Trim());

        if (account == null)
            return false;

        _context.FSAccounts.Remove(account);
        await _context.SaveChangesAsync();

        return true;
    }

    /// <summary>
    /// Search accounts by code or description (soft-seek)
    /// </summary>
    public async Task<List<FSAccount>> SearchAccountsAsync(string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return await GetAllAccountsAsync();

        var term = searchTerm.Trim().ToUpper();

        return await _context.FSAccounts
            .AsNoTracking()
            .Where(a => a.AcctCode.ToUpper().Contains(term) || a.AcctDesc.ToUpper().Contains(term))
            .OrderBy(a => a.AcctCode)
            .ToListAsync();
    }

    /// <summary>
    /// Check if account code exists
    /// </summary>
    public async Task<bool> AccountCodeExistsAsync(string accountCode)
    {
        if (string.IsNullOrWhiteSpace(accountCode))
            return false;

        return await _context.FSAccounts
            .AnyAsync(a => a.AcctCode == accountCode.Trim());
    }

    #region Navigation Methods (PRG NEXT/PREVIOUS operations - A_EDTCOD.PRG)

    /// <summary>
    /// Get NEXT account from current position
    /// Sorted by: AcctCode ASC
    /// Returns null if at EOF
    /// </summary>
    public async Task<FSAccount?> GetNextAccountAsync(string currentCode)
    {
        if (string.IsNullOrWhiteSpace(currentCode))
            return await GetFirstAccountAsync();

        var currentAccount = await _context.FSAccounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.AcctCode == currentCode.Trim());

        if (currentAccount == null)
            return null;

        // Get next account with code > current
        var nextAccount = await _context.FSAccounts
            .AsNoTracking()
            .Where(a => a.AcctCode.CompareTo(currentAccount.AcctCode) > 0)
            .OrderBy(a => a.AcctCode)
            .FirstOrDefaultAsync();

        return nextAccount;
    }

    /// <summary>
    /// Get PREVIOUS account from current position
    /// Sorted by: AcctCode ASC
    /// Returns null if at BOF
    /// </summary>
    public async Task<FSAccount?> GetPreviousAccountAsync(string currentCode)
    {
        if (string.IsNullOrWhiteSpace(currentCode))
            return await GetLastAccountAsync();

        var currentAccount = await _context.FSAccounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.AcctCode == currentCode.Trim());

        if (currentAccount == null)
            return null;

        // Get previous account with code < current
        var previousAccount = await _context.FSAccounts
            .AsNoTracking()
            .Where(a => a.AcctCode.CompareTo(currentAccount.AcctCode) < 0)
            .OrderByDescending(a => a.AcctCode)
            .FirstOrDefaultAsync();

        return previousAccount;
    }

    /// <summary>
    /// Get FIRST account (BOF operation)
    /// </summary>
    public async Task<FSAccount?> GetFirstAccountAsync()
    {
        return await _context.FSAccounts
            .AsNoTracking()
            .OrderBy(a => a.AcctCode)
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// Get LAST account (EOF operation)
    /// </summary>
    public async Task<FSAccount?> GetLastAccountAsync()
    {
        return await _context.FSAccounts
            .AsNoTracking()
            .OrderBy(a => a.AcctCode)
            .LastOrDefaultAsync();
    }

    /// <summary>
    /// Soft-seek find: Get first account where code >= searchTerm (A_EDTCOD.PRG "set softseek on")
    /// </summary>
    public async Task<FSAccount?> SoftSeekAccountAsync(string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return await GetFirstAccountAsync();

        var trimmed = searchTerm.Trim().ToUpper();

        // Find first account where AcctCode >= searchTerm (soft-seek logic)
        var result = await _context.FSAccounts
            .AsNoTracking()
            .Where(a => a.AcctCode.ToUpper().CompareTo(trimmed) >= 0)
            .OrderBy(a => a.AcctCode)
            .FirstOrDefaultAsync();

        return result;
    }

    #endregion
}
