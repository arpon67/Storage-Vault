import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import {
  User, Camera, Lock, Save, CheckCircle2, AlertCircle,
  Loader2, Eye, EyeOff, Shield, Palette, Bell, LogOut,
  Edit3, ChevronRight, Sparkles, Globe
} from 'lucide-react';

const THEMES = [
  { key: 'dark',      label: 'Obsidian Cyber',    color: '#6366f1' },
  { key: 'light',     label: 'Clean Pearl',        color: '#0f172a' },
  { key: 'cyberpunk', label: 'Neon Cyberpunk',     color: '#ec4899' },
  { key: 'emerald',   label: 'Emerald Forest',     color: '#10b981' },
  { key: 'sunset',    label: 'Sunset Horizon',     color: '#f59e0b' },
  { key: 'oled',      label: 'Midnight OLED',      color: '#ffffff' },
  { key: 'cosmos',    label: 'Deep Cosmos',         color: '#3b82f6' },
  { key: 'matrix',    label: 'Toxic Matrix',        color: '#22c55e' },
  { key: 'mocha',     label: 'Warm Mocha',          color: '#d97706' },
  { key: 'nordic',    label: 'Nordic Ice',          color: '#38bdf8' },
  { key: 'sakura',    label: 'Sakura Bloom',        color: '#f472b6' },
  { key: 'synthwave', label: 'Hyper Synthwave',     color: '#d946ef' },
];

const AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=AetherDrive',
  'https://api.dicebear.com/7.x/bottts/svg?seed=NeonVault',
  'https://api.dicebear.com/7.x/bottts/svg?seed=CryptoBot',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Phantom',
  'https://api.dicebear.com/7.x/bottts/svg?seed=OrionX',
  'https://api.dicebear.com/7.x/bottts/svg?seed=LunarBot',
  'https://api.dicebear.com/7.x/bottts/svg?seed=StellarAI',
  'https://api.dicebear.com/7.x/bottts/svg?seed=NovaDrive',
];

function Section({ title, icon, children }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '20px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ color: 'var(--accent-primary)' }}>{icon}</span>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Alert({ type, children }) {
  const styles = {
    success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', color: '#6ee7b7', icon: <CheckCircle2 size={14} /> },
    error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  color: '#fca5a5', icon: <AlertCircle   size={14} /> },
  };
  const s = styles[type];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, padding: '10px 14px', borderRadius: '12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {s.icon} {children}
    </div>
  );
}

