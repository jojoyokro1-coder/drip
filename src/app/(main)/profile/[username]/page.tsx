'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from '@/components/user-avatar';
import { FollowButton } from '@/components/follow-button';
import { LookCard } from '@/components/look-card';
import { Edit3, Loader2 } from 'lucide-react';
import { Profile, Look } from '@/types';

interface ProfileWithStats extends Profile {
  looks_count: number;
  followers_count: number;
  following_count: number;
  total_likes: number;
}

interface LookWithProfile extends Look {
  profile?: {
    username: string;
    avatar_url: string;
  };
}

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_DATABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_DATABASE_PUBLISHABLE_KEY || '';
  const invalidUrl = !url || url.includes('example.supabase.co');
  const invalidKey = !key || key.includes('demo-anon-key');
  return !invalidUrl && !invalidKey;
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileWithStats | null>(null);
  const [looks, setLooks] = useState<LookWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const useSupabase = isSupabaseConfigured();

  useEffect(() => {
    loadProfile();
    loadLooks();
    if (user) {
      loadUserLikes();
    }
  }, [username, user]);

  const loadProfile = async () => {
    if (!useSupabase) {
      if (user?.user_metadata?.username === username) {
        setProfile({
          id: user.id,
          username: String(user.user_metadata?.username || ''),
          bio: String(user.user_metadata?.bio || ''),
          avatar_url: String(user.user_metadata?.avatar_url || ''),
          created_at: new Date().toISOString(),
          looks_count: 0,
          followers_count: 0,
          following_count: 0,
          total_likes: 0,
        });
      }
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (data) {
        // Get looks count
        const { count: looksCount } = await supabase
          .from('looks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', data.id);

        // Get followers count
        const { count: followersCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', data.id);

        // Get following count
        const { count: followingCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', data.id);

        // Get total likes
        const { data: userLikesData } = await supabase
          .from('looks')
          .select('likes_count')
          .eq('user_id', data.id);

        const totalLikes = userLikesData?.reduce((sum, l) => sum + (l.likes_count || 0), 0) || 0;

        setProfile({
          ...data,
          looks_count: looksCount || 0,
          followers_count: followersCount || 0,
          following_count: followingCount || 0,
          total_likes: totalLikes,
        } as ProfileWithStats);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLooks = async () => {
    try {
      if (!useSupabase) {
        setLooks([]);
        return;
      }

      if (!profile) return;

      const { data } = await supabase
        .from('looks')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (data) {
        setLooks(data as LookWithProfile[]);
      }
    } catch (error) {
      console.error('Error loading looks:', error);
    }
  };

  const loadUserLikes = async () => {
    if (!user) return;

    try {
      if (!useSupabase) {
        setUserLikes(new Set());
        return;
      }

      const { data } = await supabase
        .from('likes')
        .select('look_id')
        .eq('user_id', user.id);

      if (data) {
        setUserLikes(new Set(data.map((like) => like.look_id)));
      }
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#FF3B5C] w-8 h-8" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Utilisateur introuvable</h2>
        <p className="text-[#888]">Ce profil n'existe pas.</p>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {/* Header */}
      <div className="px-4 pt-8 pb-6">
        <div className="flex items-start gap-4">
          <UserAvatar
            src={profile.avatar_url}
            username={profile.username}
            size="lg"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] text-white">
              @{profile.username}
            </h1>
            {profile.bio && (
              <p className="text-[#888] mt-2 font-[family-name:var(--font-space-grotesk)]">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-6">
          <div className="text-center">
            <p className="text-xl font-bold text-white">{profile.looks_count}</p>
            <p className="text-xs text-[#888]">Looks</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{profile.total_likes}</p>
            <p className="text-xs text-[#888]">Likes</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{profile.followers_count}</p>
            <p className="text-xs text-[#888]">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{profile.following_count}</p>
            <p className="text-xs text-[#888]">Following</p>
          </div>
        </div>

        {/* Follow Button */}
        {user && !isOwnProfile && (
          <div className="mt-6">
            <FollowButton
              userId={profile.id}
              initialFollowing={false}
              initialCount={profile.followers_count}
            />
          </div>
        )}

        {isOwnProfile && (
          <div className="mt-6">
            <Link
              href="/profile/edit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF3B5C] text-white rounded-full font-semibold hover:bg-[#e63552] transition-colors"
            >
              <Edit3 size={18} />
              Modifier
            </Link>
          </div>
        )}

        {!user && (
          <div className="mt-6">
            <a
              href="/login"
              className="inline-block px-5 py-2.5 bg-[#FF3B5C] text-white rounded-full font-semibold hover:bg-[#e63552] transition-colors"
            >
              Suivre
            </a>
          </div>
        )}
      </div>

      {/* Looks Grid */}
      {looks.length > 0 ? (
        <div className="grid grid-cols-3 gap-1">
          {looks.map((look) => (
            <LookCard
              key={look.id}
              look={look}
              userLiked={userLikes.has(look.id)}
              variant="grid"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[#888]">Aucun look pour le moment</p>
          {isOwnProfile && (
            <a
              href="/upload"
              className="mt-4 px-5 py-2 bg-[#FF3B5C] text-white rounded-full font-semibold hover:bg-[#e63552] transition-colors"
            >
              Poster ton premier look
            </a>
          )}
        </div>
      )}
    </div>
  );
}
