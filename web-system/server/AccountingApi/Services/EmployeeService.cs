using System.Data;
using Microsoft.EntityFrameworkCore;
using AccountingApi.Data;

namespace AccountingApi.Services;

public sealed class EmployeeService
{
    private readonly AccountingDbContext _context;
    private readonly ICompanyContextAccessor _companyContextAccessor;

    public EmployeeService(AccountingDbContext context, ICompanyContextAccessor companyContextAccessor)
    {
        _context = context;
        _companyContextAccessor = companyContextAccessor;
    }

    public async Task<List<Dictionary<string, object?>>> GetAllEmployeesAsync(CancellationToken cancellationToken = default)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);

        var sql = @"
            SELECT * FROM pay_master 
            WHERE company_code = @company_code
            ORDER BY emp_no";

        using var command = connection.CreateCommand();
        command.CommandText = sql;
        AddParameter(command, "@company_code", _companyContextAccessor.CompanyCode);

        var employees = new List<Dictionary<string, object?>>();
        using var reader = await command.ExecuteReaderAsync(cancellationToken);
        
        while (await reader.ReadAsync(cancellationToken))
        {
            var employee = new Dictionary<string, object?>();
            for (int i = 0; i < reader.FieldCount; i++)
            {
                employee[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            }
            employees.Add(employee);
        }

        return employees;
    }

    public async Task<Dictionary<string, object?>?> GetEmployeeByNumberAsync(string empNo, CancellationToken cancellationToken = default)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);

        var sql = @"
            SELECT * FROM pay_master 
            WHERE company_code = @company_code AND emp_no = @emp_no";

        using var command = connection.CreateCommand();
        command.CommandText = sql;
        
        var empNoParam = command.CreateParameter();
        empNoParam.ParameterName = "@emp_no";
        empNoParam.Value = empNo;
        command.Parameters.Add(empNoParam);
        AddParameter(command, "@company_code", _companyContextAccessor.CompanyCode);

        using var reader = await command.ExecuteReaderAsync(cancellationToken);
        
        if (await reader.ReadAsync(cancellationToken))
        {
            var employee = new Dictionary<string, object?>();
            for (int i = 0; i < reader.FieldCount; i++)
            {
                employee[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            }
            return employee;
        }

        return null;
    }

    public async Task<(bool success, string message)> CreateEmployeeAsync(Dictionary<string, object?> employee, CancellationToken cancellationToken = default)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);

        // Check if employee already exists
        var checkSql = "SELECT COUNT(*) FROM pay_master WHERE company_code = @company_code AND emp_no = @emp_no";
        using var checkCmd = connection.CreateCommand();
        checkCmd.CommandText = checkSql;
        AddParameter(checkCmd, "@company_code", _companyContextAccessor.CompanyCode);
        AddParameter(checkCmd, "@emp_no", employee.GetValueOrDefault("emp_no", ""));

        var count = Convert.ToInt32(await checkCmd.ExecuteScalarAsync(cancellationToken));
        if (count > 0)
        {
            return (false, "Employee number already exists");
        }

        var sql = @"
            INSERT INTO pay_master (
                  company_code,
                 emp_no, emp_nm, dep_no, position, b_rate, cola, emp_stat, status,
                 date_hire, date_resign, sss_no, tin_no, phic_no, pgbg_no, 
                 sss_member, pgbg,
                 sln_bal, sln_amt, sln_term, sln_date,
                 hdmf_bal, hdmf_amt, hdmf_term, hdmf_date,
                 cal_bal, cal_amt, cal_term, cal_date,
                 comp_bal, comp_amt, comp_term, comp_date,
                 comd_bal, comd_amt, comd_term, comd_date,
                 m_basic, m_cola, m_hol, m_ot, m_leave, m_gross, m_ssee, m_sser,
                 m_medee, m_meder, m_pgee, m_pger, m_ecer, m_tax, m_othp1, m_othp2, m_othp3, m_othp4, m_netpay,
                 q1_gross, q1_ssee, q1_medee, q1_pgee, q1_tax,
                 q2_gross, q2_ssee, q2_medee, q2_pgee, q2_tax,
                 q3_gross, q3_ssee, q3_medee, q3_pgee, q3_tax,
                 y_basic, y_cola, y_hol, y_ot, y_leave, y_gross, y_ssee, y_sser,
                 y_medee, y_meder, y_pgee, y_pger, y_ecer, y_tax, y_othp1, y_othp2, y_othp3, y_othp4, y_bonus, y_btax, y_netpay,
                 sick_leave, vacation_leave,
                 spouse, address, birthdate,
                 created_at, updated_at
            ) VALUES (
                  @company_code,
                 @emp_no, @emp_nm, @dep_no, @position, @b_rate, @cola, @emp_stat, @status,
                 @date_hire, @date_resign, @sss_no, @tin_no, @phic_no, @pgbg_no,
                 @sss_member, @pgbg,
                 @sln_bal, @sln_amt, @sln_term, @sln_date,
                 @hdmf_bal, @hdmf_amt, @hdmf_term, @hdmf_date,
                 @cal_bal, @cal_amt, @cal_term, @cal_date,
                 @comp_bal, @comp_amt, @comp_term, @comp_date,
                 @comd_bal, @comd_amt, @comd_term, @comd_date,
                 @m_basic, @m_cola, @m_hol, @m_ot, @m_leave, @m_gross, @m_ssee, @m_sser,
                 @m_medee, @m_meder, @m_pgee, @m_pger, @m_ecer, @m_tax, @m_othp1, @m_othp2, @m_othp3, @m_othp4, @m_netpay,
                 @q1_gross, @q1_ssee, @q1_medee, @q1_pgee, @q1_tax,
                 @q2_gross, @q2_ssee, @q2_medee, @q2_pgee, @q2_tax,
                 @q3_gross, @q3_ssee, @q3_medee, @q3_pgee, @q3_tax,
                 @y_basic, @y_cola, @y_hol, @y_ot, @y_leave, @y_gross, @y_ssee, @y_sser,
                 @y_medee, @y_meder, @y_pgee, @y_pger, @y_ecer, @y_tax, @y_othp1, @y_othp2, @y_othp3, @y_othp4, @y_bonus, @y_btax, @y_netpay,
                 @sick_leave, @vacation_leave,
                 @spouse, @address, @birthdate,
                 datetime('now'), datetime('now')
            )";

        using var command = connection.CreateCommand();
        command.CommandText = sql;

        AddParameter(command, "@company_code", _companyContextAccessor.CompanyCode);
        AddEmployeeParameters(command, employee);

        await command.ExecuteNonQueryAsync(cancellationToken);
        return (true, "Employee created successfully");
    }

    public async Task<(bool success, string message)> UpdateEmployeeAsync(string empNo, Dictionary<string, object?> employee, CancellationToken cancellationToken = default)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);

        var sql = @"
            UPDATE pay_master SET
                 emp_nm = @emp_nm, dep_no = @dep_no, position = @position, 
                 b_rate = @b_rate, cola = @cola, emp_stat = @emp_stat, status = @status,
                 date_hire = @date_hire, date_resign = @date_resign,
                 sss_no = @sss_no, tin_no = @tin_no, phic_no = @phic_no, pgbg_no = @pgbg_no,
                 sss_member = @sss_member, pgbg = @pgbg,
                 sln_bal = @sln_bal, sln_amt = @sln_amt, sln_term = @sln_term, sln_date = @sln_date,
                 hdmf_bal = @hdmf_bal, hdmf_amt = @hdmf_amt, hdmf_term = @hdmf_term, hdmf_date = @hdmf_date,
                 cal_bal = @cal_bal, cal_amt = @cal_amt, cal_term = @cal_term, cal_date = @cal_date,
                 comp_bal = @comp_bal, comp_amt = @comp_amt, comp_term = @comp_term, comp_date = @comp_date,
                 comd_bal = @comd_bal, comd_amt = @comd_amt, comd_term = @comd_term, comd_date = @comd_date,
                 m_basic = @m_basic, m_cola = @m_cola, m_hol = @m_hol, m_ot = @m_ot, m_leave = @m_leave, m_gross = @m_gross, m_ssee = @m_ssee, m_sser = @m_sser,
                 m_medee = @m_medee, m_meder = @m_meder, m_pgee = @m_pgee, m_pger = @m_pger, m_ecer = @m_ecer, m_tax = @m_tax, m_othp1 = @m_othp1, m_othp2 = @m_othp2, m_othp3 = @m_othp3, m_othp4 = @m_othp4, m_netpay = @m_netpay,
                 q1_gross = @q1_gross, q1_ssee = @q1_ssee, q1_medee = @q1_medee, q1_pgee = @q1_pgee, q1_tax = @q1_tax,
                 q2_gross = @q2_gross, q2_ssee = @q2_ssee, q2_medee = @q2_medee, q2_pgee = @q2_pgee, q2_tax = @q2_tax,
                 q3_gross = @q3_gross, q3_ssee = @q3_ssee, q3_medee = @q3_medee, q3_pgee = @q3_pgee, q3_tax = @q3_tax,
                 y_basic = @y_basic, y_cola = @y_cola, y_hol = @y_hol, y_ot = @y_ot, y_leave = @y_leave, y_gross = @y_gross, y_ssee = @y_ssee, y_sser = @y_sser,
                 y_medee = @y_medee, y_meder = @y_meder, y_pgee = @y_pgee, y_pger = @y_pger, y_ecer = @y_ecer, y_tax = @y_tax, y_othp1 = @y_othp1, y_othp2 = @y_othp2, y_othp3 = @y_othp3, y_othp4 = @y_othp4, y_bonus = @y_bonus, y_btax = @y_btax, y_netpay = @y_netpay,
                 sick_leave = @sick_leave, vacation_leave = @vacation_leave,
                 spouse = @spouse, address = @address, birthdate = @birthdate,
                 updated_at = datetime('now')
            WHERE company_code = @company_code AND emp_no = @emp_no_filter";

        using var command = connection.CreateCommand();
        command.CommandText = sql;

        AddParameter(command, "@company_code", _companyContextAccessor.CompanyCode);
        AddEmployeeParameters(command, employee);
        
        var filterParam = command.CreateParameter();
        filterParam.ParameterName = "@emp_no_filter";
        filterParam.Value = empNo;
        command.Parameters.Add(filterParam);

        var rowsAffected = await command.ExecuteNonQueryAsync(cancellationToken);
        
        if (rowsAffected == 0)
        {
            return (false, "Employee not found");
        }

        return (true, "Employee updated successfully");
    }

    public async Task<(bool success, string message)> DeleteEmployeeAsync(string empNo, CancellationToken cancellationToken = default)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);

        var sql = "DELETE FROM pay_master WHERE company_code = @company_code AND emp_no = @emp_no";

        using var command = connection.CreateCommand();
        command.CommandText = sql;
        
        var param = command.CreateParameter();
        param.ParameterName = "@emp_no";
        param.Value = empNo;
        command.Parameters.Add(param);
        AddParameter(command, "@company_code", _companyContextAccessor.CompanyCode);

        var rowsAffected = await command.ExecuteNonQueryAsync(cancellationToken);
        
        if (rowsAffected == 0)
        {
            return (false, "Employee not found");
        }

        return (true, "Employee deleted successfully");
    }

    private void AddEmployeeParameters(IDbCommand command, Dictionary<string, object?> employee)
    {
        AddParameter(command, "@emp_no", employee.GetValueOrDefault("emp_no", ""));
        AddParameter(command, "@emp_nm", employee.GetValueOrDefault("emp_nm", ""));
        AddParameter(command, "@dep_no", employee.GetValueOrDefault("dep_no", null));
        AddParameter(command, "@position", employee.GetValueOrDefault("position", null));
        AddParameter(command, "@b_rate", employee.GetValueOrDefault("b_rate", 0m));
        AddParameter(command, "@cola", employee.GetValueOrDefault("cola", 0m));
        AddParameter(command, "@emp_stat", employee.GetValueOrDefault("emp_stat", "R"));
        AddParameter(command, "@status", employee.GetValueOrDefault("status", null));
        AddParameter(command, "@date_hire", employee.GetValueOrDefault("date_hire", null));
        AddParameter(command, "@date_resign", employee.GetValueOrDefault("date_resign", null));
        
        // Government IDs
        AddParameter(command, "@sss_no", employee.GetValueOrDefault("sss_no", null));
        AddParameter(command, "@tin_no", employee.GetValueOrDefault("tin_no", null));
        AddParameter(command, "@phic_no", employee.GetValueOrDefault("phic_no", null));
        AddParameter(command, "@pgbg_no", employee.GetValueOrDefault("pgbg_no", null));
        AddParameter(command, "@sss_member", employee.GetValueOrDefault("sss_member", true));
        AddParameter(command, "@pgbg", employee.GetValueOrDefault("pgbg", false));
        
        // Salary Loan
        AddParameter(command, "@sln_bal", employee.GetValueOrDefault("sln_bal", 0m));
        AddParameter(command, "@sln_amt", employee.GetValueOrDefault("sln_amt", 0m));
        AddParameter(command, "@sln_term", employee.GetValueOrDefault("sln_term", 0));
        AddParameter(command, "@sln_date", employee.GetValueOrDefault("sln_date", null));
        
        // HDMF Loan
        AddParameter(command, "@hdmf_bal", employee.GetValueOrDefault("hdmf_bal", 0m));
        AddParameter(command, "@hdmf_amt", employee.GetValueOrDefault("hdmf_amt", 0m));
        AddParameter(command, "@hdmf_term", employee.GetValueOrDefault("hdmf_term", 0));
        AddParameter(command, "@hdmf_date", employee.GetValueOrDefault("hdmf_date", null));
        
        // SSS Calamity Loan
        AddParameter(command, "@cal_bal", employee.GetValueOrDefault("cal_bal", 0m));
        AddParameter(command, "@cal_amt", employee.GetValueOrDefault("cal_amt", 0m));
        AddParameter(command, "@cal_term", employee.GetValueOrDefault("cal_term", 0));
        AddParameter(command, "@cal_date", employee.GetValueOrDefault("cal_date", null));
        
        // Company Loan
        AddParameter(command, "@comp_bal", employee.GetValueOrDefault("comp_bal", 0m));
        AddParameter(command, "@comp_amt", employee.GetValueOrDefault("comp_amt", 0m));
        AddParameter(command, "@comp_term", employee.GetValueOrDefault("comp_term", 0));
        AddParameter(command, "@comp_date", employee.GetValueOrDefault("comp_date", null));
        
        // Company Deduction Loan
        AddParameter(command, "@comd_bal", employee.GetValueOrDefault("comd_bal", 0m));
        AddParameter(command, "@comd_amt", employee.GetValueOrDefault("comd_amt", 0m));
        AddParameter(command, "@comd_term", employee.GetValueOrDefault("comd_term", 0));
        AddParameter(command, "@comd_date", employee.GetValueOrDefault("comd_date", null));
        
        // Leave Credits
        AddParameter(command, "@sick_leave", employee.GetValueOrDefault("sick_leave", 0m));
        AddParameter(command, "@vacation_leave", employee.GetValueOrDefault("vacation_leave", 0m));
        
        // Monthly Counters
        AddParameter(command, "@m_basic", employee.GetValueOrDefault("m_basic", 0m));
        AddParameter(command, "@m_cola", employee.GetValueOrDefault("m_cola", 0m));
        AddParameter(command, "@m_hol", employee.GetValueOrDefault("m_hol", 0m));
        AddParameter(command, "@m_ot", employee.GetValueOrDefault("m_ot", 0m));
        AddParameter(command, "@m_leave", employee.GetValueOrDefault("m_leave", 0m));
        AddParameter(command, "@m_gross", employee.GetValueOrDefault("m_gross", 0m));
        AddParameter(command, "@m_ssee", employee.GetValueOrDefault("m_ssee", 0m));
        AddParameter(command, "@m_sser", employee.GetValueOrDefault("m_sser", 0m));
        AddParameter(command, "@m_medee", employee.GetValueOrDefault("m_medee", 0m));
        AddParameter(command, "@m_meder", employee.GetValueOrDefault("m_meder", 0m));
        AddParameter(command, "@m_pgee", employee.GetValueOrDefault("m_pgee", 0m));
        AddParameter(command, "@m_pger", employee.GetValueOrDefault("m_pger", 0m));
        AddParameter(command, "@m_ecer", employee.GetValueOrDefault("m_ecer", 0m));
        AddParameter(command, "@m_tax", employee.GetValueOrDefault("m_tax", 0m));
        AddParameter(command, "@m_othp1", employee.GetValueOrDefault("m_othp1", 0m));
        AddParameter(command, "@m_othp2", employee.GetValueOrDefault("m_othp2", 0m));
        AddParameter(command, "@m_othp3", employee.GetValueOrDefault("m_othp3", 0m));
        AddParameter(command, "@m_othp4", employee.GetValueOrDefault("m_othp4", 0m));
        AddParameter(command, "@m_netpay", employee.GetValueOrDefault("m_netpay", 0m));
        
        // Quarterly Counters
        AddParameter(command, "@q1_gross", employee.GetValueOrDefault("q1_gross", 0m));
        AddParameter(command, "@q1_ssee", employee.GetValueOrDefault("q1_ssee", 0m));
        AddParameter(command, "@q1_medee", employee.GetValueOrDefault("q1_medee", 0m));
        AddParameter(command, "@q1_pgee", employee.GetValueOrDefault("q1_pgee", 0m));
        AddParameter(command, "@q1_tax", employee.GetValueOrDefault("q1_tax", 0m));
        AddParameter(command, "@q2_gross", employee.GetValueOrDefault("q2_gross", 0m));
        AddParameter(command, "@q2_ssee", employee.GetValueOrDefault("q2_ssee", 0m));
        AddParameter(command, "@q2_medee", employee.GetValueOrDefault("q2_medee", 0m));
        AddParameter(command, "@q2_pgee", employee.GetValueOrDefault("q2_pgee", 0m));
        AddParameter(command, "@q2_tax", employee.GetValueOrDefault("q2_tax", 0m));
        AddParameter(command, "@q3_gross", employee.GetValueOrDefault("q3_gross", 0m));
        AddParameter(command, "@q3_ssee", employee.GetValueOrDefault("q3_ssee", 0m));
        AddParameter(command, "@q3_medee", employee.GetValueOrDefault("q3_medee", 0m));
        AddParameter(command, "@q3_pgee", employee.GetValueOrDefault("q3_pgee", 0m));
        AddParameter(command, "@q3_tax", employee.GetValueOrDefault("q3_tax", 0m));
        
        // Yearly Counters
        AddParameter(command, "@y_basic", employee.GetValueOrDefault("y_basic", 0m));
        AddParameter(command, "@y_cola", employee.GetValueOrDefault("y_cola", 0m));
        AddParameter(command, "@y_hol", employee.GetValueOrDefault("y_hol", 0m));
        AddParameter(command, "@y_ot", employee.GetValueOrDefault("y_ot", 0m));
        AddParameter(command, "@y_leave", employee.GetValueOrDefault("y_leave", 0m));
        AddParameter(command, "@y_gross", employee.GetValueOrDefault("y_gross", 0m));
        AddParameter(command, "@y_ssee", employee.GetValueOrDefault("y_ssee", 0m));
        AddParameter(command, "@y_sser", employee.GetValueOrDefault("y_sser", 0m));
        AddParameter(command, "@y_medee", employee.GetValueOrDefault("y_medee", 0m));
        AddParameter(command, "@y_meder", employee.GetValueOrDefault("y_meder", 0m));
        AddParameter(command, "@y_pgee", employee.GetValueOrDefault("y_pgee", 0m));
        AddParameter(command, "@y_pger", employee.GetValueOrDefault("y_pger", 0m));
        AddParameter(command, "@y_ecer", employee.GetValueOrDefault("y_ecer", 0m));
        AddParameter(command, "@y_tax", employee.GetValueOrDefault("y_tax", 0m));
        AddParameter(command, "@y_othp1", employee.GetValueOrDefault("y_othp1", 0m));
        AddParameter(command, "@y_othp2", employee.GetValueOrDefault("y_othp2", 0m));
        AddParameter(command, "@y_othp3", employee.GetValueOrDefault("y_othp3", 0m));
        AddParameter(command, "@y_othp4", employee.GetValueOrDefault("y_othp4", 0m));
        AddParameter(command, "@y_bonus", employee.GetValueOrDefault("y_bonus", 0m));
        AddParameter(command, "@y_btax", employee.GetValueOrDefault("y_btax", 0m));
        AddParameter(command, "@y_netpay", employee.GetValueOrDefault("y_netpay", 0m));
        
        // Personal Info
        AddParameter(command, "@spouse", employee.GetValueOrDefault("spouse", null));
        AddParameter(command, "@address", employee.GetValueOrDefault("address", null));
        AddParameter(command, "@birthdate", employee.GetValueOrDefault("birthdate", null));
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
