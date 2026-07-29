import React from 'react';
import { useStorage } from '../context/StorageContext';
import { UploadCloud, CheckCircle2 } from 'lucide-react';

export function UploadProgressBar() {
  const { uploadProgress } = useStorage();

  if (!uploadProgress || !uploadProgress.active) return null;

  const { fileName, fileIndex, totalFiles, loadedBytes, totalBytes, percentage } = uploadProgress;

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isComplete = percentage >= 100;

  return (
    <div style={{
      position: 'fixed',
      bottom: '28px',
      right: '28px',
      zIndex: 9999,
      width: '380px',
      maxWidth: 'calc(100vw - 32px)',
      background: 'rgba(15, 23, 42, 0.88)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(99, 102, 241, 0.35)',
      borderRadius: '16px',
      padding: '16px 20px',
      boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.25)',
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: isComplete ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isComplete ? '#10b981' : 'var(--accent-primary)',
            transition: 'var(--transition-fast)'
          }}>
            {isComplete ? <CheckCircle2 size={20} /> : <UploadCloud size={20} className="pulse" />}
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isComplete ? 'Vault Storage Complete' : `Writing Item ${fileIndex} of ${totalFiles}`}
              {!isComplete && (
                <span style={{ fontSize: '0.72rem', background: 'rgba(99, 102, 241, 0.25)', color: '#818cf8', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                  IndexedDB
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
              {fileName || 'Processing vault objects...'}
            </div>
          </div>
        </div>

        {/* Live Percentage */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: isComplete ? '#10b981' : 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
            {percentage}%
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {formatSize(loadedBytes)} / {formatSize(totalBytes)}
          </div>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div style={{
        width: '100%',
        height: '8px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: isComplete
            ? 'linear-gradient(90deg, #059669 0%, #10b981 100%)'
            : 'linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)',
          borderRadius: '10px',
          transition: 'width 0.25s ease-out, background 0.3s ease',
          boxShadow: isComplete
            ? '0 0 12px rgba(16, 185, 129, 0.6)'
            : '0 0 12px rgba(99, 102, 241, 0.6)'
        }} />
      </div>
    </div>
  );
}
