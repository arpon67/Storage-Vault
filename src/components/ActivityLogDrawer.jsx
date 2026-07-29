import React from 'react';
import { useStorage } from '../context/StorageContext';
import { X, Activity, UploadCloud, FolderPlus, Trash2, Edit2, Download, Shield, RefreshCw, Sliders, HardDrive, RotateCcw } from 'lucide-react';

export function ActivityLogDrawer() {
  const { isActivityLogOpen, setIsActivityLogOpen, activityLogs } = useStorage();

  if (!isActivityLogOpen) return null;

  const logs = activityLogs || [];

  const getActionIcon = (action) => {
    switch (action) {
      case 'UPLOAD': return <UploadCloud size={16} color="var(--accent-emerald)" />;
      case 'CREATE_FOLDER': return <FolderPlus size={16} color="var(--accent-cyan)" />;
      case 'CONVERT': return <RefreshCw size={16} color="var(--accent-cyan)" />;
      case 'EDIT': return <Sliders size={16} color="var(--accent-amber)" />;
      case 'SAVE': return <HardDrive size={16} color="var(--accent-primary)" />;
      case 'RENAME': return <Edit2 size={16} color="var(--accent-amber)" />;
      case 'TRASH': return <Trash2 size={16} color="var(--accent-rose)" />;
      case 'RESTORE': return <RotateCcw size={16} color="var(--accent-emerald)" />;
      default: return <Shield size={16} color="var(--accent-secondary)" />;
    }
  };

  return (
    <div className="modal-overlay" style={{ justifyContent: 'flex-end', padding: 0, zIndex: 3500 }} onClick={() => setIsActivityLogOpen(false)}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '380px',
          height: '100vh',
          background: 'var(--bg-modal)',
          borderLeft: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem' }}>Vault Activity & Audit Log</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setIsActivityLogOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Timeline Log List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No recent vault activity recorded. Upload a file or perform an action to populate log.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {logs.map(act => (
                <div key={act.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)'
                  }}>
                    {getActionIcon(act.action)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {act.details || act.action}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {new Date(act.timestamp).toLocaleTimeString()} • {new Date(act.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
