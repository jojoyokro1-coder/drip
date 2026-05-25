'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Flame, Hash, Star, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FilterTabs } from '@/components/filter-tabs';

type FilterType = 'week' | 'month' | 'all';

interface HashtagTrend {
  tag: string;
  count: number;
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

export default function TrendsPage() {
  const [filter, setFilter] = useState<FilterType>('week');
  const [trends, setTrends] = useState<HashtagTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTrends() {
      setLoading(true);
      try {
        const dateFilter = getDateFilter(filter);
        let query = supabase.from('looks').select('description').limit(250);
        if (dateFilter) query = query.gte('created_at', dateFilter);

        const timeout = new Promise<{ data: null }>((resolve) => {
          window.setTimeout(() => resolve({ data: null }), 5000);
        });

        const { data } = await Promise.race([query, timeout]);
        if (cancelled) return;

        const counts: Record<string, number> = {};
        (data || []).forEach((look: { description?: string | null }) => {
          (look.description?.match(/#\w+/g) || []).forEach((rawTag) => {
            const tag = rawTag.toLowerCase();
            counts[tag] = (counts[tag] || 0) + 1;
          });
        });

        setTrends(
          Object.entries(counts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20)
        );
      } catch (e) {
        console.error(e);
        if (!cancelled) setTrends([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTrends();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <div style={{ minHeight: '100dvh', background: '#050508', paddingBottom: '100px', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      <div style={{ position: 'relative', padding: '40px 16px 20px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,59,92,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', position: 'relative' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #FF3B5C, #c0135e)', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,59,92,0.4)' }}>
            <TrendingUp size={20} color="white" />
          </div>
          <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: '26px', fontWeight: 800, color: 'white', margin: 0 }}>
            Tendances
          </h1>
        </div>
        <p style={{ color: '#666', fontSize: '14px', margin: 0, position: 'relative' }}>
          Hashtags les plus utilises
        </p>
      </div>

      <FilterTabs filter={filter} setFilter={setFilter} tabs={FILTER_TABS} />

      {loading ? (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: '64px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      ) : trends.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.2)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <TrendingUp size={28} color="#FF3B5C" />
          </div>
          <p style={{ color: '#666', fontSize: '15px', marginBottom: '6px' }}>Aucune tendance</p>
          <p style={{ color: '#444', fontSize: '13px', margin: 0 }}>Ajoute des hashtags a tes looks !</p>
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {trends.map((trend, index) => {
            const isTop3 = index < 3;
            const barWidth = `${Math.round((trend.count / trends[0].count) * 100)}%`;

            return (
              <Link
                key={trend.tag}
                href={`/trends?tag=${trend.tag.replace('#', '')}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  background: isTop3 ? 'rgba(255,59,92,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isTop3 ? 'rgba(255,59,92,0.15)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '14px',
                  textDecoration: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: barWidth, background: 'rgba(255,59,92,0.04)', pointerEvents: 'none' }} />
                <span style={{ width: '28px', textAlign: 'center', fontFamily: "'Syne', system-ui, sans-serif", fontWeight: 800, fontSize: '14px', color: isTop3 ? '#FF3B5C' : '#444', flexShrink: 0, position: 'relative' }}>
                  #{index + 1}
                </span>
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
