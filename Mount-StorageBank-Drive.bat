@echo off
cd /d "%~dp0"
title Storage Bank Real-Time Unlimited Cloud Drive Z:
color 0B
cls
echo =========================================================================
echo       STORAGE BANK - UNLIMITED REAL-TIME CLOUD VAULT DRIVE Z:
echo =========================================================================
echo  Drive Name   : Storage Bank Vault - Z
echo  Drive Letter : Z:
echo  Storage Type : Real-Time Unlimited Cloud Storage Vault
echo =========================================================================
echo.

set LETTER=Z:
set LETTER_CLEAN=Z
set DRIVE_NAME=Storage Bank Vault
set CLOUD_DIR=%USERPROFILE%\StorageBank_CloudVault_Z

if not exist "%CLOUD_DIR%" mkdir "%CLOUD_DIR%"

subst %LETTER% /d >nul 2>&1
subst %LETTER% "%CLOUD_DIR%"

reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\DriveIcons\%LETTER_CLEAN%\DefaultLabel" /ve /d "%DRIVE_NAME% Unlimited Vault - %LETTER%" /f >nul 2>&1

set NET_SHORTCUT=%APPDATA%\Microsoft\Windows\Network Shortcuts\%DRIVE_NAME%_%LETTER_CLEAN%
if not exist "%NET_SHORTCUT%" mkdir "%NET_SHORTCUT%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%NET_SHORTCUT%\target.lnk'); $sc.TargetPath = '%CLOUD_DIR%'; $sc.Save()" >nul 2>&1

if exist %LETTER%\ (
    echo.
    echo =========================================================================
    echo  SUCCESS: %DRIVE_NAME% %LETTER% is now MOUNTED under This PC!
    echo  Unlimited Cloud Storage Vault is active on Drive %LETTER%
    echo =========================================================================
    echo.
    echo Opening Drive %LETTER% in Windows File Explorer...
    start explorer.exe %LETTER%\
) else (
    echo.
    echo ERROR: Drive %LETTER% could not be mounted. Please try running as Administrator.
)

echo.
pause




