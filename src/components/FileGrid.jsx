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
  MoreVertical,
  Download,
  Share2,
  Trash2,
  RotateCcw,
  Edit3,
  Eye,
  Play,
  Check,
  RefreshCw,
  Sliders,
  FolderInput,
  FolderOutput
} from 'lucide-react';

export function FileGrid() {
  const {
    displayedFolders,
    displayedFiles,
    navigateToFolder,
    activeCategory,
    setActiveCategory,
    currentFolderId,
    folderPath,
    setIsUploadOpen
  } = useStorage();

  const [visibleCount, setVisibleCount] = useState(60);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [editorTarget, setEditorTarget] = useState(null);

  // Reset window count when category or folder changes
  useEffect(() => {
    setVisibleCount(60);
  }, [activeCategory, displayedFiles.length]);

  // Global click outside to dismiss context menus
  useEffect(() => {
    const handleWindowClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  const handleDownload = (file) => {
    if (!file.blob) return;
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleEmptyFolderDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  if (displayedFolders.length === 0 && displayedFiles.length === 0) {
    const isInsideFolder = currentFolderId !== null;
    const currentFolderName = isInsideFolder
      ? (folderPath || []).slice(-1)[0]?.name || 'Folder'
      : null;
    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleEmptyFolderDrop}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          textAlign: 'center',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '2px dashed var(--border-subtle)',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: isInsideFolder ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px', color: 'var(--accent-primary)'
        }}>
          <Folder size={32} fill={isInsideFolder ? 'rgba(99,102,241,0.4)' : 'none'} />
        </div>
        {isInsideFolder ? (
          <>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
              📂 &ldquo;{currentFolderName}&rdquo; is ready
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '360px', marginBottom: '20px' }}>
              This folder is active. Drag &amp; drop files here, or click upload to add items into this vault folder.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={() => setIsUploadOpen(true)}
                style={{ padding: '10px 22px', borderRadius: '12px', fontWeight: 700, fontSize: '0.88rem' }}
              >
                Upload Files into &ldquo;{currentFolderName}&rdquo;
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No items in this view</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '360px' }}>
              {activeCategory === 'trash'
                ? 'Trash is completely empty.'
                : 'Upload a file or create a folder to start storing your data.'}
            </p>
          </>
        )}
      </div>
    );
  }

  const filesToRender = displayedFiles.slice(0, visibleCount);
  const hasMore = displayedFiles.length > visibleCount;

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
        gap: '16px'
      }}>
        {/* Folders */}
        {displayedFolders.map(folder => (
          <FolderCard
            key={folder.id}
            folder={folder}
            activeMenuId={activeMenuId}
            setActiveMenuId={setActiveMenuId}
            onRename={() => setRenameTarget({ item: folder, isFolder: true })}
          />
        ))}

        {/* Files */}
        {filesToRender.map(file => (
          <MemoizedFileGridCard
            key={file.id}
            file={file}
            activeMenuId={activeMenuId}
            setActiveMenuId={setActiveMenuId}
            onRename={() => setRenameTarget({ item: file, isFolder: false })}
            onEditMedia={() => setEditorTarget(file)}
            onConvert={() => setActiveCategory('converter')}
            onDownload={() => handleDownload(file)}
          />
        ))}
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

const MemoizedFolderCard = React.memo(FolderCard);
const MemoizedFileGridCard = React.memo(FileGridCard);


