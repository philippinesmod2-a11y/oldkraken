'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/store';

function MagicLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens } = useAuth();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Magic link is invalid or expired');
      setProcessing(false);
      return;
    }

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setTokens(accessToken, refreshToken);
      router.push('/dashboard');
    } else {
      setError('Invalid magic link');
      setProcessing(false);
    }
  }, [searchParams, router, setTokens]);

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="glass-card text-center max-w-md w-full">
        {processing ? (
          <>
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Logging you in...</h1>
            <p className="text-dark-400">Please wait while we authenticate your session.</p>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Login Failed</h1>
            <p className="text-red-400 mb-6">{error}</p>
            <button onClick={() => router.push('/login')} className="btn-primary">Go to Login</button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function MagicLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MagicLoginContent />
    </Suspense>
  );
}
