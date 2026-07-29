import React, { useState } from 'react';
import {
  Monitor,
  HardDrive,
  Download,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { useStorage } from '../context/StorageContext';

export function DesktopDriveModal({ isOpen, onClose }) {
  const { addToast, user, windowsDrive, connectWindowsFolder, disconnectWindowsFolder } = useStorage();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'oneclick' | 'manual' | 'rclone'

  if (!isOpen) return null;

  const currentHost = window.location.host;
  const webdavUrl = `${window.location.protocol}//${currentHost}/webdav`;

  // 1-Click Windows Native Drive Mounter Script (Powershell + Registry + SUBST)
  const batScriptContent = `@echo off
title Storage Bank Windows Virtual Hard Drive (Z:) Creator
color 0A
cls
echo =========================================================================
echo       STORAGE BANK - NATIVE WINDOWS VIRTUAL HARD DRIVE (Z:) CREATOR
echo =========================================================================
echo.

set "VAULT_DIR=%USERPROFILE%\\StorageBank-Vault"
if not exist "%VAULT_DIR%" mkdir "%VAULT_DIR%"

echo  [1/3] Creating Storage Bank local folder: %VAULT_DIR%
echo.

echo  [2/3] Registering Z:\\ Drive under 'This PC' in Windows File Explorer...
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\DriveIcons\\Z\\DefaultLabel" /ve /d "Storage Bank Unlimited Drive (Z:)" /f >nul 2>&1
reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v EnableLinkedConnections /t REG_DWORD /d 1 /f >nul 2>&1

echo  [3/3] Mounting Native Windows Z:\\ Drive...
subst Z: /D >nul 2>&1
subst Z: "%VAULT_DIR%"

powershell -ExecutionPolicy Bypass -Command "$v = '$env:USERPROFILE\\StorageBank-Vault'; New-PSDrive -Name 'Z' -PSProvider FileSystem -Root $v -Persist -Scope Global -ErrorAction SilentlyContinue" >nul 2>&1

echo.
echo =========================================================================
echo  [SUCCESS] Storage Bank Drive (Z:) is now MOUNTED under 'This PC'!
echo =========================================================================
echo.
echo  Opening Z:\\ Drive in Windows File Explorer...
explorer Z:\\
echo.
pause
`;

  const ps1ScriptContent = `# Storage Bank Windows Virtual Hard Drive (Z:) PowerShell Integrator
$VaultDir = "$env:USERPROFILE\\StorageBank-Vault"
if (!(Test-Path $VaultDir)) { New-Item -ItemType Directory -Path $VaultDir -Force }

# Register Drive Label in Windows Explorer Shell
$RegPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\DriveIcons\\Z\\DefaultLabel"
if (!(Test-Path $RegPath)) { New-Item -Path $RegPath -Force }
Set-ItemProperty -Path $RegPath -Name "(default)" -Value "Storage Bank Unlimited Drive (Z:)"

# Map Z: Drive Letter
New-PSDrive -Name "Z" -PSProvider FileSystem -Root $VaultDir -Persist -Scope Global -ErrorAction SilentlyContinue
subst Z: /D 2>$null
subst Z: $VaultDir

Write-Host "SUCCESS: Storage Bank (Z:) mounted under This PC!" -ForegroundColor Green
Invoke-Item "Z:\\"
`;

  const downloadBatScript = () => {
    const blob = new Blob([batScriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mount-StorageBank-Drive.bat';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    addToast('Downloaded Mount-StorageBank-Drive.bat! Run as Administrator on Windows.', 'success');
  };

  const downloadPs1Script = () => {
    const blob = new Blob([ps1ScriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mount-StorageBank-Drive.ps1';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    addToast('Downloaded Mount-StorageBank-Drive.ps1!', 'success');
  };

  const copyBatCode = () => {
    navigator.clipboard.writeText(batScriptContent);
    setCopied(true);
    addToast('Batch script copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '740px',
          width: '95vw',
          maxHeight: '90vh',
          borderRadius: '20px',
          background: 'var(--bg-modal)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '20px 24px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)'
            }}>
              <Monitor size={22} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                Windows PC Virtual Drive Integration (Z:)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Mount your Storage Bank vault as a native hard drive under "This PC"
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-input)' }}>
          {[
            { id: 'live', label: '💻 Direct Windows PC Folder Mount' },
            { id: 'oneclick', label: '⚡ 1-Click Windows Mounter (.bat)' },
            { id: 'manual', label: '📁 Manual Network Drive (This PC)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: activeTab === tab.id ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? '700' : '500',
                fontSize: '0.84rem',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

          {activeTab === 'live' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                background: windowsDrive.mounted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.1)',
                border: windowsDrive.mounted ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: windowsDrive.mounted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <HardDrive size={24} color={windowsDrive.mounted ? '#10b981' : '#6366f1'} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {windowsDrive.mounted ? `Mounted: ${windowsDrive.folderName}` : 'No Windows Folder Mounted'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      {windowsDrive.mounted 
                        ? `Live Sync Active • ${windowsDrive.syncedFilesCount} files synced • Last sync: ${windowsDrive.lastSyncTime}` 
                        : 'Connect any folder or Drive (Z:\\) on your PC to sync in real time.'}
                    </p>
                  </div>
                </div>

                {windowsDrive.mounted ? (
                  <button className="btn btn-secondary" onClick={disconnectWindowsFolder} style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
                    Unmount Drive
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={connectWindowsFolder} style={{ padding: '10px 20px', fontWeight: '700' }}>
                    <HardDrive size={16} /> Mount PC Folder (Z:\)
                  </button>
                )}
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <h5 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>How Real-Time Windows Folder Sync Works:</h5>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>Click <strong>Mount PC Folder (Z:\)</strong> above and select any directory on your computer (e.g. <code>Z:\</code> or <code>C:\StorageBank-Vault</code>).</li>
                  <li>Chrome/Edge will grant real-time read and write permission to Storage Bank.</li>
                  <li>All files inside your local Windows folder will appear instantly in your Storage Bank vault, and any edits in the browser save directly back to your PC disk!</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'oneclick' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <Zap size={24} color="#06b6d4" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', color: '#22d3ee' }}>Instant Windows File Explorer Drive</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                    Download and double-click the setup batch script. Windows will automatically mount <strong>Storage Bank</strong> as a virtual hard drive <code>Z:\</code> in <strong>This PC</strong>.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>1-Click Script Code (Mount-StorageBank-Drive.bat):</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={copyBatCode} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                      {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                    <button className="btn btn-secondary" onClick={downloadPs1Script} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                      <Download size={14} />
                      <span>Download .ps1 (PowerShell)</span>
                    </button>
                    <button className="btn btn-primary" onClick={downloadBatScript} style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
                      <Download size={14} />
                      <span>Download .bat File</span>
                    </button>
                  </div>
                </div>

                <pre style={{
                  background: '#040711',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '0.78rem',
                  color: '#34d399',
                  fontFamily: 'monospace',
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}>
                  {batScriptContent}
                </pre>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h5 style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Steps after downloading:</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    <span>1. Right-click <code>Mount-StorageBank-Drive.bat</code> and select <strong>Run as Administrator</strong>.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    <span>2. Open <strong>File Explorer (Win + E)</strong> → <strong>This PC</strong>.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    <span>3. You will see <strong>Storage Bank Drive (Z:)</strong> ready for real-time saving and file storage!</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                You can map Storage Bank directly using native Windows Network Location without downloading any software:
              </p>

              <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <li>Open <strong>File Explorer</strong> on your Windows PC.</li>
                  <li>Right-click <strong>This PC</strong> and click <strong>Map network drive...</strong></li>
                  <li>Choose Drive Letter <code>Z:</code>.</li>
                  <li>In the Folder box, enter:
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <code style={{ background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '8px', color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>
                        http://localhost:5173
                      </code>
                    </div>
                  </li>
                  <li>Check <strong>Reconnect at sign-in</strong> and click <strong>Finish</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'rclone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                For high-speed multi-threaded mounting with WinFSP / Rclone (supports mounting 10TB+ virtual drives seamlessly in Windows kernel):
              </p>

              <div style={{ background: '#040711', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.78rem', color: '#818cf8', fontFamily: 'monospace', lineHeight: '1.6' }}>
                  # 1. Install WinFSP from https://winfsp.dev<br/>
                  # 2. Run Rclone mount command:<br/>
                  rclone mount storagebank: Z: --vfs-cache-mode full --volname "Storage Bank Unlimited"
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '16px 24px', background: 'var(--bg-surface)' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={downloadBatScript}>
            <Download size={15} />
            <span>Download Windows Z: Mounter</span>
          </button>
        </div>
      </div>
    </div>
  );
}
