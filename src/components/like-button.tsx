'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';

interface LikeButtonProps {
  lookId: string;
  initialLiked: boolean;
  initialCount: number;
  onToggle?: (liked: boolean, count: number) => void;
}

export function LikeButton({ lookId, initialLiked, initialCount, onToggle }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const newLiked = !liked;
    const newCount = newLiked ? count + 1 : count - 1;
    setLiked(newLiked);
    setCount(newCount);

    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookId }),
      });

      if (!response.ok) {
        // Revert on error
        setLiked(liked);
        setCount(count);
      } else {
        const data = await response.json();
        setCount(data.count);
        onToggle?.(data.liked, data.count);
      }
    } catch {
      // Revert on error
      setLiked(liked);
      setCount(count);
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex flex-col items-center gap-1 transition-transform active:scale-90"
    >
      <Heart
        size={32}
        className={`transition-all duration-200 ${
          liked
            ? 'fill-[#FF3B5C] text-[#FF3B5C] scale-110'
            : 'text-white hover:scale-110'
        }`}
      />
      <span className="text-white text-sm font-medium">{count}</span>
    </button>
  );
}
