import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import {
  X, User, Camera, Lock, Save, CheckCircle2,
  AlertCircle, Loader2, Eye, EyeOff, Shield
} from 'lucide-react';

export function AccountSettingsModal({ isOpen, onClose }) {
  const { user, profile, signOut } = useAuth();

  const [activeTab, setActiveTab]     = useState('profile');
  const [username,  setUsername]      = useState(user?.username || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile,    setAvatarFile]    = useState(null);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);

  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState('');
  const [error,     setError]     = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen || !user) return null;

  const clearMessages = () => { setSuccess(''); setError(''); };

  // ── Avatar pick (stored as Data URL in profiles) ─────────────────────────
  const handleAvatarChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setError('Image must be under 2 MB.'); return; }
    setAvatarFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  // ── Save Profile ─────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    clearMessages();
    if (!username.trim()) { setError('Username cannot be empty.'); return; }
    setLoading(true);
    try {
      let avatarUrl = user.avatar;

      // Convert avatar to Data URL if new file selected
      if (avatarFile) {
        avatarUrl = avatarPreview; // already a dataURL from FileReader
      }

      // Update Supabase auth metadata
      await supabase.auth.updateUser({ data: { username: username.trim(), avatar_url: avatarUrl } });

      // Update profiles table
      await supabase.from('profiles').upsert({
        id:       user.id,
        username: username.trim(),
        avatar:   avatarUrl,
        theme:    profile?.theme || 'dark',
        plan:     profile?.plan  || 'Unlimited Private Vault'
      }, { onConflict: 'id' });

      setSuccess('Profile updated! Refresh the page to see your new avatar everywhere.');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // ── Change Password ──────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    clearMessages();
    if (!newPass || newPass.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (newPass !== confirmPass)         { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password: newPass });
      if (err) throw err;
      setSuccess('Password changed successfully!');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: '11px 14px', fontSize: '0.92rem', borderRadius: '12px',
    width: '100%', boxSizing: 'border-box'
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 4500 }} onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '94vw' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem' }}>Account Settings</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
          {[
            { key: 'profile',  label: 'Profile' },
            { key: 'security', label: 'Security' },
          ].map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); clearMessages(); }}
              style={{
                flex: 1, padding: '13px 4px', border: 'none', background: 'transparent',
                fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer',
                color: activeTab === t.key ? 'var(--accent-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === t.key ? '2px solid var(--accent-primary)' : '2px solid transparent',
                transition: 'all 0.15s'
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          {/* Messages */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
              color: '#fca5a5', padding: '10px 14px', borderRadius: '12px',
              fontSize: '0.82rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          {success && (
            <div style={{
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)',
              color: '#6ee7b7', padding: '10px 14px', borderRadius: '12px',
              fontSize: '0.82rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <CheckCircle2 size={14} /> {success}
            </div>
          )}

          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Avatar picker */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-primary)', boxShadow: '0 0 20px var(--accent-glow)' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                  >
                    <Camera size={22} color="#fff" />
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}
                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                  <Camera size={14} /> Upload New Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>JPG, PNG, WebP · Max 2 MB</div>
              </div>

              {/* Username */}
              <div className="form-group">
                <label className="form-label">DISPLAY NAME</label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="Your display name"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Email (read-only) */}
              <div className="form-group">
                <label className="form-label">EMAIL ADDRESS</label>
                <input
                  type="email"
                  className="input-text"
                  value={user.email}
                  readOnly
                  style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Email cannot be changed in this version.
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleSaveProfile} disabled={loading}
                style={{ width: '100%', padding: '13px', fontSize: '0.95rem', borderRadius: '14px' }}>
                {loading ? <><Loader2 size={16} className="spin" /> Saving...</> : <><Save size={16} /> Save Profile</>}
              </button>
            </div>
          )}

          {/* ── Security Tab ── */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{
                padding: '12px 14px', borderRadius: '12px',
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                fontSize: '0.8rem', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <Shield size={16} color="var(--accent-primary)" />
                Your account is secured with Supabase Auth. Enter a new password to update.
              </div>

              <div className="form-group">
                <label className="form-label">NEW PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="input-text"
                    placeholder="Min. 6 characters"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    style={{ ...inputStyle, paddingRight: '42px' }}
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">CONFIRM NEW PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    className="input-text"
                    placeholder="Repeat new password"
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    style={{ ...inputStyle, paddingRight: '42px' }}
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPass && confirmPass && newPass !== confirmPass && (
                  <div style={{ fontSize: '0.72rem', color: '#fca5a5', marginTop: '4px' }}>⚠️ Passwords do not match</div>
                )}
              </div>

              <button className="btn btn-primary" onClick={handleChangePassword} disabled={loading}
                style={{ width: '100%', padding: '13px', fontSize: '0.95rem', borderRadius: '14px' }}>
                {loading ? <><Loader2 size={16} className="spin" /> Updating...</> : <><Lock size={15} /> Update Password</>}
              </button>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <button
                  onClick={async () => { await signOut(); onClose(); }}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                    color: '#fca5a5', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer'
                  }}>
                  Sign Out of Vault
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
