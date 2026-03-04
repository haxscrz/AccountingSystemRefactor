using AccountingApi.Data;
using AccountingApi.Models;
using Microsoft.EntityFrameworkCore;

namespace AccountingApi.Services;

/// <summary>
/// CHECK DISBURSEMENT VOUCHER SERVICE
/// From A_EDTCHK.PRG - EXACT SPECIFICATION
/// 
/// Check Master (checkmas) Fields:
///   j_jv_no (8), j_date, sup_no (0-99), j_pay_to (25), bank_no (0-99), j_ck_no (8), j_desc (50)
///   j_ck_amt = AUTO-CALCULATED from checkvou lines (not user input)
/// 
/// Check Voucher (checkvou) Fields:
///   j_ck_no (FK), acct_code, j_ck_amt, j_d_or_c ('D' or 'C')
/// 
/// Calculations:
///   Ttl Db = SUM(j_ck_amt WHERE j_d_or_c='D')
///   Ttl Cr = SUM(j_ck_amt WHERE j_d_or_c='C')
///   Balance = Ttl Db - Ttl Cr (0 = balanced)
/// </summary>

public class VoucherBalance
{
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public decimal Balance => TotalDebit - TotalCredit;
    public bool IsBalanced => Math.Abs(Balance) < 0.01m;
}

public interface IFSVoucherService
{
    #region Check Master - Main Operations

    Task<List<FSCheckMas>> GetAllCheckMastersAsync();
    Task<FSCheckMas?> GetCheckMasterByJVAsync(string jvNo);
    Task<FSCheckMas?> GetCheckMasterByCheckNoAsync(string checkNo);
    Task<FSCheckMas> CreateCheckMasterAsync(FSCheckMas checkMaster);
    Task<FSCheckMas> UpdateCheckMasterAsync(string checkNo, FSCheckMas checkMaster);
    Task<bool> DeleteCheckMasterAsync(string checkNo); // Cascades to all checkvou lines

    #endregion

    #region Check Voucher Details - Line Item Operations

    Task<List<FSCheckVou>> GetAllVoucherLinesAsync();
    Task<List<FSCheckVou>> GetVoucherLinesAsync(string checkNo);
    Task<FSCheckVou> AddVoucherLineAsync(FSCheckVou line);
    Task<FSCheckVou> UpdateVoucherLineAsync(int lineId, FSCheckVou line);
    Task<bool> DeleteVoucherLineAsync(int lineId);

    #endregion

    #region Calculations & Validation

    /// <summary>
    /// Calculate running totals (Debit, Credit, Balance) for a check
    /// Also auto-updates j_ck_amt in checkmas (calculated field)
    /// </summary>
    Task<VoucherBalance> GetVoucherBalanceAsync(string checkNo);

    /// <summary>Get all checks with unbalanced totals</summary>
    Task<List<FSCheckMas>> GetUnbalancedChecksAsync();

    Task<bool> CheckNumberExistsAsync(string checkNo);
    Task<bool> JVNumberExistsAsync(string jvNo);

    #endregion

    #region Navigation & Position Tracking

    /// <summary>
    /// Navigate to NEXT check from current position
    /// Returns null if already at last check (EOF)
    /// </summary>
    Task<FSCheckMas?> GetNextCheckMasterAsync(string currentCheckNo);

    /// <summary>
    /// Navigate to PREVIOUS check from current position
    /// Returns null if already at first check (BOF)
    /// </summary>
    Task<FSCheckMas?> GetPreviousCheckMasterAsync(string currentCheckNo);

    /// <summary>
    /// Get FIRST check master (for BOF operation)
    /// </summary>
    Task<FSCheckMas?> GetFirstCheckMasterAsync();

    /// <summary>
    /// Get LAST check master (for EOF operation)
    /// </summary>
    Task<FSCheckMas?> GetLastCheckMasterAsync();

    /// <summary>
    /// Soft-seek find: Find first check where CheckNo >= searchTerm
    /// </summary>
    Task<FSCheckMas?> SoftSeekCheckByNumberAsync(string searchTerm);

    /// <summary>
    /// Soft-seek find: Find first check where JvNo >= searchTerm
    /// </summary>
    Task<FSCheckMas?> SoftSeekCheckByJVAsync(string searchTerm);

    /// <summary>
    /// Navigate to NEXT voucher line within current check
    /// </summary>
    Task<FSCheckVou?> GetNextVoucherLineAsync(string checkNo, int currentLineId);

