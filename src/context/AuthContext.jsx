import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [theme, setTheme]     = useState('dark');
  const [authLoading, setAuthLoading] = useState(true);

  const applyTheme = (t) => {
    setTheme(t || 'dark');
    document.documentElement.setAttribute('data-theme', t || 'dark');
  };

  const buildUser = (supaUser, prof) => {
    if (!supaUser) return null;
    return {
      id:       supaUser.id,
      email:    supaUser.email,
      username: prof?.username || supaUser.user_metadata?.username || supaUser.email?.split('@')[0] || 'Vault Owner',
      avatar:   prof?.avatar   || supaUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(supaUser.id)}`,
      plan:     prof?.plan     || 'Unlimited Private Vault',
      theme:    prof?.theme    || 'dark',
      pin:      prof?.pin      || null
    };
  };

  const fetchProfile = async (supaUser) => {
    if (!supaUser) return null;
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', supaUser.id).maybeSingle();
      return data;
    } catch { return null; }
  };

  const upsertProfile = async (supaUser, extra = {}) => {
    if (!supaUser) return null;
    const payload = {
      id:       supaUser.id,
      username: extra.username || supaUser.user_metadata?.username || supaUser.email?.split('@')[0],
      avatar:   extra.avatar   || supaUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(supaUser.id)}`,
      plan:     extra.plan     || 'Unlimited Private Vault',
      theme:    extra.theme    || 'dark',
      pin:      extra.pin      || null
    };
    try {
      const { data } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select().maybeSingle();
      return data;
    } catch { return payload; }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user) {
        const prof = await fetchProfile(session.user);
        const u    = buildUser(session.user, prof);
        setProfile(prof); setUser(u); applyTheme(u.theme);
      }
      setAuthLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session?.user) {
        const prof = await fetchProfile(session.user);
        const u    = buildUser(session.user, prof);
        setProfile(prof); setUser(u); applyTheme(u.theme);
      } else {
        setUser(null); setProfile(null);
      }
      setAuthLoading(false);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // ── Auth Actions ──────────────────────────────────────────────────────────
  const signUp = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
    if (error) return { success: false, error: error.message };
    if (data.user) await upsertProfile(data.user, { username });
    return { success: true, user: data.user };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true, user: data.user };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null);
  };

  const changeTheme = async (newTheme) => {
    applyTheme(newTheme);
    if (user) {
      setUser(prev => ({ ...prev, theme: newTheme }));
      await supabase.from('profiles').update({ theme: newTheme }).eq('id', user.id);
    }
  };

  const updatePin = async (pin) => {
    if (!user) return;
    setUser(prev => ({ ...prev, pin }));
    await supabase.from('profiles').update({ pin }).eq('id', user.id);
  };

  // Real-time profile update — instantly reflects everywhere, then persists to Supabase
  const updateUserProfile = async ({ username, avatar }) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      // Optimistic instant update
      setUser(prev => ({
        ...prev,
        ...(username !== undefined && { username }),
        ...(avatar   !== undefined && { avatar })
      }));
      setProfile(prev => ({
        ...prev,
        ...(username !== undefined && { username }),
        ...(avatar   !== undefined && { avatar })
      }));

      // Persist to Supabase auth metadata
      const metaUpdates = {};
      if (username !== undefined) metaUpdates.username   = username;
      if (avatar   !== undefined) metaUpdates.avatar_url = avatar;
      if (Object.keys(metaUpdates).length > 0) {
        await supabase.auth.updateUser({ data: metaUpdates });
      }

      // Persist to profiles table
      const profileUpdates = { id: user.id };
      if (username !== undefined) profileUpdates.username = username;
      if (avatar   !== undefined) profileUpdates.avatar   = avatar;
      await supabase.from('profiles').upsert(profileUpdates, { onConflict: 'id' });

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, profile, theme, authLoading,
      signUp, signIn, signOut, changeTheme, updatePin, updateUserProfile,
      loginUser:    signIn,
      registerUser: (username, email, password = 'changeme123') => signUp(email, password, username),
      logoutUser:   signOut,
      users:        user ? [user] : [],
      switchUser:   () => {}
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
