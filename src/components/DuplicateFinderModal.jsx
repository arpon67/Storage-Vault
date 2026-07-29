import React, { useState, useMemo } from 'react';
import { useStorage } from '../context/StorageContext';
import { X, Sparkles, Trash2, CheckCircle2, ShieldAlert, HardDrive } from 'lucide-react';

export function DuplicateFinderModal({ isOpen, onClose }) {
  const { files, deletePermanently, reloadVault, addToast } = useStorage();
  const [cleaning, setCleaning] = useState(false);

  // Scan vault for duplicate file pairs (matching name + size)
  const duplicates = useMemo(() => {
    const map = new Map();
    const dups = [];

    files.forEach(file => {
      if (file.inTrash) return;
      const key = `${file.name}-${file.size}`;
      if (map.has(key)) {
        dups.push({ original: map.get(key), duplicate: file });
      } else {
        map.set(key, file);
      }
    });

    return dups;
  }, [files]);

  if (!isOpen) return null;

  const totalWastedBytes = duplicates.reduce((acc, d) => acc + (d.duplicate.size || 0), 0);

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCleanAllDuplicates = async () => {
    if (duplicates.length === 0) return;
    setCleaning(true);
    try {
      for (const d of duplicates) {
        await deletePermanently(d.duplicate.id, false);
      }
      await reloadVault();
      addToast(`Cleaned up ${duplicates.length} duplicate file(s)!`, 'success');
      onClose();
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={22} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem' }}>Duplicate File Cleaner Wizard</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Wasted Storage Reclaimable</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-emerald)', marginTop: '2px' }}>
                {formatSize(totalWastedBytes)}
              </div>
            </div>
            <span className="badge badge-emerald">
              {duplicates.length} Duplicate(s) Found
            </span>
          </div>

          {duplicates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={42} color="var(--accent-emerald)" style={{ marginBottom: '12px' }} />
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Vault is Completely Clean!</h4>
              <p style={{ fontSize: '0.85rem' }}>No duplicate files detected in your storage vault.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
              {duplicates.map((pair, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{pair.duplicate.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Size: {formatSize(pair.duplicate.size)}</div>
                  </div>
                  <button
                    className="btn btn-danger"
                    onClick={() => deletePermanently(pair.duplicate.id, false)}
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    <Trash2 size={12} /> Remove Copy
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Done</button>
          {duplicates.length > 0 && (
            <button className="btn btn-primary" onClick={handleCleanAllDuplicates} disabled={cleaning}>
              <Trash2 size={16} /> Clean All {duplicates.length} Duplicates
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
