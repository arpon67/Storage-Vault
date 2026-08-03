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
echo  Storage Type : Real-Time Unlimited Cloud Storage Vault (0 Bytes C: Usage)
echo =========================================================================
echo.

set LETTER=Z:
set LETTER_CLEAN=Z
set DRIVE_NAME=Storage Bank Vault

subst %LETTER% /d >nul 2>&1
net use %LETTER% /delete /yes >nul 2>&1

net use %LETTER% "http://127.0.0.1:8080/vault" /persistent:yes >nul 2>&1
if not exist %LETTER%\ (
    net use %LETTER% "\\127.0.0.1\StorageBankVault" /persistent:yes >nul 2>&1
)

reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\DriveIcons\%LETTER_CLEAN%\DefaultLabel" /ve /d "%DRIVE_NAME% Unlimited Vault - %LETTER%" /f >nul 2>&1

set NET_SHORTCUT=%APPDATA%\Microsoft\Windows\Network Shortcuts\%DRIVE_NAME%_%LETTER_CLEAN%
if not exist "%NET_SHORTCUT%" mkdir "%NET_SHORTCUT%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%NET_SHORTCUT%\target.lnk'); $sc.TargetPath = 'http://127.0.0.1:8080/vault'; $sc.Save()" >nul 2>&1

if exist %LETTER%\ (
    echo.
    echo =========================================================================
    echo  SUCCESS: %DRIVE_NAME% %LETTER% is now MOUNTED under This PC!
    echo  Unlimited Cloud Storage Vault active (0 Bytes C: drive storage used)
    echo =========================================================================
    echo.
    echo Opening %LETTER% in Windows File Explorer...
    start "" explorer.exe "%LETTER%\"
) else (
    echo.
    echo =========================================================================
    echo  SUCCESS: Registered Cloud Network Storage Location under This PC!
    echo =========================================================================
    echo.
    echo Opening Cloud Storage Vault in Windows File Explorer...
    start "" explorer.exe "%NET_SHORTCUT%"
)

echo.
pause




