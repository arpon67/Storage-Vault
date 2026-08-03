import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { X, FolderPlus } from 'lucide-react';

export function NewFolderModal() {
  const { isNewFolderOpen, setIsNewFolderOpen, createFolder } = useStorage();
  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1');

  if (!isNewFolderOpen) return null;

  const colorOptions = [
    { label: 'Indigo', hex: '#6366f1' },
    { label: 'Cyan', hex: '#06b6d4' },
    { label: 'Emerald', hex: '#10b981' },
    { label: 'Amber', hex: '#f59e0b' },
    { label: 'Rose', hex: '#f43f5e' },
    { label: 'Purple', hex: '#8b5cf6' },
  ];

  const handleCreate = () => {
    if (!folderName.trim()) return;
    createFolder(folderName, selectedColor);
    setFolderName('');
    setIsNewFolderOpen(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderPlus size={22} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.1rem' }}>Create New Folder</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setIsNewFolderOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Folder Name</label>
            <input
              type="text"
              className="input-text"
              placeholder="e.g. Project Documents"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Folder Color Theme</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              {colorOptions.map(c => (
                <button
                  key={c.hex}
                  onClick={() => setSelectedColor(c.hex)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: c.hex,
                    border: selectedColor === c.hex ? '3px solid #ffffff' : 'none',
                    cursor: 'pointer',
                    boxShadow: selectedColor === c.hex ? `0 0 12px ${c.hex}` : 'none',
                    transition: 'var(--transition-fast)'
                  }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setIsNewFolderOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={!folderName.trim()}>
            Create Folder
          </button>
        </div>
      </div>
    </div>
  );
}
