using Microsoft.EntityFrameworkCore;
using AccountingApi.Data;
using AccountingApi.Models;

namespace AccountingApi.Services;

public sealed class PayrollComputationService
{
    private readonly AccountingDbContext _context;

    // Overtime and Holiday Rate Multipliers (from COMPTIME.PRG)
    private const decimal REOT_R = 1.25m;  // Regular OT
    private const decimal SPHP_R = 1.30m;  // Special Holiday Pay
    private const decimal SPOT_R = 1.69m;  // Special Holiday OT
    private const decimal LGHP_R = 2.00m;  // Legal Holiday Pay
    private const decimal LGOT_R = 2.60m;  // Legal Holiday OT
    private const decimal NSD_R = 1.10m;   // Night Shift Differential

    public PayrollComputationService(AccountingDbContext context)
    {
        _context = context;
    }

    public async Task<(bool Success, string Message, int EmployeesProcessed)> ComputePayrollAsync(bool deductTaxForCasual, CancellationToken cancellationToken = default)
    {
        try
        {
            // Step 1: Validate system status
            var sysId = await _context.PaySysId.FirstOrDefaultAsync(cancellationToken);
            if (sysId is null)
            {
                return (false, "System ID not configured. Please initialize payroll system.", 0);
            }

            if (sysId.TrnCtr == sysId.TrnUpd)
            {
                return (false, "Cannot compute. Timecard already posted. Check System-ID file.", 0);
            }

            // Determine PhilHealth rate based on year
            var year = sysId.PresMo == 12 ? sysId.BegDate.Year : sysId.EndDate.Year;
            var (philHealthRate, philHealthCeiling) = GetPhilHealthRates(year);

            // Step 2: Get all uncomputed timecards
            var timecards = await _context.PayTmcard
                .Where(t => t.TrnFlag == "U")
                .ToListAsync(cancellationToken);

            if (timecards.Count == 0)
            {
                return (false, "No timecard to compute!", 0);
            }

            int processed = 0;

            // Step 3: Process each timecard
            foreach (var tc in timecards)
            {
                // Get employee master record
                var master = await _context.PayMaster
                    .FirstOrDefaultAsync(m => m.EmpNo == tc.EmpNo, cancellationToken);

                if (master is null)
                {
                    continue; // Skip if employee not in master file
                }

                // Compute gross earnings
                decimal hrate = sysId.MDailyWage ? (master.BRate / 8) : (master.BRate / 240);

                if (sysId.MDailyWage)
                {
                    tc.RegPay = Math.Round(tc.RegHrs * hrate, 2);
                }
                else
                {
                    tc.RegPay = Math.Round((master.BRate / 2) - (tc.AbsHrs * hrate), 2);
                }

                tc.RotPay = Math.Round(tc.RotHrs * hrate * REOT_R, 2);
                tc.SphpPay = Math.Round(tc.SphpHrs * hrate * SPHP_R, 2);
                tc.SpotPay = Math.Round(tc.SpotHrs * hrate * SPOT_R, 2);
                tc.LghpPay = Math.Round(tc.LghpHrs * hrate * LGHP_R, 2);
                tc.LgotPay = Math.Round(tc.LgotHrs * hrate * LGOT_R, 2);
                tc.NsdPay = Math.Round(tc.NsdHrs * hrate * NSD_R, 2);

                // Leave pay
                if (tc.LvHrs > 10)
                {
                    tc.LvPay = Math.Round(10 * 8 * hrate, 2);
                    tc.Lv2Pay = Math.Round((tc.LvHrs - 10) * 8 * hrate, 2);
                }
                else
                {
                    tc.LvPay = Math.Round(tc.LvHrs * 8 * hrate, 2);
                    tc.Lv2Pay = 0;
                }
                tc.LsPay = Math.Round(tc.LsHrs * 8 * hrate, 2);

                // Gross pay
                tc.GrsPay = Math.Round(
                    tc.RegPay + tc.RotPay + tc.SphpPay + tc.SpotPay + tc.LghpPay + 
                    tc.LgotPay + tc.LvPay + tc.Lv2Pay + tc.LsPay + 
                    tc.OthPay1 + tc.OthPay2 + tc.OthPay3 + tc.OthPay4 + tc.NsdPay, 2);

                // Compute deductions
                decimal nonTaxable = tc.OthPay2 + tc.OthPay4 + master.MOthp2 + master.MOthp4;
                decimal grs = master.MBasic + tc.RegPay;
                decimal pgMonPay = master.MBasic + tc.RegPay;

                // SSS Computation
                if (master.SssMember && (tc.GrsPay - tc.OthPay2 - tc.OthPay4) > 0 && grs > 0)
                {
                    var (sssEE, sssER, ecER) = ComputeSSS(grs, master.MSsee, master.MSser, master.MEcer);
                    tc.SssEe = sssEE;
                    tc.SssEr = sssER;
                    tc.EcEr = ecER;
                }
                else
                {
                    tc.SssEe = 0;
                    tc.SssEr = 0;
                    tc.EcEr = 0;
                }

                // PhilHealth Computation
                if (master.SssMember && (tc.GrsPay - tc.OthPay2 - tc.OthPay4) > 0 && grs > 0)
                {
                    tc.MedEe = ComputePhilHealth(grs, philHealthRate, philHealthCeiling, master.MMedee);
                    tc.MedEr = tc.MedEe;
                }
                else
                {
                    tc.MedEe = 0;
                    tc.MedEr = 0;
                }

                // Pag-IBIG Computation
                if (master.Pgbg && tc.RegPay > 0)
                {
                    tc.PgbgEe = ComputePagIbig(pgMonPay, sysId.PgLower, sysId.PgHigher, sysId.PgLwper, sysId.PgHiper, master.MPgee);
                    tc.PgbgEr = ComputePagIbig(pgMonPay, sysId.PgLower, sysId.PgHigher, sysId.PgLwper, sysId.PgHiper, master.MPger);
                }
                else
                {
                    tc.PgbgEe = 0;
                    tc.PgbgEr = 0;
                }

                // Withholding Tax Computation (semi-monthly)
                decimal grsP1 = tc.GrsPay - tc.OthPay2 - tc.OthPay4 - tc.LvPay - tc.SssEe - tc.MedEe - tc.PgbgEe;
                tc.TaxEe = ComputeTax(grsP1, master.Status);

                // Check if casual employee tax should be deducted
                if (master.EmpStat == "C" && !deductTaxForCasual)
                {
                    tc.TaxEe = 0;
                }

                // 13th Month Bonus (if withbonus flag set)
                if (tc.Withbonus)
                {
                    decimal bonNet;
                    if (master.EmpStat == "C" || string.IsNullOrWhiteSpace(master.EmpStat))
                    {
                        bonNet = (master.YBasic + tc.RegPay) / 12;
                    }
                    else
                    {
                        bonNet = sysId.MDailyWage 
                            ? master.BRate * sysId.BonDays 
                            : master.BRate * sysId.BonMont;
                    }

                    decimal bonusTax = 0;
                    if (bonNet > sysId.TaxBon)
                    {
                        decimal taxable = bonNet - sysId.TaxBon;
                        bonusTax = ComputeBonusTax(taxable);
                    }

                    tc.Bonus = bonNet;
                    tc.Bonustax = bonusTax;
                }
                else
                {
                    tc.Bonus = 0;
                    tc.Bonustax = 0;
                }

                // Total Deductions
                tc.TotDed = tc.SlnDed + tc.HdmfDed + tc.SssEe + tc.MedEe + tc.PgbgEe + tc.TaxEe +
                           tc.OthDed1 + tc.OthDed2 + tc.OthDed3 + tc.OthDed4 + tc.OthDed5 +
                           tc.OthDed6 + tc.OthDed7 + tc.OthDed8 + tc.OthDed9 + tc.OthDed10 +
                           tc.CompDed + tc.ComdDed + tc.CalDed + tc.Bonustax;

                // Net Pay
                tc.NetPay = tc.GrsPay - tc.TotDed;

                // Mark as processed
                tc.TrnFlag = "P";
                tc.UpdatedAt = DateTime.UtcNow;

                processed++;
            }

            // Update system counter
            sysId.TrnPrc = processed;
            sysId.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            return (true, $"Computation completed. {processed} employees processed.", processed);
        }
        catch (Exception ex)
        {
            return (false, $"Computation failed: {ex.Message}", 0);
        }
    }

