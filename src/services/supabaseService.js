// Supabase Service — uses official @supabase/supabase-js client for
// authenticated REST calls and Realtime subscriptions.
// Binary Blobs stay in IndexedDB; this service handles metadata only.

import { supabase } from '../lib/supabaseClient';

// ── File Metadata Sync ────────────────────────────────────────────────────────
export async function syncFileToSupabase(fileRecord) {
  try {
    const { error } = await supabase.from('vault_files').upsert({
      id:         fileRecord.id,
      user_id:    fileRecord.userId,
      folder_id:  fileRecord.folderId  || null,
      name:       fileRecord.name,
      type:       fileRecord.type,
      category:   fileRecord.category,
      size:       fileRecord.size      || 0,
      starred:    fileRecord.starred   || false,
      in_trash:   fileRecord.inTrash   || false,
      created_at: fileRecord.createdAt,
      updated_at: fileRecord.updatedAt,
      tags:       fileRecord.tags      || []
    }, { onConflict: 'id' });

    if (error) console.warn('[Supabase] syncFile error:', error.message);
  } catch (err) {
    console.warn('[Supabase] syncFile exception:', err);
  }
}

// ── Folder Metadata Sync ──────────────────────────────────────────────────────
export async function syncFolderToSupabase(folderRecord) {
  try {
    const { error } = await supabase.from('vault_folders').upsert({
      id:         folderRecord.id,
      user_id:    folderRecord.userId,
      parent_id:  folderRecord.parentId  || null,
      name:       folderRecord.name,
      color:      folderRecord.color,
      starred:    folderRecord.starred   || false,
      in_trash:   folderRecord.inTrash   || false,
      created_at: folderRecord.createdAt,
      updated_at: folderRecord.updatedAt
    }, { onConflict: 'id' });

    if (error) console.warn('[Supabase] syncFolder error:', error.message);
  } catch (err) {
    console.warn('[Supabase] syncFolder exception:', err);
  }
}

// ── Activity Log Sync ─────────────────────────────────────────────────────────
export async function syncActivityLogToSupabase(logRecord) {
  try {
    const { error } = await supabase.from('activity_logs').upsert({
      id:        logRecord.id,
      user_id:   logRecord.userId,
      action:    logRecord.action,
      details:   logRecord.details,
      timestamp: logRecord.timestamp,
      status:    logRecord.status
    }, { onConflict: 'id' });

    if (error) console.warn('[Supabase] syncLog error:', error.message);
  } catch (err) {
    console.warn('[Supabase] syncLog exception:', err);
  }
}

// ── Delete File ───────────────────────────────────────────────────────────────
export async function deleteFileFromSupabase(id) {
  if (!id) return;
  try {
    const { error } = await supabase.from('vault_files').delete().eq('id', id);
    if (error) console.warn('[Supabase] deleteFile error:', error.message);
  } catch (err) {
    console.warn('[Supabase] deleteFile exception:', err);
  }
}

// ── Delete Folder ─────────────────────────────────────────────────────────────
export async function deleteFolderFromSupabase(id) {
  if (!id) return;
  try {
    const { error } = await supabase.from('vault_folders').delete().eq('id', id);
    if (error) console.warn('[Supabase] deleteFolder error:', error.message);
  } catch (err) {
    console.warn('[Supabase] deleteFolder exception:', err);
  }
}

// ── Fetch Files for User ──────────────────────────────────────────────────────
export async function fetchFilesFromSupabase(userId) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('vault_files')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.warn('[Supabase] fetchFiles error:', error.message);
      return [];
    }
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
      id:        item.id,
      userId:    item.user_id,
      folderId:  item.folder_id,
      name:      item.name,
      type:      item.type,
      category:  item.category,
      size:      item.size,
      starred:   !!item.starred,
      inTrash:   !!item.in_trash,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      tags:      Array.isArray(item.tags) ? item.tags : []
    }));
  } catch (err) {
    console.warn('[Supabase] fetchFiles exception:', err);
    return [];
  }
}

// ── Fetch Folders for User ────────────────────────────────────────────────────
export async function fetchFoldersFromSupabase(userId) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('vault_folders')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.warn('[Supabase] fetchFolders error:', error.message);
      return [];
    }
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
      id:        item.id,
      userId:    item.user_id,
      parentId:  item.parent_id,
      name:      item.name,
      color:     item.color,
      starred:   !!item.starred,
      inTrash:   !!item.in_trash,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  } catch (err) {
    console.warn('[Supabase] fetchFolders exception:', err);
    return [];
  }
}

// ── Fetch Activity Logs for User ──────────────────────────────────────────────
export async function fetchActivityLogsFromSupabase(userId) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(200);

    if (error) {
      console.warn('[Supabase] fetchLogs error:', error.message);
      return [];
    }
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
      id:        item.id,
      userId:    item.user_id,
      action:    item.action,
      details:   item.details,
      timestamp: item.timestamp,
      status:    item.status
    }));
  } catch (err) {
    console.warn('[Supabase] fetchLogs exception:', err);
    return [];
  }
}

// ── Realtime Subscription via official @supabase/supabase-js channels ─────────
// Returns an unsubscribe function.
export function subscribeToSupabaseRealtime(userId, onDataChange) {
  if (!userId) return () => {};

  const channel = supabase
    .channel(`vault-realtime-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'vault_files',   filter: `user_id=eq.${userId}` },
      onDataChange
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'vault_folders', filter: `user_id=eq.${userId}` },
      onDataChange
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'activity_logs', filter: `user_id=eq.${userId}` },
      onDataChange
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Supabase Realtime] ✅ Subscribed to vault changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.warn('[Supabase Realtime] ⚠️ Channel error — will retry automatically');
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
