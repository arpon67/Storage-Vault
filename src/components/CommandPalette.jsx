import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Upload,
  FolderPlus,
  PieChart,
  Activity,
  Sun,
  Moon,
  HardDrive,
  Star,
  Trash2,
  X,
  File,
  ChevronRight,
  Archive
} from 'lucide-react';

export function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    files,
    folders,
    navigateToFolder,
    setActiveCategory,
    setIsUploadOpen,
    setIsNewFolderOpen,
    setIsAnalyticsOpen,
    setIsActivityLogOpen,
    setActivePreview
  } = useStorage();

  const { theme, changeTheme } = useAuth();
  const [query, setQuery] = useState('');

  if (!isCommandPaletteOpen) return null;

  const filteredFiles = files.filter(f => !f.inTrash && f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  const filteredFolders = folders.filter(f => !f.inTrash && f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3);

  const handleRunAction = (actionFn) => {
    actionFn();
    setIsCommandPaletteOpen(false);
  };

  return (
    <div className="modal-overlay" onClick={() => setIsCommandPaletteOpen(false)}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', padding: 0 }}
      >
        {/* Command Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-input)'
        }}>
          <Search size={22} color="var(--accent-primary)" />
          <input
            type="text"
            className="input-text"
            placeholder="Type a command or search files & folders..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '1.05rem',
              outline: 'none',
              padding: 0
            }}
          />
          <button className="btn btn-ghost btn-icon" onClick={() => setIsCommandPaletteOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Results Body */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '12px 16px' }}>
          {/* Quick Actions Header */}
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            QUICK ACTIONS
          </div>

          <CommandItem
            icon={<Upload size={18} color="var(--accent-primary)" />}
            title="Upload Files to Vault"
            category="Action"
            onClick={() => handleRunAction(() => setIsUploadOpen(true))}
          />
          <CommandItem
            icon={<FolderPlus size={18} color="var(--accent-cyan)" />}
            title="Create New Folder"
            category="Action"
            onClick={() => handleRunAction(() => setIsNewFolderOpen(true))}
          />
          <CommandItem
            icon={<PieChart size={18} color="var(--accent-emerald)" />}
            title="Open Storage Analytics"
            category="View"
            onClick={() => handleRunAction(() => setIsAnalyticsOpen(true))}
          />
          <CommandItem
            icon={<Activity size={18} color="var(--accent-amber)" />}
            title="Open Activity & Audit Log"
            category="Drawer"
            onClick={() => handleRunAction(() => setIsActivityLogOpen(true))}
          />
          <CommandItem
            icon={theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            category="Theme"
            onClick={() => handleRunAction(() => changeTheme(theme === 'dark' ? 'light' : 'dark'))}
          />

          {/* Folders Search */}
          {filteredFolders.length > 0 && (
            <>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', margin: '14px 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                FOLDERS ({filteredFolders.length})
              </div>
              {filteredFolders.map(folder => (
                <CommandItem
                  key={folder.id}
                  icon={<HardDrive size={18} color={folder.color || '#6366f1'} />}
                  title={folder.name}
                  category="Folder Jump"
                  onClick={() => handleRunAction(() => navigateToFolder(folder.id, folder.name))}
                />
              ))}
            </>
          )}

          {/* Files Search */}
          {filteredFiles.length > 0 && (
            <>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', margin: '14px 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                FILES ({filteredFiles.length})
              </div>
              {filteredFiles.map(file => (
                <CommandItem
                  key={file.id}
                  icon={<File size={18} color="var(--text-secondary)" />}
                  title={file.name}
                  category={file.category}
                  onClick={() => handleRunAction(() => setActivePreview(file))}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer Hint */}
        <div style={{
          padding: '10px 16px',
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justify: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <span>Press <kbd style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>ESC</kbd> to close</span>
          <span>Storage Bank Command Engine</span>
        </div>
      </div>
    </div>
  );
}

function CommandItem({ icon, title, category, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'var(--transition-fast)',
        marginBottom: '4px'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {icon}
        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>{category}</span>
        <ChevronRight size={14} color="var(--text-muted)" />
      </div>
    </div>
  );
}
