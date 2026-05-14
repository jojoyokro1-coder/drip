'use client';

import Image from 'next/image';

interface UserAvatarProps {
  src?: string | null;
  username: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ src, username, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-20 h-20 text-xl',
  };

  const sizeValues = {
    sm: 32,
    md: 48,
    lg: 80,
  };

  const initials = username.slice(0, 2).toUpperCase();

  if (!src) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#FF3B5C] to-[#FFC107] flex items-center justify-center font-bold text-white ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}
    >
      <Image
        src={src}
        alt={username}
        width={sizeValues[size]}
        height={sizeValues[size]}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
