import React, { useState, useEffect } from 'react';
import { useStorage } from '../context/StorageContext';
import {
  X,
  RefreshCw,
  Sparkles,
  Download,
  FileCheck,
  ArrowRight,
  Upload,
  HardDrive
} from 'lucide-react';

export function FileConverterModal({ file, isOpen, onClose }) {
  const { saveFile, user, reloadVault, addToast, logActivity } = useStorage();

  const [selectedFile, setSelectedFile] = useState(file || null);
  const [targetFormat, setTargetFormat] = useState('png');
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedResult, setConvertedResult] = useState(null);

  useEffect(() => {
    if (file) {
      setSelectedFile(file);
      // Pick default target format
      if (file.category === 'image') setTargetFormat(file.name.endsWith('.png') ? 'jpeg' : 'png');
      else if (file.category === 'document') setTargetFormat('html');
      else setTargetFormat('txt');
    }
  }, [file]);

  if (!isOpen) return null;

  const handleSelectLocalFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile({
        id: `temp-${Date.now()}`,
        name: f.name,
        size: f.size,
        type: f.type,
        blob: f,
        category: f.type.startsWith('image/') ? 'image' : 'document'
      });
      setConvertedResult(null);
    }
  };

  const getFormatOptions = () => {
    if (!selectedFile) return ['png', 'jpeg', 'webp', 'txt', 'html', 'json'];
    const cat = selectedFile.category;
    if (cat === 'image') return ['png', 'jpeg', 'webp', 'bmp', 'svg'];
    if (cat === 'document' || cat === 'code') return ['txt', 'md', 'html', 'json', 'csv'];
    return ['png', 'jpeg', 'webp', 'txt', 'html', 'json'];
  };

  // REAL Client-Side Format Conversion Engine
  const executeConversion = async () => {
    if (!selectedFile) return;
    setConverting(true);
    setProgress(10);
    setConvertedResult(null);

    try {
      const format = targetFormat.toLowerCase();
      const baseName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
      const newName = `${baseName}_converted.${format}`;

      let convertedBlob = null;
      let mimeType = 'application/octet-stream';

      // 1. IMAGE CONVERSIONS via HTML5 Canvas
      if (selectedFile.category === 'image' || selectedFile.type?.startsWith('image/')) {
        mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
        
        const img = new Image();
        const srcUrl = selectedFile.blob ? URL.createObjectURL(selectedFile.blob) : '';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = srcUrl;
        });

        setProgress(50);

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (format === 'jpeg' || format === 'jpg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        convertedBlob = await new Promise((resolve) => {
          canvas.toBlob((b) => resolve(b), mimeType, 0.92);
        });

        if (srcUrl) URL.revokeObjectURL(srcUrl);
      } 
      // 2. DOCUMENT / TEXT CONVERSIONS
      else {
        let textContent = '';
        if (selectedFile.blob) {
          textContent = await selectedFile.blob.text();
        } else if (selectedFile.content) {
          textContent = selectedFile.content;
        } else {
          textContent = `Converted file data for ${selectedFile.name}`;
        }

        setProgress(60);

        if (format === 'html') {
          textContent = `<!DOCTYPE html><html><head><title>${baseName}</title></head><body><pre>${textContent}</pre></body></html>`;
          mimeType = 'text/html';
        } else if (format === 'json') {
          textContent = JSON.stringify({ filename: newName, content: textContent, convertedAt: new Date() }, null, 2);
          mimeType = 'application/json';
        } else if (format === 'md') {
          textContent = `# ${baseName}\n\n${textContent}`;
          mimeType = 'text/markdown';
        } else {
          mimeType = 'text/plain';
        }

        convertedBlob = new Blob([textContent], { type: mimeType });
      }

      setProgress(90);

      const result = {
        name: newName,
        size: convertedBlob.size,
        type: mimeType,
        blob: convertedBlob,
        category: format === 'png' || format === 'jpeg' || format === 'webp' ? 'image' : 'document'
      };

      setProgress(100);
      setConvertedResult(result);
      addToast(`Converted "${selectedFile.name}" to .${format.toUpperCase()}!`, 'success');
      logActivity('CONVERT', `Converted "${selectedFile.name}" -> .${format}`, 'success');

    } catch (err) {
      console.error('Conversion failed:', err);
      addToast('Failed to convert file format.', 'error');
    } finally {
      setConverting(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!convertedResult || !user) return;
    const now = new Date().toISOString();
    const newFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId: user.id,
      folderId: null,
      name: convertedResult.name,
      type: convertedResult.type,
      category: convertedResult.category,
      size: convertedResult.size,
      blob: convertedResult.blob,
      starred: false,
      inTrash: false,
      createdAt: now,
      updatedAt: now,
      tags: ['converted']
    };

    await saveFile(newFile);
    await reloadVault();
    addToast(`Saved "${convertedResult.name}" to Vault!`, 'success');
    onClose();
  };

  const handleDownloadDirect = () => {
    if (!convertedResult) return;
    const url = URL.createObjectURL(convertedResult.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = convertedResult.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 4000 }} onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <RefreshCw size={22} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem' }}>Universal Format Converter Studio</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* File Picker / Current File Status */}
          {!selectedFile ? (
            <div style={{
              border: '2px dashed var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              padding: '30px 20px',
              textAlign: 'center',
              background: 'var(--bg-input)',
              cursor: 'pointer',
              marginBottom: '20px'
            }} onClick={() => document.getElementById('converterFileInput').click()}>
              <Upload size={36} color="var(--accent-primary)" style={{ marginBottom: '10px' }} />
              <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Click to Choose a File to Convert</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Supports PNG, JPG, WEBP, BMP, TXT, MD, HTML, JSON, CSV
              </div>
              <input id="converterFileInput" type="file" onChange={handleSelectLocalFile} style={{ display: 'none' }} />
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Original Size: {formatSize(selectedFile.size)}
                </div>
              </div>
              <button className="btn btn-ghost" onClick={() => { setSelectedFile(null); setConvertedResult(null); }} style={{ fontSize: '0.75rem' }}>
                Change File
              </button>
            </div>
          )}

          {/* Target Format Selector */}
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>TARGET CONVERSION FORMAT</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {getFormatOptions().map(fmt => (
                <button
                  key={fmt}
                  className="btn"
                  onClick={() => setTargetFormat(fmt)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    fontWeight: '700',
                    background: targetFormat === fmt ? 'var(--accent-gradient)' : 'var(--bg-input)',
                    color: targetFormat === fmt ? '#ffffff' : 'var(--text-secondary)',
                    border: targetFormat === fmt ? 'none' : '1px solid var(--border-subtle)'
                  }}
                >
                  .{fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Conversion Progress Bar */}
          {converting && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Converting file format...</span>
                <span>{progress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-input)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-gradient)', transition: 'width 0.2s linear' }} />
              </div>
            </div>
          )}

          {/* Converted Result Display Card */}
          {convertedResult && (
            <div style={{
              padding: '16px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              animation: 'slideUp 0.3s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileCheck size={20} color="var(--accent-emerald)" />
                <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--accent-emerald)' }}>
                  Conversion Complete!
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                <strong>{convertedResult.name}</strong> ({formatSize(convertedResult.size)})
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          {!convertedResult ? (
            <button className="btn btn-primary" onClick={executeConversion} disabled={!selectedFile || converting}>
              <Sparkles size={16} /> Convert to .{targetFormat.toUpperCase()}
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={handleSaveToVault}>
                <HardDrive size={16} /> Save to Vault
              </button>
              <button className="btn btn-primary" onClick={handleDownloadDirect}>
                <Download size={16} /> Download Converted File
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
