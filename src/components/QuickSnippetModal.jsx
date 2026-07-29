import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { X, FileCode, Save } from 'lucide-react';

export function QuickSnippetModal({ isOpen, onClose }) {
  const { uploadFiles, currentFolderId } = useStorage();

  const [filename, setFilename] = useState('New_Script.jsx');
  const [template, setTemplate] = useState('react');
  const [content, setContent] = useState(`import React from 'react';

export default function Component() {
  return (
    <div className="p-4 rounded-xl bg-slate-900 text-white">
      <h1>Hello AetherDrive Vault!</h1>
    </div>
  );
}
`);

  if (!isOpen) return null;

  const handleTemplateChange = (tpl) => {
    setTemplate(tpl);
    if (tpl === 'react') {
      setFilename('NewComponent.jsx');
      setContent(`import React from 'react';\n\nexport default function CustomWidget() {\n  return <div>AetherDrive Widget</div>;\n}`);
    } else if (tpl === 'markdown') {
      setFilename('Notes.md');
      setContent(`# Project Notes\n\n- Task 1: Complete UI Design\n- Task 2: Upload Files\n- Task 3: Encrypt Vault`);
    } else if (tpl === 'python') {
      setFilename('data_pipeline.py');
      setContent(`import json\n\ndef process_data():\n    print("Processing AetherDrive local storage analytics...")\n\nif __name__ == "__main__":\n    process_data()`);
    } else if (tpl === 'json') {
      setFilename('config.json');
      setContent(`{\n  "version": "1.0.0",\n  "storageEngine": "IndexedDB",\n  "encryption": "AES-256-GCM"\n}`);
    }
  };

  const handleCreate = async () => {
    if (!filename.trim()) return;
    const mimeType = filename.endsWith('.md') ? 'text/markdown' : 'text/plain';
    const blob = new Blob([content], { type: mimeType });

    const newFile = {
      name: filename.trim(),
      type: mimeType,
      category: filename.endsWith('.md') ? 'document' : 'code',
      blob: blob,
      size: blob.size,
      tags: ['Snippet']
    };

    await uploadFiles([newFile], currentFolderId);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCode size={22} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.1rem' }}>Create Quick Note / Code Snippet</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Template Selector Pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <TemplatePill label="React JSX" active={template === 'react'} onClick={() => handleTemplateChange('react')} />
            <TemplatePill label="Markdown" active={template === 'markdown'} onClick={() => handleTemplateChange('markdown')} />
            <TemplatePill label="Python" active={template === 'python'} onClick={() => handleTemplateChange('python')} />
            <TemplatePill label="JSON" active={template === 'json'} onClick={() => handleTemplateChange('json')} />
          </div>

          <div className="form-group">
            <label className="form-label">File Name</label>
            <input
              type="text"
              className="input-text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Code / Markdown Content</label>
            <textarea
              className="input-text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', lineHeight: '1.6' }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}>
            <Save size={16} /> Save Snippet to Vault
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplatePill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 'var(--radius-full)',
        border: active ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
        background: active ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-input)',
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
        fontWeight: '600',
        fontSize: '0.8rem',
        cursor: 'pointer',
        transition: 'var(--transition-fast)'
      }}
    >
      {label}
    </button>
  );
}
