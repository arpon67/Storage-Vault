import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StorageProvider, useStorage } from './context/StorageContext';

import { ParticleCanvas } from './components/ParticleCanvas';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Breadcrumbs } from './components/Breadcrumbs';
import { VaultHeroBanner } from './components/VaultHeroBanner';
import { FileGrid } from './components/FileGrid';
import { FileList } from './components/FileList';
import { ConverterStudioPage } from './components/ConverterStudioPage';
import { AuthLandingPage } from './components/AuthLandingPage';
import { ProfilePage } from './components/ProfilePage';

import { UploadModal } from './components/UploadModal';
import { NewFolderModal } from './components/NewFolderModal';
import { FilePreviewModal } from './components/FilePreviewModal';
import { StorageAnalyticsModal } from './components/StorageAnalyticsModal';
import { ShareModal } from './components/ShareModal';
import { AuthModal } from './components/AuthModal';

import { CommandPalette } from './components/CommandPalette';
import { ActivityLogDrawer } from './components/ActivityLogDrawer';
import { MediaPlayerBar } from './components/MediaPlayerBar';
import { BatchActionBar } from './components/BatchActionBar';
import { VaultPasscodeModal } from './components/VaultPasscodeModal';
import { AiCopilotDrawer } from './components/AiCopilotDrawer';

import { ToastContainer } from './components/Toast';
import { UploadProgressBar } from './components/UploadProgressBar';

import { UploadCloud, Command, Loader2 } from 'lucide-react';

function AppContent() {
  const { user, authLoading } = useAuth();
  const { activeCategory, viewMode, uploadFiles } = useStorage();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isWindowDragActive, setIsWindowDragActive] = useState(false);
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false);

  // Show spinner while Supabase restores session from localStorage
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', width: '100vw',
        background: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #030712 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0
      }}>
        <Loader2 size={48} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  // If no user is logged in, show the ultra-premium AuthLandingPage!
  if (!user) {
    return <AuthLandingPage />;
  }

  // Drag and Drop anywhere on the window
  const handleWindowDragOver = (e) => {
    e.preventDefault();
    setIsWindowDragActive(true);
  };

  const handleWindowDragLeave = (e) => {
    if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
      setIsWindowDragActive(false);
    }
  };

  const handleWindowDrop = (e) => {
    e.preventDefault();
    setIsWindowDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      className="app-container"
      onDragOver={handleWindowDragOver}
      onDragLeave={handleWindowDragLeave}
      onDrop={handleWindowDrop}
    >
      {/* Master PIN Passcode Lock Screen Modal */}
      <VaultPasscodeModal />

      {/* Interactive Floating Particle Canvas */}
      <ParticleCanvas />

      {/* Full Window Drop Overlay */}
      {isWindowDragActive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(99, 102, 241, 0.28)',
          backdropFilter: 'blur(16px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '4px dashed var(--accent-primary)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <UploadCloud size={72} color="var(--accent-primary)" className="pulse" />
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginTop: '16px', color: '#ffffff' }}>
            Drop files anywhere to upload instantly
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '6px' }}>
            Your files will be saved directly into your local IndexedDB vault
          </p>
        </div>
      )}

      {/* Left Sidebar */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 400
          }}
        />
      )}

      {/* Main Content Workspace */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Navbar */}
        <Navbar
          onToggleMobileSidebar={() => {
            if (window.innerWidth <= 768) {
              setIsMobileSidebarOpen(prev => !prev);
            } else {
              setIsSidebarCollapsed(prev => !prev);
            }
          }}
          onOpenAiCopilot={() => setIsAiCopilotOpen(true)}
        />

        {/* Scrollable Main Area */}
        <main style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          position: 'relative'
        }}>
          {activeCategory === 'converter' ? (
            <ConverterStudioPage />
          ) : activeCategory === 'profile' ? (
            <ProfilePage />
          ) : (
            <>
              <VaultHeroBanner />
              <Breadcrumbs />
              {viewMode === 'grid' ? <FileGrid /> : <FileList />}
            </>
          )}
        </main>

        {/* Raycast Style Keyboard Shortcut Helper Pill */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          zIndex: 50
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Command size={10} /> <strong>Ctrl+K</strong> Commands
          </span>
          <span>•</span>
          <span><strong>Single-Click</strong> Open</span>
          <span>•</span>
          <span><strong>DB</strong> Local Engine</span>
        </div>
      </div>

      {/* Ultra-Premium Floating Modules & Modals */}
      <CommandPalette />
      <ActivityLogDrawer />
      <MediaPlayerBar />
      <BatchActionBar />
      <AiCopilotDrawer isOpen={isAiCopilotOpen} onClose={() => setIsAiCopilotOpen(false)} />

      {/* Core Modals */}
      <UploadModal />
      <NewFolderModal />
      <FilePreviewModal />
      <StorageAnalyticsModal />
      <ShareModal />
      <AuthModal />
      <ToastContainer />
      <UploadProgressBar />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StorageProvider>
        <AppContent />
      </StorageProvider>
    </AuthProvider>
  );
}
