'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from '@/components/user-avatar';
import { FollowButton } from '@/components/follow-button';
import { LookCard } from '@/components/look-card';
import { Edit3, Loader2, PlusCircle, Zap, Grid3X3, Heart, Bookmark } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadActionSheet } from '@/components/upload-action-sheet';
import { Profile, Look } from '@/types';
import { useRouter } from 'next/navigation';
import { getLocalFollowersCount, getLocalFollowingCount } from '@/lib/local-follows';
import { getLocalSavedLooks, getLocalSavesData } from '@/lib/local-saves';

interface ProfileWithStats extends Profile {
  looks_count: number;
  followers_count: number;
  following_count: number;
  total_likes: number;
}

interface LookWithProfile extends Omit<Look, 'profile'> {
  profile?: { username: string; avatar_url: string };
}

function ProfileSkeleton() {
  return (
    <div style={{ minHeight: '100dvh', background: '#050508', paddingBottom: '90px', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* Banner */}
      <div style={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,59,92,0.1) 0%, rgba(120,40,200,0.08) 50%, rgba(5,5,8,1) 100%)' }} />
        {/* Mock Logo */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', background: 'rgba(255,59,92,0.15)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} color="#FF3B5C" style={{ opacity: 0.5 }} />
          </div>
          <span style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: '20px', fontWeight: 800, color: 'rgba(255,255,255,0.2)' }}>DRIP</span>
        </div>
      </div>

      {/* Avatar + Action */}
      <div style={{ padding: '0 16px', marginTop: '-48px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
          {/* Circular avatar placeholder */}
          <div style={{ width: '88px', height: '88px', borderRadius: '50%', border: '3px solid #050508', overflow: 'hidden' }}>
            <Skeleton className="w-full h-full rounded-full bg-muted/20" />
          </div>
          {/* Action button placeholder */}
          <div style={{ marginBottom: '8px' }}>
            <Skeleton className="w-[90px] h-[34px] rounded-[20px] bg-muted/20" />
          </div>
        </div>

        {/* Username + Bio */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Skeleton className="w-[130px] h-[22px] bg-muted/20" />
            <div style={{ background: 'rgba(255,59,92,0.1)', borderRadius: '5px', width: '38px', height: '15px' }} />
          </div>
          <Skeleton className="w-[80%] h-[14px] bg-muted/20 mb-2" />
          <Skeleton className="w-[50%] h-[14px] bg-muted/20" />
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '14px' }}>
              <Skeleton className="w-[30px] h-[20px] bg-muted/20 mx-auto mb-2" />
              <Skeleton className="w-[45px] h-[10px] bg-muted/20 mx-auto" />
            </div>
          ))}
        </div>

        {/* Section title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Skeleton className="w-[100px] h-[14px] bg-muted/20" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', padding: '0 2px' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ aspectRatio: '1 / 1', position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
            <Skeleton className="w-full h-full bg-muted/20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_DATABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_DATABASE_PUBLISHABLE_KEY || '';
  return !(!url || url.includes('example.supabase.co')) && !(!key || key.includes('demo-anon-key'));
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileWithStats | null>(null);
  const [looks, setLooks] = useState<LookWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'looks' | 'saved'>('looks');
  const [savedLooks, setSavedLooks] = useState<{ id: string; image_url: string; description?: string }[]>([]);
  const useSupabase = isSupabaseConfigured();

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const handleFile = useCallback((file: File) => {
    file.arrayBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: file.type });
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        sessionStorage.setItem('drip_pending_upload', dataUrl);
        sessionStorage.setItem('drip_pending_upload_type', file.type);
        setUploadOpen(false);
        router.push('/upload');
      };
      reader.readAsDataURL(blob);
    });
  }, [router]);

  useEffect(() => {
    loadProfile();
    if (user) loadUserLikes();
  }, [username, user]);

  const loadProfile = async () => {
    setLoadError(null);
    if (!useSupabase) {
      if (user?.user_metadata?.username === username) {
        const followersCount = getLocalFollowersCount(user.id);
        const followingCount = getLocalFollowingCount(user.id);
        setProfile({ id: user.id, username: String(user.user_metadata?.username || ''), bio: String(user.user_metadata?.bio || ''), avatar_url: String(user.user_metadata?.avatar_url || ''), created_at: new Date().toISOString(), looks_count: 0, followers_count: followersCount, following_count: followingCount, total_likes: 0 });
      }
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/profile/${encodeURIComponent(username)}`, {
        cache: 'no-store',
      });

      if (response.status === 404) {
        setProfile(null);
        setLooks([]);
        setLoadError(null);
        return;
      }

      if (!response.ok) {
        setLoadError('Impossible de charger le profil.');
        setProfile(null);
        return;
      }

      const data = await response.json();
      setProfile(data.profile as ProfileWithStats);
      setLooks((data.looks || []) as LookWithProfile[]);
    } catch (e) {
      console.error(e);
      setLoadError('Erreur de connexion. Vérifie ton réseau.');
    }
    finally { setLoading(false); }
  };

  const loadUserLikes = async () => {
    if (!user || !useSupabase) { setUserLikes(new Set()); return; }
    try {
      const { data } = await supabase.from('likes').select('look_id').eq('user_id', user.id);
      if (data) setUserLikes(new Set(data.map((l) => l.look_id)));
    } catch (e) { console.error(e); }
  };

  const loadSavedLooks = useCallback(async () => {
    const saved = getLocalSavedLooks();
    const missing = saved.filter(s => !s.image_url);
    if (missing.length > 0) {
      if (useSupabase) {
        const ids = missing.map(m => m.id);
        try {
          const { data } = await supabase.from('looks').select('id, image_url, description').in('id', ids);
          if (data) {
            const dataStore = getLocalSavesData();
            for (const look of data) {
              dataStore[look.id] = { image_url: look.image_url, description: look.description || '' };
            }
            localStorage.setItem('drip_saves_data', JSON.stringify(dataStore));
          }
        } catch {}
      }
    }
    setSavedLooks(getLocalSavedLooks());
  }, [useSupabase]);

  useEffect(() => {
    if (activeTab === 'saved') loadSavedLooks();
  }, [activeTab, loadSavedLooks]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (loadError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '24px', textAlign: 'center', background: '#050508', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
        <div style={{ width: '56px', height: '56px', background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
        </div>
        <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>Erreur</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>{loadError}</p>
        <button onClick={loadProfile} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #FF3B5C, #c0135e)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,59,92,0.35)' }}>Réessayer</button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '24px', textAlign: 'center', background: '#050508', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
        <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>Utilisateur introuvable</h2>
        <p style={{ color: '#666' }}>Ce profil n'existe pas.</p>
      </div>
    );
  }

  const isOwnProfile = !!(
    user &&
    profile &&
    (user.id === profile.id ||
      (user.user_metadata?.username &&
        String(user.user_metadata.username).toLowerCase() === String(profile.username).toLowerCase()))
  );

  const statCard = (value: number | string, label: string) => (
    <div style={{ flex: 1, textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px' }}>
      <p style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: '20px', fontWeight: 800, color: 'white', margin: '0 0 2px' }}>{value}</p>
      <p style={{ fontSize: '11px', color: '#666', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
    </div>
  );

  return (
    <>
      <UploadActionSheet open={uploadOpen} onClose={() => setUploadOpen(false)} onFile={handleFile} />
      <div style={{ minHeight: '100dvh', background: '#050508', paddingBottom: '90px', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>

      {/* Banner glow */}
      <div style={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,59,92,0.2) 0%, rgba(120,40,200,0.15) 50%, rgba(5,5,8,1) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,59,92,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,59,92,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Logo */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #FF3B5C, #c0135e)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(255,59,92,0.5)' }}>
            <Zap size={16} color="white" fill="white" />
          </div>
          <span style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: '20px', fontWeight: 800, background: 'linear-gradient(135deg, #fff 30%, #FF3B5C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DRIP</span>
        </div>
        
      </div>

      {/* Avatar + info */}
      <div style={{ padding: '0 16px', marginTop: '-48px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
          {/* Avatar */}
          <div style={{ width: '88px', height: '88px', borderRadius: '50%', border: '3px solid #050508', overflow: 'hidden', boxShadow: '0 0 24px rgba(255,59,92,0.4)', background: 'linear-gradient(135deg, #FF3B5C, #FFC107)', flexShrink: 0 }}>
            <UserAvatar src={profile.avatar_url} username={profile.username} size="lg" />
          </div>

          {/* Action button */}
          <div style={{ marginBottom: '8px' }}>
            {isOwnProfile ? (
              <>
                <Link href="/profile/edit" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                  <Edit3 size={14} /> Modifier
                </Link>
                <button onClick={async () => {
                  await signOut();
                  router.push('/login');
                }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', marginLeft: '8px', background: 'linear-gradient(135deg, #FF3B5C, #c0135e)', borderRadius: '20px', color: 'white', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,59,92,0.3)' }}>
                  Déconnexion
                </button>
              </>
            ) : user ? (
              <FollowButton
                userId={profile.id}
                initialCount={profile.followers_count}
                onToggle={(_, count) => {
                  setProfile(prev => prev ? { ...prev, followers_count: count } : prev);
                }}
              />
            ) : (
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: 'linear-gradient(135deg, #FF3B5C, #c0135e)', borderRadius: '20px', color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 700, boxShadow: '0 4px 16px rgba(255,59,92,0.35)' }}>
                Suivre
              </Link>
            )}
          </div>
        </div>

        {/* Name + bio */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: '22px', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.3px' }}>@{profile.username}</h1>
            <div style={{ background: 'linear-gradient(135deg, #FF3B5C, #c0135e)', borderRadius: '5px', padding: '2px 7px', fontSize: '9px', color: 'white', fontWeight: 700, letterSpacing: '0.08em' }}>DRIP</div>
          </div>
          {profile.bio && (
            <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>{profile.bio}</p>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {statCard(profile.looks_count, 'Looks')}
          {statCard(profile.total_likes, 'Likes')}
          {statCard(profile.followers_count, 'Followers')}
          {statCard(profile.following_count, 'Following')}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setActiveTab('looks')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer',
              color: activeTab === 'looks' ? 'white' : '#555',
              borderBottom: activeTab === 'looks' ? '2px solid #FF3B5C' : '2px solid transparent',
              marginBottom: '-12px', transition: 'all 0.2s',
            }}>
            <Grid3X3 size={16} color={activeTab === 'looks' ? '#FF3B5C' : '#555'} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Looks</span>
            <span style={{ fontSize: '12px', color: '#555' }}>({profile.looks_count})</span>
          </button>
          {isOwnProfile && (
            <button onClick={() => setActiveTab('saved')}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer',
                color: activeTab === 'saved' ? 'white' : '#555',
                borderBottom: activeTab === 'saved' ? '2px solid #FF3B5C' : '2px solid transparent',
                marginBottom: '-12px', transition: 'all 0.2s',
              }}>
              <Bookmark size={16} color={activeTab === 'saved' ? '#FF3B5C' : '#555'} fill={activeTab === 'saved' ? '#FF3B5C' : 'none'} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Sauvés</span>
              <span style={{ fontSize: '12px', color: '#555' }}>({savedLooks.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Content grid */}
      {activeTab === 'looks' ? (
        looks.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', padding: '0 2px' }}>
            {looks.map((look) => (
              <LookCard key={look.id} look={look} userLiked={userLikes.has(look.id)} variant="grid" />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Heart size={24} color="#FF3B5C" />
            </div>
            <p style={{ color: '#666', fontSize: '15px', marginBottom: isOwnProfile ? '16px' : '0' }}>Aucun look pour le moment</p>
            {isOwnProfile && (
              <button
                onClick={() => {
                  if (isMobile) {
                    setUploadOpen(true);
                  } else {
                    router.push('/upload');
                  }
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', minHeight: '44px', background: 'linear-gradient(135deg, #FF3B5C, #c0135e)', borderRadius: '14px', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 0 28px rgba(255,59,92,0.46)', letterSpacing: '0.02em', WebkitTapHighlightColor: 'transparent' }}>
                <PlusCircle size={18} />
                Poster ton premier look
              </button>
            )}
          </div>
        )
      ) : (
        savedLooks.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', padding: '0 2px' }}>
            {savedLooks.map((saved) => (
              saved.image_url ? (
                <Link key={saved.id} href={`/look/${saved.id}`} style={{ aspectRatio: '1 / 1', position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
                  <Image src={saved.image_url} alt="" fill sizes="33vw" style={{ objectFit: 'cover' }} />
                </Link>
              ) : (
                <Link key={saved.id} href={`/look/${saved.id}`} style={{ aspectRatio: '1 / 1', position: 'relative', overflow: 'hidden', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bookmark size={20} color="#555" />
                </Link>
              )
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Bookmark size={24} color="#555" />
            </div>
            <p style={{ color: '#666', fontSize: '15px' }}>Aucun look sauvegardé</p>
          </div>
        )
      )}
    </div>
    </>
  );
}
