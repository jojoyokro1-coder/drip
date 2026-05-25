"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isLocalSaved, toggleLocalSave } from "@/lib/local-saves";
import LikeButton from "@/components/like-button";
import FollowButton from "@/components/follow-button";
import UserAvatar from "@/components/user-avatar";
import { CommentsDrawer } from "@/components/comments-drawer";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Share2, Bookmark, MoreHorizontal,
  MessageCircle, Calendar, Trash2
} from "lucide-react";

interface Look {
  id: string;
  image_url: string;
  description: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
    bio: string | null;
  };
}

interface HeartAnimation {
  id: number;
  x: number;
  y: number;
  rotate: number;
}

export default function LookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [look, setLook] = useState<Look | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [hearts, setHearts] = useState<HeartAnimation[]>([]);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const lastTap = useRef<number>(0);

  useEffect(() => {
    if (look) setSaved(isLocalSaved(look.id));
  }, [look]);

  useEffect(() => {
    if (look) {
      setLikesCount(Math.max(0, look.likes_count || 0));
    }
  }, [look]);

  useEffect(() => {
    if (!look || !user) return;
    supabase
      .from("likes")
      .select("id")
      .eq("look_id", look.id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [look, user]);

  const handleLikeToggle = async () => {
    if (!look || !user || likeLoading) return;
    setLikeLoading(true);

    const isLiking = !liked;
    const previousCount = Math.max(0, likesCount);
    const nextCount = isLiking ? previousCount + 1 : Math.max(0, previousCount - 1);
    setLiked(isLiking);
    setLikesCount(nextCount);

    try {
      if (isLiking) {
        await supabase.from("likes").insert({ look_id: look.id, user_id: user.id });
      } else {
        await supabase.from("likes").delete().eq("look_id", look.id).eq("user_id", user.id);
      }
      await supabase.from("looks").update({ likes_count: nextCount }).eq("id", look.id);
    } catch (err) {
      console.error("Error toggling like:", err);
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
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      handleDoubleTap(x, y);
    }
    lastTap.current = now;
  };

  const handleDoubleTap = async (x: number, y: number) => {
    if (!look || !user) return;

    const newHeart = {
      id: Date.now() + Math.random(),
      x,
      y,
      rotate: Math.random() * 30 - 15,
    };
    setHearts((prev) => [...prev, newHeart]);

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 800);

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(40);
    }

    if (!liked) {
        setLikeLoading(true);
        setLiked(true);
        setLikesCount((c) => c + 1);
      try {
        await supabase.from("likes").insert({ look_id: look.id, user_id: user.id });
        await supabase.from("looks").update({ likes_count: Math.max(0, likesCount) + 1 }).eq("id", look.id);
      } catch (err) {
        console.error("Error liking via double tap:", err);
        setLiked(false);
        setLikesCount((c) => Math.max(0, c - 1));
      } finally {
        setLikeLoading(false);
      }
    }
  };

  useEffect(() => {
    const fetchLook = async () => {
      const { data, error } = await supabase
        .from("looks")
        .select(`*, profiles(username, avatar_url, bio)`)
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setLook(data as Look);
      }
      setLoading(false);
    };
    fetchLook();
  }, [id]);

  useEffect(() => {
    if (!look) return;
    const stored = localStorage.getItem(`drip_comments_${look.id}`);
    if (stored) {
      try { setCommentCount(JSON.parse(stored).length); } catch { setCommentCount(0); }
    } else {
      fetch(`/api/comments?lookId=${encodeURIComponent(look.id)}`, { cache: 'no-store' })
        .then(r => r.json().then(d => setCommentCount(d.comments?.length || 0)).catch(() => {}))
        .catch(() => {});
    }
  }, [look]);

  const handleDelete = async () => {
    if (!look || !user || user.id !== look.user_id) return;
    if (!confirm("Supprimer ce look définitivement ?")) return;

    setDeleting(true);
    await supabase.from("looks").delete().eq("id", look.id);
    router.push("/");
  };

  const handleShare = async () => {
    try {
      const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      await navigator.share({
        title: `Look de @${look?.profiles.username} sur DRIP`,
        url: `${base}/look/${look?.id}`,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleSave = () => {
    if (!look) return;
    const now = toggleLocalSave(look.id, { image_url: look.image_url });
    setSaved(now);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  const extractHashtags = (text: string) => {
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, i) =>
      part.startsWith("#") ? (
        <span key={i} style={{ color: "#FF3B5C", fontWeight: 600 }}>{part}</span>
      ) : part
    );
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100dvh", background: "#050508",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "16px",
      }}>
        <div style={{
          width: "40px", height: "40px",
          border: "2px solid rgba(255,59,92,0.2)",
          borderTopColor: "#FF3B5C",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !look) {
    return (
      <div style={{
        minHeight: "100dvh", background: "#050508", color: "#fff",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: "16px", padding: "24px",
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        <p style={{ fontSize: "48px" }}>👕</p>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "24px", fontWeight: 800 }}>
          Look introuvable
        </h2>
        <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
          Ce look n'existe plus ou a été supprimé.
        </p>
        <button
          onClick={() => router.push("/")}
          style={{
            background: "linear-gradient(135deg, #FF3B5C, #ff6b84)",
            border: "none", borderRadius: "14px",
            padding: "12px 24px", color: "#fff",
            fontWeight: 700, cursor: "pointer",
          }}
        >
          Retour au feed
        </button>
      </div>
    );
  }

  const isOwner = user?.id === look.user_id;

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#050508",
      color: "#fff",
      fontFamily: "'Space Grotesk', sans-serif",
      paddingBottom: "100px",
    }}>
      {/* Header flottant */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(to bottom, rgba(5,5,8,0.9) 0%, transparent 100%)",
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "rgba(5,5,8,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "50%", width: "40px", height: "40px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff",
          }}
        >
          <ChevronLeft size={20} />
        </button>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleShare}
            style={{
              background: "rgba(5,5,8,0.7)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "50%", width: "40px", height: "40px",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff",
            }}
          >
            <Share2 size={18} />
          </button>

          {isOwner && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowOptions(!showOptions)}
                style={{
                  background: "rgba(5,5,8,0.7)", backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "50%", width: "40px", height: "40px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#fff",
                }}
              >
                <MoreHorizontal size={18} />
              </button>

              {showOptions && (
                <div style={{
                  position: "absolute", top: "48px", right: 0,
                  background: "rgba(15,15,20,0.95)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "16px", padding: "8px",
                  minWidth: "180px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                }}>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      width: "100%", background: "none", border: "none",
                      padding: "10px 14px",
                      color: "#FF3B5C", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "10px",
                      borderRadius: "10px",
                      fontSize: "14px", fontWeight: 600,
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,59,92,0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <Trash2 size={15} />
                    {deleting ? "Suppression…" : "Supprimer ce look"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image principale */}
      <div style={{ position: "relative", minHeight: "60vh" }}>
        <Image
          src={look.image_url}
          alt="Look"
          fill
          sizes="100vw"
          priority
          style={{ objectFit: "cover" }}
        />

        {/* Gradient overlay bas */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
          background: "linear-gradient(to top, #050508 0%, transparent 100%)",
        }} />
      </div>

      {/* Contenu */}
      <div style={{ padding: "24px 20px", maxWidth: "600px", margin: "0 auto" }}>

        {/* Auteur */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "20px",
        }}>
          <Link
            href={`/profile/${look.profiles.username}`}
            style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit" }}
          >
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", inset: "-2px",
                background: "linear-gradient(135deg, #FF3B5C, #7c3aed)",
                borderRadius: "50%", filter: "blur(4px)", opacity: 0.6,
              }} />
              <UserAvatar
                src={look.profiles.avatar_url}
                username={look.profiles.username}
                size="md"
              />
            </div>
            <div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px" }}>
                @{look.profiles.username}
              </p>
              {look.profiles.bio && (
                <p style={{
                  fontSize: "13px", color: "rgba(255,255,255,0.4)",
                  maxWidth: "200px", overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {look.profiles.bio}
                </p>
              )}
            </div>
          </Link>

          {!isOwner && user && (
            <FollowButton targetUserId={look.user_id} />
          )}
        </div>

        {/* Description */}
        {look.description && (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "20px",
            fontSize: "15px",
            lineHeight: "1.6",
            color: "rgba(255,255,255,0.85)",
          }}>
            {extractHashtags(look.description)}
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: "flex", alignItems: "center",
          gap: "12px", marginBottom: "24px",
        }}>
          <LikeButton lookId={look.id} initialCount={Math.max(0, look.likes_count || 0)} />

          <button
            onClick={() => setCommentOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "100px",
              padding: "10px 18px",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer", fontSize: "14px", fontWeight: 600,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            <MessageCircle size={16} />
            {commentCount > 0 ? `${commentCount}` : 'Commenter'}
          </button>

          <button
            onClick={handleSave}
            style={{
              marginLeft: "auto",
              display: "flex", alignItems: "center",
              background: saved ? "rgba(255,59,92,0.15)" : "rgba(255,255,255,0.05)",
              border: saved ? "1px solid rgba(255,59,92,0.3)" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: "100px",
              padding: "10px 14px",
              color: saved ? "#FF3B5C" : "rgba(255,255,255,0.6)",
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            <Bookmark size={16} fill={saved ? "#FF3B5C" : "none"} />
          </button>
        </div>

        {/* Date */}
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          color: "rgba(255,255,255,0.3)", fontSize: "13px",
        }}>
          <Calendar size={13} />
          Publié le {formatDate(look.created_at)}
        </div>

        {/* Autres looks de l'utilisateur */}
        <OtherLooks userId={look.user_id} currentLookId={look.id} username={look.profiles.username} />
      </div>

      <CommentsDrawer lookId={look.id} open={commentOpen} onClose={() => setCommentOpen(false)} />
    </div>
  );
}

