import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import {
  X, HardDrive, Trash2, Sparkles, Monitor, Download,
  CheckCircle2, Zap, ArrowRight, FolderOpen, Info
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

  const [driveName, setDriveName] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('Z:');
  const [syncDrive, setSyncDrive] = useState('D:');
  const [customPath, setCustomPath] = useState('');
  const [justCreated, setJustCreated] = useState(null);

  if (!isDriveModalOpen) return null;

  const driveLetters = ['Z:', 'Y:', 'X:', 'W:', 'V:', 'U:', 'T:', 'S:', 'R:', 'P:', 'O:', 'N:', 'M:', 'L:'];
  const usedLetters = mountedDrives.map(d => d.driveLetter);

  // Where the local staging folder will be placed - user's chosen drive, NOT C:
  const getVaultBase = () => {
    if (customPath.trim()) return customPath.trim().replace(/\\$/, '');
    return `${syncDrive}\\StorageBank_Vault`;
  };

  const buildBat = (letter, name) => {
    const safeName = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const vaultBase = getVaultBase();
    const vaultPath = `${vaultBase}\\${safeName}`;

    return [
      `@echo off`,
      `title Storage Bank Unlimited - Creating Drive ${letter} (${name})`,
      `color 0A`,
      `echo.`,
      `echo  ======================================================`,
      `echo   STORAGE BANK UNLIMITED VAULT DRIVE SETUP`,
      `echo   Drive Name   : ${name}`,
      `echo   Drive Letter : ${letter}`,
      `echo   Vault Path   : ${vaultPath}`,
      `echo   Real Storage : UNLIMITED (Browser Vault - NO C Drive used)`,
      `echo  ======================================================`,
      `echo.`,
      ``,
      `set "VAULT=${vaultPath}"`,
      ``,
      `:: Create staging folder on your chosen drive (NOT C:)`,
      `if not exist "%VAULT%" (`,
      `    mkdir "%VAULT%"`,
      `    echo  [OK] Created vault staging folder: %VAULT%`,
      `) else (`,
      `    echo  [OK] Vault folder already exists: %VAULT%`,
      `)`,
      ``,
      `:: Remove any existing mapping for this letter`,
      `subst ${letter} /d >nul 2>&1`,
      ``,
      `:: Mount your chosen drive path as a virtual drive`,
      `subst ${letter} "%VAULT%"`,
      ``,
      `if %errorlevel% equ 0 (`,
      `    echo.`,
      `    echo  ======================================================`,
      `    echo   SUCCESS! Drive ${letter} is LIVE`,
      `    echo   This folder is a SYNC STAGING area only.`,
      `    echo   ALL files sync automatically to your browser vault`,
      `    echo   which has UNLIMITED storage (IndexedDB + Cloud).`,
      `    echo   Your ${syncDrive} drive is NOT your primary storage!`,
      `    echo  ======================================================`,
      `    echo.`,
      `    echo  Opening Drive ${letter} in File Explorer...`,
      `    start "" explorer.exe "${letter}\\"`,
      `) else (`,
      `    echo  [ERROR] Could not mount drive. Run this file as Administrator.`,
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
    a.download = `Create-StorageDrive-${letter.replace(':', '')}-${name.replace(/[^a-zA-Z0-9]/g, '_')}.bat`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreate = () => {
    const name = driveName.trim() || `Storage Bank ${selectedLetter}`;
    if (usedLetters.includes(selectedLetter)) {
      addToast(`Drive ${selectedLetter} is already registered. Pick another letter.`, 'warning');
      return;
    }
    const drive = registerDrive(name, selectedLetter);
    downloadBat(selectedLetter, name);
    setJustCreated({ ...drive, name, letter: selectedLetter, path: getVaultBase() });
    setDriveName('');
    setTimeout(() => setJustCreated(null), 8000);
  };

  const commonDrives = ['D:', 'E:', 'F:', 'G:', 'H:', 'I:', 'J:'];

  return (
    <div className="modal-overlay" style={{ zIndex: 3500 }} onClick={() => setIsDriveModalOpen(false)}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '600px', width: '92vw', borderRadius: '24px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Windows Unlimited Drive Creator</h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Storage Bank vault — no C: drive used • truly unlimited</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setIsDriveModalOpen(false)}><X size={18} /></button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* How storage works */}
          <div style={{ background: 'linear-gradient(135deg,rgba(6,182,212,0.08),rgba(16,185,129,0.08))', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '14px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Info size={16} color="#06b6d4" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#06b6d4', marginBottom: '6px' }}>
                  How the Storage Works — No C: Drive!
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[
                    ['🪣', 'Real storage = Storage Bank browser vault (IndexedDB + Cloud)', '#10b981'],
                    ['💾', 'A tiny staging folder is created on YOUR chosen drive (not C:)', '#06b6d4'],
                    ['⚡', 'Files dropped into the drive are auto-uploaded to the vault and freed', '#f59e0b'],
                    ['∞', 'Vault has truly unlimited storage — not limited by any local disk', '#a78bfa'],
                  ].map(([icon, text, color]) => (
                    <div key={text} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                      <span style={{ color }}>{icon}</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Creator Form */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={15} color="var(--accent-primary)" /> Create Drive — One Click
            </h4>

            {/* Drive Name */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Drive Name</label>
              <input
                type="text"
                placeholder='e.g. "Work Backup", "Gaming Assets", "Photo Archive"'
                value={driveName}
                onChange={e => setDriveName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                style={{ width: '100%', padding: '10px 13px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Which physical drive for staging (NOT C:) */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Staging Folder Drive <span style={{ color: '#10b981', fontWeight: 800 }}>(NOT C: — your own drive)</span>
              </label>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {commonDrives.map(drv => (
                  <button
                    key={drv}
                    type="button"
                    onClick={() => { setSyncDrive(drv); setCustomPath(''); }}
                    style={{
                      padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700,
                      border: syncDrive === drv && !customPath.trim() ? '2px solid #10b981' : '1px solid var(--border-subtle)',
                      background: syncDrive === drv && !customPath.trim() ? 'rgba(16,185,129,0.15)' : 'transparent',
                      color: syncDrive === drv && !customPath.trim() ? '#10b981' : 'var(--text-secondary)',
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    {drv}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder='Or type a custom path, e.g. E:\MyStorage or F:\Vault'
                value={customPath}
                onChange={e => setCustomPath(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '9px', background: 'rgba(0,0,0,0.3)', border: customPath.trim() ? '1px solid #10b981' : '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ marginTop: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Staging folder will be at: <code style={{ color: '#06b6d4', background: 'rgba(6,182,212,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{getVaultBase()}\{(driveName.trim() || 'StorageBank').replace(/[^a-zA-Z0-9_\-]/g, '_')}</code>
              </div>
            </div>

            {/* Drive Letter Picker */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Virtual Drive Letter
              </label>
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
                        textDecoration: isUsed ? 'line-through' : 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Create Button */}
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              style={{ width: '100%', padding: '13px', borderRadius: '12px', fontWeight: 800, gap: '10px', justifyContent: 'center', fontSize: '0.95rem', background: 'linear-gradient(135deg,#6366f1,#06b6d4)' }}
            >
              <Zap size={16} />
              Create Drive {selectedLetter} + Download .BAT Script
              <ArrowRight size={16} />
            </button>

            {/* Steps */}
            <div style={{ marginTop: '12px', display: 'flex', gap: '5px', flexDirection: 'column' }}>
              {[
                `Drive is registered in Storage Bank instantly`,
                `.BAT script auto-downloads to your Downloads folder`,
                `Right-click the .BAT → Run as Administrator`,
                `Drive ${selectedLetter} appears in This PC — staging on ${customPath.trim() || syncDrive}, data in unlimited vault`,
                `Drop files into Drive ${selectedLetter} → auto-sync to unlimited browser vault`
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: '17px', height: '17px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', color: 'var(--accent-primary)', fontSize: '0.64rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Success State */}
          {justCreated && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '16px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <CheckCircle2 size={20} color="#10b981" />
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>
                  Drive "{justCreated.name}" ({justCreated.letter}) Created!
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px 12px', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>⚡ Final step: </span>
                Find <code style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: '4px' }}>Create-StorageDrive-{justCreated.letter.replace(':', '')}-*.bat</code> in Downloads
                → <strong>Right-click → Run as Administrator</strong><br />
                Staging folder: <code style={{ color: '#06b6d4' }}>{justCreated.path}</code> (NOT C:)<br />
                Real storage: <strong style={{ color: '#a78bfa' }}>∞ Unlimited Storage Bank Vault</strong>
              </div>
            </div>
          )}

          {/* Active Drives */}
          {mountedDrives.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Monitor size={15} color="var(--accent-primary)" />
                Active Drives ({mountedDrives.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {mountedDrives.map(drive => (
                  <div key={drive.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Monitor size={16} color="var(--accent-primary)" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                          {drive.name} <span style={{ color: '#f59e0b', fontSize: '0.78rem' }}>({drive.driveLetter})</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          <span style={{ color: '#10b981', fontWeight: 700 }}>∞ UNLIMITED</span> · {drive.status} · {drive.mountedAt}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => unmountDrive(drive.id)}
                      style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
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
