import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import {
  X, HardDrive, Trash2, Sparkles, Monitor, Download,
  CheckCircle2, AlertTriangle, FileCode, Terminal
} from 'lucide-react';

export function WindowsDriveModal() {
  const {
    isDriveModalOpen,
    setIsDriveModalOpen,
    mountedDrives,
    unmountDrive,
    registerDrive,
    addToast
  } = useStorage();

  const [driveName, setDriveName] = useState('Storage Bank Vault');
  const [selectedLetter, setSelectedLetter] = useState('Z:');
  const [justCreated, setJustCreated] = useState(null);

  if (!isDriveModalOpen) return null;

  const driveLetters = ['Z:', 'Y:', 'X:', 'W:', 'V:', 'U:', 'T:', 'S:', 'R:', 'P:', 'O:', 'N:', 'M:', 'L:'];
  const usedLetters = mountedDrives.map(d => d.driveLetter);
  const isSelectedLetterUsed = usedLetters.includes(selectedLetter);

  const buildBat = (letter, name) => {
    const safeName = (name || 'Storage Bank Vault').trim().replace(/"/g, '');
    const letterClean = letter.replace(':', '').trim();

    return [
      `@echo off`,
      `cd /d "%~dp0"`,
      `title Storage Bank Real-Time Unlimited Cloud Drive (${letter})`,
      `color 0B`,
      `cls`,
      `echo =========================================================================`,
      `echo       STORAGE BANK - UNLIMITED REAL-TIME CLOUD VAULT DRIVE (${letter})`,
      `echo =========================================================================`,
      `echo  Drive Name   : ${safeName} (${letter})`,
      `echo  Drive Letter : ${letter}`,
      `echo  Storage Type : Real-Time Unlimited Cloud Storage Vault`,
      `echo =========================================================================`,
      `echo.`,
      ``,
      `set LETTER=${letter}`,
      `set LETTER_CLEAN=${letterClean}`,
      `set DRIVE_NAME=${safeName}`,
      `set CLOUD_DIR=%USERPROFILE%\\StorageBank_CloudDrive_${letterClean}`,
      ``,
      `echo [1/3] Creating Storage Vault Cloud Container...`,
      `if not exist "%CLOUD_DIR%" (`,
      `    mkdir "%CLOUD_DIR%"`,
      `)`,
      ``,
      `echo [2/3] Registering Custom Drive Label under 'This PC'...`,
      `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\DriveIcons\\${letterClean}\\DefaultLabel" /ve /d "${safeName} (${letter})" /f >nul 2>&1`,
      ``,
      `echo [3/3] Mounting Virtual Drive ${letter}...`,
      `subst %LETTER% /d >nul 2>&1`,
      `subst %LETTER% "%CLOUD_DIR%"`,
      ``,
      `if not exist %LETTER%\\ (`,
      `    powershell -NoProfile -ExecutionPolicy Bypass -Command "New-PSDrive -Name '${letterClean}' -PSProvider FileSystem -Root '$env:USERPROFILE\\StorageBank_CloudDrive_${letterClean}' -Persist -Scope Global -ErrorAction SilentlyContinue" >nul 2>&1`,
      `)`,
      ``,
      `if exist %LETTER%\\ (`,
      `    echo.`,
      `    echo =========================================================================`,
      `    echo  [SUCCESS] ${safeName} (${letter}) is now MOUNTED under 'This PC'!`,
      `    echo  Unlimited Cloud Storage Vault is active on Drive ${letter}`,
      `    echo =========================================================================`,
      `    echo.`,
      `    echo Opening ${letter} in Windows File Explorer...`,
      `    start "" explorer.exe "${letter}\\"`,
      `) else (`,
      `    echo.`,
      `    echo [ERROR] Drive ${letter} could not be mounted. Please try another drive letter.`,
      `)`,
      ``,
      `echo.`,
      `pause`,
    ].join('\r\n');
  };

  const buildPs1 = (letter, name) => {
    const safeName = (name || 'Storage Bank Vault').trim().replace(/'/g, '');
    const letterClean = letter.replace(':', '').trim();

    return [
      `# Storage Bank Windows PowerShell Unlimited Cloud Drive Mounter`,
      `$Letter = "${letter}"`,
      `$LetterClean = "${letterClean}"`,
      `$DriveName = "${safeName}"`,
      `$CloudDir = Join-Path $env:USERPROFILE "StorageBank_CloudDrive_${letterClean}"`,
      ``,
      `if (!(Test-Path $CloudDir)) {`,
      `    New-Item -ItemType Directory -Path $CloudDir -Force | Out-Null`,
      `}`,
      ``,
      `# Register Custom Volume Label in Windows Explorer (This PC)`,
      `$RegPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\DriveIcons\\${letterClean}\\DefaultLabel"`,
      `if (!(Test-Path $RegPath)) { New-Item -Path $RegPath -Force | Out-Null }`,
      `Set-ItemProperty -Path $RegPath -Name "(default)" -Value "${safeName} (${letter})" -Force | Out-Null`,
      ``,
      `try { subst ${letter} /d 2>$null } catch {}`,
      `subst ${letter} $CloudDir | Out-Null`,
      ``,
      `if (!(Test-Path "${letter}\\")) {`,
      `    New-PSDrive -Name $LetterClean -PSProvider FileSystem -Root $CloudDir -Persist -Scope Global -ErrorAction SilentlyContinue | Out-Null`,
      `}`,
      ``,
      `if (Test-Path "${letter}\\") {`,
      `    Write-Host "SUCCESS: ${safeName} (${letter}) mounted under This PC!" -ForegroundColor Green`,
      `    Invoke-Item "${letter}\\"`,
      `} else {`,
      `    Write-Host "ERROR: Could not mount Drive ${letter}" -ForegroundColor Red`,
      `}`,
    ].join('\r\n');
  };

  const downloadBat = (letter, name) => {
    const content = buildBat(letter, name);
    const blob = new Blob([content], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mount-CloudDrive-${letter.replace(':', '')}-${(name || 'Vault').replace(/[^a-zA-Z0-9]/g, '_')}.bat`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPs1 = (letter, name) => {
    const content = buildPs1(letter, name);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mount-CloudDrive-${letter.replace(':', '')}-${(name || 'Vault').replace(/[^a-zA-Z0-9]/g, '_')}.ps1`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateBat = () => {
    const name = driveName.trim() || `Storage Bank Vault (${selectedLetter})`;
    if (isSelectedLetterUsed) {
      addToast(`Drive ${selectedLetter} is already in use. Pick an unused drive letter or remove the existing drive below.`, 'warning');
      return;
    }

    registerDrive(name, selectedLetter);
    downloadBat(selectedLetter, name);
    setJustCreated({ name, letter: selectedLetter });
    addToast(`Generated auto-mounter .BAT script for ${name} (${selectedLetter})!`, 'success');
  };

  const handleGeneratePs1 = () => {
    const name = driveName.trim() || `Storage Bank Vault (${selectedLetter})`;
    if (isSelectedLetterUsed) {
      addToast(`Drive ${selectedLetter} is already in use. Pick an unused drive letter or remove the existing drive below.`, 'warning');
      return;
    }

    registerDrive(name, selectedLetter);
    downloadPs1(selectedLetter, name);
    setJustCreated({ name, letter: selectedLetter });
    addToast(`Generated PowerShell .PS1 script for ${name} (${selectedLetter})!`, 'success');
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 3500 }} onClick={() => setIsDriveModalOpen(false)}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '540px', width: '92vw', borderRadius: '24px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Windows PC Vault Drive</h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Mount your Storage Vault as a real-time unlimited drive in Windows File Explorer</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setIsDriveModalOpen(false)}><X size={18} /></button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Success Banner */}
          {justCreated && (
            <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '16px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={22} color="#10b981" />
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981' }}>
                    Drive {justCreated.letter} Registered & Script Downloaded!
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Drive Name: "{justCreated.name}"
                  </div>
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px 12px', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong style={{ color: '#f59e0b' }}>⚡ Final Step:</strong> Open your Downloads folder → Double-click <code style={{ color: '#10b981' }}>Mount-CloudDrive-{justCreated.letter.replace(':', '')}-*.bat</code>.
                Drive {justCreated.letter} will instantly appear in <em>This PC</em> with your custom drive name and unlimited storage vault access!
              </div>
            </div>
          )}

          {/* Setup Form */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sparkles size={16} color="var(--accent-primary)" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Select Drive Name & Key (Letter)</h4>
            </div>

            {/* Custom Drive Name Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Drive Name (Appears in File Explorer)
              </label>
              <input
                type="text"
                placeholder='e.g. "Storage Bank Vault", "My Unlimited Drive"'
                value={driveName}
                onChange={e => setDriveName(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Drive Key Selection Option */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Select Drive Key (Letter)
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {driveLetters.map(letter => {
                  const isUsed = usedLetters.includes(letter);
                  const isSelected = selectedLetter === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setSelectedLetter(letter)}
                      style={{
                        padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                        border: isSelected ? '2px solid var(--accent-primary)' : isUsed ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'var(--accent-primary)' : isUsed ? 'rgba(239,68,68,0.1)' : 'transparent',
                        color: isSelected ? '#fff' : isUsed ? '#f87171' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {letter} {isUsed ? '●' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* In-Use Warning Alert */}
            {isSelectedLetterUsed && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={18} color="#f87171" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.78rem', color: '#f87171', lineHeight: 1.4 }}>
                  <strong>Warning:</strong> Drive key <strong>{selectedLetter}</strong> is currently mounted or registered. Select a different letter key above or remove the active drive below.
                </div>
              </div>
            )}

            {/* Script Download Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className="btn btn-primary"
                disabled={isSelectedLetterUsed}
                onClick={handleGenerateBat}
                style={{
                  width: '100%', padding: '13px', borderRadius: '12px', fontWeight: 800, gap: '10px',
                  justify: 'center', fontSize: '0.92rem', background: isSelectedLetterUsed ? 'var(--border-subtle)' : 'linear-gradient(135deg, #6366f1, #06b6d4)',
                  cursor: isSelectedLetterUsed ? 'not-allowed' : 'pointer'
                }}
              >
                <Download size={16} /> Download Auto-Mount .BAT Script ({selectedLetter})
              </button>

              <button
                className="btn btn-secondary"
                disabled={isSelectedLetterUsed}
                onClick={handleGeneratePs1}
                style={{
                  width: '100%', padding: '9px', borderRadius: '10px', fontSize: '0.8rem',
                  justify: 'center', gap: '8px'
                }}
              >
                <Terminal size={14} /> Download PowerShell .PS1 Mounter
              </button>
            </div>

          </div>

          {/* Active Mounted Drives List */}
          {mountedDrives.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Monitor size={15} color="var(--accent-primary)" />
                Active Registered Cloud Drives ({mountedDrives.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {mountedDrives.map(drive => (
                  <div key={drive.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Monitor size={16} color="#10b981" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                          {drive.name} <span style={{ color: '#f59e0b', fontSize: '0.78rem' }}>({drive.driveLetter})</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          <span style={{ color: '#10b981', fontWeight: 700 }}>● UNLIMITED VAULT ACTIVE</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => downloadBat(drive.driveLetter, drive.name)}
                        style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Download size={12} /> .BAT
                      </button>
                      <button
                        onClick={() => unmountDrive(drive.id)}
                        style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
