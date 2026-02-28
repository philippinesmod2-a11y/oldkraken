'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import api from '@/lib/api';
import { ArrowLeft, Shield, Lock, Smartphone, CheckCircle, AlertTriangle, Eye, EyeOff, Clock, LogOut } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function SecurityPage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code2FA, setCode2FA] = useState('');
  const [disable2FACode, setDisable2FACode] = useState('');
  const [step, setStep] = useState<'idle' | 'setup' | 'verify'>('idle');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { t } = useI18n();
  const [loginHistory, setLoginHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadLoginHistory();
  }, [isAuthenticated]);

  async function loadLoginHistory() {
    try {
      const res = await api.get('/users/login-history?limit=10');
      setLoginHistory(res.data?.items || []);
    } catch {}
  }

  async function generate2FA() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/auth/2fa/generate');
      setQrCode(res.data.qrCode);
      setSecret(res.data.secret);
      setStep('setup');
    } catch (e: any) { setError(e.response?.data?.message || 'Failed'); }
    setLoading(false);
  }

  async function enable2FA() {
    if (!code2FA || code2FA.length !== 6) { setError('Enter a 6-digit code'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/2fa/enable', { code: code2FA });
      await fetchProfile();
      setStep('idle');
      setSuccess('Two-factor authentication enabled successfully!');
      setCode2FA('');
    } catch (e: any) { setError(e.response?.data?.message || 'Invalid code'); }
    setLoading(false);
  }

  async function disable2FA() {
    if (!disable2FACode || disable2FACode.length !== 6) { setError('Enter a 6-digit code'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/2fa/disable', { code: disable2FACode });
      await fetchProfile();
      setSuccess('Two-factor authentication disabled.');
      setDisable2FACode('');
    } catch (e: any) { setError(e.response?.data?.message || 'Invalid code'); }
    setLoading(false);
  }

  return (
    <>
      <div className="max-w-4xl">
        <div className="mb-3">
          <div>
            <h1 className="text-base font-bold text-white">{t('security.title')}</h1>
            <p className="text-dark-400 text-sm">{t('security.subtitle')}</p>
          </div>
        </div>

        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-xl mb-6">
            <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
            <p className="text-green-300 text-sm">{success}</p>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* 2FA Section */}
        <div className="glass-card mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <Smartphone className="w-6 h-6 text-primary-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-bold" title="Protect your account with an authenticator app">Two-Factor Authentication (2FA)</h3>
                <p className="text-dark-400 text-sm mt-0.5">Add an extra layer of security with an authenticator app</p>
              </div>
            </div>
            <span className={user?.twoFactorEnabled ? 'badge-green' : 'badge-red'}>
              {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {!user?.twoFactorEnabled && step === 'idle' && (
            <div>
              <p className="text-dark-400 text-sm mb-4 leading-relaxed">
                Two-factor authentication (2FA) significantly increases your account security. When enabled, you will need both your password and a 6-digit code from your authenticator app to log in. We recommend <strong className="text-dark-300">Google Authenticator</strong> or <strong className="text-dark-300">Authy</strong>.
              </p>
              <button onClick={generate2FA} disabled={loading} className="btn-primary !py-2.5 !px-6 disabled:opacity-50">
                {loading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
              </button>
            </div>
          )}

          {step === 'setup' && (
            <div className="space-y-4">
              <div className="p-4 bg-dark-800/50 rounded-xl">
                <p className="text-white text-sm font-semibold mb-3">Step 1: Scan QR Code</p>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {qrCode && (
                    <div className="flex flex-col items-center">
                      <img src={qrCode} alt="2FA QR Code" className="w-40 h-40 rounded-xl" />
                      <p className="text-dark-400 text-xs mt-2">Scan with your authenticator app</p>
                    </div>
                  )}
                  <div>
                    <p className="text-dark-400 text-sm mb-3">Can&apos;t scan? Enter this code manually:</p>
                    <code className="block bg-dark-900 rounded-lg px-4 py-3 text-primary-400 font-mono text-sm break-all select-all">
                      {secret}
                    </code>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-white text-sm font-semibold mb-2">Step 2: Enter verification code</p>
                <div className="flex gap-3 items-center">
                  <input type="text" value={code2FA} onChange={e => setCode2FA(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field font-mono tracking-widest text-center text-lg !py-3 !w-40"
                    placeholder="000000" maxLength={6} autoFocus />
                  <button onClick={enable2FA} disabled={loading || code2FA.length !== 6} className="btn-primary !py-3 !px-6 disabled:opacity-50">
                    {loading ? 'Verifying...' : 'Activate 2FA'}
                  </button>
                  <button onClick={() => setStep('idle')} className="btn-secondary !py-3 !px-4 text-sm">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {user?.twoFactorEnabled && (
            <div>
              <p className="text-dark-400 text-sm mb-4">Your account is protected by two-factor authentication. To disable it, enter a 6-digit code from your authenticator app.</p>
              <div className="flex gap-3 items-center">
                <input type="text" value={disable2FACode} onChange={e => setDisable2FACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field font-mono tracking-widest text-center !py-2.5 !w-36"
                  placeholder="000000" maxLength={6} />
                <button onClick={disable2FA} disabled={loading || disable2FACode.length !== 6} className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium !py-2.5 !px-5 rounded-xl transition-colors disabled:opacity-50">
                  {loading ? '...' : 'Disable 2FA'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Tips */}
        <div className="glass-card mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
            <h3 className="text-white font-bold" title="Recommended steps to keep your account safe">Security Best Practices</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: Lock, title: 'Strong Password', desc: 'Use a unique password with 12+ characters, mixing letters, numbers, and symbols.' },
              { icon: Smartphone, title: 'Enable 2FA', desc: 'Always use two-factor authentication for maximum account protection.' },
              { icon: Eye, title: 'Phishing Awareness', desc: 'Never enter your credentials on sites other than oldkraken.com. We will never ask for your password.' },
              { icon: LogOut, title: 'Logout When Done', desc: 'Always log out after each session, especially on shared or public devices.' },
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-dark-800/40 rounded-lg">
                <tip.icon className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">{tip.title}</p>
                  <p className="text-dark-400 text-xs mt-0.5 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login History */}
        <div className="glass-card">
          <div className="flex items-start gap-3 mb-4">
            <Clock className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-bold" title="Recent login attempts to your account with IP and status">Recent Login Activity</h3>
              <p className="text-dark-400 text-xs">Last 10 login attempts to your account</p>
            </div>
          </div>
          {loginHistory.length === 0 ? (
            <p className="text-dark-500 text-sm text-center py-4">No login history available</p>
          ) : (
            <div className="space-y-2">
              {loginHistory.map((entry: any, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-dark-800/30 rounded-lg">
                  <div>
                    <p className="text-dark-200 text-sm flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${entry.success ? 'bg-green-400' : 'bg-red-400'}`} />
                      {entry.success ? 'Successful login' : `Failed: ${entry.reason || 'Unknown'}`}
                    </p>
                    <p className="text-dark-500 text-xs mt-0.5">{entry.ipAddress} · {entry.userAgent?.slice(0, 40)}...</p>
                  </div>
                  <p className="text-dark-500 text-xs shrink-0 ml-3">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
