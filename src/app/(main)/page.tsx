'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, PlusCircle, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LookCard } from '@/components/look-card';
import { CommentsDrawer } from '@/components/comments-drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

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

function FeedSkeleton() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', background: '#050508', overflow: 'hidden' }}>
      <Skeleton className="w-full h-full bg-muted/10" />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.3) 42%, rgba(0,0,0,0.08) 72%, transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 28%)' }} />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(env(safe-area-inset-top) + 12px) 16px 8px' }}>
        <div style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: '22px', fontWeight: 800, background: 'linear-gradient(135deg, #ffffff 30%, #FF3B5C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
          DRIP
        </div>
        <div style={{ background: 'rgba(255,59,92,0.15)', border: '1px solid rgba(255,59,92,0.3)', borderRadius: '20px', padding: '4px 12px', color: '#FF3B5C', fontSize: '12px', fontWeight: 600 }}>
          FEED
        </div>
      </div>

      <div style={{ position: 'absolute', right: '12px', bottom: 'calc(env(safe-area-inset-bottom) + 120px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <Skeleton className="w-[48px] h-[48px] rounded-full bg-muted/20" />
        <Skeleton className="w-[44px] h-[44px] rounded-full bg-muted/20" />
        <Skeleton className="w-[44px] h-[44px] rounded-full bg-muted/20" />
        <Skeleton className="w-[44px] h-[44px] rounded-full bg-muted/20" />
      </div>

      <div style={{ position: 'absolute', left: 0, right: '72px', bottom: 'calc(env(safe-area-inset-bottom) + 120px)', zIndex: 10, padding: '0 16px' }}>
        <Skeleton className="w-[110px] h-[18px] bg-muted/20 rounded mb-3" />
        <Skeleton className="w-[90%] h-[14px] bg-muted/20 rounded mb-2" />
        <Skeleton className="w-[60%] h-[14px] bg-muted/20 rounded" />
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { user } = useAuth();
  const [looks, setLooks] = useState<LookWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [commentLookId, setCommentLookId] = useState<string | null>(null);
  const observerTargetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadingFallback = window.setTimeout(() => setLoading(false), 5500);
    loadLooks();
    if (user) loadUserLikes();

    return () => window.clearTimeout(loadingFallback);
  }, [user]);

  const loadLooks = async (beforeTimestamp?: string) => {
    const limit = 6;

    try {
      if (beforeTimestamp) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      let query = supabase
        .from('looks')
        .select('*, profile:profiles(username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (beforeTimestamp) {
        query = query.lt('created_at', beforeTimestamp);
      }

      const timeout = new Promise<{ data: null }>((resolve) => {
        window.setTimeout(() => resolve({ data: null }), 5000);
      });

      const { data } = await Promise.race([query, timeout]);

      if (data) {
        const newLooks = data as LookWithProfile[];
        setLooks((current) => (beforeTimestamp ? [...current, ...newLooks] : newLooks));
        setHasMore(newLooks.length === limit);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;

        const lastLook = looks[looks.length - 1];
        if (lastLook) loadLooks(lastLook.created_at);
      },
      { threshold: 0.15, rootMargin: '160px' }
    );

    const target = observerTargetRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [looks, loading, loadingMore, hasMore]);

  const loadUserLikes = async () => {
    if (!user) {
      setUserLikes(new Set());
      return;
    }

    try {
      const { data } = await supabase.from('likes').select('look_id').eq('user_id', user.id);
      if (data) setUserLikes(new Set(data.map((like) => like.look_id)));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <FeedSkeleton />;
  }

  if (looks.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '24px 20px 120px', textAlign: 'center', background: '#050508', position: 'relative', overflow: 'hidden', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
        <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, #FF3B5C, #c0135e)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(255,59,92,0.4)', marginBottom: '20px' }}>
          <Zap size={36} color="white" fill="white" />
        </div>

        <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: '28px', fontWeight: 800, color: 'white', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          Aucun look pour le moment
        </h2>
        <p style={{ color: '#666', fontSize: '15px', margin: '0 0 22px', lineHeight: 1.5 }}>
          Sois le premier a partager ton style.
        </p>

        <Link href="/upload" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 28px', minHeight: '44px', background: 'linear-gradient(135deg, #FF3B5C, #c0135e)', borderRadius: '14px', color: 'white', fontFamily: "'Syne', system-ui, sans-serif", fontSize: '16px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 28px rgba(255,59,92,0.46)', letterSpacing: '0.02em', WebkitTapHighlightColor: 'transparent' }}>
          <PlusCircle size={20} />
          Poster un look
        </Link>
      </div>
    );
  }

  return (
    <>
    <div
      className="hide-scrollbar"
      style={{
        height: '100dvh',
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        background: '#050508',
        overscrollBehaviorY: 'contain',
      }}
    >
      {looks.map((look) => (
        <LookCard key={look.id} look={look} userLiked={userLikes.has(look.id)} variant="feed" onCommentClick={() => { console.log('Comment click for look', look.id); setCommentLookId(look.id); }} />
      ))}

      {hasMore && (
        <div
          ref={observerTargetRef}
          style={{
            height: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#050508',
            scrollSnapAlign: 'center',
            scrollSnapStop: 'always',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <Loader2 size={32} color="#FF3B5C" className="animate-spin" />
          <span style={{ color: '#666', fontSize: '14px', fontFamily: "'Space Grotesk', sans-serif" }}>
            Chargement...
          </span>
        </div>
      )}
    </div>

    {commentLookId && (
      <CommentsDrawer lookId={commentLookId} open={true} onClose={() => setCommentLookId(null)} />
    )}
    </>
  );
}
