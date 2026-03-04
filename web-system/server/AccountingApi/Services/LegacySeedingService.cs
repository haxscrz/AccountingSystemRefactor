using System.Text.Json;
using AccountingApi.Data;
using AccountingApi.Models;
using Microsoft.EntityFrameworkCore;

namespace AccountingApi.Services;

/// <summary>
/// Reads the pre-migrated JSON files in public/migrated/ and seeds every SQLite
/// table.  Called automatically on startup when the database is empty, and also
/// exposed via POST /api/fs/seed-legacy so users can re-seed manually.
/// </summary>
public sealed class LegacySeedingService
{
    private readonly AccountingDbContext _db;
    private readonly LegacyDataService   _legacyData;

    public LegacySeedingService(AccountingDbContext db, LegacyDataService legacyData)
    {
        _db          = db;
        _legacyData  = legacyData;
    }

    // ── helpers ──────────────────────────────────────────────────────────────

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
            JsonElement je when je.ValueKind == JsonValueKind.True  => true,
            JsonElement je when je.ValueKind == JsonValueKind.False => false,
            JsonElement je when je.ValueKind == JsonValueKind.String =>
                je.GetString() is "T" or "true" or "1",
            bool b => b,
            _ => false
        };
    }

    // ── public entry-point ───────────────────────────────────────────────────

    /// <summary>
    /// Seeds all tables from the migrated JSON files.
    /// Returns a summary dictionary of table → rows inserted.
    /// Returns an empty dictionary when no JSON files are found.
    /// </summary>
    public async Task<Dictionary<string, int>> SeedAsync(CancellationToken cancellationToken = default)
    {
        var now    = DateTime.UtcNow;
        var seeded = new Dictionary<string, int>();

        // ── fs_accounts ──────────────────────────────────────────────────────
        var acDs = await _legacyData.GetDatasetByKeyAsync("fs_accounts", cancellationToken);
        if (acDs != null)
        {
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM fs_accounts", cancellationToken);
            var rows = acDs.Rows
                .Select(r => new FSAccount
                {
                    AcctCode   = Str(r, "ACCT_CODE"),
                    AcctDesc   = Str(r, "ACCT_DESC"),
                    OpenBal    = Dec(r, "OPEN_BAL"),
                    CurDebit   = Dec(r, "CUR_DEBIT"),
                    CurCredit  = Dec(r, "CUR_CREDIT"),
                    EndBal     = Dec(r, "END_BAL"),
                    GlReport   = Str(r, "GL_REPORT"),
                    GlEffect   = Str(r, "GL_EFFECT"),
                    Formula    = Str(r, "FORMULA", "DC"),
                    Initialize = Bool(r, "INITIALIZE"),
                    IsActive   = true,
                    CreatedAt  = now,
                    UpdatedAt  = now
                })
                .Where(a => !string.IsNullOrWhiteSpace(a.AcctCode))
                .ToList();
            _db.FSAccounts.AddRange(rows);
            await _db.SaveChangesAsync(cancellationToken);
            seeded["fs_accounts"] = rows.Count;
        }

        // ── fs_cashrcpt ──────────────────────────────────────────────────────
        var crDs = await _legacyData.GetDatasetByKeyAsync("fs_cashrcpt", cancellationToken);
        if (crDs != null)
        {
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM fs_cashrcpt", cancellationToken);
            var rows = crDs.Rows
                .Select(r => new FSCashRcpt
                {
                    JJvNo = Str(r, "J_JV_NO"), JDate = Dt(r, "J_DATE", now),
                    AcctCode = Str(r, "ACCT_CODE"), JCkAmt = Dec(r, "J_CK_AMT"),
                    JDOrC = Str(r, "J_D_OR_C", "D"), CreatedAt = now, UpdatedAt = now
                })
                .Where(e => !string.IsNullOrWhiteSpace(e.JJvNo)).ToList();
            _db.FSCashRcpt.AddRange(rows);
            await _db.SaveChangesAsync(cancellationToken);
            seeded["fs_cashrcpt"] = rows.Count;
        }

        // ── fs_salebook ──────────────────────────────────────────────────────
        var sbDs = await _legacyData.GetDatasetByKeyAsync("fs_salebook", cancellationToken);
        if (sbDs != null)
        {
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM fs_salebook", cancellationToken);
            var rows = sbDs.Rows
                .Select(r => new FSSaleBook
                {
                    JJvNo = Str(r, "J_JV_NO"), JDate = Dt(r, "J_DATE", now),
                    AcctCode = Str(r, "ACCT_CODE"), JCkAmt = Dec(r, "J_CK_AMT"),
                    JDOrC = Str(r, "J_D_OR_C", "D"), CreatedAt = now, UpdatedAt = now
                })
                .Where(e => !string.IsNullOrWhiteSpace(e.JJvNo)).ToList();
            _db.FSSaleBook.AddRange(rows);
            await _db.SaveChangesAsync(cancellationToken);
            seeded["fs_salebook"] = rows.Count;
        }

        // ── fs_purcbook ──────────────────────────────────────────────────────
        var pbDs = await _legacyData.GetDatasetByKeyAsync("fs_purcbook", cancellationToken);
        if (pbDs != null)
        {
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM fs_purcbook", cancellationToken);
            var rows = pbDs.Rows
                .Select(r => new FSPurcBook
                {
                    JJvNo = Str(r, "J_JV_NO"), JDate = Dt(r, "J_DATE", now),
                    AcctCode = Str(r, "ACCT_CODE"), JCkAmt = Dec(r, "J_CK_AMT"),
                    JDOrC = Str(r, "J_D_OR_C", "D"), CreatedAt = now, UpdatedAt = now
                })
                .Where(e => !string.IsNullOrWhiteSpace(e.JJvNo)).ToList();
            _db.FSPurcBook.AddRange(rows);
            await _db.SaveChangesAsync(cancellationToken);
            seeded["fs_purcbook"] = rows.Count;
        }

        // ── fs_adjstmnt ──────────────────────────────────────────────────────
        var adjDs = await _legacyData.GetDatasetByKeyAsync("fs_adjstmnt", cancellationToken);
        if (adjDs != null)
        {
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM fs_adjstmnt", cancellationToken);
            var rows = adjDs.Rows
                .Select(r => new FSAdjustment
                {
                    JJvNo = Str(r, "J_JV_NO"), JDate = Dt(r, "J_DATE", now),
                    AcctCode = Str(r, "ACCT_CODE"), JCkAmt = Dec(r, "J_CK_AMT"),
                    JDOrC = Str(r, "J_D_OR_C", "D"), CreatedAt = now, UpdatedAt = now
                })
                .Where(e => !string.IsNullOrWhiteSpace(e.JJvNo)).ToList();
            _db.FSAdjustment.AddRange(rows);
            await _db.SaveChangesAsync(cancellationToken);
            seeded["fs_adjstmnt"] = rows.Count;
        }

        // ── fs_journals ──────────────────────────────────────────────────────
        var jnDs = await _legacyData.GetDatasetByKeyAsync("fs_journals", cancellationToken);
        if (jnDs != null)
        {
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM fs_journals", cancellationToken);
            var rows = jnDs.Rows
                .Select(r => new FSJournal
                {
                    JJvNo = Str(r, "J_JV_NO"), JDate = Dt(r, "J_DATE", now),
                    AcctCode = Str(r, "ACCT_CODE"), JCkAmt = Dec(r, "J_CK_AMT"),
                    JDOrC = Str(r, "J_D_OR_C", "D"), CreatedAt = now, UpdatedAt = now
                })
                .Where(e => !string.IsNullOrWhiteSpace(e.JJvNo)).ToList();
            _db.FSJournals.AddRange(rows);
            await _db.SaveChangesAsync(cancellationToken);
            seeded["fs_journals"] = rows.Count;
        }

        // ── fs_pournals (posted journals) ────────────────────────────────────
        var pjDs = await _legacyData.GetDatasetByKeyAsync("fs_pournals", cancellationToken);
        if (pjDs != null)
        {
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM fs_pournals", cancellationToken);
            var rows = pjDs.Rows
                .Select(r => new FSPostedJournal
                {
                    JJvNo = Str(r, "J_JV_NO"), JDate = Dt(r, "J_DATE", now),
                    AcctCode = Str(r, "ACCT_CODE"), JCkAmt = Dec(r, "J_CK_AMT"),
                    JDOrC = Str(r, "J_D_OR_C", "D"), CreatedAt = now
                })
                .Where(e => !string.IsNullOrWhiteSpace(e.JJvNo)).ToList();
            _db.FSPostedJournals.AddRange(rows);
            await _db.SaveChangesAsync(cancellationToken);
            seeded["fs_pournals"] = rows.Count;
        }

        // ── fs_checkmas ──────────────────────────────────────────────────────
        var cmDs = await _legacyData.GetDatasetByKeyAsync("fs_checkmas", cancellationToken)
                ?? await _legacyData.GetDatasetByKeyAsync("fs_acheckma", cancellationToken);
        if (cmDs != null)
        {
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM fs_checkmas", cancellationToken);
            var rows = cmDs.Rows
                .Select(r => new FSCheckMas
                {
                    JJvNo  = Str(r, "J_JV_NO"), JCkNo = Str(r, "J_CK_NO"),
                    JDate  = Dt(r, "J_DATE", now), JPayTo = Str(r, "J_PAY_TO"),
                    JCkAmt = Dec(r, "J_CK_AMT"), JDesc = Str(r, "J_DESC"),
                    BankNo = (int)Dec(r, "BANK_NO"), SupNo = (int)Dec(r, "SUP_NO"),
                    CreatedAt = now, UpdatedAt = now
                })
                .Where(e => !string.IsNullOrWhiteSpace(e.JCkNo)).ToList();
            _db.FSCheckMas.AddRange(rows);
            await _db.SaveChangesAsync(cancellationToken);
            seeded["fs_checkmas"] = rows.Count;
        }

        // ── fs_checkvou ──────────────────────────────────────────────────────
        var cvDs = await _legacyData.GetDatasetByKeyAsync("fs_checkvou", cancellationToken)
                ?? await _legacyData.GetDatasetByKeyAsync("fs_acheckvo", cancellationToken);
        if (cvDs != null)
        {
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM fs_checkvou", cancellationToken);
            var rows = cvDs.Rows
                .Select(r => new FSCheckVou
                {
                    JCkNo = Str(r, "J_CK_NO"), AcctCode = Str(r, "ACCT_CODE"),
                    JCkAmt = Dec(r, "J_CK_AMT"), JDOrC = Str(r, "J_D_OR_C", "D"),
                    CreatedAt = now, UpdatedAt = now
                })
                .Where(e => !string.IsNullOrWhiteSpace(e.JCkNo)).ToList();
            _db.FSCheckVou.AddRange(rows);
            await _db.SaveChangesAsync(cancellationToken);
            seeded["fs_checkvou"] = rows.Count;
        }

        // ── fs_effects ───────────────────────────────────────────────────────
        var efDs = await _legacyData.GetDatasetByKeyAsync("fs_effects", cancellationToken);
        if (efDs != null)
        {
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM fs_effects", cancellationToken);
            var rows = efDs.Rows
                .Select(r => new FSEffect
                {
                    GlReport = Str(r, "GL_REPORT"), GlEffect = Str(r, "GL_EFFECT"),
                    GlHead   = Str(r, "GL_HEAD")
                })
                .Where(e => !string.IsNullOrWhiteSpace(e.GlReport)).ToList();
            _db.FSEffects.AddRange(rows);
            await _db.SaveChangesAsync(cancellationToken);
            seeded["fs_effects"] = rows.Count;
        }

        // ── fs_schedule ──────────────────────────────────────────────────────
        var scDs = await _legacyData.GetDatasetByKeyAsync("fs_schedule", cancellationToken);
        if (scDs != null)
        {
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM fs_schedule", cancellationToken);
            var rows = scDs.Rows
                .Select(r => new FSScheduleEntry
                {
                    GlHead   = Str(r, "GL_HEAD"),
                    AcctCode = Str(r, "ACCT_CODE"),
                    AcctDesc = Str(r, "ACCT_DESC")
                })
                .Where(e => !string.IsNullOrWhiteSpace(e.GlHead)).ToList();
            _db.FSScheduleEntries.AddRange(rows);
            await _db.SaveChangesAsync(cancellationToken);
            seeded["fs_schedule"] = rows.Count;
        }

        return seeded;
    }
}
