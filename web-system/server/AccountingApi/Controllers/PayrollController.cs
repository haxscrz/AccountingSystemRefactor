using AccountingApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace AccountingApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class PayrollController : ControllerBase
{
    private readonly LegacyDataService _legacyDataService;
    private readonly PayrollComputationService _computationService;
    private readonly EmployeeService _employeeService;
    private readonly TimecardService _timecardService;

    public PayrollController(
        LegacyDataService legacyDataService, 
        PayrollComputationService computationService,
        EmployeeService employeeService,
        TimecardService timecardService)
    {
        _legacyDataService = legacyDataService;
        _computationService = computationService;
        _employeeService = employeeService;
        _timecardService = timecardService;
    }

    [HttpGet("employees")]
    public async Task<IActionResult> GetEmployees(CancellationToken cancellationToken)
    {
        var dataset = await _legacyDataService.GetDatasetByKeyAsync("pay_master", cancellationToken)
                      ?? await _legacyDataService.GetDatasetByKeyAsync("pay_mastfile", cancellationToken);

        if (dataset is null)
        {
            return NotFound(new { message = "Payroll employee dataset not found. Run npm run import:legacy." });
        }

        return Ok(new
        {
            dataset.SourcePath,
            dataset.RowCount,
            Rows = dataset.Rows
        });
    }

    [HttpGet("timecards")]
    public async Task<IActionResult> GetTimecards(CancellationToken cancellationToken)
    {
        var dataset = await _legacyDataService.GetDatasetByKeyAsync("pay_tmcard", cancellationToken)
                      ?? await _legacyDataService.GetDatasetByKeyAsync("pay_history", cancellationToken);

        if (dataset is null)
        {
            return NotFound(new { message = "Payroll timecard dataset not found. Run npm run import:legacy." });
        }

        return Ok(new
        {
            dataset.SourcePath,
            dataset.RowCount,
            Rows = dataset.Rows
        });
    }

    [HttpPost("compute")]
    public async Task<IActionResult> ComputePayroll([FromQuery] bool deductTaxForCasual = false, CancellationToken cancellationToken = default)
    {
        var (success, message, employeesProcessed) = await _computationService.ComputePayrollAsync(deductTaxForCasual, cancellationToken);

        if (!success)
        {
            return BadRequest(new { Error = message });
        }

        return Ok(new
        {
            Success = true,
            Message = message,
            EmployeesProcessed = employeesProcessed,
            ComputedAt = DateTime.UtcNow
        });
    }

    [HttpPost("post-timecard")]
    public async Task<IActionResult> PostTimecard(CancellationToken cancellationToken)
    {
        var (success, message, employeesPosted) = await _computationService.PostTimecardAsync(cancellationToken);

        if (!success)
        {
            return BadRequest(new { Error = message });
        }

        return Ok(new
        {
            Success = true,
            Message = message,
            EmployeesPosted = employeesPosted,
            PostedAt = DateTime.UtcNow
        });
    }

    [HttpGet("reports/{reportType}")]
    public async Task<IActionResult> GetReportPreview(string reportType, CancellationToken cancellationToken)
    {
        string[] preferredKeys = reportType.ToLowerInvariant() switch
        {
            "employee-list" or "personal-info" or "salary-rates" => ["pay_master", "pay_mastfile"],
            "loan-deductions" => ["pay_history", "pay_prempaid"],
            "monthly-contributions" or "quarterly-sss" or "quarterly-pbg" or "phic-remittance" => ["pay_premmast", "pay_ssstable", "pay_phitable"],
            "monthly-tax" or "quarterly-tax" or "tax-recon" or "alpha-list" or "w2" => ["pay_taxtab", "pay_taxdue", "pay_oldtax"],
            _ => ["pay_tmcard", "pay_history", "pay_master"]
        };

        foreach (var key in preferredKeys)
        {
            var dataset = await _legacyDataService.GetDatasetByKeyAsync(key, cancellationToken);
            if (dataset is not null)
            {
                return Ok(new
                {
                    ReportType = reportType,
                    dataset.SourcePath,
                    dataset.RowCount,
                    Columns = dataset.Columns,
                    Rows = dataset.Rows.Take(150).ToList()
                });
            }
        }

        return NotFound(new { message = "No matching dataset found for requested report." });
    }

    [HttpPost("compute-13th-month")]
    public async Task<IActionResult> Compute13thMonthPay([FromQuery] int bonusDays = 0, CancellationToken cancellationToken = default)
    {
        var (success, message, employeesProcessed) = await _computationService.Compute13thMonthPayAsync(bonusDays, cancellationToken);

        if (!success)
        {
            return BadRequest(new { Error = message });
        }

        return Ok(new
        {
            Success = true,
            Message = message,
            EmployeesProcessed = employeesProcessed,
            BonusDaysUsed = bonusDays,
            ComputedAt = DateTime.UtcNow
        });
    }

    // CRUD Operations for Employees
    [HttpGet("employees/all")]
    public async Task<IActionResult> GetAllEmployees(CancellationToken cancellationToken)
    {
        var employees = await _employeeService.GetAllEmployeesAsync(cancellationToken);
        return Ok(employees);
    }

    [HttpGet("employees/{empNo}")]
    public async Task<IActionResult> GetEmployee(string empNo, CancellationToken cancellationToken)
    {
        var employee = await _employeeService.GetEmployeeByNumberAsync(empNo, cancellationToken);
        if (employee == null)
        {
            return NotFound(new { message = "Employee not found" });
        }
        return Ok(employee);
    }

    [HttpPost("employees")]
    public async Task<IActionResult> CreateEmployee([FromBody] Dictionary<string, object?> employee, CancellationToken cancellationToken)
    {
        var (success, message) = await _employeeService.CreateEmployeeAsync(employee, cancellationToken);
        if (!success)
        {
            return BadRequest(new { message });
        }
        return Ok(new { message, employee });
    }

    [HttpPut("employees/{empNo}")]
    public async Task<IActionResult> UpdateEmployee(string empNo, [FromBody] Dictionary<string, object?> employee, CancellationToken cancellationToken)
    {
        var (success, message) = await _employeeService.UpdateEmployeeAsync(empNo, employee, cancellationToken);
        if (!success)
        {
            return BadRequest(new { message });
        }
        return Ok(new { message });
    }

    [HttpDelete("employees/{empNo}")]
    public async Task<IActionResult> DeleteEmployee(string empNo, CancellationToken cancellationToken)
    {
        var (success, message) = await _employeeService.DeleteEmployeeAsync(empNo, cancellationToken);
        if (!success)
        {
            return NotFound(new { message });
        }
        return Ok(new { message });
    }

    // CRUD Operations for Timecards
    [HttpGet("timecards/{year}/{month}")]
    public async Task<IActionResult> GetTimecardsForPeriod(int year, int month, CancellationToken cancellationToken)
    {
        var timecards = await _timecardService.GetTimecardsAsync(year, month, cancellationToken);
        return Ok(timecards);
    }

    [HttpGet("timecards/{empNo}/{year}/{month}")]
    public async Task<IActionResult> GetTimecard(string empNo, int year, int month, CancellationToken cancellationToken)
    {
        var timecard = await _timecardService.GetTimecardAsync(empNo, year, month, cancellationToken);
        if (timecard == null)
        {
            return NotFound(new { message = "Timecard not found" });
        }
        return Ok(timecard);
    }

    [HttpPost("timecards")]
    [HttpPut("timecards")]
    public async Task<IActionResult> UpsertTimecard([FromBody] Dictionary<string, object?> timecard, CancellationToken cancellationToken)
    {
        var (success, message) = await _timecardService.UpsertTimecardAsync(timecard, cancellationToken);
        if (!success)
        {
            return BadRequest(new { message });
        }
        return Ok(new { message, timecard });
    }

    [HttpDelete("timecards/{empNo}/{year}/{month}")]
    public async Task<IActionResult> DeleteTimecard(string empNo, int year, int month, CancellationToken cancellationToken)
    {
        var (success, message) = await _timecardService.DeleteTimecardAsync(empNo, year, month, cancellationToken);
        if (!success)
        {
            return NotFound(new { message });
        }
        return Ok(new { message });
    }
}
