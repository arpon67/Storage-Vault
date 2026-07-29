import React from 'react';
import { useStorage } from '../context/StorageContext';
import { ShieldCheck, Zap, Upload, FileCode, Plus, HardDrive, Sparkles, FolderPlus } from 'lucide-react';

export function VaultHeroBanner() {
  const {
    storageStats,
    setIsUploadOpen,
    setIsNewFolderOpen,
    setIsAnalyticsOpen,
    activeCategory
  } = useStorage();

  if (activeCategory !== 'all') return null;

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(22, 32, 59, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%)',
      backdropFilter: 'var(--glass-backdrop)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-strong)',
      padding: '24px 28px',
      marginBottom: '24px',
      boxShadow: 'var(--shadow-lg)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Accent Glow */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
        {/* Left Welcome Info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-indigo" style={{ padding: '4px 10px' }}>
              <ShieldCheck size={13} /> Encrypted Vault Active
            </span>
            <span className="badge badge-emerald" style={{ padding: '4px 10px' }}>
              <Zap size={13} /> 0.1ms Ultra Speed
            </span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            Storage Bank Unlimited Vault
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '520px' }}>
            Client-side zero-latency vault powered by IndexedDB. Unlimited space for photos, videos, code, and documents.
          </p>
        </div>

        {/* Right Stats & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{
            background: 'var(--bg-input)',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Vault Usage</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-primary)', marginTop: '2px' }}>
              {formatSize(storageStats.totalBytes)}
            </div>
          </div>

          <button className="btn btn-primary" onClick={() => setIsUploadOpen(true)} style={{ padding: '12px 20px' }}>
            <Upload size={18} />
            <span>Upload File</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setIsNewFolderOpen(true)} style={{ padding: '12px 18px' }}>
            <FolderPlus size={18} />
            <span>New Folder</span>
          </button>
        </div>
      </div>
    </div>
  );
}
