'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LookCard } from '@/components/look-card';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface LookWithProfile {
  id: string;
  image_url: string;
  description: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  profile?: {
    username: string;
    avatar_url: string;
  };
}

export default function FeedPage() {
  const { user } = useAuth();
  const [looks, setLooks] = useState<LookWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadLooks();
    if (user) {
      loadUserLikes();
    }
  }, [user]);

  const loadLooks = async () => {
    try {
      const { data: looksData } = await supabase
        .from('looks')
        .select('*, profile:profiles(username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (looksData) {
        setLooks(looksData as LookWithProfile[]);
      }
    } catch (error) {
      console.error('Error loading looks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserLikes = async () => {
    if (!user) return;

    try {
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

  if (looks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-2 font-[family-name:var(--font-syne)]">
          Aucun look pour le moment
        </h2>
        <p className="text-[#888] mb-6">
          Sois le premier à partager ton style !
        </p>
        <a
          href="/upload"
          className="px-6 py-3 bg-[#FF3B5C] text-white rounded-xl font-semibold hover:bg-[#e63552] transition-colors"
        >
          Poster un look
        </a>
      </div>
    );
  }

  return (
    <div className="snap-y snap-mandatory h-screen overflow-y-scroll">
      {looks.map((look) => (
        <LookCard
          key={look.id}
          look={look}
          userLiked={userLikes.has(look.id)}
          variant="feed"
        />
      ))}
    </div>
  );
}
