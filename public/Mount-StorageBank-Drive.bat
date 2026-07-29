@echo off
title Storage Bank Windows Virtual Drive Mount Script
color 0A
echo ===================================================
echo     STORAGE BANK WINDOWS VIRTUAL DRIVE MOUNT
echo ===================================================
echo.

set "VAULT_DIR=%USERPROFILE%\StorageBank_Vault"
set "DRIVE_LETTER=Z:"

if not exist "%VAULT_DIR%" (
    mkdir "%VAULT_DIR%"
    echo [OK] Created Local Storage Vault directory: %VAULT_DIR%
)

echo [OK] Mounting Storage Bank Vault to Virtual Drive %DRIVE_LETTER%...
subst %DRIVE_LETTER% "%VAULT_DIR%" >nul 2>&1

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo  SUCCESS! Mounted Storage Bank Drive to %DRIVE_LETTER%
    echo  Open 'This PC' in File Explorer to view Drive %DRIVE_LETTER%
    echo ===================================================
) else (
    echo [INFO] Drive %DRIVE_LETTER% is already mounted or in use.
)

echo.
pause
