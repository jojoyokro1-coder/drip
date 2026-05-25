'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from './user-avatar';
import { LikeButton } from './like-button';
import { supabase } from '@/integrations/supabase/client';
import { isLocalFollowing, toggleLocalFollow } from '@/lib/local-follows';
import { isLocalSaved, toggleLocalSave } from '@/lib/local-saves';
import { Bookmark, MessageCircle, Share2, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface LookCardProps {
  look: {
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
  };
  userLiked?: boolean;
  variant?: 'feed' | 'grid';
  onCommentClick?: () => void;
}

interface HeartAnimation {
  id: number;
  x: number;
  y: number;
  rotate: number;
}

export function LookCard({ look, userLiked = false, variant = 'feed', onCommentClick }: LookCardProps) {
  const { user, session } = useAuth();
  const profile = look.profile;
  const hashtags = look.description?.match(/#\w+/g) || [];

  // Local state for liking, count, and floating hearts
  const [liked, setLiked] = useState(userLiked);
  const [likesCount, setLikesCount] = useState(Math.max(0, look.likes_count || 0));
  const [likeLoading, setLikeLoading] = useState(false);
  const [hearts, setHearts] = useState<HeartAnimation[]>([]);
  const lastTap = useRef<number>(0);

  // Comment count
  const [commentCount, setCommentCount] = useState(0);
  const [commentAnimating, setCommentAnimating] = useState(false);
  const [commentParticles, setCommentParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  // Save state
  const [saved, setSaved] = useState(() => isLocalSaved(look.id));
  const [saveAnimating, setSaveAnimating] = useState(false);

  // Share animation
  const [shareAnimating, setShareAnimating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`drip_comments_${look.id}`);
    if (stored) {
      try { setCommentCount(JSON.parse(stored).length); } catch { setCommentCount(0); }
    } else {
      fetch(`/api/comments?lookId=${encodeURIComponent(look.id)}`, { cache: 'no-store' })
        .then(r => r.json().then(d => setCommentCount(d.comments?.length || 0)).catch(() => {}))
        .catch(() => {});
    }
  }, [look.id]);

  // Follow state for the "+" button in feed
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const isOwn = user?.id === look.user_id;

  useEffect(() => {
    if (!user || isOwn || !look.user_id) return;
    const local = isLocalFollowing(user.id, look.user_id);
    supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", look.user_id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { if (local) setFollowing(true); }
        else { setFollowing(!!data); }
      });
  }, [user, look.user_id, isOwn]);

  const handleFollowToggle = async () => {
    if (!user || followLoading || isOwn || !look.user_id) return;
    setFollowLoading(true);
    const prev = following;
    setFollowing(!prev);

    try {
      if (prev) {
        const { error } = await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", look.user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: look.user_id });
        if (error) throw error;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("does not exist") || msg.includes("permission denied")) {
        toggleLocalFollow(user.id, look.user_id);
      } else {
        console.error("Follow error:", err);
        setFollowing(prev);
      }
    } finally {
      setFollowLoading(false);
    }
  };

  // Sync state if props change (e.g. from parent feed page)
  useEffect(() => {
    setLiked(userLiked);
  }, [userLiked]);

  useEffect(() => {
    setLikesCount(Math.max(0, look.likes_count || 0));
  }, [look.likes_count]);

  const handleLikeToggle = async () => {
    if (!user || likeLoading) return;
    setLikeLoading(true);

    const isLiking = !liked;
    const previousCount = Math.max(0, likesCount);
    const nextCount = isLiking ? previousCount + 1 : Math.max(0, previousCount - 1);
    setLiked(isLiking);
    setLikesCount(nextCount);

    try {
      const token = session?.access_token;
      if (!token) throw new Error("Session invalide");

      const response = await fetch("/api/likes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lookId: look.id }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Like error");
      }

      setLiked(Boolean(data.liked));
      setLikesCount(Math.max(0, data.count || 0));
    } catch (err) {
      console.error("Error toggling like:", err);
      // Revert optimistic updates
      setLiked(!isLiking);
      setLikesCount(previousCount);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      // Double tap detected!
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      handleDoubleTap(x, y);
    }
    lastTap.current = now;
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCommentAnimating(true);
    const newParticles = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 60,
      y: -(Math.random() * 40 + 20),
    }));
    setCommentParticles(newParticles);
    setTimeout(() => { setCommentAnimating(false); setCommentParticles([]); }, 600);
    onCommentClick?.();
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShareAnimating(true);
    setTimeout(() => setShareAnimating(false), 500);
    const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const url = `${base}/look/${look.id}`;
    try {
      await navigator.share({ title: 'DRIP', url });
    } catch {
      await navigator.clipboard.writeText(url);
      toast.success('Lien copié !');
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = toggleLocalSave(look.id, { image_url: look.image_url, description: look.description });
    setSaved(now);
    setSaveAnimating(true);
    setTimeout(() => setSaveAnimating(false), 500);
    if (now) {
      toast.success('Look sauvegardé');
    }
  };

  const handleDoubleTap = async (x: number, y: number) => {
    if (!user) return;

    // Generate unique heart
    const newHeart = {
      id: Date.now() + Math.random(),
      x,
      y,
      rotate: Math.random() * 30 - 15, // rotation between -15 and 15 degrees
    };
    setHearts((prev) => [...prev, newHeart]);

    // Clean up heart after animation ends
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 800);

    // Vibration API
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(40);
    }

    if (!liked) {
      setLikeLoading(true);
      setLiked(true);
      setLikesCount((c) => c + 1);
      try {
        const token = session?.access_token;
        if (!token) throw new Error("Session invalide");

        const response = await fetch("/api/likes", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lookId: look.id }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || "Like error");
        setLiked(Boolean(data.liked));
        setLikesCount(Math.max(0, data.count || 0));
      } catch (err) {
        console.error("Error liking via double tap:", err);
        setLiked(false);
        setLikesCount((c) => Math.max(0, c - 1));
      } finally {
        setLikeLoading(false);
      }
    }
  };

  if (variant === 'grid') {
    return (
      <>
        <Link
          href={`/look/${look.id}`}
          style={{
            display: 'block',
            aspectRatio: '1 / 1',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '8px',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Image
            src={look.image_url}
            alt="Look"
            fill
            sizes="(max-width: 768px) 33vw, 220px"
            style={{ objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 62%)' }} />
          <div style={{ position: 'absolute', left: '8px', bottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fff' }}>
              <svg style={{ width: '14px', height: '14px', fill: '#FF3B5C' }} viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>{Math.max(0, look.likes_count || 0)}</span>
            </div>
          </div>
        </Link>
      </>
    );
  }

  return (
    <>
    <style>{`
      @keyframes particleFly {
        0%   { opacity: 1; transform: translate(0, 0) scale(1); }
        100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0); }
      }
    `}</style>
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        flexShrink: 0,
        scrollSnapAlign: 'center',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {/* Background Image */}
      <Image
        src={look.image_url}
        alt="Look"
        fill
        sizes="100vw"
        style={{ objectFit: 'cover' }}
      />

      {/* Double-tap interaction target overlay */}
      <div
        onClick={handleTap}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      />

      {/* Floating Hearts Container */}
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ scale: 0, opacity: 0, rotate: heart.rotate }}
            animate={{
              scale: [0, 1.4, 1.2, 1.3],
              opacity: [0, 1, 1, 0],
              y: [heart.y, heart.y - 80],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
              times: [0, 0.2, 0.6, 1],
            }}
            style={{
              position: 'absolute',
              left: heart.x - 40,
              top: heart.y - 40,
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            <svg
              style={{
                width: '80px',
                height: '80px',
                fill: '#FF3B5C',
                filter: 'drop-shadow(0 0 15px rgba(255, 59, 92, 0.8))',
              }}
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Gradient overlays */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.3) 42%, rgba(0,0,0,0.08) 72%, transparent 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 28%)', pointerEvents: 'none' }} />

      {/* Top header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'calc(env(safe-area-inset-top) + 12px) 16px 8px',
      }}>
        <div style={{
          fontFamily: "'Syne', system-ui, sans-serif",
          fontSize: '22px', fontWeight: 800,
          background: 'linear-gradient(135deg, #ffffff 30%, #FF3B5C)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
        }}>DRIP</div>
        <div style={{
          background: 'rgba(255,59,92,0.15)',
          border: '1px solid rgba(255,59,92,0.3)',
          borderRadius: '20px', padding: '4px 12px',
          color: '#FF3B5C', fontSize: '12px', fontWeight: 600,
        }}>FEED</div>
      </div>

      {/* Bottom content */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: '72px',
        bottom: 'calc(env(safe-area-inset-bottom) + 120px)',
        zIndex: 10,
        padding: '0 16px',
        pointerEvents: 'none',
      }}>
        {/* User info */}
        <Link href={`/profile/${profile?.username}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px', textDecoration: 'none', pointerEvents: 'auto' }}>
          <span style={{
            fontFamily: "'Syne', system-ui, sans-serif",
            fontSize: '16px', fontWeight: 700, color: 'white',
            letterSpacing: '-0.2px',
          }}>@{profile?.username || 'user'}</span>
          <div style={{
            background: 'linear-gradient(135deg, #FF3B5C, #c0135e)',
            borderRadius: '4px', padding: '2px 6px',
            fontSize: '10px', color: 'white', fontWeight: 700, letterSpacing: '0.05em',
          }}>DRIP</div>
        </Link>

        {/* Description */}
        {look.description && (
          <p style={{
            color: 'rgba(255,255,255,0.9)', fontSize: '14px', lineHeight: '1.5',
            marginBottom: '10px', fontFamily: "'Space Grotesk', system-ui, sans-serif",
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            pointerEvents: 'auto',
          }}>
            {look.description}
          </p>
        )}

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', pointerEvents: 'auto' }}>
            {hashtags.slice(0, 4).map((tag) => (
              <Link key={tag} href={`/trends?tag=${tag.slice(1)}`} style={{
                color: '#FF3B5C', fontSize: '13px', fontWeight: 600,
                textDecoration: 'none', letterSpacing: '-0.2px',
              }}>
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Right actions sidebar */}
      <div style={{
        position: 'absolute',
        right: '12px',
        bottom: 'calc(env(safe-area-inset-bottom) + 120px)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        {/* Avatar */}
        <div style={{ position: 'relative', marginBottom: '4px' }}>
          <Link href={`/profile/${profile?.username}`} style={{ WebkitTapHighlightColor: 'transparent' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              border: '2px solid #FF3B5C',
              overflow: 'hidden', boxShadow: '0 0 16px rgba(255,59,92,0.5)',
            }}>
              <UserAvatar src={profile?.avatar_url} username={profile?.username || 'user'} size="md" />
            </div>
          </Link>
          {user && !isOwn && (
            <button
              onClick={handleFollowToggle}
              disabled={followLoading}
              style={{
                position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)',
                width: '22px', height: '22px', borderRadius: '50%',
                background: following
                  ? 'rgba(255,59,92,0.15)'
                  : 'linear-gradient(135deg, #FF3B5C, #c0135e)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: following ? '2px solid rgba(255,59,92,0.4)' : '2px solid #000',
                fontSize: '12px', color: following ? '#FF3B5C' : 'white',
                fontWeight: 700, cursor: 'pointer', padding: 0, lineHeight: 1,
                transition: 'all 0.2s',
              }}
              title={following ? 'Se désabonner' : "S'abonner"}
            >
              {following ? <UserCheck size={12} /> : '+'}
            </button>
          )}
        </div>

        {/* Like */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <LikeButton
            lookId={look.id}
            liked={liked}
            count={likesCount}
            onLikeToggle={handleLikeToggle}
          />
        </div>

        {/* Share */}
        <button type="button" onClick={handleShare}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            minHeight: '44px', background: 'none', border: 'none', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent', padding: 0,
          }}>
          <motion.div
            animate={shareAnimating ? { scale: [1, 1.2, 0.9, 1.1, 1], rotate: [0, -10, 5, 0] } : {}}
            transition={{ duration: 0.45, ease: [0.36, 0.07, 0.19, 0.97] }}
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              willChange: 'transform',
            }}>
            <Share2 size={20} color="white" />
          </motion.div>
          <span style={{ color: 'white', fontSize: '12px', fontWeight: 500 }}>Share</span>
        </button>

        {/* Save */}
        <button type="button" onClick={handleSave}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            minHeight: '44px', background: 'none', border: 'none', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent', padding: 0,
          }}>
          <motion.div
            animate={saveAnimating ? { scale: [1, 1.25, 0.9, 1.1, 1] } : {}}
            transition={{ duration: 0.45, ease: [0.36, 0.07, 0.19, 0.97] }}
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: saved
                ? 'linear-gradient(135deg, rgba(255,59,92,0.2), rgba(255,59,92,0.08))'
                : 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              border: saved ? '1px solid rgba(255,59,92,0.4)' : '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.3s, border-color 0.3s',
              willChange: 'transform',
            }}>
            <Bookmark size={20} color={saved ? '#FF3B5C' : 'white'} fill={saved ? '#FF3B5C' : 'none'} />
          </motion.div>
          <span style={{ color: saved ? '#FF3B5C' : 'white', fontSize: '12px', fontWeight: 500, transition: 'color 0.3s' }}>
            {saved ? 'Sauvegardé' : 'Save'}
          </span>
        </button>
{/* Comments */}
<button type="button" onClick={handleCommentClick}
  style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    background: 'none', border: 'none', cursor: 'pointer',
    padding: 0, color: 'white', fontFamily: "'Space Grotesk', sans-serif",
    WebkitTapHighlightColor: 'transparent', position: 'relative',
  }}>
  <div style={{
    position: 'relative', width: '44px', height: '44px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    {commentParticles.map((p) => (
      <span
        key={p.id}
        style={{
          position: 'absolute',
          left: '50%', top: '50%',
          width: '5px', height: '5px',
          borderRadius: '50%',
          background: '#FF3B5C',
          pointerEvents: 'none',
          '--tx': `${p.x}px`,
          '--ty': `${p.y}px`,
          animation: 'particleFly 0.7s ease-out forwards',
          zIndex: 10,
        } as React.CSSProperties}
      />
    ))}
    <motion.div
      animate={commentAnimating ? {
        scale: [1, 1.3, 0.9, 1.1, 1],
        rotate: [0, -8, 4, 0],
      } : {}}
      transition={{ duration: 0.5, ease: [0.36, 0.07, 0.19, 0.97] }}
      style={{
        width: '44px', height: '44px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        willChange: 'transform',
      }}
    >
      <MessageCircle size={20} color="white" />
    </motion.div>
  </div>
  <span style={{ fontSize: '12px', fontWeight: 500 }}>
    {commentCount > 0 ? `${commentCount}` : 'Comment'}
  </span>
</button>
      </div>

    </div>
    </>
  );
}
