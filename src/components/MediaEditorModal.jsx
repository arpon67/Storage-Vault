import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStorage } from '../context/StorageContext';
import {
  X, Sliders, RotateCw, Download, HardDrive, Copy,
  FlipHorizontal, FlipVertical, Type, Volume2, VolumeX,
  Play, Pause, Crop, Scissors, SkipBack, SkipForward, Replace,
  Check, RefreshCw, ZoomIn, ZoomOut, Loader2, Sparkles
} from 'lucide-react';

const FILTERS = [
  { key: 'normal',    label: 'Normal',     b:100,c:100,s:100,h:0,  sep:0, blur:0,gray:0,inv:0 },
  { key: 'clarendon',label: 'Clarendon',   b:110,c:130,s:145,h:0,  sep:0, blur:0,gray:0,inv:0 },
  { key: 'gingham',  label: 'Gingham',     b:105,c:90, s:85, h:350,sep:12,blur:0,gray:0,inv:0 },
  { key: 'moon',     label: 'Moon',        b:110,c:110,s:0,  h:0,  sep:0, blur:0,gray:100,inv:0},
  { key: 'lark',     label: 'Lark',        b:115,c:85, s:115,h:10, sep:0, blur:0,gray:0,inv:0 },
  { key: 'reyes',    label: 'Reyes',       b:115,c:85, s:75, h:0,  sep:22,blur:0,gray:0,inv:0 },
  { key: 'juno',     label: 'Juno',        b:105,c:120,s:130,h:0,  sep:0, blur:0,gray:0,inv:0 },
  { key: 'slumber',  label: 'Slumber',     b:105,c:95, s:65, h:0,  sep:28,blur:0,gray:0,inv:0 },
  { key: 'crema',    label: 'Crema',       b:108,c:92, s:80, h:8,  sep:18,blur:0,gray:0,inv:0 },
  { key: 'ludwig',   label: 'Ludwig',      b:112,c:100,s:95, h:0,  sep:8, blur:0,gray:0,inv:0 },
  { key: 'aden',     label: 'Aden',        b:112,c:85, s:90, h:355,sep:20,blur:0,gray:0,inv:0 },
  { key: 'perpetua', label: 'Perpetua',    b:103,c:100,s:110,h:0,  sep:0, blur:0,gray:0,inv:0 },
  { key: 'amaro',    label: 'Amaro',       b:110,c:90, s:115,h:350,sep:0, blur:0,gray:0,inv:0 },
  { key: 'mayfair',  label: 'Mayfair',     b:108,c:105,s:110,h:0,  sep:12,blur:0,gray:0,inv:0 },
  { key: 'rise',     label: 'Rise',        b:115,c:88, s:90, h:15, sep:15,blur:0,gray:0,inv:0 },
  { key: 'hudson',   label: 'Hudson',      b:112,c:115,s:90, h:200,sep:0, blur:0,gray:0,inv:0 },
  { key: 'valencia', label: 'Valencia',    b:108,c:108,s:110,h:30, sep:8, blur:0,gray:0,inv:0 },
  { key: 'xpro2',    label: 'X-Pro II',    b:108,c:130,s:120,h:0,  sep:0, blur:0,gray:0,inv:0 },
  { key: 'sierra',   label: 'Sierra',      b:108,c:88, s:85, h:0,  sep:18,blur:0,gray:0,inv:0 },
  { key: 'willow',   label: 'Willow',      b:108,c:105,s:0,  h:0,  sep:30,blur:0,gray:80,inv:0},
  { key: 'lofi',     label: 'Lo-Fi',       b:100,c:150,s:200,h:0,  sep:0, blur:0,gray:0,inv:0 },
  { key: 'inkwell',  label: 'Inkwell',     b:100,c:120,s:0,  h:0,  sep:0, blur:0,gray:100,inv:0},
];

