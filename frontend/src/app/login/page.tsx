'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import { Eye, EyeOff, Lock, Mail, Shield, CheckCircle, ExternalLink } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password, show2FA ? twoFactorCode : undefined);
      if (result.requires2FA) {
        setShow2FA(true);
        setLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-hero-pattern opacity-50" />
      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">🐙</span>
            <div className="text-left">
              <div className="text-2xl font-black text-white leading-none">OldKraken</div>
              <div className="text-xs text-primary-400">Sister of Kraken.com</div>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Sign In to Your Account</h1>
          <p className="text-dark-400 text-sm">Secure access to your cryptocurrency portfolio</p>
        </div>

        {/* Trust badges */}
        <div className="flex justify-center gap-4 mb-6">
          {[
            { icon: Shield, label: 'AES-256 Encrypted' },
            { icon: CheckCircle, label: 'FinCEN Registered' },
            { icon: Lock, label: '2FA Supported' },
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-dark-400">
              <badge.icon className="w-3.5 h-3.5 text-green-400" />
              <span>{badge.label}</span>
            </div>
          ))}
        </div>

        <div className="glass-card">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
              <span className="text-red-400 text-lg shrink-0">⚠️</span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-dark-300 mb-2 font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-field !pl-10" placeholder="you@email.com" required autoComplete="email" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-dark-300 font-medium">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input-field !pl-10 !pr-10" placeholder="••••••••" required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {show2FA && (
              <div>
                <label className="block text-sm text-dark-300 mb-2 font-medium">Two-Factor Authentication Code</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input type="text" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)}
                    className="input-field !pl-10 font-mono tracking-widest" placeholder="000000" maxLength={6} autoFocus />
                </div>
                <p className="text-xs text-dark-400 mt-1.5">Enter the 6-digit code from your authenticator app (Google Authenticator / Authy)</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full !py-3 disabled:opacity-50 disabled:cursor-not-allowed text-base font-semibold">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </span>
              ) : 'Sign In to OldKraken'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-dark-800">
            <p className="text-dark-400 text-sm text-center">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary-400 hover:text-primary-300 font-semibold">Create Free Account</Link>
            </p>
          </div>
        </div>

        {/* Security footer */}
        <div className="mt-4 text-center space-y-1">
          <p className="text-dark-600 text-xs">
            🔒 Your connection is encrypted with TLS 1.3
          </p>
          <p className="text-dark-600 text-xs">
            Sister of{' '}
            <a href="https://www.kraken.com" target="_blank" rel="noopener noreferrer" className="text-dark-500 hover:text-dark-300 inline-flex items-center gap-0.5">
              Kraken.com <ExternalLink className="w-2.5 h-2.5" />
            </a>
            {' '}· Co-founded July 2011 · FinCEN Registered
          </p>
        </div>
      </div>
    </div>
  );
}
