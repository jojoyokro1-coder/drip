'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/integrations/supabase/client';
import { UserAvatar } from '@/components/user-avatar';
import { FilterTabs } from '@/components/filter-tabs';
import { Clock, Crown, Flame, Heart, Star, Trophy, Zap } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

interface TopLook {
  id: string;
  image_url: string;
  likes_count: number;
  description: string;
  profile?: { username: string; avatar_url: string };
}

type FilterType = 'week' | 'month' | 'all';

const FILTER_TABS: { key: FilterType; label: string; icon: React.ReactNode }[] = [
  { key: 'week',  label: 'Cette semaine', icon: <Flame size={13} /> },
  { key: 'month', label: 'Ce mois',        icon: <Star  size={13} /> },
  { key: 'all',   label: 'Tout temps',     icon: <Clock size={13} /> },
];

const MEDAL = [
  { label: '1er', color: '#FFD700', shadow: 'rgba(255,215,0,0.4)',   border: '#FFD700', size: 36 },
  { label: '2e',  color: '#C0C0C0', shadow: 'rgba(192,192,192,0.3)', border: '#C0C0C0', size: 28 },
  { label: '3e',  color: '#CD7F32', shadow: 'rgba(205,127,50,0.3)',  border: '#CD7F32', size: 28 },
];

