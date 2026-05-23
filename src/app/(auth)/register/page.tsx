'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Eye, EyeOff, Zap, AtSign, Mail, Lock } from 'lucide-react';

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
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('Pseudo : lettres, chiffres et _ uniquement'); return; }
    setLoading(true);
    const { error } = await signUp(email, password, username);
    if (error) { setError(error.message || "Erreur lors de l'inscription"); setLoading(false); }
    else { router.push('/'); }
  };

  const inputStyle = {
    width: '100%', padding: '14px 16px 14px 44px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px', color: '#fff',
    fontSize: '15px', outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  };

  const labelStyle = {
    display: 'block', color: '#888', fontSize: '12px',
    fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase' as const, marginBottom: '8px',
  };

  const iconStyle = {
    position: 'absolute' as const, left: '14px', top: '50%',
    transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none' as const,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050508',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', position: 'relative', overflow: 'hidden',
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
    }}>
      {/* Glows */}
      <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255,59,92,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(120,40,200,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,59,92,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,59,92,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #FF3B5C, #c0135e)', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,59,92,0.5)' }}>
              <Zap size={20} color="white" fill="white" />
            </div>
            <h1 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: '38px', fontWeight: 800, background: 'linear-gradient(135deg, #ffffff 30%, #FF3B5C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, letterSpacing: '-1px' }}>DRIP</h1>
          </div>
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Rejoins la communauté streetwear</p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px 28px', backdropFilter: 'blur(20px)', boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 24px 0' }}>Créer un compte</h2>

          {error && (
            <div style={{ background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.3)', color: '#FF3B5C', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Username */}
            <div>
              <label style={labelStyle}>Pseudo</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle}><AtSign size={16} /></span>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} required minLength={3} maxLength={20} placeholder="streetking" style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(255,59,92,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,59,92,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle}><Mail size={16} /></span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="ton@email.com" style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(255,59,92,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,59,92,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle}><Lock size={16} /></span>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min. 6 caractères" style={{ ...inputStyle, paddingRight: '48px' }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(255,59,92,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,59,92,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '4px' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={labelStyle}>Confirmer</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle}><Lock size={16} /></span>
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Répète ton mot de passe" style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(255,59,92,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,59,92,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', background: loading ? 'rgba(255,59,92,0.5)' : 'linear-gradient(135deg, #FF3B5C, #c0135e)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '16px', fontWeight: 700, fontFamily: "'Syne', system-ui, sans-serif", cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: loading ? 'none' : '0 8px 24px rgba(255,59,92,0.4)', marginTop: '8px', letterSpacing: '0.02em' }}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> Inscription...</> : "Créer mon compte →"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#555', fontSize: '14px' }}>
          Déjà un compte ?{' '}
          <Link href="/login" style={{ color: '#FF3B5C', textDecoration: 'none', fontWeight: 600 }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
