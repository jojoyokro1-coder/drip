'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from './user-avatar';
import { LikeButton } from './like-button';

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

export function LookCard({ look, userLiked = false, variant = 'feed' }: LookCardProps) {
  const { user } = useAuth();
  const profile = look.profile;

  // Extract hashtags from description
  const hashtags = look.description.match(/#\w+/g) || [];

  if (variant === 'grid') {
    return (
      <Link href={`/look/${look.id}`} className="block aspect-square relative group">
        <Image
          src={look.image_url}
          alt="Look"
          fill
          className="object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 text-white">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="text-sm font-medium">{look.likes_count}</span>
          </div>
        </div>
      </Link>
    );
  }

  // Feed variant - full screen style
  return (
    <div className="relative w-full h-screen max-h-screen flex-shrink-0 snap-center">
      {/* Background Image */}
      <Image
        src={look.image_url}
        alt="Look"
        fill
        className="object-cover"
        priority
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 pb-20">
        {/* User Info */}
        <Link href={`/profile/${profile?.username}`} className="flex items-center gap-3 mb-3">
          <UserAvatar
            src={profile?.avatar_url}
            username={profile?.username || 'user'}
            size="md"
          />
          <div>
            <p className="font-semibold text-white font-[family-name:var(--font-syne)]">
              @{profile?.username || 'user'}
            </p>
          </div>
        </Link>

        {/* Description */}
        {look.description && (
          <p className="text-white/90 text-sm mb-3 font-[family-name:var(--font-space-grotesk)] line-clamp-2">
            {look.description}
          </p>
        )}

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {hashtags.map((tag) => (
              <Link
                key={tag}
                href={`/trends?tag=${tag.slice(1)}`}
                className="text-[#FF3B5C] text-sm font-medium hover:underline"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6">
        <LikeButton
          lookId={look.id}
          initialLiked={userLiked}
          initialCount={look.likes_count}
        />
      </div>
    </div>
  );
}
