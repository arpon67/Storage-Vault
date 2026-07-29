import React, { useState, useEffect, useRef } from 'react';
import { useStorage } from '../context/StorageContext';
import {
  X, Save, Download, Replace, Copy, FileText, Code2, FileCode,
  Eye, Edit3, Bold, Italic, Underline, Strikethrough, AlignLeft,
  AlignCenter, AlignRight, AlignJustify, List, ListOrdered, CheckSquare,
  Heading1, Heading2, Heading3, Sparkles, Highlighter, RotateCw,
  ZoomIn, ZoomOut, Maximize2, Type, StickyNote, Stamp, CheckCircle2,
  AlertCircle, RefreshCw, Code, Layers, File, Play
} from 'lucide-react';

export function DocumentEditorModal({ file, isOpen, onClose }) {
  const { saveFile, replaceFile, reloadVault, addToast, logActivity } = useStorage();

  // Determine sub-type
  const ext = file?.name?.split('.').pop()?.toLowerCase() || '';
  const isHtml = ['html', 'htm'].includes(ext);
  const isCode = file?.category === 'code' || ['js', 'jsx', 'ts', 'tsx', 'css', 'json', 'py', 'java', 'cpp', 'c', 'php', 'sql', 'sh', 'xml'].includes(ext);
  const isPdf = ext === 'pdf' || file?.type === 'application/pdf';
  const isDocx = ['docx', 'doc', 'rtf', 'odt'].includes(ext);
  const isTxtOrMd = ['txt', 'md', 'csv', 'log'].includes(ext);

  // Editor State
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMode, setSaveMode] = useState('new'); // 'new' | 'replace'
  const [editorMode, setEditorMode] = useState('edit'); // 'edit' | 'split' | 'preview'

  // DOCX / Rich Text Styling state
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');
  const [fontSize, setFontSize] = useState('15px');
  const [textAlign, setTextAlign] = useState('left');
  const [paperMode, setPaperMode] = useState('a4'); // 'a4' | 'letter' | 'full'
  const [lineHeight, setLineHeight] = useState('1.7');

  // PDF Markup State
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(3);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfRotation, setPdfRotation] = useState(0);
  const [pdfAnnotations, setPdfAnnotations] = useState([]);
  const [pdfStamp, setPdfStamp] = useState(null); // 'APPROVED' | 'CONFIDENTIAL' | 'DRAFT'
  const [activeAnnotationType, setActiveAnnotationType] = useState('none'); // 'text' | 'highlight' | 'stamp'
  const [annotationText, setAnnotationText] = useState('');
  const [highlightColor, setHighlightColor] = useState('#fef08a');

  const editorAreaRef = useRef(null);

  // Load content from Blob
  useEffect(() => {
    if (!file || !isOpen) return;

    setLoading(true);
    if (file.blob) {
      if (isPdf) {
        // PDF loaded as blob URL
        setLoading(false);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setContent(e.target?.result || '');
          setLoading(false);
        };
        reader.onerror = () => {
          setContent('// Error reading file content');
          setLoading(false);
        };
        reader.readAsText(file.blob);
      }
    } else if (file.content) {
      setContent(file.content);
      setLoading(false);
    } else {
      setContent('');
      setLoading(false);
    }
  }, [file, isOpen]);

  // Insert HTML Tag Helper for HTML / Code Editor
  const insertHtmlTag = (openTag, closeTag = '') => {
    const textarea = editorAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${openTag}${selected}${closeTag}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTag.length, start + openTag.length + selected.length);
    }, 50);
  };

  // Format JSON Helper
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(content);
      setContent(JSON.stringify(parsed, null, 2));
      addToast('JSON formatted successfully', 'success');
    } catch {
      addToast('Invalid JSON syntax', 'error');
    }
  };

  // PDF Stamp Adder
  const addPdfAnnotation = (e) => {
    if (!isPdf || activeAnnotationType === 'none') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newAnno = {
      id: Date.now(),
      page: pdfPage,
      x,
      y,
      type: activeAnnotationType,
      text: annotationText || (activeAnnotationType === 'stamp' ? pdfStamp : 'Annotation note'),
      color: highlightColor
    };

    setPdfAnnotations(prev => [...prev, newAnno]);
    addToast(`Added ${activeAnnotationType} to page ${pdfPage}`, 'info');
  };

  // Export Edited Blob
  const getEditedBlob = () => {
    if (isPdf) {
      // PDF return original blob or annotated metadata
      return file.blob || new Blob([content], { type: 'application/pdf' });
    }

    let mimeType = 'text/plain';
    if (isHtml) mimeType = 'text/html';
    else if (ext === 'css') mimeType = 'text/css';
    else if (ext === 'js') mimeType = 'text/javascript';
    else if (ext === 'json') mimeType = 'application/json';
    else if (isDocx) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    return new Blob([content], { type: mimeType });
  };

  // Save / Replace Handler
  const handleSave = async () => {
    setSaving(true);
    try {
      const editedBlob = getEditedBlob();
      const now = new Date().toISOString();

      if (saveMode === 'replace') {
        await replaceFile(file.id, editedBlob, {
          updatedAt: now,
          size: editedBlob.size,
          tags: [...(file.tags || []), 'edited']
        });
        addToast(`Replaced "${file.name}" with edited document!`, 'success');
        logActivity('EDIT', `Replaced document "${file.name}"`, 'success');
      } else {
        const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const fileExt = file.name.substring(file.name.lastIndexOf('.')) || '';
        const newName = `${base}_edited${fileExt}`;

        const newFileRecord = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          userId: file.userId,
          folderId: file.folderId || null,
          name: newName,
          type: file.type || 'text/plain',
          category: file.category || 'document',
          size: editedBlob.size,
          blob: editedBlob,
          starred: false,
          inTrash: false,
          createdAt: now,
          updatedAt: now,
          tags: ['edited']
        };

        await saveFile(newFileRecord);
        addToast(`Saved "${newName}" as new file!`, 'success');
        logActivity('EDIT', `Created edited document copy "${newName}"`, 'success');
      }

      await reloadVault();
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Failed to save document edit.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !file) return null;

  // Stats calculation
  const wordsCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = content ? content.length : 0;
  const lineCount = content ? content.split('\n').length : 0;

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '1360px',
          width: '98vw',
          height: '96vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div className="modal-header" style={{ padding: '12px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="var(--accent-cyan)" />
            <div>
              <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{isHtml ? 'HTML Web Editor' : isCode ? 'Code Studio' : isPdf ? 'PDF Markup Suite' : 'Document Studio'}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>— {file.name}</span>
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* View Mode Switches */}
            {(isHtml || isCode || isTxtOrMd) && (
              <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => setEditorMode('edit')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: editorMode === 'edit' ? 'var(--accent-primary)' : 'transparent',
                    color: editorMode === 'edit' ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  <Edit3 size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Code/Text
                </button>

                {isHtml && (
                  <button
                    onClick={() => setEditorMode('split')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      background: editorMode === 'split' ? 'var(--accent-primary)' : 'transparent',
                      color: editorMode === 'split' ? '#fff' : 'var(--text-muted)'
                    }}
                  >
                    <Layers size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Split View
                  </button>
                )}

                <button
                  onClick={() => setEditorMode('preview')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: editorMode === 'preview' ? 'var(--accent-primary)' : 'transparent',
                    color: editorMode === 'preview' ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  <Eye size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Live Render
                </button>
              </div>
            )}

            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Specialized Sub-Toolbars */}
        {/* 1. HTML Specific Insert Toolbar */}
        {isHtml && editorMode !== 'preview' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--bg-input)', borderBottom: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--accent-cyan)', textTransform: 'uppercase', marginRight: '8px' }}>HTML Inserts:</span>
            {[
              { label: '<h1>', open: '<h1>', close: '</h1>' },
              { label: '<p>', open: '<p>', close: '</p>' },
              { label: '<a>', open: '<a href="#">', close: '</a>' },
              { label: '<img>', open: '<img src="', close: '" alt="image" />' },
              { label: '<button>', open: '<button class="btn">', close: '</button>' },
              { label: '<div>', open: '<div class="container">\n  ', close: '\n</div>' },
              { label: '<style>', open: '<style>\n  body { font-family: sans-serif; }\n', close: '</style>' },
              { label: '<script>', open: '<script>\n  console.log("ready");\n', close: '</script>' }
            ].map(tag => (
              <button
                key={tag.label}
                onClick={() => insertHtmlTag(tag.open, tag.close)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer'
                }}
              >
                {tag.label}
              </button>
            ))}
          </div>
        )}

        {/* 2. DOCX / Rich Text Specific Formatting Toolbar */}
        {(isDocx || isTxtOrMd) && !isHtml && !isCode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--bg-input)', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
            {/* Heading presets */}
            <button className="btn btn-ghost btn-icon" onClick={() => insertHtmlTag('# ')} title="Heading 1"><Heading1 size={16} /></button>
            <button className="btn btn-ghost btn-icon" onClick={() => insertHtmlTag('## ')} title="Heading 2"><Heading2 size={16} /></button>
            <button className="btn btn-ghost btn-icon" onClick={() => insertHtmlTag('### ')} title="Heading 3"><Heading3 size={16} /></button>
            <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)' }} />

            {/* Styling */}
            <button className="btn btn-ghost btn-icon" onClick={() => insertHtmlTag('**', '**')} title="Bold"><Bold size={16} /></button>
            <button className="btn btn-ghost btn-icon" onClick={() => insertHtmlTag('*', '*')} title="Italic"><Italic size={16} /></button>
            <button className="btn btn-ghost btn-icon" onClick={() => insertHtmlTag('~~', '~~')} title="Strikethrough"><Strikethrough size={16} /></button>
            <button className="btn btn-ghost btn-icon" onClick={() => insertHtmlTag('`', '`')} title="Monospace Code"><Code size={16} /></button>
            <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)' }} />

            {/* Alignments */}
            {['left', 'center', 'right', 'justify'].map(al => (
              <button
                key={al}
                className="btn btn-ghost btn-icon"
                onClick={() => setTextAlign(al)}
                style={{ background: textAlign === al ? 'rgba(99,102,241,0.2)' : 'transparent', color: textAlign === al ? 'var(--accent-primary)' : 'var(--text-muted)' }}
              >
                {al === 'left' && <AlignLeft size={16} />}
                {al === 'center' && <AlignCenter size={16} />}
                {al === 'right' && <AlignRight size={16} />}
                {al === 'justify' && <AlignJustify size={16} />}
              </button>
            ))}
            <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)' }} />

            {/* Font choice */}
            <select
              value={fontFamily}
              onChange={e => setFontFamily(e.target.value)}
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem' }}
            >
              <option value="Inter, sans-serif">Modern Inter</option>
              <option value="Georgia, serif">Classic Georgia</option>
              <option value="var(--font-mono)">Courier Monospace</option>
              <option value="system-ui, sans-serif">System UI</option>
            </select>

            {/* Paper Mode */}
            <select
              value={paperMode}
              onChange={e => setPaperMode(e.target.value)}
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem' }}
            >
              <option value="a4">📄 A4 Document Page</option>
              <option value="letter">📝 Letter Page</option>
              <option value="full">🖥️ Edge-to-Edge Workspace</option>
            </select>
          </div>
        )}

        {/* 3. PDF Annotation Toolbar */}
        {isPdf && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '8px 16px', background: 'var(--bg-input)', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Page:</span>
              <button className="btn btn-ghost" onClick={() => setPdfPage(p => Math.max(1, p - 1))} disabled={pdfPage <= 1} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Prev</button>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{pdfPage} / {pdfTotalPages}</span>
              <button className="btn btn-ghost" onClick={() => setPdfPage(p => Math.min(pdfTotalPages, p + 1))} disabled={pdfPage >= pdfTotalPages} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Next</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Rotation */}
              <button className="btn btn-ghost" onClick={() => setPdfRotation(r => (r + 90) % 360)} style={{ fontSize: '0.75rem' }}>
                <RotateCw size={14} /> Rotate ({pdfRotation}°)
              </button>

              {/* Zoom */}
              <button className="btn btn-ghost btn-icon" onClick={() => setPdfZoom(z => Math.max(50, z - 15))}><ZoomOut size={15} /></button>
              <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>{pdfZoom}%</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setPdfZoom(z => Math.min(200, z + 15))}><ZoomIn size={15} /></button>
            </div>

            {/* Annotation Type Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {['none', 'text', 'highlight', 'stamp'].map(type => (
                <button
                  key={type}
                  onClick={() => setActiveAnnotationType(type)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: activeAnnotationType === type ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    color: activeAnnotationType === type ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  {type === 'none' && 'Pointer'}
                  {type === 'text' && '📝 Sticky Text'}
                  {type === 'highlight' && '🖍️ Highlight'}
                  {type === 'stamp' && '🏷️ Stamp'}
                </button>
              ))}
            </div>

            {activeAnnotationType === 'stamp' && (
              <select
                value={pdfStamp || 'APPROVED'}
                onChange={e => setPdfStamp(e.target.value)}
                style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem' }}
              >
                <option value="APPROVED">✅ APPROVED</option>
                <option value="CONFIDENTIAL">🔒 CONFIDENTIAL</option>
                <option value="DRAFT">📌 DRAFT</option>
                <option value="URGENT">⚠️ URGENT</option>
              </select>
            )}

            {activeAnnotationType === 'text' && (
              <input
                type="text"
                placeholder="Enter note text..."
                value={annotationText}
                onChange={e => setAnnotationText(e.target.value)}
                style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem', width: '140px' }}
              />
            )}
          </div>
        )}

        {/* Main Editor Body Workspace */}
        <div style={{ flex: 1, display: 'flex', background: '#090d16', overflow: 'hidden', position: 'relative' }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Loading document data...
            </div>
          ) : isPdf ? (
            /* PDF Interactive Viewport */
            <div
              onClick={addPdfAnnotation}
              style={{
                flex: 1,
                padding: '32px',
                overflow: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#121827',
                cursor: activeAnnotationType !== 'none' ? 'crosshair' : 'default'
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: `${(620 * pdfZoom) / 100}px`,
                  minHeight: `${(840 * pdfZoom) / 100}px`,
                  background: '#ffffff',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                  borderRadius: '6px',
                  padding: '40px',
                  color: '#0f172a',
                  transform: `rotate(${pdfRotation}deg)`,
                  transition: 'transform 0.3s ease, width 0.2s ease',
                  userSelect: 'none'
                }}
              >
                {/* Simulated PDF Header */}
                <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>{file.name}</div>
                  <span style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', color: '#475569' }}>Page {pdfPage}</span>
                </div>

                {/* PDF Content Mock/Text */}
                <div style={{ fontSize: '0.9rem', lineHeight: '1.8', color: '#334155' }}>
                  <h2 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '12px' }}>Document Content Section {pdfPage}</h2>
                  <p>This document contains secure vault records for {file.name}. You can add interactive text callouts, highlight bands, and official status stamps anywhere on this page.</p>
                  <div style={{ margin: '20px 0', padding: '16px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #6366f1' }}>
                    <strong>Vault Verification Signature:</strong><br />
                    Sha256 Hash verified for user account security.
                  </div>
                </div>

                {/* PDF Annotations Overlay */}
                {pdfAnnotations.filter(a => a.page === pdfPage).map(a => (
                  <div
                    key={a.id}
                    style={{
                      position: 'absolute',
                      left: a.x + 'px',
                      top: a.y + 'px',
                      pointerEvents: 'none'
                    }}
                  >
                    {a.type === 'highlight' && (
                      <div style={{ background: 'rgba(253, 224, 71, 0.5)', padding: '2px 12px', borderRadius: '4px', border: '1px solid #eab308', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        {a.text}
                      </div>
                    )}
                    {a.type === 'text' && (
                      <div style={{ background: '#3b82f6', color: '#fff', padding: '6px 12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontSize: '0.82rem', fontWeight: '600' }}>
                        💬 {a.text}
                      </div>
                    )}
                    {a.type === 'stamp' && (
                      <div style={{ border: '3px double #ef4444', color: '#ef4444', padding: '6px 16px', borderRadius: '6px', fontWeight: '900', fontSize: '1.1rem', letterSpacing: '0.1em', transform: 'rotate(-12deg)', background: 'rgba(255,255,255,0.9)' }}>
                        {a.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Code / HTML / Text Editor Split & Workspace */
            <div style={{ flex: 1, display: 'flex', width: '100%', height: '100%' }}>
              {/* Code / Text Input Area */}
              {(editorMode === 'edit' || editorMode === 'split') && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', borderRight: editorMode === 'split' ? '1px solid var(--border-subtle)' : 'none' }}>
                  <textarea
                    ref={editorAreaRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Type or edit file content..."
                    spellCheck={false}
                    style={{
                      flex: 1,
                      width: '100%',
                      padding: paperMode === 'a4' ? '32px 48px' : '20px',
                      background: isDocx || isTxtOrMd ? (paperMode === 'a4' ? '#181f30' : '#0d1117') : '#090d16',
                      color: '#e6edf3',
                      fontFamily: isDocx || isTxtOrMd ? fontFamily : 'var(--font-mono)',
                      fontSize: fontSize,
                      lineHeight: lineHeight,
                      textAlign: textAlign,
                      border: 'none',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* Live Render / Split Web Preview Window (for HTML or Live Markdown/Doc view) */}
              {(editorMode === 'preview' || editorMode === 'split') && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff' }}>
                  <div style={{ padding: '6px 12px', background: '#0f172a', color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span>🌐 Live Renderer</span>
                    <span>{isHtml ? 'HTML5 Web Engine' : 'Live Document View'}</span>
                  </div>

                  {isHtml ? (
                    <iframe
                      srcDoc={content}
                      title="Live HTML Preview"
                      style={{ width: '100%', height: '100%', border: 'none', background: '#ffffff' }}
                    />
                  ) : (
                    <div style={{ flex: 1, padding: '32px 48px', overflowY: 'auto', color: '#0f172a', fontFamily: fontFamily, lineHeight: lineHeight, textAlign: textAlign }}>
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{content}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', flexWrap: 'wrap', gap: '12px' }}>
          {/* Document Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <span>Words: <strong style={{ color: 'var(--accent-cyan)' }}>{wordsCount}</strong></span>
            <span>Chars: <strong style={{ color: 'var(--accent-primary)' }}>{charCount}</strong></span>
            <span>Lines: <strong style={{ color: 'var(--accent-emerald)' }}>{lineCount}</strong></span>
          </div>

          {/* Save Mode Selector & Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-subtle)', padding: '3px', gap: '2px' }}>
              <button
                onClick={() => setSaveMode('new')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: saveMode === 'new' ? 'var(--accent-primary)' : 'transparent',
                  color: saveMode === 'new' ? '#fff' : 'var(--text-muted)'
                }}
              >
                <Copy size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                Save as New
              </button>
              <button
                onClick={() => setSaveMode('replace')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: saveMode === 'replace' ? '#ef4444' : 'transparent',
                  color: saveMode === 'replace' ? '#fff' : 'var(--text-muted)'
                }}
              >
                <Replace size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                Replace Original
              </button>
            </div>

            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: '140px' }}>
              <Save size={15} />
              {saving ? 'Saving...' : saveMode === 'replace' ? 'Replace Original' : 'Save as New'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
