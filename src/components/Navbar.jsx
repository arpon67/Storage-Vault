import React, { useState, useEffect, useRef } from 'react';
import { useStorage } from '../context/StorageContext';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  LayoutGrid,
  List,
  PieChart,
  Activity,
  Command,
  User,
  LogOut,
  ShieldCheck,
  Palette,
  Bot,
  Music,
  Disc,
  Sparkles
} from 'lucide-react';

export function Navbar({ onOpenAiCopilot }) {
  const {
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    setIsAnalyticsOpen,
    setIsAuthModalOpen,
    setIsCommandPaletteOpen,
    setIsActivityLogOpen,
    setIsSubscriptionOpen,
    setIsMusicStudioOpen,
    setActiveCategory
  } = useStorage();

  const { user, theme, changeTheme, signOut } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const profileRef = useRef(null);
  const themeRef = useRef(null);

  // Click outside to dismiss menus
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setIsThemeMenuOpen(false);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const themeOptions = [
    { key: 'dark', name: 'Obsidian Cyber (Dark)', color: '#6366f1' },
    { key: 'light', name: 'Clean Pearl (Light)', color: '#0f172a' },
    { key: 'cyberpunk', name: 'Neon Cyberpunk', color: '#ec4899' },
    { key: 'emerald', name: 'Emerald Forest', color: '#10b981' },
    { key: 'sunset', name: 'Sunset Horizon', color: '#f59e0b' },
    { key: 'oled', name: 'Midnight OLED', color: '#ffffff' },
    { key: 'cosmos', name: 'Deep Cosmos', color: '#3b82f6' },
    { key: 'matrix', name: 'Toxic Acid Matrix', color: '#22c55e' },
    { key: 'mocha', name: 'Warm Mocha Velvet', color: '#d97706' },
    { key: 'nordic', name: 'Nordic Ice Frost', color: '#38bdf8' },
    { key: 'sakura', name: 'Sakura Bloom', color: '#f472b6' },
    { key: 'synthwave', name: 'Hyper Synthwave', color: '#d946ef' },
  ];

  return (
    <header style={{
      height: '70px',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
      backdropFilter: 'blur(20px)',
      zIndex: 90,
      flexShrink: 0
    }}>
      {/* Search Input Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '580px' }}>
        <div
          onClick={() => setIsCommandPaletteOpen(true)}
          style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <Search size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-text"
            placeholder="Search files or press Ctrl+K for commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '42px',
              paddingRight: '74px',
              borderRadius: '9999px',
              background: 'var(--bg-input)',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          />
          <div style={{
            position: 'absolute',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            fontWeight: '600'
          }}>
            <Command size={10} /> K
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span className="badge badge-indigo" style={{ padding: '4px 10px', fontSize: '0.72rem', fontWeight: '800', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
          Made by Arpon
        </span>
        {/* AetherAI Copilot Assistant Trigger */}
        <button
          className="btn btn-primary"
          onClick={onOpenAiCopilot}
          style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: 'var(--radius-full)' }}
          title="Open AetherAI Vault Assistant"
        >
          <Bot size={16} />
          <span>AetherAI</span>
          <Sparkles size={12} color="#ffffff" />
        </button>

        {/* Activity Log Trigger */}
        <button 
          className="btn btn-ghost btn-icon" 
          onClick={() => setIsActivityLogOpen(true)}
          title="Vault Activity Log"
        >
          <Activity size={19} color="var(--accent-amber)" />
        </button>

        {/* Storage Analytics Quick Button */}
        <button 
          className="btn btn-ghost" 
          onClick={() => setIsAnalyticsOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
        >
          <PieChart size={18} color="var(--accent-primary)" />
          <span style={{ display: 'inline-block' }}>Analytics</span>
        </button>

        {/* Grid vs List View Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-input)',
          padding: '3px',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              background: viewMode === 'grid' ? 'var(--accent-primary)' : 'transparent',
              color: viewMode === 'grid' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            title="Grid View"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              background: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent',
              color: viewMode === 'list' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            title="List View"
          >
            <List size={16} />
          </button>
        </div>

        {/* Music Studio Button */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setIsMusicStudioOpen(true)}
          title="Storage Bank Music Studio & Phonk Player"
          style={{ position: 'relative' }}
        >
          <Disc size={20} color="var(--accent-amber)" style={{ animation: 'spin 4s linear infinite' }} />
          <span style={{
            position: 'absolute', top: '2px', right: '2px',
            width: '7px', height: '7px', borderRadius: '50%',
            background: 'var(--accent-amber)', boxShadow: '0 0 8px var(--accent-amber)'
          }} />
        </button>

        {/* VIP Plan Badge */}
        <button
          onClick={() => setIsSubscriptionOpen(true)}
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.25))',
            border: '1px solid var(--accent-primary)', color: 'var(--accent-amber)',
            padding: '5px 12px', borderRadius: '20px', fontSize: '0.74rem', fontWeight: 800,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 0 12px rgba(99,102,241,0.25)'
          }}
        >
          <Sparkles size={14} color="var(--accent-amber)" className="pulse" />
          <span>PRO TRIAL (7 DAYS)</span>
        </button>

        {/* 12-Theme Palette Selector */}
        <div style={{ position: 'relative' }} ref={themeRef}>
          <button 
            className="btn btn-ghost btn-icon" 
            onClick={(e) => { e.stopPropagation(); setIsThemeMenuOpen(prev => !prev); }}
            title="Change Theme Palette"
          >
            <Palette size={19} color="var(--accent-primary)" />
          </button>

          {isThemeMenuOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '50px',
              width: '240px',
              maxHeight: '380px',
              overflowY: 'auto',
              background: 'var(--bg-modal)',
              border: '1px solid var(--border-strong)',
              borderRadius: '16px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              padding: '8px',
              zIndex: 200,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ padding: '4px 8px 8px 8px', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                SELECT THEME PALETTE (12)
              </div>
              {themeOptions.map(t => (
                <button
                  key={t.key}
                  className="btn btn-ghost"
                  onClick={() => { changeTheme(t.key); setIsThemeMenuOpen(false); }}
                  style={{
                    width: '100%',
                    justify: 'flex-start',
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    background: theme === t.key ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                    color: theme === t.key ? 'var(--accent-primary)' : 'var(--text-primary)'
                  }}
                >
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.color, display: 'inline-block', flexShrink: 0 }} />
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setIsProfileMenuOpen(prev => !prev); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <img
              src={user?.avatar}
              alt={user?.username}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--accent-primary)',
                boxShadow: '0 2px 10px var(--accent-glow)'
              }}
            />
          </button>

          {isProfileMenuOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '50px',
              width: '240px',
              background: 'var(--bg-modal)',
              border: '1px solid var(--border-strong)',
              borderRadius: '16px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              padding: '12px',
              zIndex: 200
            }}>
              <div style={{ paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{user?.username}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                <div className="badge badge-indigo" style={{ marginTop: '6px' }}>
                  <ShieldCheck size={12} /> {user?.plan || 'Unlimited Vault'}
                </div>
              </div>

              <button
                className="btn btn-ghost"
                onClick={() => { setActiveCategory('profile'); setIsProfileMenuOpen(false); }}
                style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.85rem' }}
              >
                <User size={16} />
                <span>Switch / Manage Profile</span>
              </button>

              <button
                className="btn btn-ghost"
                onClick={() => { signOut(); setIsProfileMenuOpen(false); }}
                style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.85rem', color: 'var(--accent-rose)' }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
