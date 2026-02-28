'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/store';
import { Eye, EyeOff, Lock, Mail, User, Gift, Shield, CheckCircle, ExternalLink } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', referralCode: '' });

  useEffect(() => {
    const ref = searchParams.get('ref') || searchParams.get('referral') || searchParams.get('code');
    if (ref) setForm(prev => ({ ...prev, referralCode: ref }));
  }, [searchParams]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        referralCode: form.referralCode || undefined,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-hero-pattern opacity-50" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">🐙</span>
            <div className="text-left">
              <div className="text-2xl font-black text-white leading-none">OldKraken</div>
              <div className="text-xs text-primary-400">Sister of Kraken.com</div>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Create Your Free Account</h1>
          <p className="text-dark-400 text-sm">Join 10M+ clients on the platform co-founded in July 2011</p>
        </div>
        <div className="flex justify-center gap-4 mb-5">
          {[{ icon: Shield, label: 'Secure & Encrypted' }, { icon: CheckCircle, label: 'Free Account' }, { icon: Lock, label: '2FA Available' }].map((b, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-dark-400">
              <b.icon className="w-3.5 h-3.5 text-green-400" /><span>{b.label}</span>
            </div>
          ))}
        </div>

        <div className="glass-card">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-dark-300 mb-2 font-medium">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input type="text" value={form.firstName} onChange={(e) => updateForm('firstName', e.target.value)}
                    className="input-field !pl-10" placeholder="John" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-2 font-medium">Last Name</label>
                <input type="text" value={form.lastName} onChange={(e) => updateForm('lastName', e.target.value)}
                  className="input-field" placeholder="Doe" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2 font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)}
                  className="input-field !pl-10" placeholder="you@email.com" required />
              </div>
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2 font-medium">Password <span className="text-dark-500 font-normal">(min. 8 characters)</span></label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => updateForm('password', e.target.value)}
                  className="input-field !pl-10 !pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2 font-medium">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input type="password" value={form.confirmPassword} onChange={(e) => updateForm('confirmPassword', e.target.value)}
                  className="input-field !pl-10" placeholder="••••••••" required />
              </div>
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2 font-medium">Referral Code <span className="text-dark-500 font-normal">(optional)</span></label>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input type="text" value={form.referralCode} onChange={(e) => updateForm('referralCode', e.target.value)}
                  className="input-field !pl-10" placeholder="ABCD1234" />
              </div>
            </div>

            <p className="text-xs text-dark-500 leading-relaxed">By creating an account, you agree to our <Link href="/terms" className="text-primary-500 hover:text-primary-400">Terms of Service</Link> and <Link href="/privacy" className="text-primary-500 hover:text-primary-400">Privacy Policy</Link>.</p>
            <button type="submit" disabled={loading}
              className="btn-primary w-full !py-3 disabled:opacity-50 disabled:cursor-not-allowed text-base font-semibold">
              {loading ? (
                <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating Account...</span>
              ) : 'Create Free Account'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-dark-800">
            <p className="text-dark-400 text-sm text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-400 hover:text-primary-300 font-semibold">Sign In</Link>
            </p>
          </div>
        </div>
        <div className="mt-4 text-center space-y-1">
          <p className="text-dark-600 text-xs">🔒 Your connection is encrypted with TLS 1.3</p>
          <p className="text-dark-600 text-xs">Sister of <a href="https://www.kraken.com" target="_blank" rel="noopener noreferrer" className="text-dark-500 hover:text-dark-300 inline-flex items-center gap-0.5">Kraken.com <ExternalLink className="w-2.5 h-2.5" /></a> · Co-founded July 2011 · FinCEN Registered</p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-950 flex items-center justify-center"><div className="text-dark-400">Loading...</div></div>}>
      <RegisterForm />
    </Suspense>
  );
}
