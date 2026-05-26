'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Trash2, X } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';
import { useAuth } from '@/hooks/useAuth';

interface Comment {
  id: string;
  user_id: string;
  look_id: string;
  content: string;
  created_at: string;
  profile?: { username: string; avatar_url: string };
}

export function CommentsDrawer({ lookId, open, onClose }: { lookId: string; open: boolean; onClose: () => void }) {
  const { user, session } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const loadComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/comments?lookId=${encodeURIComponent(lookId)}`, { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.comments) {
        setComments(data.comments);
        return;
      }
    } catch {}
    const stored = localStorage.getItem(`drip_comments_${lookId}`);
    setComments(stored ? JSON.parse(stored) : []);
  }, [lookId]);

  useEffect(() => {
    if (open) loadComments();
  }, [loadComments, open]);

  const addComment = async () => {
    if (!newComment.trim()) return;
    setError(null);
    setLoading(true);

    const commentText = newComment.trim();

    const token = session?.access_token;

    // Local mode or no session: save directly to localStorage
    if (!token || !user) {
      const comment: Comment = {
        id: Date.now().toString(),
        user_id: user?.id || 'local',
        look_id: lookId,
        content: commentText,
        created_at: new Date().toISOString(),
        profile: user?.user_metadata?.username
          ? {
              username: String(user.user_metadata.username),
              avatar_url: String(user.user_metadata.avatar_url || ''),
            }
          : undefined,
      };
      const updated = [...comments, comment];
      localStorage.setItem(`drip_comments_${lookId}`, JSON.stringify(updated));
      setComments(updated);
      setNewComment('');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lookId, content: commentText }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data?.localFallback) {
          // Table doesn't exist — save locally
          const comment: Comment = {
            id: Date.now().toString(),
            user_id: user?.id || 'local',
            look_id: lookId,
            content: commentText,
            created_at: new Date().toISOString(),
            profile: user?.user_metadata?.username
              ? { username: String(user.user_metadata.username), avatar_url: String(user.user_metadata.avatar_url || '') }
              : undefined,
          };
          const updated = [...comments, comment];
          localStorage.setItem(`drip_comments_${lookId}`, JSON.stringify(updated));
          setComments(updated);
          setNewComment('');
          setLoading(false);
          return;
        }
        console.error("Comment POST error:", response.status, data);
        throw new Error(data?.error || `Erreur ${response.status}`);
      }

      setComments((current) => [...current, data.comment]);
      setNewComment('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Comment POST catch:", msg);
      const comment: Comment = {
        id: Date.now().toString(),
        user_id: user?.id || 'local',
        look_id: lookId,
        content: commentText,
        created_at: new Date().toISOString(),
        profile: user?.user_metadata?.username
          ? {
              username: String(user.user_metadata.username),
              avatar_url: String(user.user_metadata.avatar_url || ''),
            }
          : undefined,
      };
      const updated = [...comments, comment];
      localStorage.setItem(`drip_comments_${lookId}`, JSON.stringify(updated));
      setComments(updated);
      setNewComment('');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    setDeletingId(commentId);
    const token = session?.access_token;

    if (!token || !user) {
      const updated = comments.filter((c) => c.id !== commentId);
      localStorage.setItem(`drip_comments_${lookId}`, JSON.stringify(updated));
      setComments(updated);
      setDeletingId(null);
      return;
    }

    try {
      const response = await fetch(`/api/comments?commentId=${encodeURIComponent(commentId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data?.localFallback) {
          const updated = comments.filter((c) => c.id !== commentId);
          localStorage.setItem(`drip_comments_${lookId}`, JSON.stringify(updated));
          setComments(updated);
          setDeletingId(null);
          return;
        }
        throw new Error(data?.error || "Impossible de supprimer le commentaire.");
      }

      setComments((current) => current.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Delete comment error:', err);
      setError("Impossible de supprimer le commentaire.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: open ? 'flex' : 'none',
        alignItems: 'flex-end',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxHeight: '80vh',
          background: '#050508',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ position: 'relative', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)', position: 'absolute', top: '8px' }} />
          <span style={{ color: 'white', fontSize: '15px', fontWeight: 600, fontFamily: "'Syne', sans-serif" }}>Commentaires</span>
          <button onClick={onClose} style={{ position: 'absolute', right: '16px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '8px 20px', overflowY: 'auto', maxHeight: 'calc(80vh - 140px)' }}>
          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
              <MessageCircle size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', fontFamily: "'Space Grotesk', sans-serif" }}>Aucun commentaire pour le moment.</p>
              <p style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>Soyez le premier à réagir.</p>
            </div>
          ) : (
            comments.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: i < comments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                {c.profile ? (
                  <UserAvatar src={c.profile.avatar_url} username={c.profile.username} size="sm" />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'white', fontSize: '13px', fontFamily: "'Syne', sans-serif", flexShrink: 0 }}>{c.profile?.username || 'Anonyme'}</span>
                    <span style={{ fontSize: '11px', color: '#555', flexShrink: 0 }}>{new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: 1.4 }}>{c.content}</p>
                  {user && c.user_id === user.id && (
                    <button
                      onClick={() => setConfirmDeleteId(c.id)}
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px',
                        borderRadius: '10px',
                        background: 'rgba(255,59,92,0.1)',
                        border: '1px solid rgba(255,59,92,0.15)',
                        color: '#FF3B5C',
                        cursor: 'pointer',
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      <Trash2 size={15} />
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '10px', alignItems: 'center', background: '#0a0a10' }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Écrire un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(); } }}
            disabled={loading}
            style={{
              flex: 1, minHeight: '44px', padding: '10px 14px',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', color: 'white', fontSize: '15px', outline: 'none',
              fontFamily: "'Space Grotesk', sans-serif",
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255,59,92,0.5)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <button onClick={addComment} disabled={loading || !newComment.trim()}
            style={{
              width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: newComment.trim() ? 'linear-gradient(135deg, #FF3B5C, #c0135e)' : 'rgba(255,255,255,0.08)',
              border: 'none', cursor: newComment.trim() ? 'pointer' : 'default', transition: 'all 0.2s',
              boxShadow: newComment.trim() ? '0 0 16px rgba(255,59,92,0.3)' : 'none',
            }}>
            <Send size={18} color={newComment.trim() ? 'white' : 'rgba(255,255,255,0.3)'} />
          </button>
        </div>
        {error && <p style={{ color: '#FF3B5C', fontSize: '12px', margin: '0 16px 12px' }}>{error}</p>}
      </div>

      {/* Confirmation de suppression */}
      {confirmDeleteId && (
        <div
          onClick={() => setConfirmDeleteId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0d0d14',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '320px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,59,92,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Trash2 size={22} color="#FF3B5C" />
            </div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '16px', fontFamily: "'Syne', sans-serif", margin: '0 0 4px' }}>
              Supprimer le commentaire ?
            </p>
            <p style={{ color: '#888', fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif", margin: '0 0 20px' }}>
              Cette action est irreversible.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const id = confirmDeleteId;
                  setConfirmDeleteId(null);
                  deleteComment(id);
                }}
                disabled={deletingId === confirmDeleteId}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FF3B5C, #c0135e)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: "'Space Grotesk', sans-serif",
                  opacity: deletingId === confirmDeleteId ? 0.5 : 1,
                }}
              >
                {deletingId === confirmDeleteId ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
