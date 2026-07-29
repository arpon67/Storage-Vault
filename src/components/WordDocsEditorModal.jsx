import React, { useState, useEffect, useRef } from 'react';
import { useStorage } from '../context/StorageContext';
import {
  X, Save, Download, Replace, Copy, FileText, Bold, Italic,
  Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, List, ListOrdered, CheckSquare, Heading1, Heading2,
  Heading3, Highlighter, Table, Image, Minus, ZoomIn, ZoomOut,
  Sparkles, Layers, FileCode, CheckCircle2, Type
} from 'lucide-react';

export function WordDocsEditorModal({ file, isOpen, onClose }) {
  const { saveFile, replaceFile, reloadVault, addToast, logActivity } = useStorage();

  // Active Ribbon Tab
  const [activeRibbon, setActiveRibbon] = useState('home'); // 'home' | 'insert' | 'layout' | 'view'
  const [saveMode, setSaveMode] = useState('new'); // 'new' | 'replace'
  const [saving, setSaving] = useState(false);

  // Formatting State
  const [fontFamily, setFontFamily] = useState('Calibri, sans-serif');
  const [fontSize, setFontSize] = useState('16px');
  const [textColor, setTextColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('transparent');
  const [zoomLevel, setZoomLevel] = useState(100);

  // Document Stats
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const documentPaperRef = useRef(null);

  // Load initial content into contentEditable area
  useEffect(() => {
    if (!file || !isOpen) return;

    if (file.blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawText = e.target?.result || '';
        if (documentPaperRef.current) {
          // If plain text or html, parse cleanly
          if (rawText.startsWith('<') && rawText.endsWith('>')) {
            documentPaperRef.current.innerHTML = rawText;
          } else {
            const formatted = rawText.split('\n\n').map(p => `<p style="margin-bottom:1em;line-height:1.6">${p.replace(/\n/g, '<br/>')}</p>`).join('');
            documentPaperRef.current.innerHTML = formatted || `<p style="margin-bottom:1em;line-height:1.6">Type your document here...</p>`;
          }
          updateStats();
        }
      };
      reader.readAsText(file.blob);
    } else if (file.content) {
      if (documentPaperRef.current) {
        documentPaperRef.current.innerHTML = file.content;
        updateStats();
      }
    }
  }, [file, isOpen]);

  // Update Word & Character Counts
  const updateStats = () => {
    if (!documentPaperRef.current) return;
    const txt = documentPaperRef.current.innerText || '';
    const words = txt.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setCharCount(txt.length);
  };

  // Executive ExecCommand Helper for WYSIWYG Formatting
  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    if (documentPaperRef.current) {
      documentPaperRef.current.focus();
      updateStats();
    }
  };

  // Insert Table in MS Word document
  const insertTable = () => {
    const tableHTML = `
      <table style="width:100%; border-collapse:collapse; margin:16px 0; border:1px solid #cbd5e1;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="border:1px solid #cbd5e1; padding:8px 12px; text-align:left;">Header 1</th>
            <th style="border:1px solid #cbd5e1; padding:8px 12px; text-align:left;">Header 2</th>
            <th style="border:1px solid #cbd5e1; padding:8px 12px; text-align:left;">Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #cbd5e1; padding:8px 12px;">Data Cell 1</td>
            <td style="border:1px solid #cbd5e1; padding:8px 12px;">Data Cell 2</td>
            <td style="border:1px solid #cbd5e1; padding:8px 12px;">Data Cell 3</td>
          </tr>
        </tbody>
      </table>
      <p></p>
    `;
    execCmd('insertHTML', tableHTML);
  };

  // Save Document Blob
  const handleSave = async () => {
    if (!documentPaperRef.current) return;
    setSaving(true);
    try {
      const htmlContent = documentPaperRef.current.innerHTML;
      const textContent = documentPaperRef.current.innerText;
      const ext = file.name?.split('.').pop()?.toLowerCase() || '';

      let mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (ext === 'txt') mimeType = 'text/plain';
      else if (ext === 'html' || ext === 'htm') mimeType = 'text/html';

      const blobContent = ext === 'txt' ? textContent : htmlContent;
      const editedBlob = new Blob([blobContent], { type: mimeType });
      const now = new Date().toISOString();

      if (saveMode === 'replace') {
        await replaceFile(file.id, editedBlob, {
          updatedAt: now,
          size: editedBlob.size,
          tags: [...(file.tags || []), 'edited']
        });
        addToast(`Replaced "${file.name}" in MS Word format!`, 'success');
        logActivity('EDIT', `Replaced document "${file.name}"`, 'success');
      } else {
        const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const fileExt = file.name.substring(file.name.lastIndexOf('.')) || '.docx';
        const newName = `${base}_edited${fileExt}`;

        const newFileRecord = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          userId: file.userId,
          folderId: file.folderId || null,
          name: newName,
          type: mimeType,
          category: 'document',
          size: editedBlob.size,
          blob: editedBlob,
          starred: false,
          inTrash: false,
          createdAt: now,
          updatedAt: now,
          tags: ['edited']
        };

        await saveFile(newFileRecord);
        addToast(`Saved MS Word Document "${newName}"!`, 'success');
        logActivity('EDIT', `Created edited document copy "${newName}"`, 'success');
      }

      await reloadVault();
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Failed to save MS Word document.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !file) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '1440px',
          width: '98vw',
          height: '96vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#f8fafc'
        }}
      >
        {/* MS Word Blue Top Window Title Bar */}
        <div
          style={{
            height: '42px',
            background: '#1b365d',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={18} color="#60a5fa" />
            <span style={{ fontWeight: '800', fontSize: '0.9rem', letterSpacing: '0.02em' }}>Microsoft Word Document Studio</span>
            <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>— {file.name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ color: '#fff' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MS Word Ribbon Bar */}
        <div style={{ background: '#ffffff', borderBottom: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          {/* Ribbon Tabs */}
          <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #e2e8f0', padding: '0 12px', background: '#f1f5f9' }}>
            {['home', 'insert', 'layout', 'view'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveRibbon(tab)}
                style={{
                  padding: '8px 18px',
                  border: 'none',
                  background: activeRibbon === tab ? '#ffffff' : 'transparent',
                  color: activeRibbon === tab ? '#1b365d' : '#475569',
                  fontWeight: activeRibbon === tab ? '800' : '600',
                  fontSize: '0.82rem',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  borderTopLeftRadius: '6px',
                  borderTopRightRadius: '6px',
                  borderBottom: activeRibbon === tab ? '2px solid #1b365d' : 'none'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Ribbon Toolbar Controls */}
          <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', minHeight: '48px' }}>
            {activeRibbon === 'home' && (
              <>
                {/* Font Selector */}
                <select
                  value={fontFamily}
                  onChange={e => { setFontFamily(e.target.value); execCmd('fontName', e.target.value); }}
                  style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#fff', color: '#0f172a', fontWeight: '500' }}
                >
                  <option value="Calibri, sans-serif">Calibri</option>
                  <option value="Aptos, sans-serif">Aptos (Body)</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Courier New, monospace">Courier New</option>
                </select>

                {/* Font Size */}
                <select
                  value={fontSize}
                  onChange={e => { setFontSize(e.target.value); execCmd('fontSize', '4'); }}
                  style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#fff', color: '#0f172a' }}
                >
                  <option value="12px">12pt</option>
                  <option value="14px">14pt</option>
                  <option value="16px">16pt</option>
                  <option value="18px">18pt</option>
                  <option value="24px">24pt</option>
                  <option value="32px">32pt</option>
                </select>

                <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />

                {/* Text Styles */}
                <button onClick={() => execCmd('bold')} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Bold (Ctrl+B)">
                  <Bold size={15} color="#0f172a" />
                </button>
                <button onClick={() => execCmd('italic')} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Italic (Ctrl+I)">
                  <Italic size={15} color="#0f172a" />
                </button>
                <button onClick={() => execCmd('underline')} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Underline (Ctrl+U)">
                  <Underline size={15} color="#0f172a" />
                </button>
                <button onClick={() => execCmd('strikeThrough')} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Strikethrough">
                  <Strikethrough size={15} color="#0f172a" />
                </button>

                <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />

                {/* Colors */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '600' }}>Text Color:</label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={e => { setTextColor(e.target.value); execCmd('foreColor', e.target.value); }}
                    style={{ width: '28px', height: '28px', border: 'none', cursor: 'pointer', background: 'transparent' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '600' }}>Highlight:</label>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={e => { setBgColor(e.target.value); execCmd('hiliteColor', e.target.value); }}
                    style={{ width: '28px', height: '28px', border: 'none', cursor: 'pointer', background: 'transparent' }}
                  />
                </div>

                <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />

                {/* Alignments */}
                <button onClick={() => execCmd('justifyLeft')} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Align Left">
                  <AlignLeft size={15} color="#0f172a" />
                </button>
                <button onClick={() => execCmd('justifyCenter')} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Align Center">
                  <AlignCenter size={15} color="#0f172a" />
                </button>
                <button onClick={() => execCmd('justifyRight')} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Align Right">
                  <AlignRight size={15} color="#0f172a" />
                </button>
                <button onClick={() => execCmd('justifyFull')} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Justify">
                  <AlignJustify size={15} color="#0f172a" />
                </button>

                <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />

                {/* Lists */}
                <button onClick={() => execCmd('insertUnorderedList')} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Bullet List">
                  <List size={15} color="#0f172a" />
                </button>
                <button onClick={() => execCmd('insertOrderedList')} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Numbered List">
                  <ListOrdered size={15} color="#0f172a" />
                </button>
              </>
            )}

            {activeRibbon === 'insert' && (
              <>
                <button onClick={insertTable} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: '600', color: '#0f172a' }}>
                  <Table size={15} color="#2563eb" /> Insert Table
                </button>
                <button onClick={() => execCmd('insertHorizontalRule')} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: '600', color: '#0f172a' }}>
                  <Minus size={15} color="#2563eb" /> Horizontal Divider
                </button>
              </>
            )}

            {activeRibbon === 'layout' && (
              <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', gap: '16px' }}>
                <span>Page Size: <strong>A4 Standard (8.27 x 11.69 in)</strong></span>
                <span>Margins: <strong>Normal (1 inch)</strong></span>
                <span>Orientation: <strong>Portrait</strong></span>
              </div>
            )}

            {activeRibbon === 'view' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setZoomLevel(z => Math.max(50, z - 10))} style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
                  <ZoomOut size={14} /> Zoom Out
                </button>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{zoomLevel}%</span>
                <button onClick={() => setZoomLevel(z => Math.min(200, z + 10))} style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
                  <ZoomIn size={14} /> Zoom In
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MS Word Workstation Workspace Container */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            background: '#e2e8f0',
            padding: '36px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start'
          }}
        >
          {/* Real A4 Paper Document Sheet */}
          <div
            style={{
              width: `${(794 * zoomLevel) / 100}px`,
              minHeight: `${(1123 * zoomLevel) / 100}px`,
              background: '#ffffff',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              borderRadius: '2px',
              padding: '60px 80px',
              color: '#0f172a',
              boxSizing: 'border-box'
            }}
          >
            <div
              ref={documentPaperRef}
              contentEditable
              onInput={updateStats}
              onKeyUp={updateStats}
              style={{
                outline: 'none',
                minHeight: '800px',
                fontSize: fontSize,
                fontFamily: fontFamily,
                lineHeight: '1.6',
                color: textColor
              }}
            />
          </div>
        </div>

        {/* MS Word Blue Bottom Status Bar & Save Toggle */}
        <div
          style={{
            background: '#ffffff',
            borderTop: '1px solid #cbd5e1',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Word Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem', color: '#475569', fontWeight: '600' }}>
            <span>Page 1 of 1</span>
            <span>Words: <strong style={{ color: '#1b365d' }}>{wordCount}</strong></span>
            <span>Characters: <strong style={{ color: '#1b365d' }}>{charCount}</strong></span>
          </div>

          {/* Save Mode Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '2px' }}>
              <button
                onClick={() => setSaveMode('new')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: saveMode === 'new' ? '#1b365d' : 'transparent',
                  color: saveMode === 'new' ? '#fff' : '#64748b'
                }}
              >
                <Copy size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} /> Save as New
              </button>
              <button
                onClick={() => setSaveMode('replace')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: saveMode === 'replace' ? '#ef4444' : 'transparent',
                  color: saveMode === 'replace' ? '#fff' : '#64748b'
                }}
              >
                <Replace size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} /> Replace Original
              </button>
            </div>

            <button className="btn btn-ghost" onClick={onClose} style={{ color: '#475569' }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ minWidth: '160px', background: '#1b365d', borderColor: '#1b365d' }}
            >
              <Save size={15} />
              {saving ? 'Saving...' : saveMode === 'replace' ? 'Replace Original' : 'Save as New .docx'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
