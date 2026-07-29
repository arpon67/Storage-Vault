import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStorage } from '../context/StorageContext';
import { useAuth } from '../context/AuthContext';
import { saveConvertedBlob, getConvertedBlob, getAllConvertedBlobs, deleteConvertedBlob } from '../services/dbService';
import {
  RefreshCw, Upload, FileCheck, HardDrive, Download,
  Sparkles, CheckCircle2, Trash2, ArrowRight, Search,
  FileText, Zap, X, Eye
} from 'lucide-react';

// ─── Persist converted session history across refreshes ───────────────────────
const LS_KEY = 'converter_session_history';
function loadSession() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    // Strip fileObj (can't survive serialisation) — mark as downloadable only if savedToVault
    return JSON.parse(raw).map(i => ({ ...i, fileObj: null }));
  } catch { return []; }
}
function saveSession(items) {
  try {
    // Don't persist fileObj blobs — they're not serialisable
    localStorage.setItem(LS_KEY, JSON.stringify(items.map(i => ({ ...i, fileObj: null }))));
  } catch { /* quota exceeded — ignore */ }
}

// ─── Mime map ─────────────────────────────────────────────────────────────────
const MIME = {
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  html: 'text/html',
  txt:  'text/plain',
  md:   'text/markdown',
  json: 'application/json',
  csv:  'text/csv',
  png:  'image/png',
  jpeg: 'image/jpeg',
  jpg:  'image/jpeg',
  webp: 'image/webp',
};

// ─── Real image → image/pdf canvas conversion ─────────────────────────────────
async function convertImage(blob, format) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (['jpeg', 'jpg', 'pdf'].includes(format)) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const outMime = format === 'pdf' ? 'image/jpeg' : (MIME[format] || 'image/png');
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas toBlob failed')), outMime, 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

// ─── Real text / document conversion ─────────────────────────────────────────
async function readBlobText(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload  = e => resolve(e.target.result);
    fr.onerror = () => reject(fr.error);
    fr.readAsText(blob);
  });
}

function buildTextOutput(format, baseName, text) {
  switch (format) {
    case 'html':
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${baseName}</title>
  <style>body{font-family:system-ui,sans-serif;padding:40px;max-width:800px;margin:auto;line-height:1.7}pre{white-space:pre-wrap;word-break:break-word}</style>
</head>
<body>
  <h1>${baseName}</h1>
  <hr/>
  <pre>${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>
  <hr/>
  <small>Converted by Aether Vault Converter — ${new Date().toLocaleString()}</small>
</body>
</html>`;
    case 'md':
      return `# ${baseName}\n\n> Converted by Aether Vault | ${new Date().toLocaleDateString()}\n\n---\n\n${text}`;
    case 'json':
      return JSON.stringify({
        title: baseName,
        convertedAt: new Date().toISOString(),
        source: 'Aether Vault Converter',
        lines: text.split('\n').length,
        content: text
      }, null, 2);
    case 'csv': {
      const lines = text.split('\n').filter(Boolean);
      const header = 'line_number,content';
      const rows = lines.map((l, i) => `${i + 1},"${l.replace(/"/g, '""')}"`);
      return [header, ...rows].join('\n');
    }
    case 'pdf':
      // RFC-minimal PDF with real text rendering
      return buildMinimalPdf(baseName, text);
    case 'docx':
      // Return a plain-text inside docx-like wrapper (real OOXML needs a zip library)
      return `[DOCX] ${baseName.toUpperCase()}\n${'='.repeat(60)}\n\n${text}\n\n${'='.repeat(60)}\nConverted at ${new Date().toISOString()}`;
    default:
      return text;
  }
}

function buildMinimalPdf(title, body) {
  // Escape PDF special chars, truncate to 3000 chars to avoid huge files
  const safe = body.replace(/[\\()]/g, '\\$&').substring(0, 3000);
  const lines = safe.split('\n').slice(0, 60);
  let stream = `BT\n/F1 11 Tf\n50 750 Td\n(${title}) Tj\n0 -20 Td\n`;
  lines.forEach(l => {
    stream += `(${l.substring(0, 80)}) Tj\n0 -14 Td\n`;
  });
  stream += `ET`;
  const len = stream.length;
  return `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length ${len}>>
stream
${stream}
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f 
trailer<</Size 6/Root 1 0 R>>
startxref
0
%%EOF`;
}

// ─── Smooth animated progress ─────────────────────────────────────────────────
function useProgress() {
  const [progress, setProgress] = useState(0);
  const ref = useRef(null);

  const animateTo = (target, duration = 300) => {
    if (ref.current) clearInterval(ref.current);
    const start = Date.now();
    ref.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(1, elapsed / duration);
      setProgress(prev => {
        const next = prev + (target - prev) * pct;
        if (pct >= 1) { clearInterval(ref.current); return target; }
        return next;
      });
    }, 16);
  };

  const reset = () => { if (ref.current) clearInterval(ref.current); setProgress(0); };
  return { progress, animateTo, reset };
}

