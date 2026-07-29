import React, { useState, useEffect, useRef } from 'react';
import { useStorage } from '../context/StorageContext';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Music,
  SkipBack,
  SkipForward,
  Activity
} from 'lucide-react';

export function MediaPlayerBar() {
  const { activeAudioTrack, setActiveAudioTrack } = useStorage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  // Web Audio API Frequency Heights (10 Bands)
  const [freqBars, setFreqBars] = useState([12, 24, 38, 50, 42, 65, 30, 48, 20, 35]);

  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (activeAudioTrack && activeAudioTrack.blob) {
      const url = URL.createObjectURL(activeAudioTrack.blob);
      setAudioUrl(url);
      setIsPlaying(true);
      return () => URL.revokeObjectURL(url);
    }
  }, [activeAudioTrack]);

  // Connect Web Audio API Frequency Analyser Node
  useEffect(() => {
    if (!audioRef.current || !isPlaying) return;

    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
          analyserRef.current = audioCtxRef.current.createAnalyser();
          analyserRef.current.fftSize = 32;

          const source = audioCtxRef.current.createMediaElementSource(audioRef.current);
          source.connect(analyserRef.current);
          analyserRef.current.connect(audioCtxRef.current.destination);
        }
      }

      const updateSpectrum = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);

          const bars = Array.from(dataArray.slice(0, 10)).map(val => Math.max(10, Math.min(100, (val / 255) * 100)));
          setFreqBars(bars);
        } else {
          setFreqBars(prev => prev.map(() => Math.floor(Math.random() * 60 + 20)));
        }
        animFrameRef.current = requestAnimationFrame(updateSpectrum);
      };

      updateSpectrum();
    } catch {
      // Fallback
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  if (!activeAudioTrack) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
    setIsMuted(val === 0);
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '92%',
      maxWidth: '820px',
      background: 'rgba(15, 23, 42, 0.94)',
      backdropFilter: 'blur(24px)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px var(--accent-glow)',
      padding: '12px 20px',
      zIndex: 2200,
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        autoPlay
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Album / Track Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '180px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px var(--accent-glow)'
        }}>
          <Music size={20} color="#ffffff" />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {activeAudioTrack.name}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Playing Audio Vault
          </div>
        </div>
      </div>

      {/* Dynamic 10-Band Frequency Spectrum Visualizer */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '28px', padding: '0 8px' }}>
        {freqBars.map((heightPct, idx) => (
          <div
            key={idx}
            style={{
              width: '4px',
              height: isPlaying ? `${heightPct}%` : '8px',
              background: 'var(--accent-gradient)',
              borderRadius: '4px',
              transition: 'height 0.1s ease'
            }}
          />
        ))}
      </div>

      {/* Main Scrubber Controls */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <button className="btn btn-ghost btn-icon" onClick={togglePlay} style={{ background: 'var(--accent-primary)', color: '#fff' }}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Close */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => { setIsMuted(!isMuted); if (audioRef.current) audioRef.current.muted = !isMuted; }}>
          {isMuted ? <VolumeX size={16} color="var(--accent-rose)" /> : <Volume2 size={16} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          style={{ width: '60px', accentColor: 'var(--accent-primary)' }}
        />
        <button className="btn btn-ghost btn-icon" onClick={() => setActiveAudioTrack(null)}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