    /// <summary>
    /// SSS Premium Table Computation (from COMPTIME.PRG lines 161-402)
    /// Returns (Employee Share, Employer Share, EC Charge)
    /// </summary>
    private static (decimal EE, decimal ER, decimal EC) ComputeSSS(decimal grs, decimal mSsee, decimal mSser, decimal mEcer)
    {
        decimal sssEe, sssEr, ecEr;

        if (grs < 4250)
        {
            sssEe = 180.00m;
            sssEr = 380.00m;
            ecEr = 10m;
        }
        else if (grs < 4750)
        {
            sssEe = 202.50m;
            sssEr = 427.50m;
            ecEr = 10m;
        }
        else if (grs < 5250)
        {
            sssEe = 225.00m;
            sssEr = 475.00m;
            ecEr = 10m;
        }
        else if (grs < 5750)
        {
            sssEe = 247.50m;
            sssEr = 522.50m;
            ecEr = 10m;
        }
        else if (grs < 6250)
        {
            sssEe = 270.00m;
            sssEr = 570.00m;
            ecEr = 10m;
        }
        else if (grs < 6750)
        {
            sssEe = 292.50m;
            sssEr = 617.50m;
            ecEr = 10m;
        }
        else if (grs < 7250)
        {
            sssEe = 315.00m;
            sssEr = 665.00m;
            ecEr = 10m;
        }
        else if (grs < 7750)
        {
            sssEe = 337.50m;
            sssEr = 712.50m;
            ecEr = 10m;
        }
        else if (grs < 8250)
        {
            sssEe = 360.00m;
            sssEr = 760.00m;
            ecEr = 10m;
        }
        else if (grs < 8750)
        {
            sssEe = 382.50m;
            sssEr = 807.50m;
            ecEr = 10m;
        }
        else if (grs < 9250)
        {
            sssEe = 405.00m;
            sssEr = 855.00m;
            ecEr = 10m;
        }
        else if (grs < 9750)
        {
            sssEe = 427.50m;
            sssEr = 902.50m;
            ecEr = 10m;
        }
        else if (grs < 10250)
        {
            sssEe = 450.00m;
            sssEr = 950.00m;
            ecEr = 10m;
        }
        else if (grs < 10750)
        {
            sssEe = 472.50m;
            sssEr = 997.50m;
            ecEr = 10m;
        }
        else if (grs < 11250)
        {
            sssEe = 495.00m;
            sssEr = 1045.00m;
            ecEr = 10m;
        }
        else if (grs < 11750)
        {
            sssEe = 517.50m;
            sssEr = 1092.50m;
            ecEr = 10m;
        }
        else if (grs < 12250)
        {
            sssEe = 540.00m;
            sssEr = 1140.00m;
            ecEr = 10m;
        }
        else if (grs < 12750)
        {
            sssEe = 562.50m;
            sssEr = 1187.50m;
            ecEr = 10m;
        }
        else if (grs < 13250)
        {
            sssEe = 585.00m;
            sssEr = 1235.00m;
            ecEr = 10m;
        }
        else if (grs < 13750)
        {
            sssEe = 607.50m;
            sssEr = 1282.50m;
            ecEr = 10m;
        }
        else if (grs < 14250)
        {
            sssEe = 630.00m;
            sssEr = 1330.00m;
            ecEr = 10m;
        }
        else if (grs < 14750)
        {
            sssEe = 652.50m;
            sssEr = 1337.50m;
            ecEr = 10m;
        }
        else if (grs < 15250)
        {
            sssEe = 675.00m;
            sssEr = 1425.00m;
            ecEr = 30m;
        }
        else if (grs < 15750)
        {
            sssEe = 697.50m;
            sssEr = 1472.50m;
            ecEr = 30m;
        }
        else if (grs < 16250)
        {
            sssEe = 720.00m;
            sssEr = 1520.00m;
            ecEr = 30m;
        }
        else if (grs < 16750)
        {
            sssEe = 742.50m;
            sssEr = 1567.50m;
            ecEr = 30m;
        }
        else if (grs < 17250)
        {
            sssEe = 765.00m;
            sssEr = 1615.00m;
            ecEr = 30m;
        }
        else if (grs < 17750)
        {
            sssEe = 787.50m;
            sssEr = 1662.50m;
            ecEr = 30m;
        }
        else if (grs < 18250)
        {
            sssEe = 810.00m;
            sssEr = 1710.00m;
            ecEr = 30m;
        }
        else if (grs < 18750)
        {
            sssEe = 832.50m;
            sssEr = 1757.50m;
            ecEr = 30m;
        }
        else if (grs < 19250)
        {
            sssEe = 855.00m;
            sssEr = 1805.00m;
            ecEr = 30m;
        }
        else if (grs < 19750)
        {
            sssEe = 877.50m;
            sssEr = 1852.50m;
            ecEr = 30m;
        }
        else
        {
            sssEe = 900.00m;
            sssEr = 1900.00m;
            ecEr = 30m;
        }

        // Subtract month-to-date already deducted
        sssEe -= mSsee;
        sssEr -= mSser;
        ecEr -= mEcer;

        return (sssEe, sssEr, ecEr);
    }

