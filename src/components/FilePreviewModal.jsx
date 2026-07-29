import React, { useState, useEffect } from 'react';
import { useStorage } from '../context/StorageContext';
import { MediaEditorModal } from './MediaEditorModal';
import { WordDocsEditorModal } from './WordDocsEditorModal';
import { AcrobatPdfEditorModal } from './AcrobatPdfEditorModal';
import { DocumentEditorModal } from './DocumentEditorModal';
import {
  X, Download, Share2, Maximize2, Minimize2, Sliders,
  RotateCw, Sun, Contrast, Monitor, Smartphone, Globe,
  Maximize, RefreshCw, Pencil
} from 'lucide-react';

export function FilePreviewModal() {
  const { activePreview, setActivePreview, setActiveShare, setActiveCategory } = useStorage();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deviceMode, setDeviceMode] = useState('raw');

  // Modal Open States
  const [isMediaEditorOpen, setIsMediaEditorOpen] = useState(false);
  const [isWordEditorOpen, setIsWordEditorOpen] = useState(false);
  const [isPdfEditorOpen, setIsPdfEditorOpen] = useState(false);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);

  // Image Filter Controls
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showFilterBar, setShowFilterBar] = useState(false);

  const [objectUrl, setObjectUrl] = useState(null);
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    if (!activePreview) {
      setObjectUrl(null);
      setTextContent('');
      return;
    }

    if (activePreview.blob) {
      const url = URL.createObjectURL(activePreview.blob);
      setObjectUrl(url);

      if (activePreview.category === 'document' || activePreview.category === 'code') {
        const reader = new FileReader();
        reader.onload = (e) => setTextContent(e.target.result || '');
        reader.readAsText(activePreview.blob);
      }

      return () => URL.revokeObjectURL(url);
    } else if (activePreview.content) {
      setTextContent(activePreview.content);
    }
  }, [activePreview]);

  if (!activePreview) return null;

  const handleDownload = () => {
    if (!activePreview.blob) return;
    const url = URL.createObjectURL(activePreview.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activePreview.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenConverterPage = () => {
    setActivePreview(null);
    setActiveCategory('converter');
  };

  const handleOpenEdit = () => {
    const cat = activePreview.category;
    const ext = activePreview.name?.split('.').pop()?.toLowerCase() || '';

    if (cat === 'image' || cat === 'video' || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'mov', 'mkv'].includes(ext)) {
      setIsMediaEditorOpen(true);
    } else if (ext === 'pdf' || activePreview.type === 'application/pdf') {
      setIsPdfEditorOpen(true);
    } else if (['docx', 'doc', 'rtf', 'odt', 'txt', 'md'].includes(ext) || cat === 'document') {
      setIsWordEditorOpen(true);
    } else {
      setIsCodeEditorOpen(true);
    }
  };

  const getDeviceFrameStyles = () => {
    switch (deviceMode) {
      case 'mobile':
        return {
          width: '375px',
          height: '680px',
          borderRadius: '40px',
          border: '12px solid #1e293b',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 40px var(--accent-glow)',
          overflow: 'hidden'
        };
      case 'laptop':
        return {
          width: '840px',
          height: '500px',
          borderRadius: '16px',
          border: '14px solid #0f172a',
          boxShadow: '0 25px 70px rgba(0,0,0,0.9)',
          overflow: 'hidden'
        };
      case 'browser':
        return {
          width: '100%',
          maxWidth: '920px',
          height: '560px',
          borderRadius: '16px',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          overflow: 'hidden'
        };
      case 'raw':
      default:
        return {
          width: '100%',
          height: '100%',
          borderRadius: '0',
          border: 'none',
          boxShadow: 'none',
          overflow: 'hidden'
        };
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        padding: isFullscreen ? '0' : '16px',
        background: 'rgba(3, 7, 18, 0.94)',
        backdropFilter: 'blur(24px)',
        zIndex: 2000
      }}
    >
      <div
        style={{
          width: isFullscreen ? '100vw' : '98vw',
          maxWidth: isFullscreen ? '100vw' : '1400px',
          height: isFullscreen ? '100vh' : '94vh',
          background: 'var(--bg-modal)',
          borderRadius: isFullscreen ? '0' : 'var(--radius-lg)',
          border: isFullscreen ? 'none' : '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Control Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <span className="badge badge-indigo" style={{ textTransform: 'uppercase' }}>
              {activePreview.category}
            </span>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {activePreview.name}
            </h3>
          </div>

          {/* View Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--bg-input)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              className="btn btn-ghost"
              onClick={() => setDeviceMode('raw')}
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                background: deviceMode === 'raw' ? 'var(--accent-primary)' : 'transparent',
                color: deviceMode === 'raw' ? '#fff' : 'var(--text-muted)'
              }}
              title="Full-Sized Edge-to-Edge View"
            >
              <Maximize size={14} /> Full Sized
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setDeviceMode('browser')}
              style={{ padding: '6px 10px', background: deviceMode === 'browser' ? 'var(--accent-primary)' : 'transparent', color: deviceMode === 'browser' ? '#fff' : 'var(--text-muted)' }}
              title="Browser Window Mockup"
            >
              <Globe size={15} />
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setDeviceMode('laptop')}
              style={{ padding: '6px 10px', background: deviceMode === 'laptop' ? 'var(--accent-primary)' : 'transparent', color: deviceMode === 'laptop' ? '#fff' : 'var(--text-muted)' }}
              title="Laptop Frame"
            >
              <Monitor size={15} />
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setDeviceMode('mobile')}
              style={{ padding: '6px 10px', background: deviceMode === 'mobile' ? 'var(--accent-primary)' : 'transparent', color: deviceMode === 'mobile' ? '#fff' : 'var(--text-muted)' }}
              title="Smartphone Frame"
            >
              <Smartphone size={15} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={handleOpenConverterPage}
              title="Open Full Format Converter Studio"
            >
              <RefreshCw size={18} color="var(--accent-cyan)" />
            </button>

            {activePreview.category === 'image' && (
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowFilterBar(prev => !prev)}
                title="Image Canvas Adjustments"
              >
                <Sliders size={18} color="var(--accent-cyan)" />
              </button>
            )}

            {/* Edit Button — Universal Dedicated Editor Trigger */}
            <button
              className="btn btn-ghost btn-icon"
              onClick={handleOpenEdit}
              title="Open Dedicated Editor"
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: '10px'
              }}
            >
              <Pencil size={17} color="var(--accent-primary)" />
            </button>

            <button className="btn btn-ghost btn-icon" onClick={handleDownload} title="Download File">
              <Download size={18} color="var(--accent-emerald)" />
            </button>

            <button className="btn btn-ghost btn-icon" onClick={() => setActiveShare(activePreview)} title="Share Link">
              <Share2 size={18} color="var(--accent-amber)" />
            </button>

            <button className="btn btn-ghost btn-icon" onClick={() => setIsFullscreen(prev => !prev)} title="Toggle Fullscreen Theater">
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <button className="btn btn-ghost btn-icon" onClick={() => setActivePreview(null)}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Adjustment Bar */}
        {showFilterBar && activePreview.category === 'image' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            padding: '10px 20px',
            background: 'var(--bg-input)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.8rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sun size={14} /> Brightness
              <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Contrast size={14} /> Contrast
              <input type="range" min="50" max="150" value={contrast} onChange={(e) => setContrast(e.target.value)} />
            </div>
            <button className="btn btn-ghost" onClick={() => setRotation(r => (r + 90) % 360)} style={{ fontSize: '0.78rem' }}>
              <RotateCw size={14} /> Rotate
            </button>
          </div>
        )}

        {/* Main Preview Container Canvas */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: deviceMode === 'raw' ? '0' : '24px',
          background: '#040711',
          overflow: 'auto'
        }}>
          <div style={getDeviceFrameStyles()}>
            {deviceMode === 'browser' && (
              <div style={{
                height: '36px',
                background: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                gap: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                </div>
                <div style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '6px',
                  padding: '2px 10px',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  https://vault.aetherdrive.io/preview/{activePreview.name}
                </div>
              </div>
            )}

            {deviceMode === 'mobile' && (
              <div style={{
                height: '24px',
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ width: '90px', height: '12px', background: '#0f172a', borderRadius: '10px' }} />
              </div>
            )}

            <div style={{
              width: '100%',
              height: deviceMode === 'browser' ? 'calc(100% - 36px)' : deviceMode === 'mobile' ? 'calc(100% - 24px)' : '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'auto',
              background: '#040711',
              padding: deviceMode === 'raw' ? '0' : '16px'
            }}>
              {activePreview.category === 'image' && objectUrl && (
                <img
                  src={objectUrl}
                  alt={activePreview.name}
                  style={{
                    width: deviceMode === 'raw' ? '100%' : 'auto',
                    height: deviceMode === 'raw' ? '100%' : 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                    transform: `rotate(${rotation}deg)`,
                    transition: 'transform 0.3s ease'
                  }}
                />
              )}

              {activePreview.category === 'video' && objectUrl && (
                <video
                  src={objectUrl}
                  controls
                  autoPlay
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              )}

              {(activePreview.category === 'document' || activePreview.category === 'code') && (
                <pre style={{
                  width: '100%',
                  height: '100%',
                  padding: '24px',
                  background: '#0d1117',
                  color: '#e6edf3',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  overflow: 'auto',
                  borderRadius: deviceMode === 'raw' ? '0' : '8px',
                  textAlign: 'left',
                  whiteSpace: 'pre-wrap'
                }}>
                  {textContent || 'Loading document preview...'}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* 1. Photo & Video Studio Editor */}
        <MediaEditorModal
          file={activePreview}
          isOpen={isMediaEditorOpen}
          onClose={() => setIsMediaEditorOpen(false)}
        />

        {/* 2. MS Word-Style Document Studio */}
        <WordDocsEditorModal
          file={activePreview}
          isOpen={isWordEditorOpen}
          onClose={() => setIsWordEditorOpen(false)}
        />

        {/* 3. Adobe Acrobat-Style PDF Studio */}
        <AcrobatPdfEditorModal
          file={activePreview}
          isOpen={isPdfEditorOpen}
          onClose={() => setIsPdfEditorOpen(false)}
        />

        {/* 4. HTML & Web Code Studio */}
        <DocumentEditorModal
          file={activePreview}
          isOpen={isCodeEditorOpen}
          onClose={() => setIsCodeEditorOpen(false)}
        />
      </div>
    </div>
  );
}
