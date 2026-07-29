import React, { useState, useEffect } from 'react';
import { useStorage } from '../context/StorageContext';
import { X, Edit3, Save } from 'lucide-react';

export function RenameModal({ item, isFolder, onClose }) {
  const { renameItem, addToast } = useStorage();
  const [name, setName] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name || '');
    }
  }, [item]);

  if (!item) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    if (name.trim() !== item.name) {
      renameItem(item.id, isFolder, name.trim());
      addToast(`Renamed to "${name.trim()}"`, 'success');
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Edit3 size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.1rem' }}>Rename {isFolder ? 'Folder' : 'File'}</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">New Name</label>
            <input
              type="text"
              className="input-text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>
            <Save size={16} /> Save Name
          </button>
        </div>
      </div>
    </div>
  );
}
