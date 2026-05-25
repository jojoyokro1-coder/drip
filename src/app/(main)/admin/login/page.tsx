"use client";
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AdminLoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(data.message ?? 'Invalid password');
      }
    } catch (e) {
      setError('Network error');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-6 bg-[#111] rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-4">Admin Login</h2>
        <input
          type="password"
          placeholder="Mot de passe admin"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded px-3 py-2 bg-[#222] text-white focus:outline-none"
          required
        />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-pink-600 hover:bg-pink-500 py-2 font-medium"
        >
          Se connecter
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">Chargement...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
