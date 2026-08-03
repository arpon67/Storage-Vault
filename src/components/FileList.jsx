import React, { useState, useEffect } from 'react';
import { useStorage } from '../context/StorageContext';
import { RenameModal } from './RenameModal';
import { MediaEditorModal } from './MediaEditorModal';
import {
  Folder,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Code2,
  Archive,
  File,
  Star,
  Download,
  Share2,
  Trash2,
  RotateCcw,
  Edit3,
  Eye,
  ArrowUpDown,
  Check,
  RefreshCw,
  Sliders
} from 'lucide-react';

export function FileList() {
  const {
    displayedFolders,
    displayedFiles,
    navigateToFolder,
    toggleStar,
    moveToTrash,
    restoreFromTrash,
    deletePermanently,
    setActivePreview,
    setActiveShare,
    setActiveCategory,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    selectedItems,
    toggleSelectItem
  } = useStorage();

  const [renameTarget, setRenameTarget] = useState(null);
  const [editorTarget, setEditorTarget] = useState(null);
  const [visibleCount, setVisibleCount] = useState(60);

  useEffect(() => {
    setVisibleCount(60);
  }, [displayedFiles.length]);

  const formatSize = (bytes) => {
    if (!bytes) return '--';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownload = (file) => {
    if (!file.blob) return;
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleHeaderSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getItemIcon = (item, isFolder) => {
    if (isFolder) return <Folder size={18} fill={item.color || '#6366f1'} color={item.color || '#6366f1'} />;
    switch (item.category) {
      case 'image': return <ImageIcon size={18} color="#06b6d4" />;
      case 'video': return <Video size={18} color="#ec4899" />;
      case 'audio': return <Music size={18} color="#f59e0b" />;
      case 'document': return <FileText size={18} color="#10b981" />;
      case 'code': return <Code2 size={18} color="#8b5cf6" />;
      case 'archive': return <Archive size={18} color="#6366f1" />;
      default: return <File size={18} color="#94a3b8" />;
    }
  };

  const filesToRender = displayedFiles.slice(0, visibleCount);
  const hasMore = displayedFiles.length > visibleCount;

  return (
    <>
      <div className="glass-panel" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px 16px', width: '40px' }}></th>
              <th style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => handleHeaderSort('name')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Name</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => handleHeaderSort('category')}>
                <span>Type</span>
              </th>
              <th style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => handleHeaderSort('size')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Size</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => handleHeaderSort('date')}>
                <span>Date Modified</span>
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Folders */}
            {displayedFolders.map(folder => {
              const isSelected = selectedItems.includes(folder.id);
              return (
                <tr
                  key={folder.id}
                  onClick={() => !folder.inTrash && navigateToFolder(folder.id, folder.name)}
                  onDoubleClick={() => !folder.inTrash && navigateToFolder(folder.id, folder.name)}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div
                      onClick={(e) => { e.stopPropagation(); toggleSelectItem(folder.id); }}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: isSelected ? '2px solid var(--accent-primary)' : '2px solid var(--border-subtle)',
                        background: isSelected ? 'var(--accent-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      {isSelected && <Check size={10} color="#ffffff" />}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {getItemIcon(folder, true)}
                      <span>{folder.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Folder</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>--</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{new Date(folder.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      {!folder.inTrash ? (
                        <>
                          <button
                            className="btn btn-primary"
                            title="Open Folder"
                            onClick={(e) => { e.stopPropagation(); navigateToFolder(folder.id, folder.name); }}
                            style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px', gap: '4px' }}
                          >
                            <Folder size={12} /> Open
                          </button>
                          <button className="btn btn-ghost btn-icon" title="Star Folder" onClick={(e) => { e.stopPropagation(); toggleStar(folder.id, true); }}>
                            <Star size={14} fill={folder.starred ? '#f59e0b' : 'none'} color={folder.starred ? '#f59e0b' : 'var(--text-muted)'} />
                          </button>
                          <button className="btn btn-ghost btn-icon" title="Rename" onClick={(e) => { e.stopPropagation(); setRenameTarget({ item: folder, isFolder: true }); }}>
                            <Edit3 size={14} />
                          </button>
                          <button className="btn btn-ghost btn-icon" title="Move to Trash" onClick={(e) => { e.stopPropagation(); moveToTrash(folder.id, true); }}>
                            <Trash2 size={14} color="var(--accent-rose)" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-ghost btn-icon" title="Restore" onClick={(e) => { e.stopPropagation(); restoreFromTrash(folder.id, true); }}><RotateCcw size={14} /></button>
                          <button className="btn btn-ghost btn-icon" title="Delete" onClick={(e) => { e.stopPropagation(); deletePermanently(folder.id, true); }}><Trash2 size={14} color="var(--accent-rose)" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Files */}
            {filesToRender.map(file => {
              const isSelected = selectedItems.includes(file.id);
              const isMedia = file.category === 'image' || file.category === 'video';
              return (
                <tr
                  key={file.id}
                  onClick={() => !file.inTrash && setActivePreview(file)}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div
                      onClick={(e) => { e.stopPropagation(); toggleSelectItem(file.id); }}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: isSelected ? '2px solid var(--accent-primary)' : '2px solid var(--border-subtle)',
                        background: isSelected ? 'var(--accent-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      {isSelected && <Check size={10} color="#ffffff" />}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {getItemIcon(file, false)}
                      <span>{file.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{file.category}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{formatSize(file.size)}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{new Date(file.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      {!file.inTrash ? (
                        <>
                          <button className="btn btn-ghost btn-icon" title="Star File" onClick={(e) => { e.stopPropagation(); toggleStar(file.id, false); }}>
                            <Star size={14} fill={file.starred ? '#f59e0b' : 'none'} color={file.starred ? '#f59e0b' : 'var(--text-muted)'} />
                          </button>
                          <button className="btn btn-ghost btn-icon" title="Preview" onClick={(e) => { e.stopPropagation(); setActivePreview(file); }}><Eye size={14} color="var(--accent-primary)" /></button>
                          {isMedia && (
                            <button className="btn btn-ghost btn-icon" title="Pro Media Editor" onClick={(e) => { e.stopPropagation(); setEditorTarget(file); }}><Sliders size={14} color="var(--accent-amber)" /></button>
                          )}
                          <button className="btn btn-ghost btn-icon" title="Convert Format Studio" onClick={(e) => { e.stopPropagation(); setActiveCategory('converter'); }}><RefreshCw size={14} color="var(--accent-cyan)" /></button>
                          <button className="btn btn-ghost btn-icon" title="Download" onClick={(e) => { e.stopPropagation(); handleDownload(file); }}><Download size={14} color="var(--accent-emerald)" /></button>
                          <button className="btn btn-ghost btn-icon" title="Share Link" onClick={(e) => { e.stopPropagation(); setActiveShare(file); }}><Share2 size={14} color="var(--accent-amber)" /></button>
                          <button className="btn btn-ghost btn-icon" title="Rename" onClick={(e) => { e.stopPropagation(); setRenameTarget({ item: file, isFolder: false }); }}><Edit3 size={14} /></button>
                          <button className="btn btn-ghost btn-icon" title="Move to Trash" onClick={(e) => { e.stopPropagation(); moveToTrash(file.id, false); }}><Trash2 size={14} color="var(--accent-rose)" /></button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-ghost btn-icon" title="Restore" onClick={(e) => { e.stopPropagation(); restoreFromTrash(file.id, false); }}><RotateCcw size={14} /></button>
                          <button className="btn btn-ghost btn-icon" title="Delete" onClick={(e) => { e.stopPropagation(); deletePermanently(file.id, false); }}><Trash2 size={14} color="var(--accent-rose)" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setVisibleCount(prev => prev + 60)}
            style={{ padding: '10px 24px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '700' }}
          >
            Load More Files ({displayedFiles.length - visibleCount} remaining)
          </button>
        </div>
      )}

      <RenameModal
        item={renameTarget?.item}
        isFolder={renameTarget?.isFolder}
        onClose={() => setRenameTarget(null)}
      />

      <MediaEditorModal
        file={editorTarget}
        isOpen={Boolean(editorTarget)}
        onClose={() => setEditorTarget(null)}
      />
    </>
  );
}
