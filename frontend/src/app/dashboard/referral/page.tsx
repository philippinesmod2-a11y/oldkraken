'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/store';
import { ArrowLeft, Copy, Check, Users, Gift, TrendingUp, Share2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function ReferralPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://oldkraken.com'}/register?ref=${user?.referralCode || ''}`;

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="max-w-4xl">
        <div className="mb-3">
          <div>
            <h1 className="text-base font-bold text-white">{t('referral_page.title')}</h1>
            <p className="text-dark-400 text-sm">{t('referral_page.subtitle')}</p>
          </div>
        </div>

        {/* Banner */}
        <div className="glass-card relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/40 to-cyan-900/30" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-black text-white mb-2">{t('referral_page.invite_title')}</h2>
              <p className="text-dark-300 text-sm leading-relaxed">{t('referral_page.invite_desc')}</p>
            </div>
            <div className="text-5xl">🎁</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Users, label: t('referral_page.referrals'), value: '0', color: 'text-blue-400' },
            { icon: Gift, label: t('referral_page.bonuses_earned'), value: '$0.00', color: 'text-green-400' },
            { icon: TrendingUp, label: t('referral_page.active_referrals'), value: '0', color: 'text-purple-400' },
          ].map((s, i) => (
            <div key={i} className="glass-card text-center py-5">
              <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-2`} />
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-dark-400 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Referral Code */}
        <div className="glass-card mb-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2" title="Copy and share your unique referral link or code"><Share2 className="w-5 h-5 text-primary-400" /> Your Referral Link</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-dark-400 text-xs mb-1.5 font-medium">Your Referral Code</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-dark-800 rounded-lg px-4 py-3 text-primary-400 font-mono text-lg font-bold tracking-widest select-all">
                  {user?.referralCode || 'Loading...'}
                </code>
              </div>
            </div>
            <div>
              <label className="block text-dark-400 text-xs mb-1.5 font-medium">Full Referral Link</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-dark-800 rounded-lg px-3 py-2.5 text-dark-300 font-mono text-xs break-all select-all">
                  {referralLink}
                </code>
                <button onClick={copyLink} className={`btn-${copied ? 'primary' : 'secondary'} shrink-0 !py-2.5 !px-4 flex items-center gap-2`}>
                  {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="glass-card">
          <h3 className="text-white font-bold mb-5" title="Step-by-step guide to earning referral rewards">How the Referral Program Works</h3>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Share Your Link', desc: 'Send your unique referral link or code to friends, family, or your social media followers.' },
              { step: '2', title: 'Friend Registers', desc: 'When they click your link and create a free OldKraken account, they are linked to your referral.' },
              { step: '3', title: 'First Deposit', desc: 'Once your referred friend makes their first confirmed deposit on OldKraken, the referral is activated.' },
              { step: '4', title: 'Both Earn Rewards', desc: 'You and your friend both receive referral bonuses credited directly to your accounts. Amounts are subject to our referral programme terms.' },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary-600/20 text-primary-400 text-sm font-bold flex items-center justify-center shrink-0">{s.step}</div>
                <div>
                  <p className="text-white font-medium text-sm">{s.title}</p>
                  <p className="text-dark-400 text-sm mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 p-4 bg-dark-800/50 rounded-lg">
            <p className="text-dark-400 text-xs leading-relaxed">
              <strong className="text-dark-300">Terms:</strong> Referral bonuses are subject to OldKraken&apos;s referral programme terms and conditions. Both the referrer and referee must complete identity verification to receive bonuses. Rewards are credited after the referee&apos;s first successful deposit. OldKraken reserves the right to modify or terminate the referral program at any time.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
