using AccountingApi.Services;
using AccountingApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AccountingApi.Data;

namespace AccountingApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class PayrollController : ControllerBase
{
    private readonly LegacyDataService _legacyDataService;
    private readonly PayrollComputationService _computationService;
    private readonly EmployeeService _employeeService;
    private readonly TimecardService _timecardService;
    private readonly AccountingDbContext _db;
    private readonly IConfiguration _configuration;

    public PayrollController(
        LegacyDataService legacyDataService, 
        PayrollComputationService computationService,
        EmployeeService employeeService,
        TimecardService timecardService,
        AccountingDbContext db,
        IConfiguration configuration)
    {
        _legacyDataService = legacyDataService;
        _computationService = computationService;
        _employeeService = employeeService;
        _timecardService = timecardService;
        _db = db;
        _configuration = configuration;
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
    public async Task<IActionResult> PostTimecard(
        [FromQuery] bool has3rdPayroll = false,
        [FromQuery] string month = "",
        [FromQuery] string year = "",
        CancellationToken cancellationToken = default)
    {
        var (success, message, employeesPosted) = await _computationService.PostTimecardAsync(has3rdPayroll, cancellationToken);

        if (!success)
        {
            return BadRequest(new { error = message });
        }

        return Ok(new
        {
            success = true,
            message = message,
            posted = employeesPosted,
            postedAt = DateTime.UtcNow
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
    public async Task<IActionResult> Compute13thMonthPay(
        [FromQuery] int bonusDays = 0,
        [FromQuery] decimal taxThreshold = 0,
        CancellationToken cancellationToken = default)
    {
        var (success, message, processed, employees) =
            await _computationService.Compute13thMonthPayAsync(bonusDays, taxThreshold, cancellationToken);

        if (!success)
            return BadRequest(new { error = message });

        return Ok(new
        {
            message,
            processed,
            employees
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

    // ── System-ID ──────────────────────────────────────────────────────────────

    /// <summary>Returns current payroll system state: period, counters, configuration.</summary>
    [HttpGet("system-id")]
    public async Task<IActionResult> GetSystemId(CancellationToken cancellationToken)
    {
        var sysId = await _db.PaySysId.FirstOrDefaultAsync(cancellationToken);
        if (sysId is null)
            return NotFound(new { message = "System ID not found." });

        var empCount = await _db.PayMaster.CountAsync(cancellationToken);
        var tcCount  = await _db.PayTmcard.CountAsync(cancellationToken);

        return Ok(new
        {
            PresMo     = sysId.PresMo,
            PresYr     = sysId.PresYr,
            PAYMonth   = sysId.PresMo,
            PAYYear    = sysId.PresYr,
            BegDate    = sysId.BegDate.ToString("yyyy-MM-dd"),
            EndDate    = sysId.EndDate.ToString("yyyy-MM-dd"),
            TrnCtr     = sysId.TrnCtr,
            TrnPrc     = sysId.TrnPrc,
            TrnUpd     = sysId.TrnUpd,
            PayType    = sysId.PayType,
            WorkHours  = sysId.WorkHours,
            NeedBackup = sysId.NeedBackup,
            HdmfPre    = sysId.HdmfPre,
            PgLower    = sysId.PgLower,
            PgHigher   = sysId.PgHigher,
            PgLwper    = sysId.PgLwper,
            PgHiper    = sysId.PgHiper,
            BonDays    = sysId.BonDays,
            BonMont    = sysId.BonMont,
            TaxBon     = sysId.TaxBon,
            MDailyWage = sysId.MDailyWage,
            SysNm      = sysId.SysNm,
            EmpCount   = empCount,
            TcCount    = tcCount
        });
    }

    // ── Compute Summary ────────────────────────────────────────────────────────

    /// <summary>Returns totals of the current computed timecard (for the Compute Payroll screen).</summary>
    [HttpGet("compute-summary")]
    public async Task<IActionResult> GetComputeSummary(CancellationToken cancellationToken)
    {
        var sysId = await _db.PaySysId.FirstOrDefaultAsync(cancellationToken);
        if (sysId is null)
            return NotFound(new { message = "System ID not found." });

        var computed = await _db.PayTmcard
            .Where(t => t.TrnFlag == "P" || t.TrnFlag == "X")
            .ToListAsync(cancellationToken);
        var uncomputed = await _db.PayTmcard
            .Where(t => t.TrnFlag == "U")
            .CountAsync(cancellationToken);
        var posted = await _db.PayTmcard
            .Where(t => t.TrnFlag == "X")
            .CountAsync(cancellationToken);

        var totalGross  = computed.Sum(t => t.GrsPay);
        var totalTax    = computed.Sum(t => t.TaxEe);
        var totalSssEe  = computed.Sum(t => t.SssEe);
        var totalMedEe  = computed.Sum(t => t.MedEe);
        var totalPgbgEe = computed.Sum(t => t.PgbgEe);
        var totalDed    = computed.Sum(t => t.TotDed);
        var totalNet    = computed.Sum(t => t.NetPay);

        return Ok(new
        {
            BegDate       = sysId.BegDate.ToString("yyyy-MM-dd"),
            EndDate       = sysId.EndDate.ToString("yyyy-MM-dd"),
            sysId.PresMo,
            sysId.PresYr,
            sysId.TrnCtr,
            sysId.TrnPrc,
            sysId.TrnUpd,
            sysId.PayType,
            Uncomputed    = uncomputed,
            ComputedCount = computed.Count,
            PostedCount   = posted,
            TotalGross    = totalGross,
            TotalTax      = totalTax,
            TotalSssEe    = totalSssEe,
            TotalMedEe    = totalMedEe,
            TotalPgbgEe   = totalPgbgEe,
            TotalDed      = totalDed,
            TotalNet      = totalNet,
            Rows          = computed.Select(t => new {
                t.EmpNo, t.GrsPay, t.SssEe, t.MedEe, t.PgbgEe, t.TaxEe, t.TotDed, t.NetPay
            }).ToList()
        });
    }

    // ── Initialize Timecard ────────────────────────────────────────────────────

    public sealed class InitializeRequest
    {
        public string BegDate   { get; set; } = "";
        public string EndDate   { get; set; } = "";
        public int    PayType   { get; set; } = 1;   // 1 = 1st half, 2 = 2nd half
        public int    PresMo    { get; set; }
        public int    WorkHours { get; set; } = 80;
    }

    /// <summary>
    /// Initializes the timecard file for a new payroll period.
    /// Mirrors INITTIME.PRG: validates state, clears timecard, updates sys_id,
    /// resets monthly/quarterly/yearly counters in master when appropriate.
    /// </summary>
    [HttpPost("initialize")]
    public async Task<IActionResult> InitializeTimecard([FromBody] InitializeRequest req, CancellationToken cancellationToken)
    {
        var sysId = await _db.PaySysId.FirstOrDefaultAsync(cancellationToken);
        if (sysId is null)
            return BadRequest(new { error = "System ID not found." });

        // Validate: must have completed the previous cycle before reinitializing
        var tcCount = await _db.PayTmcard.CountAsync(cancellationToken);
        if (tcCount > 0 && sysId.TrnCtr != sysId.TrnPrc)
            return BadRequest(new { error = "Initialization denied — not all timecards have been computed yet." });
        if (sysId.TrnPrc != sysId.TrnUpd && tcCount > 0)
            return BadRequest(new { error = "Initialization denied — timecard not yet posted." });

        if (!DateTime.TryParse(req.BegDate, out var begDate))
            return BadRequest(new { error = "Invalid beginning date." });
        if (!DateTime.TryParse(req.EndDate, out var endDate))
            return BadRequest(new { error = "Invalid ending date." });
        if (endDate <= begDate)
            return BadRequest(new { error = "Ending date must be after beginning date." });

        // Clear timecard file
        var allTc = await _db.PayTmcard.ToListAsync(cancellationToken);
        _db.PayTmcard.RemoveRange(allTc);

        // Update system ID
        sysId.TrnCtr   = 0;
        sysId.TrnPrc   = 0;
        sysId.TrnUpd   = 0;
        sysId.BegDate  = begDate;
        sysId.EndDate  = endDate;
        sysId.PayType  = req.PayType;
        sysId.PresMo   = req.PresMo;
        sysId.WorkHours = req.WorkHours;
        sysId.NeedBackup = true;
        sysId.UpdatedAt  = DateTime.UtcNow;

        // Reset master monthly counters if 1st half of the month
        if (req.PayType == 1)
        {
            var masters = await _db.PayMaster.ToListAsync(cancellationToken);
            foreach (var m in masters)
            {
                m.MBasic = 0; m.MCola = 0; m.MHol = 0; m.MOt = 0; m.MLeave = 0;
                m.MGross = 0; m.MSsee = 0; m.MSser = 0; m.MMedee = 0; m.MMeder = 0;
                m.MPgee = 0; m.MPger = 0; m.MEcer = 0; m.MTax = 0;
                m.MOthp1 = 0; m.MOthp2 = 0; m.MOthp3 = 0; m.MOthp4 = 0; m.MNetpay = 0;
                // Reset quarterly at start of each quarter (months 1, 4, 7, 10)
                if (req.PresMo == 1 || req.PresMo == 4 || req.PresMo == 7 || req.PresMo == 10)
                {
                    m.Q1Gross = 0; m.Q1Ssee = 0; m.Q1Medee = 0; m.Q1Pgee = 0; m.Q1Tax = 0;
                    m.Q2Gross = 0; m.Q2Ssee = 0; m.Q2Medee = 0; m.Q2Pgee = 0; m.Q2Tax = 0;
                    m.Q3Gross = 0; m.Q3Ssee = 0; m.Q3Medee = 0; m.Q3Pgee = 0; m.Q3Tax = 0;
                }
            }
        }

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Initialization complete.", BegDate = begDate.ToString("yyyy-MM-dd"), EndDate = endDate.ToString("yyyy-MM-dd") });
    }

    // ── Append Timecards from CSV ──────────────────────────────────────────────

    /// <summary>
    /// Imports timecard records from an uploaded CSV file.
    /// Mirrors APPETIME.PRG: reads emp_no + hour/amount fields from external file.
    /// CSV must have a header row. Required column: emp_no.
    /// </summary>
    [HttpPost("import-timecards")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportTimecards(IFormFile file, [FromQuery] bool overwrite = false, CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded." });

        var sysId = await _db.PaySysId.FirstOrDefaultAsync(cancellationToken);
        if (sysId is null)
            return BadRequest(new { error = "System not initialized." });

        var existing = await _db.PayTmcard.ToListAsync(cancellationToken);
        if (existing.Count > 0 && !overwrite)
            return BadRequest(new { error = "Timecard file is not empty. Pass overwrite=true to replace existing records." });

        if (existing.Count > 0 && overwrite)
            _db.PayTmcard.RemoveRange(existing);

        using var reader = new System.IO.StreamReader(file.OpenReadStream());
        var headerLine = await reader.ReadLineAsync(cancellationToken);
        if (headerLine is null)
            return BadRequest(new { error = "CSV file is empty." });

        var headers = headerLine.Split(',').Select(h => h.Trim().ToLowerInvariant()).ToArray();
        int col(string name) => Array.IndexOf(headers, name);
        decimal parseD(string[] parts, int idx) => idx >= 0 && idx < parts.Length && decimal.TryParse(parts[idx], out var v) ? v : 0;

        var imported = 0;
        var skipped  = new List<string>();

        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(line)) continue;
            var parts = line.Split(',');

            var empNoIdx = col("emp_no");
            if (empNoIdx < 0 || empNoIdx >= parts.Length) { skipped.Add(line); continue; }

            var empNo = parts[empNoIdx].Trim();
            var emp = await _db.PayMaster.FirstOrDefaultAsync(m => m.EmpNo == empNo, cancellationToken);
            if (emp is null) { skipped.Add($"Employee {empNo} not in master"); continue; }

            var tc = new PayTmcard
            {
                EmpNo       = empNo,
                EmpNm       = emp.EmpNm,
                DepNo       = emp.DepNo ?? "",
                PeriodYear  = sysId.BegDate.Year,
                PeriodMonth = sysId.PresMo,
                RegHrs      = parseD(parts, col("reg_hrs")),
                AbsHrs      = parseD(parts, col("abs_hrs")),
                RotHrs      = parseD(parts, col("rot_hrs")),
                SphpHrs     = parseD(parts, col("sphp_hrs")),
                SpotHrs     = parseD(parts, col("spot_hrs")),
                LghpHrs     = parseD(parts, col("lghp_hrs")),
                LgotHrs     = parseD(parts, col("lgot_hrs")),
                NsdHrs      = parseD(parts, col("nsd_hrs")),
                LvHrs       = parseD(parts, col("lv_hrs")),
                LsHrs       = parseD(parts, col("ls_hrs")),
                OthPay1     = parseD(parts, col("oth_pay1")),
                OthPay2     = parseD(parts, col("oth_pay2")),
                OthPay3     = parseD(parts, col("oth_pay3")),
                OthPay4     = parseD(parts, col("oth_pay4")),
                LvCashout   = parseD(parts, col("lv_cashout")),
                LsCashout   = parseD(parts, col("ls_cashout")),
                SlnDed      = parseD(parts, col("sln_ded")),
                HdmfDed     = parseD(parts, col("hdmf_ded")),
                CalDed      = parseD(parts, col("cal_ded")),
                CompDed     = parseD(parts, col("comp_ded")),
                ComdDed     = parseD(parts, col("comd_ded")),
                TrnFlag     = "U",
                UpdatedAt   = DateTime.UtcNow
            };

            _db.PayTmcard.Add(tc);
            imported++;
        }

        sysId.TrnCtr = imported;
        sysId.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new { message = $"Imported {imported} timecard record(s).", imported, skipped });
    }

    // ── OR/SBR Entries (prempaid) ──────────────────────────────────────────────

    [HttpGet("or-sbr/{type}")]
    public async Task<IActionResult> GetOrSbr(string type, CancellationToken cancellationToken)
    {
        // type: "sss" or "pagibig"
        var flag = type.ToLowerInvariant() == "sss" ? "S" : "T";
        var records = await _db.PayPremPaid
            .Where(p => p.PreFlag == flag)
            .OrderByDescending(p => p.Year)
            .ThenByDescending(p => p.Month)
            .ThenBy(p => p.Id)
            .ToListAsync(cancellationToken);

        return Ok(records.Select(p => new {
            p.Id, p.PreFlag, p.Month, p.Year,
            p.OrSbr, OrDate = p.OrDate?.ToString("yyyy-MM-dd"),
            p.Period, p.Amount
        }));
    }

    public sealed class OrSbrRequest
    {
        public string PreFlag { get; set; } = "S";
        public string Month   { get; set; } = "";
        public string Year    { get; set; } = "";
        public string OrSbr   { get; set; } = "";
        public string? OrDate { get; set; }
        public string Period  { get; set; } = "";
        public decimal Amount { get; set; }
    }

    [HttpPost("or-sbr")]
    public async Task<IActionResult> CreateOrSbr([FromBody] OrSbrRequest req, CancellationToken cancellationToken)
    {
        DateTime? orDate = null;
        if (!string.IsNullOrWhiteSpace(req.OrDate) && DateTime.TryParse(req.OrDate, out var d)) orDate = d;

        var record = new PayPremPaid
        {
            PreFlag   = req.PreFlag,
            Month     = req.Month,
            Year      = req.Year,
            OrSbr     = req.OrSbr,
            OrDate    = orDate,
            Period    = req.Period,
            Amount    = req.Amount,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.PayPremPaid.Add(record);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "OR/SBR record added.", id = record.Id });
    }

    [HttpPut("or-sbr/{id:int}")]
    public async Task<IActionResult> UpdateOrSbr(int id, [FromBody] OrSbrRequest req, CancellationToken cancellationToken)
    {
        var record = await _db.PayPremPaid.FindAsync(new object[] { id }, cancellationToken);
        if (record is null) return NotFound(new { message = "Record not found." });

        record.Month   = req.Month;
        record.Year    = req.Year;
        record.OrSbr   = req.OrSbr;
        record.Period  = req.Period;
        record.Amount  = req.Amount;
        if (!string.IsNullOrWhiteSpace(req.OrDate) && DateTime.TryParse(req.OrDate, out var d))
            record.OrDate = d;
        record.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Record updated." });
    }

    [HttpDelete("or-sbr/{id:int}")]
    public async Task<IActionResult> DeleteOrSbr(int id, CancellationToken cancellationToken)
    {
        var record = await _db.PayPremPaid.FindAsync(new object[] { id }, cancellationToken);
        if (record is null) return NotFound(new { message = "Record not found." });
        _db.PayPremPaid.Remove(record);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Record deleted." });
    }

    // ── Year-End Tax Computation ───────────────────────────────────────────────

    /// <summary>
    /// Computes year-end withholding tax for all employees.
    /// Mirrors YTAXCOMP.PRG: reads master file history totals and computes annual tax.
    /// </summary>
    [HttpPost("compute-yearend-tax")]
    public async Task<IActionResult> ComputeYearEndTax([FromQuery] int year = 0, CancellationToken cancellationToken = default)
    {
        var sysId = await _db.PaySysId.FirstOrDefaultAsync(cancellationToken);
        if (sysId is null) return BadRequest(new { error = "System ID not found." });

        if (year == 0) year = sysId.PresYr;

        var masters = await _db.PayMaster.ToListAsync(cancellationToken);
        if (masters.Count == 0)
            return BadRequest(new { error = "No employees in master file." });

        int processed = 0;
        var results = new List<object>();

        foreach (var m in masters)
        {
            // Annual taxable income = y_gross minus non-taxable items (13th month exempt threshold handled separately)
            var annualGross = m.YGross;
            if (annualGross <= 0) { processed++; continue; }

            // Look up tax based on exemption status
            decimal annualTax = 0;
            var halfMonthGross = annualGross / 24; // semi-monthly equivalent for table lookup

            if (!string.IsNullOrWhiteSpace(m.Status) && m.Status.Trim().Length > 0)
            {
                // Fetch tax table rows for this exemption status and find the best bracket
                var taxRows = await _db.PayTaxTab
                    .Where(t => t.Exemption == m.Status)
                    .ToListAsync(cancellationToken);
                var taxEntry = taxRows
                    .Where(t => t.Salary <= halfMonthGross)
                    .OrderByDescending(t => t.Salary)
                    .FirstOrDefault();

                if (taxEntry != null && taxEntry.Salary != -1)
                {
                    annualTax = (taxEntry.Peso + ((halfMonthGross - taxEntry.Salary) * (taxEntry.Percent / 100))) * 24;
                }
            }

            // Year-end tax due = annual tax - taxes already withheld
            var taxDue = Math.Max(0, Math.Round(annualTax - m.YTax, 2));

            results.Add(new { EmpNo = m.EmpNo, Name = m.EmpNm, AnnualGross = annualGross, AnnualTax = annualTax, WithheldTax = m.YTax, TaxDue = taxDue });
            processed++;
        }

        return Ok(new { message = $"Year-end tax computation complete for {year}. {processed} employees processed.", year, processed, employees = results });
    }

    // ── Edit System ID (SYSTEDIT.PRG) ──────────────────────────────────────────

    public sealed class SysIdUpdateRequest
    {
        public int    PresMo     { get; set; }
        public int    PresYr     { get; set; }
        public int    PayType    { get; set; }
        public string BegDate    { get; set; } = "";
        public string EndDate    { get; set; } = "";
        public int    TrnCtr     { get; set; }
        public int    TrnPrc     { get; set; }
        public int    TrnUpd     { get; set; }
        public int    WorkHours  { get; set; }
        public decimal UnionDues { get; set; }
        public decimal UnionDet  { get; set; }
        public decimal HdmfPre   { get; set; }
        public decimal PgLower   { get; set; }
        public decimal PgHigher  { get; set; }
        public decimal PgLwper   { get; set; }
        public decimal PgHiper   { get; set; }
        public int    BonDays    { get; set; }
        public decimal BonMont   { get; set; }
        public decimal TaxBon    { get; set; }
        public bool   MDailyWage { get; set; }
        public string SysNm      { get; set; } = "";
    }

    [HttpPut("system-id")]
    public async Task<IActionResult> UpdateSystemId([FromBody] SysIdUpdateRequest req, CancellationToken cancellationToken)
    {
        var sysId = await _db.PaySysId.FirstOrDefaultAsync(cancellationToken);
        if (sysId is null)
            return NotFound(new { message = "System ID not found." });

        if (!DateTime.TryParse(req.BegDate, out var begDate))
            return BadRequest(new { error = "Invalid beginning date." });
        if (!DateTime.TryParse(req.EndDate, out var endDate))
            return BadRequest(new { error = "Invalid ending date." });

        // Validate: beg/end dates must contain pres_mo (mirror SYSTEDIT.PRG logic)
        if (begDate.Month != req.PresMo && endDate.Month != req.PresMo)
            return BadRequest(new { error = "Invalid month — beginning or ending date must match the present month." });

        sysId.PresMo    = req.PresMo;
        sysId.PresYr    = req.PresYr;
        sysId.PayType   = req.PayType;
        sysId.BegDate   = begDate;
        sysId.EndDate   = endDate;
        sysId.TrnCtr    = req.TrnCtr;
        sysId.TrnPrc    = req.TrnPrc;
        sysId.TrnUpd    = req.TrnUpd;
        sysId.WorkHours = req.WorkHours;
        sysId.HdmfPre   = req.HdmfPre;
        sysId.PgLower   = req.PgLower;
        sysId.PgHigher  = req.PgHigher;
        sysId.PgLwper   = req.PgLwper;
        sysId.PgHiper   = req.PgHiper;
        sysId.BonDays   = req.BonDays;
        sysId.BonMont   = req.BonMont;
        sysId.TaxBon    = req.TaxBon;
        sysId.MDailyWage = req.MDailyWage;
        sysId.SysNm     = req.SysNm ?? "";
        sysId.UpdatedAt  = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "System ID updated." });
    }

    // ── Tax Table CRUD (TAXTEDIT.PRG) ──────────────────────────────────────────

    [HttpGet("tax-table")]
    public async Task<IActionResult> GetTaxTable(CancellationToken cancellationToken)
    {
        var rows = await _db.PayTaxTab
            .OrderBy(t => t.Exemption)
            .ThenBy(t => t.Sequence)
            .ToListAsync(cancellationToken);
        return Ok(rows.Select(t => new { t.Id, t.Exemption, t.Salary, t.Peso, t.Percent, t.Sequence }));
    }

    public sealed class TaxTabRequest
    {
        public string  Exemption { get; set; } = "";
        public decimal Salary    { get; set; }
        public decimal Peso      { get; set; }
        public decimal Percent   { get; set; }
        public int     Sequence  { get; set; }
    }

    [HttpPost("tax-table")]
    public async Task<IActionResult> CreateTaxRow([FromBody] TaxTabRequest req, CancellationToken cancellationToken)
    {
        var row = new PayTaxTab
        {
            Exemption  = req.Exemption.Trim().ToUpperInvariant(),
            Salary     = req.Salary,
            Peso       = req.Peso,
            Percent    = req.Percent,
            Sequence   = req.Sequence,
            CreatedAt  = DateTime.UtcNow
        };
        _db.PayTaxTab.Add(row);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Tax row added.", id = row.Id });
    }

    [HttpPut("tax-table/{id:int}")]
    public async Task<IActionResult> UpdateTaxRow(int id, [FromBody] TaxTabRequest req, CancellationToken cancellationToken)
    {
        var row = await _db.PayTaxTab.FindAsync(new object[] { id }, cancellationToken);
        if (row is null) return NotFound(new { message = "Tax row not found." });
        row.Exemption = req.Exemption.Trim().ToUpperInvariant();
        row.Salary    = req.Salary;
        row.Peso      = req.Peso;
        row.Percent   = req.Percent;
        row.Sequence  = req.Sequence;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Tax row updated." });
    }

    [HttpDelete("tax-table/{id:int}")]
    public async Task<IActionResult> DeleteTaxRow(int id, CancellationToken cancellationToken)
    {
        var row = await _db.PayTaxTab.FindAsync(new object[] { id }, cancellationToken);
        if (row is null) return NotFound(new { message = "Tax row not found." });
        _db.PayTaxTab.Remove(row);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Tax row deleted." });
    }

    // ── Department CRUD (FTDEPEDT.PRG) ─────────────────────────────────────────

    [HttpGet("departments")]
    public async Task<IActionResult> GetDepartments(CancellationToken cancellationToken)
    {
        var depts = await _db.PayDept
            .OrderBy(d => d.DepNo)
            .ToListAsync(cancellationToken);
        return Ok(depts.Select(d => new
        {
            d.Id, d.DepNo, d.DepNm,
            d.RegPay, d.OtPay, d.HolPay, d.GrsPay,
            d.Tax, d.SssEe, d.SssEr, d.MedEe, d.MedEr,
            d.PgbgEe, d.PgbgEr, d.EcEr, d.NetPay, d.EmpCtr
        }));
    }

    public sealed class DeptRequest
    {
        public string DepNo { get; set; } = "";
        public string DepNm { get; set; } = "";
    }

    [HttpPost("departments")]
    public async Task<IActionResult> CreateDept([FromBody] DeptRequest req, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(req.DepNo))
            return BadRequest(new { error = "Department number required." });

        var depNo = req.DepNo.Trim();
        if (await _db.PayDept.AnyAsync(d => d.DepNo == depNo, cancellationToken))
            return Conflict(new { error = $"Department {depNo} already exists." });

        var dept = new PayDept { DepNo = depNo, DepNm = req.DepNm.Trim(), UpdatedAt = DateTime.UtcNow };
        _db.PayDept.Add(dept);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Department added.", id = dept.Id });
    }

    [HttpPut("departments/{id:int}")]
    public async Task<IActionResult> UpdateDept(int id, [FromBody] DeptRequest req, CancellationToken cancellationToken)
    {
        var dept = await _db.PayDept.FindAsync(new object[] { id }, cancellationToken);
        if (dept is null) return NotFound(new { message = "Department not found." });
        dept.DepNm    = req.DepNm.Trim();
        dept.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Department updated." });
    }

    [HttpDelete("departments/{id:int}")]
    public async Task<IActionResult> DeleteDept(int id, CancellationToken cancellationToken)
    {
        var dept = await _db.PayDept.FindAsync(new object[] { id }, cancellationToken);
        if (dept is null) return NotFound(new { message = "Department not found." });
        _db.PayDept.Remove(dept);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Department deleted." });
    }

    // ── Update Employee Rate (MASTRATE.PRG) ─────────────────────────────────────

    public sealed class UpdateRateRequest
    {
        /// <summary>"ALL" or specific dep_no</summary>
        public string DeptMode   { get; set; } = "ALL";
        public string FromDept   { get; set; } = "00";
        public string ToDept     { get; set; } = "99";
        /// <summary>"ALL", "MEMBER", "NON-MEMBER"</summary>
        public string UnionMode  { get; set; } = "ALL";
        /// <summary>"ALL" or "SPECIFIC"</summary>
        public string SalaryMode { get; set; } = "ALL";
        public decimal FromSalary{ get; set; } = 0;
        public decimal ToSalary  { get; set; } = 999999.99m;
        /// <summary>Amount to add (positive) or subtract (negative) from b_rate</summary>
        public decimal Amount    { get; set; }
    }

    [HttpPost("update-employee-rate")]
    public async Task<IActionResult> UpdateEmployeeRate([FromBody] UpdateRateRequest req, CancellationToken cancellationToken)
    {
        var query = _db.PayMaster.AsQueryable();

        // Department filter (mirrors MASTRATE.PRG)
        if (req.DeptMode != "ALL")
        {
            query = query.Where(m => string.Compare(m.DepNo, req.FromDept) >= 0
                                  && string.Compare(m.DepNo, req.ToDept)   <= 0);
        }

        // Union filter
        if (req.UnionMode == "MEMBER")
            query = query.Where(m => m.SssMember);
        else if (req.UnionMode == "NON-MEMBER")
            query = query.Where(m => !m.SssMember);

        // Salary range filter
        if (req.SalaryMode == "SPECIFIC")
            query = query.Where(m => m.BRate >= req.FromSalary && m.BRate <= req.ToSalary);

        var employees = await query.ToListAsync(cancellationToken);
        foreach (var emp in employees)
        {
            emp.BRate = Math.Max(0, emp.BRate + req.Amount);
        }
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = $"Updated basic rate for {employees.Count} employee(s) by {req.Amount:+0.00;-0.00;0}.", updated = employees.Count });
    }

    // ── Initialize for New Year (INITTIME with m_main2=7 / .t. flag) ───────────

    /// <summary>
    /// Resets all yearly accumulators (y_gross, y_tax, y_sss, etc.) to zero for all employees.
    /// Mirrors PAY.PRG m_main2=7 which calls inittime with .t. (newYear=true).
    /// Also clears the timecard file and resets sys_id counters.
    /// </summary>
    [HttpPost("initialize-new-year")]
    public async Task<IActionResult> InitializeNewYear([FromQuery] int year = 0, CancellationToken cancellationToken = default)
    {
        var sysId = await _db.PaySysId.FirstOrDefaultAsync(cancellationToken);
        if (sysId is null) return BadRequest(new { error = "System ID not found." });

        if (year == 0) year = sysId.PresYr + 1;

        // Clear timecard
        var tc = await _db.PayTmcard.ToListAsync(cancellationToken);
        _db.PayTmcard.RemoveRange(tc);

        // Reset sys_id counters
        sysId.TrnCtr   = 0;
        sysId.TrnPrc   = 0;
        sysId.TrnUpd   = 0;
        sysId.PresYr   = year;
        sysId.PresMo   = 1;
        sysId.PayType  = 1;
        sysId.NeedBackup = false;
        sysId.UpdatedAt  = DateTime.UtcNow;

        // Reset all yearly fields in master (mirrors INITTIME.PRG newYear block)
        var masters = await _db.PayMaster.ToListAsync(cancellationToken);
        foreach (var m in masters)
        {
            m.YGross = 0; m.YTax   = 0;
            m.YSsee  = 0; m.YSser  = 0;
            m.YMedee = 0; m.YMeder = 0;
            m.YPgee  = 0; m.YPger  = 0; m.YEcer = 0;
            m.YHol   = 0; m.YOt    = 0; m.YLeave = 0;
            m.YNetpay= 0; m.YBonus = 0; m.YBtax  = 0;
            m.YOthp1 = 0; m.YOthp2 = 0; m.YOthp3 = 0; m.YOthp4 = 0;
            // Monthly
            m.MBasic = 0; m.MCola = 0; m.MHol = 0; m.MOt  = 0; m.MLeave= 0;
            m.MGross = 0; m.MSsee = 0; m.MSser = 0; m.MMedee = 0; m.MMeder= 0;
            m.MPgee  = 0; m.MPger = 0; m.MEcer = 0; m.MTax  = 0;
            m.MOthp1 = 0; m.MOthp2= 0; m.MOthp3= 0; m.MOthp4= 0; m.MNetpay= 0;
            // Quarterly
            m.Q1Gross = 0; m.Q1Ssee = 0; m.Q1Medee = 0; m.Q1Pgee = 0; m.Q1Tax = 0;
            m.Q2Gross = 0; m.Q2Ssee = 0; m.Q2Medee = 0; m.Q2Pgee = 0; m.Q2Tax = 0;
            m.Q3Gross = 0; m.Q3Ssee = 0; m.Q3Medee = 0; m.Q3Pgee = 0; m.Q3Tax = 0;
        }

        // Reset department totals
        var depts = await _db.PayDept.ToListAsync(cancellationToken);
        foreach (var d in depts)
        {
            d.RegPay = 0; d.OtPay = 0; d.HolPay = 0; d.GrsPay = 0;
            d.Tax    = 0; d.SssEe  = 0; d.SssEr  = 0; d.MedEe  = 0;
            d.MedEr  = 0; d.PgbgEe = 0; d.PgbgEr = 0; d.EcEr   = 0;
            d.NetPay = 0; d.Bontot = 0; d.Bontax = 0;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = $"Year-end initialization complete. System is now set to {year} January.", year, employeesReset = masters.Count });
    }

    // ── BACKUP DATABASE ────────────────────────────────────────────────────────
    // Mirrors FILEBACK.PRG: copy all DB files to backup location.
    // Modern equivalent: stream the SQLite DB file as a download.
    [HttpGet("backup-db")]
    public IActionResult BackupDatabase()
    {
        var connString = _configuration.GetConnectionString("DefaultConnection") ?? "Data Source=accounting.db";
        var match = System.Text.RegularExpressions.Regex.Match(connString, @"[Dd]ata\s*[Ss]ource=([^;]+)");
        var dbPath = match.Success ? match.Groups[1].Value.Trim() : "accounting.db";

        // Resolve relative path against the content root
        if (!System.IO.Path.IsPathRooted(dbPath))
            dbPath = System.IO.Path.Combine(Directory.GetCurrentDirectory(), dbPath);

        if (!System.IO.File.Exists(dbPath))
            return NotFound(new { error = "Database file not found at: " + dbPath });

        var timestamp = DateTime.Now.ToString("yyyyMMdd-HHmm");
        var downloadName = $"payroll-backup-{timestamp}.db";

        // Read into memory so we don't lock the file
        var bytes = System.IO.File.ReadAllBytes(dbPath);
        return File(bytes, "application/octet-stream", downloadName);
    }

    // ── CHANGE EMPLOYEE NUMBER ────────────────────────────────────────────────
    // Mirrors F_EDTCOD.PRG (m_which=2): change an emp_no and cascade to all
    // related tables (pay_master, pay_tmcard).
    public sealed class ChangeEmpNoRequest
    {
        public string OldEmpNo { get; set; } = "";
        public string NewEmpNo { get; set; } = "";
    }

    [HttpPost("change-employee-number")]
    public async Task<IActionResult> ChangeEmployeeNumber([FromBody] ChangeEmpNoRequest req, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(req.OldEmpNo) || string.IsNullOrWhiteSpace(req.NewEmpNo))
            return BadRequest(new { error = "Both old and new employee numbers are required." });
        if (req.OldEmpNo.Trim() == req.NewEmpNo.Trim())
            return BadRequest(new { error = "Old and new employee numbers are the same." });

        var employee = await _db.PayMaster.FirstOrDefaultAsync(m => m.EmpNo == req.OldEmpNo.Trim(), cancellationToken);
        if (employee is null)
            return NotFound(new { error = $"Employee '{req.OldEmpNo}' not found." });

        var conflict = await _db.PayMaster.AnyAsync(m => m.EmpNo == req.NewEmpNo.Trim(), cancellationToken);
        if (conflict)
            return Conflict(new { error = $"Employee number '{req.NewEmpNo}' already exists." });

        var oldNo = req.OldEmpNo.Trim();
        var newNo = req.NewEmpNo.Trim();

        employee.EmpNo = newNo;

        var timecards = await _db.PayTmcard.Where(t => t.EmpNo == oldNo).ToListAsync(cancellationToken);
        foreach (var t in timecards) t.EmpNo = newNo;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new {
            message = $"Employee number changed from '{oldNo}' to '{newNo}'.",
            employeeName = employee.EmpNm,
            timecardsUpdated = timecards.Count
        });
    }
}
