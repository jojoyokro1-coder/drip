'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LogoutPage() {
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    const run = async () => {
      await signOut();
      localStorage.removeItem('drip_local_users');
      localStorage.removeItem('drip_local_current_user');
      router.replace('/login');
    };

    void run();
  }, [router, signOut]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <p className="text-sm text-[#888]">Deconnexion en cours...</p>
    </div>
  );
}
