import React, { useState, useRef } from 'react';
import { useStorage } from '../context/StorageContext';
import { X, UploadCloud, FolderUp, File, CheckCircle2 } from 'lucide-react';

export function UploadModal() {
  const { isUploadOpen, setIsUploadOpen, uploadFiles, uploadProgress } = useStorage();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  if (!isUploadOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
      setIsDone(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
      setIsDone(false);
    }
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setIsDone(false);
    try {
      await uploadFiles(selectedFiles);
      setIsDone(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinish = () => {
    setSelectedFiles([]);
    setIsDone(false);
    setIsUploadOpen(false);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UploadCloud size={22} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.1rem' }}>Upload Files & Recursive Folders</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setIsUploadOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: isDragging ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-subtle)',
              background: isDragging ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-input)',
              borderRadius: 'var(--radius-lg)',
              padding: '36px 20px',
              textAlign: 'center',
              transition: 'var(--transition-fast)'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              style={{ display: 'none' }}
            />
            <input
              type="file"
              ref={folderInputRef}
              onChange={handleFileChange}
              webkitdirectory="true"
              directory="true"
              multiple
              style={{ display: 'none' }}
            />

            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto',
              color: 'var(--accent-primary)'
            }}>
              <UploadCloud size={30} />
            </div>

            <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '6px' }}>
              Drag & Drop files or full folders here
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Unlimited local disk quota. Upload high-res raw images, 4K videos, zip files, or full folders.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                <File size={16} /> Choose Files
              </button>
              <button className="btn btn-secondary" onClick={() => folderInputRef.current?.click()}>
                <FolderUp size={16} color="var(--accent-cyan)" /> Upload Whole Folder
              </button>
            </div>
          </div>

          {/* Selected Files List Preview */}
          {selectedFiles.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px' }}>
                QUEUED ITEMS ({selectedFiles.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
                {selectedFiles.map((file, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <File size={16} color="var(--accent-primary)" />
                      <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{file.webkitRelativePath || file.name}</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{formatSize(file.size)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real-Time Upload Progress Bar */}
          {uploadProgress && uploadProgress.active && (
            <div style={{
              marginTop: '20px',
              padding: '14px 16px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent-primary)',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '8px', fontWeight: '700' }}>
                <span style={{ color: 'var(--text-primary)' }}>
                  Writing file {uploadProgress.fileIndex} of {uploadProgress.totalFiles}: {uploadProgress.fileName}
                </span>
                <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{uploadProgress.percentage}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${uploadProgress.percentage}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                  transition: 'width 0.2s ease-out'
                }} />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {isDone ? (
            <button className="btn btn-primary" onClick={handleFinish} style={{ width: '100%', background: '#10b981', borderColor: '#10b981' }}>
              <CheckCircle2 size={18} /> Stored {selectedFiles.length} File(s) in Vault — Close
            </button>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleStartUpload}
                disabled={selectedFiles.length === 0 || isUploading}
              >
                {isUploading ? 'Writing to Vault...' : `Upload ${selectedFiles.length} Item(s)`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
