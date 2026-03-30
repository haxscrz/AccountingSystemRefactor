namespace AccountingApi.Models;

public sealed class LegacyManifest
{
    public string GeneratedAt { get; init; } = string.Empty;
    public int DatasetCount { get; init; }
    public List<LegacyDatasetEntry> Datasets { get; init; } = [];
}

public sealed class LegacyDatasetEntry
{
    public string Key { get; init; } = string.Empty;
    public string Module { get; init; } = string.Empty;
    public string SourcePath { get; init; } = string.Empty;
    public string OutputFile { get; init; } = string.Empty;
    public int RowCount { get; init; }
    public List<string> Columns { get; init; } = [];
}

public sealed class LegacyDatasetPayload
{
    public string TableName { get; init; } = string.Empty;
    public string SourcePath { get; init; } = string.Empty;
    public int RowCount { get; init; }
    public List<string> Columns { get; init; } = [];
    public List<Dictionary<string, object?>> Rows { get; init; } = [];
}
