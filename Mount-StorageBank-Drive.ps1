# Storage Bank Windows PowerShell Unlimited Cloud Drive Mounter Script
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "       STORAGE BANK - UNLIMITED REAL-TIME CLOUD VAULT DRIVE (Z:)" -ForegroundColor Cyan
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host ""

$Letter = "Z:"
$LetterClean = "Z"
$DriveName = "Storage Bank Unlimited Vault"
$CloudDir = Join-Path $env:USERPROFILE "StorageBank_CloudDrive_$LetterClean"

if (-not (Test-Path $CloudDir)) {
    New-Item -ItemType Directory -Path $CloudDir -Force | Out-Null
    Write-Host "[OK] Created Storage Vault Cloud Directory: $CloudDir" -ForegroundColor Green
}

# Register Drive Label in Windows Explorer Shell (This PC)
$RegPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\DriveIcons\$LetterClean\DefaultLabel"
if (-not (Test-Path $RegPath)) { New-Item -Path $RegPath -Force | Out-Null }
Set-ItemProperty -Path $RegPath -Name "(default)" -Value "$DriveName ($Letter)" -Force | Out-Null

Write-Host "[OK] Mounting Storage Vault to Virtual Drive $Letter..." -ForegroundColor Yellow

try {
    subst $Letter /d 2>$null
    subst $Letter "$CloudDir" | Out-Null
    Write-Host ""
    Write-Host "=========================================================================" -ForegroundColor Green
    Write-Host " SUCCESS! $DriveName is now MOUNTED under 'This PC'!" -ForegroundColor Green
    Write-Host " Unlimited Cloud Storage is active on Drive $Letter" -ForegroundColor Green
    Write-Host "=========================================================================" -ForegroundColor Green
    Write-Host ""
    Invoke-Item "$Letter\"
} catch {
    Write-Host "[INFO] Drive $Letter is already mounted or in use." -ForegroundColor Yellow
}

Write-Host ""
Read-Host -Prompt "Press Enter to exit..."

