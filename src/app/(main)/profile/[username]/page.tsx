'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from '@/components/user-avatar';
import { FollowButton } from '@/components/follow-button';
import { LookCard } from '@/components/look-card';
import { Edit3, Loader2, Zap, Grid3X3, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Profile, Look } from '@/types';
import { useRouter } from 'next/navigation';

interface ProfileWithStats extends Profile {
  looks_count: number;
  followers_count: number;
  following_count: number;
  total_likes: number;
}

interface LookWithProfile extends Look {
  profile?: { username: string; avatar_url: string };
}

function ProfileSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: '#050508', paddingBottom: '90px', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
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
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const useSupabase = isSupabaseConfigured();

  useEffect(() => {
    loadProfile();
    if (user) loadUserLikes();
  }, [username, user]);

  useEffect(() => {
    if (profile) loadLooks(profile.id);
  }, [profile]);

  const loadProfile = async () => {
    if (!useSupabase) {
      if (user?.user_metadata?.username === username) {
        setProfile({ id: user.id, username: String(user.user_metadata?.username || ''), bio: String(user.user_metadata?.bio || ''), avatar_url: String(user.user_metadata?.avatar_url || ''), created_at: new Date().toISOString(), looks_count: 0, followers_count: 0, following_count: 0, total_likes: 0 });
      }
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase.from('profiles').select('*').eq('username', username).maybeSingle();
      if (data) {
        const { count: looksCount } = await supabase.from('looks').select('*', { count: 'exact', head: true }).eq('user_id', data.id);
        const { count: followersCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', data.id);
        const { count: followingCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', data.id);
        const { data: userLikesData } = await supabase.from('looks').select('likes_count').eq('user_id', data.id);
        const totalLikes = userLikesData?.reduce((sum, l) => sum + (l.likes_count || 0), 0) || 0;
        setProfile({ ...data, looks_count: looksCount || 0, followers_count: followersCount || 0, following_count: followingCount || 0, total_likes: totalLikes } as ProfileWithStats);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadLooks = async (profileId?: string) => {
    const id = profileId || profile?.id;
    if (!id || !useSupabase) { setLooks([]); return; }
    try {
      const { data } = await supabase.from('looks').select('*').eq('user_id', id).order('created_at', { ascending: false });
      if (data) setLooks(data as LookWithProfile[]);
    } catch (e) { console.error(e); }
  };

  const loadUserLikes = async () => {
    if (!user || !useSupabase) { setUserLikes(new Set()); return; }
    try {
      const { data } = await supabase.from('likes').select('look_id').eq('user_id', user.id);
      if (data) setUserLikes(new Set(data.map((l) => l.look_id)));
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', textAlign: 'center', background: '#050508', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
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
    <div style={{ minHeight: '100vh', background: '#050508', paddingBottom: '90px', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>

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
              <FollowButton userId={profile.id} initialFollowing={false} initialCount={profile.followers_count} />
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

        {/* Section title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Grid3X3 size={16} color="#FF3B5C" />
          <span style={{ color: 'white', fontSize: '14px', fontWeight: 600, letterSpacing: '-0.2px' }}>Looks</span>
          <span style={{ color: '#555', fontSize: '13px' }}>({profile.looks_count})</span>
        </div>
      </div>

      {/* Looks grid */}
      {looks.length > 0 ? (
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
            <Link href="/upload" style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 24px', background: 'linear-gradient(135deg, #FF3B5C, #c0135e)', borderRadius: '20px', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 700, boxShadow: '0 4px 16px rgba(255,59,92,0.35)' }}>
              Poster ton premier look →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