function FolderCard({ folder, activeMenuId, setActiveMenuId, onRename }) {
  const { toggleStar, selectedItems, toggleSelectItem, navigateToFolder, files, folders, uploadFiles, moveItemsToFolder } = useStorage();
  const [isDragOver, setIsDragOver] = useState(false);
  const isSelected = selectedItems.includes(folder.id);

  const childFiles = files.filter(f => String(f.folderId) === String(folder.id) && !f.inTrash);
  const childSubFolders = folders.filter(f => String(f.parentId) === String(folder.id) && !f.inTrash);
  const totalContents = childFiles.length + childSubFolders.length;

  const handleCardClick = (e) => {
    e.stopPropagation();
    if (!folder.inTrash) {
      navigateToFolder(folder.id, folder.name);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!folder.inTrash) {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await uploadFiles(e.dataTransfer.files, folder.id);
      }
    }
  };

  return (
    <div
      className="glass-panel"
      onClick={handleCardClick}
      onDoubleClick={handleCardClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: isDragOver ? '2px dashed #10b981' : isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
        background: isDragOver ? 'rgba(16, 185, 129, 0.15)' : isSelected ? 'rgba(99, 102, 241, 0.16)' : 'var(--bg-surface)',
        minHeight: '135px',
        transform: isDragOver ? 'scale(1.02)' : 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            onClick={(e) => { e.stopPropagation(); toggleSelectItem(folder.id); }}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: isSelected ? '2px solid var(--accent-primary)' : '2px solid var(--border-subtle)',
              background: isSelected ? 'var(--accent-primary)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isSelected && <Check size={12} color="#ffffff" />}
          </div>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: `${folder.color || '#6366f1'}22`,
            color: folder.color || '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${folder.color || '#6366f1'}44`
          }}>
            <Folder size={20} fill={folder.color || '#6366f1'} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontWeight: 600 }}>
            {totalContents} item{totalContents !== 1 ? 's' : ''}
          </span>
          {!folder.inTrash && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleStar(folder.id, true); }}
              style={{ background: 'none', border: 'none', color: folder.starred ? '#f59e0b' : 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            >
              <Star size={16} fill={folder.starred ? '#f59e0b' : 'none'} />
            </button>
          )}
          
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === folder.id ? null : folder.id); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            >
              <MoreVertical size={16} />
            </button>

            {activeMenuId === folder.id && (
              <ContextMenu
                item={folder}
                isFolder={true}
                onClose={() => setActiveMenuId(null)}
                onRename={onRename}
                onOpenFolder={() => navigateToFolder(folder.id, folder.name)}
              />
            )}
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {folder.name}
        </div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Folder</span>
          <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>Click to Open &rarr;</span>
        </div>
      </div>
    </div>
  );
}