export function ProfilePage() {
  const { user, theme, changeTheme, updateUserProfile, signOut } = useAuth();

  // Profile state — pre-fill from user
  const [username,      setUsername]      = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg,    setProfileMsg]    = useState(null); // { type, text }

  // Password state
  const [newPass,      setNewPass]      = useState('');
  const [confirmPass,  setConfirmPass]  = useState('');
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [passSaving,   setPassSaving]   = useState(false);
  const [passMsg,      setPassMsg]      = useState(null);

  const fileInputRef = useRef(null);

  // Sync from user on mount / user change
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setAvatarPreview(user.avatar || '');
    }
  }, [user?.id]);

  if (!user) return null;

  // ── Avatar helpers ────────────────────────────────────────────────────────
  const handleFileAvatar = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setProfileMsg({ type: 'error', text: 'Image must be under 2 MB.' }); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const pickPresetAvatar = (url) => {
    setAvatarPreview(url);
  };

  // ── Save Profile (real-time) ──────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!username.trim()) { setProfileMsg({ type: 'error', text: 'Name cannot be empty.' }); return; }
    setProfileSaving(true);
    setProfileMsg(null);
    const res = await updateUserProfile({ username: username.trim(), avatar: avatarPreview });
    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Profile updated in real-time! Changes are reflected everywhere.' });
    } else {
      setProfileMsg({ type: 'error', text: res.error || 'Failed to update profile.' });
    }
    setProfileSaving(false);
  };

  // ── Change Password ───────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (newPass.length < 6) { setPassMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return; }
    if (newPass !== confirmPass) { setPassMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    setPassSaving(true);
    setPassMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) { setPassMsg({ type: 'error', text: error.message }); }
    else { setPassMsg({ type: 'success', text: 'Password updated successfully!' }); setNewPass(''); setConfirmPass(''); }
    setPassSaving(false);
  };

  const inputStyle = { padding: '12px 14px', fontSize: '0.9rem', borderRadius: '12px', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      background: 'var(--bg-primary)',
      minHeight: '100%',
      padding: '32px 28px',
      maxWidth: '860px',
      margin: '0 auto',
      width: '100%'
    }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '900', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '6px' }}>
          Account Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Manage your profile, security and appearance — changes apply in real-time.
        </p>
      </div>

      {/* ── Profile Card at top ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', background: 'var(--bg-surface)', borderRadius: '20px', border: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img src={user.avatar} alt="" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-primary)', boxShadow: '0 0 20px var(--accent-glow)' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', background: 'var(--accent-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onClick={() => fileInputRef.current?.click()}>
            <Camera size={11} color="#fff" />
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.username}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>{user.email}</div>
          <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', fontSize: '0.72rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
            <Sparkles size={10} /> {user.plan}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => signOut()} style={{ color: '#fca5a5', fontSize: '0.82rem', flexShrink: 0 }}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Profile Info ── */}
        <Section title="Profile" icon={<User size={18} />}>
          {profileMsg && <Alert type={profileMsg.type}>{profileMsg.text}</Alert>}

          {/* Avatar picker */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>PROFILE PHOTO</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {/* Current preview */}
              <div style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }} onClick={() => fileInputRef.current?.click()}>
                <img src={avatarPreview} alt="" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-primary)' }} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                  <Camera size={20} color="#fff" />
                </div>
              </div>

              {/* Preset bot avatars */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {AVATARS.map(url => (
                  <img key={url} src={url} alt="" onClick={() => pickPresetAvatar(url)}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', objectFit: 'cover', border: avatarPreview === url ? '3px solid var(--accent-primary)' : '2px solid var(--border-subtle)', transition: 'all 0.15s', boxSizing: 'border-box' }}
                  />
                ))}
                <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-strong)' }} title="Upload custom photo">
                  <Camera size={16} color="var(--text-muted)" />
                </button>
              </div>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>Pick a preset or upload your own (JPG/PNG/WebP · max 2 MB)</div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileAvatar} />
          </div>

          {/* Username */}
          <div className="form-group">
            <label className="form-label">DISPLAY NAME</label>
            <input type="text" className="input-text" value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
              placeholder="Your display name" style={inputStyle} />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Shows in the navbar and across your vault</div>
          </div>

          {/* Email (read-only) */}
          <div className="form-group">
            <label className="form-label">EMAIL ADDRESS</label>
            <input type="email" className="input-text" value={user.email} readOnly
              style={{ ...inputStyle, opacity: 0.55, cursor: 'not-allowed' }} />
          </div>

          <button className="btn btn-primary" onClick={handleSaveProfile} disabled={profileSaving}
            style={{ alignSelf: 'flex-start', padding: '12px 28px', fontSize: '0.92rem', borderRadius: '14px' }}>
            {profileSaving ? <><Loader2 size={16} className="spin" /> Saving...</> : <><Save size={16} /> Save Profile</>}
          </button>
        </Section>

        {/* ── Theme ── */}
        <Section title="Appearance" icon={<Palette size={18} />}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>SELECT THEME</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
              {THEMES.map(t => (
                <button key={t.key} onClick={() => changeTheme(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: theme === t.key ? 'rgba(99,102,241,0.2)' : 'var(--bg-input)',
                    outline: theme === t.key ? '2px solid var(--accent-primary)' : 'none',
                  }}>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: t.color, flexShrink: 0, boxShadow: theme === t.key ? `0 0 8px ${t.color}88` : 'none' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: theme === t.key ? '700' : '500', color: theme === t.key ? 'var(--accent-primary)' : 'var(--text-secondary)', textAlign: 'left' }}>{t.label}</span>
                  {theme === t.key && <CheckCircle2 size={14} color="var(--accent-primary)" style={{ marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>Theme preference is saved to your account and synced across devices.</div>
          </div>
        </Section>

        {/* ── VIP Subscription Plan ── */}
        <Section title="VIP Subscription & Plan" icon={<Sparkles size={18} color="var(--accent-amber)" />}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
            border: '1px solid var(--accent-primary)', borderRadius: '16px', padding: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>ACTIVE VAULT PLAN</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-amber)', margin: '4px 0' }}>
                {user.plan === 'ultra_lifetime' ? '👑 ULTRA LIFETIME VIP' : user.plan === 'pro_monthly' ? '⚡ VAULT PRO MONTHLY' : '🌟 7-DAY VIP FREE TRIAL'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {user.plan ? 'Unlimited Storage • 120 FPS Engine Active' : '7 Days remaining in your free trial.'}
              </div>
            </div>
            <button
              onClick={() => {
                const modal = document.querySelector('.modal-overlay');
                if (modal) window.dispatchEvent(new CustomEvent('open-subscription'));
                else alert('Click the PRO TRIAL button in the top navbar to upgrade!');
              }}
              className="btn btn-primary"
              style={{ padding: '10px 18px', fontSize: '0.82rem', borderRadius: '12px', fontWeight: 800 }}
            >
              Manage & Upgrade Plan
            </button>
          </div>
        </Section>

        {/* ── Security ── */}
        <Section title="Security" icon={<Shield size={18} />}>
          <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Shield size={16} color="var(--accent-primary)" style={{ marginTop: '1px', flexShrink: 0 }} />
            <div>Your account is secured with Supabase Auth end-to-end encryption. Enter a new password below to update it.</div>
          </div>

          {passMsg && <Alert type={passMsg.type}>{passMsg.text}</Alert>}

          <div className="form-group">
            <label className="form-label">NEW PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <input type={showNew ? 'text' : 'password'} className="input-text" placeholder="Minimum 6 characters"
                value={newPass} onChange={e => setNewPass(e.target.value)} style={{ ...inputStyle, paddingRight: '44px' }} />
              <button type="button" onClick={() => setShowNew(v => !v)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">CONFIRM PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <input type={showConfirm ? 'text' : 'password'} className="input-text" placeholder="Repeat new password"
                value={confirmPass} onChange={e => setConfirmPass(e.target.value)} style={{ ...inputStyle, paddingRight: '44px' }} />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPass && confirmPass && newPass !== confirmPass && (
              <div style={{ fontSize: '0.72rem', color: '#fca5a5', marginTop: '4px' }}>⚠️ Passwords do not match</div>
            )}
          </div>

          <button className="btn btn-primary" onClick={handleChangePassword} disabled={passSaving}
            style={{ alignSelf: 'flex-start', padding: '12px 28px', fontSize: '0.92rem', borderRadius: '14px' }}>
            {passSaving ? <><Loader2 size={16} className="spin" /> Updating...</> : <><Lock size={15} /> Update Password</>}
          </button>
        </Section>

        {/* ── Danger Zone ── */}
        <div style={{ padding: '20px 24px', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fca5a5', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> Danger Zone
          </div>
          <button onClick={signOut}
            style={{ padding: '11px 24px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.15s' }}>
            <LogOut size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Sign Out of Storage Bank Vault
          </button>
        </div>

      </div>
    </div>
  );
}