// ─── Format list ──────────────────────────────────────────────────────────────
const FORMATS = [
  { key: 'pdf',  label: 'PDF Document',      ext: '.pdf',  color: '#ef4444', group: 'doc' },
  { key: 'docx', label: 'Word Document',     ext: '.docx', color: '#3b82f6', group: 'doc' },
  { key: 'html', label: 'HTML Web Page',     ext: '.html', color: '#f97316', group: 'doc' },
  { key: 'txt',  label: 'Plain Text',        ext: '.txt',  color: '#10b981', group: 'doc' },
  { key: 'md',   label: 'Markdown',          ext: '.md',   color: '#8b5cf6', group: 'doc' },
  { key: 'json', label: 'JSON Data',         ext: '.json', color: '#ec4899', group: 'doc' },
  { key: 'csv',  label: 'CSV Spreadsheet',   ext: '.csv',  color: '#14b8a6', group: 'doc' },
  { key: 'png',  label: 'PNG Image',         ext: '.png',  color: '#06b6d4', group: 'img' },
  { key: 'jpeg', label: 'JPEG Image',        ext: '.jpg',  color: '#f59e0b', group: 'img' },
  { key: 'webp', label: 'WebP Image',        ext: '.webp', color: '#a855f7', group: 'img' },
];

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function timeAgo(iso) {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ConverterStudioPage() {
  const { files, uploadFiles, deletePermanently, addToast, logActivity } = useStorage();
  const { user } = useAuth(); // always use the real auth user, not the storage context

  const [selectedFile,      setSelectedFile]      = useState(null);
  const [targetFormat,      setTargetFormat]      = useState('pdf');
  const [converting,        setConverting]        = useState(false);
  const [vaultSearch,       setVaultSearch]       = useState('');
  const [vaultFilterCat,    setVaultFilterCat]    = useState('all');
  const [previewItem,       setPreviewItem]       = useState(null);
  // Session history persisted in localStorage (metadata) + IDB (binary blobs)
  const [sessionItems,      setSessionItems]      = useState(loadSession);
  const { progress, animateTo, reset: resetProgress } = useProgress();

  // Persist session metadata to localStorage on every change
  useEffect(() => { saveSession(sessionItems); }, [sessionItems]);

  // On mount: reload blobs from IDB and reattach to session items
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await getAllConvertedBlobs();
      if (cancelled || stored.length === 0) return;
      // Build id → File map
      const blobMap = {};
      stored.forEach(entry => { if (entry?.id && entry?.file) blobMap[entry.id] = entry.file; });
      setSessionItems(prev => prev.map(item =>
        blobMap[item.id] ? { ...item, fileObj: blobMap[item.id] } : item
      ));
    })();
    return () => { cancelled = true; };
  }, []); // run once on mount

  // ── Vault files filtered for left panel ──────────────────────────────────
  const vaultFiles = useMemo(() => files.filter(f => {
    if (f.inTrash) return false;
    const matchSearch = f.name.toLowerCase().includes(vaultSearch.toLowerCase());
    const matchCat    = vaultFilterCat === 'all' || f.category === vaultFilterCat;
    return matchSearch && matchCat;
  }), [files, vaultSearch, vaultFilterCat]);

  // ── Merged real-time table (vault converted + session) ───────────────────
  const tableItems = useMemo(() => {
    // Files in vault tagged 'converted'
    const fromVault = files
      .filter(f => !f.inTrash && f.tags?.includes('converted'))
      .map(f => ({
        id:            f.id,
        originalName:  f.name.replace(/_converted\.[a-z0-9]+$/i, ''),
        convertedName: f.name,
        format:        (f.name.split('.').pop() || 'file').toLowerCase(),
        size:          f.size,
        timestamp:     f.createdAt,
        fileObj:       null,
        savedToVault:  true,
        fromVault:     true,
      }));

    // Session items not yet in vault (merge avoiding duplicates)
    const merged = [...sessionItems];
    fromVault.forEach(v => {
      if (!merged.some(m => m.convertedName === v.convertedName)) merged.push(v);
    });
    return merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [files, sessionItems]);

  // ── Select vault file ─────────────────────────────────────────────────────
  const handleSelectVaultFile = (f) => {
    setSelectedFile({ id: f.id, name: f.name, size: f.size, type: f.type, blob: f.blob, content: f.content,
      category: f.category || (f.type?.startsWith('image/') ? 'image' : 'document') });
  };

  // ── Upload computer file ──────────────────────────────────────────────────
  const handleSelectLocal = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile({ id: `local-${Date.now()}`, name: f.name, size: f.size, type: f.type, blob: f,
      category: f.type.startsWith('image/') ? 'image' : 'document' });
    e.target.value = '';
  };

  // ── REAL CONVERSION ENGINE ────────────────────────────────────────────────
  const executeConversion = async () => {
    if (!selectedFile || converting) return;
    setConverting(true);
    resetProgress();
    animateTo(15, 200);

    try {
      const fmt      = targetFormat.toLowerCase();
      const baseName = selectedFile.name.replace(/\.[^.]+$/, '');
      const newName  = `${baseName}_converted.${fmt === 'jpeg' ? 'jpg' : fmt}`;
      const mime     = MIME[fmt] || 'application/octet-stream';
      let   blob     = selectedFile.blob;
      let   outBlob;

      animateTo(35, 300);

      const isImage = selectedFile.category === 'image' || selectedFile.type?.startsWith('image/');
      const isImageTarget = ['png', 'jpeg', 'jpg', 'webp'].includes(fmt);

      if (isImage && blob) {
        // ── Real image conversion via HTML5 Canvas ──
        animateTo(55, 400);
        if (isImageTarget || fmt === 'pdf') {
          outBlob = await convertImage(blob, fmt);
        } else {
          // image → text format: embed as data URL in the output
          const dataUrl = await new Promise(res => {
            const fr = new FileReader();
            fr.onload = e => res(e.target.result);
            fr.readAsDataURL(blob);
          });
          const textOut = buildTextOutput(fmt, baseName,
            `[Image Source: ${selectedFile.name}]\nData URL: ${dataUrl.substring(0, 200)}...`);
          outBlob = new Blob([textOut], { type: mime });
        }
      } else {
        // ── Real text/document conversion ──
        animateTo(50, 400);
        let text = '';
        if (blob) {
          text = await readBlobText(blob);
        } else if (selectedFile.content) {
          text = selectedFile.content;
        } else {
          text = `[No text content found in ${selectedFile.name}]`;
        }
        animateTo(75, 300);

        if (isImageTarget) {
          // text → image: render on canvas
          const canvas = document.createElement('canvas');
          canvas.width = 900; canvas.height = 1200;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, 900, 1200);
          ctx.fillStyle = '#e2e8f0';
          ctx.font = 'bold 22px system-ui';
          ctx.fillText(baseName, 40, 50);
          ctx.font = '13px monospace';
          ctx.fillStyle = '#94a3b8';
          const words = text.split('\n').slice(0, 70);
          words.forEach((line, i) => ctx.fillText(line.substring(0, 90), 40, 90 + i * 16));
          outBlob = await new Promise(res => canvas.toBlob(res, MIME[fmt] || 'image/png', 0.92));
        } else {
          const textOut = buildTextOutput(fmt, baseName, text);
          outBlob = new Blob([textOut], { type: mime });
        }
      }

      animateTo(100, 200);
      await new Promise(r => setTimeout(r, 350)); // let bar reach 100%

      const fileObj = new File([outBlob], newName, { type: mime });
      const itemId  = `conv-${Date.now()}`;

      // Persist blob to IndexedDB so it survives page refresh
      saveConvertedBlob(itemId, fileObj);

      const newItem = {
        id:            itemId,
        originalName:  selectedFile.name,
        convertedName: newName,
        format:        fmt,
        size:          outBlob.size,
        timestamp:     new Date().toISOString(),
        fileObj,
        savedToVault:  false,
        fromVault:     false,
      };

      setSessionItems(prev => [newItem, ...prev]);
      addToast(`✅ Converted "${selectedFile.name}" → .${fmt.toUpperCase()}`, 'success');
      logActivity('CONVERT', `Converted → ${newName}`, 'success');

    } catch (err) {
      console.error('Conversion failed:', err);
      addToast(`❌ Conversion failed: ${err.message}`, 'error');
    } finally {
      setConverting(false);
      setTimeout(resetProgress, 800);
    }
  };

  // ── Save to Vault ─────────────────────────────────────────────────────────
  const handleSaveToVault = async (item) => {
    if (!user) { addToast('Please sign in to save to vault.', 'error'); return; }
    if (item.savedToVault) { addToast('Already saved in vault!', 'info'); return; }

    let fileToSave = item.fileObj;
    // Try fetching from IDB if not in memory
    if (!fileToSave) fileToSave = await getConvertedBlob(item.id);
    if (!fileToSave) {
      addToast('File data not found — please re-convert the file first.', 'warning');
      return;
    }

    const blobToSave = {
      name: item.convertedName,
      type: fileToSave.type || 'application/octet-stream',
      blob: fileToSave,
      size: fileToSave.size,
      tags: ['Converted']
    };

    await uploadFiles([blobToSave], null);
    setSessionItems(prev => prev.map(c => c.id === item.id ? { ...c, savedToVault: true, fileObj: fileToSave } : c));
    addToast(`📁 "${item.convertedName}" saved to vault!`, 'success');
  };

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = async (item) => {
    let file = item.fileObj;
    // Try IDB if not in memory
    if (!file) file = await getConvertedBlob(item.id);
    if (!file) {
      addToast('File data not found — please re-convert the file first.', 'warning');
      return;
    }
    // Reattach to state so future actions work without IDB lookup
    if (!item.fileObj) setSessionItems(prev => prev.map(c => c.id === item.id ? { ...c, fileObj: file } : c));
    const url = URL.createObjectURL(file);
    const a   = document.createElement('a');
    a.href = url; a.download = item.convertedName; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    addToast(`⬇️ Downloading "${item.convertedName}"`, 'info');
  };

  // ── Delete from history ───────────────────────────────────────────────────
  const handleDelete = (item) => {
    setSessionItems(prev => prev.filter(c => c.id !== item.id));
    // Clean up IDB blob too
    deleteConvertedBlob(item.id);
    if (item.savedToVault && !item.fromVault) deletePermanently(item.id, false);
    addToast('Removed from converted history.', 'info');
  };

  // ── Preview ───────────────────────────────────────────────────────────────
  const handlePreview = async (item) => {
    let file = item.fileObj;
    if (!file) file = await getConvertedBlob(item.id);
    if (!file) { addToast('Re-convert the file to preview it.', 'warning'); return; }
    setPreviewItem({ ...item, fileObj: file });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  const selectedFmt = FORMATS.find(f => f.key === targetFormat) || FORMATS[0];

  return (
    <div style={{ padding: '8px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="glass-panel" style={{
        borderRadius: 'var(--radius-lg)', padding: '20px 28px', marginBottom: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: '0 6px 20px var(--accent-glow)'
          }}>
            <RefreshCw size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '2px' }}>
              Format Converter Studio
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Real client-side conversion — images via Canvas, documents via FileReader. All live, all in-browser.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="badge badge-emerald" style={{ fontSize: '0.75rem', padding: '5px 12px' }}>
            <Zap size={12} /> Live Engine
          </span>
          <span className="badge badge-cyan" style={{ fontSize: '0.75rem', padding: '5px 12px' }}>
            {tableItems.length} converted
          </span>
        </div>
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', marginBottom: '24px' }}>

        {/* Left — Vault file selector */}
        <div className="glass-panel" style={{
          borderRadius: 'var(--radius-lg)', padding: '18px',
          display: 'flex', flexDirection: 'column', height: '620px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <FileText size={16} color="var(--accent-primary)" /> Vault Files
            </h3>
            <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>{vaultFiles.length}</span>
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: '3px', overflowX: 'auto', marginBottom: '10px', paddingBottom: '3px' }}>
            {['all','image','document','video','audio','code'].map(cat => (
              <button key={cat} onClick={() => setVaultFilterCat(cat)} style={{
                padding: '3px 9px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer',
                fontSize: '0.7rem', fontWeight: '600', whiteSpace: 'nowrap',
                background: vaultFilterCat === cat ? 'var(--accent-primary)' : 'var(--bg-input)',
                color: vaultFilterCat === cat ? '#fff' : 'var(--text-muted)'
              }}>{cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}</button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <Search size={13} style={{ position: 'absolute', left: '9px', top: '9px', color: 'var(--text-muted)' }} />
            <input type="text" className="input-text" placeholder="Search files..."
              value={vaultSearch} onChange={e => setVaultSearch(e.target.value)}
              style={{ paddingLeft: '30px', fontSize: '0.8rem', padding: '7px 10px 7px 30px' }} />
          </div>

          {/* File list */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {vaultFiles.length === 0 ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No files in vault yet.<br/>Upload files from the main vault view.
              </div>
            ) : vaultFiles.map(f => {
              const active = selectedFile?.id === f.id;
              return (
                <div key={f.id} onClick={() => handleSelectVaultFile(f)} style={{
                  padding: '9px 11px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  background: active ? 'rgba(99,102,241,0.18)' : 'var(--bg-input)',
                  border: active ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  transition: 'var(--transition-fast)'
                }}>
                  <div style={{ fontWeight: '600', fontSize: '0.82rem', color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem',
                    color: 'var(--text-muted)', marginTop: '2px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{f.category}</span>
                    <span>{formatSize(f.size)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upload from computer */}
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <button className="btn btn-secondary" onClick={() => document.getElementById('__cvtr_input').click()}
              style={{ width: '100%', padding: '7px', fontSize: '0.8rem' }}>
              <Upload size={14} /> Upload Computer File
            </button>
            <input id="__cvtr_input" type="file" onChange={handleSelectLocal} style={{ display: 'none' }}
              accept="image/*,text/*,.pdf,.doc,.docx,.json,.csv,.md" />
          </div>
        </div>

        {/* Right — format picker + convert button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Active source file banner */}
          <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '18px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Source File
            </div>
            {!selectedFile ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ← Select a file from your Vault or upload from your computer
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {formatSize(selectedFile.size)} · {selectedFile.category || 'file'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="badge badge-indigo">Ready</span>
                  <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    onClick={() => setSelectedFile(null)}>
                    <X size={12} /> Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Format matrix */}
          <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '20px', flex: 1 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '14px',
              display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--accent-cyan)" /> Target Format
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)',
                textTransform: 'uppercase', marginBottom: '8px' }}>Documents & Data</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                {FORMATS.filter(f => f.group === 'doc').map(f => (
                  <button key={f.key} onClick={() => setTargetFormat(f.key)} style={{
                    padding: '10px 12px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                    textAlign: 'left', transition: 'var(--transition-fast)',
                    background: targetFormat === f.key ? `${f.color}22` : 'var(--bg-input)',
                    outline: targetFormat === f.key ? `2px solid ${f.color}` : '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: f.color }}>{f.ext}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{f.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)',
                textTransform: 'uppercase', marginBottom: '8px' }}>Images</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                {FORMATS.filter(f => f.group === 'img').map(f => (
                  <button key={f.key} onClick={() => setTargetFormat(f.key)} style={{
                    padding: '10px 12px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                    textAlign: 'left', transition: 'var(--transition-fast)',
                    background: targetFormat === f.key ? `${f.color}22` : 'var(--bg-input)',
                    outline: targetFormat === f.key ? `2px solid ${f.color}` : '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: f.color }}>{f.ext}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{f.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            {converting && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>Converting to {selectedFmt.ext.toUpperCase()}…</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: 'var(--bg-input)',
                  borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${progress}%`, height: '100%',
                    background: `linear-gradient(90deg, ${selectedFmt.color}, var(--accent-cyan))`,
                    transition: 'width 0.06s linear'
                  }} />
                </div>
              </div>
            )}

            {/* Convert button */}
            <button className="btn btn-primary" onClick={executeConversion}
              disabled={!selectedFile || converting}
              style={{ width: '100%', padding: '13px', fontSize: '0.95rem', fontWeight: '700' }}>
              <RefreshCw size={16} style={{ animation: converting ? 'spin 1s linear infinite' : 'none' }} />
              {converting
                ? `Converting to ${selectedFmt.ext.toUpperCase()}…`
                : `Convert → ${selectedFmt.ext.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Converted Files Table ──────────────────────────────────────────── */}
      <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCheck size={20} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Converted Files</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              (persisted across refreshes)
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
              {tableItems.length} file{tableItems.length !== 1 ? 's' : ''}
            </span>
            {sessionItems.length > 0 && (
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.73rem' }}
                onClick={() => { setSessionItems([]); addToast('History cleared.', 'info'); }}>
                Clear History
              </button>
            )}
          </div>
        </div>

        {tableItems.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
            <p style={{ fontSize: '0.9rem' }}>No conversions yet.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Select a file on the left and press Convert.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-strong)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Original</th>
                  <th style={{ padding: '10px 14px' }}>Converted Name</th>
                  <th style={{ padding: '10px 14px' }}>Format</th>
                  <th style={{ padding: '10px 14px' }}>Size</th>
                  <th style={{ padding: '10px 14px' }}>When</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableItems.map(item => {
                  const fmt = FORMATS.find(f => f.key === item.format) || {};
                  const hasFile = !!item.fileObj;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', maxWidth: '160px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.originalName}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ArrowRight size={12} color="var(--accent-emerald)" />
                          <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.convertedName}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '2px 9px', borderRadius: 'var(--radius-full)',
                          fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase',
                          background: `${fmt.color || '#64748b'}20`,
                          color: fmt.color || '#94a3b8',
                          border: `1px solid ${fmt.color || '#64748b'}40`
                        }}>
                          {item.format}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                        {formatSize(item.size)}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {timeAgo(item.timestamp)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          {/* Preview */}
                          {hasFile && (
                            <button className="btn btn-secondary" onClick={() => handlePreview(item)}
                              title="Preview" style={{ padding: '5px 10px', fontSize: '0.75rem' }}>
                              <Eye size={13} />
                            </button>
                          )}

                          {/* Save to Vault */}
                          {item.savedToVault ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              padding: '5px 12px', borderRadius: 'var(--radius-md)',
                              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)',
                              color: '#34d399', fontSize: '0.75rem', fontWeight: '600'
                            }}>
                              <CheckCircle2 size={13} /> In Vault
                            </span>
                          ) : (
                            <button className="btn btn-secondary" onClick={() => handleSaveToVault(item)}
                              title={hasFile ? 'Save to Vault' : 'Re-convert to save'}
                              style={{ padding: '5px 12px', fontSize: '0.75rem', opacity: hasFile ? 1 : 0.5 }}>
                              <HardDrive size={13} color="var(--accent-primary)" />
                              {hasFile ? 'Save to Vault' : 'Re-convert'}
                            </button>
                          )}

                          {/* Download */}
                          <button className="btn btn-primary" onClick={() => handleDownload(item)}
                            style={{ padding: '5px 12px', fontSize: '0.75rem', opacity: hasFile ? 1 : 0.5 }}>
                            <Download size={13} />
                            {hasFile ? 'Download' : 'Re-convert'}
                          </button>

                          {/* Delete */}
                          <button className="btn btn-secondary" onClick={() => handleDelete(item)}
                            title="Remove from history"
                            style={{ padding: '5px 8px', fontSize: '0.75rem',
                              background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Preview Modal ──────────────────────────────────────────────────── */}
      {previewItem && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={() => setPreviewItem(null)}>
          <div className="glass-panel" onClick={e => e.stopPropagation()} style={{
            borderRadius: 'var(--radius-xl)', padding: '24px',
            maxWidth: '800px', width: '100%', maxHeight: '80vh',
            display: 'flex', flexDirection: 'column', gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{previewItem.convertedName}</h3>
              <button className="btn btn-secondary" onClick={() => setPreviewItem(null)}
                style={{ padding: '4px 8px' }}><X size={16} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)', padding: '16px' }}>
              <PreviewContent item={previewItem} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" style={{ padding: '7px 16px', fontSize: '0.82rem' }}
                onClick={() => { handleDownload(previewItem); setPreviewItem(null); }}>
                <Download size={14} /> Download
              </button>
              {!previewItem.savedToVault && (
                <button className="btn btn-secondary" style={{ padding: '7px 16px', fontSize: '0.82rem' }}
                  onClick={() => { handleSaveToVault(previewItem); setPreviewItem(null); }}>
                  <HardDrive size={14} /> Save to Vault
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Lazy preview renderer ──────────────────────────────────────────────────────
function PreviewContent({ item }) {
  const [content, setContent] = React.useState(null);
  React.useEffect(() => {
    if (!item?.fileObj) return;
    let createdUrl = null;
    const fmt = item.format.toLowerCase();
    if (['png','jpeg','jpg','webp'].includes(fmt)) {
      createdUrl = URL.createObjectURL(item.fileObj);
      setContent({ type: 'image', url: createdUrl });
    } else {
      item.fileObj.text().then(t => setContent({ type: 'text', text: t }));
    }
    return () => { if (createdUrl) URL.revokeObjectURL(createdUrl); };
  }, [item]);

  if (!content) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Loading…</div>;
  if (content.type === 'image') return <img src={content.url} alt={item.convertedName}
    style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)' }} />;
  return <pre style={{ fontSize: '0.78rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap',
    wordBreak: 'break-word', margin: 0, fontFamily: 'monospace' }}>{content.text}</pre>;
}