    /// <summary>
    /// Navigate to PREVIOUS voucher line within current check
    /// </summary>
    Task<FSCheckVou?> GetPreviousVoucherLineAsync(string checkNo, int currentLineId);

    #endregion
}

public class FSVoucherService : IFSVoucherService
{
    private readonly AccountingDbContext _context;

    public FSVoucherService(AccountingDbContext context)
    {
        _context = context;
    }

    #region Check Master Operations

    /// <summary>
    /// Get all check disbursement vouchers
    /// </summary>
    public async Task<List<FSCheckMas>> GetAllCheckMastersAsync()
    {
        return await _context.FSCheckMas
            .AsNoTracking()
            .OrderByDescending(c => c.JDate)
            .ThenBy(c => c.JCkNo)
            .ToListAsync();
    }

    /// <summary>
    /// Get check disbursement by check number
    /// </summary>
    public async Task<FSCheckMas?> GetCheckMasterAsync(string checkNo)
    {
        if (string.IsNullOrWhiteSpace(checkNo))
            return null;

        return await _context.FSCheckMas
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.JCkNo == checkNo.Trim());
    }

    /// <summary>
    /// Get check disbursement by check number (secondary search)
    /// </summary>
    public async Task<FSCheckMas?> GetCheckMasterByCheckNoAsync(string checkNo)
    {
        if (string.IsNullOrWhiteSpace(checkNo))
            return null;

        return await _context.FSCheckMas
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.JCkNo == checkNo.Trim());
    }

    /// <summary>
    /// Get check disbursement by JV number (primary search)
    /// </summary>
    public async Task<FSCheckMas?> GetCheckMasterByJVAsync(string jvNo)
    {
        if (string.IsNullOrWhiteSpace(jvNo))
            return null;

        return await _context.FSCheckMas
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.JJvNo == jvNo.Trim());
    }

    /// <summary>
    /// Create new check disbursement voucher (8 fields from PRG)
    /// </summary>
    public async Task<FSCheckMas> CreateCheckMasterAsync(FSCheckMas checkMaster)
    {
        if (string.IsNullOrWhiteSpace(checkMaster.JJvNo))
            throw new ArgumentException("JV Number (j_jv_no) is required");

        if (string.IsNullOrWhiteSpace(checkMaster.JCkNo))
            throw new ArgumentException("Check Number (j_ck_no) is required");

        checkMaster.JJvNo = checkMaster.JJvNo.Trim();
        checkMaster.JCkNo = checkMaster.JCkNo.Trim();

        // Check for duplicate JV number
        var existsJV = await _context.FSCheckMas
            .AnyAsync(c => c.JJvNo == checkMaster.JJvNo);
        if (existsJV)
            throw new InvalidOperationException($"JV Number '{checkMaster.JJvNo}' already exists");

        // Check for duplicate check number
        var existsCk = await _context.FSCheckMas
            .AnyAsync(c => c.JCkNo == checkMaster.JCkNo);
        if (existsCk)
            throw new InvalidOperationException($"Check Number '{checkMaster.JCkNo}' already exists");

        checkMaster.CreatedAt = DateTime.UtcNow;
        checkMaster.UpdatedAt = DateTime.UtcNow;

        _context.FSCheckMas.Add(checkMaster);
        await _context.SaveChangesAsync();

        return checkMaster;
    }

    /// <summary>
    /// Update check disbursement voucher
    /// </summary>
    public async Task<FSCheckMas> UpdateCheckMasterAsync(string checkNo, FSCheckMas checkMaster)
    {
        if (string.IsNullOrWhiteSpace(checkNo))
            throw new ArgumentException("Check number is required");

        var existing = await _context.FSCheckMas
            .FirstOrDefaultAsync(c => c.JCkNo == checkNo.Trim());

        if (existing == null)
            throw new KeyNotFoundException($"Check '{checkNo}' not found");

        // Update all 8 fields from PRG
        existing.JJvNo = checkMaster.JJvNo ?? existing.JJvNo;
        existing.JDate = checkMaster.JDate;
        existing.JPayTo = checkMaster.JPayTo;
        existing.JCkAmt = checkMaster.JCkAmt;
        existing.JDesc = checkMaster.JDesc;
        existing.BankNo = checkMaster.BankNo;
        existing.SupNo = checkMaster.SupNo;
        existing.UpdatedAt = DateTime.UtcNow;

        _context.FSCheckMas.Update(existing);
        await _context.SaveChangesAsync();

        return existing;
    }

    /// <summary>
    /// Delete check disbursement voucher and all associated line items
    /// </summary>
    public async Task<bool> DeleteCheckMasterAsync(string checkNo)
    {
        if (string.IsNullOrWhiteSpace(checkNo))
            return false;

        var checkMaster = await _context.FSCheckMas
            .FirstOrDefaultAsync(c => c.JCkNo == checkNo.Trim());

        if (checkMaster == null)
            return false;

        // Delete all associated voucher lines first
        var lines = await _context.FSCheckVou
            .Where(v => v.JCkNo == checkNo.Trim())
            .ToListAsync();

        _context.FSCheckVou.RemoveRange(lines);

        // Delete check master
        _context.FSCheckMas.Remove(checkMaster);

        await _context.SaveChangesAsync();

        return true;
    }

    #endregion

    #region Check Voucher (Line Items) Operations

    /// <summary>
    /// Get all distribution lines for all checks (used by reports)
    /// </summary>
    public async Task<List<FSCheckVou>> GetAllVoucherLinesAsync()
    {
        return await _context.FSCheckVou
            .AsNoTracking()
            .OrderBy(v => v.JCkNo)
            .ThenBy(v => v.Id)
            .ToListAsync();
    }

    /// <summary>
    /// Get all distribution lines for a check
    /// </summary>
    public async Task<List<FSCheckVou>> GetVoucherLinesAsync(string checkNo)
    {
        if (string.IsNullOrWhiteSpace(checkNo))
            return new();

        return await _context.FSCheckVou
            .AsNoTracking()
            .Where(v => v.JCkNo == checkNo.Trim())
            .OrderBy(v => v.Id)
            .ToListAsync();
    }

    /// <summary>
    /// Add distribution line item to check
    /// </summary>
    public async Task<FSCheckVou> AddVoucherLineAsync(FSCheckVou line)
    {
        if (string.IsNullOrWhiteSpace(line.JCkNo))
            throw new ArgumentException("Check number is required");

        if (string.IsNullOrWhiteSpace(line.AcctCode))
            throw new ArgumentException("Account code is required");

        if (line.JDOrC != "D" && line.JDOrC != "C")
            throw new ArgumentException("Debit/Credit must be 'D' or 'C'");

        line.JCkNo = line.JCkNo.Trim();
        line.AcctCode = line.AcctCode.Trim();

        // Verify check master exists
        var checkMaster = await _context.FSCheckMas
            .AnyAsync(c => c.JCkNo == line.JCkNo);

        if (!checkMaster)
            throw new KeyNotFoundException($"Check '{line.JCkNo}' not found");

        line.CreatedAt = DateTime.UtcNow;
        line.UpdatedAt = DateTime.UtcNow;

        _context.FSCheckVou.Add(line);
        await _context.SaveChangesAsync();

        // Auto-recalculate check master's j_ck_amt after adding line
        await RecalculateCheckAmountAsync(line.JCkNo);

        return line;
    }

    /// <summary>
    /// Update voucher line item
    /// </summary>
    public async Task<FSCheckVou> UpdateVoucherLineAsync(int lineId, FSCheckVou line)
    {
        var existing = await _context.FSCheckVou
            .FirstOrDefaultAsync(v => v.Id == lineId);

        if (existing == null)
            throw new KeyNotFoundException($"Voucher line {lineId} not found");

        if (line.JDOrC != "D" && line.JDOrC != "C")
            throw new ArgumentException("Debit/Credit must be 'D' or 'C'");

        existing.AcctCode = line.AcctCode ?? existing.AcctCode;
        existing.JCkAmt = line.JCkAmt;
        existing.JDOrC = line.JDOrC;
        existing.UpdatedAt = DateTime.UtcNow;

        _context.FSCheckVou.Update(existing);
        await _context.SaveChangesAsync();

        // Auto-recalculate check master's j_ck_amt after updating line
        await RecalculateCheckAmountAsync(existing.JCkNo);

        return existing;
    }

    /// <summary>
    /// Delete voucher line item
    /// </summary>
    public async Task<bool> DeleteVoucherLineAsync(int lineId)
    {
        var line = await _context.FSCheckVou
            .FirstOrDefaultAsync(v => v.Id == lineId);

        if (line == null)
            return false;

        var checkNo = line.JCkNo; // Save checkNo before deleting line
        
        _context.FSCheckVou.Remove(line);
        await _context.SaveChangesAsync();

        // Auto-recalculate check master's j_ck_amt after deleting line
        await RecalculateCheckAmountAsync(checkNo);

        return true;
    }

    #endregion

    #region Validation and Utilities

    /// <summary>
    /// Calculate and return debit/credit totals and balance for a check
    /// </summary>
    public async Task<VoucherBalance> GetVoucherBalanceAsync(string checkNo)
    {
        if (string.IsNullOrWhiteSpace(checkNo))
            return new();

        var lines = await _context.FSCheckVou
            .Where(v => v.JCkNo == checkNo.Trim())
            .ToListAsync();

        var balance = new VoucherBalance
        {
            TotalDebit = lines.Where(v => v.JDOrC == "D").Sum(v => v.JCkAmt),
            TotalCredit = lines.Where(v => v.JDOrC == "C").Sum(v => v.JCkAmt)
        };

        return balance;
    }

    /// <summary>
    /// Get list of all unbalanced checks (Total Debit != Total Credit)
    /// </summary>
    public async Task<List<FSCheckMas>> GetUnbalancedChecksAsync()
    {
        var allChecks = await _context.FSCheckMas
            .AsNoTracking()
            .ToListAsync();

        var unbalanced = new List<FSCheckMas>();

        foreach (var check in allChecks)
        {
            var balance = await GetVoucherBalanceAsync(check.JCkNo);
            if (!balance.IsBalanced)
            {
                unbalanced.Add(check);
            }
        }

        return unbalanced;
    }

    /// <summary>
    /// Check if check number exists
    /// </summary>
    public async Task<bool> CheckNumberExistsAsync(string checkNo)
    {
        if (string.IsNullOrWhiteSpace(checkNo))
            return false;

        return await _context.FSCheckMas
            .AnyAsync(c => c.JCkNo == checkNo.Trim());
    }

    /// <summary>
    /// Check if JV number exists
    /// </summary>
    public async Task<bool> JVNumberExistsAsync(string jvNo)
    {
        if (string.IsNullOrWhiteSpace(jvNo))
            return false;

        return await _context.FSCheckMas
            .AnyAsync(c => c.JJvNo == jvNo.Trim());
    }

    #endregion

    #region Navigation & Position Tracking (PRG NEXT/PREVIOUS operations)

    /// <summary>
    /// Get NEXT check master from current position (A_EDTCHK.PRG NEXT-CDV)
    /// Sorted by: JDate DESC, then JCkNo ASC
    /// Returns null if at EOF
    /// </summary>
    public async Task<FSCheckMas?> GetNextCheckMasterAsync(string currentCheckNo)
    {
        if (string.IsNullOrWhiteSpace(currentCheckNo))
            return await GetFirstCheckMasterAsync();

        var currentCheck = await _context.FSCheckMas
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.JCkNo == currentCheckNo.Trim());

        if (currentCheck == null)
            return null;

        // Get next based on sort order: JDate DESC, JCkNo ASC
        var nextCheck = await _context.FSCheckMas
            .AsNoTracking()
            .Where(c => (c.JDate < currentCheck.JDate) ||
                        (c.JDate == currentCheck.JDate && c.JCkNo.CompareTo(currentCheck.JCkNo) > 0))
            .OrderByDescending(c => c.JDate)
            .ThenBy(c => c.JCkNo)
            .FirstOrDefaultAsync();

        return nextCheck;
    }

    /// <summary>
    /// Get PREVIOUS check master from current position (A_EDTCHK.PRG PREV-CDV)
    /// Sorted by: JDate DESC, then JCkNo ASC
    /// Returns null if at BOF
    /// </summary>
    public async Task<FSCheckMas?> GetPreviousCheckMasterAsync(string currentCheckNo)
    {
        if (string.IsNullOrWhiteSpace(currentCheckNo))
            return await GetLastCheckMasterAsync();

        var currentCheck = await _context.FSCheckMas
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.JCkNo == currentCheckNo.Trim());

        if (currentCheck == null)
            return null;

        // Get previous based on sort order: JDate DESC, JCkNo ASC
        var previousCheck = await _context.FSCheckMas
            .AsNoTracking()
            .Where(c => (c.JDate > currentCheck.JDate) ||
                        (c.JDate == currentCheck.JDate && c.JCkNo.CompareTo(currentCheck.JCkNo) < 0))
            .OrderByDescending(c => c.JDate)
            .ThenBy(c => c.JCkNo)
            .FirstOrDefaultAsync();

        return previousCheck;
    }

    /// <summary>
    /// Get FIRST check master (BOF operation)
    /// </summary>
    public async Task<FSCheckMas?> GetFirstCheckMasterAsync()
    {
        return await _context.FSCheckMas
            .AsNoTracking()
            .OrderByDescending(c => c.JDate)
            .ThenBy(c => c.JCkNo)
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// Get LAST check master (EOF operation)
    /// </summary>
    public async Task<FSCheckMas?> GetLastCheckMasterAsync()
    {
        return await _context.FSCheckMas
            .AsNoTracking()
            .OrderByDescending(c => c.JDate)
            .ThenBy(c => c.JCkNo)
            .LastOrDefaultAsync();
    }

    /// <summary>
    /// Soft-seek find: Find first check where CheckNo >= searchTerm (A_EDTCHK.PRG "set softseek on")
    /// </summary>
    public async Task<FSCheckMas?> SoftSeekCheckByNumberAsync(string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return await GetFirstCheckMasterAsync();

        var trimmed = searchTerm.Trim().ToUpper();

        // Find first record where JCkNo >= searchTerm (soft-seek logic)
        var result = await _context.FSCheckMas
            .AsNoTracking()
            .Where(c => c.JCkNo.ToUpper().CompareTo(trimmed) >= 0)
            .OrderBy(c => c.JCkNo)
            .FirstOrDefaultAsync();

        return result;
    }

    /// <summary>
    /// Soft-seek find: Find first check where JvNo >= searchTerm
    /// </summary>
    public async Task<FSCheckMas?> SoftSeekCheckByJVAsync(string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return await GetFirstCheckMasterAsync();

        var trimmed = searchTerm.Trim().ToUpper();

        // Find first record where JJvNo >= searchTerm (soft-seek logic)
        var result = await _context.FSCheckMas
            .AsNoTracking()
            .Where(c => c.JJvNo.ToUpper().CompareTo(trimmed) >= 0)
            .OrderBy(c => c.JJvNo)
            .FirstOrDefaultAsync();

        return result;
    }

    /// <summary>
    /// Navigate to NEXT voucher line within current check (A_EDTCHK.PRG NEXT-Entry)
    /// Returns null if at last line
    /// </summary>
    public async Task<FSCheckVou?> GetNextVoucherLineAsync(string checkNo, int currentLineId)
    {
        if (string.IsNullOrWhiteSpace(checkNo))
            return null;

        var currentLine = await _context.FSCheckVou
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == currentLineId && v.JCkNo == checkNo.Trim());

        if (currentLine == null)
            return null;

        // Get next line with higher ID
        var nextLine = await _context.FSCheckVou
            .AsNoTracking()
            .Where(v => v.JCkNo == checkNo.Trim() && v.Id > currentLineId)
            .OrderBy(v => v.Id)
            .FirstOrDefaultAsync();

        return nextLine;
    }

    /// <summary>
    /// Navigate to PREVIOUS voucher line within current check (A_EDTCHK.PRG PREV-Entry)
    /// Returns null if at first line
    /// </summary>
    public async Task<FSCheckVou?> GetPreviousVoucherLineAsync(string checkNo, int currentLineId)
    {
        if (string.IsNullOrWhiteSpace(checkNo))
            return null;

        var currentLine = await _context.FSCheckVou
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == currentLineId && v.JCkNo == checkNo.Trim());

        if (currentLine == null)
            return null;

        // Get previous line with lower ID
        var previousLine = await _context.FSCheckVou
            .AsNoTracking()
            .Where(v => v.JCkNo == checkNo.Trim() && v.Id < currentLineId)
            .OrderByDescending(v => v.Id)
            .FirstOrDefaultAsync();

        return previousLine;    }

    #endregion

    #region Auto-Calculation (PRG f_ck_recompute)

    /// <summary>
    /// INTERNAL: Auto-update j_ck_amt in check master
    /// j_ck_amt = SUM of all debit check voucher lines (per PRG f_ck_recompute)
    /// This is called automatically after adding/updating/deleting lines
    /// </summary>
    private async Task<decimal> RecalculateCheckAmountAsync(string checkNo)
    {
        var lines = await _context.FSCheckVou
            .Where(v => v.JCkNo == checkNo.Trim() && v.JDOrC == "D")
            .ToListAsync();

        var totalDbAmt = lines.Sum(v => v.JCkAmt);

        // Update check master's j_ck_amt with auto-calculated value
        var checkMaster = await _context.FSCheckMas
            .FirstOrDefaultAsync(c => c.JCkNo == checkNo.Trim());

        if (checkMaster != null)
        {
            checkMaster.JCkAmt = totalDbAmt;
            _context.FSCheckMas.Update(checkMaster);
            await _context.SaveChangesAsync();
        }

        return totalDbAmt;
    }

    #endregion
}