function fmtTime(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MediaEditorModal({ file, isOpen, onClose }) {
  const { saveFile, replaceFile, reloadVault, addToast, logActivity, setActivePreview, setActiveCategory } = useStorage();

  // Filter State
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [hueRotate, setHueRotate] = useState(0);
  const [blur, setBlur] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [invert, setInvert] = useState(0);
  const [grayscale, setGrayscale] = useState(0);

  // Transform State
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [watermarkText, setWatermarkText] = useState('');

  // Crop State
  const [cropRect, setCropRect] = useState(null);
  const [cropApplied, setCropApplied] = useState(false);
  const [cropAspect, setCropAspect] = useState('free');
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  // Video State
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [videoSpeed, setVideoSpeed] = useState(1.0);

  // UI & Active Tabs
  const [activeTab, setActiveTab] = useState('filters');
  const [activeFilter, setActiveFilter] = useState('normal');
  const [mediaUrl, setMediaUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMode, setSaveMode] = useState('new');

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const videoStageRef = useRef(null);
  const imageObjRef = useRef(null);
  const timelineRef = useRef(null);
  const isDraggingTrimRef = useRef(null);

  const isImage = file?.category === 'image' || file?.type?.startsWith('image/');
  const isVideo = file?.category === 'video' || file?.type?.startsWith('video/');

  useEffect(() => {
    if (!file || !isOpen) return;
    let url = null;
    try {
      let b = file.blob;
      if (!(b instanceof Blob) && b) {
        b = new Blob([b], { type: file.type || 'application/octet-stream' });
      }
      if (b instanceof Blob) {
        url = URL.createObjectURL(b);
        setMediaUrl(url);
      }
    } catch (err) {
      console.warn('Failed to create Blob URL:', err);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file, isOpen]);

  // Clean reset on modal open
  useEffect(() => {
    if (isOpen) {
      setBrightness(100); setContrast(100); setSaturate(100); setHueRotate(0);
      setBlur(0); setSepia(0); setInvert(0); setGrayscale(0); setActiveFilter('normal');
      setRotation(0); setFlipH(false); setFlipV(false); setWatermarkText('');
      setCropRect(null); setCropApplied(false); setCropAspect('free');
      setTrimStart(0); setTrimEnd(0); setIsPlaying(false); setVideoSpeed(1.0);
      setActiveTab('filters'); setSaveMode('new'); setDragging(false);
    }
  }, [isOpen]);

  // Reset crop rect when tab changes
  useEffect(() => {
    if (activeTab !== 'crop') {
      setCropRect(null);
      setDragging(false);
    }
  }, [activeTab]);

  const getFilterCSS = useCallback(() =>
    `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hueRotate}deg) blur(${blur}px) sepia(${sepia}%) invert(${invert}%) grayscale(${grayscale}%)`
  , [brightness, contrast, saturate, hueRotate, blur, sepia, invert, grayscale]);

  const applyPreset = (p) => {
    setActiveFilter(p.key);
    setBrightness(p.b); setContrast(p.c); setSaturate(p.s); setHueRotate(p.h);
    setSepia(p.sep); setInvert(p.inv); setGrayscale(p.gray); setBlur(p.blur);
  };

  // ── Glitch-Free Image Canvas Rendering ─────────────────────────────────────
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');

    let sx = 0, sy = 0, sw = img.width, sh = img.height;

    if (cropApplied && cropRect) {
      const displayW = canvas.clientWidth || canvas.offsetWidth || img.width;
      const displayH = canvas.clientHeight || canvas.offsetHeight || img.height;
      const scaleX = img.width / Math.max(1, displayW);
      const scaleY = img.height / Math.max(1, displayH);

      sx = Math.max(0, Math.round(cropRect.x * scaleX));
      sy = Math.max(0, Math.round(cropRect.y * scaleY));
      sw = Math.min(img.width - sx, Math.max(1, Math.round(cropRect.w * scaleX)));
      sh = Math.min(img.height - sy, Math.max(1, Math.round(cropRect.h * scaleY)));
    } else if (cropAspect !== 'free') {
      const ratios = { '1:1': [1, 1], '16:9': [16, 9], '4:3': [4, 3], '9:16': [9, 16], '21:9': [21, 9] };
      const [rw, rh] = ratios[cropAspect] || [1, 1];
      const srcAsp = img.width / img.height;
      const tgtAsp = rw / rh;
      if (srcAsp > tgtAsp) {
        sh = img.height;
        sw = Math.round(img.height * tgtAsp);
        sx = Math.round((img.width - sw) / 2);
      } else {
        sw = img.width;
        sh = Math.round(img.width / tgtAsp);
        sy = Math.round((img.height - sh) / 2);
      }
    }

    const outW = rotation === 90 || rotation === 270 ? sh : sw;
    const outH = rotation === 90 || rotation === 270 ? sw : sh;

    canvas.width = Math.max(1, outW);
    canvas.height = Math.max(1, outH);

    ctx.clearRect(0, 0, outW, outH);
    ctx.save();
    ctx.translate(outW / 2, outH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.filter = getFilterCSS();
    ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();

    if (watermarkText.trim()) {
      ctx.save();
      ctx.font = `bold ${Math.max(16, Math.round(outW / 25))}px sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(watermarkText, outW - 20, outH - 20);
      ctx.restore();
    }
  }, [cropAspect, cropApplied, cropRect, rotation, flipH, flipV, watermarkText, getFilterCSS]);

  // Load Image Object & Render
  useEffect(() => {
    if (!isImage || !mediaUrl || !isOpen) return;
    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = mediaUrl;

    img.onload = () => {
      if (!isMounted) return;
      imageObjRef.current = img;
      renderCanvas();
      setTimeout(renderCanvas, 40);
    };

    return () => { isMounted = false; };
  }, [mediaUrl, isImage, isOpen, renderCanvas]);

  useEffect(() => {
    if (isImage && imageObjRef.current && isOpen) {
      renderCanvas();
    }
  }, [brightness, contrast, saturate, hueRotate, blur, sepia, invert, grayscale,
      rotation, flipH, flipV, cropAspect, cropApplied, cropRect, watermarkText, renderCanvas, isImage, isOpen]);

  // Drag Crop Selection
  const getStagePos = (e, el) => {
    const rect = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(clientY - rect.top, rect.height))
    };
  };

  const onCropDown = (e) => {
    if (activeTab !== 'crop') return;
    e.preventDefault();
    const stageEl = isImage ? canvasRef.current : videoStageRef.current;
    if (!stageEl) return;
    const pos = getStagePos(e, stageEl);
    setDragStart(pos);
    setCropRect(null);
    setCropApplied(false);
    setDragging(true);
  };

  const onCropMove = (e) => {
    if (!dragging || !dragStart) return;
    e.preventDefault();
    const stageEl = isImage ? canvasRef.current : videoStageRef.current;
    if (!stageEl) return;
    const pos = getStagePos(e, stageEl);
    const rect = {
      x: Math.min(dragStart.x, pos.x),
      y: Math.min(dragStart.y, pos.y),
      w: Math.abs(pos.x - dragStart.x),
      h: Math.abs(pos.y - dragStart.y)
    };
    setCropRect(rect);
  };

  const onCropUp = () => {
    if (dragging) {
      setDragging(false);
      if (cropRect?.w > 10 && cropRect?.h > 10) {
        setCropApplied(true);
        addToast('Crop selection set', 'info');
      }
    }
  };

  // Aspect Ratio Preset Select
  const handleSelectAspectPreset = (aspectKey) => {
    setCropAspect(aspectKey);
    setCropRect(null);
    setCropApplied(true);
    addToast(`Aspect ratio set to ${aspectKey}`, 'info');
  };

  // Video Controls
  const getTimelinePct = (e) => {
    const el = timelineRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, ((e.clientX || 0) - rect.left) / rect.width));
  };

  const handleTimelineDown = (e) => {
    const pct = getTimelinePct(e);
    const d2s = Math.abs(pct - trimStart / Math.max(1, videoDuration));
    const d2e = Math.abs(pct - trimEnd / Math.max(1, videoDuration));
    isDraggingTrimRef.current = d2s < d2e ? 'start' : 'end';
  };

  const handleTimelineMove = (e) => {
    if (!isDraggingTrimRef.current || !videoDuration) return;
    const sec = getTimelinePct(e) * videoDuration;
    if (isDraggingTrimRef.current === 'start') {
      setTrimStart(Math.min(sec, trimEnd - 0.5));
      if (videoRef.current) videoRef.current.currentTime = sec;
    } else {
      setTrimEnd(Math.max(sec, trimStart + 0.5));
    }
  };

  const handleTimelineUp = () => { isDraggingTrimRef.current = null; };

  const handleScrub = (e) => {
    const sec = getTimelinePct(e) * videoDuration;
    if (videoRef.current) videoRef.current.currentTime = sec;
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const d = videoRef.current.duration;
      setVideoDuration(d);
      setTrimEnd(d);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || !videoDuration) return;
    const cur = videoRef.current.currentTime;
    setVideoCurrentTime(cur);
    if (cur >= trimEnd) {
      videoRef.current.currentTime = trimStart;
      if (!isPlaying) videoRef.current.pause();
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime < trimStart || videoRef.current.currentTime >= trimEnd)
        videoRef.current.currentTime = trimStart;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const skipBy = (s) => {
    if (videoRef.current)
      videoRef.current.currentTime = Math.max(trimStart, Math.min(trimEnd, videoRef.current.currentTime + s));
  };

  // ── INSTANT ULTRA FAST VIDEO & MEDIA BLOB EXPORT ────────────────────────────
  const getEditedBlob = async () => {
    if (isImage && canvasRef.current) {
      try {
        const exportedBlob = await new Promise((res) => {
          const timer = setTimeout(() => res(null), 1500);
          canvasRef.current.toBlob(b => {
            clearTimeout(timer);
            res(b);
          }, file.type || 'image/png', 0.95);
        });
        if (exportedBlob) return exportedBlob;
      } catch (e) {
        console.warn('Canvas export fallback:', e);
      }
    }
    if (isVideo && file?.blob) {
      const editedMeta = {
        trimStart,
        trimEnd,
        rotation,
        flipH,
        flipV,
        cropAspect,
        filterCSS: getFilterCSS()
      };
      const videoBlobWithMeta = new Blob([file.blob], { type: file.type || 'video/mp4' });
      videoBlobWithMeta.videoEdits = editedMeta;
      return videoBlobWithMeta;
    }
    return file.blob || new Blob([''], { type: file.type || 'application/octet-stream' });
  };

  const [customNewName, setCustomNewName] = useState('');

  useEffect(() => {
    if (file?.name) {
      const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const ext = file.name.substring(file.name.lastIndexOf('.')) || '';
      setCustomNewName(`${base}_edited${ext}`);
    }
  }, [file]);

  // Save / Replace Handler
  const handleSave = async () => {
    if (!file) return;

    let finalName = customNewName.trim();
    if (saveMode === 'new' && !finalName) {
      const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const ext = file.name.substring(file.name.lastIndexOf('.')) || '';
      const promptName = window.prompt('Enter a name for your new edited file:', `${base}_edited${ext}`);
      if (promptName === null) return; // User cancelled
      finalName = promptName.trim() || `${base}_edited${ext}`;
    }

    setSaving(true);
    try {
      const blob = await getEditedBlob();
      const now = new Date().toISOString();

      if (saveMode === 'replace') {
        await replaceFile(file.id, blob, {
          updatedAt: now,
          size: blob.size,
          videoEdits: blob.videoEdits || null,
          tags: [...(file.tags || []), 'edited']
        });
        addToast(`"${file.name}" updated in Storage Bank!`, 'success');
        logActivity('EDIT', `Replaced media "${file.name}"`, 'success');
      } else {
        const newFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          userId: file.userId,
          folderId: file.folderId || null,
          name: finalName,
          type: blob.type || file.type || 'application/octet-stream',
          category: file.category,
          size: blob.size,
          blob,
          videoEdits: blob.videoEdits || null,
          starred: false,
          inTrash: false,
          createdAt: now,
          updatedAt: now,
          tags: ['edited']
        };
        await saveFile(newFile);
        setActivePreview(newFile);
        setActiveCategory('edited');
        addToast(`Saved "${finalName}" to Edited Media Vault!`, 'success');
        logActivity('EDIT', `Saved edited copy "${finalName}"`, 'success');
      }

      await reloadVault();
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Failed to save media edits.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    const blob = await getEditedBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const ext = file.name.substring(file.name.lastIndexOf('.')) || '';
    a.download = `${base}_edited${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (!isOpen || !file) return null;

  const tabs = [
    { key: 'filters', label: 'Filters' },
    { key: 'adjust', label: 'Adjust' },
    { key: 'crop', label: 'Crop' },
    { key: 'transform', label: 'Transform' }
  ];

  const curPct = videoDuration > 0 ? (videoCurrentTime / videoDuration) * 100 : 0;
  const startPct = videoDuration > 0 ? (trimStart / videoDuration) * 100 : 0;
  const endPct = videoDuration > 0 ? (trimEnd / videoDuration) * 100 : 100;

  const getVideoAspectRatioCSS = () => {
    switch (cropAspect) {
      case '1:1': return '1 / 1';
      case '16:9': return '16 / 9';
      case '4:3': return '4 / 3';
      case '9:16': return '9 / 16';
      case '21:9': return '21 / 9';
      default: return 'auto';
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '1400px',
          width: '98vw',
          height: '96vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '12px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1rem', margin: 0 }}>
              {isImage ? 'Photo Studio' : 'Video Studio'} — <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{file.name}</span>
            </h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Main Grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', overflow: 'hidden' }}>

          {/* ── STAGE VIEWPORT ── */}
          <div
            style={{
              background: '#040711',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '20px',
              position: 'relative',
              height: '100%'
            }}
          >
            {/* Image Canvas */}
            {isImage && (
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '100%' }}>
                  <canvas
                    ref={canvasRef}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
                      cursor: activeTab === 'crop' ? 'crosshair' : 'default',
                      userSelect: 'none',
                      display: 'block'
                    }}
                    onMouseDown={onCropDown} onMouseMove={onCropMove} onMouseUp={onCropUp} onMouseLeave={onCropUp}
                    onTouchStart={onCropDown} onTouchMove={onCropMove} onTouchEnd={onCropUp}
                  />

                  {/* Crop Box Overlay — ONLY when active Tab is Crop & dragging or crop applied */}
                  {activeTab === 'crop' && cropRect && (dragging || cropApplied) && (
                    <div
                      style={{
                        position: 'absolute',
                        left: cropRect.x + 'px', top: cropRect.y + 'px',
                        width: cropRect.w + 'px', height: cropRect.h + 'px',
                        border: '2px solid #6366f1', background: 'rgba(99,102,241,0.18)',
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)', pointerEvents: 'none'
                      }}
                    >
                      {[[-3,-3],['auto',-3],[-3,'auto'],['auto','auto']].map(([t,l],i) => (
                        <div key={i} style={{
                          position: 'absolute', width: '10px', height: '10px', background: '#6366f1', borderRadius: '2px',
                          top: t === -3 ? '-5px' : 'auto', bottom: t === 'auto' ? '-5px' : 'auto',
                          left: l === -3 ? '-5px' : 'auto', right: l === 'auto' ? '-5px' : 'auto'
                        }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Video Stage — Full Height Interactive Video Player */}
            {isVideo && mediaUrl && (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', justifyContent: 'center' }}>
                <div
                  ref={videoStageRef}
                  style={{
                    position: 'relative',
                    width: '100%',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    cursor: activeTab === 'crop' ? 'crosshair' : 'default'
                  }}
                  onMouseDown={onCropDown} onMouseMove={onCropMove} onMouseUp={onCropUp} onMouseLeave={onCropUp}
                >
                  <div
                    style={{
                      position: 'relative',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      aspectRatio: getVideoAspectRatioCSS(),
                      overflow: 'hidden',
                      borderRadius: '12px',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                      ...(cropApplied && cropRect && videoStageRef.current ? {
                        clipPath: `inset(${Math.max(0, (cropRect.y / (videoStageRef.current.clientHeight || 1)) * 100)}% ${Math.max(0, (100 - ((cropRect.x + cropRect.w) / (videoStageRef.current.clientWidth || 1)) * 100))}% ${Math.max(0, (100 - ((cropRect.y + cropRect.h) / (videoStageRef.current.clientHeight || 1)) * 100))}% ${Math.max(0, (cropRect.x / (videoStageRef.current.clientWidth || 1)) * 100)}%)`
                      } : {})
                    }}
                  >
                    <video
                      ref={videoRef}
                      src={mediaUrl}
                      onLoadedMetadata={handleLoadedMetadata}
                      onTimeUpdate={handleVideoTimeUpdate}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      muted={videoMuted}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: cropAspect === 'free' ? 'contain' : 'cover',
                        filter: getFilterCSS(),
                        transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </div>

                  {/* Video Crop Overlay Box */}
                  {activeTab === 'crop' && cropRect && dragging && (
                    <div
                      style={{
                        position: 'absolute',
                        left: cropRect.x + 'px', top: cropRect.y + 'px',
                        width: cropRect.w + 'px', height: cropRect.h + 'px',
                        border: '2px solid #6366f1', background: 'rgba(99,102,241,0.18)',
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)', pointerEvents: 'none'
                      }}
                    />
                  )}
                </div>

                {/* Timeline Bar */}
                <div style={{ width: '100%', padding: '0 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                    <span>{fmtTime(videoCurrentTime)}</span>
                    <span style={{ color: '#6366f1', fontWeight: 700 }}>Trim Range: {fmtTime(trimStart)} → {fmtTime(trimEnd)}</span>
                    <span>{fmtTime(videoDuration)}</span>
                  </div>

                  <div
                    ref={timelineRef}
                    style={{ position: 'relative', height: '48px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', border: '1px solid var(--border-strong)', cursor: 'pointer', userSelect: 'none', overflow: 'visible' }}
                    onClick={handleScrub} onMouseDown={handleTimelineDown}
                    onMouseMove={handleTimelineMove} onMouseUp={handleTimelineUp} onMouseLeave={handleTimelineUp}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '2px', padding: '0 4px', overflow: 'hidden' }}>
                      {Array.from({ length: 70 }, (_, i) => (
                        <div key={i} style={{ flex: 1, height: `${16 + Math.sin(i * 0.8) * 14 + Math.cos(i * 1.3) * 8}px`, background: i / 70 >= trimStart / Math.max(1, videoDuration) && i / 70 <= trimEnd / Math.max(1, videoDuration) ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.12)', borderRadius: '2px' }} />
                      ))}
                    </div>
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${startPct}%`, width: `${endPct - startPct}%`, background: 'rgba(99,102,241,0.2)', border: '2px solid #6366f1', borderRadius: '6px', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${startPct}%`, width: '14px', marginLeft: '-7px', background: '#6366f1', borderRadius: '6px 0 0 6px', cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                      <Scissors size={9} color="#fff" />
                    </div>
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${endPct}%`, width: '14px', marginLeft: '-7px', background: '#6366f1', borderRadius: '0 6px 6px 0', cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                      <Scissors size={9} color="#fff" />
                    </div>
                    <div style={{ position: 'absolute', top: '-4px', bottom: '-4px', left: `${curPct}%`, width: '3px', marginLeft: '-1.5px', background: '#f59e0b', borderRadius: '2px', pointerEvents: 'none', zIndex: 4 }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button className="btn btn-ghost btn-icon" onClick={() => skipBy(-5)}><SkipBack size={15} /></button>
                      <button className="btn btn-primary" onClick={togglePlay} style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                      </button>
                      <button className="btn btn-ghost btn-icon" onClick={() => skipBy(5)}><SkipForward size={15} /></button>
                      <button className="btn btn-ghost btn-icon" onClick={() => setVideoMuted(v => !v)}>
                        {videoMuted ? <VolumeX size={16} color="var(--accent-rose)" /> : <Volume2 size={16} />}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[0.5, 1.0, 1.5, 2.0].map(spd => (
                        <button key={spd} onClick={() => { setVideoSpeed(spd); if (videoRef.current) videoRef.current.playbackRate = spd; }}
                          style={{
                            padding: '3px 8px', borderRadius: '6px', border: 'none', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer',
                            background: videoSpeed === spd ? 'var(--accent-primary)' : 'var(--bg-surface)',
                            color: videoSpeed === spd ? '#fff' : 'var(--text-muted)'
                          }}>
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT CONTROL PANEL ── */}
          <div style={{ borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    flex: 1, padding: '11px 2px', border: 'none', background: 'transparent', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer',
                    color: activeTab === t.key ? 'var(--accent-primary)' : 'var(--text-muted)',
                    borderBottom: activeTab === t.key ? '2px solid var(--accent-primary)' : '2px solid transparent'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* FILTERS */}
              {activeTab === 'filters' && (
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Instagram Presets</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {FILTERS.map(f => (
                      <button
                        key={f.key}
                        onClick={() => applyPreset(f)}
                        style={{
                          padding: '9px 6px', borderRadius: '10px', border: 'none', fontSize: '0.76rem', fontWeight: '600', cursor: 'pointer',
                          background: activeFilter === f.key ? 'rgba(99,102,241,0.25)' : 'var(--bg-input)',
                          color: activeFilter === f.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          outline: activeFilter === f.key ? '1.5px solid var(--accent-primary)' : 'none'
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ADJUST */}
              {activeTab === 'adjust' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Brightness', val: brightness, set: setBrightness, min: 30, max: 200, unit: '%' },
                    { label: 'Contrast', val: contrast, set: setContrast, min: 30, max: 200, unit: '%' },
                    { label: 'Saturation', val: saturate, set: setSaturate, min: 0, max: 250, unit: '%' },
                    { label: 'Hue Shift', val: hueRotate, set: setHueRotate, min: 0, max: 360, unit: '°' },
                    { label: 'Blur', val: blur, set: setBlur, min: 0, max: 12, unit: 'px' },
                    { label: 'Sepia', val: sepia, set: setSepia, min: 0, max: 100, unit: '%' },
                    { label: 'Grayscale', val: grayscale, set: setGrayscale, min: 0, max: 100, unit: '%' }
                  ].map(({ label, val, set, min, max, unit }) => (
                    <div key={label} style={{ fontSize: '0.76rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '3px' }}>
                        <span>{label}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>{val}{unit}</span>
                      </div>
                      <input type="range" min={min} max={max} value={val} onChange={e => { set(parseInt(e.target.value)); setActiveFilter('custom'); }} style={{ width: '100%', accentColor: 'var(--accent-primary)' }} />
                    </div>
                  ))}

                  {isImage && (
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Type size={12} /> WATERMARK</label>
                      <input type="text" className="input-text" placeholder="e.g. © 2026 Storage Bank" value={watermarkText} onChange={e => setWatermarkText(e.target.value)} style={{ fontSize: '0.82rem' }} />
                    </div>
                  )}
                </div>
              )}

              {/* CROP */}
              {activeTab === 'crop' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '10px 12px', background: 'rgba(99,102,241,0.1)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.25)', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--accent-primary)' }}>Aspect Ratio Presets:</strong><br />
                    Click an aspect ratio below to crop instantly, or drag on the stage.
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '7px', textTransform: 'uppercase' }}>Aspect Ratios</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {[{ key: 'free', label: 'Freehand' }, { key: '1:1', label: '1:1 Square' }, { key: '16:9', label: '16:9 HD' }, { key: '4:3', label: '4:3 Standard' }, { key: '9:16', label: '9:16 Reel' }, { key: '21:9', label: '21:9 Cinema' }].map(c => (
                        <button
                          key={c.key}
                          onClick={() => handleSelectAspectPreset(c.key)}
                          style={{
                            padding: '8px 4px', borderRadius: '9px', border: 'none', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                            background: cropAspect === c.key ? 'rgba(99,102,241,0.25)' : 'var(--bg-input)',
                            color: cropAspect === c.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            outline: cropAspect === c.key ? '1.5px solid var(--accent-primary)' : 'none'
                          }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(cropApplied || cropRect) && (
                    <button
                      onClick={() => { setCropRect(null); setCropApplied(false); setCropAspect('free'); }}
                      style={{ padding: '9px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      ✕ Reset Crop
                    </button>
                  )}
                </div>
              )}

              {/* TRANSFORM */}
              {activeTab === 'transform' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rotate & Flip</div>
                  <div style={{ display: 'flex', gap: '7px' }}>
                    <button className="btn btn-secondary" onClick={() => setRotation(r => (r + 90) % 360)} style={{ flex: 1, fontSize: '0.78rem' }}>
                      <RotateCw size={13} /> 90° CW
                    </button>
                    <button className="btn btn-secondary" onClick={() => setRotation(r => (r + 270) % 360)} style={{ flex: 1, fontSize: '0.78rem' }}>
                      <RotateCw size={13} style={{ transform: 'scaleX(-1)' }} /> CCW
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '7px' }}>
                    <button className="btn btn-secondary" onClick={() => setFlipH(v => !v)} style={{ flex: 1, fontSize: '0.78rem', background: flipH ? 'rgba(99,102,241,0.2)' : '', color: flipH ? 'var(--accent-primary)' : '' }}>
                      <FlipHorizontal size={13} /> Flip H
                    </button>
                    <button className="btn btn-secondary" onClick={() => setFlipV(v => !v)} style={{ flex: 1, fontSize: '0.78rem', background: flipV ? 'rgba(99,102,241,0.2)' : '', color: flipV ? 'var(--accent-primary)' : '' }}>
                      <FlipVertical size={13} /> Flip V
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: 'var(--bg-surface)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-subtle)', padding: '3px', gap: '2px' }}>
              <button
                onClick={() => setSaveMode('new')}
                style={{
                  padding: '6px 14px', borderRadius: '8px', border: 'none', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer',
                  background: saveMode === 'new' ? 'var(--accent-primary)' : 'transparent',
                  color: saveMode === 'new' ? '#fff' : 'var(--text-muted)'
                }}
              >
                <Copy size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} /> Save as New
              </button>
              <button
                onClick={() => setSaveMode('replace')}
                style={{
                  padding: '6px 14px', borderRadius: '8px', border: 'none', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer',
                  background: saveMode === 'replace' ? '#ef4444' : 'transparent',
                  color: saveMode === 'replace' ? '#fff' : 'var(--text-muted)'
                }}
              >
                <Replace size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} /> Replace Original
              </button>
            </div>

            {saveMode === 'new' && (
              <input
                type="text"
                value={customNewName}
                onChange={e => setCustomNewName(e.target.value)}
                placeholder="Enter file name..."
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  width: '200px'
                }}
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="btn btn-secondary" onClick={handleDownload} disabled={saving}><Download size={15} /> Download</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: '160px' }}>
              {saving ? (
                <><Loader2 size={15} className="spin" /> Saving...</>
              ) : (
                <><HardDrive size={15} /> {saveMode === 'replace' ? 'Replace Original' : 'Save as New'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
