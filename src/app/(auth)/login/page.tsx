'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message || 'Erreur de connexion');
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold font-[family-name:var(--font-syne)] text-[#FF3B5C]">
            DRIP
          </h1>
          <p className="text-[#888] mt-2 font-[family-name:var(--font-space-grotesk)]">
            Connexion à ton compte
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-[#888] font-medium">
              Email ou pseudo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#FF3B5C] focus:ring-1 focus:ring-[#FF3B5C] transition-colors font-[family-name:var(--font-space-grotesk)]"
              placeholder="ton@email.com ou ton_pseudo"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-[#888] font-medium">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#FF3B5C] focus:ring-1 focus:ring-[#FF3B5C] transition-colors font-[family-name:var(--font-space-grotesk)] pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#FF3B5C] text-white font-semibold rounded-xl hover:bg-[#e63552] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-[family-name:var(--font-syne)]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Register link */}
        <p className="text-center mt-6 text-[#888] font-[family-name:var(--font-space-grotesk)]">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-[#FF3B5C] hover:underline font-medium">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
