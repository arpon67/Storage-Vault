import React from 'react';
import { useStorage } from '../context/StorageContext';
import { X, Folder, FolderPlus, ArrowRight, Check, Sparkles } from 'lucide-react';

export function MoveToFolderModal({ isOpen, onClose, targetItemIds }) {
  const { folders, moveItemsToFolder, currentFolderId, addToast, setIsNewFolderOpen } = useStorage();

  if (!isOpen) return null;

  const itemIds = Array.isArray(targetItemIds) ? targetItemIds : (targetItemIds ? [targetItemIds] : []);

  const handleSelectFolder = async (folderId) => {
    if (folderId === currentFolderId) {
      addToast('Item is already in this folder.', 'info');
      onClose();
      return;
    }
    await moveItemsToFolder(itemIds, folderId);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 3200 }} onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', borderRadius: '24px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Folder size={22} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Move to Folder</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Select destination folder for <strong style={{ color: 'var(--text-primary)' }}>{itemIds.length} item(s)</strong>:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
            {/* Move to Root / Main Vault */}
            <div
              onClick={() => handleSelectFolder(null)}
              style={{
                background: currentFolderId === null ? 'rgba(99,102,241,0.12)' : 'var(--bg-surface)',
                border: currentFolderId === null ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                borderRadius: '14px', padding: '12px 16px', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} color="var(--accent-primary)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Main Vault Root</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Top level storage directory</div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </div>

            {/* Custom User Folders */}
            {folders.map(folder => (
              <div
                key={folder.id}
                onClick={() => handleSelectFolder(folder.id)}
                style={{
                  background: folder.id === currentFolderId ? 'rgba(99,102,241,0.12)' : 'var(--bg-surface)',
                  border: folder.id === currentFolderId ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  borderRadius: '14px', padding: '12px 16px', display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: `${folder.color || '#6366f1'}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${folder.color || '#6366f1'}44`
                  }}>
                    <Folder size={18} color={folder.color || 'var(--accent-primary)'} fill={folder.color || 'var(--accent-primary)'} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{folder.name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Custom Vault Folder</div>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" />
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={() => { onClose(); setIsNewFolderOpen(true); }}
              style={{ fontSize: '0.8rem', gap: '6px', borderRadius: '10px' }}
            >
              <FolderPlus size={14} /> Create New Folder
            </button>

            <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: '0.8rem' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