    /// <summary>
    /// PhilHealth Computation (from COMPTIME.PRG lines 455-475)
    /// </summary>
    private static decimal ComputePhilHealth(decimal grs, decimal rate, decimal ceiling, decimal mMedee)
    {
        decimal medEe;

        if (grs < 10000)
        {
            medEe = Math.Round((10000 * rate) / 2, 2);
        }
        else if (grs < ceiling)
        {
            medEe = Math.Round((grs * rate) / 2, 2);
        }
        else
        {
            medEe = Math.Round((ceiling * rate) / 2, 2);
        }

        medEe -= mMedee;
        return medEe;
    }

    /// <summary>
    /// Pag-IBIG Computation (from COMPTIME.PRG)
    /// </summary>
    private static decimal ComputePagIbig(decimal pgMonPay, decimal pgLower, decimal pgHigher, decimal pgLwper, decimal pgHiper, decimal mPgee)
    {
        decimal pgbgEe;

        if (pgMonPay <= pgLower)
        {
            pgbgEe = Math.Round(pgMonPay * pgLwper, 2);
        }
        else if (pgMonPay > pgHigher)
        {
            pgbgEe = Math.Round(pgHigher * pgHiper, 2);
        }
        else
        {
            pgbgEe = Math.Round(pgMonPay * pgHiper, 2);
        }

        pgbgEe -= mPgee;
        return pgbgEe;
    }

