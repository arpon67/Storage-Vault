import React, { useState, useRef } from 'react';
import {
  Music, Play, Pause, Plus, Trash2, Volume2, VolumeX,
  Disc, Sparkles, X, UploadCloud, Radio
} from 'lucide-react';
import { useStorage } from '../context/StorageContext';

import boomShaka from '../assets/music/Boom Shaka - Krsna.mp3';
import coookPardon from '../assets/music/Lvbel-C5-COOOK-PARDON-63.mp3';
import starboy from '../assets/music/starboy_ringtone.mp3';

const DEFAULT_PLAYLIST = [
  { id: '1', title: 'Boom Shaka', artist: 'Krsna (Hindi Popular)', url: boomShaka, genre: 'Hindi Popular' },
  { id: '2', title: 'COOOK PARDON', artist: 'Lvbel C5 (Cook Beat)', url: coookPardon, genre: 'Phonk Beat' },
  { id: '3', title: 'Starboy (Phonk Remix)', artist: 'The Weeknd', url: starboy, genre: 'Phonk' }
];

export function MusicStudioModal({ isOpen, onClose }) {
  const {
    addToast,
    currentMusicTrack,
    isMusicPlaying,
    isMusicMuted,
    setIsMusicMuted,
    isMusicLooping,
    setIsMusicLooping,
    toggleMusicPlay
  } = useStorage();

  const [playlist, setPlaylist] = useState(DEFAULT_PLAYLIST);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const togglePlay = (track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play(), 50);
    }
  };

  const handleCustomAudioUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newTracks = [];
    Array.from(files).forEach((f, i) => {
      const trackUrl = URL.createObjectURL(f);
      newTracks.push({
        id: `custom-${Date.now()}-${i}`,
        title: f.name.replace(/\.[^/.]+$/, ''),
        artist: 'Custom User Song',
        url: trackUrl,
        genre: 'Custom MP3'
      });
    });
    setPlaylist(prev => [...newTracks, ...prev]);
    addToast(`Added ${newTracks.length} custom song(s) to Music Studio!`, 'success');
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 4000 }} onClick={onClose}>
      <div
        className="modal-content glass-panel"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '95vw',
          maxHeight: '90vh',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Disc size={26} color="var(--accent-primary)" style={{ animation: isMusicPlaying ? 'spin 3s linear infinite' : 'none' }} />
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
              Storage Bank Music Studio & Phonk Player
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Listen to curated Hindi, Phonk & custom music sets while managing your vault
            </p>
          </div>
        </div>

        {/* Now Playing Bar */}
        {currentMusicTrack && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
            border: '1px solid var(--accent-primary)', borderRadius: '18px', padding: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Music size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>{currentMusicTrack.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentMusicTrack.artist} • <span style={{ color: 'var(--accent-amber)' }}>{currentMusicTrack.genre}</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setIsMusicLooping(!isMusicLooping)}
                title={isMusicLooping ? 'Infinite Track Loop (Active)' : 'Loop Off'}
                style={{ color: isMusicLooping ? 'var(--accent-amber)' : 'var(--text-muted)' }}
              >
                <Radio size={18} className={isMusicLooping ? 'pulse' : ''} />
              </button>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setIsMusicMuted(!isMusicMuted)}
              >
                {isMusicMuted ? <VolumeX size={18} color="var(--accent-rose)" /> : <Volume2 size={18} />}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => toggleMusicPlay(currentMusicTrack)}
                style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {isMusicPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
            </div>
          </div>
        )}

        {/* Custom Song Upload Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Curated Music Sets & Custom Songs
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{ fontSize: '0.78rem', padding: '6px 12px', borderRadius: '10px', gap: '6px' }}
          >
            <UploadCloud size={14} /> Add Custom Song (MP3)
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCustomAudioUpload}
            accept="audio/*"
            multiple
            style={{ display: 'none' }}
          />
        </div>

        {/* Track List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {playlist.map(track => {
            const isSelected = currentMusicTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => toggleMusicPlay(track)}
                style={{
                  background: isSelected ? 'rgba(99,102,241,0.14)' : 'var(--bg-surface)',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  borderRadius: '14px', padding: '12px 16px', display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                    {isSelected && isMusicPlaying ? <Radio size={18} className="pulse" /> : <Music size={18} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                      {track.title}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {track.artist}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {track.genre}
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isSelected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isSelected && isMusicPlaying ? <Pause size={14} color="#fff" /> : <Play size={14} color={isSelected ? '#fff' : 'var(--text-secondary)'} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
