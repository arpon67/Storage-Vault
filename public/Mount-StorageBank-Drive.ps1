# Storage Bank Windows PowerShell Virtual Drive Mount Script
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    STORAGE BANK WINDOWS VIRTUAL DRIVE MOUNT" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$VaultDir = Join-Path $env:USERPROFILE "StorageBank_Vault"
$DriveLetter = "Z:"

if (-not (Test-Path $VaultDir)) {
    New-Item -ItemType Directory -Path $VaultDir -Force | Out-Null
    Write-Host "[OK] Created Local Storage Vault directory: $VaultDir" -ForegroundColor Green
}

Write-Host "[OK] Mounting Storage Bank Vault to Virtual Drive $DriveLetter..." -ForegroundColor Yellow

try {
    subst $DriveLetter "$VaultDir" | Out-Null
    Write-Host ""
    Write-Host "===================================================" -ForegroundColor Green
    Write-Host " SUCCESS! Mounted Storage Bank Drive to $DriveLetter" -ForegroundColor Green
    Write-Host " Open 'This PC' in File Explorer to view Drive $DriveLetter" -ForegroundColor Green
    Write-Host "===================================================" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Drive $DriveLetter is already mounted or in use." -ForegroundColor Yellow
}

Write-Host ""
Read-Host -Prompt "Press Enter to exit..."
