using System.Text.Json;
using AccountingApi.Data;
using AccountingApi.Models;
using AccountingApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccountingApi.Controllers;

[ApiController]
[Route("api/admin")]
public sealed class AdminImportController : ControllerBase
{
    private readonly AccountingDbContext _db;

    public AdminImportController(AccountingDbContext db)
    {
        _db = db;
    }

    // ── Step 1: Analyze files (client sends file names, server classifies) ───
    [HttpPost("import/analyze")]
    [Authorize]
    public IActionResult AnalyzeFiles([FromBody] AnalyzeRequest request)
    {
        var manifest = DbfTableRouter.ClassifyAll(request.FileNames);
        var missingRequired = DbfTableRouter.FindMissingRequired(request.FileNames);

        return Ok(new
        {
            files = manifest.Select(f => new
            {
                fileName = f.DbfFileName,
                targetTable = f.TargetTable,
                displayName = f.DisplayName,
                classification = f.Classification.ToString().ToLowerInvariant(),
                ignoreReason = f.IgnoreReason
            }),
            missingRequired,
            canProceed = missingRequired.Count == 0
        });
    }

    public sealed class AnalyzeRequest
    {
        public List<string> FileNames { get; set; } = new();
    }

    // ── Step 2: Upload & Import (multipart with SSE streaming progress) ──────
    [HttpPost("import/upload")]
    [Authorize]
    [RequestSizeLimit(50 * 1024 * 1024)] // 50 MB limit
    public async Task UploadAndImport(
        [FromForm] string companyCode,
        [FromForm] List<IFormFile> files,
        CancellationToken ct)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers["Cache-Control"] = "no-cache";
        Response.Headers["Connection"] = "keep-alive";

        async Task SendEvent(string type, object data)
        {
            var json = JsonSerializer.Serialize(data);
            await Response.WriteAsync($"data: {{\"type\":\"{type}\",\"payload\":{json}}}\n\n", ct);
            await Response.Body.FlushAsync(ct);
        }

