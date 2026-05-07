# Azure Accounting System Quality Check
# This script verifies that the live financial reports match the expected legacy totals and are internally balanced.

$apiUrl = "https://acctng-api-demo-2026-hxgyfdf3eeg6hycq.indonesiacentral-01.azurewebsites.net"
$loginBody = @{
    username = "superadmin"
    password = "SUPERadmin!234"
} | ConvertTo-Json

Write-Host "Logging in to Azure..." -ForegroundColor Cyan
try {
    $loginResp = Invoke-RestMethod -Uri "$apiUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResp.tokens.accessToken
} catch {
    Write-Error "Login failed: $_"
    return
}

$expected = @{
    '3jcrt' = @{ name = '3JCRT General Services'; tb = 5952044.81; assets = 14480522.46 }
    'gian'  = @{ name = 'Gian-Den General Services'; tb = 4942418.55; assets = 10589496.19 }
    'jimi'  = @{ name = 'Jimi Tubing Specialist'; tb = 9512615.92; assets = 19358506.18 }
    'lmjay' = @{ name = 'Lmjay General Services'; tb = 10314488.85; assets = 19046860.89 }
}

Write-Host "`n=== LIVE QUALITY CHECK REPORT (February 2026) ===" -ForegroundColor Yellow
$allPassed = $true

foreach ($code in $expected.Keys) {
    $company = $expected[$code]
    $headers = @{
        Authorization = "Bearer $token"
        "X-Company-Code" = $code
    }

    Write-Host "`nChecking $($company.name) ($code)..." -ForegroundColor Cyan
    
    try {
        # 1. Check Trial Balance
        $tb = Invoke-RestMethod -Uri "$apiUrl/api/fs/reports/trial-balance?periodEnding=2026-02-28" -Headers $headers
        $tbDiff = [Math]::Abs($tb.totalDebit - $company.tb)
        $tbStatus = if ($tbDiff -lt 0.05) { "OK" } else { "MISMATCH (Diff: $tbDiff)" }

        # 2. Check Balance Sheet
        $bs = Invoke-RestMethod -Uri "$apiUrl/api/fs/reports/balance-sheet?periodEnding=2026-02-28" -Headers $headers
        $asDiff = [Math]::Abs($bs.totalAssets - $company.assets)
        $asStatus = if ($asDiff -lt 0.05) { "OK" } else { "MISMATCH (Diff: $asDiff)" }
        $balStatus = if ($bs.inBalance) { "BALANCED" } else { "OUT OF BALANCE" }

        # Output Results
        $overall = if ($tbStatus -eq "OK" -and $asStatus -eq "OK" -and $bs.inBalance) { "PASS" } else { "FAIL" }
        if ($overall -eq "FAIL") { $allPassed = $false }

        Write-Host "  Result:          " -NoNewline
        if ($overall -eq "PASS") { Write-Host "PASS" -ForegroundColor Green } else { Write-Host "FAIL" -ForegroundColor Red }
        
        Write-Host "  Trial Balance:   $($tb.totalDebit.ToString('N2')) (Expected: $($company.tb.ToString('N2'))) -> $tbStatus"
        Write-Host "  Total Assets:    $($bs.totalAssets.ToString('N2')) (Expected: $($company.assets.ToString('N2'))) -> $asStatus"
        Write-Host "  Balance Sheet:   $balStatus"
    } catch {
        Write-Host "  ERROR checking $code: $_" -ForegroundColor Red
        $allPassed = $false
    }
}

Write-Host "`n" + ("=" * 50)
if ($allPassed) {
    Write-Host "  ALL SYSTEMS GREEN: Data integrity verified!" -ForegroundColor Green
} else {
    Write-Host "  SYSTEM ALERT: Discrepancies found in one or more companies." -ForegroundColor Red
}
Write-Host ("=" * 50)
