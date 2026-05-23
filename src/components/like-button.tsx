"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Heart } from "lucide-react";

interface LikeButtonProps {
  lookId: string;
  liked?: boolean;
  count?: number;
  onLikeToggle?: () => void;
  initialLiked?: boolean;
  initialCount: number;
  /** Compact : afficher uniquement icône + count, sans label */
  compact?: boolean;
}

export default function LikeButton({
  lookId,
  liked: likedProp,
  count: countProp,
  onLikeToggle,
  initialLiked = false,
  initialCount,
  compact = false,
}: LikeButtonProps) {
  const { user } = useAuth();
  const [internalLiked, setInternalLiked] = useState(initialLiked);
  const [internalCount, setInternalCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  const isControlled = likedProp !== undefined;
  const activeLiked = isControlled ? likedProp : internalLiked;
  const activeCount = isControlled ? countProp ?? 0 : internalCount;

  // Sync prop changes for uncontrolled mode
  useEffect(() => {
    if (!isControlled) {
      setInternalLiked(initialLiked);
    }
  }, [initialLiked, isControlled]);

  useEffect(() => {
    if (!isControlled) {
      setInternalCount(initialCount);
    }
  }, [initialCount, isControlled]);

  const triggerParticles = () => {
    const newParticles = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 60,
      y: -(Math.random() * 40 + 20),
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 700);
  };

  // Trigger animations when activeLiked becomes true
  const [prevLiked, setPrevLiked] = useState(activeLiked);
  useEffect(() => {
    if (activeLiked && !prevLiked) {
      setAnimating(true);
      triggerParticles();
      const timer = setTimeout(() => setAnimating(false), 600);
      setPrevLiked(true);
      return () => clearTimeout(timer);
    } else if (!activeLiked && prevLiked) {
      setPrevLiked(false);
    }
  }, [activeLiked, prevLiked]);

  useEffect(() => {
    if (isControlled || !user) return;
    supabase
      .from("likes")
      .select("id")
      .eq("look_id", lookId)
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => setInternalLiked(!!data));
  }, [user, lookId, isControlled]);

  const handleLike = useCallback(async () => {
    if (!user || loading) return;

    if (onLikeToggle) {
      onLikeToggle();
      return;
    }

    setLoading(true);

    if (internalLiked) {
      setInternalLiked(false);
      setInternalCount((c) => c - 1);
      await supabase.from("likes").delete().eq("look_id", lookId).eq("user_id", user.id);
      await supabase.from("looks").update({ likes_count: internalCount - 1 }).eq("id", lookId);
    } else {
      setInternalLiked(true);
      setInternalCount((c) => c + 1);
      // Animating is triggered by the activeLiked useEffect
      await supabase.from("likes").insert({ look_id: lookId, user_id: user.id });
      await supabase.from("looks").update({ likes_count: internalCount + 1 }).eq("id", lookId);
    }

    setLoading(false);
  }, [user, internalLiked, internalCount, loading, lookId, onLikeToggle]);

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <>
      <style>{`
        @keyframes heartPop {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.4) rotate(-8deg); }
          60%  { transform: scale(0.9) rotate(4deg); }
          80%  { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes heartShake {
          0%, 100% { transform: scale(1); }
          25%       { transform: scale(0.92) rotate(3deg); }
          75%       { transform: scale(0.95) rotate(-2deg); }
        }
        @keyframes particleFly {
          0%   { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0); }
        }
        @keyframes countPop {
          0%   { transform: translateY(0) scale(1); }
          40%  { transform: translateY(-6px) scale(1.15); }
          70%  { transform: translateY(2px) scale(0.95); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255,59,92,0.3); }
          50%       { box-shadow: 0 0 40px rgba(255,59,92,0.6), 0 0 80px rgba(255,59,92,0.2); }
        }
      `}</style>

      <button
        onClick={handleLike}
        disabled={!user}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: compact ? "6px" : "10px",
          background: liked
            ? "linear-gradient(135deg, rgba(255,59,92,0.2), rgba(255,59,92,0.08))"
            : "rgba(255,255,255,0.05)",
          border: liked
            ? "1px solid rgba(255,59,92,0.4)"
            : "1px solid rgba(255,255,255,0.08)",
          borderRadius: "100px",
          padding: compact ? "8px 14px" : "10px 20px",
          minHeight: "44px",
          cursor: user ? "pointer" : "default",
          WebkitTapHighlightColor: "transparent",
          transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s",
          animation: liked && animating ? "glowPulse 0.6s ease" : "none",
          outline: "none",
          overflow: "visible",
        }}
      >
        {/* Particules */}
        {particles.map((p) => (
          <span
            key={p.id}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#FF3B5C",
              pointerEvents: "none",
              // @ts-expect-error CSS custom properties are valid inline style keys.
              "--tx": `${p.x}px`,
              "--ty": `${p.y}px`,
              animation: "particleFly 0.7s ease-out forwards",
              zIndex: 10,
            } as React.CSSProperties}
          />
        ))}

        {/* Icône cœur */}
        <span
          style={{
            display: "flex",
            alignItems: "center",
            animation: animating
              ? "heartPop 0.55s cubic-bezier(0.36,0.07,0.19,0.97)"
              : !liked && !animating
              ? undefined
              : "heartShake 0.3s ease",
            willChange: "transform",
          }}
        >
          <Heart
            size={compact ? 16 : 18}
            fill={liked ? "#FF3B5C" : "none"}
            color={liked ? "#FF3B5C" : "rgba(255,255,255,0.5)"}
            strokeWidth={liked ? 0 : 1.8}
            style={{ transition: "fill 0.2s, color 0.2s" }}
          />
        </span>

        {/* Compteur */}
        <span
          style={{
            fontSize: compact ? "13px" : "14px",
            fontWeight: 700,
            color: liked ? "#FF3B5C" : "rgba(255,255,255,0.6)",
            fontFamily: "'Space Grotesk', sans-serif",
            display: "inline-block",
            animation: animating ? "countPop 0.5s cubic-bezier(0.36,0.07,0.19,0.97)" : "none",
            transition: "color 0.2s",
            minWidth: "20px",
          }}
        >
          {formatCount(count)}
        </span>

        {/* Label optionnel */}
        {!compact && (
          <span style={{
            fontSize: "13px",
            color: liked ? "rgba(255,59,92,0.7)" : "rgba(255,255,255,0.35)",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 500,
            transition: "color 0.2s",
          }}>
            {liked ? "Liké" : "Liker"}
          </span>
        )}
      </button>
    </>
  );
}

export { LikeButton };
