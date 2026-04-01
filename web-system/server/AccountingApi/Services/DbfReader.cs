using System.Globalization;
using System.Text;

namespace AccountingApi.Services;

/// <summary>
/// Pure C# dBASE III / dBASE IV binary reader.
/// Outputs rows as Dictionary&lt;string, object?&gt; — the same shape that
/// LegacySeedingService already consumes.
/// </summary>
public static class DbfReader
{
    public sealed class DbfResult
    {
        public string FileName { get; init; } = "";
        public int RecordCount { get; init; }
        public List<string> Columns { get; init; } = new();
        public List<Dictionary<string, object?>> Rows { get; init; } = new();
    }

    private sealed class FieldDescriptor
    {
        public string Name { get; set; } = "";
        public char Type { get; set; }    // C=Character, N=Numeric, D=Date, L=Logical, F=Float, M=Memo
        public int Length { get; set; }
        public int DecimalCount { get; set; }
    }

    /// <summary>
    /// Reads a dBASE III/IV .DBF file from a stream and returns structured row data.
    /// </summary>
    public static async Task<DbfResult> ReadAsync(Stream stream, string fileName, CancellationToken ct = default)
    {
        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms, ct);
        ms.Position = 0;

        using var reader = new BinaryReader(ms, Encoding.ASCII);

        // ── Header (32 bytes) ──────────────────────────────────────────────
        var version = reader.ReadByte();         // byte 0
        var yearByte = reader.ReadByte();        // byte 1
        var monthByte = reader.ReadByte();       // byte 2
        var dayByte = reader.ReadByte();         // byte 3
        var recordCount = reader.ReadInt32();     // bytes 4-7 (little-endian)
        var headerSize = reader.ReadInt16();      // bytes 8-9
        var recordSize = reader.ReadInt16();      // bytes 10-11
        reader.ReadBytes(20);                     // bytes 12-31 (reserved)

        // ── Field Descriptors (32 bytes each, terminated by 0x0D) ──────────
        var fields = new List<FieldDescriptor>();

        // Read field descriptors until we hit the 0x0D terminator
        while (ms.Position < headerSize - 1)
        {
            var peekByte = reader.ReadByte();
            if (peekByte == 0x0D) break; // header terminator

            // We already read byte 0 of the field name, read remaining 10
            var restNameBytes = reader.ReadBytes(10);
            var nameBytes = new byte[11];
            nameBytes[0] = peekByte;
            Array.Copy(restNameBytes, 0, nameBytes, 1, 10);

            // Clean field name: strip null bytes and non-printable characters
            var name = Encoding.ASCII.GetString(nameBytes);
            var cleanName = new string(name.Where(c => c > 31 && c < 127 && c != '\0').ToArray()).Trim();

            if (string.IsNullOrEmpty(cleanName))
            {
                reader.ReadBytes(21); // skip rest of descriptor
                continue;
            }

            var type = (char)reader.ReadByte();        // byte 11
            reader.ReadBytes(4);                        // bytes 12-15 (reserved)
            var length = reader.ReadByte();             // byte 16
            var decimalCount = reader.ReadByte();       // byte 17
            reader.ReadBytes(14);                       // bytes 18-31 (reserved)

            fields.Add(new FieldDescriptor
            {
                Name = cleanName.ToUpperInvariant(),
                Type = type,
                Length = length,
                DecimalCount = decimalCount
            });
        }

        // Ensure we're positioned right at the start of records
        ms.Position = headerSize;

        // ── Records ────────────────────────────────────────────────────────
        var rows = new List<Dictionary<string, object?>>();

        for (int r = 0; r < recordCount; r++)
        {
            if (ms.Position >= ms.Length) break;

            var deletionFlag = reader.ReadByte(); // 0x20 = active, 0x2A (*) = deleted

            var row = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);

            foreach (var field in fields)
            {
                if (ms.Position + field.Length > ms.Length)
                    break;

                var rawBytes = reader.ReadBytes(field.Length);
                var rawValue = Encoding.ASCII.GetString(rawBytes).Trim();

                row[field.Name] = field.Type switch
                {
                    'C' => rawValue,                                                          // Character
                    'N' or 'F' => ParseNumeric(rawValue, field.DecimalCount),                 // Numeric / Float
                    'D' => ParseDate(rawValue),                                               // Date (YYYYMMDD)
                    'L' => rawValue is "T" or "t" or "Y" or "y" or "1",                      // Logical
                    'M' => rawValue,                                                          // Memo (just store as string)
                    _ => rawValue
                };
            }

            // Skip deleted records
            if (deletionFlag == 0x2A)
                continue;

            rows.Add(row);
        }

        return new DbfResult
        {
            FileName = fileName,
            RecordCount = rows.Count,
            Columns = fields.Select(f => f.Name).ToList(),
            Rows = rows
        };
    }

    private static object? ParseNumeric(string raw, int decimalCount)
    {
        if (string.IsNullOrWhiteSpace(raw)) return 0m;
        if (decimal.TryParse(raw, NumberStyles.Any, CultureInfo.InvariantCulture, out var d))
            return d;
        return 0m;
    }

    private static object? ParseDate(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw) || raw.Length < 8) return null;
        // dBASE date format: YYYYMMDD
        if (DateTime.TryParseExact(raw[..8], "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
            return dt.ToString("yyyy-MM-dd");
        return null;
    }
}
