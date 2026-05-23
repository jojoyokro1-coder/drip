'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, PlusCircle, Trophy, TrendingUp, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
const navLabelStyle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  lineHeight: 1,
};

function navItemStyle(active: boolean): CSSProperties {
  return {
    minHeight: '44px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    padding: '5px 4px',
    color: active ? '#FF3B5C' : 'rgba(255,255,255,0.55)',
    textDecoration: 'none',
    borderRadius: '14px',
    WebkitTapHighlightColor: 'transparent',
    transition: 'color 160ms ease, background 160ms ease',
  };
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const username = user?.user_metadata?.username as string | undefined;
  const profileHref = username ? `/profile/${username}` : '/profile/edit';

  return (
    <nav
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        background: 'rgba(5,5,8,0.88)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        padding: '10px 10px calc(env(safe-area-inset-bottom) + 10px)',
        boxShadow: '0 -16px 40px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 58px 1fr 1fr',
          alignItems: 'end',
          gap: '4px',
          maxWidth: '520px',
          margin: '0 auto',
        }}
      >
        <Link href="/" style={navItemStyle(pathname === '/')}>
          <Home size={22} fill={pathname === '/' ? 'currentColor' : 'none'} />
          <span style={navLabelStyle}>Feed</span>
        </Link>

        <Link href="/ranking" style={navItemStyle(pathname === '/ranking')}>
          <Trophy size={22} fill={pathname === '/ranking' ? 'currentColor' : 'none'} />
          <span style={navLabelStyle}>Top</span>
        </Link>

        <Link
          href={user ? '/upload' : '/login'}
          aria-label="Poster un look"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            minHeight: '44px',
            borderRadius: '999px',
            color: '#fff',
            background: 'linear-gradient(135deg, #FF3B5C, #c0135e)',
            boxShadow: '0 0 28px rgba(255,59,92,0.46)',
            textDecoration: 'none',
            WebkitTapHighlightColor: 'transparent',
            transform: 'translateY(-8px)',
          }}
        >
          <PlusCircle size={26} />
        </Link>

        <Link href="/trends" style={navItemStyle(pathname.startsWith('/trends'))}>
          <TrendingUp size={22} />
          <span style={navLabelStyle}>Trends</span>
        </Link>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
          <Link href={user ? profileHref : '/login'} style={navItemStyle(pathname.startsWith('/profile'))}>
            <User size={22} fill={pathname.startsWith('/profile') ? 'currentColor' : 'none'} />
            <span style={navLabelStyle}>Profil</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
