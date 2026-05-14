'use client';

import { useState } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';

interface FollowButtonProps {
  userId: string;
  initialFollowing: boolean;
  initialCount: number;
  size?: 'sm' | 'md';
  onToggle?: (following: boolean, count: number) => void;
}

export function FollowButton({
  userId,
  initialFollowing,
  initialCount,
  size = 'md',
  onToggle,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const newFollowing = !following;
    const newCount = newFollowing ? count + 1 : count - 1;
    setFollowing(newFollowing);
    setCount(newCount);

    try {
      const response = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        // Revert on error
        setFollowing(following);
        setCount(count);
      } else {
        const data = await response.json();
        setCount(data.count);
        onToggle?.(data.following, data.count);
      }
    } catch {
      // Revert on error
      setFollowing(following);
      setCount(count);
    }

    setLoading(false);
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${sizeClasses[size]} rounded-full font-semibold transition-all flex items-center gap-2 ${
        following
          ? 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
          : 'bg-[#FF3B5C] text-white hover:bg-[#e63552]'
      } disabled:opacity-50`}
    >
      {following ? (
        <>
          <UserMinus size={size === 'sm' ? 14 : 16} />
          Ne plus suivre
        </>
      ) : (
        <>
          <UserPlus size={size === 'sm' ? 14 : 16} />
          Suivre
        </>
      )}
    </button>
  );
}
