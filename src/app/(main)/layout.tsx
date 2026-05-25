'use client';

import { BottomNav } from '@/components/bottom-nav';
import { NotificationsButton } from '@/components/notifications-button';
import { PageTransition } from '@/components/page-transition';
import { usePathname } from 'next/navigation';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#050508",
        paddingBottom: isAdminRoute ? 0 : "calc(92px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <PageTransition>{children}</PageTransition>
      {!isAdminRoute && <NotificationsButton />}
      {!isAdminRoute && <BottomNav />}
    </div>
  );
}
