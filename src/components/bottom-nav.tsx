'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, PlusCircle, Trophy, TrendingUp, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UploadActionSheet } from '@/components/upload-action-sheet';

const MOBILE_BREAKPOINT = 768;

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
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const handleUploadTap = useCallback(() => {
    if (!user) {
      try { sessionStorage.setItem('drip_login_redirect', '/upload'); } catch { /* ignore */ }
      router.push('/login');
      return;
    }
    if (isMobile) {
      setUploadOpen(true);
    } else {
      router.push('/upload');
    }
  }, [user, isMobile, router]);

  const handleFile = useCallback((file: File) => {
    file.arrayBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: file.type });
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        sessionStorage.setItem('drip_pending_upload', dataUrl);
        sessionStorage.setItem('drip_pending_upload_type', file.type);
        setUploadOpen(false);
        router.push('/upload');
      };
      reader.readAsDataURL(blob);
    });
  }, [router]);

  useEffect(() => {
    if (!uploadOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUploadOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [uploadOpen]);

  return (
    <>
      <UploadActionSheet open={uploadOpen} onClose={() => setUploadOpen(false)} onFile={handleFile} />

      <nav
        style={{
          position: 'fixed',
          left: '16px',
          right: '16px',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
          zIndex: 100,
          background: 'rgba(12,12,16,0.85)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '32px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '8px 6px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.05) inset',
          maxWidth: '520px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 58px 1fr 1fr',
            alignItems: 'end',
            gap: '4px',
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

          <button
            onClick={handleUploadTap}
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
              border: 'none',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              transform: 'translateY(-8px)',
            }}
          >
            <PlusCircle size={26} />
          </button>

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

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}
