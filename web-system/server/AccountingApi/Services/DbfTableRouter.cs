namespace AccountingApi.Services;

/// <summary>
/// Maps raw DBF filenames to their target FS module table names.
/// Knows which files are required, optional, or should be ignored.
/// </summary>
public static class DbfTableRouter
{
    public enum FileClassification { Required, Optional, Ignored }

    public sealed class DbfFileMapping
    {
        public string DbfFileName { get; init; } = "";
        public string? TargetTable { get; init; }
        public string DisplayName { get; init; } = "";
        public FileClassification Classification { get; init; }
        public string? IgnoreReason { get; init; }
    }

    // ── Known DBF → table mappings ─────────────────────────────────────────
    private static readonly Dictionary<string, (string table, string display, FileClassification cls)> KnownFiles
        = new(StringComparer.OrdinalIgnoreCase)
    {
        // Required core files
        ["ACCOUNTS.DBF"] = ("fs_accounts",  "Chart of Accounts",    FileClassification.Required),
        ["CHECKMAS.DBF"] = ("fs_checkmas",  "Check Master",         FileClassification.Required),
        ["CHECKVOU.DBF"] = ("fs_checkvou",  "Check Vouchers",       FileClassification.Required),
        ["EFFECTS.DBF"]  = ("fs_effects",   "GL Effects",           FileClassification.Required),
        ["SCHEDULE.DBF"] = ("fs_schedule",  "GL Schedule",          FileClassification.Required),

        // Optional transaction files
        ["CASHRCPT.DBF"] = ("fs_cashrcpt",  "Cash Receipts",        FileClassification.Optional),
        ["JOURNALS.DBF"] = ("fs_journals",  "Journal Vouchers",     FileClassification.Optional),
        ["POURNALS.DBF"] = ("fs_pournals",  "Posted Journals",      FileClassification.Optional),
        ["SALEBOOK.DBF"] = ("fs_salebook",  "Sales Book",           FileClassification.Optional),
        ["PURCBOOK.DBF"] = ("fs_purcbook",  "Purchase Book",        FileClassification.Optional),
        ["ADJSTMNT.DBF"] = ("fs_adjstmnt",  "Adjustments",          FileClassification.Optional),
        ["BANKS.DBF"]    = ("fs_banks",     "Banks",                FileClassification.Optional),
        ["SUPPLIER.DBF"] = ("fs_supplier",  "Suppliers",            FileClassification.Optional),
        ["MASTFILE.DBF"] = ("pay_master",   "Payroll Master",       FileClassification.Optional),

        // Archive aliases (map to the same tables as primary files)
        ["ACHECKMA.DBF"] = ("fs_checkmas",  "Check Master (Archive)", FileClassification.Optional),
        ["ACHECKVO.DBF"] = ("fs_checkvou",  "Check Vouchers (Archive)", FileClassification.Optional),
    };

    // ── Files to silently ignore ───────────────────────────────────────────
    private static readonly Dictionary<string, string> IgnoredFiles
        = new(StringComparer.OrdinalIgnoreCase)
    {
        ["PATHFILE.DBF"]  = "DOS path configuration (not data)",
        ["ACCTNEW.DBF"]   = "Legacy backup of accounts",
        ["ACCTS.DBF"]     = "Legacy backup of accounts",
        ["MASTFILE.DBF"]  = "Payroll master (handled separately)",
    };

    /// <summary>
    /// Classifies a single file and returns its mapping info.
    /// </summary>
    public static DbfFileMapping ClassifyFile(string fileName)
    {
        var upper = fileName.ToUpperInvariant();

        // Check if it's a known data file
        if (KnownFiles.TryGetValue(fileName, out var mapping))
        {
            return new DbfFileMapping
            {
                DbfFileName = fileName,
                TargetTable = mapping.table,
                DisplayName = mapping.display,
                Classification = mapping.cls
            };
        }

        // Check if it's a known ignored file
        if (IgnoredFiles.TryGetValue(fileName, out var reason))
        {
            return new DbfFileMapping
            {
                DbfFileName = fileName,
                DisplayName = fileName,
                Classification = FileClassification.Ignored,
                IgnoreReason = reason
            };
        }

        // NTX files are always ignored (dBASE index files)
        if (upper.EndsWith(".NTX"))
        {
            return new DbfFileMapping
            {
                DbfFileName = fileName,
                DisplayName = fileName,
                Classification = FileClassification.Ignored,
                IgnoreReason = "dBASE index file (not data)"
            };
        }

        // Any file starting with "OLD " is legacy backup
        if (upper.StartsWith("OLD "))
        {
            return new DbfFileMapping
            {
                DbfFileName = fileName,
                DisplayName = fileName,
                Classification = FileClassification.Ignored,
                IgnoreReason = "Legacy backup file"
            };
        }

        // Non-DBF files (exe, etc.)
        if (!upper.EndsWith(".DBF"))
        {
            return new DbfFileMapping
            {
                DbfFileName = fileName,
                DisplayName = fileName,
                Classification = FileClassification.Ignored,
                IgnoreReason = "Not a data file"
            };
        }

        // Unknown DBF file — flag but ignore
        return new DbfFileMapping
        {
            DbfFileName = fileName,
            DisplayName = fileName,
            Classification = FileClassification.Ignored,
            IgnoreReason = "Unknown DBF file (not mapped to any module)"
        };
    }

    /// <summary>
    /// Classifies all files and returns a full manifest.
    /// </summary>
    public static List<DbfFileMapping> ClassifyAll(IEnumerable<string> fileNames)
    {
        return fileNames.Select(ClassifyFile).ToList();
    }

    /// <summary>
    /// Returns the list of required DBF file names that are missing from the input set.
    /// </summary>
    public static List<string> FindMissingRequired(IEnumerable<string> providedFiles)
    {
        var providedSet = new HashSet<string>(providedFiles, StringComparer.OrdinalIgnoreCase);

        return KnownFiles
            .Where(kv => kv.Value.cls == FileClassification.Required && !providedSet.Contains(kv.Key))
            .Select(kv => kv.Key)
            .ToList();
    }
}
