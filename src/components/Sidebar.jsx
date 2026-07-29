import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { QuickSnippetModal } from './QuickSnippetModal';
import { DesktopDriveModal } from './DesktopDriveModal';
import {
  Cloud,
  FolderPlus,
  Upload,
  HardDrive,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  Code2,
  Star,
  Trash2,
  PieChart,
  Zap,
  FileCode,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen,
  UserCircle2,
  FileCode2,
  Monitor,
  Sliders
} from 'lucide-react';

export function Sidebar({ isOpen, isCollapsed, onToggleCollapse, onCloseMobile }) {
  const {
    activeCategory,
    setActiveCategory,
    navigateToFolder,
    setIsUploadOpen,
    setIsNewFolderOpen,
    setIsAnalyticsOpen,
    storageStats
  } = useStorage();

  const [isSnippetOpen, setIsSnippetOpen] = useState(false);
  const [isDesktopDriveOpen, setIsDesktopDriveOpen] = useState(false);

  const handleCategoryClick = (catKey) => {
    setActiveCategory(catKey);
    if (catKey === 'all' && typeof navigateToFolder === 'function') {
      navigateToFolder(null, 'My Vault');
    }
    if (onCloseMobile) onCloseMobile();
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usedBytes = storageStats.totalBytes || 0;
  const usagePercentage = Math.min(100, Math.max(1, (usedBytes / (1024 * 1024 * 10)) * 100)).toFixed(1);

  const sidebarWidth = isCollapsed ? '72px' : '260px';

  return (
    <>
      <aside className={`sidebar glass-panel ${isOpen ? 'open' : ''}`} style={{
        width: sidebarWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: isCollapsed ? '20px 8px' : '24px 16px',
        borderRight: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
        zIndex: 100,
        flexShrink: 0,
        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), padding 0.3s ease'
      }}>
        {/* Header & Toggle Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          gap: '8px',
          marginBottom: '24px',
          padding: '0 2px'
        }}>
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 20px var(--accent-glow)',
                flexShrink: 0
              }}>
                <Cloud size={22} color="#ffffff" />
              </div>
              <div style={{ minWidth: 0, whiteSpace: 'nowrap' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
                  Storage Bank
                </h2>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>
                  UNLIMITED VAULT
                </span>
              </div>
            </div>
          )}

          <button
            className="btn btn-ghost btn-icon"
            onClick={onToggleCollapse}
            style={{ padding: '8px', color: 'var(--text-muted)' }}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={20} color="var(--accent-primary)" /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        {/* Main Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => { setIsUploadOpen(true); if (onCloseMobile) onCloseMobile(); }}
            style={{ width: '100%', justifyContent: 'center', padding: isCollapsed ? '10px' : '12px' }}
            title="Upload File"
          >
            <Upload size={18} />
            {!isCollapsed && <span>Upload File</span>}
          </button>
          
          {!isCollapsed ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => { setIsNewFolderOpen(true); if (onCloseMobile) onCloseMobile(); }}
                style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: '0.78rem' }}
              >
                <FolderPlus size={15} />
                <span>Folder</span>
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setIsSnippetOpen(true)}
                style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: '0.78rem' }}
              >
                <FileCode2 size={15} color="var(--accent-cyan)" />
                <span>Snippet</span>
              </button>
            </div>
          ) : (
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => setIsSnippetOpen(true)}
              title="Quick Code Snippet"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <FileCode2 size={18} color="var(--accent-cyan)" />
            </button>
          )}
        </div>

        {/* Navigation Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {!isCollapsed && (
            <div style={{ padding: '8px', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              STORAGE VIEWS
            </div>
          )}
          
          <NavItem 
            icon={<HardDrive size={18} />} 
            label="All Files" 
            isCollapsed={isCollapsed}
            active={activeCategory === 'all'} 
            onClick={() => handleCategoryClick('all')} 
          />
          <NavItem 
            icon={<ImageIcon size={18} />} 
            label="Photos & Media" 
            isCollapsed={isCollapsed}
            active={activeCategory === 'image'} 
            onClick={() => handleCategoryClick('image')} 
          />
          <NavItem 
            icon={<FileText size={18} />} 
            label="Documents" 
            isCollapsed={isCollapsed}
            active={activeCategory === 'document'} 
            onClick={() => handleCategoryClick('document')} 
          />
          <NavItem 
            icon={<Video size={18} />} 
            label="Video Vault" 
            isCollapsed={isCollapsed}
            active={activeCategory === 'video'} 
            onClick={() => handleCategoryClick('video')} 
          />
          <NavItem 
            icon={<Music size={18} />} 
            label="Audio Files" 
            isCollapsed={isCollapsed}
            active={activeCategory === 'audio'} 
            onClick={() => handleCategoryClick('audio')} 
          />
          <NavItem 
            icon={<Code2 size={18} />} 
            label="Code & Scripts" 
            isCollapsed={isCollapsed}
            active={activeCategory === 'code'} 
            onClick={() => handleCategoryClick('code')} 
          />
          
          {!isCollapsed && (
            <div style={{ margin: '12px 0 4px 0', padding: '8px', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TOOLS & TRASH
            </div>
          )}

          <NavItem 
            icon={<Sliders size={18} color="var(--accent-amber)" />} 
            label="Edited Media Vault" 
            isCollapsed={isCollapsed}
            active={activeCategory === 'edited'} 
            onClick={() => handleCategoryClick('edited')} 
          />

          <NavItem 
            icon={<RefreshCw size={18} color="var(--accent-cyan)" />} 
            label="Format Converter Studio" 
            isCollapsed={isCollapsed}
            active={activeCategory === 'converter'} 
            onClick={() => handleCategoryClick('converter')} 
          />

          <NavItem 
            icon={<Monitor size={18} color="var(--accent-primary)" />} 
            label="Windows PC Drive (Z:)" 
            isCollapsed={isCollapsed}
            active={false} 
            onClick={() => { setIsDesktopDriveOpen(true); if (onCloseMobile) onCloseMobile(); }} 
          />

          <NavItem 
            icon={<Star size={18} />} 
            label="Starred Items" 
            isCollapsed={isCollapsed}
            active={activeCategory === 'starred'} 
            onClick={() => handleCategoryClick('starred')} 
          />
          <NavItem 
            icon={<Trash2 size={18} />} 
            label="Trash" 
            isCollapsed={isCollapsed}
            active={activeCategory === 'trash'} 
            onClick={() => handleCategoryClick('trash')} 
          />

          {!isCollapsed && (
            <div style={{ margin: '12px 0 4px 0', padding: '8px', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ACCOUNT
            </div>
          )}

          <NavItem 
            icon={<UserCircle2 size={18} color="var(--accent-cyan)" />} 
            label="Account & Profile" 
            isCollapsed={isCollapsed}
            active={activeCategory === 'profile'} 
            onClick={() => handleCategoryClick('profile')} 
          />
        </div>

        {/* Storage Gauge Widget */}
        {!isCollapsed ? (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            marginTop: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)' }}>Storage Used</span>
              <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                <Zap size={10} /> Unlimited Bank
              </span>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              {formatSize(usedBytes)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '400' }}>/ Unlimited</span>
            </div>
            
            <div style={{
              width: '100%',
              height: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '10px'
            }}>
              <div style={{
                width: `${Math.min(100, Math.max(8, (usedBytes / (1024 * 1024 * 1024 * 10)) * 100))}%`,
                height: '100%',
                background: 'var(--accent-gradient)',
                borderRadius: '10px',
                transition: 'var(--transition-normal)'
              }} />
            </div>

            <button 
              className="btn btn-ghost" 
              onClick={() => { setIsAnalyticsOpen(true); if (onCloseMobile) onCloseMobile(); }}
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', padding: '6px' }}
            >
              <PieChart size={14} />
              <span>Analytics & Health</span>
            </button>

            <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.04em' }}>
              Crafted with <span style={{ color: 'var(--accent-rose)' }}>♥</span> <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800' }}>Made by Arpon</span>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setIsAnalyticsOpen(true)}
            title="Storage Analytics"
            style={{ marginTop: '12px', justifyContent: 'center' }}
          >
            <PieChart size={20} color="var(--accent-primary)" />
          </button>
        )}
      </aside>

      <QuickSnippetModal isOpen={isSnippetOpen} onClose={() => setIsSnippetOpen(false)} />
      <DesktopDriveModal isOpen={isDesktopDriveOpen} onClose={() => setIsDesktopDriveOpen(false)} />
    </>
  );
}

function NavItem({ icon, label, isCollapsed, active, onClick }) {
  return (
    <button
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        gap: '12px',
        width: '100%',
        padding: isCollapsed ? '10px' : '10px 14px',
        borderRadius: 'var(--radius-md)',
        border: 'none',
        background: active ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
        fontWeight: active ? '600' : '500',
        fontSize: '0.88rem',
        cursor: 'pointer',
        transition: 'var(--transition-fast)',
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--bg-surface-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      <span style={{ color: active ? 'var(--accent-primary)' : 'var(--text-muted)' }}>{icon}</span>
      {!isCollapsed && <span>{label}</span>}
    </button>
  );
}
