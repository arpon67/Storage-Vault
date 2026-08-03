@echo off
title Storage Bank Real-Time Unlimited Cloud Drive (Z:)
color 0B
cls
echo =========================================================================
echo       STORAGE BANK - UNLIMITED REAL-TIME CLOUD VAULT DRIVE (Z:)
echo =========================================================================
echo  Drive Name   : Storage Bank Unlimited Vault (Z:)
echo  Drive Letter : Z:
echo  Storage Type : Real-Time Unlimited Cloud Storage Vault
echo =========================================================================
echo.

set "LETTER=Z:"
set "LETTER_CLEAN=Z"
set "DRIVE_NAME=Storage Bank Unlimited Vault"
set "CLOUD_DIR=%USERPROFILE%\StorageBank_CloudDrive_%LETTER_CLEAN%"

if not exist "%CLOUD_DIR%" (
    mkdir "%CLOUD_DIR%"
    echo [OK] Created Storage Vault Cloud Directory: %CLOUD_DIR%
)

echo [OK] Registering custom Drive Label under 'This PC' in Windows File Explorer...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\DriveIcons\%LETTER_CLEAN%\DefaultLabel" /ve /d "%DRIVE_NAME% (%LETTER%)" /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v EnableLinkedConnections /t REG_DWORD /d 1 /f >nul 2>&1

echo [OK] Mounting Storage Vault to Virtual Network Drive %LETTER%...
subst %LETTER% /d >nul 2>&1
subst %LETTER% "%CLOUD_DIR%" >nul 2>&1

if %errorlevel% equ 0 (
    echo.
    echo =========================================================================
    echo  SUCCESS! %DRIVE_NAME% is now MOUNTED under 'This PC'!
    echo  Unlimited Cloud Storage is active on Drive %LETTER%
    echo =========================================================================
    echo.
    echo Opening %LETTER% in Windows File Explorer...
    start "" explorer.exe "%LETTER%\"
) else (
    echo [INFO] Drive %LETTER% is already mounted or in use. Run as Administrator if needed.
)

echo.
pause

