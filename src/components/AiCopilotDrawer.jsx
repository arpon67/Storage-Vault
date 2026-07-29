import React, { useState, useEffect, useRef } from 'react';
import { useStorage } from '../context/StorageContext';
import { customAiEngine } from '../services/AetherAiEngine';
import {
  Bot,
  Sparkles,
  X,
  Send,
  User,
  Zap,
  HardDrive,
  RefreshCw,
  Lock,
  PieChart,
  HelpCircle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FolderPlus,
  Trash2,
  History,
  RotateCcw
} from 'lucide-react';

export function AiCopilotDrawer({ isOpen, onClose }) {
  const { storageStats, files, folders, setActiveCategory, setIsNewFolderOpen, batchDeletePermanently, setIsAnalyticsOpen, addToast } = useStorage();

  // Persistent Chat History in localStorage
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('aether_ai_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'msg-1',
        sender: 'ai',
        text: 'Hello! I am your custom AetherAI Neural Model. Select any floating action below or type a command — I will always request your permission before taking action!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: null
      }
    ];
  });

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('aether_ai_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, pendingAction]);

  if (!isOpen) return null;

  const handleSend = (textToSend) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      // Execute Neural NLP Engine
      const result = customAiEngine.processUserQuery(query, storageStats, files, folders);
      
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: result.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: result.action
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);

      if (result.action) {
        setPendingAction(result.action);
      }
    }, 500);
  };

  // User Permission Approval Handler
  const handleApproveAction = async (action) => {
    if (!action) return;

    if (action.type === 'NAVIGATE_CONVERTER') {
      setActiveCategory('converter');
      addToast('AetherAI Executed: Opened Format Converter Studio', 'success');
    } else if (action.type === 'CREATE_FOLDER') {
      setIsNewFolderOpen(true);
      addToast('AetherAI Executed: Opened New Folder Creator', 'success');
    } else if (action.type === 'EMPTY_TRASH') {
      const trashedIds = (files || []).filter(f => f.inTrash).map(f => f.id);
      if (trashedIds.length > 0) {
        batchDeletePermanently(trashedIds);
        addToast(`AetherAI Executed: Permanently deleted ${trashedIds.length} trash item(s)`, 'success');
      } else {
        addToast('Trash is already empty.', 'info');
      }
    } else if (action.type === 'SCAN_DUPLICATES') {
      setIsAnalyticsOpen(true);
      addToast('AetherAI Executed: Opened Storage Analytics & Duplicate Scanner', 'success');
    }

    setPendingAction(null);
  };

  const handleDenyAction = () => {
    addToast('AetherAI Action Canceled by User', 'info');
    setPendingAction(null);
  };

  const clearChatHistory = () => {
    const initialMsg = [
      {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: 'Chat history cleared. Select any floating action or command me anytime!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: null
      }
    ];
    setMessages(initialMsg);
    localStorage.removeItem('aether_ai_chat_history');
    setPendingAction(null);
    addToast('AetherAI Chat History Cleared', 'info');
  };

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      bottom: 0,
      width: '100%',
      maxWidth: '440px',
      background: 'var(--bg-modal)',
      borderLeft: '1px solid var(--border-strong)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 2500,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px var(--accent-glow)'
          }}>
            <Bot size={22} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Custom AetherAI Neural Copilot <Sparkles size={14} color="var(--accent-cyan)" />
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: '600' }}>
              ● Persistent History & User Permission Guarded
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button className="btn btn-ghost btn-icon" onClick={clearChatHistory} title="Clear Chat History">
            <History size={16} color="var(--text-muted)" />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Floating AI Quick Action Chips (Grid Layout) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-input)'
      }}>
        <button
          className="btn btn-secondary"
          onClick={() => handleSend('Convert file formats in studio')}
          style={{ padding: '8px 10px', fontSize: '0.75rem', justifyContent: 'flex-start', background: 'var(--bg-surface)' }}
        >
          <RefreshCw size={13} color="var(--accent-cyan)" /> Format Converter Studio
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => handleSend('Clean duplicate files')}
          style={{ padding: '8px 10px', fontSize: '0.75rem', justifyContent: 'flex-start', background: 'var(--bg-surface)' }}
        >
          <Sparkles size={13} color="var(--accent-cyan)" /> Scan Duplicate Files
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => handleSend('Create a new folder')}
          style={{ padding: '8px 10px', fontSize: '0.75rem', justifyContent: 'flex-start', background: 'var(--bg-surface)' }}
        >
          <FolderPlus size={13} color="var(--accent-emerald)" /> Create Vault Folder
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => handleSend('Empty Trash')}
          style={{ padding: '8px 10px', fontSize: '0.75rem', justifyContent: 'flex-start', background: 'var(--bg-surface)' }}
        >
          <Trash2 size={13} color="var(--accent-rose)" /> Empty Trash Bin
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => handleSend('How much storage space am I using?')}
          style={{ padding: '8px 10px', fontSize: '0.75rem', justifyContent: 'flex-start', background: 'var(--bg-surface)', gridColumn: 'span 2' }}
        >
          <HardDrive size={13} color="var(--accent-primary)" /> Generate Live Storage Breakdown
        </button>
      </div>

      {/* Chat Messages Timeline */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              gap: '10px',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%'
            }}
          >
            {msg.sender === 'ai' && (
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                <Bot size={16} color="#ffffff" />
              </div>
            )}

            <div style={{
              background: msg.sender === 'user' ? 'var(--accent-primary)' : 'var(--bg-surface)',
              color: msg.sender === 'user' ? '#ffffff' : 'var(--text-primary)',
              padding: '10px 14px',
              borderRadius: '16px',
              borderTopRightRadius: msg.sender === 'user' ? '4px' : '16px',
              borderTopLeftRadius: msg.sender === 'ai' ? '4px' : '16px',
              border: msg.sender === 'ai' ? '1px solid var(--border-subtle)' : 'none',
              fontSize: '0.86rem',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.text}
              <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '4px', textAlign: 'right' }}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {/* User Permission Approval Card */}
        {pendingAction && (
          <div className="glass-panel" style={{
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            border: '2px solid var(--accent-amber)',
            background: 'rgba(245, 158, 11, 0.12)',
            marginTop: '8px',
            animation: 'slideUp 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '800', color: 'var(--accent-amber)', marginBottom: '4px' }}>
              <ShieldAlert size={16} /> AetherAI Action Permission Required
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {pendingAction.title}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '12px' }}>
              {pendingAction.details}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-primary"
                onClick={() => handleApproveAction(pendingAction)}
                style={{ padding: '6px 12px', fontSize: '0.78rem', flex: 1 }}
              >
                <CheckCircle2 size={14} /> Approve & Execute
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDenyAction}
                style={{ padding: '6px 12px', fontSize: '0.78rem', flex: 1 }}
              >
                <XCircle size={14} /> Deny Action
              </button>
            </div>
          </div>
        )}

        {isTyping && (
          <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} color="#ffffff" />
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              AetherAI Neural Model evaluating intent...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{
          padding: '14px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          display: 'flex',
          gap: '8px'
        }}
      >
        <input
          type="text"
          className="input-text"
          placeholder="Command AetherAI Neural Model..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{ fontSize: '0.88rem' }}
        />
        <button type="submit" className="btn btn-primary btn-icon" disabled={!inputValue.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
