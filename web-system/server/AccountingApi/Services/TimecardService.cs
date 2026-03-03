using System.Data;
using Microsoft.EntityFrameworkCore;
using AccountingApi.Data;

namespace AccountingApi.Services;

public sealed class TimecardService
{
    private readonly AccountingDbContext _context;

    public TimecardService(AccountingDbContext context)
    {
        _context = context;
    }

    public async Task<List<Dictionary<string, object?>>> GetTimecardsAsync(int year, int month, CancellationToken cancellationToken = default)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);

        var sql = @"
            SELECT t.*, m.emp_nm, m.dep_no 
            FROM pay_tmcard t
            LEFT JOIN pay_master m ON t.emp_no = m.emp_no
            WHERE t.period_year = @year AND t.period_month = @month
            ORDER BY t.emp_no";

        using var command = connection.CreateCommand();
        command.CommandText = sql;

        var yearParam = command.CreateParameter();
        yearParam.ParameterName = "@year";
        yearParam.Value = year;
        command.Parameters.Add(yearParam);

        var monthParam = command.CreateParameter();
        monthParam.ParameterName = "@month";
        monthParam.Value = month;
        command.Parameters.Add(monthParam);

        var timecards = new List<Dictionary<string, object?>>();
        using var reader = await command.ExecuteReaderAsync(cancellationToken);
        
        while (await reader.ReadAsync(cancellationToken))
        {
            var timecard = new Dictionary<string, object?>();
            for (int i = 0; i < reader.FieldCount; i++)
            {
                timecard[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            }
            timecards.Add(timecard);
        }

        return timecards;
    }

    public async Task<Dictionary<string, object?>?> GetTimecardAsync(string empNo, int year, int month, CancellationToken cancellationToken = default)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);

        var sql = @"
            SELECT t.*, m.emp_nm, m.dep_no 
            FROM pay_tmcard t
            LEFT JOIN pay_master m ON t.emp_no = m.emp_no
            WHERE t.emp_no = @emp_no AND t.period_year = @year AND t.period_month = @month";

        using var command = connection.CreateCommand();
        command.CommandText = sql;

        AddParameter(command, "@emp_no", empNo);
        AddParameter(command, "@year", year);
        AddParameter(command, "@month", month);

        using var reader = await command.ExecuteReaderAsync(cancellationToken);
        
        if (await reader.ReadAsync(cancellationToken))
        {
            var timecard = new Dictionary<string, object?>();
            for (int i = 0; i < reader.FieldCount; i++)
            {
                timecard[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            }
            return timecard;
        }

        return null;
    }

    public async Task<(bool success, string message)> UpsertTimecardAsync(Dictionary<string, object?> timecard, CancellationToken cancellationToken = default)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);

        var empNo = GetStringValue(timecard.GetValueOrDefault("emp_no", ""));
        var year = GetIntValue(timecard.GetValueOrDefault("period_year", DateTime.Now.Year), DateTime.Now.Year);
        var month = GetIntValue(timecard.GetValueOrDefault("period_month", DateTime.Now.Month), DateTime.Now.Month);

        // Check if exists
        var checkSql = "SELECT COUNT(*) FROM pay_tmcard WHERE emp_no = @emp_no AND period_year = @year AND period_month = @month";
        using var checkCmd = connection.CreateCommand();
        checkCmd.CommandText = checkSql;
        AddParameter(checkCmd, "@emp_no", empNo);
        AddParameter(checkCmd, "@year", year);
        AddParameter(checkCmd, "@month", month);

        var exists = Convert.ToInt32(await checkCmd.ExecuteScalarAsync(cancellationToken)) > 0;

        string sql;
        if (exists)
        {
            sql = @"
                UPDATE pay_tmcard SET
                    emp_nm = @emp_nm, dep_no = @dep_no,
                    reg_hrs = @reg_hrs, abs_hrs = @abs_hrs, rot_hrs = @rot_hrs,
                    sphp_hrs = @sphp_hrs, spot_hrs = @spot_hrs, lghp_hrs = @lghp_hrs,
                    lgot_hrs = @lgot_hrs, nsd_hrs = @nsd_hrs,
                    lv_hrs = @lv_hrs, ls_hrs = @ls_hrs,
                    oth_pay1 = @oth_pay1, oth_pay2 = @oth_pay2, oth_pay3 = @oth_pay3, oth_pay4 = @oth_pay4,
                    lv_cashout = @lv_cashout, ls_cashout = @ls_cashout,
                    sln_ded = @sln_ded, hdmf_ded = @hdmf_ded, cal_ded = @cal_ded,
                    comp_ded = @comp_ded, comd_ded = @comd_ded,
                    oth_ded1 = @oth_ded1, oth_ded2 = @oth_ded2, oth_ded3 = @oth_ded3,
                    oth_ded4 = @oth_ded4, oth_ded5 = @oth_ded5, oth_ded6 = @oth_ded6,
                    oth_ded7 = @oth_ded7, oth_ded8 = @oth_ded8, oth_ded9 = @oth_ded9, oth_ded10 = @oth_ded10,
                    tax_add = @tax_add, withbonus = @withbonus,
                    trn_flag = 'U',
                    updated_at = datetime('now')
                WHERE emp_no = @emp_no AND period_year = @year AND period_month = @month";
        }
        else
        {
            sql = @"
                INSERT INTO pay_tmcard (
                    emp_no, emp_nm, dep_no, period_year, period_month,
                    reg_hrs, abs_hrs, rot_hrs, sphp_hrs, spot_hrs, lghp_hrs, lgot_hrs, nsd_hrs,
                    lv_hrs, ls_hrs, oth_pay1, oth_pay2, oth_pay3, oth_pay4,
                    lv_cashout, ls_cashout,
                    sln_ded, hdmf_ded, cal_ded, comp_ded, comd_ded,
                    oth_ded1, oth_ded2, oth_ded3, oth_ded4, oth_ded5,
                    oth_ded6, oth_ded7, oth_ded8, oth_ded9, oth_ded10,
                    tax_add, withbonus,
                    reg_pay, rot_pay, sphp_pay, spot_pay, lghp_pay, lgot_pay, nsd_pay,
                    lv_pay, lv2_pay, ls_pay, grs_pay, abs_ded,
                    sss_ee, sss_er, med_ee, med_er, pgbg_ee, pgbg_er, ec_er, tax_ee,
                    tot_ded, net_pay, bonus, bonustax,
                    trn_flag, created_at, updated_at
                ) VALUES (
                    @emp_no, @emp_nm, @dep_no, @year, @month,
                    @reg_hrs, @abs_hrs, @rot_hrs, @sphp_hrs, @spot_hrs, @lghp_hrs, @lgot_hrs, @nsd_hrs,
                    @lv_hrs, @ls_hrs, @oth_pay1, @oth_pay2, @oth_pay3, @oth_pay4,
                    @lv_cashout, @ls_cashout,
                    @sln_ded, @hdmf_ded, @cal_ded, @comp_ded, @comd_ded,
                    @oth_ded1, @oth_ded2, @oth_ded3, @oth_ded4, @oth_ded5,
                    @oth_ded6, @oth_ded7, @oth_ded8, @oth_ded9, @oth_ded10,
                    @tax_add, @withbonus,
                    @reg_pay, @rot_pay, @sphp_pay, @spot_pay, @lghp_pay, @lgot_pay, @nsd_pay,
                    @lv_pay, @lv2_pay, @ls_pay, @grs_pay, @abs_ded,
                    @sss_ee, @sss_er, @med_ee, @med_er, @pgbg_ee, @pgbg_er, @ec_er, @tax_ee,
                    @tot_ded, @net_pay, @bonus, @bonustax,
                    'U', datetime('now'), datetime('now')
                )";
        }

        using var command = connection.CreateCommand();
        command.CommandText = sql;

        AddTimecardParameters(command, timecard);

        await command.ExecuteNonQueryAsync(cancellationToken);
        return (true, exists ? "Timecard updated successfully" : "Timecard created successfully");
    }

    public async Task<(bool success, string message)> DeleteTimecardAsync(string empNo, int year, int month, CancellationToken cancellationToken = default)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);

        var sql = "DELETE FROM pay_tmcard WHERE emp_no = @emp_no AND period_year = @year AND period_month = @month";

        using var command = connection.CreateCommand();
        command.CommandText = sql;
        
        AddParameter(command, "@emp_no", empNo);
        AddParameter(command, "@year", year);
        AddParameter(command, "@month", month);

        var rowsAffected = await command.ExecuteNonQueryAsync(cancellationToken);
        
        if (rowsAffected == 0)
        {
            return (false, "Timecard not found");
        }

        return (true, "Timecard deleted successfully");
    }

    private void AddTimecardParameters(IDbCommand command, Dictionary<string, object?> timecard)
    {
        AddParameter(command, "@emp_no", timecard.GetValueOrDefault("emp_no", ""));
        AddParameter(command, "@emp_nm", timecard.GetValueOrDefault("emp_nm", string.Empty));
        AddParameter(command, "@dep_no", timecard.GetValueOrDefault("dep_no", string.Empty));
        AddParameter(command, "@year", timecard.GetValueOrDefault("period_year", DateTime.Now.Year));
        AddParameter(command, "@month", timecard.GetValueOrDefault("period_month", DateTime.Now.Month));
        
        // Hours
        AddParameter(command, "@reg_hrs", timecard.GetValueOrDefault("reg_hrs", 0m));
        AddParameter(command, "@abs_hrs", timecard.GetValueOrDefault("abs_hrs", 0m));
        AddParameter(command, "@rot_hrs", timecard.GetValueOrDefault("rot_hrs", 0m));
        AddParameter(command, "@sphp_hrs", timecard.GetValueOrDefault("sphp_hrs", 0m));
        AddParameter(command, "@spot_hrs", timecard.GetValueOrDefault("spot_hrs", 0m));
        AddParameter(command, "@lghp_hrs", timecard.GetValueOrDefault("lghp_hrs", 0m));
        AddParameter(command, "@lgot_hrs", timecard.GetValueOrDefault("lgot_hrs", 0m));
        AddParameter(command, "@nsd_hrs", timecard.GetValueOrDefault("nsd_hrs", 0m));
        AddParameter(command, "@lv_hrs", timecard.GetValueOrDefault("lv_hrs", 0m));
        AddParameter(command, "@ls_hrs", timecard.GetValueOrDefault("ls_hrs", 0m));
        
        // Other Pays
        AddParameter(command, "@oth_pay1", timecard.GetValueOrDefault("oth_pay1", 0m));
        AddParameter(command, "@oth_pay2", timecard.GetValueOrDefault("oth_pay2", 0m));
        AddParameter(command, "@oth_pay3", timecard.GetValueOrDefault("oth_pay3", 0m));
        AddParameter(command, "@oth_pay4", timecard.GetValueOrDefault("oth_pay4", 0m));
        AddParameter(command, "@lv_cashout", timecard.GetValueOrDefault("lv_cashout", 0m));
        AddParameter(command, "@ls_cashout", timecard.GetValueOrDefault("ls_cashout", 0m));
        
        // Loan Deductions
        AddParameter(command, "@sln_ded", timecard.GetValueOrDefault("sln_ded", 0m));
        AddParameter(command, "@hdmf_ded", timecard.GetValueOrDefault("hdmf_ded", 0m));
        AddParameter(command, "@cal_ded", timecard.GetValueOrDefault("cal_ded", 0m));
        AddParameter(command, "@comp_ded", timecard.GetValueOrDefault("comp_ded", 0m));
        AddParameter(command, "@comd_ded", timecard.GetValueOrDefault("comd_ded", 0m));
        
        // Other Deductions
        AddParameter(command, "@oth_ded1", timecard.GetValueOrDefault("oth_ded1", 0m));
        AddParameter(command, "@oth_ded2", timecard.GetValueOrDefault("oth_ded2", 0m));
        AddParameter(command, "@oth_ded3", timecard.GetValueOrDefault("oth_ded3", 0m));
        AddParameter(command, "@oth_ded4", timecard.GetValueOrDefault("oth_ded4", 0m));
        AddParameter(command, "@oth_ded5", timecard.GetValueOrDefault("oth_ded5", 0m));
        AddParameter(command, "@oth_ded6", timecard.GetValueOrDefault("oth_ded6", 0m));
        AddParameter(command, "@oth_ded7", timecard.GetValueOrDefault("oth_ded7", 0m));
        AddParameter(command, "@oth_ded8", timecard.GetValueOrDefault("oth_ded8", 0m));
        AddParameter(command, "@oth_ded9", timecard.GetValueOrDefault("oth_ded9", 0m));
        AddParameter(command, "@oth_ded10", timecard.GetValueOrDefault("oth_ded10", 0m));
        
        // Tax and Bonus
        AddParameter(command, "@tax_add", timecard.GetValueOrDefault("tax_add", 0m));
        AddParameter(command, "@withbonus", timecard.GetValueOrDefault("withbonus", false));

        // Computed Fields (required by schema, populated by compute process later)
        AddParameter(command, "@reg_pay", timecard.GetValueOrDefault("reg_pay", 0m));
        AddParameter(command, "@rot_pay", timecard.GetValueOrDefault("rot_pay", 0m));
        AddParameter(command, "@sphp_pay", timecard.GetValueOrDefault("sphp_pay", 0m));
        AddParameter(command, "@spot_pay", timecard.GetValueOrDefault("spot_pay", 0m));
        AddParameter(command, "@lghp_pay", timecard.GetValueOrDefault("lghp_pay", 0m));
        AddParameter(command, "@lgot_pay", timecard.GetValueOrDefault("lgot_pay", 0m));
        AddParameter(command, "@nsd_pay", timecard.GetValueOrDefault("nsd_pay", 0m));
        AddParameter(command, "@lv_pay", timecard.GetValueOrDefault("lv_pay", 0m));
        AddParameter(command, "@lv2_pay", timecard.GetValueOrDefault("lv2_pay", 0m));
        AddParameter(command, "@ls_pay", timecard.GetValueOrDefault("ls_pay", 0m));
        AddParameter(command, "@grs_pay", timecard.GetValueOrDefault("grs_pay", 0m));
        AddParameter(command, "@abs_ded", timecard.GetValueOrDefault("abs_ded", 0m));
        AddParameter(command, "@sss_ee", timecard.GetValueOrDefault("sss_ee", 0m));
        AddParameter(command, "@sss_er", timecard.GetValueOrDefault("sss_er", 0m));
        AddParameter(command, "@med_ee", timecard.GetValueOrDefault("med_ee", 0m));
        AddParameter(command, "@med_er", timecard.GetValueOrDefault("med_er", 0m));
        AddParameter(command, "@pgbg_ee", timecard.GetValueOrDefault("pgbg_ee", 0m));
        AddParameter(command, "@pgbg_er", timecard.GetValueOrDefault("pgbg_er", 0m));
        AddParameter(command, "@ec_er", timecard.GetValueOrDefault("ec_er", 0m));
        AddParameter(command, "@tax_ee", timecard.GetValueOrDefault("tax_ee", 0m));
        AddParameter(command, "@tot_ded", timecard.GetValueOrDefault("tot_ded", 0m));
        AddParameter(command, "@net_pay", timecard.GetValueOrDefault("net_pay", 0m));
        AddParameter(command, "@bonus", timecard.GetValueOrDefault("bonus", 0m));
        AddParameter(command, "@bonustax", timecard.GetValueOrDefault("bonustax", 0m));
    }

    private static int GetIntValue(object? value, int fallback)
    {
        if (value is null)
        {
            return fallback;
        }

        if (value is System.Text.Json.JsonElement element)
        {
            if (element.ValueKind == System.Text.Json.JsonValueKind.Number && element.TryGetInt32(out var intValue))
            {
                return intValue;
            }

            if (element.ValueKind == System.Text.Json.JsonValueKind.String && int.TryParse(element.GetString(), out var parsed))
            {
                return parsed;
            }

            return fallback;
        }

        try
        {
            return Convert.ToInt32(value);
        }
        catch
        {
            return fallback;
        }
    }

    private static string GetStringValue(object? value)
    {
        if (value is null)
        {
            return string.Empty;
        }

        if (value is System.Text.Json.JsonElement element)
        {
            return element.ValueKind == System.Text.Json.JsonValueKind.String
                ? element.GetString() ?? string.Empty
                : element.ToString();
        }

        return value.ToString() ?? string.Empty;
    }

    private void AddParameter(IDbCommand command, string name, object? value)
    {
        var param = command.CreateParameter();
        param.ParameterName = name;
        
        if (value == null)
        {
            param.Value = DBNull.Value;
        }
        else if (value is System.Text.Json.JsonElement jsonElement)
        {
            // Convert JsonElement to appropriate type
            param.Value = jsonElement.ValueKind switch
            {
                System.Text.Json.JsonValueKind.Null => DBNull.Value,
                System.Text.Json.JsonValueKind.True => 1,
                System.Text.Json.JsonValueKind.False => 0,
                System.Text.Json.JsonValueKind.Number => jsonElement.TryGetDecimal(out var dec) ? (object)dec : jsonElement.GetDouble(),
                System.Text.Json.JsonValueKind.String => (object?)(jsonElement.GetString() ?? string.Empty),
                _ => jsonElement.GetRawText()
            };
        }
        else if (value is bool b)
        {
            param.Value = b ? 1 : 0;
        }
        else
        {
            param.Value = value;
        }
        
        command.Parameters.Add(param);
    }
}
