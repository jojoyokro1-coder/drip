'use client';

// Added comment drawer functionality

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from './user-avatar';
import { LikeButton } from './like-button';
import { MessageCircle } from 'lucide-react';

import { CommentsDrawer } from '@/components/comments-drawer';
import { Share2, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

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
}

interface HeartAnimation {
  id: number;
  x: number;
  y: number;
  rotate: number;
}

export function LookCard({ look, userLiked = false, variant = 'feed' }: LookCardProps) {
  const { user } = useAuth();
  const profile = look.profile;
  const hashtags = look.description?.match(/#\w+/g) || [];

  // Local state for liking, count, and floating hearts
  const [liked, setLiked] = useState(userLiked);
  const [likesCount, setLikesCount] = useState(look.likes_count);
  const [likeLoading, setLikeLoading] = useState(false);
  const [hearts, setHearts] = useState<HeartAnimation[]>([]);
    const [commentOpen, setCommentOpen] = useState(false);
  const lastTap = useRef<number>(0);

  // Sync state if props change (e.g. from parent feed page)
  useEffect(() => {
    setLiked(userLiked);
  }, [userLiked]);

  useEffect(() => {
    setLikesCount(look.likes_count);
  }, [look.likes_count]);

  const handleLikeToggle = async () => {
    if (!user || likeLoading) return;
    setLikeLoading(true);

    const isLiking = !liked;
    setLiked(isLiking);
    setLikesCount((c) => (isLiking ? c + 1 : c - 1));

    try {
      if (isLiking) {
        await supabase.from("likes").insert({ look_id: look.id, user_id: user.id });
        await supabase.from("looks").update({ likes_count: likesCount + 1 }).eq("id", look.id);
      } else {
        await supabase.from("likes").delete().eq("look_id", look.id).eq("user_id", user.id);
        await supabase.from("looks").update({ likes_count: likesCount - 1 }).eq("id", look.id);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      // Revert optimistic updates
      setLiked(!isLiking);
      setLikesCount((c) => (isLiking ? c - 1 : c + 1));
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
        await supabase.from("likes").insert({ look_id: look.id, user_id: user.id });
        await supabase.from("looks").update({ likes_count: likesCount + 1 }).eq("id", look.id);
      } catch (err) {
        console.error("Error liking via double tap:", err);
        setLiked(false);
        setLikesCount((c) => c - 1);
      } finally {
        setLikeLoading(false);
      }
    }
  };

  if (variant === 'grid') {
    return (
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
        <Image src={look.image_url} alt="Look" fill style={{ objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 62%)' }} />
        <div style={{ position: 'absolute', left: '8px', bottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fff' }}>
            <svg style={{ width: '14px', height: '14px', fill: '#FF3B5C' }} viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 700 }}>{look.likes_count}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
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
      <Image src={look.image_url} alt="Look" fill style={{ objectFit: 'cover' }} priority />

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

      {/* Right actions sidebar */}
      <div style={{
        position: 'absolute',
        right: '12px',
        bottom: 'calc(env(safe-area-inset-bottom) + 112px)',
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
          <div style={{
            position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)',
            width: '20px', height: '20px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF3B5C, #c0135e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #000', fontSize: '12px', color: 'white', fontWeight: 700,
          }}>+</div>
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
        <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minHeight: '44px', background: 'none', border: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Share2 size={20} color="white" />
          </div>
          <span style={{ color: 'white', fontSize: '12px', fontWeight: 500 }}>Share</span>
        </button>

        {/* Save */}
        <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minHeight: '44px', background: 'none', border: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bookmark size={20} color="white" />
          </div>
          <span style={{ color: 'white', fontSize: '12px', fontWeight: 500 }}>Save</span>
        </button>
{/* Comments */}
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
  <button onClick={() => setCommentOpen(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minHeight: '44px', background: 'none', border: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
    <MessageCircle size={20} color="white" />
    <span style={{ color: 'white', fontSize: '12px', fontWeight: 500 }}>Comment</span>
  </button>
</div>
      </div>

      {/* Bottom content */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: '72px',
        bottom: 'calc(env(safe-area-inset-bottom) + 112px)',
        zIndex: 10,
        padding: '0 16px',
      }}>
        {/* User info */}
        <Link href={`/profile/${profile?.username}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px', textDecoration: 'none' }}>
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
          }}>
            {look.description}
          </p>
        )}

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
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
    </div>
  );

      {/* Comments Drawer */}
      <CommentsDrawer lookId={look.id} open={commentOpen} onClose={() => setCommentOpen(false)} />
}