    /// <summary>
    /// Withholding Tax Computation - Semi-Monthly Table (from COMPTIME.PRG lines 664-706)
    /// </summary>
    private static decimal ComputeTax(decimal grsP1, string? status)
    {
        if (grsP1 <= 0)
        {
            return 0;
        }

        decimal peso, percent, salary;

        if (grsP1 <= 10417)
        {
            peso = 0;
            percent = 0;
            salary = 0;
        }
        else if (grsP1 < 16667)
        {
            peso = 0;
            percent = 0.2m;
            salary = 10417;
        }
        else if (grsP1 < 33333)
        {
            peso = 1250;
            percent = 0.25m;
            salary = 16667;
        }
        else if (grsP1 < 83333)
        {
            peso = 5416.67m;
            percent = 0.3m;
            salary = 33333;
        }
        else if (grsP1 < 333333)
        {
            peso = 20416.67m;
            percent = 0.32m;
            salary = 83333;
        }
        else
        {
            peso = 100416.67m;
            percent = 0.35m;
            salary = 333333;
        }

        decimal taxDed = peso + ((grsP1 - salary) * percent);
        return Math.Round(taxDed, 2);
    }

    /// <summary>
    /// 13th Month Bonus Tax Computation - Monthly Table (from COMPTIME.PRG lines 619-650)
    /// </summary>
    private static decimal ComputeBonusTax(decimal taxable)
    {
        if (taxable <= 0)
        {
            return 0;
        }

        decimal peso, percent, salary;

        if (taxable <= 20833)
        {
            peso = 0;
            percent = 0;
            salary = 0;
        }
        else if (taxable < 33333)
        {
            peso = 0;
            percent = 0.2m;
            salary = 20833;
        }
        else if (taxable < 66667)
        {
            peso = 2500;
            percent = 0.25m;
            salary = 33333;
        }
        else if (taxable < 166667)
        {
            peso = 10833.33m;
            percent = 0.3m;
            salary = 66667;
        }
        else if (taxable < 666667)
        {
            peso = 40833.33m;
            percent = 0.32m;
            salary = 166667;
        }
        else
        {
            peso = 200833.33m;
            percent = 0.35m;
            salary = 666667;
        }

        decimal btax = peso + ((taxable - salary) * percent);
        return Math.Round(btax, 2);
    }