// Composant autres looks
function OtherLooks({
  userId,
  currentLookId,
  username,
}: {
  userId: string;
  currentLookId: string;
  username: string;
}) {
  const [looks, setLooks] = useState<{ id: string; image_url: string }[]>([]);

  useEffect(() => {
    supabase
      .from("looks")
      .select("id, image_url")
      .eq("user_id", userId)
      .neq("id", currentLookId)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setLooks(data);
      });
  }, [userId, currentLookId]);

  if (looks.length === 0) return null;

  return (
    <div style={{ marginTop: "40px" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "16px",
      }}>
        <h3 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px",
        }}>
          Autres looks de @{username}
        </h3>
        <Link
          href={`/profile/${username}`}
          style={{ fontSize: "13px", color: "#FF3B5C", fontWeight: 600, textDecoration: "none" }}
        >
          Voir tout
        </Link>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "4px",
        borderRadius: "16px",
        overflow: "hidden",
      }}>
        {looks.map((l) => (
          <Link key={l.id} href={`/look/${l.id}`} style={{ aspectRatio: "1", display: "block", overflow: "hidden", position: "relative" }}>
            <Image
              src={l.image_url}
              alt="Look"
              fill
              sizes="(max-width: 768px) 33vw, 180px"
              style={{
                objectFit: "cover",
                transition: "transform 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
