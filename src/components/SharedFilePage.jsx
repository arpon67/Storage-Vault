import React, { useState, useEffect } from 'react';
import { useStorage } from '../context/StorageContext';
import { Lock, Download, ShieldCheck, FileText, Music, Video, Image, File, Check, Sparkles } from 'lucide-react';
import { getFileById } from '../services/dbService';

export function SharedFilePage({ sharedFileId, requiredPasscode }) {
  const { files } = useStorage();
  const [sharedFile, setSharedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passInput, setPassInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(!requiredPasscode);
  const [errorMsg, setErrorMsg] = useState('');
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadTargetFile() {
      const match = files.find(f => f.id === sharedFileId);
      if (match) {
        if (isMounted) {
          setSharedFile(match);
          setLoading(false);
        }
        return;
      }
      try {
        const dbRecord = await getFileById(sharedFileId);
        if (dbRecord && isMounted) {
          setSharedFile(dbRecord);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadTargetFile();
    return () => { isMounted = false; };
  }, [sharedFileId, files]);

  useEffect(() => {
    if (sharedFile?.blob) {
      const url = URL.createObjectURL(sharedFile.blob);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [sharedFile]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', width: '100vw', background: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: 600 }}>
          <Sparkles className="spin" size={24} color="var(--accent-primary)" />
          <span>Decrypting shared vault file...</span>
        </div>
      </div>
    );
  }

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passInput.trim() === requiredPasscode) {
      setIsUnlocked(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Incorrect 6-digit access passcode. Please try again.');
    }
  };

  const handleDownload = () => {
    if (!sharedFile) return;
    if (sharedFile.blob) {
      const url = URL.createObjectURL(sharedFile.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = sharedFile.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!sharedFile) {
    return (
      <div style={{
        minHeight: '100vh', width: '100vw', background: '#030712',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: '20px'
      }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '24px', padding: '40px', maxWidth: '460px', textAlign: 'center' }}>
          <ShieldCheck size={48} color="var(--accent-rose)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Shared Link Expired or Not Found</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
            This encrypted share link is no longer available or has been deleted by the owner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100vw', background: '#030712',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: '20px'
    }}>
      {/* Header Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={22} color="#fff" />
        </div>
        <span style={{ fontSize: '1.3rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Storage Bank Secure Vault Share
        </span>
      </div>

      <div style={{
        background: 'var(--bg-modal)', border: '1px solid var(--border-strong)',
        borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '560px',
        boxShadow: '0 30px 90px rgba(0,0,0,0.8)'
      }}>
        {!isUnlocked ? (
          <form onSubmit={handleUnlock} style={{ textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Lock size={28} color="var(--accent-primary)" />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Protected Vault File</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px', marginBottom: '24px' }}>
              Enter the 6-digit passcode provided by the owner to view this file
            </p>

            {errorMsg && (
              <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <input
              type="password"
              maxLength={6}
              placeholder="Enter 6-Digit Passcode"
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '1.2rem', textAlign: 'center',
                letterSpacing: '4px', outline: 'none', marginBottom: '20px'
              }}
            />

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '14px', fontWeight: 700, fontSize: '0.95rem' }}>
              Unlock & Access File
            </button>
          </form>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{sharedFile.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {(sharedFile.size / 1024 / 1024).toFixed(2)} MB • {sharedFile.category?.toUpperCase()}
                </span>
              </div>

              <button className="btn btn-primary" onClick={handleDownload} style={{ padding: '10px 18px', borderRadius: '12px', gap: '8px', fontWeight: 700 }}>
                <Download size={16} /> Download File
              </button>
            </div>

            {/* File Preview Container */}
            <div style={{
              background: '#000', borderRadius: '16px', overflow: 'hidden',
              minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {sharedFile.category === 'image' && objectUrl && (
                <img src={objectUrl} alt={sharedFile.name} style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain' }} />
              )}
              {sharedFile.category === 'video' && objectUrl && (
                <video src={objectUrl} controls style={{ width: '100%', maxHeight: '420px' }} />
              )}
              {sharedFile.category === 'audio' && objectUrl && (
                <audio src={objectUrl} controls style={{ width: '90%' }} />
              )}
              {['document', 'code', 'archive', 'other'].includes(sharedFile.category) && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <FileText size={54} color="var(--accent-primary)" style={{ marginBottom: '12px' }} />
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Click Download File above to view content</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '24px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        🔒 End-to-End Encrypted File Sharing • Storage Bank Vault
      </div>
    </div>
  );
}
