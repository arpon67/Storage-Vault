import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { X, HardDrive, Plus, Trash2, ShieldCheck, RefreshCw, Sparkles, Check, Monitor, Download } from 'lucide-react';

export function WindowsDriveModal() {
  const {
    isDriveModalOpen,
    setIsDriveModalOpen,
    mountedDrives,
    unmountDrive,
    connectWindowsFolder,
    addToast
  } = useStorage();

  const [customName, setCustomName] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('Z:');

  if (!isDriveModalOpen) return null;

  const driveLetters = ['Z:', 'Y:', 'X:', 'W:', 'V:', 'U:', 'T:', 'S:', 'R:', 'P:', 'O:', 'N:'];

  const downloadBatScript = (letter = 'Z:', name = 'StorageBank_Vault') => {
    const batContent = `@echo off
title Storage Bank Windows Virtual Drive (${letter}) Mount Script
color 0A
echo ===================================================
echo     STORAGE BANK WINDOWS VIRTUAL DRIVE MOUNT (${letter})
echo ===================================================
echo.

set "VAULT_DIR=%USERPROFILE%\\StorageBank_Vault"
set "DRIVE_LETTER=${letter}"

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
`;
    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mount-StorageBank-Drive-${letter.replace(':', '')}.bat`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Auto-generated & downloaded 1-Click Mount Script for ${letter}!`, 'success');
  };

  const handleMountNewDrive = async () => {
    await connectWindowsFolder(customName.trim() || null, selectedLetter);
    downloadBatScript(selectedLetter, customName.trim() || 'StorageBank_Vault');
    setCustomName('');
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 3500 }} onClick={() => setIsDriveModalOpen(false)}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px', width: '92vw', borderRadius: '24px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HardDrive size={22} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Windows PC Drive Mount Manager</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setIsDriveModalOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          {/* Unlimited Storage Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(6,182,212,0.18))',
            border: '1px solid var(--accent-primary)', borderRadius: '18px', padding: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>Unlimited Virtual Storage Bank</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>0 Quota Caps • IndexedDB + Supabase Cloud Engine</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '20px', background: 'rgba(16,185,129,0.2)', color: 'var(--accent-emerald)', fontWeight: 800 }}>
              UNLIMITED
            </span>
          </div>

          {/* Mount New Unique Drive Form */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '18px', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
              Mount New Windows Drive or Folder
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  CUSTOM DRIVE NAME (OPTIONAL)
                </label>
                <input
                  type="text"
                  placeholder="e.g. StorageBank_Vault (Z:)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.88rem', outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  UNIQUE DRIVE LETTER
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {driveLetters.map(letter => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setSelectedLetter(letter)}
                      style={{
                        padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700,
                        border: selectedLetter === letter ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        background: selectedLetter === letter ? 'var(--accent-primary)' : 'transparent',
                        color: selectedLetter === letter ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleMountNewDrive}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 700, gap: '8px', marginTop: '6px' }}
              >
                <Plus size={16} /> Select & Mount Local Windows Folder
              </button>
            </div>
          </div>

          {/* Active Mounted Devices List */}
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
              Active Mounted Devices ({mountedDrives.length})
            </h4>

            {mountedDrives.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px border-subtle', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No active Windows drives mounted yet. Mount a folder above to start live sync!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
                {mountedDrives.map(drive => (
                  <div
                    key={drive.id}
                    style={{
                      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      borderRadius: '16px', padding: '14px 16px', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Monitor size={20} color="var(--accent-primary)" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>
                          {drive.name} <span style={{ color: 'var(--accent-amber)' }}>({drive.driveLetter})</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Synced: {drive.syncedFilesCount} files • Mounted: {drive.mountedAt}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => downloadBatScript(drive.driveLetter, drive.name)}
                        style={{ padding: '6px 10px', fontSize: '0.76rem', borderRadius: '10px', gap: '4px' }}
                        title="Download 1-Click Windows .BAT Mount Script"
                      >
                        <Download size={13} color="var(--accent-amber)" /> .BAT Script
                      </button>

                      <button
                        className="btn btn-danger"
                        onClick={() => unmountDrive(drive.id)}
                        style={{ padding: '6px 12px', fontSize: '0.76rem', borderRadius: '10px', gap: '4px' }}
                        title="Unmount and remove device"
                      >
                        <Trash2 size={13} /> Unmount
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
