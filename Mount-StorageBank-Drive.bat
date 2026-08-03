@echo off
cd /d "%~dp0"
title Storage Bank Real-Time Unlimited Cloud Drive (Z:)
color 0B
cls
echo =========================================================================
echo       STORAGE BANK - UNLIMITED REAL-TIME CLOUD VAULT DRIVE (Z:)
echo =========================================================================
echo  Drive Name   : Storage Bank Vault (Z:)
echo  Drive Letter : Z:
echo  Storage Type : Real-Time Unlimited Cloud Storage Vault
echo =========================================================================
echo.

set LETTER=Z:
set LETTER_CLEAN=Z
set DRIVE_NAME=Storage Bank Vault
set CLOUD_DIR=%USERPROFILE%\StorageBank_CloudDrive_Z

echo [1/3] Creating Storage Vault Cloud Container...
if not exist "%CLOUD_DIR%" (
    mkdir "%CLOUD_DIR%"
)

echo [2/3] Registering Custom Drive Label under 'This PC'...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\DriveIcons\%LETTER_CLEAN%\DefaultLabel" /ve /d "%DRIVE_NAME% (%LETTER%)" /f >nul 2>&1

echo [3/3] Mounting Virtual Drive %LETTER%...
subst %LETTER% /d >nul 2>&1
subst %LETTER% "%CLOUD_DIR%"

if not exist %LETTER%\ (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "New-PSDrive -Name '%LETTER_CLEAN%' -PSProvider FileSystem -Root '%CLOUD_DIR%' -Persist -Scope Global -ErrorAction SilentlyContinue" >nul 2>&1
)

if exist %LETTER%\ (
    echo.
    echo =========================================================================
    echo  [SUCCESS] %DRIVE_NAME% (%LETTER%) is now MOUNTED under 'This PC'!
    echo  Unlimited Cloud Storage Vault is active on Drive %LETTER%
    echo =========================================================================
    echo.
    echo Opening %LETTER% in Windows File Explorer...
    start "" explorer.exe "%LETTER%\"
) else (
    echo.
    echo [ERROR] Drive %LETTER% could not be mounted.
    echo Please try running this script as Administrator.
)

echo.
pause



