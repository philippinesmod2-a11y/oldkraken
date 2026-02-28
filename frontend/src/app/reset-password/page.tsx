'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('Invalid or missing reset token. Please request a new password reset.');
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed. Token may have expired.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">🐙</span>
            <span className="text-2xl font-black text-white">OldKraken</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Reset Your Password</h1>
          <p className="text-dark-400 text-sm">Choose a new strong password for your account</p>
        </div>

        <div className="glass-card">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
              <h2 className="text-white font-bold text-lg mb-2">Password Reset!</h2>
              <p className="text-dark-400 text-sm mb-4">Your password has been changed successfully. Redirecting to login...</p>
              <Link href="/login" className="btn-primary inline-block">Login Now</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-sm text-dark-300 mb-2 font-medium">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="input-field !pl-10" placeholder="Min. 8 characters" required minLength={8} disabled={!token} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-2 font-medium">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    className="input-field !pl-10" placeholder="Repeat password" required disabled={!token} />
                </div>
              </div>
              <button type="submit" disabled={loading || !token || !password || !confirm}
                className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <div className="text-center">
                <Link href="/forgot-password" className="text-dark-400 hover:text-white text-sm">
                  Request a new reset link
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-950 flex items-center justify-center"><div className="text-dark-400">Loading...</div></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
