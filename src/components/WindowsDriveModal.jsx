import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import {
  X, HardDrive, Trash2, Sparkles, Monitor, Download,
  CheckCircle2, Zap, ArrowRight, FolderOpen, RefreshCw, Check
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

  const [driveName, setDriveName] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('Z:');
  const [syncDrive, setSyncDrive] = useState('D:');
  const [customPath, setCustomPath] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [justCreated, setJustCreated] = useState(null);

  if (!isDriveModalOpen) return null;

  const driveLetters = ['Z:', 'Y:', 'X:', 'W:', 'V:', 'U:', 'T:', 'S:', 'R:', 'P:', 'O:', 'N:', 'M:', 'L:'];
  const usedLetters = mountedDrives.map(d => d.driveLetter);

  const getVaultBase = () => {
    if (customPath.trim()) return customPath.trim().replace(/\\$/, '');
    return `${syncDrive}\\StorageBank_Vault`;
  };

  const buildBat = (letter, name, folderName = null) => {
    const safeName = (name || 'Vault').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const vaultBase = getVaultBase();
    const vaultPath = folderName ? `%USERPROFILE%\\${folderName}` : `${vaultBase}\\${safeName}`;

    return [
      `@echo off`,
      `title Storage Bank Real-Time Connected Drive (${letter})`,
      `color 0A`,
      `echo.`,
      `echo  ======================================================`,
      `echo   STORAGE BANK REAL-TIME CONNECTED VAULT DRIVE`,
      `echo   Drive Name   : ${name}`,
      `echo   Drive Letter : ${letter}`,
      `echo   Vault Path   : ${vaultPath}`,
      `echo   Sync Status  : LIVE BI-DIRECTIONAL VAULT SYNC`,
      `echo  ======================================================`,
      `echo.`,
      ``,
      `set "VAULT=${vaultPath}"`,
      ``,
      `if not exist "%VAULT%" (`,
      `    mkdir "%VAULT%"`,
      `    echo  [OK] Created vault staging directory: %VAULT%`,
      `) else (`,
      `    echo  [OK] Vault directory ready: %VAULT%`,
      `)`,
      ``,
      `:: Unmount existing if any`,
      `subst ${letter} /d >nul 2>&1`,
      ``,
      `:: Mount Virtual Drive`,
      `subst ${letter} "%VAULT%"`,
      ``,
      `if %errorlevel% equ 0 (`,
      `    echo.`,
      `    echo  ======================================================`,
      `    echo   SUCCESS! Drive ${letter} is connected to your Vault!`,
      `    echo   Open 'This PC' in File Explorer to access Drive ${letter}`,
      `    echo  ======================================================`,
      `    echo.`,
      `    echo  Opening Drive ${letter} in File Explorer...`,
      `    start "" explorer.exe "${letter}\\"`,
      `) else (`,
      `    echo  [ERROR] Mount failed. Run this file as Administrator.`,
      `)`,
      ``,
      `echo.`,
      `pause`,
    ].join('\r\n');
  };

  const downloadBat = (letter, name, folderName = null) => {
    const content = buildBat(letter, name, folderName);
    const blob = new Blob([content], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mount-ConnectedDrive-${letter.replace(':', '')}-${(name || 'Vault').replace(/[^a-zA-Z0-9]/g, '_')}.bat`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 1-Click Live Connect: Pick Folder + Export All Vault Items + Auto Download BAT
  const handleLiveConnect = async () => {
    const name = driveName.trim() || `Storage Bank (${selectedLetter})`;
    if (usedLetters.includes(selectedLetter)) {
      addToast(`Drive ${selectedLetter} is already in use. Pick another letter.`, 'warning');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await connectWindowsFolder(name, selectedLetter);
      if (result) {
        downloadBat(selectedLetter, name, result.dirHandle?.name);
        setJustCreated({
          name,
          letter: selectedLetter,
          exportedCount: result.exportedCount,
          folderName: result.dirHandle?.name
        });
        setDriveName('');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Quick BAT only option
  const handleQuickBat = () => {
    const name = driveName.trim() || `Storage Bank ${selectedLetter}`;
    registerDrive(name, selectedLetter);
    downloadBat(selectedLetter, name);
    setJustCreated({ name, letter: selectedLetter, exportedCount: 0 });
    setDriveName('');
  };

  const commonDrives = ['D:', 'E:', 'F:', 'G:', 'H:', 'I:', 'J:'];

  return (
    <div className="modal-overlay" style={{ zIndex: 3500 }} onClick={() => setIsDriveModalOpen(false)}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '620px', width: '92vw', borderRadius: '24px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Windows PC Vault Drive</h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Connect your Storage Vault as a real Windows Drive letter</p>
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
                    Drive {justCreated.letter} Connected & .BAT Downloaded!
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Exported {justCreated.exportedCount} vault item(s) directly to local disk folder
                  </div>
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px 12px', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong style={{ color: '#f59e0b' }}>⚡ Final Step:</strong> Open your Downloads folder → Right-click <code style={{ color: '#10b981' }}>Mount-ConnectedDrive-{justCreated.letter.replace(':', '')}-*.bat</code> → <strong>Run as Administrator</strong>.
                Drive {justCreated.letter} will open in <em>This PC</em> containing <strong>100% of your vault files and folders!</strong>
              </div>
            </div>
          )}

          {/* Connected Drive Config Form */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sparkles size={16} color="var(--accent-primary)" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Connect Vault to Real Windows Drive Letter</h4>
            </div>

            {/* Drive Name */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Custom Drive Name</label>
              <input
                type="text"
                placeholder='e.g. "My Storage Vault", "Projects", "Backup Drive"'
                value={driveName}
                onChange={e => setDriveName(e.target.value)}
                style={{ width: '100%', padding: '10px 13px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Letter Picker */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select Drive Letter</label>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {driveLetters.map(letter => {
                  const isUsed = usedLetters.includes(letter);
                  const isSelected = selectedLetter === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={isUsed}
                      onClick={() => !isUsed && setSelectedLetter(letter)}
                      style={{
                        padding: '5px 11px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                        border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        background: isUsed ? 'rgba(255,255,255,0.02)' : isSelected ? 'var(--accent-primary)' : 'transparent',
                        color: isUsed ? 'var(--border-subtle)' : isSelected ? '#fff' : 'var(--text-secondary)',
                        cursor: isUsed ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Local Staging Drive (NOT C:) */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Staging Drive <span style={{ color: '#10b981', fontWeight: 800 }}>(Pick your drive, NOT C:)</span>
              </label>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '6px' }}>
                {commonDrives.map(drv => (
                  <button
                    key={drv}
                    type="button"
                    onClick={() => { setSyncDrive(drv); setCustomPath(''); }}
                    style={{
                      padding: '5px 11px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                      border: syncDrive === drv && !customPath.trim() ? '2px solid #10b981' : '1px solid var(--border-subtle)',
                      background: syncDrive === drv && !customPath.trim() ? 'rgba(16,185,129,0.15)' : 'transparent',
                      color: syncDrive === drv && !customPath.trim() ? '#10b981' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {drv}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              className="btn btn-primary"
              disabled={isSyncing}
              onClick={handleLiveConnect}
              style={{
                width: '100%', padding: '13px', borderRadius: '12px', fontWeight: 800, gap: '10px',
                justify: 'center', fontSize: '0.92rem', background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                marginBottom: '10px'
              }}
            >
              {isSyncing ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FolderOpen size={16} />}
              {isSyncing ? 'Exporting Vault & Connecting...' : `Connect & Export Vault to Drive ${selectedLetter}`}
            </button>

            {/* Alternative Quick BAT Button */}
            <button
              className="btn btn-secondary"
              onClick={handleQuickBat}
              style={{ width: '100%', padding: '9px', borderRadius: '10px', fontSize: '0.78rem', justifyContent: 'center', gap: '6px' }}
            >
              <Download size={14} /> Quick Download .BAT Script Only
            </button>

          </div>

          {/* Active Mounted Devices */}
          {mountedDrives.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Monitor size={15} color="var(--accent-primary)" />
                Connected Drives ({mountedDrives.length})
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
                          <span style={{ color: '#10b981', fontWeight: 700 }}>● BI-DIRECTIONAL SYNC ACTIVE</span> · {drive.syncedFilesCount} files
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => downloadBat(drive.driveLetter, drive.name, drive.folderName)}
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
