'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import api from '@/lib/api';
import { ArrowLeft, User, Mail, Phone, Globe, Shield, CheckCircle, AlertTriangle, Lock, Copy, Gift } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', country: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user) setForm({ firstName: user.firstName || '', lastName: user.lastName || '', phone: '', country: '' });
  }, [isAuthenticated, user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.put('/users/profile', form);
      await fetchProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
    setLoading(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    if (passwordForm.newPass !== passwordForm.confirm) { setPasswordError('New passwords do not match'); return; }
    if (passwordForm.newPass.length < 8) { setPasswordError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword: passwordForm.current, newPassword: passwordForm.newPass });
      setPasswordForm({ current: '', newPass: '', confirm: '' });
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    }
    setLoading(false);
  }

  return (
    <>
      <div className="max-w-4xl">
        <div className="mb-3">
          <div>
            <h1 className="text-base font-bold text-white">{t('profile.title')}</h1>
            <p className="text-dark-400 text-sm">{t('profile.subtitle')}</p>
          </div>
        </div>

        {/* Account overview */}
        <div className="glass-card mb-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-600/20 flex items-center justify-center">
            <User className="w-8 h-8 text-primary-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg">{user?.firstName || user?.email?.split('@')[0]}</h2>
            <p className="text-dark-400 text-sm flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {user?.email}</p>
          </div>
          <div className="flex flex-col gap-2 text-right">
            <span className={`badge-${user?.status === 'ACTIVE' ? 'green' : 'red'} text-xs`}>{user?.status}</span>
            <span className="text-xs text-dark-400">KYC: <span className={user?.kycStatus === 'APPROVED' ? 'text-green-400' : 'text-yellow-400'}>{user?.kycStatus || 'NONE'}</span></span>
            <span className="text-xs text-dark-400">2FA: <span className={user?.twoFactorEnabled ? 'text-green-400' : 'text-red-400'}>{user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span></span>
          </div>
        </div>

        {/* Security alerts */}
        {!user?.twoFactorEnabled && (
          <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-6">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-300 text-sm font-semibold">Two-Factor Authentication Not Enabled</p>
              <p className="text-yellow-400/70 text-xs mt-1">We strongly recommend enabling 2FA to protect your account from unauthorized access.</p>
            </div>
          </div>
        )}

        {/* Personal Info */}
        <div className="glass-card mb-6">
          <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2" title="Update your name and personal details">
            <User className="w-5 h-5 text-primary-400" /> Personal Information
          </h3>
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4"><p className="text-red-400 text-sm">{error}</p></div>}
          {saved && <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4"><p className="text-green-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Profile updated successfully</p></div>}
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-dark-300 mb-2 font-medium">First Name</label>
                <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input-field" placeholder="John" />
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-2 font-medium">Last Name</label>
                <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input-field" placeholder="Doe" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-2 font-medium">Email Address <span className="text-dark-500">(cannot be changed here)</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input type="email" value={user?.email || ''} disabled className="input-field !pl-10 opacity-60 cursor-not-allowed" />
              </div>
              <p className="text-xs text-dark-500 mt-1">To change your email, contact support@oldkraken.com</p>
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-2 font-medium">Phone Number <span className="text-dark-500">(optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field !pl-10" placeholder="+1 555 000 0000" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-2 font-medium">Country</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="input-field !pl-10" placeholder="United States" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary !py-2.5 !px-6 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="glass-card mb-6">
          <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2" title="Update your account password">
            <Lock className="w-5 h-5 text-yellow-400" /> Change Password
          </h3>
          {passwordError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4"><p className="text-red-400 text-sm">{passwordError}</p></div>}
          {passwordSaved && <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4"><p className="text-green-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Password changed successfully</p></div>}
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-dark-300 mb-2 font-medium">Current Password</label>
              <input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-2 font-medium">New Password <span className="text-dark-500">(min. 8 characters)</span></label>
              <input type="password" value={passwordForm.newPass} onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-2 font-medium">Confirm New Password</label>
              <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} className="input-field" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary !py-2.5 !px-6 disabled:opacity-50">
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Referral Code */}
        {user?.referralCode && (
          <div className="glass-card mb-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2" title="Share your code and earn referral rewards">
              <Gift className="w-5 h-5 text-primary-400" /> Referral Program
            </h3>
            <p className="text-dark-400 text-sm mb-4">Share your referral code with friends. When they sign up, both of you benefit from the OldKraken rewards program.</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-dark-800 rounded-lg px-4 py-3 flex items-center justify-between">
                <code className="text-white font-mono text-lg font-bold tracking-widest">{user.referralCode}</code>
                <button onClick={() => {
                  navigator.clipboard.writeText(user?.referralCode || '');
                  setCopiedRef(true);
                  setTimeout(() => setCopiedRef(false), 2000);
                }} className="text-dark-400 hover:text-white transition-colors ml-3">
                  {copiedRef ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <button onClick={() => {
                navigator.clipboard.writeText(`Join OldKraken — Sister of Kraken.com — with my referral code: ${user?.referralCode}\nhttps://oldkraken.com/register?ref=${user?.referralCode}`);
                setCopiedRef(true);
                setTimeout(() => setCopiedRef(false), 2000);
              }} className="btn-secondary !py-3 !px-4 text-sm shrink-0">
                Copy Link
              </button>
            </div>
            {copiedRef && <p className="text-green-400 text-xs mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Copied to clipboard!</p>}
          </div>
        )}

        {/* KYC Verification */}
        <div className="glass-card mb-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2" title="Verify your identity to unlock full platform access">
            <Shield className="w-5 h-5 text-cyan-400" /> Identity Verification (KYC)
          </h3>
          {user?.kycStatus === 'APPROVED' ? (
            <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-green-300 font-semibold text-sm">Identity Verified</p>
                <p className="text-green-400/70 text-xs mt-1">Your identity has been verified. You have full access to all platform features including withdrawals.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-300 font-semibold text-sm">Verification Pending</p>
                  <p className="text-yellow-400/70 text-xs mt-1">To withdraw funds, you need to complete identity verification. Contact support with your ID document to get verified.</p>
                </div>
              </div>
              <div className="text-sm text-dark-400 space-y-2">
                <p className="font-medium text-dark-300">How to get verified:</p>
                <ol className="space-y-1.5 list-none">
                  <li className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-primary-600/30 text-primary-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">1</span> Email <a href="mailto:support@oldkraken.com" className="text-primary-400 hover:text-primary-300">support@oldkraken.com</a> with subject: "KYC Verification - {user?.email}"</li>
                  <li className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-primary-600/30 text-primary-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">2</span> Attach a photo of your government-issued ID (passport, driver&apos;s license, or national ID)</li>
                  <li className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-primary-600/30 text-primary-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">3</span> Include a selfie holding your ID next to a handwritten note with today&apos;s date</li>
                  <li className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-primary-600/30 text-primary-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">4</span> Verification is typically completed within 24 hours</li>
                </ol>
              </div>
              <a href="mailto:support@oldkraken.com?subject=KYC Verification" className="btn-primary inline-flex items-center gap-2 text-sm !py-2.5 !px-5">
                <Mail className="w-4 h-4" /> Start Verification Process
              </a>
            </div>
          )}
        </div>

        {/* Security info */}
        <div className="glass-card flex items-start gap-3 !p-4">
          <Shield className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-white text-sm font-semibold mb-1">Account Security Tips</p>
            <ul className="text-dark-400 text-xs space-y-1.5">
              <li>• Use a strong, unique password that you don&apos;t use anywhere else</li>
              <li>• Enable Two-Factor Authentication (2FA) for maximum security</li>
              <li>• Never share your credentials with anyone — OldKraken staff will never ask for your password</li>
              <li>• Log out after each session when using shared devices</li>
              <li>• Report any suspicious activity immediately to security@oldkraken.com</li>
            </ul>
            <div className="mt-4 pt-3 border-t border-dark-800">
              <p className="text-dark-500 text-xs">Need to close your account? <a href="mailto:support@oldkraken.com?subject=Account Closure Request" className="text-primary-400 hover:text-primary-300">Contact support →</a></p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
