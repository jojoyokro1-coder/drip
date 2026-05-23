'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, ArrowLeft, Hash, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LookCard } from '@/components/look-card';
import { useAuth } from '@/hooks/useAuth';

interface HashtagTrend { tag: string; count: number; }
interface LookWithProfile {
  id: string; image_url: string; description: string;
  likes_count: number; created_at: string; user_id: string;
  profile?: { username: string; avatar_url: string };
}

function TrendsSkeleton({ isDetail = false }: { isDetail?: boolean }) {
  if (isDetail) {
    return (
      <div style={{ minHeight: '100vh', background: '#050508', paddingBottom: '90px', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
        <div style={{ padding: '40px 16px 20px' }}>
          <Skeleton className="w-[60px] h-[16px] bg-muted/20 mb-4" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(255,59,92,0.05)', border: '1px solid rgba(255,59,92,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hash size={18} color="#FF3B5C" style={{ opacity: 0.5 }} />
            </div>
            <div>
              <Skeleton className="w-[120px] h-[24px] bg-muted/20 mb-2" />
              <Skeleton className="w-[60px] h-[14px] bg-muted/20" />
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', padding: '0 2px' }}>
          {[...Array(9)].map((_, i) => (
            <div key={i} style={{ aspectRatio: '1 / 1', position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
              <Skeleton className="w-full h-full bg-muted/20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050508', paddingBottom: '90px', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* Header Skeleton */}
      <div style={{ position: 'relative', padding: '40px 16px 24px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,59,92,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '40px', height: '40px', background: 'rgba(255,59,92,0.1)', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} color="#FF3B5C" />
          </div>
          <Skeleton className="w-[120px] h-[26px] bg-muted/20" />
        </div>
        <Skeleton className="w-[240px] h-[14px] bg-muted/20" />
      </div>

      {/* List Skeleton */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[...Array(6)].map((_, index) => {
          const isTop3 = index < 3;
          return (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: isTop3 ? 'rgba(255,59,92,0.02)' : 'rgba(255,255,255,0.01)', border: `1px solid ${isTop3 ? 'rgba(255,59,92,0.08)' : 'rgba(255,255,255,0.03)'}`, borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
              <span style={{ width: '28px', textAlign: 'center', fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, fontSize: '14px', color: isTop3 ? 'rgba(255,59,92,0.3)' : '#222', flexShrink: 0 }}>#{index + 1}</span>
              <div style={{ width: '34px', height: '34px', background: isTop3 ? 'rgba(255,59,92,0.05)' : 'rgba(255,255,255,0.02)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Hash size={16} color={isTop3 ? 'rgba(255,59,92,0.3)' : '#333'} />
              </div>
              <div style={{ flex: 1 }}>
                <Skeleton className="w-[100px] h-[15px] bg-muted/20 mb-2" />
                <Skeleton className="w-[50px] h-[12px] bg-muted/20" />
              </div>
              {isTop3 && (
                <div style={{ background: 'rgba(255,59,92,0.1)', borderRadius: '8px', padding: '3px 8px', width: '38px', height: '16px' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
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
    if (selectedTag) loadLooksByTag(selectedTag);
    else setLoading(false);
    if (user) loadUserLikes();
  }, [selectedTag, user]);

  const loadTrends = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data } = await supabase.from('looks').select('description').gte('created_at', sevenDaysAgo.toISOString());
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((l) => { (l.description.match(/#\w+/g) || []).forEach((tag) => { const t = tag.toLowerCase(); counts[t] = (counts[t] || 0) + 1; }); });
        setTrends(Object.entries(counts).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count).slice(0, 20));
      }
    } catch (e) { console.error(e); }
  };

  const loadLooksByTag = async (tag: string) => {
    try {
      const { data } = await supabase.from('looks').select('*, profile:profiles(username, avatar_url)').ilike('description', `%#${tag}%`).order('created_at', { ascending: false });
      if (data) setLooks(data as LookWithProfile[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadUserLikes = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('likes').select('look_id').eq('user_id', user.id);
      if (data) setUserLikes(new Set(data.map((l) => l.look_id)));
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return <TrendsSkeleton isDetail={!!selectedTag} />;
  }

  // Tag selected — show looks grid
  if (selectedTag) {
    return (
      <div style={{ minHeight: '100vh', background: '#050508', paddingBottom: '90px', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
        <div style={{ padding: '40px 16px 20px' }}>
          <Link href="/trends" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#FF3B5C', textDecoration: 'none', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            <ArrowLeft size={15} /> Retour
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(255,59,92,0.15)', border: '1px solid rgba(255,59,92,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hash size={18} color="#FF3B5C" />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: '22px', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.3px' }}>#{selectedTag}</h1>
              <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>{looks.length} look{looks.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {looks.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ color: '#666', fontSize: '15px' }}>Aucun look avec ce hashtag</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', padding: '0 2px' }}>
            {looks.map((look) => <LookCard key={look.id} look={look} userLiked={userLikes.has(look.id)} variant="grid" />)}
          </div>
        )}
      </div>
    );
  }

  // Main trends list
  return (
    <div style={{ minHeight: '100vh', background: '#050508', paddingBottom: '90px', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ position: 'relative', padding: '40px 16px 24px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,59,92,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #FF3B5C, #c0135e)', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,59,92,0.4)' }}>
            <TrendingUp size={20} color="white" />
          </div>
          <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: '26px', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.5px' }}>Tendances</h1>
        </div>
        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Hashtags les plus utilisés cette semaine</p>
      </div>

      {trends.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.2)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <TrendingUp size={28} color="#FF3B5C" />
          </div>
          <p style={{ color: '#666', fontSize: '15px', marginBottom: '6px' }}>Aucune tendance</p>
          <p style={{ color: '#444', fontSize: '13px', margin: 0 }}>Ajoute des hashtags à tes looks !</p>
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {trends.map((trend, index) => {
            const isTop3 = index < 3;
            const barWidth = `${Math.round((trend.count / trends[0].count) * 100)}%`;
            return (
              <Link key={trend.tag} href={`/trends?tag=${trend.tag.replace('#', '')}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: isTop3 ? 'rgba(255,59,92,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isTop3 ? 'rgba(255,59,92,0.15)' : 'rgba(255,255,255,0.05)'}`, borderRadius: '14px', textDecoration: 'none', position: 'relative', overflow: 'hidden' }}>
                {/* Progress bar bg */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: barWidth, background: 'rgba(255,59,92,0.04)', pointerEvents: 'none' }} />

                <span style={{ width: '28px', textAlign: 'center', fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, fontSize: '14px', color: isTop3 ? '#FF3B5C' : '#444', flexShrink: 0, position: 'relative' }}>#{index + 1}</span>

                <div style={{ width: '34px', height: '34px', background: isTop3 ? 'rgba(255,59,92,0.15)' : 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                  <Hash size={16} color={isTop3 ? '#FF3B5C' : '#555'} />
                </div>

                <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                  <p style={{ color: isTop3 ? 'white' : '#ccc', fontWeight: 700, fontSize: '15px', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    #{trend.tag.replace('#', '')}
                  </p>
                  <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>
                    {trend.count} look{trend.count !== 1 ? 's' : ''}
                  </p>
                </div>

                {isTop3 && (
                  <div style={{ background: 'linear-gradient(135deg, #FF3B5C, #c0135e)', borderRadius: '8px', padding: '3px 8px', fontSize: '10px', color: 'white', fontWeight: 700, flexShrink: 0, position: 'relative' }}>
                    HOT
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TrendsPage() {
  return (
    <Suspense fallback={<TrendsSkeleton />}>
      <TrendsContent />
    </Suspense>
  );
}
