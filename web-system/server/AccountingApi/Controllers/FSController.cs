using AccountingApi.Services;
using AccountingApi.Models;
using AccountingApi.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace AccountingApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "CanFs")]
public sealed class FSController : ControllerBase
{
    private readonly LegacyDataService    _legacyDataService;
    private readonly FSAccountService     _accountService;
    private readonly FSVoucherService     _voucherService;
    private readonly FSJournalService     _journalService;
    private readonly FSPostingService     _postingService;
    private readonly FSReportService      _reportService;
    private readonly AccountingDbContext  _db;
    private readonly IConfiguration       _config;
    private readonly LegacySeedingService _seedingService;

    public FSController(
        LegacyDataService legacyDataService,
        IFSAccountService accountService,
        IFSVoucherService voucherService,
        IFSJournalService journalService,
        FSPostingService postingService,
        FSReportService reportService,
        AccountingDbContext db,
        IConfiguration config,
        LegacySeedingService seedingService)
    {
        _legacyDataService = legacyDataService;
        _accountService    = (FSAccountService)accountService;
        _voucherService    = (FSVoucherService)voucherService;
        _journalService    = (FSJournalService)journalService;
        _postingService    = postingService;
        _reportService     = reportService;
        _db                = db;
        _config            = config;
        _seedingService    = seedingService;
    }

    [HttpGet("chart-of-accounts")]
    public async Task<IActionResult> GetChartOfAccounts(CancellationToken cancellationToken)
    {
        var dataset = await _legacyDataService.GetDatasetByKeyAsync("fs_accounts", cancellationToken);
        if (dataset is null)
        {
            return NotFound(new { message = "FS accounts dataset not found. Run npm run import:legacy." });
        }

        return Ok(new
        {
            dataset.SourcePath,
            dataset.RowCount,
            Rows = dataset.Rows
        });
    }

    [HttpGet("vouchers")]
    public async Task<IActionResult> GetVouchers(CancellationToken cancellationToken)
    {
        var dataset = await _legacyDataService.GetDatasetByKeyAsync("fs_checkvou", cancellationToken)
                      ?? await _legacyDataService.GetDatasetByKeyAsync("fs_checkmas", cancellationToken);

        if (dataset is null)
        {
            return NotFound(new { message = "FS voucher dataset not found. Run npm run import:legacy." });
        }

        return Ok(new
        {
            dataset.SourcePath,
            dataset.RowCount,
            Rows = dataset.Rows
        });
    }

    [HttpGet("journals")]
    public async Task<IActionResult> GetJournals(CancellationToken cancellationToken)
    {
        var dataset = await _legacyDataService.GetDatasetByKeyAsync("fs_journals", cancellationToken)
                      ?? await _legacyDataService.GetDatasetByKeyAsync("fs_pournals", cancellationToken);

        if (dataset is null)
        {
            return NotFound(new { message = "FS journal dataset not found. Run npm run import:legacy." });
        }

        return Ok(new
        {
            dataset.SourcePath,
            dataset.RowCount,
            Rows = dataset.Rows
        });
    }

    #region Chart of Accounts (9 fields: acct_code, acct_desc, open_bal, cur_debit, cur_credit, gl_report, gl_effect, formula, initialize)

    [HttpGet("accounts")]
    public async Task<IActionResult> GetAllAccounts()
    {
        var accounts = await _accountService.GetAllAccountsAsync();
        return Ok(new { data = accounts, count = accounts.Count });
    }

    [HttpGet("accounts/{accountCode}")]
    public async Task<IActionResult> GetAccountByCode(string accountCode)
    {
        var account = await _accountService.GetAccountByCodeAsync(accountCode);
        if (account == null)
            return NotFound(new { message = $"Account '{accountCode}' not found" });

        return Ok(new { data = account });
    }

    [HttpGet("accounts/search")]
    public async Task<IActionResult> SearchAccounts([FromQuery] string term)
    {
        var accounts = await _accountService.SearchAccountsAsync(term);
        return Ok(new { data = accounts, count = accounts.Count });
    }

