import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ParticleCanvas } from './ParticleCanvas';
import {
  ShieldCheck,
  UserPlus,
  LogIn,
  HardDrive,
  Lock,
  Zap,
  CheckCircle2,
  ArrowRight,
  Globe,
  Database,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

export function AuthLandingPage() {
  const { signUp, signIn, authLoading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [rememberMe, setRememberMe]       = useState(true);

  const [username, setUsername]           = useState('');
  const [email, setEmail]                 = useState(() => {
    const saved = localStorage.getItem('storagebank_remember_creds');
    return saved ? JSON.parse(saved).email : '';
  });
  const [password, setPassword]           = useState(() => {
    const saved = localStorage.getItem('storagebank_remember_creds');
    return saved ? JSON.parse(saved).password : '';
  });
  const [showPassword, setShowPassword]   = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');
  const [successMsg, setSuccessMsg]       = useState('');
  const [isSubmitting, setIsSubmitting]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegistering) {
        if (!username.trim()) {
          setErrorMsg('Please enter your name or username.');
          return;
        }
        const res = await signUp(email.trim(), password, username.trim());
        if (!res.success) {
          setErrorMsg(res.error || 'Sign-up failed. Please try again.');
        } else {
          setSuccessMsg('Account created! Check your email to confirm, or sign in directly if email confirmation is disabled.');
        }
      } else {
        const res = await signIn(email.trim(), password);
        if (!res.success) {
          setErrorMsg(res.error || 'Invalid email or password.');
        }
        // On success, onAuthStateChange in AuthContext automatically updates user state
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #030712 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0
      }}>
        <Loader2 size={40} color="var(--accent-primary)" className="spin" />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #030712 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      overflowY: 'auto',
      padding: '24px'
    }}>
      <ParticleCanvas />

      {/* Ambient Orbs */}
      <div style={{
        position: 'absolute', top: '10%', left: '15%',
        width: '450px', height: '450px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(60px)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '15%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(70px)', pointerEvents: 'none'
      }} />

      {/* Main Glassmorphism Card */}
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '480px', borderRadius: '28px',
        padding: '40px 36px',
        background: 'rgba(15, 23, 42, 0.88)',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(99, 102, 241, 0.3)',
        backdropFilter: 'blur(30px)',
        position: 'relative', zIndex: 10, margin: 'auto'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 10px 30px rgba(99, 102, 241, 0.6)'
          }}>
            <HardDrive size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em' }}>
            Storage Bank <span style={{ color: 'var(--accent-cyan)' }}>Vault</span>
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Unlimited Storage Bank — Local & Cloud Encrypted
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.06)',
          padding: '4px', borderRadius: '16px', marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            type="button"
            onClick={() => { setIsRegistering(true); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
              fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer',
              background: isRegistering ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              color: isRegistering ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <UserPlus size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setIsRegistering(false); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
              fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer',
              background: !isRegistering ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              color: !isRegistering ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <LogIn size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Sign In
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5', padding: '10px 14px', borderRadius: '12px',
            fontSize: '0.82rem', marginBottom: '16px', textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#6ee7b7', padding: '10px 14px', borderRadius: '12px',
            fontSize: '0.82rem', marginBottom: '16px', textAlign: 'center',
            display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'
          }}>
            <CheckCircle2 size={14} /> {successMsg}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegistering && (
            <div>
              <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.78rem' }}>
                FULL NAME / USERNAME
              </label>
              <input
                type="text"
                className="input-text"
                placeholder="e.g. Marcus Vance"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                style={{ padding: '12px 16px', fontSize: '0.95rem', borderRadius: '14px' }}
              />
            </div>
          )}

          <div>
            <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.78rem' }}>
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              className="input-text"
              placeholder="marcus@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus={!isRegistering}
              style={{ padding: '12px 16px', fontSize: '0.95rem', borderRadius: '14px' }}
            />
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.78rem' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-text"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ padding: '12px 44px 12px 16px', fontSize: '0.95rem', borderRadius: '14px', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 8px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>Remember me on this browser</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{
              width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '800',
              borderRadius: '16px', marginTop: '8px',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting
              ? <><Loader2 size={18} className="spin" /> {isRegistering ? 'Creating Vault...' : 'Signing In...'}</>
              : <><span>{isRegistering ? 'Initialize Private Vault' : 'Sign In to My Vault'}</span><ArrowRight size={18} /></>
            }
          </button>
        </form>

        {/* Footer Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={12} color="var(--accent-emerald)" /> End-to-End Secure
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Database size={12} color="var(--accent-primary)" /> IndexedDB Local
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Globe size={12} color="var(--accent-cyan)" /> Supabase Real-Time
          </span>
        </div>
      </div>
    </div>
  );
}
