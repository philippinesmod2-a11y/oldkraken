'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const STATS = [
  { value: '$2.4B+', label: 'Assets Recovered' },
  { value: '10M+', label: 'Global Clients' },
  { value: '190+', label: 'Countries' },
  { value: '13+', label: 'Years Operating' },
];

const REVIEWS = [
  { name: 'Marcus T.', country: 'Germany', text: 'OldKraken recovered my lost Bitcoin from 2013. I thought it was gone forever. The process was professional and transparent.', amount: '3.2 BTC', stars: 5 },
  { name: 'Sarah L.', country: 'United Kingdom', text: 'After my old exchange shut down, OldKraken helped me recover my Ethereum. Their team kept me informed every step of the way.', amount: '47 ETH', stars: 5 },
  { name: 'Kenji M.', country: 'Japan', text: 'I was skeptical at first, but OldKraken is the real deal. Sister platform of Kraken.com — fully legitimate. Got my funds back.', amount: '1.8 BTC', stars: 5 },
  { name: 'Anna K.', country: 'Sweden', text: 'Fast and secure recovery. The 2FA security and cold storage gave me confidence. Highly recommend to anyone with lost crypto.', amount: '12,500 USDT', stars: 4 },
];

const TRUST_POINTS = [
  { icon: '🔐', title: '95% Cold Storage', desc: 'Assets secured in air-gapped cold wallets with multi-signature authorization' },
  { icon: '🛡️', title: 'Military-Grade Encryption', desc: 'AES-256 encryption protects all data in transit and at rest' },
  { icon: '📋', title: 'FinCEN Registered', desc: 'Fully compliant Money Services Business with complete audit trails' },
  { icon: '🤝', title: 'Kraken Sister Platform', desc: 'Co-founded July 2011 alongside Kraken.com — trusted by institutions worldwide' },
];

