'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/integrations/supabase/client';
import { UserAvatar } from '@/components/user-avatar';
import { Trophy, Heart } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface TopLook {
  id: string;
  image_url: string;
  likes_count: number;
  description: string;
  profile?: {
    username: string;
    avatar_url: string;
  };
}

export default function RankingPage() {
  const [looks, setLooks] = useState<TopLook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopLooks();
  }, []);

  const loadTopLooks = async () => {
    try {
      // Get looks from last 7 days with likes_count
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data } = await supabase
        .from('looks')
        .select('*, profile:profiles(username, avatar_url)')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('likes_count', { ascending: false })
        .limit(10);

      if (data) {
        setLooks(data as TopLook[]);
      }
    } catch (error) {
      console.error('Error loading ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#FF3B5C] w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {/* Header */}
      <div className="px-4 pt-8 pb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Trophy className="text-[#FFC107]" size={32} />
          <h1 className="text-3xl font-bold font-[family-name:var(--font-syne)] text-white">
            Top 10
          </h1>
          <Trophy className="text-[#FFC107]" size={32} />
        </div>
        <p className="text-[#888] font-[family-name:var(--font-space-grotesk)]">
          Les looks les plus likés de la semaine
        </p>
      </div>

      {looks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <Trophy className="text-[#FFC107] w-16 h-16 mb-4 opacity-50" />
          <p className="text-[#888]">Aucun look cette semaine</p>
          <p className="text-[#555] text-sm mt-2">Reviens bientôt !</p>
        </div>
      ) : (
        <div className="space-y-4 px-4">
          {/* Podium */}
          {looks.slice(0, 3).length === 3 && (
            <div className="flex items-end justify-center gap-3 py-6">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C0C0C0] to-[#888] p-0.5 mb-2">
                  <UserAvatar
                    src={looks[1].profile?.avatar_url}
                    username={looks[1].profile?.username || 'user'}
                    size="md"
                    className="w-full h-full"
                  />
                </div>
                <div className="w-20 h-28 bg-[#1a1a1a] rounded-lg overflow-hidden relative">
                  <Image
                    src={looks[1].image_url}
                    alt="Look"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-xs text-white text-center">
                      <Heart className="inline w-3 h-3 mr-1 fill-[#C0C0C0] text-[#C0C0C0]" />
                      {looks[1].likes_count}
                    </p>
                  </div>
                </div>
                <p className="text-[#C0C0C0] text-sm font-bold mt-2">2nd</p>
                <p className="text-white text-xs">@{looks[1].profile?.username}</p>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFD700] to-[#B8860B] p-1 mb-2">
                  <UserAvatar
                    src={looks[0].profile?.avatar_url}
                    username={looks[0].profile?.username || 'user'}
                    size="lg"
                    className="w-full h-full"
                  />
                </div>
                <div className="w-28 h-36 bg-[#1a1a1a] rounded-lg overflow-hidden relative">
                  <Image
                    src={looks[0].image_url}
                    alt="Look"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-sm text-white text-center">
                      <Heart className="inline w-4 h-4 mr-1 fill-[#FFD700] text-[#FFD700]" />
                      {looks[0].likes_count}
                    </p>
                  </div>
                </div>
                <p className="text-[#FFD700] text-lg font-bold mt-2">1er</p>
                <p className="text-white text-sm">@{looks[0].profile?.username}</p>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#CD7F32] to-[#8B4513] p-0.5 mb-2">
                  <UserAvatar
                    src={looks[2].profile?.avatar_url}
                    username={looks[2].profile?.username || 'user'}
                    size="md"
                    className="w-full h-full"
                  />
                </div>
                <div className="w-20 h-24 bg-[#1a1a1a] rounded-lg overflow-hidden relative">
                  <Image
                    src={looks[2].image_url}
                    alt="Look"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-xs text-white text-center">
                      <Heart className="inline w-3 h-3 mr-1 fill-[#CD7F32] text-[#CD7F32]" />
                      {looks[2].likes_count}
                    </p>
                  </div>
                </div>
                <p className="text-[#CD7F32] text-sm font-bold mt-2">3ème</p>
                <p className="text-white text-xs">@{looks[2].profile?.username}</p>
              </div>
            </div>
          )}

          {/* Rest of ranking */}
          <div className="space-y-3 mt-6">
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-syne)]">
              Classement complet
            </h2>
            {looks.map((look, index) => (
              <Link
                key={look.id}
                href={`/profile/${look.profile?.username}`}
                className="flex items-center gap-3 p-3 bg-[#141414] rounded-xl hover:bg-[#1a1a1a] transition-colors"
              >
                <span className="w-8 text-center font-bold text-[#888]">
                  #{index + 1}
                </span>
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={look.image_url}
                    alt="Look"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    @{look.profile?.username}
                  </p>
                  {look.description && (
                    <p className="text-[#888] text-sm truncate">
                      {look.description.slice(0, 40)}...
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[#FF3B5C]">
                  <Heart className="w-4 h-4 fill-current" />
                  <span className="font-bold">{look.likes_count}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
