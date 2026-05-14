'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from '@/components/user-avatar';
import { Loader2, Save, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const LOCAL_USERS_KEY = 'drip_local_users';

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_DATABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_DATABASE_PUBLISHABLE_KEY || '';
  const invalidUrl = !url || url.includes('example.supabase.co');
  const invalidKey = !key || key.includes('demo-anon-key');
  return !invalidUrl && !invalidKey;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut, updateLocalProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const useSupabase = isSupabaseConfigured();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    loadProfile();
  }, [authLoading, user]);

  const loadProfile = async () => {
    if (!user) return;

    if (!useSupabase) {
      setUsername((user.user_metadata?.username as string) || '');
      setBio((user.user_metadata?.bio as string) || '');
      setAvatarUrl((user.user_metadata?.avatar_url as string) || '');
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

      if (data) {
        setUsername(data.username || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non supporte');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 2MB)');
      return;
    }

    setNewAvatar(file);
    const reader = new FileReader();
    reader.onload = (evt) => setAvatarPreview(evt.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!username.trim()) {
      toast.error('Le pseudo est requis');
      return;
    }

    setSaving(true);

    try {
      if (!useSupabase) {
        const normalizedUsername = username.trim().toLowerCase();
        const usersRaw = localStorage.getItem(LOCAL_USERS_KEY);
        const users: Array<{
          id: string;
          username: string;
          email: string;
          password: string;
          bio?: string;
          avatar_url?: string;
        }> = usersRaw ? JSON.parse(usersRaw) : [];
        const finalAvatarUrl = avatarPreview || avatarUrl;

        const taken = users.some(
          (u) => u.id !== user.id && u.username.toLowerCase() === normalizedUsername
        );
        if (taken) {
          throw new Error('Ce pseudo est deja pris.');
        }

        updateLocalProfile({
          username: normalizedUsername,
          bio: bio.trim(),
          avatar_url: finalAvatarUrl,
        });

        toast.success('Profil mis a jour');
        router.replace(`/profile/${normalizedUsername}`);
        return;
      }

      let finalAvatarUrl = avatarUrl;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error('Not authenticated');

      if (newAvatar) {
        const formData = new FormData();
        formData.append('image', newAvatar);

        const uploadRes = await fetch('/api/upload-avatar', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json().catch(() => ({}));
          throw new Error(data?.error || 'Erreur lors de l upload de l avatar');
        }

        const data = await uploadRes.json();
        finalAvatarUrl = data.url;
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          bio: bio.trim(),
          avatar_url: finalAvatarUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Erreur lors de la mise a jour');
      }

      toast.success('Profil mis a jour');
      router.replace(`/profile/${username.trim().toLowerCase()}`);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise a jour');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#FF3B5C] w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.back()} className="p-2 text-[#888] hover:text-white transition-colors">
            x
          </button>
          <h1 className="text-xl font-bold font-[family-name:var(--font-syne)] text-white">Modifier le profil</h1>
          <div className="w-10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              {avatarPreview || avatarUrl ? (
                <Image
                  src={avatarPreview || avatarUrl}
                  alt="Avatar"
                  width={100}
                  height={100}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <UserAvatar username={username || 'U'} size="lg" />
              )}
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#FF3B5C] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#e63552] transition-colors">
                <span className="text-white text-lg">+</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-[#888] mt-2">Photo de profil</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#888] font-medium">Pseudo</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="w-full px-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#FF3B5C] font-[family-name:var(--font-space-grotesk)]"
              placeholder="ton_pseudo"
              minLength={3}
              maxLength={20}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#888] font-medium">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              rows={3}
              className="w-full px-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#FF3B5C] resize-none font-[family-name:var(--font-space-grotesk)]"
              placeholder="Parle-nous de toi..."
            />
            <p className="text-xs text-[#555] text-right">{bio.length}/150</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-[#FF3B5C] text-white font-semibold rounded-xl hover:bg-[#e63552] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-[family-name:var(--font-syne)]"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Enregistrement...
              </>
            ) : (
              <>
                <Save size={20} />
                Enregistrer
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] transition-colors flex items-center justify-center gap-2 font-[family-name:var(--font-space-grotesk)]"
          >
            <LogOut size={18} />
            Se deconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
