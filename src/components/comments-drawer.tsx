'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, X } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';

interface Comment {
  id: string;
  user_id: string;
  look_id: string;
  content: string;
  created_at: string;
  profile?: { username: string; avatar_url: string };
}

export function CommentsDrawer({ lookId, open, onClose }: { lookId: string; open: boolean; onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const useSupabase = !!process.env.NEXT_PUBLIC_DATABASE_URL && !process.env.NEXT_PUBLIC_DATABASE_URL.includes('example.supabase.co');

  const loadComments = async () => {
    if (useSupabase) {
      const { data } = await supabase.from('comments').select('*, profiles(username, avatar_url)').eq('look_id', lookId).order('created_at', { ascending: true });
      if (data) setComments(data as Comment[]);
    } else {
      const stored = localStorage.getItem(`drip_comments_${lookId}`);
      setComments(stored ? JSON.parse(stored) : []);
    }
  };

  useEffect(() => {
    if (open) loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lookId]);

  const addComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    const comment: Comment = {
      id: Date.now().toString(),
      user_id: 'local',
      look_id: lookId,
      content: newComment.trim(),
      created_at: new Date().toISOString(),
    };
    if (useSupabase) {
      await supabase.from('comments').insert({ look_id: lookId, content: newComment.trim() });
      await loadComments();
    } else {
      const updated = [...comments, comment];
      localStorage.setItem(`drip_comments_${lookId}`, JSON.stringify(updated));
      setComments(updated);
    }
    setNewComment('');
    setLoading(false);
  };

  return (
    <div
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
        style={{
          width: '100%',
          maxHeight: '80vh',
          background: '#050508',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ color: 'white', fontWeight: 600 }}>Commentaires</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '0 16px', overflowY: 'auto', maxHeight: 'calc(80vh - 120px)' }}>
          {comments.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
              {c.profile ? (
                <UserAvatar src={c.profile.avatar_url} username={c.profile.username} size="sm" />
              ) : (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', marginRight: '8px' }} />
              )}
              <div style={{ color: 'white' }}>
                <span style={{ fontWeight: 600, marginRight: '6px' }}>{c.profile?.username || 'Anonyme'}</span>
                <span style={{ fontSize: '13px', color: '#aaa' }}>{new Date(c.created_at).toLocaleString()}</span>
                <p style={{ margin: '4px 0' }}>{c.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Écrire un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={loading}
            style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px', color: 'white' }}
          />
          <button onClick={addComment} disabled={loading} style={{ background: '#FF3B5C', border: 'none', borderRadius: '8px', padding: '8px 12px', color: 'white' }}>
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
