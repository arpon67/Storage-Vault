import React, { useState, useEffect, useRef } from 'react';
import { useStorage } from '../context/StorageContext';
import {
  X, HardDrive, Plus, Trash2, Sparkles, Monitor, Download,
  RefreshCw, Wifi, WifiOff, Zap, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';

export function WindowsDriveModal() {
  const {
    isDriveModalOpen,
    setIsDriveModalOpen,
    mountedDrives,
    unmountDrive,
    connectWindowsFolder,
    addToast,
    uploadFiles
  } = useStorage();

  const [customName, setCustomName] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('Z:');
  const [isMounting, setIsMounting] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState({});
  const [syncStatus, setSyncStatus] = useState({});
  const syncIntervalsRef = useRef({});
  const dirHandlesRef = useRef({});

  useEffect(() => {
    return () => {
      // Clean up all sync intervals on unmount
      Object.values(syncIntervalsRef.current).forEach(id => clearInterval(id));
    };
  }, []);

  if (!isDriveModalOpen) return null;

  const driveLetters = ['Z:', 'Y:', 'X:', 'W:', 'V:', 'U:', 'T:', 'S:', 'R:', 'P:', 'O:', 'N:', 'M:', 'L:', 'K:'];

  const downloadBatScript = (letter = 'Z:', name = 'StorageBank_Vault') => {
    const safeName = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const batContent = `@echo off\r\ntitle Storage Bank Virtual Drive (${letter}) Mount Script\r\ncolor 0A\r\necho ===================================================\r\necho     STORAGE BANK WINDOWS VIRTUAL DRIVE (${letter})\r\necho     Drive Name: ${name}\r\necho ===================================================\r\necho.\r\n\r\nset "VAULT_DIR=%USERPROFILE%\\StorageBank_${safeName}"\r\nset "DRIVE_LETTER=${letter}"\r\n\r\nif not exist "%VAULT_DIR%" (\r\n    mkdir "%VAULT_DIR%"\r\n    echo [OK] Created vault folder: %VAULT_DIR%\r\n)\r\n\r\necho [INFO] Mapping %VAULT_DIR% as Drive %DRIVE_LETTER%...\r\nsubst %DRIVE_LETTER% "%VAULT_DIR%" >nul 2>&1\r\n\r\nif %errorlevel% equ 0 (\r\n    echo.\r\n    echo ===================================================\r\n    echo  SUCCESS! Drive ${letter} is now live in This PC!\r\n    echo  Vault Path: %VAULT_DIR%\r\n    echo ===================================================\r\n    echo.\r\n    start "" explorer.exe %DRIVE_LETTER%\\\r\n) else (\r\n    echo [INFO] Drive ${letter} already exists. Refreshing...\r\n    subst ${letter} /d >nul 2>&1\r\n    subst %DRIVE_LETTER% "%VAULT_DIR%" >nul 2>&1\r\n    start "" explorer.exe %DRIVE_LETTER%\\\r\n)\r\n\r\necho.\r\npause\r\n`;

    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mount-StorageBank-${letter.replace(':', '')}.bat`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Downloaded 1-Click Mount Script for Drive ${letter}! Run it as Administrator.`, 'success');
  };

  const startAutoSync = async (drive) => {
    if (!('showDirectoryPicker' in window)) {
      addToast('Real-time sync requires Chrome, Edge, or Brave.', 'warning');
      return;
    }

    try {
      addToast('Select the same folder to enable real-time auto-sync...', 'info');
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      dirHandlesRef.current[drive.id] = dirHandle;

      setSyncStatus(prev => ({ ...prev, [drive.id]: { state: 'syncing', lastSync: new Date().toLocaleTimeString(), newFiles: 0 } }));
      setAutoSyncEnabled(prev => ({ ...prev, [drive.id]: true }));

      // Initial scan
      await runSync(drive.id, dirHandle);

      // Poll every 30 seconds
      const intervalId = setInterval(() => runSync(drive.id, dirHandle), 30000);
      syncIntervalsRef.current[drive.id] = intervalId;

      addToast(`Real-time auto-sync ACTIVE for "${drive.name}" (${drive.driveLetter}) — scanning every 30s!`, 'success');
    } catch (err) {
      if (err.name !== 'AbortError') {
        addToast('Failed to start auto-sync.', 'error');
      }
    }
  };

  const runSync = async (driveId, dirHandle) => {
    try {
      const newFiles = [];
      const scanDir = async (handle) => {
        for await (const entry of handle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            newFiles.push(file);
          } else if (entry.kind === 'directory') {
            await scanDir(entry);
          }
        }
      };
      await scanDir(dirHandle);
      if (newFiles.length > 0) {
        await uploadFiles(newFiles);
      }
      setSyncStatus(prev => ({
        ...prev,
        [driveId]: { state: 'synced', lastSync: new Date().toLocaleTimeString(), newFiles: newFiles.length }
      }));
    } catch (err) {
      setSyncStatus(prev => ({ ...prev, [driveId]: { state: 'error', lastSync: new Date().toLocaleTimeString(), newFiles: 0 } }));
    }
  };

  const stopAutoSync = (driveId) => {
    clearInterval(syncIntervalsRef.current[driveId]);
    delete syncIntervalsRef.current[driveId];
    delete dirHandlesRef.current[driveId];
    setAutoSyncEnabled(prev => ({ ...prev, [driveId]: false }));
    setSyncStatus(prev => ({ ...prev, [driveId]: null }));
    addToast('Real-time auto-sync stopped.', 'info');
  };

  const handleMountNewDrive = async () => {
    setIsMounting(true);
    try {
      await connectWindowsFolder(customName.trim() || null, selectedLetter);
      downloadBatScript(selectedLetter, customName.trim() || 'StorageBank_Vault');
      setCustomName('');
    } finally {
      setIsMounting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 3500 }} onClick={() => setIsDriveModalOpen(false)}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px', width: '92vw', borderRadius: '24px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Windows PC Drive Manager</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Mount, sync & manage local Windows drives</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setIsDriveModalOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Unlimited Storage Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.15))',
            border: '1px solid rgba(99,102,241,0.4)', borderRadius: '16px', padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={20} color="var(--accent-primary)" />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>Unlimited Virtual Storage Bank</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No quota caps • IndexedDB + Supabase Cloud</div>
              </div>
            </div>
            <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: '20px', background: 'rgba(16,185,129,0.2)', color: '#10b981', fontWeight: 800, border: '1px solid rgba(16,185,129,0.3)' }}>
              ∞ UNLIMITED
            </span>
          </div>

          {/* Mount New Drive Form */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Plus size={16} color="var(--accent-primary)" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Mount New Windows Drive or Folder</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Custom Drive Name (optional)
                </label>
                <input
                  type="text"
                  placeholder='e.g. "Work Backup" or "Desktop Photos"'
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '10px',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)',
                    color: '#fff', fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Unique Drive Letter
                </label>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {driveLetters.map(letter => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setSelectedLetter(letter)}
                      style={{
                        padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                        border: selectedLetter === letter ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        background: selectedLetter === letter ? 'var(--accent-primary)' : 'transparent',
                        color: selectedLetter === letter ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.15s'
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
                disabled={isMounting}
                style={{ width: '100%', padding: '11px', borderRadius: '12px', fontWeight: 700, gap: '8px', justifyContent: 'center', fontSize: '0.9rem' }}
              >
                {isMounting ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                {isMounting ? 'Mounting & Syncing...' : `Select & Mount as Drive ${selectedLetter}`}
              </button>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '10px 12px' }}>
                <Zap size={14} color="#f59e0b" style={{ marginTop: '1px', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  After mounting, a <strong style={{ color: '#f59e0b' }}>.BAT script</strong> will auto-download. Run it as <strong>Administrator</strong> in Windows to create the virtual drive in <em>This PC</em>.
                </p>
              </div>
            </div>
          </div>

          {/* Active Mounted Devices */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Monitor size={16} color="var(--accent-primary)" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Active Mounted Devices ({mountedDrives.length})</h4>
              </div>
              {mountedDrives.length > 0 && (
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 700 }}>
                  {mountedDrives.length} ACTIVE
                </span>
              )}
            </div>

            {mountedDrives.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px dashed var(--border-subtle)' }}>
                <HardDrive size={32} color="var(--text-muted)" style={{ marginBottom: '8px', opacity: 0.4 }} />
                <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>No drives mounted yet</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', opacity: 0.7 }}>Select and mount a Windows folder above to start</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mountedDrives.map(drive => {
                  const status = syncStatus[drive.id];
                  const isAutoSync = autoSyncEnabled[drive.id];
                  return (
                    <div
                      key={drive.id}
                      style={{
                        background: 'var(--bg-surface)',
                        border: isAutoSync ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border-subtle)',
                        borderRadius: '16px', padding: '14px 16px'
                      }}
                    >
                      {/* Drive Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: isAutoSync ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Monitor size={18} color={isAutoSync ? '#10b981' : 'var(--accent-primary)'} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>
                              {drive.name}
                              <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>({drive.driveLetter})</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {drive.syncedFilesCount} files synced • Mounted {drive.mountedAt}
                            </div>
                          </div>
                        </div>
                        {/* Status Badge */}
                        {isAutoSync && status && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', fontWeight: 700, color: status.state === 'synced' ? '#10b981' : status.state === 'syncing' ? '#f59e0b' : '#f87171' }}>
                            {status.state === 'synced' ? <CheckCircle2 size={12} /> : status.state === 'syncing' ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <AlertCircle size={12} />}
                            {status.state === 'synced' ? `LIVE • ${status.lastSync}` : status.state === 'syncing' ? 'SYNCING...' : 'SYNC ERROR'}
                          </div>
                        )}
                      </div>

                      {/* Real-Time Auto-Sync Row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isAutoSync ? 'rgba(16,185,129,0.07)' : 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '8px 12px', marginBottom: '8px', border: isAutoSync ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isAutoSync ? <Wifi size={14} color="#10b981" /> : <WifiOff size={14} color="var(--text-muted)" />}
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isAutoSync ? '#10b981' : 'var(--text-secondary)' }}>
                              Real-Time Auto Sync {isAutoSync ? '● ACTIVE' : '○ OFF'}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {isAutoSync && status ? `Last sync: ${status.lastSync} • ${status.newFiles} files` : 'Polls folder every 30 seconds'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => isAutoSync ? stopAutoSync(drive.id) : startAutoSync(drive)}
                          style={{
                            padding: '5px 12px', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 700,
                            border: 'none', cursor: 'pointer',
                            background: isAutoSync ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                            color: isAutoSync ? '#f87171' : '#10b981'
                          }}
                        >
                          {isAutoSync ? 'Stop Sync' : 'Enable Sync'}
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => downloadBatScript(drive.driveLetter, drive.name)}
                          style={{ flex: 1, padding: '7px', fontSize: '0.74rem', borderRadius: '9px', gap: '5px', justifyContent: 'center' }}
                        >
                          <Download size={12} color="#f59e0b" /> Download .BAT
                        </button>
                        <button
                          onClick={() => unmountDrive(drive.id)}
                          style={{ flex: 1, padding: '7px', fontSize: '0.74rem', borderRadius: '9px', gap: '5px', justifyContent: 'center', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: 600 }}
                        >
                          <Trash2 size={12} /> Unmount Device
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Integration Guide */}
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Clock size={14} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>How Real-Time Integration Works</span>
            </div>
            <ol style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[
                'Click "Select & Mount as Drive" — pick any local Windows folder',
                'A .BAT script downloads automatically — run it as Admin to create the virtual drive in This PC',
                'Click "Enable Sync" on the mounted drive to start live 30-second polling',
                'Any new files added to your local folder are auto-uploaded to Storage Bank instantly',
                'Multiple drives can sync simultaneously — fully unlimited storage'
              ].map((step, i) => (
                <li key={i} style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Step {i + 1}:</strong> {step}
                </li>
              ))}
            </ol>
          </div>

        </div>
      </div>
    </div>
  );
}
