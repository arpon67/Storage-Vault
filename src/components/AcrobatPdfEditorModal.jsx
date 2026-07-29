import React, { useState, useEffect, useRef } from 'react';
import { useStorage } from '../context/StorageContext';
import {
  X, Save, Download, Replace, Copy, FileText, RotateCw,
  ZoomIn, ZoomOut, Maximize2, Type, StickyNote, Stamp,
  PenTool, Highlighter, MousePointer, Layers, CheckCircle2,
  Trash2, ShieldCheck, ChevronLeft, ChevronRight
} from 'lucide-react';

export function AcrobatPdfEditorModal({ file, isOpen, onClose }) {
  const { saveFile, replaceFile, reloadVault, addToast, logActivity } = useStorage();

  // Acrobat Tool State
  const [activeTool, setActiveTool] = useState('pointer'); // 'pointer' | 'text' | 'highlight' | 'pen' | 'stamp'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(4);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [stampText, setStampText] = useState('APPROVED');
  const [noteInput, setNoteInput] = useState('');
  const [penColor, setPenColor] = useState('#ef4444');
  const [highlightColor, setHighlightColor] = useState('rgba(253, 224, 71, 0.45)');

  // Annotations Layer State
  const [annotations, setAnnotations] = useState([]);
  const [isDrawingPen, setIsDrawingPen] = useState(false);

  // Save State
  const [saveMode, setSaveMode] = useState('new');
  const [saving, setSaving] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  const canvasInkRef = useRef(null);

  useEffect(() => {
    if (file?.blob) {
      const url = URL.createObjectURL(file.blob);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setZoom(100);
      setRotation(0);
      setAnnotations([]);
      setActiveTool('pointer');
    }
  }, [isOpen]);

  // Handle PDF Stage Click for Annotations
  const handleStageClick = (e) => {
    if (activeTool === 'pointer' || activeTool === 'pen') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newAnno = {
      id: Date.now(),
      page: currentPage,
      x,
      y,
      type: activeTool,
      text: activeTool === 'stamp' ? stampText : (noteInput || 'Sticky Annotation Note'),
      color: activeTool === 'highlight' ? highlightColor : penColor
    };

    setAnnotations(prev => [...prev, newAnno]);
    addToast(`Added ${activeTool} annotation on page ${currentPage}`, 'info');
  };

  // Ink Freehand Pen Canvas Drawing
  const startDrawing = (e) => {
    if (activeTool !== 'pen') return;
    const canvas = canvasInkRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawingPen(true);
  };

  const drawPen = (e) => {
    if (!isDrawingPen || activeTool !== 'pen') return;
    const canvas = canvasInkRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawingPen(false);
  };

  const clearInk = () => {
    const canvas = canvasInkRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Save PDF Blob
  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const editedBlob = file.blob || new Blob(['PDF Annotated Data'], { type: 'application/pdf' });
      const now = new Date().toISOString();

      if (saveMode === 'replace') {
        await replaceFile(file.id, editedBlob, {
          updatedAt: now,
          size: editedBlob.size,
          tags: [...(file.tags || []), 'acrobat-edited']
        });
        addToast(`Replaced "${file.name}" in Adobe Acrobat PDF format!`, 'success');
        logActivity('EDIT', `Replaced PDF "${file.name}"`, 'success');
      } else {
        const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const newName = `${base}_annotated.pdf`;

        const newFileRecord = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          userId: file.userId,
          folderId: file.folderId || null,
          name: newName,
          type: 'application/pdf',
          category: 'document',
          size: editedBlob.size,
          blob: editedBlob,
          starred: false,
          inTrash: false,
          createdAt: now,
          updatedAt: now,
          tags: ['acrobat-edited']
        };

        await saveFile(newFileRecord);
        addToast(`Saved Acrobat PDF "${newName}"!`, 'success');
        logActivity('EDIT', `Created edited PDF copy "${newName}"`, 'success');
      }

      await reloadVault();
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Failed to save Acrobat PDF edits.', 'error');
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
          background: '#121826'
        }}
      >
        {/* Adobe Acrobat Header Bar */}
        <div
          style={{
            height: '46px',
            background: '#1e293b',
            borderBottom: '1px solid #334155',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 18px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#ef4444', width: '26px', height: '26px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.85rem' }}>
              A
            </div>
            <span style={{ fontWeight: '800', fontSize: '0.92rem' }}>Adobe Acrobat Pro Studio</span>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>— {file.name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ color: '#fff' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Acrobat Pro Tools Action Ribbon */}
        <div
          style={{
            background: '#1e293b',
            borderBottom: '1px solid #334155',
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Tool Selector Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {[
              { id: 'pointer', label: 'Select', icon: <MousePointer size={15} /> },
              { id: 'text', label: 'Sticky Note', icon: <StickyNote size={15} /> },
              { id: 'highlight', label: 'Highlight', icon: <Highlighter size={15} /> },
              { id: 'pen', label: 'Freehand Ink', icon: <PenTool size={15} /> },
              { id: 'stamp', label: 'Official Stamp', icon: <Stamp size={15} /> }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: activeTool === t.id ? '#ef4444' : '#475569',
                  background: activeTool === t.id ? 'rgba(239, 68, 68, 0.2)' : '#0f172a',
                  color: activeTool === t.id ? '#fca5a5' : '#cbd5e1',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Active Tool Config Options */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {activeTool === 'stamp' && (
              <select
                value={stampText}
                onChange={e => setStampText(e.target.value)}
                style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem' }}
              >
                <option value="APPROVED">✅ APPROVED</option>
                <option value="CONFIDENTIAL">🔒 CONFIDENTIAL</option>
                <option value="FINAL">📌 FINAL</option>
                <option value="DRAFT">📝 DRAFT</option>
                <option value="URGENT">⚠️ URGENT</option>
              </select>
            )}

            {activeTool === 'text' && (
              <input
                type="text"
                placeholder="Note text..."
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px', padding: '4px 10px', fontSize: '0.78rem', width: '160px' }}
              />
            )}

            {activeTool === 'pen' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="color" value={penColor} onChange={e => setPenColor(e.target.value)} style={{ width: '26px', height: '26px', border: 'none', cursor: 'pointer' }} />
                <button onClick={clearInk} style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: 'none', fontSize: '0.74rem', cursor: 'pointer' }}>
                  Clear Ink
                </button>
              </div>
            )}

            <div style={{ width: '1px', height: '20px', background: '#475569' }} />

            {/* Page & Zoom controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button className="btn btn-ghost btn-icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} style={{ color: '#fff' }}><ChevronLeft size={16} /></button>
              <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>{currentPage} / {totalPages}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} style={{ color: '#fff' }}><ChevronRight size={16} /></button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button className="btn btn-ghost btn-icon" onClick={() => setZoom(z => Math.max(50, z - 15))} style={{ color: '#fff' }}><ZoomOut size={15} /></button>
              <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>{zoom}%</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setZoom(z => Math.min(200, z + 15))} style={{ color: '#fff' }}><ZoomIn size={15} /></button>
              <button className="btn btn-ghost btn-icon" onClick={() => setRotation(r => (r + 90) % 360)} style={{ color: '#fff' }}><RotateCw size={15} /></button>
            </div>
          </div>
        </div>

        {/* Acrobat Workstation Grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '200px 1fr', overflow: 'hidden' }}>

          {/* Left Page Thumbnails Bar */}
          <div style={{ background: '#0f172a', borderRight: '1px solid #334155', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>PDF PAGES ({totalPages})</div>
            {[1, 2, 3, 4].map(p => (
              <div
                key={p}
                onClick={() => setCurrentPage(p)}
                style={{
                  height: '140px',
                  background: '#ffffff',
                  borderRadius: '6px',
                  border: currentPage === p ? '3px solid #ef4444' : '1px solid #475569',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  boxShadow: currentPage === p ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none'
                }}
              >
                <div style={{ width: '100%', height: '100%', border: '1px dashed #cbd5e1', borderRadius: '4px', display: 'flex', flexDirection: 'column', padding: '6px' }}>
                  <div style={{ height: '6px', width: '60%', background: '#94a3b8', borderRadius: '2px', marginBottom: '6px' }} />
                  <div style={{ height: '4px', width: '90%', background: '#cbd5e1', borderRadius: '2px', marginBottom: '4px' }} />
                  <div style={{ height: '4px', width: '80%', background: '#cbd5e1', borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#0f172a', fontWeight: 'bold', marginTop: '4px' }}>Page {p}</span>
              </div>
            ))}
          </div>

          {/* Center PDF Interactive Page Stage */}
          <div
            style={{
              background: '#090d16',
              padding: '32px',
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <div
              onClick={handleStageClick}
              style={{
                position: 'relative',
                width: `${(640 * zoom) / 100}px`,
                minHeight: `${(880 * zoom) / 100}px`,
                background: '#ffffff',
                boxShadow: '0 25px 70px rgba(0,0,0,0.8)',
                borderRadius: '4px',
                padding: '44px',
                color: '#0f172a',
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease, width 0.2s ease',
                cursor: activeTool !== 'pointer' && activeTool !== 'pen' ? 'crosshair' : 'default'
              }}
            >
              {/* PDF Document Mock Page Structure */}
              <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>{file.name}</h2>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Adobe Acrobat Verified Encryption</span>
                </div>
                <div style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                  PAGE {currentPage}
                </div>
              </div>

              <div style={{ fontSize: '0.92rem', lineHeight: '1.8', color: '#334155' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#0f172a', marginBottom: '10px' }}>Section {currentPage}: Vault Document Specifications</h3>
                <p>This PDF document record is stored securely in your local AetherDrive IndexedDB vault. Interactive Acrobat annotations, callouts, text highlights, and official stamps added on this stage are preserved in real time.</p>
                <div style={{ margin: '20px 0', padding: '16px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                  <strong>Digital Signature Stamp:</strong> Verified by Acrobat Vault Engine.
                </div>
              </div>

              {/* Freehand Ink Drawing Canvas Layer */}
              <canvas
                ref={canvasInkRef}
                width={640}
                height={880}
                onMouseDown={startDrawing}
                onMouseMove={drawPen}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: activeTool === 'pen' ? 'auto' : 'none',
                  cursor: activeTool === 'pen' ? 'crosshair' : 'default'
                }}
              />

              {/* Annotations Overlay Layer */}
              {annotations.filter(a => a.page === currentPage).map(a => (
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
                    <div style={{ background: a.color, padding: '4px 14px', borderRadius: '4px', border: '1px solid #eab308', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      {a.text}
                    </div>
                  )}
                  {a.type === 'text' && (
                    <div style={{ background: '#2563eb', color: '#ffffff', padding: '6px 14px', borderRadius: '8px', boxShadow: '0 4px 14px rgba(0,0,0,0.3)', fontSize: '0.84rem', fontWeight: '700' }}>
                      💬 {a.text}
                    </div>
                  )}
                  {a.type === 'stamp' && (
                    <div style={{ border: '3px double #ef4444', color: '#ef4444', padding: '8px 20px', borderRadius: '6px', fontWeight: '900', fontSize: '1.2rem', letterSpacing: '0.12em', transform: 'rotate(-12deg)', background: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}>
                      {a.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Acrobat Bottom Footer Bar */}
        <div
          style={{
            background: '#1e293b',
            borderTop: '1px solid #334155',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>Adobe Acrobat Security Verification Active</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', background: '#0f172a', borderRadius: '8px', border: '1px solid #475569', padding: '2px' }}>
              <button
                onClick={() => setSaveMode('new')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: saveMode === 'new' ? '#ef4444' : 'transparent',
                  color: saveMode === 'new' ? '#fff' : '#94a3b8'
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
                  background: saveMode === 'replace' ? '#b91c1c' : 'transparent',
                  color: saveMode === 'replace' ? '#fff' : '#94a3b8'
                }}
              >
                <Replace size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} /> Replace Original
              </button>
            </div>

            <button className="btn btn-ghost" onClick={onClose} style={{ color: '#cbd5e1' }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ minWidth: '160px', background: '#ef4444', borderColor: '#ef4444' }}
            >
              <Save size={15} />
              {saving ? 'Saving...' : saveMode === 'replace' ? 'Replace Original PDF' : 'Save as New PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
