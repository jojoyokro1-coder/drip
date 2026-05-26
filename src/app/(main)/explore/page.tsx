'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, Hash, Users, Compass, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LookCard } from '@/components/look-card';
import { useAuth } from '@/hooks/useAuth';

interface LookWithProfile {
  id: string;
  image_url: string;
  description: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  profile?: { username: string; avatar_url: string };
}

type SearchType = 'all' | 'hashtag' | 'username';

export default function ExplorePage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [looks, setLooks] = useState<LookWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchLooks = useCallback(async (q: string, type: SearchType) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (type !== 'all') params.set('type', type);
      params.set('perPage', '30');

      const res = await fetch(`/api/explore?${params.toString()}`);
      const data = await res.json();
      setLooks(data.looks || []);
    } catch (err) {
      console.error('Explore fetch error:', err);
      setLooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchLooks(query, searchType);
    }, query ? 300 : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchType, fetchLooks]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('likes')
      .select('look_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setUserLikes(new Set(data.map((l) => l.look_id)));
      });
  }, [user]);

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const FILTER_TABS: { key: SearchType; label: string; icon: React.ReactNode }[] = [
    { key: 'all',     label: 'Tout',       icon: <Compass size={13} /> },
    { key: 'hashtag',  label: 'Hashtags',   icon: <Hash size={13} /> },
    { key: 'username', label: 'Utilisateurs', icon: <Users size={13} /> },
  ];

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={{ position: 'relative', padding: '40px 16px 12px', overflow: 'hidden' }}>
        <div style={styles.glow} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={styles.iconBox}>
            <Compass size={20} color="white" />
          </div>
          <h1 style={styles.title}>Decouvrir</h1>
        </div>
        <p style={styles.subtitle}>Explore les looks et trouve l'inspiration</p>
      </div>

      {/* Search bar */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={styles.searchContainer}>
          <Search size={16} style={{ color: '#666', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Recherche par mot-clé, hashtag ou utilisateur..."
            style={styles.searchInput}
          />
          {query && (
            <button onClick={handleClear} style={styles.clearButton}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={styles.filterBar}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setSearchType(tab.key); }}
            style={{
              ...styles.filterTab,
              background: searchType === tab.key ? 'rgba(255,59,92,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${searchType === tab.key ? 'rgba(255,59,92,0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: searchType === tab.key ? '#FF3B5C' : '#888',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <ExploreSkeleton />
      ) : looks.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIconBox}>
            <Search size={24} color="#666" />
          </div>
          <p style={{ color: '#666', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>
            {query ? 'Aucun resultat' : 'Bienvenue sur DRIP'}
          </p>
          <p style={{ color: '#444', fontSize: '13px', margin: 0, maxWidth: '260px' }}>
            {query
              ? 'Essaie un autre mot-clé, hashtag ou nom d\'utilisateur'
              : 'Utilise la barre de recherche pour decouvrir des looks et des créateurs'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', padding: '0 2px' }}>
          {looks.map((look) => (
            <LookCard key={look.id} look={look} userLiked={userLikes.has(look.id)} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Skeleton ─────────────────────────────────────────────────────────── */
function ExploreSkeleton() {
  return (
    <div style={{ padding: '0 2px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
        {[...Array(9)].map((_, i) => (
          <div key={i} style={{ aspectRatio: '1 / 1', overflow: 'hidden', borderRadius: '8px' }}>
            <Skeleton className="w-full h-full bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Styles ────────────────────────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    background: '#050508',
    paddingBottom: '100px',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  },
  glow: {
    position: 'absolute',
    top: '-20%',
    right: '-10%',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(255,59,92,0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  iconBox: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #FF3B5C, #c0135e)',
    borderRadius: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 20px rgba(255,59,92,0.4)',
    flexShrink: 0,
  },
  title: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: '26px',
    fontWeight: 800,
    color: 'white',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: '#666',
    fontSize: '14px',
    margin: '6px 0 0',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '0 14px',
    height: '46px',
    transition: 'border-color 0.2s',
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'white',
    fontSize: '14px',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    fontWeight: 500,
    minWidth: 0,
  },
  clearButton: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#888',
    flexShrink: 0,
    padding: 0,
  },
  filterBar: {
    display: 'flex',
    gap: '8px',
    padding: '0 16px 16px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
  },
  filterTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    transition: 'background 0.2s, border-color 0.2s, color 0.2s',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '80px 24px',
    textAlign: 'center',
  },
  emptyIconBox: {
    width: '64px',
    height: '64px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
};
