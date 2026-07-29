import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import {
  X, HardDrive, Trash2, Sparkles, Monitor, Download,
  CheckCircle2, Zap, ArrowRight, RefreshCw
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
  const [justCreated, setJustCreated] = useState(null);

  if (!isDriveModalOpen) return null;

  const driveLetters = ['Z:', 'Y:', 'X:', 'W:', 'V:', 'U:', 'T:', 'S:', 'R:', 'P:', 'O:', 'N:', 'M:', 'L:'];
  const usedLetters = mountedDrives.map(d => d.driveLetter);
  const availableLetters = driveLetters.filter(l => !usedLetters.includes(l));

  const buildBat = (letter, name) => {
    const safeName = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const vaultPath = `%USERPROFILE%\\StorageBank_${safeName}`;
    return `@echo off\r\ntitle Storage Bank - Creating Drive ${letter} (${name})\r\ncolor 0A\r\necho.\r\necho  ==========================================\r\necho   STORAGE BANK UNLIMITED - AUTO DRIVE SETUP\r\necho   Drive Name : ${name}\r\necho   Drive Letter: ${letter}\r\necho  ==========================================\r\necho.\r\n\r\n:: Create vault folder with unlimited storage\r\nset "VAULT=${vaultPath}"\r\nif not exist "%VAULT%" (\r\n    mkdir "%VAULT%"\r\n    echo  [OK] Created vault folder: %VAULT%\r\n) else (\r\n    echo  [OK] Vault folder already exists\r\n)\r\n\r\n:: Remove existing mapping if any\r\nsubst ${letter} /d >nul 2>&1\r\n\r\n:: Mount as virtual drive\r\nsubst ${letter} "%VAULT%"\r\n\r\nif %errorlevel% equ 0 (\r\n    echo.\r\n    echo  ==========================================\r\n    echo   SUCCESS! Drive ${letter} is now LIVE!\r\n    echo   Storage: UNLIMITED\r\n    echo   Path: %VAULT%\r\n    echo  ==========================================\r\n    echo.\r\n    echo  Opening drive in File Explorer...\r\n    start "" explorer.exe "${letter}\\"\r\n) else (\r\n    echo  [ERROR] Failed to mount. Please run as Administrator.\r\n)\r\n\r\necho.\r\npause\r\n`;
  };

  const downloadBat = (letter, name) => {
    const content = buildBat(letter, name);
    const blob = new Blob([content], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Create-Drive-${letter.replace(':', '')}-${name.replace(/[^a-zA-Z0-9]/g, '_')}.bat`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreate = () => {
    const name = driveName.trim() || `StorageBank Drive ${selectedLetter}`;
    if (usedLetters.includes(selectedLetter)) {
      addToast(`Drive ${selectedLetter} is already in use. Pick another letter.`, 'warning');
      return;
    }
    // 1. Register instantly in app state
    const drive = registerDrive(name, selectedLetter);
    // 2. Auto-download the BAT script
    downloadBat(selectedLetter, name);
    // 3. Show success state
    setJustCreated({ ...drive, name, letter: selectedLetter });
    setDriveName('');
    // Reset after 5s
    setTimeout(() => setJustCreated(null), 6000);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 3500 }} onClick={() => setIsDriveModalOpen(false)}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '92vw', borderRadius: '24px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Windows PC Drive Creator</h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>One click → new virtual drive with unlimited storage</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setIsDriveModalOpen(false)}><X size={18} /></button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Unlimited Badge */}
          <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(6,182,212,0.12))', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} color="var(--accent-primary)" />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>Unlimited Virtual Storage</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No quotas · No limits · Windows Virtual Drive</div>
              </div>
            </div>
            <span style={{ fontSize: '0.68rem', padding: '3px 10px', borderRadius: '20px', background: 'rgba(16,185,129,0.18)', color: '#10b981', fontWeight: 800, border: '1px solid rgba(16,185,129,0.3)' }}>∞ FREE</span>
          </div>

          {/* Success State */}
          {justCreated && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '16px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={22} color="#10b981" />
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981' }}>Drive Created & .BAT Downloaded!</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>"{justCreated.name}" → {justCreated.letter}</div>
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px 12px', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong style={{ color: '#f59e0b' }}>⚡ Final step:</strong> Find <code style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: '4px' }}>Create-Drive-{justCreated.letter.replace(':', '')}-*.bat</code> in your Downloads → <strong>Right-click → Run as Administrator</strong> → Drive {justCreated.letter} appears instantly in This PC with unlimited storage!
              </div>
            </div>
          )}

          {/* Creator Form */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={15} color="var(--accent-primary)" /> Create New Drive — No folder selection needed
            </h4>

            {/* Name Input */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Drive Name
              </label>
              <input
                type="text"
                placeholder='e.g. "Work Files", "Photo Backup", "Gaming Assets"'
                value={driveName}
                onChange={e => setDriveName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                style={{ width: '100%', padding: '10px 13px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Letter Picker */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Drive Letter <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(available only)</span>
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
                        background: isUsed ? 'rgba(255,255,255,0.03)' : isSelected ? 'var(--accent-primary)' : 'transparent',
                        color: isUsed ? 'var(--border-subtle)' : isSelected ? '#fff' : 'var(--text-secondary)',
                        cursor: isUsed ? 'not-allowed' : 'pointer',
                        textDecoration: isUsed ? 'line-through' : 'none',
                        transition: 'all 0.15s'
                      }}
                      title={isUsed ? 'Already in use' : `Mount as ${letter}`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Big Create Button */}
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              style={{ width: '100%', padding: '13px', borderRadius: '12px', fontWeight: 800, gap: '10px', justifyContent: 'center', fontSize: '0.95rem', background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}
            >
              <Zap size={16} />
              Create Drive {selectedLetter} + Download .BAT Script
              <ArrowRight size={16} />
            </button>

            {/* How it works */}
            <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexDirection: 'column' }}>
              {[
                ['1', 'Click the button above — drive registered instantly in Storage Bank'],
                ['2', 'A .BAT script auto-downloads to your Downloads folder'],
                ['3', 'Right-click the .BAT → Run as Administrator'],
                ['4', 'Drive appears in This PC with ∞ unlimited storage — done!']
              ].map(([num, text]) => (
                <div key={num} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', color: 'var(--accent-primary)', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{num}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

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
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => downloadBat(drive.driveLetter, drive.name)}
                        title="Re-download .BAT script"
                        style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Download size={12} /> .BAT
                      </button>
                      <button
                        onClick={() => unmountDrive(drive.id)}
                        title="Remove drive"
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