    [HttpPost("accounts")]
    public async Task<IActionResult> CreateAccount([FromBody] FSAccount account)
    {
        try
        {
            var created = await _accountService.CreateAccountAsync(account);
            return CreatedAtAction(nameof(GetAccountByCode), new { accountCode = created.AcctCode }, new { data = created });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPut("accounts/{accountCode}")]
    public async Task<IActionResult> UpdateAccount(string accountCode, [FromBody] FSAccount account)
    {
        try
        {
            var updated = await _accountService.UpdateAccountAsync(accountCode, account);
            return Ok(new { data = updated });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("accounts/{accountCode}")]
    public async Task<IActionResult> DeleteAccount(string accountCode)
    {
        var deleted = await _accountService.DeleteAccountAsync(accountCode);
        if (!deleted)
            return NotFound(new { message = $"Account '{accountCode}' not found" });

        return Ok(new { message = "Account deleted successfully" });
    }

    /// <summary>Get next account (navigation)</summary>
    [HttpGet("accounts/navigation/next/{currentCode}")]
    public async Task<IActionResult> GetNextAccount(string currentCode)
    {
        var account = await _accountService.GetNextAccountAsync(currentCode);
        if (account == null)
            return NotFound(new { message = "Last record in file!" });

        return Ok(new { data = account });
    }

    /// <summary>Get previous account (navigation)</summary>
    [HttpGet("accounts/navigation/previous/{currentCode}")]
    public async Task<IActionResult> GetPreviousAccount(string currentCode)
    {
        var account = await _accountService.GetPreviousAccountAsync(currentCode);
        if (account == null)
            return NotFound(new { message = "First record in file!" });

        return Ok(new { data = account });
    }

    /// <summary>Get first account (BOF operation)</summary>
    [HttpGet("accounts/navigation/first")]
    public async Task<IActionResult> GetFirstAccount()
    {
        var account = await _accountService.GetFirstAccountAsync();
        if (account == null)
            return NotFound(new { message = "No records found" });

        return Ok(new { data = account });
    }

    /// <summary>Get last account (EOF operation)</summary>
    [HttpGet("accounts/navigation/last")]
    public async Task<IActionResult> GetLastAccount()
    {
        var account = await _accountService.GetLastAccountAsync();
        if (account == null)
            return NotFound(new { message = "No records found" });

        return Ok(new { data = account });
    }

    /// <summary>Soft-seek find account by code</summary>
    [HttpGet("accounts/navigation/seek/{searchTerm}")]
    public async Task<IActionResult> SoftSeekAccount(string searchTerm)
    {
        var account = await _accountService.SoftSeekAccountAsync(searchTerm);
        if (account == null)
            return NotFound(new { message = "No matching account found" });

        return Ok(new { data = account });
    }

    #endregion

    #region Check Disbursement Vouchers (Master: 8 fields, Detail: 4 fields)

    [HttpGet("vouchers/masters")]
    public async Task<IActionResult> GetAllCheckMasters()
    {
        var checks = await _voucherService.GetAllCheckMastersAsync();
        return Ok(new { data = checks, count = checks.Count });
    }

    [HttpGet("vouchers/masters/{checkNo}")]
    public async Task<IActionResult> GetCheckMaster(string checkNo)
    {
        var check = await _voucherService.GetCheckMasterAsync(checkNo);
        if (check == null)
            return NotFound(new { message = $"Check '{checkNo}' not found" });

        return Ok(new { data = check });
    }

    [HttpGet("vouchers/lines")]
    public async Task<IActionResult> GetAllVoucherLines()
    {
        var lines = await _voucherService.GetAllVoucherLinesAsync();
        return Ok(new { data = lines, count = lines.Count });
    }

    [HttpGet("vouchers/lines/{checkNo}")]
    public async Task<IActionResult> GetVoucherLines(string checkNo)
    {
        var lines = await _voucherService.GetVoucherLinesAsync(checkNo);
        return Ok(new { data = lines, count = lines.Count });
    }

    [HttpGet("vouchers/balance/{checkNo}")]
    public async Task<IActionResult> GetVoucherBalance(string checkNo)
    {
        var balance = await _voucherService.GetVoucherBalanceAsync(checkNo);
        return Ok(new { data = balance });
    }

    [HttpGet("vouchers/unbalanced")]
    public async Task<IActionResult> GetUnbalancedChecks()
    {
        var unbalanced = await _voucherService.GetUnbalancedChecksAsync();
        return Ok(new { data = unbalanced, count = unbalanced.Count });
    }

    /// <summary>Get check by JV number (soft-seek find)</summary>
    [HttpGet("vouchers/checkmaster/jv/{jvNo}")]
    public async Task<IActionResult> GetCheckMasterByJV(string jvNo)
    {
        var check = await _voucherService.GetCheckMasterByJVAsync(jvNo);
        if (check == null)
            return NotFound(new { message = $"Check with JV '{jvNo}' not found" });

        return Ok(new { data = check });
    }

    /// <summary>Get check by check number (search endpoint alias)</summary>
    [HttpGet("vouchers/checkmaster/no/{checkNo}")]
    public async Task<IActionResult> GetCheckMasterByNumber(string checkNo)
    {
        var check = await _voucherService.GetCheckMasterByCheckNoAsync(checkNo);
        if (check == null)
            return NotFound(new { message = $"Check '{checkNo}' not found" });

        return Ok(new { data = check });
    }

    /// <summary>Get next check by check number (navigation)</summary>
    [HttpGet("vouchers/checkmaster/next/{currentCheckNo}")]
    public async Task<IActionResult> GetNextCheckMaster(string currentCheckNo)
    {
        var check = await _voucherService.GetNextCheckMasterAsync(currentCheckNo);
        if (check == null)
            return NotFound(new { message = "Last record in file!" });

        return Ok(new { data = check });
    }

    /// <summary>Get previous check (navigation)</summary>
    [HttpGet("vouchers/checkmaster/previous/{currentCheckNo}")]
    public async Task<IActionResult> GetPreviousCheckMaster(string currentCheckNo)
    {
        var check = await _voucherService.GetPreviousCheckMasterAsync(currentCheckNo);
        if (check == null)
            return NotFound(new { message = "First record in file!" });

        return Ok(new { data = check });
    }

    /// <summary>Get first check (BOF operation)</summary>
    [HttpGet("vouchers/checkmaster/first")]
    public async Task<IActionResult> GetFirstCheckMaster()
    {
        var check = await _voucherService.GetFirstCheckMasterAsync();
        if (check == null)
            return NotFound(new { message = "No records found" });

        return Ok(new { data = check });
    }

    /// <summary>Soft-seek find check by number</summary>
    [HttpGet("vouchers/checkmaster/seek/{searchTerm}")]
    public async Task<IActionResult> SoftSeekCheckNumber(string searchTerm)
    {
        var check = await _voucherService.SoftSeekCheckByNumberAsync(searchTerm);
        if (check == null)
            return NotFound(new { message = "No matching check found" });

        return Ok(new { data = check });
    }

    /// <summary>Get next voucher line within check (navigation)</summary>
    [HttpGet("vouchers/line/next/{checkNo}/{currentLineId}")]
    public async Task<IActionResult> GetNextVoucherLine(string checkNo, int currentLineId)
    {
        var line = await _voucherService.GetNextVoucherLineAsync(checkNo, currentLineId);
        if (line == null)
            return NotFound(new { message = "Last Entry under this check!" });

        return Ok(new { data = line });
    }

    /// <summary>Get previous voucher line within check (navigation)</summary>
    [HttpGet("vouchers/line/previous/{checkNo}/{currentLineId}")]
    public async Task<IActionResult> GetPreviousVoucherLine(string checkNo, int currentLineId)
    {
        var line = await _voucherService.GetPreviousVoucherLineAsync(checkNo, currentLineId);
        if (line == null)
            return NotFound(new { message = "First Entry under this check!" });

        return Ok(new { data = line });
    }

    [HttpPost("vouchers/masters")]
    public async Task<IActionResult> CreateCheckMaster([FromBody] FSCheckMas checkMaster)
    {
        try
        {
            var created = await _voucherService.CreateCheckMasterAsync(checkMaster);
            return CreatedAtAction(nameof(GetCheckMaster), new { checkNo = created.JCkNo }, new { data = created });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPost("vouchers/lines")]
    public async Task<IActionResult> AddVoucherLine([FromBody] FSCheckVou line)
    {
        try
        {
            var created = await _voucherService.AddVoucherLineAsync(line);
            return CreatedAtAction(nameof(GetVoucherLines), new { checkNo = line.JCkNo }, new { data = created });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPut("vouchers/masters/{checkNo}")]
    public async Task<IActionResult> UpdateCheckMaster(string checkNo, [FromBody] FSCheckMas checkMaster)
    {
        try
        {
            var updated = await _voucherService.UpdateCheckMasterAsync(checkNo, checkMaster);
            return Ok(new { data = updated });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("vouchers/lines/{lineId}")]
    public async Task<IActionResult> UpdateVoucherLine(int lineId, [FromBody] FSCheckVou line)
    {
        try
        {
            var updated = await _voucherService.UpdateVoucherLineAsync(lineId, line);
            return Ok(new { data = updated });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("vouchers/masters/{checkNo}")]
    public async Task<IActionResult> DeleteCheckMaster(string checkNo)
    {
        var deleted = await _voucherService.DeleteCheckMasterAsync(checkNo);
        if (!deleted)
            return NotFound(new { message = $"Check '{checkNo}' not found" });

        return Ok(new { message = "Check and all its line items deleted successfully" });
    }

    [HttpDelete("vouchers/lines/{lineId}")]
    public async Task<IActionResult> DeleteVoucherLine(int lineId)
    {
        var deleted = await _voucherService.DeleteVoucherLineAsync(lineId);
        if (!deleted)
            return NotFound(new { message = $"Line item {lineId} not found" });

        return Ok(new { message = "Line item deleted successfully" });
    }

    #endregion

    #region Journal Entries (5 Types: Cash Receipts, Sales Book, Journal Vouchers, Purchase Book, Adjustments)

    [HttpGet("journals/receipts")]
    public async Task<IActionResult> GetAllCashReceipts()
    {
        var receipts = await _journalService.GetAllCashReceiptsAsync();
        return Ok(new { data = receipts, count = receipts.Count });
    }

    [HttpGet("journals/sales")]
    public async Task<IActionResult> GetAllSalesBook()
    {
        var sales = await _journalService.GetAllSalesBookAsync();
        return Ok(new { data = sales, count = sales.Count });
    }

    [HttpGet("journals/general")]
    public async Task<IActionResult> GetAllJournals()
    {
        var journals = await _journalService.GetAllJournalsAsync();
        return Ok(new { data = journals, count = journals.Count });
    }

    [HttpGet("journals/purchase")]
    public async Task<IActionResult> GetAllPurchaseBook()
    {
        var purchase = await _journalService.GetAllPurchaseBookAsync();
        return Ok(new { data = purchase, count = purchase.Count });
    }

    [HttpGet("journals/adjustments")]
    public async Task<IActionResult> GetAllAdjustments()
    {
        var adjustments = await _journalService.GetAllAdjustmentsAsync();
        return Ok(new { data = adjustments, count = adjustments.Count });
    }

    [HttpPost("journals/receipts")]
    public async Task<IActionResult> CreateCashReceipt([FromBody] FSCashRcpt entry)
    {
        try
        {
            var created = await _journalService.CreateCashReceiptAsync(entry);
            return CreatedAtAction(nameof(GetAllCashReceipts), null, new { data = created });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPost("journals/sales")]
    public async Task<IActionResult> CreateSalesBook([FromBody] FSSaleBook entry)
    {
        try
        {
            var created = await _journalService.CreateSalesBookAsync(entry);
            return CreatedAtAction(nameof(GetAllSalesBook), null, new { data = created });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPost("journals/general")]
    public async Task<IActionResult> CreateJournal([FromBody] FSJournal entry)
    {
        try
        {
            var created = await _journalService.CreateJournalAsync(entry);
            return CreatedAtAction(nameof(GetAllJournals), null, new { data = created });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPost("journals/purchase")]
    public async Task<IActionResult> CreatePurchaseBook([FromBody] FSPurcBook entry)
    {
        try
        {
            var created = await _journalService.CreatePurchaseBookAsync(entry);
            return CreatedAtAction(nameof(GetAllPurchaseBook), null, new { data = created });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPost("journals/adjustments")]
    public async Task<IActionResult> CreateAdjustment([FromBody] FSAdjustment entry)
    {
        try
        {
            var created = await _journalService.CreateAdjustmentAsync(entry);
            return CreatedAtAction(nameof(GetAllAdjustments), null, new { data = created });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPut("journals/receipts/{id}")]
    public async Task<IActionResult> UpdateCashReceipt(int id, [FromBody] FSCashRcpt entry)
    {
        try
        {
            var updated = await _journalService.UpdateCashReceiptAsync(id, entry);
            return Ok(new { data = updated });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("journals/receipts/{id}")]
    public async Task<IActionResult> DeleteCashReceipt(int id)
    {
        var deleted = await _journalService.DeleteCashReceiptAsync(id);
        if (!deleted)
            return NotFound(new { message = $"Cash receipt {id} not found" });

        return Ok(new { message = "Cash receipt deleted successfully" });
    }

    [HttpPut("journals/sales/{id}")]
    public async Task<IActionResult> UpdateSalesBook(int id, [FromBody] FSSaleBook entry)
    {
        try
        {
            var updated = await _journalService.UpdateSalesBookAsync(id, entry);
            return Ok(new { data = updated });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("journals/sales/{id}")]
    public async Task<IActionResult> DeleteSalesBook(int id)
    {
        var deleted = await _journalService.DeleteSalesBookAsync(id);
        if (!deleted)
            return NotFound(new { message = $"Sales book entry {id} not found" });

        return Ok(new { message = "Sales book entry deleted successfully" });
    }

    [HttpPut("journals/general/{id}")]
    public async Task<IActionResult> UpdateJournal(int id, [FromBody] FSJournal entry)
    {
        try
        {
            var updated = await _journalService.UpdateJournalAsync(id, entry);
            return Ok(new { data = updated });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("journals/general/{id}")]
    public async Task<IActionResult> DeleteJournal(int id)
    {
        var deleted = await _journalService.DeleteJournalAsync(id);
        if (!deleted)
            return NotFound(new { message = $"Journal entry {id} not found" });

        return Ok(new { message = "Journal entry deleted successfully" });
    }

    [HttpPut("journals/purchase/{id}")]
    public async Task<IActionResult> UpdatePurchaseBook(int id, [FromBody] FSPurcBook entry)
    {
        try
        {
            var updated = await _journalService.UpdatePurchaseBookAsync(id, entry);
            return Ok(new { data = updated });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("journals/purchase/{id}")]
    public async Task<IActionResult> DeletePurchaseBook(int id)
    {
        var deleted = await _journalService.DeletePurchaseBookAsync(id);
        if (!deleted)
            return NotFound(new { message = $"Purchase book entry {id} not found" });

        return Ok(new { message = "Purchase book entry deleted successfully" });
    }

    [HttpPut("journals/adjustments/{id}")]
    public async Task<IActionResult> UpdateAdjustment(int id, [FromBody] FSAdjustment entry)
    {
        try
        {
            var updated = await _journalService.UpdateAdjustmentAsync(id, entry);
            return Ok(new { data = updated });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("journals/adjustments/{id}")]
    public async Task<IActionResult> DeleteAdjustment(int id)
    {
        var deleted = await _journalService.DeleteAdjustmentAsync(id);
        if (!deleted)
            return NotFound(new { message = $"Adjustment entry {id} not found" });

        return Ok(new { message = "Adjustment entry deleted successfully" });
    }

    #endregion

    #region System Info / Dashboard

    /// <summary>Get current system period and transaction counts for the main menu</summary>
    [HttpGet("system-info")]
    public async Task<IActionResult> GetSystemInfo(CancellationToken cancellationToken)
    {
        var sysId = await _postingService.GetSysIdAsync(cancellationToken);

        var checkCount = await _postingService.GetTableCountAsync("fs_checkmas", cancellationToken);
        var cashRcptCount = await _postingService.GetTableCountAsync("fs_cashrcpt", cancellationToken);
        var salesCount = await _postingService.GetTableCountAsync("fs_salebook", cancellationToken);
        var journalCount = await _postingService.GetTableCountAsync("fs_journals", cancellationToken);
        var purcCount = await _postingService.GetTableCountAsync("fs_purcbook", cancellationToken);
        var adjCount = await _postingService.GetTableCountAsync("fs_adjstmnt", cancellationToken);

        return Ok(new
        {
            CurrentMonth = sysId?.PresMo ?? DateTime.Now.Month,
            CurrentYear = sysId?.PresYr ?? DateTime.Now.Year,
            BegDate = sysId?.BegDate,
            EndDate = sysId?.EndDate,
            UnpostedChecks = checkCount,
            UnpostedCashReceipts = cashRcptCount,
            UnpostedSalesBook = salesCount,
            UnpostedJournals = journalCount,
            UnpostedPurchaseBook = purcCount,
            UnpostedAdjustments = adjCount,
            TotalUnposted = checkCount + cashRcptCount + salesCount + journalCount + purcCount + adjCount
        });
    }

    #endregion

    #region Transaction Posting and Month-End Processing

    [HttpPost("posting")]
    public async Task<IActionResult> PostTransactions(CancellationToken cancellationToken)
    {
        var (success, message, recordsPosted) = await _postingService.PostTransactionsAsync(cancellationToken);
        
        if (!success)
        {
            return BadRequest(new { Error = message });
        }

        return Ok(new
        {
            Success = true,
            Message = message,
            RecordsPosted = recordsPosted,
            PostedAt = DateTime.UtcNow
        });
    }

    [HttpPost("month-end")]
    public async Task<IActionResult> ProcessMonthEnd([FromQuery] int year, [FromQuery] int month, CancellationToken cancellationToken)
    {
        var (success, message) = await _postingService.MonthEndProcessingAsync(year, month, cancellationToken);
        
        if (!success)
        {
            return BadRequest(new { Error = message });
        }

        return Ok(new
        {
            Success = true,
            Message = message,
            Period = $"{year}-{month:00}",
            ProcessedAt = DateTime.UtcNow
        });
    }

    [HttpGet("reports/trial-balance")]
    public async Task<IActionResult> GetTrialBalance([FromQuery] DateTime? periodEnding, [FromQuery] bool detailed = false)
    {
        var period = periodEnding ?? DateTime.Today;
        var report = await _reportService.GenerateTrialBalanceAsync(period, detailed);
        return Ok(report);
    }

    [HttpGet("reports/income-statement")]
    public async Task<IActionResult> GetIncomeStatement([FromQuery] DateTime? periodEnding)
    {
        var period = periodEnding ?? DateTime.Today;
        var report = await _reportService.GenerateIncomeStatementAsync(period);
        return Ok(report);
    }

    [HttpGet("reports/balance-sheet")]
    public async Task<IActionResult> GetBalanceSheet([FromQuery] DateTime? periodEnding)
    {
        var period = periodEnding ?? DateTime.Today;
        var report = await _reportService.GenerateBalanceSheetAsync(period);
        return Ok(report);
    }

    #endregion

    #region Group Codes — Effects Table (f_a_edtcod m_which=3)

    [HttpGet("group-codes")]
    public async Task<IActionResult> GetGroupCodes(CancellationToken ct)
    {
        var items = await _db.FSEffects
            .OrderBy(e => e.GlReport).ThenBy(e => e.GlEffect)
            .ToListAsync(ct);
        return Ok(new { data = items });
    }

    [HttpPost("group-codes")]
    public async Task<IActionResult> CreateGroupCode([FromBody] FSEffect item, CancellationToken ct)
    {
        _db.FSEffects.Add(item);
        await _db.SaveChangesAsync(ct);
        return Ok(new { data = item });
    }

    [HttpPut("group-codes/{id:int}")]
    public async Task<IActionResult> UpdateGroupCode(int id, [FromBody] FSEffect item, CancellationToken ct)
    {
        var existing = await _db.FSEffects.FindAsync(new object[] { id }, ct);
        if (existing is null) return NotFound(new { error = "Group code not found" });
        existing.GlReport = item.GlReport;
        existing.GlEffect = item.GlEffect;
        existing.GlHead   = item.GlHead;
        await _db.SaveChangesAsync(ct);
        return Ok(new { data = existing });
    }

    [HttpDelete("group-codes/{id:int}")]
    public async Task<IActionResult> DeleteGroupCode(int id, CancellationToken ct)
    {
        var existing = await _db.FSEffects.FindAsync(new object[] { id }, ct);
        if (existing is null) return NotFound(new { error = "Group code not found" });
        _db.FSEffects.Remove(existing);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Deleted" });
    }

    #endregion

    #region Subsidiary Groups — Schedule Table (f_a_edtcod m_which=4)

    [HttpGet("subsidiary-groups")]
    public async Task<IActionResult> GetSubsidiaryGroups(CancellationToken ct)
    {
        var items = await _db.FSScheduleEntries
            .OrderBy(s => s.GlHead).ThenBy(s => s.AcctCode)
            .ToListAsync(ct);
        return Ok(new { data = items });
    }

    [HttpPost("subsidiary-groups")]
    public async Task<IActionResult> CreateSubsidiaryGroup([FromBody] FSScheduleEntry item, CancellationToken ct)
    {
        // Auto-fill acct_desc from accounts if empty
        if (string.IsNullOrWhiteSpace(item.AcctDesc))
        {
            var acct = await _db.FSAccounts
                .FirstOrDefaultAsync(a => a.AcctCode == item.AcctCode, ct);
            if (acct is not null)
                item.AcctDesc = acct.AcctDesc;
            else
                return BadRequest(new { error = $"Invalid Account Code: {item.AcctCode}" });
        }
        _db.FSScheduleEntries.Add(item);
        await _db.SaveChangesAsync(ct);
        return Ok(new { data = item });
    }

    [HttpPut("subsidiary-groups/{id:int}")]
    public async Task<IActionResult> UpdateSubsidiaryGroup(int id, [FromBody] FSScheduleEntry item, CancellationToken ct)
    {
        var existing = await _db.FSScheduleEntries.FindAsync(new object[] { id }, ct);
        if (existing is null) return NotFound(new { error = "Subsidiary group not found" });
        if (string.IsNullOrWhiteSpace(item.AcctDesc))
        {
            var acct = await _db.FSAccounts
                .FirstOrDefaultAsync(a => a.AcctCode == item.AcctCode, ct);
            item.AcctDesc = acct?.AcctDesc ?? item.AcctDesc;
        }
        existing.GlHead   = item.GlHead;
        existing.AcctCode = item.AcctCode;
        existing.AcctDesc = item.AcctDesc;
        await _db.SaveChangesAsync(ct);
        return Ok(new { data = existing });
    }

    [HttpDelete("subsidiary-groups/{id:int}")]
    public async Task<IActionResult> DeleteSubsidiaryGroup(int id, CancellationToken ct)
    {
        var existing = await _db.FSScheduleEntries.FindAsync(new object[] { id }, ct);
        if (existing is null) return NotFound(new { error = "Subsidiary group not found" });
        _db.FSScheduleEntries.Remove(existing);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Deleted" });
    }

    #endregion

    #region Seed from Legacy DBF Data

    [HttpPost("seed-legacy")]
    public async Task<IActionResult> SeedFromLegacy(CancellationToken cancellationToken)
    {
        var seeded = await _seedingService.SeedAsync(cancellationToken);
        var total  = seeded.Values.Sum();
        if (total == 0)
            return NotFound(new { message = "No migrated JSON files found. Run 'npm run import:legacy' from the web-system directory first.", seeded });

        return Ok(new { message = $"Successfully seeded {total} records across {seeded.Count} tables.", seeded });
    }

    #endregion

    #region Original Legacy Data Endpoints (for data migration)

    [HttpGet("chart-of-accounts-legacy")]
    public async Task<IActionResult> GetChartOfAccountsLegacy(CancellationToken cancellationToken)
    {
        var dataset = await _legacyDataService.GetDatasetByKeyAsync("fs_accounts", cancellationToken);
        if (dataset is null)
        {
            return NotFound(new { message = "FS accounts dataset not found. Run npm run import:legacy." });
        }

        return Ok(new
        {
            dataset.SourcePath,
            dataset.RowCount,
            Rows = dataset.Rows
        });
    }

    [HttpGet("vouchers-legacy")]
    public async Task<IActionResult> GetVouchersLegacy(CancellationToken cancellationToken)
    {
        var dataset = await _legacyDataService.GetDatasetByKeyAsync("fs_checkvou", cancellationToken)
                      ?? await _legacyDataService.GetDatasetByKeyAsync("fs_checkmas", cancellationToken);

        if (dataset is null)
        {
            return NotFound(new { message = "FS voucher dataset not found. Run npm run import:legacy." });
        }

        return Ok(new
        {
            dataset.SourcePath,
            dataset.RowCount,
            Rows = dataset.Rows
        });
    }

    [HttpGet("journals-legacy")]
    public async Task<IActionResult> GetJournalsLegacy(CancellationToken cancellationToken)
    {
        var dataset = await _legacyDataService.GetDatasetByKeyAsync("fs_journals", cancellationToken)
                      ?? await _legacyDataService.GetDatasetByKeyAsync("fs_pournals", cancellationToken);

        if (dataset is null)
        {
            return NotFound(new { message = "FS journal dataset not found. Run npm run import:legacy." });
        }

        return Ok(new
        {
            dataset.SourcePath,
            dataset.RowCount,
            Rows = dataset.Rows
        });
    }

    #endregion

    #region Backup

    /// <summary>
    /// Download a point-in-time copy of the SQLite database file.
    /// Equivalent to f_a_backup() in A_BACKUP.PRG.
    /// Returns the raw .db file as an octet-stream download.
    /// </summary>
    [HttpGet("backup")]
    public IActionResult DownloadBackup()
    {
        // Resolve the db file path from the connection string (Data Source=accounting.db)
        var connStr = _config.GetConnectionString("DefaultConnection")
                      ?? "Data Source=accounting.db";

        // Parse "Data Source=<path>" from the connection string
        var dbPath = connStr
            .Split(';', StringSplitOptions.RemoveEmptyEntries)
            .Select(p => p.Trim())
            .FirstOrDefault(p => p.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase))
            ?.Substring("Data Source=".Length)
            ?? "accounting.db";

        if (!Path.IsPathRooted(dbPath))
            dbPath = Path.Combine(Directory.GetCurrentDirectory(), dbPath);

        if (!System.IO.File.Exists(dbPath))
            return NotFound(new { error = $"Database file not found at: {dbPath}" });

        var stamp = DateTime.Now.ToString("yyyyMMdd_HHmm");
        var downloadName = $"accounting_backup_{stamp}.db";

        // Read into memory so the file stream is not held open
        var bytes = System.IO.File.ReadAllBytes(dbPath);
        return File(bytes, "application/octet-stream", downloadName);
    }

    #endregion
}
