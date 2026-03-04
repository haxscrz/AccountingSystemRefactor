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

        // ── pay_sys_id ────────────────────────────────────────────────────────
        var sysDs = await _legacyData.GetDatasetByKeyAsync("pay_sys_id", cancellationToken);
        if (sysDs != null && sysDs.Rows.Count > 0)
        {
            var r       = sysDs.Rows[0];
            var existing = await _db.PaySysId.FirstOrDefaultAsync(cancellationToken);
            if (existing is null)
            {
                existing = new PaySysId();
                _db.PaySysId.Add(existing);
            }
            existing.PresMo    = (int)Dec(r, "PRES_MO");
            existing.PresYr    = now.Year;
            existing.PayType   = (int)Dec(r, "PAY_TYPE");
            existing.TrnCtr    = (int)Dec(r, "TRN_CTR");
            existing.TrnPrc    = (int)Dec(r, "TRN_PRC");
            existing.TrnUpd    = (int)Dec(r, "TRN_UPD");
            existing.HdmfPre   = Dec(r, "HDMF_PRE");
            existing.NeedBackup = Bool(r, "NEEDBACKUP");
            existing.WorkHours  = (int)Dec(r, "WORKHOURS");
            existing.PgLower   = Dec(r, "PG_LOWER");
            existing.PgHigher  = Dec(r, "PG_HIGHER");
            existing.PgLwper   = Dec(r, "PG_LWPER");
            existing.PgHiper   = Dec(r, "PG_HIPER");
            existing.BonDays   = (int)Dec(r, "BON_DAYS");
            existing.BonMont   = Dec(r, "BON_MONT");
            if (DateTime.TryParse(Str(r, "BEG_DATE"), out var bd)) existing.BegDate = bd;
            if (DateTime.TryParse(Str(r, "END_DATE"), out var ed)) existing.EndDate = ed;
            existing.UpdatedAt = now;
            await _db.SaveChangesAsync(cancellationToken);
            seeded["pay_sys_id"] = 1;
        }

        // ── pay_master ────────────────────────────────────────────────────────
        // Prefer pay_master (MASTER.DBF) which has 286 active employees.
        var pmDs = await _legacyData.GetDatasetByKeyAsync("pay_master", cancellationToken)
                ?? await _legacyData.GetDatasetByKeyAsync("pay_mastfile", cancellationToken);
        if (pmDs != null && pmDs.Rows.Count > 0)
        {
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM pay_master", cancellationToken);
            var rows = pmDs.Rows
                .Select(r => new PayMaster
                {
                    EmpNo           = Str(r, "EMP_NO"),
                    EmpNm           = Str(r, "EMP_NM"),
                    DepNo           = Str(r, "DEP_NO"),
                    BRate           = Dec(r, "B_RATE"),
                    Cola            = Dec(r, "COLA"),
                    EmpStat         = Str(r, "EMP_TYPE") is "C" ? "C" : "R",
                    Status          = Str(r, "EMP_STAT"),
                    SssNo           = Str(r, "SSS"),
                    TinNo           = Str(r, "TAN"),
                    PhicNo          = Str(r, "PHIC"),
                    PgbgNo          = Str(r, "PGBG_NO"),
                    SssMember       = Bool(r, "SSS_MEMBER"),
                    Pgbg            = Bool(r, "PGBG"),
                    VacationLeave   = Dec(r, "VAC_LV"),
                    SickLeave       = Dec(r, "SIK_LV"),
                    SlnBal          = Dec(r, "SLN_BAL"),
                    SlnAmt          = Dec(r, "SLN_AMT"),
                    SlnTerm         = (int)Dec(r, "SLN_TRM"),
                    SlnDate         = Dt(r, "L_DATE", now),
                    HdmfBal         = Dec(r, "HLN_BAL"),
                    HdmfAmt         = Dec(r, "HLN_AMT"),
                    HdmfTerm        = (int)Dec(r, "HLN_TRM"),
                    HdmfDate        = Dt(r, "HLN_DTE", now),
                    CalBal          = Dec(r, "SS_CAL_BAL"),
                    CalAmt          = Dec(r, "SS_CAL_LN"),
                    CalTerm         = (int)Dec(r, "SS_CAL_TRM"),
                    CalDate         = Dt(r, "SS_CAL_DTE", now),
                    CompBal         = Dec(r, "CO_LN_BAL"),
                    CompAmt         = Dec(r, "CO_LN"),
                    CompTerm        = (int)Dec(r, "CO_LN_TRM"),
                    CompDate        = Dt(r, "CO_LN_DTE", now),
                    ComdBal         = Dec(r, "COM_LN_BAL"),
                    ComdAmt         = Dec(r, "COM_LN"),
                    ComdTerm        = (int)Dec(r, "COM_LN_TRM"),
                    ComdDate        = Dt(r, "COM_LN_DTE", now),
                    MBasic          = Dec(r, "M_BASIC"),
                    MCola           = 0m,
                    MHol            = Dec(r, "M_HOL"),
                    MOt             = Dec(r, "M_OT"),
                    MLeave          = Dec(r, "M_LEAVE"),
                    MGross          = Dec(r, "M_GROSS"),
                    MSsee           = Dec(r, "M_SSEE"),
                    MSser           = Dec(r, "M_SSER"),
                    MMedee          = Dec(r, "M_MEDEE"),
                    MMeder          = Dec(r, "M_MEDER"),
                    MPgee           = Dec(r, "M_PGEE"),
                    MPger           = Dec(r, "M_PGER"),
                    MEcer           = Dec(r, "M_ECER"),
                    MTax            = Dec(r, "M_TAX"),
                    MOthp1          = Dec(r, "M_OTHP1"),
                    MOthp2          = Dec(r, "M_OTHP2"),
                    MOthp3          = Dec(r, "M_OTHP3"),
                    MOthp4          = Dec(r, "M_OTHP4"),
                    MNetpay         = Dec(r, "M_NETPAY"),
                    YBasic          = Dec(r, "Y_BASIC"),
                    YCola           = 0m,
                    YHol            = Dec(r, "Y_HOL"),
                    YOt             = Dec(r, "Y_OT"),
                    YLeave          = Dec(r, "Y_LEAVE"),
                    YGross          = Dec(r, "Y_GROSS"),
                    YSsee           = 0m,
                    YSser           = 0m,
                    YMedee          = 0m,
                    YMeder          = 0m,
                    YPgee           = 0m,
                    YPger           = 0m,
                    YEcer           = 0m,
                    YTax            = Dec(r, "Y_TAX"),
                    YOthp1          = Dec(r, "Y_OTHP1"),
                    YOthp2          = Dec(r, "Y_OTHP2"),
                    YOthp3          = Dec(r, "Y_OTHP3"),
                    YOthp4          = Dec(r, "Y_OTHP4"),
                    YBonus          = Dec(r, "Y_BONUS"),
                    YBtax           = Dec(r, "Y_BTAX"),
                    YNetpay         = Dec(r, "Y_NETPAY"),
                    CreatedAt       = now,
                    UpdatedAt       = now
                })
                .Where(e => !string.IsNullOrWhiteSpace(e.EmpNo))
                .ToList();
            _db.PayMaster.AddRange(rows);
            await _db.SaveChangesAsync(cancellationToken);
            seeded["pay_master"] = rows.Count;
        }

        return seeded;
    }
}