export default function SubscribeFormPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    axios.get(`${API}/marketing/forms/${slug}`)
      .then(r => {
        setForm(r.data);
        const parsed: string[] = r.data?.fields ? (() => { try { return JSON.parse(r.data.fields); } catch { return ['email']; } })() : ['email'];
        const init: Record<string, string> = {};
        parsed.forEach((f: string) => { init[f] = ''; });
        setFieldValues(init);
        setLoading(false);
      })
      .catch(() => { setError('Form not found'); setLoading(false); });
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fieldValues.email || !fieldValues.email.includes('@')) { setError('Please enter a valid email address'); return; }
    setSubmitting(true);
    setError('');
    try {
      await axios.post(`${API}/marketing/subscribe`, {
        email: fieldValues.email,
        firstName: fieldValues.firstName || undefined,
        lastName: fieldValues.lastName || undefined,
        phone: fieldValues.phone || undefined,
        formId: form?.id,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setSubmitting(false);
  }

  function fieldLabel(name: string): string {
    return name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).replace(/_/g, ' ');
  }

  function fieldType(name: string): string {
    if (name === 'email') return 'email';
    if (name === 'phone') return 'tel';
    return 'text';
  }

  function fieldPlaceholder(name: string): string {
    const map: Record<string, string> = { email: 'you@example.com', firstName: 'John', lastName: 'Doe', phone: '+1 (555) 000-0000', company: 'Acme Inc.', country: 'United States', city: 'New York' };
    return map[name] || `Enter your ${fieldLabel(name).toLowerCase()}`;
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0b1120] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );

  if (error && !form) return (
    <div className="min-h-screen bg-[#0b1120] flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-8 max-w-md w-full text-center">
        <p className="text-red-400 text-lg font-semibold mb-4">Form not found</p>
        <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium text-sm">← Go to Homepage</Link>
      </div>
    </div>
  );

  const formFields: string[] = form?.fields ? (() => { try { return JSON.parse(form.fields); } catch { return ['email']; } })() : ['email'];

  if (success) return (
    <div className="min-h-screen bg-[#0b1120] flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-8 max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">You&apos;re Almost There!</h2>
        <p className="text-gray-400 text-sm mb-6">{form?.successMsg || 'Thank you for subscribing! Please check your email to confirm your subscription.'}</p>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300">
          <p className="font-semibold mb-1">📧 Check your inbox</p>
          <p className="text-blue-400/80 text-xs">We sent a confirmation email to <strong className="text-white">{fieldValues.email}</strong>. Click the link to activate your subscription.</p>
        </div>
        <p className="text-gray-600 text-xs mt-6">Didn&apos;t receive it? Check your spam folder or try again.</p>
        <Link href="/" className="inline-block mt-4 text-blue-400 hover:text-blue-300 text-xs font-medium">← Back to OldKraken</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b1120] text-white">
      {/* Top bar */}
      <div className="bg-[#0d1526] border-b border-gray-800/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-xl">🐙</span>
            <span className="font-bold text-white text-sm">OldKraken</span>
            <span className="text-[9px] text-gray-500 border border-gray-700 rounded px-1.5 py-0.5 ml-1">Sister of Kraken.com</span>
          </Link>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="hidden sm:inline">🔒 256-bit SSL Encrypted</span>
            <span className="hidden md:inline">📍 Est. July 2011</span>
            <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium">Visit Site →</Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-5 gap-8">

          {/* LEFT SIDE — Trust content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Hero */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-green-500/20">Verified Platform</span>
                <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-blue-500/20">Since 2011</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-white leading-tight">Recover Your Lost<br />Cryptocurrency Today</h1>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-lg">OldKraken is a sister platform of <strong className="text-white">Kraken.com</strong>, co-founded in July 2011. We specialize in the recovery and restitution of lost, stolen, or inaccessible digital assets. Over <strong className="text-white">$2.4 billion</strong> in crypto recovered for clients in 190+ countries.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STATS.map(s => (
                <div key={s.label} className="bg-[#111827] border border-gray-800/60 rounded-lg p-3 text-center">
                  <div className="text-xl font-black text-blue-400">{s.value}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Trust Points */}
            <div className="grid sm:grid-cols-2 gap-3">
              {TRUST_POINTS.map(t => (
                <div key={t.title} className="flex items-start gap-3 bg-[#111827] border border-gray-800/40 rounded-lg p-3">
                  <span className="text-lg shrink-0">{t.icon}</span>
                  <div>
                    <p className="text-white text-xs font-bold">{t.title}</p>
                    <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Client Reviews */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                ⭐ Client Recovery Stories
                <span className="text-[10px] text-gray-500 font-normal">Verified reviews from recovered wallet holders</span>
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {REVIEWS.map((r, i) => (
                  <div key={i} className="bg-[#111827] border border-gray-800/40 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center text-[10px] font-bold text-blue-400">{r.name.split(' ').map(n => n[0]).join('')}</div>
                        <div>
                          <p className="text-white text-[11px] font-semibold">{r.name}</p>
                          <p className="text-gray-600 text-[9px]">{r.country}</p>
                        </div>
                      </div>
                      <span className="text-green-400 text-[10px] font-bold bg-green-500/10 px-1.5 py-0.5 rounded">{r.amount}</span>
                    </div>
                    <div className="flex gap-0.5 mb-1.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <span key={j} className={`text-[10px] ${j < r.stars ? 'text-yellow-400' : 'text-gray-700'}`}>★</span>
                      ))}
                    </div>
                    <p className="text-gray-400 text-[11px] leading-relaxed">&ldquo;{r.text}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom trust */}
            <div className="flex flex-wrap gap-4 text-[10px] text-gray-600 items-center">
              <span>🔒 AES-256 Encrypted</span>
              <span>🏛 FinCEN Registered MSB</span>
              <span>❄️ 95% Cold Storage</span>
              <span>🌍 190+ Countries Served</span>
              <span>⚡ 24/7 Monitoring</span>
            </div>
          </div>

          {/* RIGHT SIDE — Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#111827] border border-gray-800/60 rounded-xl overflow-hidden sticky top-8">
              {/* Form header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-center">
                <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">🐙</span>
                </div>
                <h2 className="text-base font-bold text-white">{form?.title || 'Get Started Today'}</h2>
                <p className="text-blue-200/80 text-xs mt-1">{form?.description || 'Enter your details to begin the recovery process'}</p>
              </div>

              {form?.topMessage && (
                <div className="px-5 pt-4 pb-0">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300 leading-relaxed whitespace-pre-line">
                    {form.topMessage}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-5 space-y-3">
                {formFields.filter(f => f !== 'email').map(fieldName => (
                  <div key={fieldName}>
                    <label className="block text-[11px] font-medium text-gray-400 mb-1">{fieldLabel(fieldName)}</label>
                    <input type={fieldType(fieldName)} value={fieldValues[fieldName] || ''} onChange={e => setFieldValues({...fieldValues, [fieldName]: e.target.value})}
                      className="w-full px-3 py-2.5 bg-[#0b1120] border border-gray-700/60 rounded-lg text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all" placeholder={fieldPlaceholder(fieldName)} />
                  </div>
                ))}

                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">Email Address <span className="text-red-400">*</span></label>
                  <input type="email" required value={fieldValues.email || ''} onChange={e => setFieldValues({...fieldValues, email: e.target.value})}
                    className="w-full px-3 py-2.5 bg-[#0b1120] border border-gray-700/60 rounded-lg text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all" placeholder="you@example.com" />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-3 rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20 active:scale-[0.98]">
                  {submitting ? 'Processing...' : (form?.buttonText || 'Start Recovery Process')}
                </button>

                <div className="flex items-center justify-center gap-3 text-[10px] text-gray-600 pt-1">
                  <span>🔒 Secure</span>
                  <span>•</span>
                  <span>No spam</span>
                  <span>•</span>
                  <span>Unsubscribe anytime</span>
                </div>
              </form>

              {/* Social proof bar */}
              <div className="border-t border-gray-800/40 px-5 py-3 bg-[#0d1526]">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1.5">
                      {['M', 'S', 'K', 'A'].map((l, i) => (
                        <div key={i} className="w-5 h-5 rounded-full bg-blue-500/20 border border-[#111827] flex items-center justify-center text-[8px] font-bold text-blue-400">{l}</div>
                      ))}
                    </div>
                    <span className="text-gray-500">2,847 joined this week</span>
                  </div>
                  <span className="text-green-400 font-medium">● Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-gray-800/30 text-center">
          <p className="text-gray-600 text-[10px]">🐙 OldKraken Exchange — Sister of Kraken.com · Co-founded July 2011 · © {new Date().getFullYear()} All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
            <Link href="/terms" className="text-gray-500 hover:text-gray-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="text-gray-500 hover:text-gray-400 transition-colors">Privacy</Link>
            <Link href="/support" className="text-gray-500 hover:text-gray-400 transition-colors">Support</Link>
            <a href="https://www.kraken.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-400 transition-colors">Kraken.com ↗</a>
          </div>
        </div>
      </div>
    </div>
  );
}
