'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { LookCard } from '@/components/look-card';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp } from 'lucide-react';

interface HashtagTrend {
  tag: string;
  count: number;
}

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

function TrendsContent() {
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get('tag');
  const { user } = useAuth();
  const [trends, setTrends] = useState<HashtagTrend[]>([]);
  const [looks, setLooks] = useState<LookWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTrends();
    if (selectedTag) {
      loadLooksByTag(selectedTag);
    } else {
      setLoading(false);
    }
    if (user) {
      loadUserLikes();
    }
  }, [selectedTag, user]);

  const loadTrends = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data } = await supabase
        .from('looks')
        .select('description')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (data) {
        const hashtagCounts: Record<string, number> = {};
        data.forEach((look) => {
          const hashtags = look.description.match(/#\w+/g) || [];
          hashtags.forEach((tag) => {
            const normalizedTag = tag.toLowerCase();
            hashtagCounts[normalizedTag] = (hashtagCounts[normalizedTag] || 0) + 1;
          });
        });

        const sortedTrends = Object.entries(hashtagCounts)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20);

        setTrends(sortedTrends);
      }
    } catch (error) {
      console.error('Error loading trends:', error);
    }
  };

  const loadLooksByTag = async (tag: string) => {
    try {
      const { data } = await supabase
        .from('looks')
        .select('*, profile:profiles(username, avatar_url)')
        .ilike('description', `%#${tag}%`)
        .order('created_at', { ascending: false });

      if (data) {
        setLooks(data as LookWithProfile[]);
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

  if (selectedTag) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pb-20">
        <div className="px-4 pt-8 pb-4">
          <Link href="/trends" className="text-[#FF3B5C] text-sm mb-2 inline-block">
            ← Retour aux tendances
          </Link>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] text-white">
            #{selectedTag}
          </h1>
          <p className="text-[#888] text-sm">{looks.length} looks</p>
        </div>

        {looks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <p className="text-[#888]">Aucun look avec ce hashtag</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {looks.map((look) => (
              <LookCard
                key={look.id}
                look={look}
                userLiked={userLikes.has(look.id)}
                variant="grid"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      <div className="px-4 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="text-[#FF3B5C]" size={28} />
          <h1 className="text-3xl font-bold font-[family-name:var(--font-syne)] text-white">
            Tendances
          </h1>
        </div>
        <p className="text-[#888] font-[family-name:var(--font-space-grotesk)]">
          Les hashtags les plus utilisés cette semaine
        </p>
      </div>

      {trends.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <TrendingUp className="text-[#FF3B5C] w-16 h-16 mb-4 opacity-50" />
          <p className="text-[#888]">Aucune tendance</p>
          <p className="text-[#555] text-sm mt-2">Ajoute des hashtags à tes looks !</p>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {trends.map((trend, index) => (
            <Link
              key={trend.tag}
              href={`/trends?tag=${trend.tag.replace('#', '')}`}
              className="flex items-center gap-4 p-4 bg-[#141414] rounded-xl hover:bg-[#1a1a1a] transition-colors"
            >
              <span className="w-6 text-center font-bold text-[#888]">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="text-[#FF3B5C] font-semibold">
                  #{trend.tag.replace('#', '')}
                </p>
              </div>
              <div className="text-[#888] text-sm">
                {trend.count} {trend.count === 1 ? 'look' : 'looks'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TrendsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
          <Loader2 className="animate-spin text-[#FF3B5C] w-8 h-8" />
        </div>
      }
    >
      <TrendsContent />
    </Suspense>
  );
}