/* ─── Skeleton ─────────────────────────────────────────────────────────── */
function RankingSkeleton() {
  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={{ position: 'relative', padding: '40px 16px 24px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={glowCenter} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '40px', height: '40px', background: 'rgba(255,193,7,0.1)', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={20} color="#FFC107" />
          </div>
          <Skeleton className="w-[100px] h-[28px] bg-muted/20" />
        </div>
        <Skeleton className="mx-auto w-[220px] h-[14px] bg-muted/20" />
      </div>

      {/* Filter tabs skeleton */}
      <div style={filterBarStyle}>
        {[100, 80, 90].map((w, i) => (
          <div key={i} style={{ width: `${w}px`, height: '34px', background: 'rgba(255,255,255,0.04)', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.07)' }} />
        ))}
      </div>

      {/* Podium skeleton */}
      <div style={{ padding: '0 16px 32px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '12px' }}>
        {/* 2nd */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: '0 0 88px' }}>
          <Skeleton className="w-[40px] h-[40px] rounded-full bg-muted/20" />
          <div style={{ width: '100%', height: '120px', borderRadius: '12px', overflow: 'hidden' }}>
            <Skeleton className="w-full h-full bg-muted/20" />
          </div>
          <Skeleton className="w-[60px] h-[12px] bg-muted/20" />
        </div>
        {/* 1st */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: '0 0 110px' }}>
          <Crown size={20} color="#FFD700" style={{ filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.4))' }} />
          <Skeleton className="w-[52px] h-[52px] rounded-full bg-muted/20" />
          <div style={{ width: '100%', height: '150px', borderRadius: '12px', overflow: 'hidden' }}>
            <Skeleton className="w-full h-full bg-muted/20" />
          </div>
          <Skeleton className="w-[70px] h-[12px] bg-muted/20" />
        </div>
        {/* 3rd */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: '0 0 88px' }}>
          <Skeleton className="w-[40px] h-[40px] rounded-full bg-muted/20" />
          <div style={{ width: '100%', height: '100px', borderRadius: '12px', overflow: 'hidden' }}>
            <Skeleton className="w-full h-full bg-muted/20" />
          </div>
          <Skeleton className="w-[55px] h-[12px] bg-muted/20" />
        </div>
      </div>

      {/* List skeleton */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Zap size={15} color="#FF3B5C" />
          <Skeleton className="w-[140px] h-[16px] bg-muted/20" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
              <Skeleton className="w-[20px] h-[16px] bg-muted/20" />
              <div style={{ width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                <Skeleton className="w-full h-full bg-muted/20" />
              </div>
              <div style={{ flex: 1 }}>
                <Skeleton className="w-[100px] h-[14px] bg-muted/20 mb-2" />
                <Skeleton className="w-[150px] h-[12px] bg-muted/20" />
              </div>
              <Skeleton className="w-[44px] h-[18px] bg-muted/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */
export default function RankingPage() {
  const [looks,   setLooks]   = useState<TopLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<FilterType>('week');

  useEffect(() => {
    setLoading(true);
    loadTopLooks();
  }, [filter]);

  const loadTopLooks = async () => {
    try {
      const d = new Date();
      if (filter === 'week')  d.setDate(d.getDate() - 7);
      if (filter === 'month') d.setMonth(d.getMonth() - 1);

      let query = supabase
        .from('looks')
        .select('*, profile:profiles(username, avatar_url)')
        .order('likes_count', { ascending: false })
        .limit(10);

      if (filter !== 'all') query = query.gte('created_at', d.toISOString());

      const { data } = await query;
      if (data) setLooks(data as TopLook[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <RankingSkeleton />;

  const podium      = looks.slice(0, 3);
  const rest        = looks.slice(3);
  const podiumOrder = podium.length === 3 ? [podium[1], podium[0], podium[2]] : [];
  const podiumMeta  = [MEDAL[1], MEDAL[0], MEDAL[2]];
  const podiumH     = ['120px', '150px', '100px'];

  return (
    <div style={pageStyle}>

      {/* Header */}
      <div style={{ position: 'relative', padding: '40px 16px 20px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={glowCenter} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #FFC107, #e6a800)', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,193,7,0.5)' }}>
            <Trophy size={20} color="white" fill="white" />
          </div>
          <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: '28px', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.5px' }}>Top 10</h1>
        </div>
        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Les looks les plus likés</p>
      </div>

      {/* ── Floating Filter Tabs ── */}
      <FilterTabs filter={filter} setFilter={setFilter} tabs={FILTER_TABS} />

      {looks.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.2)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Trophy size={28} color="#FFC107" />
          </div>
          <p style={{ color: '#666', fontSize: '15px', marginBottom: '6px' }}>Aucun look pour cette période</p>
          <p style={{ color: '#444', fontSize: '13px', margin: 0 }}>Reviens bientôt !</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {podiumOrder.length === 3 && (
            <div style={{ padding: '0 16px 32px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '12px' }}>
              {podiumOrder.map((look, i) => {
                const meta    = podiumMeta[i];
                const isFirst = i === 1;
                return (
                  <Link key={look.id} href={`/look/${look.id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textDecoration: 'none', flex: isFirst ? '0 0 110px' : '0 0 88px' }}>
                    {isFirst && <Crown size={20} color="#FFD700" style={{ filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.6))' }} />}
                    <div style={{ width: isFirst ? '52px' : '40px', height: isFirst ? '52px' : '40px', borderRadius: '50%', border: `2px solid ${meta.border}`, overflow: 'hidden', boxShadow: `0 0 14px ${meta.shadow}` }}>
                      <UserAvatar src={look.profile?.avatar_url} username={look.profile?.username || 'user'} size={isFirst ? 'md' : 'sm'} />
                    </div>
                    <div style={{ width: '100%', height: podiumH[i], borderRadius: '12px', overflow: 'hidden', position: 'relative', border: `1px solid ${meta.border}40`, boxShadow: `0 0 20px ${meta.shadow}` }}>
                      <Image src={look.image_url} alt="Look" fill sizes={isFirst ? '180px' : '96px'} style={{ objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
                      <div style={{ position: 'absolute', bottom: '8px', left: 0, right: 0, textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Heart size={12} color={meta.color} fill={meta.color} />
                          <span style={{ color: meta.color, fontSize: '12px', fontWeight: 700 }}>{look.likes_count}</span>
                        </div>
                      </div>
                      <div style={{ position: 'absolute', top: '8px', left: 0, right: 0, textAlign: 'center' }}>
                        <span style={{ background: meta.color, color: '#000', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '8px' }}>{meta.label}</span>
                      </div>
                    </div>
                    <p style={{ color: 'white', fontSize: '11px', fontWeight: 600, margin: 0, textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{look.profile?.username}</p>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Full ranking list — includes ALL 10 looks */}
          {rest.length > 0 && (
            <div style={{ padding: '0 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <Zap size={15} color="#FF3B5C" />
                <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: '15px', fontWeight: 700, color: 'white', margin: 0 }}>Classement complet</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {looks.map((look, index) => (
                  <Link key={look.id} href={`/look/${look.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', textDecoration: 'none' }}>
                    <span style={{ width: '28px', textAlign: 'center', fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, fontSize: '15px', color: index < 3 ? ['#FFD700','#C0C0C0','#CD7F32'][index] : '#444', flexShrink: 0 }}>
                      #{index + 1}
                    </span>
                    <div style={{ width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                      <Image src={look.image_url} alt="Look" fill sizes="96px" style={{ objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{look.profile?.username}</p>
                      {look.description && <p style={{ color: '#555', fontSize: '12px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{look.description.slice(0, 40)}</p>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <Heart size={14} color="#FF3B5C" fill="#FF3B5C" />
                      <span style={{ color: '#FF3B5C', fontWeight: 700, fontSize: '14px' }}>{look.likes_count}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Shared styles ────────────────────────────────────────────────────── */
const pageStyle: React.CSSProperties = {
  minHeight: '100dvh',
  background: '#050508',
  paddingBottom: '100px',
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
};

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  padding: '0 16px 24px',
  overflowX: 'auto',
  scrollbarWidth: 'none',
  justifyContent: 'center',
};

const glowCenter: React.CSSProperties = {
  position: 'absolute',
  top: '-30%', left: '50%',
  transform: 'translateX(-50%)',
  width: '400px', height: '300px',
  background: 'radial-gradient(circle, rgba(255,193,7,0.12) 0%, transparent 70%)',
  pointerEvents: 'none',
};