    /// <summary>
    /// Get PhilHealth rates based on year (from COMPTIME.PRG lines 51-88)
    /// </summary>
    private static (decimal Rate, decimal Ceiling) GetPhilHealthRates(int year)
    {
        return year switch
        {
            <= 2019 => (0.0275m, 50000m),
            2020 => (0.03m, 60000m),
            2021 => (0.03m, 60000m),
            2022 => (0.04m, 80000m),
            2023 => (0.04m, 80000m),
            2024 => (0.045m, 90000m),
            _ => (0.05m, 100000m)
        };
    }

    public async Task<(bool Success, string Message, int EmployeesPosted)> PostTimecardAsync(bool has3rdPayroll = false, CancellationToken cancellationToken = default)
    {
        try
        {
            // Step 1: Validate system status
            var sysId = await _context.PaySysId.FirstOrDefaultAsync(cancellationToken);
            if (sysId is null)
            {
                return (false, "System ID not configured.", 0);
            }

            if (sysId.TrnUpd == sysId.TrnCtr)
            {
                return (false, "Timecard already posted for this period.", 0);
            }

            // Step 2: Get all processed timecards
            var timecards = await _context.PayTmcard
                .Where(t => t.TrnFlag == "P")
                .ToListAsync(cancellationToken);

            if (timecards.Count == 0)
            {
                return (false, "No processed timecard to post!", 0);
            }

            int posted = 0;

            // Step 3: Post each timecard to master file
            foreach (var tc in timecards)
            {
                var master = await _context.PayMaster
                    .FirstOrDefaultAsync(m => m.EmpNo == tc.EmpNo, cancellationToken);

                if (master is null)
                {
                    continue;
                }

                // Update monthly counters
                master.MBasic += tc.RegPay;
                master.MCola += 0; // COLA not in current timecard
                master.MHol += tc.SphpPay + tc.LghpPay;
                master.MOt += tc.RotPay + tc.SpotPay + tc.LgotPay;
                master.MLeave += tc.LvPay + tc.Lv2Pay + tc.LsPay;
                master.MGross += tc.GrsPay;
                master.MSsee += tc.SssEe;
                master.MSser += tc.SssEr;
                master.MMedee += tc.MedEe;
                master.MMeder += tc.MedEr;
                master.MPgee += tc.PgbgEe;
                master.MPger += tc.PgbgEr;
                master.MEcer += tc.EcEr;
                master.MTax += tc.TaxEe;
                master.MOthp1 += tc.OthPay1;
                master.MOthp2 += tc.OthPay2;
                master.MOthp3 += tc.OthPay3;
                master.MOthp4 += tc.OthPay4;
                master.MNetpay += tc.NetPay;

                // Update quarterly counters (based on current month)
                var quarter = (sysId.PresMo - 1) / 3 + 1;
                switch (quarter)
                {
                    case 1:
                        master.Q1Gross += tc.GrsPay;
                        master.Q1Ssee += tc.SssEe;
                        master.Q1Medee += tc.MedEe;
                        master.Q1Pgee += tc.PgbgEe;
                        master.Q1Tax += tc.TaxEe;
                        break;
                    case 2:
                        master.Q2Gross += tc.GrsPay;
                        master.Q2Ssee += tc.SssEe;
                        master.Q2Medee += tc.MedEe;
                        master.Q2Pgee += tc.PgbgEe;
                        master.Q2Tax += tc.TaxEe;
                        break;
                    case 3:
                        master.Q3Gross += tc.GrsPay;
                        master.Q3Ssee += tc.SssEe;
                        master.Q3Medee += tc.MedEe;
                        master.Q3Pgee += tc.PgbgEe;
                        master.Q3Tax += tc.TaxEe;
                        break;
                }

                // Update yearly counters
                master.YBasic += tc.RegPay;
                master.YCola += 0;
                master.YHol += tc.SphpPay + tc.LghpPay;
                master.YOt += tc.RotPay + tc.SpotPay + tc.LgotPay;
                master.YLeave += tc.LvPay + tc.Lv2Pay + tc.LsPay;
                master.YGross += tc.GrsPay;
                master.YSsee += tc.SssEe;
                master.YSser += tc.SssEr;
                master.YMedee += tc.MedEe;
                master.YMeder += tc.MedEr;
                master.YPgee += tc.PgbgEe;
                master.YPger += tc.PgbgEr;
                master.YEcer += tc.EcEr;
                master.YTax += tc.TaxEe;
                master.YOthp1 += tc.OthPay1;
                master.YOthp2 += tc.OthPay2;
                master.YOthp3 += tc.OthPay3;
                master.YOthp4 += tc.OthPay4;
                master.YBonus += tc.Bonus;
                master.YNetpay += tc.NetPay;

                // Update loan balances
                if (tc.SlnDed > 0)
                {
                    master.SlnBal -= tc.SlnDed;
                    if (master.SlnBal < 0) master.SlnBal = 0;
                }
                if (tc.HdmfDed > 0)
                {
                    master.HdmfBal -= tc.HdmfDed;
                    if (master.HdmfBal < 0) master.HdmfBal = 0;
                }
                if (tc.CalDed > 0)
                {
                    master.CalBal -= tc.CalDed;
                    if (master.CalBal < 0) master.CalBal = 0;
                }
                if (tc.CompDed > 0)
                {
                    master.CompBal -= tc.CompDed;
                    if (master.CompBal < 0) master.CompBal = 0;
                }
                if (tc.ComdDed > 0)
                {
                    master.ComdBal -= tc.ComdDed;
                    if (master.ComdBal < 0) master.ComdBal = 0;
                }

                master.UpdatedAt = DateTime.UtcNow;

                // Mark timecard as posted
                tc.TrnFlag = "X";
                tc.UpdatedAt = DateTime.UtcNow;

                posted++;
            }

            // Update system counter
            sysId.TrnUpd = sysId.TrnCtr;
            sysId.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            return (true, $"Posting completed. {posted} employees posted to master file.", posted);
        }
        catch (Exception ex)
        {
            return (false, $"Posting failed: {ex.Message}", 0);
        }
    }

