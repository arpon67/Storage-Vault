import React from 'react';
import { useStorage } from '../context/StorageContext';
import {
  Trash2,
  X,
  RotateCcw,
  Star,
  CheckSquare,
  AlertTriangle,
  Archive,
  FolderInput
} from 'lucide-react';

export function BatchActionBar() {
  const {
    selectedItems,
    clearSelection,
    batchMoveToTrash,
    batchDeletePermanently,
    batchRestoreFromTrash,
    zipSelectedFiles,
    moveItemsToFolder,
    folders,
    activeCategory
  } = useStorage();

  if (selectedItems.length === 0) return null;

  const isTrashView = activeCategory === 'trash';

  const handleMoveToFolderPrompt = () => {
    if (folders.length === 0) {
      alert('No custom folders found. Please create a folder first!');
      return;
    }
    const folderListStr = folders.map((f, idx) => `${idx + 1}. ${f.name}`).join('\n');
    const choice = prompt(`Select target folder by entering its number:\n\n${folderListStr}`);
    const index = parseInt(choice, 10) - 1;
    if (index >= 0 && index < folders.length) {
      moveItemsToFolder(selectedItems, folders[index].id);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(15, 23, 42, 0.94)',
      backdropFilter: 'blur(20px)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-full)',
      padding: '8px 20px',
      boxShadow: 'var(--shadow-lg), 0 0 30px var(--accent-glow)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 2000,
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)' }}>
        <CheckSquare size={18} color="var(--accent-primary)" />
        <span>{selectedItems.length} selected</span>
      </div>

      <div style={{ height: '20px', width: '1px', background: 'var(--border-subtle)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!isTrashView && (
          <>
            <button
              className="btn btn-secondary"
              onClick={() => zipSelectedFiles()}
              style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
              title="Compress selected files into a .ZIP archive"
            >
              <Archive size={14} color="var(--accent-amber)" /> Zip Selected (.ZIP)
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleMoveToFolderPrompt}
              style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
              title="Move selected items to another folder"
            >
              <FolderInput size={14} color="var(--accent-primary)" /> Move to Folder
            </button>
          </>
        )}

        {isTrashView ? (
          <>
            <button
              className="btn btn-secondary"
              onClick={batchRestoreFromTrash}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <RotateCcw size={14} /> Restore
            </button>

            <button
              className="btn btn-danger"
              onClick={batchDeletePermanently}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </>
        ) : (
          <button
            className="btn btn-danger"
            onClick={batchMoveToTrash}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <Trash2 size={14} /> Move to Trash
          </button>
        )}
      </div>

      <div style={{ height: '20px', width: '1px', background: 'var(--border-subtle)' }} />

      <button className="btn btn-ghost btn-icon" onClick={clearSelection} title="Clear Selection">
        <X size={16} />
      </button>
    </div>
  );
}