        try
        {
            // Validate company code
            if (!CompanyCatalog.IsValid(companyCode))
            {
                await SendEvent("error", new { message = $"Invalid company code: {companyCode}" });
                return;
            }

            var normalizedCompany = CompanyCatalog.NormalizeOrDefault(companyCode);

            // Override the company context so EF Core's ApplyCompanyScope uses the correct code
            HttpContext.Items[CompanyContextKeys.SelectedCompanyCodeItem] = normalizedCompany;

            var now = DateTime.UtcNow;
            int totalFilesProcessed = 0;
            int totalRecordsImported = 0;
            var tableResults = new Dictionary<string, int>();

            await SendEvent("start", new
            {
                company = normalizedCompany,
                totalFiles = files.Count,
                message = $"Starting import for company '{normalizedCompany}'..."
            });

            foreach (var file in files)
            {
                var fileName = Path.GetFileName(file.FileName);
                var mapping = DbfTableRouter.ClassifyFile(fileName);

                // Skip ignored files
                if (mapping.Classification == DbfTableRouter.FileClassification.Ignored)
                {
                    await SendEvent("skip", new
                    {
                        fileName,
                        reason = mapping.IgnoreReason ?? "Not a recognized data file"
                    });
                    continue;
                }

                if (mapping.TargetTable is null)
                {
                    await SendEvent("skip", new { fileName, reason = "No target table mapped" });
                    continue;
                }

                // Read the DBF file
                await SendEvent("reading", new
                {
                    fileName,
                    displayName = mapping.DisplayName,
                    targetTable = mapping.TargetTable
                });

                DbfReader.DbfResult dbfData;
                try
                {
                    using var stream = file.OpenReadStream();
                    dbfData = await DbfReader.ReadAsync(stream, fileName, ct);
                }
                catch (Exception ex)
                {
                    await SendEvent("file_error", new
                    {
                        fileName,
                        error = $"Failed to read DBF: {ex.Message}"
                    });
                    continue;
                }

                await SendEvent("parsed", new
                {
                    fileName,
                    recordCount = dbfData.RecordCount,
                    columns = dbfData.Columns
                });

                // Seed into database
                await SendEvent("seeding", new
                {
                    fileName,
                    targetTable = mapping.TargetTable,
                    recordCount = dbfData.RecordCount
                });

                int seededCount = 0;
                try
                {
                    seededCount = await SeedTableAsync(
                        mapping.TargetTable, dbfData.Rows, normalizedCompany, now, ct);
                }
                catch (Exception ex)
                {
                    await SendEvent("file_error", new
                    {
                        fileName,
                        targetTable = mapping.TargetTable,
                        error = $"Seeding failed: {ex.InnerException?.Message ?? ex.Message}"
                    });
                    continue;
                }

                tableResults[mapping.TargetTable] = seededCount;
                totalFilesProcessed++;
                totalRecordsImported += seededCount;

                await SendEvent("file_done", new
                {
                    fileName,
                    targetTable = mapping.TargetTable,
                    displayName = mapping.DisplayName,
                    recordCount = seededCount
                });
            }

            // Ensure fs_sys_id row exists for this company
            var hasSysId = await _db.FSSysId
                .IgnoreQueryFilters()
                .AnyAsync(x => x.CompanyCode == normalizedCompany, ct);

            if (!hasSysId)
            {
                _db.FSSysId.Add(new FSSysId
                {
                    CompanyCode = normalizedCompany,
                    PresMo = now.Month,
                    PresYr = now.Year,
                    BegDate = new DateTime(now.Year, now.Month, 1),
                    EndDate = new DateTime(now.Year, now.Month,
                        DateTime.DaysInMonth(now.Year, now.Month)),
                    UpdatedAt = now
                });
                await _db.SaveChangesAsync(ct);
            }

            await SendEvent("complete", new
            {
                company = normalizedCompany,
                totalFilesProcessed,
                totalRecordsImported,
                tables = tableResults,
                message = $"Successfully imported {totalRecordsImported} records across {totalFilesProcessed} files!"
            });
        }
        catch (Exception ex)
        {
            await SendEvent("error", new { message = ex.Message });
        }
    }

    // ── Per-table seeding logic ──────────────────────────────────────────────

    private static string Str(Dictionary<string, object?> row, string key, string def = "")
    {
        var kv = row.FirstOrDefault(x => x.Key.Equals(key, StringComparison.OrdinalIgnoreCase));
        if (kv.Key is null) return def;
        return kv.Value switch
        {
            JsonElement je => je.ValueKind == JsonValueKind.String
                ? (je.GetString() ?? def).Trim() : je.ToString().Trim(),
            string s => s.Trim(),
            _ => (kv.Value?.ToString() ?? def).Trim()
        };
    }

    private static decimal Dec(Dictionary<string, object?> row, string key)
    {
        var kv = row.FirstOrDefault(x => x.Key.Equals(key, StringComparison.OrdinalIgnoreCase));
        if (kv.Key is null) return 0m;
        return kv.Value switch
        {
            JsonElement je when je.ValueKind == JsonValueKind.Number => je.GetDecimal(),
            JsonElement je => decimal.TryParse(je.ToString(), out var d2) ? d2 : 0m,
            decimal d => d,
            _ => decimal.TryParse(kv.Value?.ToString(), out var d3) ? d3 : 0m
        };
    }

    private static DateTime Dt(Dictionary<string, object?> row, string key, DateTime fallback)
    {
        var kv = row.FirstOrDefault(x => x.Key.Equals(key, StringComparison.OrdinalIgnoreCase));
        if (kv.Key is null) return fallback;
        var s = kv.Value switch
        {
            JsonElement je => je.ValueKind == JsonValueKind.String ? je.GetString() : je.ToString(),
            _ => kv.Value?.ToString()
        };
        return DateTime.TryParse(s, out var dt) ? dt : fallback;
    }

    private static bool Bool(Dictionary<string, object?> row, string key)
    {
        var kv = row.FirstOrDefault(x => x.Key.Equals(key, StringComparison.OrdinalIgnoreCase));
        if (kv.Key is null) return false;
        return kv.Value switch
        {
            JsonElement je when je.ValueKind == JsonValueKind.True => true,
            JsonElement je when je.ValueKind == JsonValueKind.False => false,
            JsonElement je when je.ValueKind == JsonValueKind.String => je.GetString() is "T" or "true" or "1",
            bool b => b,
            string s => s is "T" or "t" or "Y" or "y" or "1" or "true",
            _ => false
        };
    }

    private async Task<int> SeedTableAsync(
        string targetTable,
        List<Dictionary<string, object?>> rows,
        string companyCode,
        DateTime now,
        CancellationToken ct)
    {
        // Delete existing data for this company+table first
        var deleteCmd = $"DELETE FROM {targetTable} WHERE company_code = @p0";
        await _db.Database.ExecuteSqlRawAsync(deleteCmd, new object[] { companyCode }, ct);

        switch (targetTable)
        {
            case "fs_accounts":
                var accounts = rows
                    .Select(r => new FSAccount
                    {
                        CompanyCode = companyCode,
                        AcctCode = Str(r, "ACCT_CODE"),
                        AcctDesc = Str(r, "ACCT_DESC"),
                        OpenBal = Dec(r, "OPEN_BAL"),
                        CurDebit = Dec(r, "CUR_DEBIT"),
                        CurCredit = Dec(r, "CUR_CREDIT"),
                        EndBal = Dec(r, "END_BAL"),
                        GlReport = Str(r, "GL_REPORT"),
                        GlEffect = Str(r, "GL_EFFECT"),
                        Formula = Str(r, "FORMULA", "DC"),
                        Initialize = Bool(r, "INITIALIZE"),
                        IsActive = true,
                        CreatedAt = now,
                        UpdatedAt = now
                    })
                    .Where(a => !string.IsNullOrWhiteSpace(a.AcctCode))
                    .ToList();
                _db.FSAccounts.AddRange(accounts);
                await _db.SaveChangesAsync(ct);
                return accounts.Count;

            case "fs_checkmas":
                var checks = rows
                    .Select(r => new FSCheckMas
                    {
                        CompanyCode = companyCode,
                        JJvNo = Str(r, "J_JV_NO"),
                        JCkNo = Str(r, "J_CK_NO"),
                        JDate = Dt(r, "J_DATE", now),
                        JPayTo = Str(r, "J_PAY_TO"),
                        JCkAmt = Dec(r, "J_CK_AMT"),
                        JDesc = Str(r, "J_DESC"),
                        BankNo = (int)Dec(r, "BANK_NO"),
                        SupNo = (int)Dec(r, "SUP_NO"),
                        CreatedAt = now,
                        UpdatedAt = now
                    })
                    .Where(e => !string.IsNullOrWhiteSpace(e.JCkNo))
                    .ToList();
                _db.FSCheckMas.AddRange(checks);
                await _db.SaveChangesAsync(ct);
                return checks.Count;

            case "fs_checkvou":
                var vouchers = rows
                    .Select(r => new FSCheckVou
                    {
                        CompanyCode = companyCode,
                        JCkNo = Str(r, "J_CK_NO"),
                        AcctCode = Str(r, "ACCT_CODE"),
                        JCkAmt = Dec(r, "J_CK_AMT"),
                        JDOrC = Str(r, "J_D_OR_C", "D"),
                        CreatedAt = now,
                        UpdatedAt = now
                    })
                    .Where(e => !string.IsNullOrWhiteSpace(e.JCkNo))
                    .ToList();
                _db.FSCheckVou.AddRange(vouchers);
                await _db.SaveChangesAsync(ct);
                return vouchers.Count;

            case "fs_cashrcpt":
                var receipts = rows
                    .Select(r => new FSCashRcpt
                    {
                        CompanyCode = companyCode,
                        JJvNo = Str(r, "J_JV_NO"),
                        JDate = Dt(r, "J_DATE", now),
                        AcctCode = Str(r, "ACCT_CODE"),
                        JCkAmt = Dec(r, "J_CK_AMT"),
                        JDOrC = Str(r, "J_D_OR_C", "D"),
                        CreatedAt = now,
                        UpdatedAt = now
                    })
                    .Where(e => !string.IsNullOrWhiteSpace(e.JJvNo))
                    .ToList();
                _db.FSCashRcpt.AddRange(receipts);
                await _db.SaveChangesAsync(ct);
                return receipts.Count;

            case "fs_salebook":
                var sales = rows
                    .Select(r => new FSSaleBook
                    {
                        CompanyCode = companyCode,
                        JJvNo = Str(r, "J_JV_NO"),
                        JDate = Dt(r, "J_DATE", now),
                        AcctCode = Str(r, "ACCT_CODE"),
                        JCkAmt = Dec(r, "J_CK_AMT"),
                        JDOrC = Str(r, "J_D_OR_C", "D"),
                        CreatedAt = now,
                        UpdatedAt = now
                    })
                    .Where(e => !string.IsNullOrWhiteSpace(e.JJvNo))
                    .ToList();
                _db.FSSaleBook.AddRange(sales);
                await _db.SaveChangesAsync(ct);
                return sales.Count;

            case "fs_purcbook":
                var purchases = rows
                    .Select(r => new FSPurcBook
                    {
                        CompanyCode = companyCode,
                        JJvNo = Str(r, "J_JV_NO"),
                        JDate = Dt(r, "J_DATE", now),
                        AcctCode = Str(r, "ACCT_CODE"),
                        JCkAmt = Dec(r, "J_CK_AMT"),
                        JDOrC = Str(r, "J_D_OR_C", "D"),
                        CreatedAt = now,
                        UpdatedAt = now
                    })
                    .Where(e => !string.IsNullOrWhiteSpace(e.JJvNo))
                    .ToList();
                _db.FSPurcBook.AddRange(purchases);
                await _db.SaveChangesAsync(ct);
                return purchases.Count;

            case "fs_adjstmnt":
                var adjustments = rows
                    .Select(r => new FSAdjustment
                    {
                        CompanyCode = companyCode,
                        JJvNo = Str(r, "J_JV_NO"),
                        JDate = Dt(r, "J_DATE", now),
                        AcctCode = Str(r, "ACCT_CODE"),
                        JCkAmt = Dec(r, "J_CK_AMT"),
                        JDOrC = Str(r, "J_D_OR_C", "D"),
                        CreatedAt = now,
                        UpdatedAt = now
                    })
                    .Where(e => !string.IsNullOrWhiteSpace(e.JJvNo))
                    .ToList();
                _db.FSAdjustment.AddRange(adjustments);
                await _db.SaveChangesAsync(ct);
                return adjustments.Count;

            case "fs_journals":
                var journals = rows
                    .Select(r => new FSJournal
                    {
                        CompanyCode = companyCode,
                        JJvNo = Str(r, "J_JV_NO"),
                        JDate = Dt(r, "J_DATE", now),
                        AcctCode = Str(r, "ACCT_CODE"),
                        JCkAmt = Dec(r, "J_CK_AMT"),
                        JDOrC = Str(r, "J_D_OR_C", "D"),
                        CreatedAt = now,
                        UpdatedAt = now
                    })
                    .Where(e => !string.IsNullOrWhiteSpace(e.JJvNo))
                    .ToList();
                _db.FSJournals.AddRange(journals);
                await _db.SaveChangesAsync(ct);
                return journals.Count;

            case "fs_pournals":
                var posted = rows
                    .Select(r => new FSPostedJournal
                    {
                        CompanyCode = companyCode,
                        JJvNo = Str(r, "J_JV_NO"),
                        JDate = Dt(r, "J_DATE", now),
                        AcctCode = Str(r, "ACCT_CODE"),
                        JCkAmt = Dec(r, "J_CK_AMT"),
                        JDOrC = Str(r, "J_D_OR_C", "D"),
                        CreatedAt = now
                    })
                    .Where(e => !string.IsNullOrWhiteSpace(e.JJvNo))
                    .ToList();
                _db.FSPostedJournals.AddRange(posted);
                await _db.SaveChangesAsync(ct);
                return posted.Count;

            case "fs_effects":
                var effects = rows
                    .Select(r => new FSEffect
                    {
                        CompanyCode = companyCode,
                        GlReport = Str(r, "GL_REPORT"),
                        GlEffect = Str(r, "GL_EFFECT"),
                        GlHead = Str(r, "GL_HEAD")
                    })
                    .Where(e => !string.IsNullOrWhiteSpace(e.GlReport))
                    .ToList();
                _db.FSEffects.AddRange(effects);
                await _db.SaveChangesAsync(ct);
                return effects.Count;

            case "fs_schedule":
                var schedules = rows
                    .Select(r => new FSScheduleEntry
                    {
                        CompanyCode = companyCode,
                        GlHead = Str(r, "GL_HEAD"),
                        AcctCode = Str(r, "ACCT_CODE"),
                        AcctDesc = Str(r, "ACCT_DESC")
                    })
                    .Where(e => !string.IsNullOrWhiteSpace(e.GlHead))
                    .ToList();
                _db.FSScheduleEntries.AddRange(schedules);
                await _db.SaveChangesAsync(ct);
                return schedules.Count;

            case "fs_banks":
                var banks = rows
                    .Select(r => new FSBank
                    {
                        CompanyCode = companyCode,
                        BankNo = (int)Dec(r, "BANK_NO"),
                        BankName = Str(r, "BANK_NM"),
                        BankAddr = Str(r, "BANK_ADD"),
                        BankAcct = Str(r, "BANK_ACCT")
                    })
                    .Where(e => !string.IsNullOrWhiteSpace(e.BankName))
                    .ToList();
                _db.FSBanks.AddRange(banks);
                await _db.SaveChangesAsync(ct);
                return banks.Count;

            case "fs_supplier":
                var suppliers = rows
                    .Select(r => new FSSupplier
                    {
                        CompanyCode = companyCode,
                        SupNo = (int)Dec(r, "SUP_NO"),
                        SupName = Str(r, "SUP_NM"),
                        SupAddr = Str(r, "SUP_ADD"),
                        SupPhone = Str(r, "SUP_TEL"),
                        SupFax = Str(r, "SUP_FAX"),
                        SupContak = Str(r, "SUP_CONTAK")
                    })
                    .Where(e => !string.IsNullOrWhiteSpace(e.SupName))
                    .ToList();
                _db.FSSuppliers.AddRange(suppliers);
                await _db.SaveChangesAsync(ct);
                return suppliers.Count;

            default:
                return 0;
        }
    }

    public class WipeDataRequest
    {
        public string CompanyCode { get; set; } = string.Empty;
        public string WipeType { get; set; } = "FactoryReset"; // "FactoryReset" or "TimeFrame"
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    [HttpPost("import/wipe")]
    [Authorize(Roles = "superadmin")]
    public async Task<IActionResult> WipeCompanyDataAsync([FromBody] WipeDataRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.CompanyCode)) return BadRequest("Company code is required.");
        if (!CompanyCatalog.IsValid(request.CompanyCode)) return BadRequest("Invalid company code.");

        var norm = CompanyCatalog.NormalizeOrDefault(request.CompanyCode);
        
        using var transaction = await _db.Database.BeginTransactionAsync();
        try 
        {
            if (request.WipeType == "TimeFrame")
            {
                if (!request.StartDate.HasValue || !request.EndDate.HasValue)
                    return BadRequest(new { message = "StartDate and EndDate are required for a Time-Frame wipe." });

                var start = request.StartDate.Value.Date;
                var end = request.EndDate.Value.Date;

                // Journals
                await _db.FSJournals.Where(x => x.CompanyCode == norm && x.JDate >= start && x.JDate <= end).ExecuteDeleteAsync();
                await _db.FSPostedJournals.Where(x => x.CompanyCode == norm && x.JDate >= start && x.JDate <= end).ExecuteDeleteAsync();
                await _db.FSSaleBook.Where(x => x.CompanyCode == norm && x.JDate >= start && x.JDate <= end).ExecuteDeleteAsync();
                await _db.FSPurcBook.Where(x => x.CompanyCode == norm && x.JDate >= start && x.JDate <= end).ExecuteDeleteAsync();
                await _db.FSAdjustment.Where(x => x.CompanyCode == norm && x.JDate >= start && x.JDate <= end).ExecuteDeleteAsync();
                
                // Cash Receipts
                await _db.FSCashRcpt.Where(x => x.CompanyCode == norm && x.JDate >= start && x.JDate <= end).ExecuteDeleteAsync();
                
                // Check Master
                var checkMasQuery = _db.FSCheckMas.Where(x => x.CompanyCode == norm && x.JDate >= start && x.JDate <= end);
                var checkNos = await checkMasQuery.Select(x => x.JCkNo).ToListAsync();
                
                // Delete Check Vouchers associated with those checks
                if(checkNos.Any()) {
                    await _db.FSCheckVou.Where(x => x.CompanyCode == norm && checkNos.Contains(x.JCkNo)).ExecuteDeleteAsync();
                }
                
                await checkMasQuery.ExecuteDeleteAsync();
            }
            else
            {
                // Factory Reset
                var sqlItems = new[]
                {
                    "fs_vouchers",
                    "fs_journals",
                    "fs_accounts",
                    "fs_group_codes",
                    "fs_subsidiary_groups",
                    "fs_banks",
                    "fs_suppliers",
                    "fs_signatories",
                    "fs_checkmas",
                    "fs_checkvou",
                    "fs_cashrcpt"
                };
                foreach (var table in sqlItems)
                {
                   await _db.Database.ExecuteSqlRawAsync($"DELETE FROM {table} WHERE company_code = {{0}}", norm);
                }
            }
            await transaction.CommitAsync();
            return Ok(new { message = request.WipeType == "TimeFrame" 
                ? $"Transactional data for {norm} between {request.StartDate:yyyy-MM-dd} and {request.EndDate:yyyy-MM-dd} was successfully wiped."
                : $"Factory Reset completed for {norm}." 
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