function FileGridCard({ file, activeMenuId, setActiveMenuId, onRename, onEditMedia, onConvert, onDownload }) {
  const { toggleStar, setActivePreview, setActiveShare, setActiveAudioTrack, selectedItems, toggleSelectItem } = useStorage();
  const [thumbUrl, setThumbUrl] = useState(null);
  const isSelected = selectedItems.includes(file.id);

  useEffect(() => {
    if (file.blob && (file.category === 'image' || file.category === 'video')) {
      const url = URL.createObjectURL(file.blob);
      setThumbUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'image': return <ImageIcon size={22} color="#06b6d4" />;
      case 'video': return <Video size={22} color="#ec4899" />;
      case 'audio': return <Music size={22} color="#f59e0b" />;
      case 'document': return <FileText size={22} color="#10b981" />;
      case 'code': return <Code2 size={22} color="#8b5cf6" />;
      case 'archive': return <Archive size={22} color="#6366f1" />;
      default: return <File size={22} color="#94a3b8" />;
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div
      className="glass-panel"
      onClick={() => !file.inTrash && setActivePreview(file)}
      style={{
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'var(--transition-fast)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
        background: isSelected ? 'rgba(99, 102, 241, 0.16)' : 'var(--bg-surface)',
        minHeight: '185px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            onClick={(e) => { e.stopPropagation(); toggleSelectItem(file.id); }}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: isSelected ? '2px solid var(--accent-primary)' : '2px solid var(--border-subtle)',
              background: isSelected ? 'var(--accent-primary)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isSelected && <Check size={12} color="#ffffff" />}
          </div>
          <span className="badge badge-indigo" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
            {file.category}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {!file.inTrash && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleStar(file.id, false); }}
              style={{ background: 'none', border: 'none', color: file.starred ? '#f59e0b' : 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
            >
              <Star size={15} fill={file.starred ? '#f59e0b' : 'none'} />
            </button>
          )}

          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === file.id ? null : file.id); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
            >
              <MoreVertical size={16} />
            </button>

            {activeMenuId === file.id && (
              <ContextMenu
                item={file}
                isFolder={false}
                onClose={() => setActiveMenuId(null)}
                onRename={onRename}
                onEditMedia={onEditMedia}
                onConvert={onConvert}
                onDownload={onDownload}
                onPreview={() => setActivePreview(file)}
                onShare={() => setActiveShare(file)}
              />
            )}
          </div>
        </div>
      </div>

      <div style={{
        height: '95px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-input)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        marginBottom: '10px'
      }}>
        {file.category === 'image' && thumbUrl ? (
          <img src={thumbUrl} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : file.category === 'video' && thumbUrl ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video src={thumbUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Play size={16} fill="#ffffff" color="#ffffff" style={{ marginLeft: '2px' }} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            {getCategoryIcon(file.category)}
            {file.category === 'audio' && (
              <button
                onClick={(e) => { e.stopPropagation(); setActiveAudioTrack(file); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                <Play size={10} fill="#ffffff" /> Play Audio
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {file.name}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>{formatSize(file.size)}</span>
          <span>{new Date(file.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

function ContextMenu({ item, isFolder, onClose, onRename, onEditMedia, onConvert, onDownload, onPreview, onShare, onOpenFolder }) {
  const { moveToTrash, restoreFromTrash, deletePermanently, zipSelectedFiles, unzipFile, setMoveModalTarget } = useStorage();

  const isMedia = item.category === 'image' || item.category === 'video';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: '24px',
        right: '0',
        width: '190px',
        background: 'var(--bg-modal)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        padding: '6px',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}
    >
      {!item.inTrash ? (
        <>
          {isFolder && onOpenFolder && (
            <button className="btn btn-ghost" onClick={() => { onOpenFolder(); onClose(); }} style={{ ...menuBtnStyle, color: 'var(--accent-primary)', fontWeight: 700 }}>
              <Folder size={14} /> Open Folder
            </button>
          )}
          {!isFolder && onPreview && (
            <button className="btn btn-ghost" onClick={() => { onPreview(); onClose(); }} style={menuBtnStyle}>
              <Eye size={14} /> Open Preview
            </button>
          )}
          {!isFolder && isMedia && onEditMedia && (
            <button className="btn btn-ghost" onClick={() => { onEditMedia(); onClose(); }} style={{ ...menuBtnStyle, color: 'var(--accent-amber)' }}>
              <Sliders size={14} /> Pro Media Editor
            </button>
          )}
          {!isFolder && onConvert && (
            <button className="btn btn-ghost" onClick={() => { onConvert(); onClose(); }} style={{ ...menuBtnStyle, color: 'var(--accent-cyan)' }}>
              <RefreshCw size={14} /> Format Converter
            </button>
          )}
          {!isFolder && (
            <button className="btn btn-ghost" onClick={() => { zipSelectedFiles(); onClose(); }} style={{ ...menuBtnStyle, color: 'var(--accent-amber)' }}>
              <Archive size={14} /> Compress into .ZIP
            </button>
          )}
          {!isFolder && (item.name?.endsWith('.zip') || item.category === 'archive') && (
            <button className="btn btn-ghost" onClick={() => { unzipFile(item); onClose(); }} style={{ ...menuBtnStyle, color: 'var(--accent-cyan)' }}>
              <FolderOutput size={14} /> Unzip Archive File
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => { setMoveModalTarget([item.id]); onClose(); }} style={menuBtnStyle}>
            <FolderInput size={14} /> Move to Folder...
          </button>
          {!isFolder && onDownload && (
            <button className="btn btn-ghost" onClick={() => { onDownload(); onClose(); }} style={menuBtnStyle}>
              <Download size={14} /> Download
            </button>
          )}
          {!isFolder && onShare && (
            <button className="btn btn-ghost" onClick={() => { onShare(); onClose(); }} style={menuBtnStyle}>
              <Share2 size={14} /> Share Link
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => { onRename(); onClose(); }} style={menuBtnStyle}>
            <Edit3 size={14} /> Rename
          </button>
          <button className="btn btn-ghost" onClick={() => { moveToTrash(item.id, isFolder); onClose(); }} style={{ ...menuBtnStyle, color: 'var(--accent-rose)' }}>
            <Trash2 size={14} /> Move to Trash
          </button>
        </>
      ) : (
        <>
          <button className="btn btn-ghost" onClick={() => { restoreFromTrash(item.id, isFolder); onClose(); }} style={menuBtnStyle}>
            <RotateCcw size={14} /> Restore
          </button>
          <button className="btn btn-ghost" onClick={() => { deletePermanently(item.id, isFolder); onClose(); }} style={{ ...menuBtnStyle, color: 'var(--accent-rose)' }}>
            <Trash2 size={14} /> Delete Forever
          </button>
        </>
      )}
    </div>
  );
}

const menuBtnStyle = {
  width: '100%',
  justifyContent: 'flex-start',
  padding: '6px 10px',
  fontSize: '0.8rem'
};
