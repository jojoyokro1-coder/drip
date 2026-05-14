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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
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
        const usersRaw = localStorage.getItem(LOCAL_USERS_KEY);
        const users: LocalUser[] = usersRaw ? JSON.parse(usersRaw) : [];

        const emailLower = email.trim().toLowerCase();
        const usernameLower = username.trim().toLowerCase();

        if (users.some((u) => u.email.toLowerCase() === emailLower)) {
          return { error: new Error('Cet email est deja utilise.') };
        }
        if (users.some((u) => u.username.toLowerCase() === usernameLower)) {
          return { error: new Error('Ce pseudo est deja pris.') };
        }

        const created: LocalUser = {
          id: crypto.randomUUID(),
          email: emailLower,
          password,
          username: usernameLower,
          bio: '',
          avatar_url: '',
        };

        users.push(created);
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
        localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(created));
        setUser(toUser(created));
        setSession(null);
        return { error: null };
      }

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { error: new Error(data?.error || "Erreur lors de l'inscription") };
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        return { error: signInError as Error };
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (!useSupabase) {
        const usersRaw = localStorage.getItem(LOCAL_USERS_KEY);
        const users: LocalUser[] = usersRaw ? JSON.parse(usersRaw) : [];
        const loginInput = email.trim().toLowerCase();
        const found = users.find((u) => {
          const emailMatch = u.email.toLowerCase() === loginInput;
          const usernameMatch = u.username.toLowerCase() === loginInput;
          return (emailMatch || usernameMatch) && u.password === password;
        });

        if (!found) {
          return { error: new Error('Email/pseudo ou mot de passe incorrect.') };
        }

        localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(found));
        setUser(toUser(found));
        setSession(null);
        return { error: null };
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    if (!useSupabase) {
      localStorage.removeItem(LOCAL_CURRENT_USER_KEY);
      setUser(null);
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
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
