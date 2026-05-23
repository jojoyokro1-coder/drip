'use client';

import { BottomNav } from '@/components/bottom-nav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#050508",
        paddingBottom: "120px",
        overflowX: "hidden",
      }}
    >
      {children}
      <BottomNav />
    </div>
  );
}
