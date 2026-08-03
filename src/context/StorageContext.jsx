import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  initDB,
  getAllFiles,
  saveFile as dbSaveFile,
  deleteFile as dbDeleteFile,
  getAllFolders,
  saveFolder as dbSaveFolder,
  deleteFolder as dbDeleteFolder,
  logActivityDB,
  getActivityLogsDB
} from '../services/dbService';

import {
  syncFileToSupabase,
  syncFolderToSupabase,
  syncActivityLogToSupabase,
  deleteFileFromSupabase,
  deleteFolderFromSupabase,
  fetchFilesFromSupabase,
  fetchFoldersFromSupabase,
  fetchActivityLogsFromSupabase,
  subscribeToSupabaseRealtime
} from '../services/supabaseService';
import coookPardon from '../assets/music/Lvbel-C5-COOOK-PARDON-63.mp3';

const StorageContext = createContext(null);

export function StorageProvider({ children }) {
  const { user } = useAuth();

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Navigation & View State — persisted in localStorage so refresh keeps the same view
  const [activeCategory, setActiveCategoryRaw] = useState(() => localStorage.getItem('vault_activeCategory') || 'all');
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderPath, setFolderPath] = useState([{ id: null, name: 'My Vault' }]);

  const setActiveCategory = (cat) => {
    localStorage.setItem('vault_activeCategory', cat);
    setActiveCategoryRaw(cat);
  };

  const [viewMode, setViewModeRaw] = useState(() => localStorage.getItem('vault_viewMode') || 'grid');
  const setViewMode = (mode) => {
    localStorage.setItem('vault_viewMode', mode);
    setViewModeRaw(mode);
  };

  // Live Windows PC Desktop Drive Mount State
  const [mountedDrives, setMountedDrives] = useState(() => {
    const saved = localStorage.getItem('storagebank_mounted_drives');
    if (saved) return JSON.parse(saved);
    // Legacy single drive migration if exists
    const legacy = localStorage.getItem('storagebank_windowsDrive');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed.mounted) {
        return [{
          id: 'drive-legacy',
          name: parsed.folderName || 'Windows Vault (Z:)',
          driveLetter: 'Z:',
          syncedFilesCount: parsed.syncedFilesCount || 0,
          syncedBytes: parsed.syncedBytes || 0,
          mountedAt: parsed.lastSyncTime || 'Active',
          status: 'Active Live Sync',
          unlimited: true
        }];
      }
    }
    return [];
  });

  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Instant drive registration — no file picker, BAT script does everything on Windows side
  const registerDrive = (driveName, driveLetter) => {
    const driveRecord = {
      id: `drive-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: driveName,
      driveLetter,
      syncedFilesCount: 0,
      syncedBytes: 0,
      mountedAt: new Date().toLocaleString(),
      status: 'Pending BAT Setup',
      unlimited: true
    };
    setMountedDrives(prev => {
      const next = [driveRecord, ...prev];
      localStorage.setItem('storagebank_mounted_drives', JSON.stringify(next));
      return next;
    });
    addToast(`Drive "${driveName}" (${driveLetter}) registered! Run the downloaded .BAT as Admin.`, 'success');
    logActivity('SYSTEM', `Registered Windows Drive "${driveName}" (${driveLetter})`, 'success');
    return driveRecord;
  };

  // ── Real-Time Bi-Directional Windows Drive Sync Engine ────────────────────────
  const activeDriveHandlesRef = React.useRef(new Map());

  const syncVaultToFolderHandle = async (dirHandle) => {
    try {
      const folderMap = new Map();
      folderMap.set(null, dirHandle);

      for (const fold of folders) {
        if (fold.inTrash) continue;
        try {
          const parentHandle = folderMap.get(fold.parentId || null) || dirHandle;
          const subDirHandle = await parentHandle.getDirectoryHandle(fold.name, { create: true });
          folderMap.set(fold.id, subDirHandle);
        } catch (err) {
          console.warn('Subfolder creation error:', err);
        }
      }

      let syncedCount = 0;
      for (const fileRecord of files) {
        if (fileRecord.inTrash) continue;
        try {
          const targetDir = folderMap.get(fileRecord.folderId || null) || dirHandle;
          const fileHandle = await targetDir.getFileHandle(fileRecord.name, { create: true });
          const writable = await fileHandle.createWritable();

          if (fileRecord.blob) {
            await writable.write(fileRecord.blob);
          } else if (fileRecord.content) {
            await writable.write(new Blob([fileRecord.content], { type: 'text/plain' }));
          } else if (fileRecord.url && fileRecord.url.startsWith('data:')) {
            const res = await fetch(fileRecord.url);
            const blob = await res.blob();
            await writable.write(blob);
          } else {
            await writable.write(new Blob([`Storage Bank Vault File: ${fileRecord.name}`], { type: 'text/plain' }));
          }
          await writable.close();
          syncedCount++;
        } catch (err) {
          console.warn(`File export error for ${fileRecord.name}:`, err);
        }
      }
      return syncedCount;
    } catch (err) {
      console.error('Vault to disk sync failed:', err);
      return 0;
    }
  };

  const syncFolderHandleToVault = async (dirHandle, parentFolderId = null) => {
    try {
      const newFiles = [];
      const scanDir = async (handle, currentParentId) => {
        for await (const entry of handle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            const exists = files.some(f => f.name === file.name && (f.folderId || null) === currentParentId);
            if (!exists) {
              newFiles.push({ file, folderId: currentParentId });
            }
          } else if (entry.kind === 'directory') {
            let matchingFold = folders.find(f => f.name === entry.name && (f.parentId || null) === currentParentId);
            if (!matchingFold) {
              matchingFold = await createFolder(entry.name, currentParentId);
            }
            if (matchingFold) {
              await scanDir(entry, matchingFold.id);
            }
          }
        }
      };
      await scanDir(dirHandle, parentFolderId);

      if (newFiles.length > 0) {
        const fileList = newFiles.map(i => i.file);
        await uploadFiles(fileList);
      }
      return newFiles.length;
    } catch (err) {
      console.error('Disk to vault sync error:', err);
      return 0;
    }
  };

  const connectWindowsFolder = async (customDriveName = null, customDriveLetter = 'Z:') => {
    try {
      if (!('showDirectoryPicker' in window)) {
        addToast('Directory Access supported in Chrome, Edge & Brave on Windows!', 'warning');
        return null;
      }
      addToast('Select or create the local folder to connect as Virtual Drive...', 'info');
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });

      // 1. Sync any existing disk files into vault
      const importedCount = await syncFolderHandleToVault(dirHandle);

      // 2. Export all vault files & subfolders to disk so drive contains ALL vault items!
      const exportedCount = await syncVaultToFolderHandle(dirHandle);

      const driveName = customDriveName || dirHandle.name || `Storage Bank (${customDriveLetter})`;
      const driveRecord = {
        id: `drive-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: driveName,
        driveLetter: customDriveLetter || 'Z:',
        syncedFilesCount: files.length + importedCount,
        syncedBytes: files.reduce((acc, f) => acc + (f.size || 0), 0),
        mountedAt: new Date().toLocaleString(),
        status: 'Real-Time Connected Sync',
        unlimited: true,
        folderName: dirHandle.name
      };

      activeDriveHandlesRef.current.set(driveRecord.id, dirHandle);

      setMountedDrives(prev => {
        const next = [driveRecord, ...prev];
        localStorage.setItem('storagebank_mounted_drives', JSON.stringify(next));
        return next;
      });

      addToast(`Connected Drive ${customDriveLetter}! Exported ${exportedCount} vault file(s) to Windows folder.`, 'success');
      logActivity('SYSTEM', `Connected Windows Drive "${driveName}" (${customDriveLetter}) with bi-directional vault sync`, 'success');

      return { dirHandle, driveRecord, exportedCount };
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        addToast('Failed to connect Windows folder.', 'error');
      }
      return null;
    }
  };

  const unmountDrive = (driveId) => {
    setMountedDrives(prev => {
      const next = prev.filter(d => d.id !== driveId);
      localStorage.setItem('storagebank_mounted_drives', JSON.stringify(next));
      return next;
    });
    addToast('Unmounted and removed active device from vault sync.', 'info');
  };

  const disconnectWindowsFolder = () => {
    setMountedDrives([]);
    localStorage.removeItem('storagebank_mounted_drives');
    localStorage.removeItem('storagebank_windowsDrive');
    addToast('Unmounted all active Windows Virtual Drives.', 'info');
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedItems, setSelectedItems] = useState([]);

  // Modals & Overlays State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [activePreview, setActivePreview] = useState(null);
  const [activeShare, setActiveShare] = useState(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isMusicStudioOpen, setIsMusicStudioOpen] = useState(false);
  const [activeAudioTrack, setActiveAudioTrack] = useState(null);
  const [moveModalTarget, setMoveModalTarget] = useState(null);

  // Site-Wide Background Music State
  const [currentMusicTrack, setCurrentMusicTrack] = useState(() => {
    const saved = localStorage.getItem('storagebank_music_track');
    return saved ? JSON.parse(saved) : { id: '2', title: 'COOOK PARDON', artist: 'Lvbel C5 (Cook Beat)', url: coookPardon, genre: 'Phonk Beat' };
  });
  const [isMusicPlaying, setIsMusicPlayingRaw] = useState(() => {
    const saved = localStorage.getItem('storagebank_music_playing');
    return saved === null ? true : saved === 'true';
  });

  const setIsMusicPlaying = (valOrFn) => {
    setIsMusicPlayingRaw(prev => {
      const nextVal = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      localStorage.setItem('storagebank_music_playing', nextVal ? 'true' : 'false');
      return nextVal;
    });
  };

  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isMusicLooping, setIsMusicLooping] = useState(true);

  const toggleMusicPlay = (track = null) => {
    if (track) {
      if (currentMusicTrack?.id === track.id) {
        setIsMusicPlaying(prev => !prev);
      } else {
        setCurrentMusicTrack(track);
        localStorage.setItem('storagebank_music_track', JSON.stringify(track));
        setIsMusicPlaying(true);
      }
    } else {
      setIsMusicPlaying(prev => !prev);
    }
  };

  // Toast Notifications State
  const [toasts, setToasts] = useState([]);

  // Upload Progress Engine State
  const [uploadProgress, setUploadProgress] = useState({
    active: false,
    fileName: '',
    fileIndex: 0,
    totalFiles: 0,
    loadedBytes: 0,
    totalBytes: 0,
    percentage: 0
  });

  const addToast = (message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Load User Specific Storage from IndexedDB + Realtime Cloud Sync
  const reloadVault = async () => {
    if (!user) return;
    try {
      await initDB();
      // 1. Fast local load from IDB for instant UI
      const [allF, allFold, logs] = await Promise.all([
        getAllFiles(),
        getAllFolders(),
        getActivityLogsDB()
      ]);

      const localFiles = allF.filter(f => !f.userId || f.userId === user.id);
      const localFolders = allFold.filter(f => !f.userId || f.userId === user.id);
      const localLogs = logs.filter(l => !l.userId || l.userId === user.id);

      setFiles(localFiles);
      setFolders(localFolders);
      setActivityLogs(localLogs);
      setLoading(false);

      // 2. Background Cloud Sync from Supabase
      const [remoteFiles, remoteFolders, remoteLogs] = await Promise.all([
        fetchFilesFromSupabase(user.id),
        fetchFoldersFromSupabase(user.id),
        fetchActivityLogsFromSupabase(user.id)
      ]);

      if (remoteFiles.length > 0 || remoteFolders.length > 0 || remoteLogs.length > 0) {
        // Merge files
        const fileMap = new Map();
        localFiles.forEach(f => fileMap.set(f.id, f));
        remoteFiles.forEach(rf => {
          const existing = fileMap.get(rf.id);
          const merged = { ...rf, blob: existing?.blob || rf.blob || null };
          fileMap.set(rf.id, merged);
          dbSaveFile(merged);
        });

        // Merge folders
        const folderMap = new Map();
        localFolders.forEach(f => folderMap.set(f.id, f));
        remoteFolders.forEach(rf => {
          folderMap.set(rf.id, rf);
          dbSaveFolder(rf);
        });

        // Merge logs
        const logMap = new Map();
        localLogs.forEach(l => logMap.set(l.id, l));
        remoteLogs.forEach(rl => {
          logMap.set(rl.id, rl);
          logActivityDB(rl);
        });

        setFiles(Array.from(fileMap.values()));
        setFolders(Array.from(folderMap.values()));
        setActivityLogs(Array.from(logMap.values()));
      }
    } catch (err) {
      console.error('[Vault] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      // User signed out — clear all state immediately
      setFiles([]);
      setFolders([]);
      setActivityLogs([]);
      setLoading(false);
      return;
    }

    reloadVault();

    // Debounce: avoid hammering IDB on rapid realtime bursts
    let debounceTimer = null;
    const debouncedReload = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => reloadVault(), 300);
    };

    const unsubscribe = subscribeToSupabaseRealtime(user.id, () => {
      debouncedReload();
    });

    return () => {
      clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, [user?.id]);

  // Log User Activity to IndexedDB & Supabase
  const logActivity = async (action, details, status = 'success') => {
    if (!user) return;
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: user.id,
      action,
      details,
      timestamp: new Date().toISOString(),
      status
    };
    await logActivityDB(entry);
    await syncActivityLogToSupabase(entry);
    setActivityLogs(prev => [entry, ...prev]);
  };

  // File Upload Handler — Zero-RAM Blob Streaming + Batch Non-Blocking Upload Engine
  const uploadFiles = async (fileList, targetFolderId = currentFolderId, onProgress) => {
    if (!user || !fileList || fileList.length === 0) return;

    const newFiles = Array.from(fileList);
    const totalFiles = newFiles.length;
    let totalBytes = 0;

    for (let i = 0; i < totalFiles; i++) {
      const f = newFiles[i];
      totalBytes += f.size || f.blob?.size || 0;
    }

    const addedRecords = [];
    let loadedBytes = 0;

    setUploadProgress({
      active: true,
      fileName: newFiles[0]?.name || 'Preparing upload...',
      fileIndex: 1,
      totalFiles,
      loadedBytes: 0,
      totalBytes,
      percentage: 0
    });

    const BATCH_SIZE = 15; // Process in non-blocking batches of 15

    for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
      const chunk = newFiles.slice(i, i + BATCH_SIZE);
      const batchRecords = [];

      for (let j = 0; j < chunk.length; j++) {
        const f = chunk[j];
        const idx = i + j;

        // Zero-RAM extraction: pass File/Blob directly without memory buffering!
        let extractedBlob = null;
        if (f instanceof Blob) {
          extractedBlob = f;
        } else if (f && f.blob instanceof Blob) {
          extractedBlob = f.blob;
        } else if (f && f.content) {
          extractedBlob = new Blob([f.content], { type: f.type || 'text/plain' });
        }

        const fileName = f.name || 'Untitled_File';
        const fileType = f.type || extractedBlob?.type || 'application/octet-stream';
        const fileSize = f.size || extractedBlob?.size || 0;
        const category = f.category || getCategoryFromMime(fileType, fileName);
        const now = new Date().toISOString();
        const uniqueId = f.id || `file-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`;

        const fileRecord = {
          id: uniqueId,
          userId: user.id,
          folderId: targetFolderId,
          name: fileName,
          type: fileType,
          category,
          size: fileSize,
          blob: extractedBlob,
          starred: !!f.starred,
          inTrash: !!f.inTrash,
          createdAt: f.createdAt || now,
          updatedAt: now,
          tags: f.tags || [category]
        };

        batchRecords.push(fileRecord);
        addedRecords.push(fileRecord);
        loadedBytes += fileSize;
      }

      // Optimistic UI state update in bulk
      setFiles(prev => [...batchRecords, ...prev]);

      // Save chunk to IDB concurrently
      await Promise.all(batchRecords.map(r => dbSaveFile(r)));

      // Update progress bar state
      const currentFileName = chunk[chunk.length - 1]?.name || 'Uploading...';
      const percentage = totalBytes > 0 ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100)) : 100;
      const progObj = {
        active: true,
        fileName: currentFileName,
        fileIndex: Math.min(i + BATCH_SIZE, totalFiles),
        totalFiles,
        loadedBytes,
        totalBytes,
        percentage
      };
      setUploadProgress(progObj);
      if (onProgress) onProgress(progObj);

      // Non-blocking tick to let UI thread render smoothly at 60 FPS
      await new Promise(r => setTimeout(r, 0));
    }

    // Supabase sync in background queue
    addedRecords.forEach(r => syncFileToSupabase(r));

    addToast(`Stored ${addedRecords.length} file(s) in Storage Bank!`, 'success');
    logActivity('UPLOAD', `Uploaded ${addedRecords.length} file(s)`, 'success');

    setTimeout(() => {
      setUploadProgress(prev => ({ ...prev, active: false }));
    }, 600);
  };


  const getCategoryFromMime = (mime, name) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
    if (mime.startsWith('video/') || ['mp4', 'webm', 'mkv', 'mov', 'avi'].includes(ext)) return 'video';
    if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext)) return 'audio';
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'csv', 'xlsx', 'pptx'].includes(ext)) return 'document';
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'cpp', 'c', 'php', 'sql', 'sh', 'md'].includes(ext)) return 'code';
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return 'archive';
    return 'document';
  };

  // Folder Operations
  const createFolder = async (name, color = '#6366f1') => {
    if (!user || !name.trim()) return;
    const now = new Date().toISOString();
    const folderRecord = {
      id: `fold-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId: user.id,
      parentId: currentFolderId,
      name: name.trim(),
      color,
      starred: false,
      inTrash: false,
      createdAt: now,
      updatedAt: now
    };
    setFolders(prev => [folderRecord, ...prev]);
    await dbSaveFolder(folderRecord);
    syncFolderToSupabase(folderRecord);
    addToast(`Created folder "${name}"`, 'success');
    logActivity('CREATE_FOLDER', `Created folder "${name}"`, 'success');
  };

  const saveFile = async (fileObj) => {
    setFiles(prev => {
      const idx = prev.findIndex(f => f.id === fileObj.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = fileObj; return next; }
      return [fileObj, ...prev];
    });
    if (activePreview && activePreview.id === fileObj.id) {
      setActivePreview(fileObj);
    }
    await dbSaveFile(fileObj);
    syncFileToSupabase(fileObj);
  };

  // Replace original — keeps same file ID, overwrites blob + metadata in IDB and Supabase
  const replaceFile = async (originalId, newBlob, extraMeta = {}) => {
    const now = new Date().toISOString();
    let updated;
    setFiles(prev => prev.map(f => {
      if (f.id !== originalId) return f;
      updated = { ...f, ...extraMeta, blob: newBlob, size: newBlob?.size ?? f.size, updatedAt: now };
      return updated;
    }));
    if (updated) {
      if (activePreview && activePreview.id === originalId) {
        setActivePreview(updated);
      }
      await dbSaveFile(updated);
      syncFileToSupabase(updated);
    }
    return updated;
  };


  const toggleStar = async (id, isFolder) => {
    const now = new Date().toISOString();
    if (isFolder) {
      let updated;
      setFolders(prev => prev.map(f => {
        if (f.id !== id) return f;
        updated = { ...f, starred: !f.starred, updatedAt: now };
        return updated;
      }));
      if (updated) { await dbSaveFolder(updated); syncFolderToSupabase(updated); }
    } else {
      let updated;
      setFiles(prev => prev.map(f => {
        if (f.id !== id) return f;
        updated = { ...f, starred: !f.starred, updatedAt: now };
        return updated;
      }));
      if (updated) { await dbSaveFile(updated); syncFileToSupabase(updated); }
    }
  };

  const moveToTrash = async (id, isFolder) => {
    const now = new Date().toISOString();
    if (isFolder) {
      let updated;
      setFolders(prev => prev.map(f => {
        if (f.id !== id) return f;
        updated = { ...f, inTrash: true, updatedAt: now };
        return updated;
      }));
      if (updated) { await dbSaveFolder(updated); syncFolderToSupabase(updated); }
    } else {
      let updated;
      setFiles(prev => prev.map(f => {
        if (f.id !== id) return f;
        updated = { ...f, inTrash: true, updatedAt: now };
        return updated;
      }));
      if (updated) { await dbSaveFile(updated); syncFileToSupabase(updated); }
    }
    addToast('Moved item to Trash', 'info');
  };

  const restoreFromTrash = async (id, isFolder) => {
    const now = new Date().toISOString();
    if (isFolder) {
      let updated;
      setFolders(prev => prev.map(f => {
        if (f.id !== id) return f;
        updated = { ...f, inTrash: false, updatedAt: now };
        return updated;
      }));
      if (updated) { await dbSaveFolder(updated); syncFolderToSupabase(updated); }
    } else {
      let updated;
      setFiles(prev => prev.map(f => {
        if (f.id !== id) return f;
        updated = { ...f, inTrash: false, updatedAt: now };
        return updated;
      }));
      if (updated) { await dbSaveFile(updated); syncFileToSupabase(updated); }
    }
    addToast('Restored item from Trash', 'success');
  };

  const deletePermanently = async (id, isFolder) => {
    if (isFolder) {
      setFolders(prev => prev.filter(f => f.id !== id));
      await dbDeleteFolder(id);
      deleteFolderFromSupabase(id);
    } else {
      setFiles(prev => prev.filter(f => f.id !== id));
      await dbDeleteFile(id);
      deleteFileFromSupabase(id);
    }
    addToast('Item permanently deleted', 'info');
  };

  const renameItem = async (id, isFolder, newName) => {
    if (!newName.trim()) return;
    const now = new Date().toISOString();
    if (isFolder) {
      let updated;
      setFolders(prev => prev.map(f => {
        if (f.id !== id) return f;
        updated = { ...f, name: newName.trim(), updatedAt: now };
        return updated;
      }));
      if (updated) { await dbSaveFolder(updated); syncFolderToSupabase(updated); }
    } else {
      let updated;
      setFiles(prev => prev.map(f => {
        if (f.id !== id) return f;
        updated = { ...f, name: newName.trim(), updatedAt: now };
        return updated;
      }));
      if (updated) { await dbSaveFile(updated); syncFileToSupabase(updated); }
    }
    addToast('Item renamed', 'success');
  };

  const navigateToFolder = (folderId, folderName = 'Folder') => {
    setActiveCategory('all');
    setSearchQuery('');
    setCurrentFolderId(folderId);

    if (!folderId) {
      setFolderPath([{ id: null, name: 'My Vault' }]);
      return;
    }

    // Reconstruct exact root-to-folder hierarchy path
    const path = [];
    let currId = folderId;
    const visited = new Set();

    while (currId && !visited.has(String(currId))) {
      visited.add(String(currId));
      const targetFold = folders.find(f => String(f.id) === String(currId));
      if (targetFold) {
        path.unshift({ id: targetFold.id, name: targetFold.name });
        currId = targetFold.parentId;
      } else {
        path.unshift({ id: folderId, name: folderName });
        break;
      }
    }

    setFolderPath([{ id: null, name: 'My Vault' }, ...path]);
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const clearSelection = () => setSelectedItems([]);

  // SUB-SECOND FAST PARALLEL BATCH OPERATIONS
  const batchMoveToTrash = async () => {
    const selected = [...selectedItems];
    setFolders(prev => prev.map(f => selected.includes(f.id) ? { ...f, inTrash: true } : f));
    setFiles(prev => prev.map(f => selected.includes(f.id) ? { ...f, inTrash: true } : f));
    clearSelection();

    await Promise.all(selected.map(id => {
      const targetFold = folders.find(f => f.id === id);
      if (targetFold) {
        const updated = { ...targetFold, inTrash: true };
        return Promise.all([dbSaveFolder(updated), syncFolderToSupabase(updated)]);
      }
      const targetFile = files.find(f => f.id === id);
      if (targetFile) {
        const updated = { ...targetFile, inTrash: true };
        return Promise.all([dbSaveFile(updated), syncFileToSupabase(updated)]);
      }
      return Promise.resolve();
    }));

    addToast(`Moved ${selected.length} item(s) to Trash`, 'info');
  };

  const batchRestoreFromTrash = async () => {
    const selected = [...selectedItems];
    setFolders(prev => prev.map(f => selected.includes(f.id) ? { ...f, inTrash: false } : f));
    setFiles(prev => prev.map(f => selected.includes(f.id) ? { ...f, inTrash: false } : f));
    clearSelection();

    await Promise.all(selected.map(id => {
      const targetFold = folders.find(f => f.id === id);
      if (targetFold) {
        const updated = { ...targetFold, inTrash: false };
        return Promise.all([dbSaveFolder(updated), syncFolderToSupabase(updated)]);
      }
      const targetFile = files.find(f => f.id === id);
      if (targetFile) {
        const updated = { ...targetFile, inTrash: false };
        return Promise.all([dbSaveFile(updated), syncFileToSupabase(updated)]);
      }
      return Promise.resolve();
    }));

    addToast(`Restored ${selected.length} item(s) from Trash`, 'success');
  };

  const batchDeletePermanently = async () => {
    const selected = [...selectedItems];
    setFolders(prev => prev.filter(f => !selected.includes(f.id)));
    setFiles(prev => prev.filter(f => !selected.includes(f.id)));
    clearSelection();

    await Promise.all(selected.map(id => {
      const isFold = folders.some(f => f.id === id);
      if (isFold) {
        return Promise.all([dbDeleteFolder(id), deleteFolderFromSupabase(id)]);
      } else {
        return Promise.all([dbDeleteFile(id), deleteFileFromSupabase(id)]);
      }
    }));

    addToast(`Permanently deleted ${selected.length} item(s)`, 'info');
  };

  // ZIP Selected Files Engine
  const zipSelectedFiles = async (customZipName = null) => {
    const selected = selectedItems.length > 0 ? selectedItems : displayedFiles.map(f => f.id);
    const targetFiles = files.filter(f => selected.includes(f.id) && f.blob);

    if (targetFiles.length === 0) {
      addToast('No valid files selected to zip.', 'warning');
      return;
    }

    addToast(`Compressing ${targetFiles.length} file(s) into ZIP archive...`, 'info');
    try {
      const JSZipModule = (await import('jszip')).default;
      const zip = new JSZipModule();

      targetFiles.forEach(f => {
        zip.file(f.name, f.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFileName = customZipName || `Vault_Archive_${Date.now()}.zip`;

      const newZipRecord = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        userId: user.id,
        folderId: currentFolderId,
        name: zipFileName,
        type: 'application/zip',
        category: 'archive',
        size: zipBlob.size,
        blob: zipBlob,
        starred: false,
        inTrash: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['archive', 'zip']
      };

      await saveFile(newZipRecord);
      clearSelection();
      addToast(`Created ZIP Archive "${zipFileName}"`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to create ZIP archive.', 'error');
    }
  };

  // UNZIP Archive File Engine
  const unzipFile = async (zipFileRecord) => {
    if (!zipFileRecord || !zipFileRecord.blob) {
      addToast('Invalid ZIP file.', 'error');
      return;
    }

    try {
      addToast(`Extracting "${zipFileRecord.name}"...`, 'info');
      const JSZipModule = (await import('jszip')).default;
      const zip = new JSZipModule();
      const content = await zip.loadAsync(zipFileRecord.blob);
      const extractedFiles = [];

      for (const [filename, fileObj] of Object.entries(content.files)) {
        if (!fileObj.dir) {
          const blob = await fileObj.async('blob');
          const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();

          let category = 'document';
          if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) category = 'image';
          else if (['.mp4', '.webm', '.mov', '.mkv'].includes(ext)) category = 'video';
          else if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) category = 'audio';
          else if (['.js', '.py', '.html', '.css', '.json', '.jsx'].includes(ext)) category = 'code';

          const newFile = {
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            userId: user.id,
            folderId: currentFolderId,
            name: filename.split('/').pop() || filename,
            type: blob.type || 'application/octet-stream',
            category,
            size: blob.size,
            blob,
            starred: false,
            inTrash: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: ['unzipped']
          };

          await saveFile(newFile);
          extractedFiles.push(newFile);
        }
      }

      addToast(`Unzipped ${extractedFiles.length} file(s) into vault!`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to unzip archive file.', 'error');
    }
  };

  // Move Selected Items to Target Folder
  const moveItemsToFolder = async (itemIds, targetFolderId) => {
    const ids = Array.isArray(itemIds) ? itemIds : [itemIds];
    const now = new Date().toISOString();

    setFiles(prev => prev.map(f => ids.includes(f.id) ? { ...f, folderId: targetFolderId, updatedAt: now } : f));
    setFolders(prev => prev.map(f => ids.includes(f.id) ? { ...f, parentId: targetFolderId, updatedAt: now } : f));

    await Promise.all(ids.map(id => {
      const targetFile = files.find(f => f.id === id);
      if (targetFile) {
        const updated = { ...targetFile, folderId: targetFolderId, updatedAt: now };
        return Promise.all([dbSaveFile(updated), syncFileToSupabase(updated)]);
      }
      const targetFolder = folders.find(f => f.id === id);
      if (targetFolder) {
        const updated = { ...targetFolder, parentId: targetFolderId, updatedAt: now };
        return Promise.all([dbSaveFolder(updated), syncFolderToSupabase(updated)]);
      }
      return Promise.resolve();
    }));

    clearSelection();
    addToast(`Moved ${ids.length} item(s) to folder!`, 'success');
  };

  const displayedFolders = useMemo(() => {
    const normCurrent = currentFolderId ? String(currentFolderId) : null;
    return folders.filter(folder => {
      if (activeCategory === 'trash') return folder.inTrash;
      if (folder.inTrash) return false;
      if (activeCategory === 'starred') return folder.starred;
      if (activeCategory === 'edited') return false; // Show files only in Edited Vault

      if (searchQuery.trim()) {
        return folder.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      const normParent = folder.parentId ? String(folder.parentId) : null;
      return normParent === normCurrent;
    });
  }, [folders, activeCategory, currentFolderId, searchQuery]);

  const displayedFiles = useMemo(() => {
    const normCurrent = currentFolderId ? String(currentFolderId) : null;
    let result = files.filter(file => {
      if (activeCategory === 'trash') return file.inTrash;
      if (file.inTrash) return false;
      if (activeCategory === 'starred') return file.starred;

      if (activeCategory === 'edited') {
        return file.tags?.includes('edited') || file.name.includes('_edited') || file.category === 'edited';
      }

      // Category filters (photos, docs, audio, video, code, archive) show ALL matching files across all folders
      if (['image', 'document', 'video', 'audio', 'code', 'archive'].includes(activeCategory)) {
        return file.category === activeCategory;
      }

      if (searchQuery.trim()) {
        return file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      }

      const normFolder = file.folderId ? String(file.folderId) : null;
      return normFolder === normCurrent;
    });

    result.sort((a, b) => {
      let compA = a[sortBy] || '';
      let compB = b[sortBy] || '';
      if (sortBy === 'date') {
        compA = new Date(a.createdAt).getTime();
        compB = new Date(b.createdAt).getTime();
      }
      if (compA < compB) return sortOrder === 'asc' ? -1 : 1;
      if (compA > compB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [files, activeCategory, currentFolderId, searchQuery, sortBy, sortOrder]);

  const selectAllDisplayedItems = () => {
    const allPageIds = [
      ...displayedFolders.map(f => f.id),
      ...displayedFiles.map(f => f.id)
    ];

    if (allPageIds.length === 0) {
      setSelectedItems([]);
      return;
    }

    const isAllSelected = allPageIds.length <= selectedItems.length && allPageIds.every(id => selectedItems.includes(id));

    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allPageIds);
    }
  };

  const storageStats = useMemo(() => {
    const activeFiles = files.filter(f => !f.inTrash);
    let totalBytes = 0;
    const categories = {
      image: { count: 0, bytes: 0, label: 'Photos & Images', color: '#06b6d4' },
      document: { count: 0, bytes: 0, label: 'Documents & PDFs', color: '#3b82f6' },
      video: { count: 0, bytes: 0, label: 'Videos & Media', color: '#8b5cf6' },
      audio: { count: 0, bytes: 0, label: 'Audio Tracks', color: '#ec4899' },
      code: { count: 0, bytes: 0, label: 'Code & Scripts', color: '#10b981' },
      archive: { count: 0, bytes: 0, label: 'Zip Archives', color: '#f59e0b' },
      other: { count: 0, bytes: 0, label: 'Other Files', color: '#64748b' }
    };

    activeFiles.forEach(f => {
      const sz = f.size || 0;
      totalBytes += sz;
      const catKey = categories[f.category] ? f.category : 'other';
      categories[catKey].count += 1;
      categories[catKey].bytes += sz;
    });

    return {
      totalFiles: activeFiles.length,
      totalBytes,
      categories
    };
  }, [files]);

  return (
    <StorageContext.Provider value={{
      files,
      folders,
      activityLogs,
      loading,
      activeCategory,
      setActiveCategory,
      currentFolderId,
      folderPath,
      viewMode,
      setViewMode,
      searchQuery,
      setSearchQuery,
      sortBy,
      setSortBy,
      sortOrder,
      setSortOrder,
      selectedItems,
      toggleSelectItem,
      selectAllDisplayedItems,
      clearSelection,
      batchMoveToTrash,
      batchRestoreFromTrash,
      batchDeletePermanently,
      zipSelectedFiles,
      unzipFile,
      moveItemsToFolder,
      moveModalTarget,
      setMoveModalTarget,
      displayedFolders,
      displayedFiles,
      storageStats,
      isUploadOpen,
      setIsUploadOpen,
      isNewFolderOpen,
      setIsNewFolderOpen,
      activePreview,
      setActivePreview,
      activeShare,
      setActiveShare,
      isAnalyticsOpen,
      setIsAnalyticsOpen,
      isAuthModalOpen,
      setIsAuthModalOpen,
      isCommandPaletteOpen,
      setIsCommandPaletteOpen,
      isActivityLogOpen,
      setIsActivityLogOpen,
      isSubscriptionOpen,
      setIsSubscriptionOpen,
      isMusicStudioOpen,
      setIsMusicStudioOpen,
      currentMusicTrack,
      setCurrentMusicTrack,
      isMusicPlaying,
      setIsMusicPlaying,
      isMusicMuted,
      setIsMusicMuted,
      isMusicLooping,
      setIsMusicLooping,
      toggleMusicPlay,
      activeAudioTrack,
      setActiveAudioTrack,
      toasts,
      uploadProgress,
      addToast,
      removeToast,
      uploadFiles,
      createFolder,
      saveFile,
      replaceFile,
      toggleStar,
      moveToTrash,
      restoreFromTrash,
      deletePermanently,
      renameItem,
      mountedDrives,
      unmountDrive,
      registerDrive,
      isDriveModalOpen,
      setIsDriveModalOpen,
      connectWindowsFolder,
      disconnectWindowsFolder,
      logActivity,
      reloadVault
    }}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (!context) throw new Error('useStorage must be used within StorageProvider');
  return context;
}
