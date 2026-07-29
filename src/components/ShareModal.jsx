import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { X, Share2, Copy, Check, Lock, Globe, Shield } from 'lucide-react';

export function ShareModal() {
  const { activeShare, setActiveShare, addToast } = useStorage();
  const [copied, setCopied] = useState(false);
  const [linkAccess, setLinkAccess] = useState('passcode'); // 'public', 'passcode'
  const [sharePasscode, setSharePasscode] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());

  if (!activeShare) return null;

  const realPasscode = linkAccess === 'passcode' ? sharePasscode : '';
  const shareUrl = `${window.location.origin}?share=${activeShare.id}${realPasscode ? `&pass=${realPasscode}` : ''}`;

  const generateNewPasscode = () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setSharePasscode(newPin);
    addToast('Generated new 6-digit access passcode!', 'info');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    addToast(`Copied real share link ${realPasscode ? `(Passcode: ${realPasscode})` : ''}`, 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 3500 }} onClick={() => setActiveShare(null)}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Share2 size={22} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1.1rem' }}>Share Encrypted File Link</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setActiveShare(null)}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)'
            }}>
              <Share2 size={18} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {activeShare.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {activeShare.category} • {(activeShare.size / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>

          {/* Access Policy Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">LINK SECURITY ACCESS CONTROL</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setLinkAccess('public')}
                style={{
                  justifyContent: 'flex-start',
                  padding: '10px 12px',
                  background: linkAccess === 'public' ? 'rgba(99, 102, 241, 0.18)' : 'var(--bg-input)',
                  borderColor: linkAccess === 'public' ? 'var(--accent-primary)' : 'var(--border-subtle)'
                }}
              >
                <Globe size={16} color="var(--accent-primary)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '600' }}>Public Link</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Anyone with link can view</div>
                </div>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setLinkAccess('passcode')}
                style={{
                  justifyContent: 'flex-start',
                  padding: '10px 12px',
                  background: linkAccess === 'passcode' ? 'rgba(99, 102, 241, 0.18)' : 'var(--bg-input)',
                  borderColor: linkAccess === 'passcode' ? 'var(--accent-primary)' : 'var(--border-subtle)'
                }}
              >
                <Lock size={16} color="var(--accent-cyan)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '600' }}>PIN Protected</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Requires Passcode</div>
                </div>
              </button>
            </div>
          </div>

          {linkAccess === 'passcode' && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">SET ACCESS PASSCODE</label>
              <input
                type="text"
                className="input-text"
                placeholder="e.g. SecretPass123"
                value={sharePasscode}
                onChange={(e) => setSharePasscode(e.target.value)}
              />
            </div>
          )}

          {/* Copy Link Input Bar */}
          <div className="form-group">
            <label className="form-label">GENERATED ENCRYPTED SHARE URL</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                className="input-text"
                value={shareUrl}
                readOnly
                style={{ paddingRight: '110px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}
              />
              <button
                className="btn btn-primary"
                onClick={handleCopy}
                style={{
                  position: 'absolute',
                  right: '4px',
                  padding: '6px 14px',
                  fontSize: '0.8rem'
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={() => setActiveShare(null)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
