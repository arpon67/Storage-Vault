import React, { useState } from 'react';
import {
  Sparkles, Check, CreditCard, ShieldCheck, Zap,
  X, AlertCircle, PhoneCall, RefreshCw, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function SubscriptionModal({ isOpen, onClose }) {
  const { user, updateUserProfile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [trxId, setTrxId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const currentPlan = user?.plan || 'trial';
  const trialDaysLeft = 7;

  const handleUpgrade = (e) => {
    e.preventDefault();
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      updateUserProfile({
        plan: selectedPlan === 'lifetime' ? 'ultra_lifetime' : 'pro_monthly',
        subscriptionDate: new Date().toISOString(),
        paymentMethod
      });
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1600);
    }, 1200);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 4000 }} onClick={onClose}>
      <div
        className="modal-content glass-panel"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '650px',
          width: '95vw',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px',
          borderRadius: '24px',
          position: 'relative'
        }}
      >
        <button
          className="btn btn-ghost btn-icon"
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px' }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(99,102,241,0.15)', border: '1px solid var(--accent-primary)',
            color: 'var(--accent-primary)', padding: '4px 14px', borderRadius: '20px',
            fontSize: '0.78rem', fontWeight: 700, marginBottom: '10px'
          }}>
            <Sparkles size={14} /> STORAGE BANK VIP PLANS
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0' }}>
            Upgrade Your Storage Bank Vault
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            Your <strong>7-Day Free Trial</strong> is active. Upgrade anytime for unlimited 120 FPS speed.
          </p>
        </div>

        {/* Current Trial Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
          border: '1px solid var(--border-strong)', borderRadius: '16px', padding: '12px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'
        }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Current Active Plan</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
              🌟 7-Day Unlimited VIP Free Trial
            </div>
          </div>
          <div style={{
            background: 'var(--accent-amber)', color: '#000', padding: '4px 10px',
            borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800
          }}>
            ACTIVE ({trialDaysLeft} DAYS LEFT)
          </div>
        </div>

        {/* Plan Picker Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
          {/* Pro Monthly */}
          <div
            onClick={() => setSelectedPlan('pro')}
            style={{
              background: selectedPlan === 'pro' ? 'rgba(99,102,241,0.15)' : 'var(--bg-surface)',
              border: selectedPlan === 'pro' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              borderRadius: '18px', padding: '18px', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
            }}
          >
            {selectedPlan === 'pro' && (
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--accent-primary)', color: '#fff', borderRadius: '50%', padding: '2px' }}>
                <Check size={14} />
              </div>
            )}
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>VAULT PRO</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', margin: '6px 0' }}>
              $9.99 <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ ৳999/mo</span>
            </div>
            <ul style={{ paddingLeft: '16px', margin: '10px 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Unlimited Storage Bank Space</li>
              <li>120 FPS Ultra Hardware Acceleration</li>
              <li>Windows Virtual Drive (Z:) Support</li>
            </ul>
          </div>

          {/* Ultra Lifetime */}
          <div
            onClick={() => setSelectedPlan('lifetime')}
            style={{
              background: selectedPlan === 'lifetime' ? 'rgba(168,85,247,0.15)' : 'var(--bg-surface)',
              border: selectedPlan === 'lifetime' ? '2px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
              borderRadius: '18px', padding: '18px', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
            }}
          >
            <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent-gradient)', color: '#fff', fontSize: '0.65rem', fontWeight: 900, padding: '2px 10px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
              BEST VALUE • LIFETIME
            </div>
            {selectedPlan === 'lifetime' && (
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--accent-purple)', color: '#fff', borderRadius: '50%', padding: '2px' }}>
                <Check size={14} />
              </div>
            )}
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>ULTRA LIFETIME</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', margin: '6px 0' }}>
              $49.99 <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ ৳4999 ONCE</span>
            </div>
            <ul style={{ paddingLeft: '16px', margin: '10px 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Lifetime VIP Access (0 Recurring Fees)</li>
              <li>Priority Supabase Cloud Backup</li>
              <li>Pro Media & Audio Studio Access</li>
            </ul>
          </div>
        </div>

        {/* Payment Gateways */}
        <form onSubmit={handleUpgrade}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
            SELECT PAYMENT METHOD
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setPaymentMethod('bkash')}
              style={{
                flex: 1, padding: '10px', borderRadius: '12px', border: paymentMethod === 'bkash' ? '2px solid #e2136e' : '1px solid var(--border-subtle)',
                background: paymentMethod === 'bkash' ? 'rgba(226,19,110,0.12)' : 'var(--bg-surface)',
                color: paymentMethod === 'bkash' ? '#e2136e' : 'var(--text-secondary)', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer'
              }}
            >
              📱 bKash / Nagad
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              style={{
                flex: 1, padding: '10px', borderRadius: '12px', border: paymentMethod === 'card' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                background: paymentMethod === 'card' ? 'rgba(99,102,241,0.12)' : 'var(--bg-surface)',
                color: paymentMethod === 'card' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer'
              }}
            >
              💳 Credit / Debit Card
            </button>
          </div>

          {paymentMethod === 'bkash' ? (
            <div style={{ background: 'rgba(226,19,110,0.06)', border: '1px solid rgba(226,19,110,0.25)', borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', color: '#e2136e', fontWeight: 700, marginBottom: '6px' }}>
                bKash / Nagad Personal Send Money: <strong>01700-000000</strong>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                Send {selectedPlan === 'lifetime' ? '৳4,999' : '৳999'} to the number above and enter your Transaction ID (TrxID) below:
              </p>
              <input
                type="text"
                placeholder="e.g. 9J28XKL90"
                value={trxId}
                onChange={e => setTrxId(e.target.value)}
                required
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
                  color: '#fff', fontSize: '0.85rem'
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Card Number (4532 •••• •••• ••••)"
                value={cardNumber}
                onChange={e => setCardNumber(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-strong)', color: '#fff', fontSize: '0.85rem' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={e => setCardExpiry(e.target.value)}
                  required
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-strong)', color: '#fff', fontSize: '0.85rem' }}
                />
                <input
                  type="text"
                  placeholder="CVC"
                  value={cardCvc}
                  onChange={e => setCardCvc(e.target.value)}
                  required
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-strong)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          )}

          {success ? (
            <div style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', color: '#6ee7b7', padding: '12px', borderRadius: '12px', textAlign: 'center', fontWeight: 700 }}>
              🎉 VIP Plan Upgrade Successful!
            </div>
          ) : (
            <button
              type="submit"
              disabled={processing}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 800, borderRadius: '14px' }}
            >
              {processing ? 'Processing Payment...' : selectedPlan === 'lifetime' ? 'Upgrade to Lifetime VIP ($49.99)' : 'Subscribe Pro Monthly ($9.99/mo)'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
