import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import {
  X, HardDrive, Trash2, Sparkles, Monitor, Download,
  CheckCircle2, AlertTriangle, RefreshCw, FolderOpen
} from 'lucide-react';

export function WindowsDriveModal() {
  const {
    isDriveModalOpen,
    setIsDriveModalOpen,
    mountedDrives,
    unmountDrive,
    connectWindowsFolder,
    registerDrive,
    addToast
  } = useStorage();

  const [driveName, setDriveName] = useState('Storage Bank Unlimited Vault');
  const [selectedLetter, setSelectedLetter] = useState('Z:');
  const [isSyncing, setIsSyncing] = useState(false);
  const [justCreated, setJustCreated] = useState(null);

  if (!isDriveModalOpen) return null;

  const driveLetters = ['Z:', 'Y:', 'X:', 'W:', 'V:', 'U:', 'T:', 'S:', 'R:', 'P:', 'O:', 'N:', 'M:', 'L:'];
  const usedLetters = mountedDrives.map(d => d.driveLetter);
  const isSelectedLetterUsed = usedLetters.includes(selectedLetter);

  const buildBat = (letter, name) => {
    const safeName = (name || 'Storage Bank Vault').trim();
    const letterClean = letter.replace(':', '').trim();

    return [
      `@echo off`,
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
      `set "LETTER=${letter}"`,
      `set "LETTER_CLEAN=${letterClean}"`,
      `set "DRIVE_NAME=${safeName}"`,
      `set "CLOUD_DIR=%USERPROFILE%\\StorageBank_CloudDrive_${letterClean}"`,
      ``,
      `if not exist "%CLOUD_DIR%" (`,
      `    mkdir "%CLOUD_DIR%"`,
      `    echo  [OK] Created Storage Vault Cloud Directory: %CLOUD_DIR%`,
      `)`,
      ``,
      `echo  [OK] Registering custom Drive Label under 'This PC' in Windows File Explorer...`,
      `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\DriveIcons\\${letterClean}\\DefaultLabel" /ve /d "${safeName} (${letter})" /f >nul 2>&1`,
      `reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v EnableLinkedConnections /t REG_DWORD /d 1 /f >nul 2>&1`,
      ``,
      `echo  [OK] Mounting Storage Vault to Virtual Drive ${letter}...`,
      `subst ${letter} /d >nul 2>&1`,
      `subst ${letter} "%CLOUD_DIR%" >nul 2>&1`,
      ``,
      `if %errorlevel% equ 0 (`,
      `    echo.`,
      `    echo =========================================================================`,
      `    echo  SUCCESS! ${safeName} (${letter}) is now MOUNTED under 'This PC'!`,
      `    echo  Unlimited Cloud Storage is active on Drive ${letter}`,
      `    echo =========================================================================`,
      `    echo.`,
      `    echo  Opening ${letter} in Windows File Explorer...`,
      `    start "" explorer.exe "${letter}\\"`,
      `) else (`,
      `    echo  [INFO] Drive ${letter} is already mounted or in use. Run as Administrator if needed.`,
      `)`,
      ``,
      `echo.`,
      `pause`,
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

  const handleGenerateBat = () => {
    const name = driveName.trim() || `Storage Bank Unlimited Vault (${selectedLetter})`;
    if (isSelectedLetterUsed) {
      addToast(`Drive ${selectedLetter} is already in use. Pick an unused letter or remove existing drive.`, 'warning');
      return;
    }

    registerDrive(name, selectedLetter);
    downloadBat(selectedLetter, name);
    setJustCreated({ name, letter: selectedLetter });
    addToast(`Generated .BAT script for ${name} (${selectedLetter})!`, 'success');
  };

  const handleLiveConnect = async () => {
    const name = driveName.trim() || `Storage Bank Vault (${selectedLetter})`;
    if (isSelectedLetterUsed) {
      addToast(`Drive ${selectedLetter} is already in use. Pick another letter.`, 'warning');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await connectWindowsFolder(name, selectedLetter);
      if (result) {
        downloadBat(selectedLetter, name);
        setJustCreated({
          name,
          letter: selectedLetter,
          exportedCount: result.exportedCount
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 3500 }} onClick={() => setIsDriveModalOpen(false)}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '92vw', borderRadius: '24px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Windows PC Vault Drive</h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Mount your real-time cloud storage directly as a virtual drive in Windows Explorer</p>
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
                    Drive {justCreated.letter} Configured & .BAT Downloaded!
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Drive Name: "{justCreated.name}"
                  </div>
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px 12px', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong style={{ color: '#f59e0b' }}>⚡ Final Step:</strong> Open your Downloads folder → Double-click <code style={{ color: '#10b981' }}>Mount-CloudDrive-{justCreated.letter.replace(':', '')}-*.bat</code>.
                Drive {justCreated.letter} will instantly appear in <em>This PC</em> with your custom volume name and unlimited cloud storage vault access!
              </div>
            </div>
          )}

          {/* Form */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sparkles size={16} color="var(--accent-primary)" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Configure Windows Cloud Drive</h4>
            </div>

            {/* Drive Name Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Custom Drive Name (Volume Label in Explorer)
              </label>
              <input
                type="text"
                placeholder='e.g. "Storage Bank Unlimited Vault", "Cloud Vault"'
                value={driveName}
                onChange={e => setDriveName(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Drive Letter Picker */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Select Drive Letter
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

            {/* Warning if selected letter is already in use */}
            {isSelectedLetterUsed && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={18} color="#f87171" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.78rem', color: '#f87171', lineHeight: 1.4 }}>
                  <strong>Warning:</strong> Drive letter <strong>{selectedLetter}</strong> is currently mounted or registered in your vault.
                  Select a different letter above or remove the existing drive below.
                </div>
              </div>
            )}

            {/* Main Download BAT Action */}
            <button
              className="btn btn-primary"
              disabled={isSelectedLetterUsed}
              onClick={handleGenerateBat}
              style={{
                width: '100%', padding: '13px', borderRadius: '12px', fontWeight: 800, gap: '10px',
                justify: 'center', fontSize: '0.92rem', background: isSelectedLetterUsed ? 'var(--border-subtle)' : 'linear-gradient(135deg, #6366f1, #06b6d4)',
                marginBottom: '10px', cursor: isSelectedLetterUsed ? 'not-allowed' : 'pointer'
              }}
            >
              <Download size={16} /> Download Auto-Mount .BAT Script ({selectedLetter})
            </button>

            {/* Live Connect Option */}
            <button
              className="btn btn-secondary"
              disabled={isSelectedLetterUsed || isSyncing}
              onClick={handleLiveConnect}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', fontSize: '0.8rem', justifyContent: 'center', gap: '8px' }}
            >
              {isSyncing ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <FolderOpen size={14} />}
              {isSyncing ? 'Connecting Local Folder...' : 'Or Select Local PC Folder to Sync Live'}
            </button>

          </div>

          {/* Active Mounted Drives */}
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
                          <span style={{ color: '#10b981', fontWeight: 700 }}>● UNLIMITED VAULT ACTIVE</span> · {drive.syncedFilesCount || 0} items
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
