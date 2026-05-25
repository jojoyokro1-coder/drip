"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isLocalFollowing, toggleLocalFollow } from "@/lib/local-follows";

interface FollowButtonProps {
  targetUserId?: string;
  userId?: string;
  initialFollowing?: boolean;
  initialCount?: number;
  size?: "sm" | "md";
  /** Variante compacte (icône seule) */
  compact?: boolean;
  /** Callback appelé après (un)follow */
  onToggle?: (isFollowing: boolean, count: number) => void;
}

export default function FollowButton({
  targetUserId,
  userId,
  initialFollowing,
  initialCount = 0,
  compact = false,
  onToggle,
}: FollowButtonProps) {
  const { user, session } = useAuth();
  const resolvedTargetUserId = targetUserId || userId || "";
  const [following, setFollowing] = useState(initialFollowing ?? false);
  const [followerCount, setFollowerCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hovered, setHovered] = useState(false);

  // On ne render pas le bouton si c'est le propre profil
  const isSelf = user?.id === resolvedTargetUserId;
  const isLocal = !session;

  useEffect(() => {
    if (!user || isSelf || !resolvedTargetUserId) {
      setInitialLoading(false);
      return;
    }

    if (initialFollowing !== undefined) {
      setFollowing(initialFollowing);
      setInitialLoading(false);
      return;
    }

    const localFollowing = isLocalFollowing(user.id, resolvedTargetUserId);

    supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", resolvedTargetUserId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          // Fall back to localStorage if table doesn't exist or RLS blocks
          if (localFollowing !== false) setFollowing(true);
        } else {
          setFollowing(!!data);
        }
        setInitialLoading(false);
      });
  }, [user, resolvedTargetUserId, isSelf, initialFollowing]);

  const handleToggle = useCallback(async () => {
    if (!user || loading || isSelf || !resolvedTargetUserId) return;

    setLoading(true);
    const previousFollowing = following;
    const previousCount = followerCount;
    setFollowing(!previousFollowing);

    const tryLocal = () => {
      const result = toggleLocalFollow(user.id, resolvedTargetUserId);
      setFollowing(result.following);
      setFollowerCount(result.count);
      onToggle?.(result.following, result.count);
    };

    try {
      // Try direct Supabase query first (same pattern as like button on detail page)
      if (previousFollowing) {
        const { error: delErr } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", resolvedTargetUserId);
        if (delErr) throw delErr;
      } else {
        const { error: insErr } = await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: resolvedTargetUserId });
        if (insErr) throw insErr;
      }

      const { count, error: countErr } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", resolvedTargetUserId);
      const newCount = countErr ? followerCount : Math.max(0, count || 0);

      setFollowing(!previousFollowing);
      setFollowerCount(newCount);
      onToggle?.(!previousFollowing, newCount);
    } catch (err: unknown) {
      // If Supabase table doesn't exist or RLS blocks, fall back to localStorage
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("does not exist") || msg.includes("permission denied") || msg.includes("policy")) {
        console.warn("Follow via Supabase failed, falling back to localStorage:", msg);
        tryLocal();
      } else {
        console.error("Follow error:", err);
        setFollowing(previousFollowing);
        setFollowerCount(previousCount);
        toast.error("Erreur lors de l'abonnement");
      }
    } finally {
      setLoading(false);
    }
  }, [user, following, followerCount, loading, resolvedTargetUserId, isSelf, onToggle]);

  if (!user || isSelf) return null;
  if (initialLoading) return (
    <div style={{
      width: compact ? "40px" : "110px", height: "40px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "100px",
      animation: "pulse 1.5s ease infinite",
    }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.5}50%{opacity:1} }`}</style>
    </div>
  );

  // Détermine le style selon l'état
  const isUnfollowHover = following && hovered;

  const bg = following
    ? isUnfollowHover
      ? "rgba(255,59,92,0.1)"
      : "rgba(255,255,255,0.06)"
    : "linear-gradient(135deg, #FF3B5C, #ff6b84)";

  const borderColor = following
    ? isUnfollowHover
      ? "rgba(255,59,92,0.4)"
      : "rgba(255,255,255,0.15)"
    : "transparent";

  const textColor = following
    ? isUnfollowHover ? "#FF3B5C" : "rgba(255,255,255,0.8)"
    : "#fff";

  const label = following
    ? isUnfollowHover ? "Se désabonner" : "Abonné"
    : "Suivre";

  return (
    <>
      <style>{`
        @keyframes followPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.08); }
          70%  { transform: scale(0.96); }
          100% { transform: scale(1); }
        }
      `}</style>

      <button
        onClick={handleToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: compact ? "0" : "6px",
          background: bg,
          border: `1px solid ${borderColor}`,
          borderRadius: "100px",
          padding: compact ? "0" : "0 18px",
          height: "44px",
          minHeight: "44px",
          width: compact ? "44px" : "auto",
          minWidth: compact ? "44px" : "110px",
          cursor: loading ? "not-allowed" : "pointer",
          WebkitTapHighlightColor: "transparent",
          color: textColor,
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: "14px",
          transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: !following
            ? "0 4px 20px rgba(255,59,92,0.3)"
            : "none",
          animation: following && !hovered ? "followPop 0.4s ease" : "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
        title={compact ? label : undefined}
      >
        {loading ? (
          <Loader2
            size={16}
            style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}
          />
        ) : following ? (
          isUnfollowHover ? (
            <>
              {!compact && <span style={{ fontSize: "13px" }}>{label}</span>}
            </>
          ) : (
            <>
              <UserCheck size={16} style={{ flexShrink: 0 }} />
              {!compact && <span>{label}</span>}
            </>
          )
        ) : (
          <>
            <UserPlus size={16} style={{ flexShrink: 0 }} />
            {!compact && <span>{label}</span>}
          </>
        )}
        {/* Follower count */}
        {!compact && followerCount > 0 && !loading && (
          <span style={{
            fontSize: "11px",
            fontWeight: 600,
            opacity: 0.5,
            marginLeft: following ? "4px" : "0",
            flexShrink: 0,
          }}>
            {followerCount}
          </span>
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export { FollowButton };
