'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';

interface UserAvatarProps {
  src?: string | null;
  username: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeValues = {
  sm: 32,
  md: 48,
  lg: 80,
};

export function UserAvatar({ src, username, size = 'md', className = '' }: UserAvatarProps) {
  const px = sizeValues[size];
  const initials = username.slice(0, 2).toUpperCase();

  const shellStyle: CSSProperties = {
    width: `${px}px`,
    height: `${px}px`,
    borderRadius: '999px',
    overflow: 'hidden',
    flexShrink: 0,
  };

  if (!src) {
    return (
      <div
        className={className}
        style={{
          ...shellStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FF3B5C, #FFC107)',
          color: '#fff',
          fontFamily: "'Syne', sans-serif",
          fontSize: size === 'lg' ? '20px' : size === 'md' ? '14px' : '12px',
          fontWeight: 800,
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={className} style={shellStyle}>
      <Image
        src={src}
        alt={username}
        width={px}
        height={px}
        sizes={`${px}px`}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}

export default UserAvatar;
