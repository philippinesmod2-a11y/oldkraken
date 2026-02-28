'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/store';
import { ArrowLeft, Bell, Globe, Shield, LogOut, AlertTriangle, CheckCircle, Mail } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState({
    deposits: true, withdrawals: true, security: true, news: false, marketing: false,
  });
  const [saved, setSaved] = useState(false);
  const { t } = useI18n();

  function saveSettings() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <>
      <div className="max-w-4xl">
        <div className="mb-3">
          <div>
            <h1 className="text-base font-bold text-white">{t('settings_page.title')}</h1>
            <p className="text-dark-400 text-sm">{t('settings_page.subtitle')}</p>
          </div>
        </div>

        {saved && (
          <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-xl mb-6">
            <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
            <p className="text-green-300 text-sm">{t('settings_page.settings_saved')}</p>
          </div>
        )}

        {/* Account Overview */}
        <div className="glass-card mb-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-primary-400" /> {t('settings_page.overview')}</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Account Email', value: user?.email || '—' },
              { label: 'Account Role', value: user?.role || 'USER' },
              { label: 'Account Status', value: user?.status || 'ACTIVE' },
              { label: 'KYC Status', value: user?.kycStatus || 'NONE' },
              { label: 'Email Verified', value: user?.emailVerified ? 'Yes' : 'No' },
              { label: '2FA Status', value: user?.twoFactorEnabled ? 'Enabled ✅' : 'Disabled ⚠️' },
              { label: 'Referral Code', value: user?.referralCode || '—' },
              { label: 'Member Since', value: 'OldKraken Exchange' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-dark-800/40 last:border-0 sm:border-b-0">
                <span className="text-dark-400">{item.label}</span>
                <span className="text-white font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="glass-card mb-6">
          <h3 className="text-white font-bold mb-5 flex items-center gap-2" title="Choose which notifications you want to receive"><Bell className="w-5 h-5 text-yellow-400" /> Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { key: 'deposits', label: 'Deposit Confirmations', desc: 'Get notified when your deposits are confirmed and credited', required: true },
              { key: 'withdrawals', label: 'Withdrawal Updates', desc: 'Notifications when withdrawals are approved, rejected, or completed', required: true },
              { key: 'security', label: 'Security Alerts', desc: 'Important alerts about login activity and account security', required: true },
              { key: 'news', label: 'Platform Announcements', desc: 'Updates about new features, maintenance windows, and platform news' },
              { key: 'marketing', label: 'Promotional Emails', desc: 'Occasional emails about special offers and trading opportunities' },
            ].map((item) => (
              <div key={item.key} className="flex items-start justify-between gap-4 py-3 border-b border-dark-800/30 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white text-sm font-medium">{item.label}</p>
                    {item.required && <span className="text-xs text-dark-500 bg-dark-800 px-1.5 py-0.5 rounded">Required</span>}
                  </div>
                  <p className="text-dark-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications[item.key as keyof typeof notifications]}
                    disabled={item.required}
                    onChange={() => !item.required && setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }))}
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${notifications[item.key as keyof typeof notifications] ? 'bg-primary-600' : 'bg-dark-700'} ${item.required ? 'opacity-60' : ''} after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5`} />
                </label>
              </div>
            ))}
          </div>
          <button onClick={saveSettings} className="btn-primary !py-2.5 !px-6 mt-4">Save Preferences</button>
        </div>

        {/* Language & Region */}
        <div className="glass-card mb-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2" title="Change your display language and regional preferences"><Globe className="w-5 h-5 text-cyan-400" /> Language & Region</h3>
          <p className="text-dark-400 text-sm mb-3">Language preferences are managed on the homepage using the language switcher in the navigation bar.</p>
          <Link href="/" className="btn-secondary text-sm !py-2 !px-4 inline-flex items-center gap-2">
            Change Language →
          </Link>
        </div>

        {/* Danger Zone */}
        <div className="glass-card border border-red-500/20">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-red-400" title="Sensitive account actions — proceed with caution"><AlertTriangle className="w-5 h-5" /> Account Actions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl">
              <div>
                <p className="text-white text-sm font-medium">Sign Out</p>
                <p className="text-dark-400 text-xs mt-0.5">Log out of your current session</p>
              </div>
              <button onClick={logout} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-medium transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl">
              <div>
                <p className="text-white text-sm font-medium">Close Account</p>
                <p className="text-dark-400 text-xs mt-0.5">Permanently close your account and withdraw all funds first</p>
              </div>
              <a href="mailto:support@oldkraken.com?subject=Account Closure Request" className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors flex items-center gap-2">
                <Mail className="w-4 h-4" /> Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
