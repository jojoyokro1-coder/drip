'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, Trophy, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const username = user?.user_metadata?.username as string | undefined;
  const profileHref = username ? `/profile/${username}` : '/profile/edit';

  const navItems = [
    { href: '/', icon: Home, label: 'Feed' },
    { href: '/ranking', icon: Trophy, label: 'Top' },
    { href: '/trends', icon: Home, label: 'Tendances' },
    { href: user ? profileHref : '/login', icon: User, label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#2a2a2a] z-50 safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.label === 'Profil' && pathname.startsWith('/profile'));
          const Icon = item.icon;
          const isUpload = item.href === '/upload';

          if (isUpload) {
            return (
              <Link
                key={item.href}
                href={user ? '/upload' : '/login'}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-[#FF3B5C] text-white hover:bg-[#e63552] transition-colors"
              >
                <PlusCircle size={28} />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors ${
                isActive ? 'text-[#FF3B5C]' : 'text-[#888] hover:text-white'
              }`}
            >
              <Icon size={24} className={isActive ? 'fill-current' : ''} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
