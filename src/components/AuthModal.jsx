import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStorage } from '../context/StorageContext';
import {
  User,
  X,
  LogOut,
  CheckCircle2,
  Sparkles,
  Shield
} from 'lucide-react';

export function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, addToast } = useStorage();
  const { user, signOut } = useAuth();

  // Close if user is not logged in (AuthLandingPage handles the full-screen login)
  if (!isAuthModalOpen) return null;

  const handleSignOut = async () => {
    await signOut();
    setIsAuthModalOpen(false);
    addToast('Signed out of your vault.', 'info');
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 4000 }} onClick={() => setIsAuthModalOpen(false)}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px', width: '92vw' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={22} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.1rem' }}>Vault Account</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setIsAuthModalOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* User Info */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '16px', borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}>
                <img
                  src={user.avatar}
                  alt={user.username}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {user.username}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                    {user.email}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                      <CheckCircle2 size={10} /> Active Session
                    </span>
                  </div>
                </div>
              </div>

              {/* Plan Info */}
              <div style={{
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <Shield size={16} color="var(--accent-cyan)" />
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Current Plan</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: '600' }}>{user.plan}</div>
                </div>
              </div>

              {/* Sign Out */}
              <button
                className="btn"
                onClick={handleSignOut}
                style={{
                  width: '100%', padding: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5', borderRadius: 'var(--radius-md)',
                  fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'var(--transition-fast)'
                }}
              >
                <LogOut size={16} /> Sign Out of Vault
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
              <Sparkles size={32} color="var(--accent-primary)" style={{ margin: '0 auto 12px' }} />
              <p>You are not signed in. Please use the login screen.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
