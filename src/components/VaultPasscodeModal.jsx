import React, { useState, useEffect } from 'react';
import { useStorage } from '../context/StorageContext';
import { Lock, Unlock, ShieldCheck, KeyRound } from 'lucide-react';

export function VaultPasscodeModal() {
  const { addToast } = useStorage();
  const [isLocked, setIsLocked] = useState(() => {
    return localStorage.getItem('aether_pin_enabled') === 'true';
  });

  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [settingMode, setSettingMode] = useState(false);
  const [newPin, setNewPin] = useState('');

  const savedPin = localStorage.getItem('aether_vault_pin') || '1234';

  const handleUnlock = () => {
    if (pin === savedPin) {
      setIsLocked(false);
      setError(false);
      addToast('Vault unlocked successfully!', 'success');
    } else {
      setError(true);
      setPin('');
      addToast('Incorrect passcode PIN.', 'error');
    }
  };

  const handleSaveNewPin = () => {
    if (newPin.length === 4) {
      localStorage.setItem('aether_vault_pin', newPin);
      localStorage.setItem('aether_pin_enabled', 'true');
      setSettingMode(false);
      addToast('Vault Passcode PIN set to ' + newPin, 'success');
    }
  };

  if (!isLocked) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 99999, background: 'rgba(3, 7, 18, 0.96)' }}>
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px 24px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: '0 8px 24px var(--accent-glow)'
        }}>
          <Lock size={32} color="#ffffff" />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '6px' }}>
          Master Vault Locked
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Enter your 4-digit Passcode PIN to access your encrypted storage vault.
        </p>

        {/* 4 Digit PIN Input */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
          <input
            type="password"
            maxLength={4}
            className="input-text"
            placeholder="••••"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            autoFocus
            style={{
              textAlign: 'center',
              fontSize: '1.8rem',
              letterSpacing: '0.5em',
              width: '180px',
              border: error ? '2px solid var(--accent-rose)' : '1px solid var(--border-strong)'
            }}
          />
        </div>

        <button className="btn btn-primary" onClick={handleUnlock} style={{ width: '100%', padding: '12px' }}>
          <Unlock size={18} /> Unlock Storage Vault
        </button>

        <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Default Demo PIN: <code style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>1234</code>
        </div>
      </div>
    </div>
  );
}
