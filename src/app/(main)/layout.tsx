'use client';

import { BottomNav } from '@/components/bottom-nav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
