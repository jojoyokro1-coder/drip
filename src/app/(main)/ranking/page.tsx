'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Flame, Heart, Star, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FilterTabs } from '@/components/filter-tabs';

type FilterType = 'week' | 'month' | 'all';

interface TopLook {
  id: string;
  image_url: string;
  likes_count: number;
  description: string;
  created_at: string;
  profile?: { username: string; avatar_url: string };
}

const FILTER_TABS: { key: FilterType; label: string; icon: React.ReactNode }[] = [
  { key: 'week', label: 'Cette semaine', icon: <Flame size={13} /> },
  { key: 'month', label: 'Ce mois', icon: <Star size={13} /> },
  { key: 'all', label: 'Tout temps', icon: <Clock size={13} /> },
];

function getDateFilter(filter: FilterType) {
  const d = new Date();
  if (filter === 'week') d.setDate(d.getDate() - 7);
  if (filter === 'month') d.setMonth(d.getMonth() - 1);
  return filter === 'all' ? null : d.toISOString();
}

export default function RankingPage() {
  const [filter, setFilter] = useState<FilterType>('week');
  const [looks, setLooks] = useState<TopLook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTopLooks() {
      setLoading(true);
      try {
        const dateFilter = getDateFilter(filter);
        let query = supabase
          .from('looks')
          .select('*, profile:profiles(username, avatar_url)')
          .order('likes_count', { ascending: false })
          .limit(10);

        if (dateFilter) query = query.gte('created_at', dateFilter);

        const timeout = new Promise<{ data: null }>((resolve) => {
          window.setTimeout(() => resolve({ data: null }), 5000);
        });

        const { data } = await Promise.race([query, timeout]);
        if (!cancelled) setLooks((data || []) as TopLook[]);
      } catch (e) {
        console.error(e);
        if (!cancelled) setLooks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTopLooks();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <div style={{ minHeight: '100dvh', background: '#050508', paddingBottom: '100px', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      <div style={{ position: 'relative', padding: '40px 16px 20px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '300px', background: 'radial-gradient(circle, rgba(255,193,7,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px', position: 'relative' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #FFC107, #e6a800)', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,193,7,0.5)' }}>
            <Trophy size={20} color="white" fill="white" />
          </div>
          <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: '28px', fontWeight: 800, color: 'white', margin: 0 }}>
            Top 10
          </h1>
        </div>
        <p style={{ color: '#666', fontSize: '14px', margin: 0, position: 'relative' }}>Les looks les plus likes</p>
      </div>

      <FilterTabs filter={filter} setFilter={setFilter} tabs={FILTER_TABS} />

      {loading ? (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: '76px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      ) : looks.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.2)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Trophy size={28} color="#FFC107" />
          </div>
          <p style={{ color: '#666', fontSize: '15px', marginBottom: '6px' }}>Aucun look pour cette periode</p>
          <p style={{ color: '#444', fontSize: '13px', margin: 0 }}>Reviens bientot !</p>
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {looks.map((look, index) => (
            <Link key={look.id} href={`/look/${look.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: index < 3 ? 'rgba(255,193,7,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${index < 3 ? 'rgba(255,193,7,0.16)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '14px', textDecoration: 'none' }}>
              <span style={{ width: '30px', textAlign: 'center', fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, fontSize: '15px', color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#444', flexShrink: 0 }}>
                #{index + 1}
              </span>
              <div style={{ width: '58px', height: '58px', borderRadius: '10px', overflow: 'hidden', position: 'relative', flexShrink: 0, background: '#111' }}>
                <Image src={look.image_url} alt="Look" fill sizes="58px" style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '14px', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  @{look.profile?.username || 'user'}
                </p>
                {look.description && (
                  <p style={{ color: '#555', fontSize: '12px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {look.description.slice(0, 48)}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <Heart size={14} color="#FF3B5C" fill="#FF3B5C" />
                <span style={{ color: '#FF3B5C', fontWeight: 800, fontSize: '14px' }}>{look.likes_count}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