    /// <summary>
    /// Compute 13th Month Pay for all employees in master file.
    /// Based on BONSCOMP.PRG - separate year-end batch process.
    /// </summary>
    /// <param name="bonusDays">Number of days to use for regular employees (if 0, defaults to bon_days from sys_id)</param>
    public async Task<(bool Success, string Message, int EmployeesProcessed, List<object>? Employees)> Compute13thMonthPayAsync(
        int bonusDays = 0, decimal taxThreshold = 0, CancellationToken cancellationToken = default)
    {
        try
        {
            // Get system configuration
            var sysId = await _context.PaySysId.FirstOrDefaultAsync(cancellationToken);
            if (sysId is null)
                return (false, "System ID not configured.", 0, null);

            // Use system bon_days if not specified
            if (bonusDays == 0) bonusDays = sysId.BonDays;

            // Use caller-supplied threshold or fall back to system TaxBon (default 90000)
            decimal threshold = taxThreshold > 0 ? taxThreshold : (sysId.TaxBon > 0 ? sysId.TaxBon : 90000m);

            // Get all regular and casual employees (EmpStat: R=Regular, C=Casual, F=Confidential, E=Executive)
            var masters = await _context.PayMaster
                .Where(m => m.EmpStat == "R" || m.EmpStat == "C" || m.EmpStat == "F" || m.EmpStat == "E")
                .ToListAsync(cancellationToken);

            if (masters.Count == 0)
                return (false, "No employees in master file! Make sure employees are loaded.", 0, null);

            int processed = 0;
            var employeeResults = new List<object>();

            foreach (var master in masters)
            {
                decimal bonNet;

                // Compute bonus amount
                if (master.EmpStat == "C")
                {
                    // Casual: y_basic / 12
                    bonNet = master.YBasic > 0 ? master.YBasic / 12 : master.BRate * bonusDays;
                }
                else
                {
                    // Regular/Confidential/Executive: b_rate * bon_days
                    bonNet = master.BRate * bonusDays;
                }

                decimal bonusTax = 0;
                bool isTaxable = bonNet > threshold;

                // Compute bonus tax only on the amount above the tax-free threshold
                if (isTaxable)
                {
                    // Taxable amount (divide by 2 because tax table is semi-monthly)
                    decimal taxable = (bonNet - threshold) / 2;

                    if (!string.IsNullOrWhiteSpace(master.Status) && master.Status.Trim().Length > 0)
                    {
                        // Fetch tax brackets for this status and find the right bracket in memory
                        var taxRows = await _context.PayTaxTab
                            .Where(t => t.Exemption == master.Status)
                            .ToListAsync(cancellationToken);
                        var taxEntry = taxRows
                            .Where(t => t.Salary <= taxable)
                            .OrderByDescending(t => t.Salary)
                            .FirstOrDefault();

                        if (taxEntry != null && taxEntry.Salary != -1)
                        {
                            bonusTax = (taxEntry.Peso + ((taxable - taxEntry.Salary) * (taxEntry.Percent / 100))) * 2;
                        }
                    }
                    else
                    {
                        bonusTax = ComputeBonusTax(taxable) * 2;
                    }
                }

                // Update master file
                master.YBonus = Math.Round(bonNet, 2);
                master.YBtax  = Math.Round(bonusTax, 2);

                employeeResults.Add(new
                {
                    EmpNo    = master.EmpNo,
                    Name     = master.EmpNm,
                    EmpType  = master.EmpStat,
                    BonusAmt = Math.Round(bonNet, 2),
                    Taxable  = isTaxable
                });
                processed++;
            }

            await _context.SaveChangesAsync(cancellationToken);

            return (true, $"13th month pay computation completed. {processed} employees processed.", processed, employeeResults);
        }
        catch (Exception ex)
        {
            return (false, $"13th month pay computation failed: {ex.Message}", 0, null);
        }
    }
}
