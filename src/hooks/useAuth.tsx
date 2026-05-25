'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateLocalProfile: (profile: { username: string; bio: string; avatar_url: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USERS_KEY = 'drip_local_users';
const LOCAL_CURRENT_USER_KEY = 'drip_local_current_user';
const SESSION_BACKUP_KEY = 'drip_session_backup';

type LocalUser = {
  id: string;
  email: string;
  password: string;
  username: string;
  bio?: string;
  avatar_url?: string;
};

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_DATABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_DATABASE_PUBLISHABLE_KEY || '';
  const invalidUrl = !url || url.includes('example.supabase.co');
  const invalidKey = !key || key.includes('demo-anon-key');
  return !invalidUrl && !invalidKey;
}

function toUser(local: LocalUser): User {
  return {
    id: local.id,
    email: local.email,
    user_metadata: {
      username: local.username,
      bio: local.bio || '',
      avatar_url: local.avatar_url || '',
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function readLocalUsers() {
  const usersRaw = localStorage.getItem(LOCAL_USERS_KEY);
  return usersRaw ? (JSON.parse(usersRaw) as LocalUser[]) : [];
}

function findLocalUser(login: string, password: string) {
  const loginInput = login.trim().toLowerCase();
  return readLocalUsers().find((u) => {
    const emailMatch = u.email.toLowerCase() === loginInput;
    const usernameMatch = u.username.toLowerCase() === loginInput;
    return (emailMatch || usernameMatch) && u.password === password;
  });
}

function saveLocalUser(localUser: LocalUser) {
  const users = readLocalUsers();
  const withoutDuplicate = users.filter(
    (u) =>
      u.id !== localUser.id &&
      u.email.toLowerCase() !== localUser.email.toLowerCase() &&
      u.username.toLowerCase() !== localUser.username.toLowerCase()
  );

  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify([...withoutDuplicate, localUser]));
  localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(localUser));
}

function createLocalAuthUser(email: string, password: string, username: string) {
  const users = readLocalUsers();
  const emailLower = normalizeEmail(email);
  const usernameLower = normalizeUsername(username);

  if (users.some((u) => u.email.toLowerCase() === emailLower)) {
    return { user: null, error: new Error('Cet email est deja utilise.') };
  }

  if (users.some((u) => u.username.toLowerCase() === usernameLower)) {
    return { user: null, error: new Error('Ce pseudo est deja pris.') };
  }

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const created: LocalUser = {
    id,
    email: emailLower,
    password,
    username: usernameLower,
    bio: '',
    avatar_url: '',
  };

  saveLocalUser(created);
  return { user: created, error: null };
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const useSupabase = isSupabaseConfigured();

  useEffect(() => {
    if (!useSupabase) {
      try {
        const raw = localStorage.getItem(LOCAL_CURRENT_USER_KEY);
        if (raw) {
          const localUser = JSON.parse(raw) as LocalUser;
          setUser(toUser(localUser));
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setSession(null);
        setLoading(false);
      }
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user ?? null);
        setLoading(false);
        return;
      }

      // Restore from backup if Supabase client lost the session
      try {
        const backupRaw = sessionStorage.getItem(SESSION_BACKUP_KEY);
        if (backupRaw) {
          const backup = JSON.parse(backupRaw);
          setUser(backup.user ?? null);
          setSession(backup);
          setLoading(false);

          supabase.auth.setSession({
            access_token: backup.access_token,
            refresh_token: backup.refresh_token || '',
          }).then(({ data: { session: restored } }) => {
            if (restored) {
              setSession(restored);
              setUser(restored.user ?? null);
              sessionStorage.removeItem(SESSION_BACKUP_KEY);
            }
          }).catch(() => {});
          return;
        }
      } catch { /* ignore */ }

      setSession(null);
      setUser(null);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [useSupabase]);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      if (!useSupabase) {
        const { user: created, error } = createLocalAuthUser(email, password, username);
        if (error || !created) return { error };
        setUser(toUser(created));
        setSession(null);
        return { error: null };
      }

      const normalizedEmail = normalizeEmail(email);
      const normalizedUsername = normalizeUsername(username);

      const response = await fetchWithTimeout("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password, username: normalizedUsername }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data?.code === "SERVER_SUPABASE_NOT_CONFIGURED") {
          const { user: localUser, error } = createLocalAuthUser(normalizedEmail, password, normalizedUsername);
          if (error || !localUser) return { error };
          setUser(toUser(localUser));
          setSession(null);
          return { error: null };
        }

        return { error: new Error(data?.error || "Erreur lors de l'inscription") };
      }

      return await signIn(normalizedEmail, password);
    } catch (err) {
      const { user: localUser, error } = createLocalAuthUser(email, password, username);
      if (!error && localUser) {
        setUser(toUser(localUser));
        setSession(null);
        return { error: null };
      }
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (!useSupabase) {
        const localUser = findLocalUser(email, password);
        if (localUser) {
          localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(localUser));
          setUser(toUser(localUser));
          setSession(null);
          return { error: null };
        }

        return { error: new Error('Email/pseudo ou mot de passe incorrect.') };
      }

      const normalizedEmail = normalizeEmail(email);
      const response = await fetchWithTimeout("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.session && data.user) {
        setSession(data.session);
        setUser(data.user);

        try {
          sessionStorage.setItem(SESSION_BACKUP_KEY, JSON.stringify(data.session));
        } catch { /* ignore */ }

        void supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }).catch(() => {
          // Server already authenticated the user. Keep the UI session alive
          // even if the mobile browser cannot reach Supabase directly.
        });

        return { error: null };
      }

      if (data?.code === "SUPABASE_NOT_CONFIGURED") {
        const localUser = findLocalUser(email, password);
        if (localUser) {
          localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(localUser));
          setUser(toUser(localUser));
          setSession(null);
          return { error: null };
        }
      }

      const message = String(data?.error || "").toLowerCase();
      if (message.includes("email not confirmed") || message.includes("not confirmed")) {
        return {
          error: new Error(
            "Ton email Supabase n'est pas confirme. Verifie ta boite mail ou ajoute DATABASE_SERVICE_ROLE_KEY dans .env.local pour l'inscription serveur."
          ),
        };
      }

      return { error: new Error(data?.error || "Email/pseudo ou mot de passe incorrect.") };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem(LOCAL_CURRENT_USER_KEY);
    try { sessionStorage.removeItem(SESSION_BACKUP_KEY); } catch { /* ignore */ }
    setUser(null);
    setSession(null);

    if (!useSupabase) {
      return;
    }

    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch {
      // Keep local auth state cleared even if remote sign-out fails.
    }
  };

  const updateLocalProfile = (profile: { username: string; bio: string; avatar_url: string }) => {
    if (useSupabase) return;

    const currentRaw = localStorage.getItem(LOCAL_CURRENT_USER_KEY);
    if (!currentRaw) return;

    const current = JSON.parse(currentRaw) as LocalUser;
    const updatedCurrent: LocalUser = {
      ...current,
      username: profile.username,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
    };

    const usersRaw = localStorage.getItem(LOCAL_USERS_KEY);
    const users: LocalUser[] = usersRaw ? JSON.parse(usersRaw) : [];
    const updatedUsers = users.map((localUser) =>
      localUser.id === updatedCurrent.id ? updatedCurrent : localUser
    );

    localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(updatedCurrent));
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updatedUsers));
    setUser(toUser(updatedCurrent));
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, updateLocalProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
