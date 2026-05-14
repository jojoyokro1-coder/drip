'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Le pseudo ne peut contenir que des lettres, chiffres et underscores');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, username);

    if (error) {
      setError(error.message || 'Erreur lors de l\'inscription');
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
            Crée ton compte
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
            <label htmlFor="username" className="text-sm text-[#888] font-medium">
              Pseudo
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
              minLength={3}
              maxLength={20}
              className="w-full px-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#FF3B5C] focus:ring-1 focus:ring-[#FF3B5C] transition-colors font-[family-name:var(--font-space-grotesk)]"
              placeholder="streetking"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-[#888] font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#FF3B5C] focus:ring-1 focus:ring-[#FF3B5C] transition-colors font-[family-name:var(--font-space-grotesk)]"
              placeholder="ton@email.com"
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
                minLength={6}
                className="w-full px-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#FF3B5C] focus:ring-1 focus:ring-[#FF3B5C] transition-colors font-[family-name:var(--font-space-grotesk)] pr-12"
                placeholder="Min. 6 caractères"
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

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm text-[#888] font-medium">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#FF3B5C] focus:ring-1 focus:ring-[#FF3B5C] transition-colors font-[family-name:var(--font-space-grotesk)]"
              placeholder="Confirme ton mot de passe"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#FF3B5C] text-white font-semibold rounded-xl hover:bg-[#e63552] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-[family-name:var(--font-syne)]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Inscription...
              </>
            ) : (
              'S\'inscrire'
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center mt-6 text-[#888] font-[family-name:var(--font-space-grotesk)]">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-[#FF3B5C] hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
