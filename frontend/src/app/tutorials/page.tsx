'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronRight, Play, CheckCircle, ArrowUpRight, Shield, CreditCard, Bitcoin, Wallet, AlertCircle, Clock, Star } from 'lucide-react';

const YOUTUBE_VIDEOS = [
  { id: 'GmOzih6I1zs', title: 'How to Buy Bitcoin for Beginners (2024)', channel: 'Crypto Tips', duration: '12:34' },
  { id: 'Yb6825iv0Vk', title: 'How to Deposit Crypto to an Exchange — Step by Step', channel: 'CoinBureau', duration: '8:47' },
  { id: '1YyAzVmP9xQ', title: 'How to Buy Crypto with Credit Card — Full Guide', channel: 'BitBoy Crypto', duration: '10:22' },
  { id: 'rYQgy8QDEBI', title: 'Cryptocurrency Basics — What is Bitcoin?', channel: 'Simply Explained', duration: '6:15' },
];

const STEPS_BUY_CRYPTO = [
  {
    step: 1,
    icon: '📝',
    title: 'Create Your OldKraken Account',
    desc: 'Registration is free and takes less than 2 minutes.',
    details: [
      'Visit oldkraken.com and click "Create Free Account"',
      'Enter your full name, email address, and a strong password (minimum 12 characters)',
      'Check your email inbox for a verification link and click it to confirm your account',
      'Log in to your new account and enable Two-Factor Authentication (2FA) for security',
      'You are now ready to deposit cryptocurrency!',
    ],
    tip: 'Use a password manager to generate and store a unique, strong password for your account.',
  },
  {
    step: 2,
    icon: '💳',
    title: 'How to Buy Crypto with Credit Card',
    desc: 'Purchase Bitcoin, Ethereum, or USDT directly with your Visa or Mastercard.',
    details: [
      'Use a trusted external service such as MoonPay, Simplex, or Coinbase to purchase cryptocurrency with your credit/debit card',
      'Buy the cryptocurrency you want (BTC, ETH, USDT, or others) and receive it in your external wallet',
      'Once your purchase is complete, copy your external wallet address where the crypto will be sent',
      'You now have cryptocurrency ready to deposit into OldKraken',
      'Proceed to Step 3 to deposit your purchased crypto into your OldKraken account',
    ],
    tip: 'USDT (Tether) on the TRC-20 network usually has the lowest transaction fees for beginners.',
  },
  {
    step: 3,
    icon: '₿',
    title: 'Deposit Cryptocurrency to OldKraken',
    desc: 'Send your crypto to your personal OldKraken deposit address.',
    details: [
      'Log in to your OldKraken account and navigate to "Dashboard" then click "Deposit"',
      'Select the cryptocurrency you want to deposit (e.g., Bitcoin, Ethereum, USDT)',
      'Your unique deposit address will be displayed — copy this address carefully',
      'Open your external wallet or exchange and initiate a withdrawal to the OldKraken address',
      'Wait for blockchain confirmations (Bitcoin: ~30 min, Ethereum: ~5 min, USDT TRC-20: ~2 min)',
      'Your balance will appear in your OldKraken portfolio once confirmed and reviewed by our team',
    ],
    tip: 'Always double-check the deposit address before sending. Crypto transactions are irreversible.',
  },
  {
    step: 4,
    icon: '📊',
    title: 'Monitor Your Portfolio',
    desc: 'Track your holdings and watch the live crypto market.',
    details: [
      'Your OldKraken dashboard shows your complete portfolio with real-time valuations',
      'View live prices for all 200+ supported cryptocurrencies on the Markets page',
      'Check the Fear & Greed Index and BTC Dominance to understand market sentiment',
      'Review your transaction history to keep track of all deposits and withdrawals',
      'Contact our support team at any time if you have questions about your account',
    ],
    tip: 'Set up price alerts on CoinGecko or CoinMarketCap to stay informed about market movements.',
  },
];

export default function TutorialsPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <nav className="sticky top-0 z-50 glass border-b border-dark-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🐙</span>
            <div>
              <div className="text-lg font-black text-white">OldKraken</div>
              <div className="text-[10px] text-primary-400 hidden sm:block">Sister of Kraken.com</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-dark-300 hover:text-white text-sm">Home</Link>
            <Link href="/login" className="btn-secondary text-sm !py-2 !px-4">Sign In</Link>
            <Link href="/register" className="btn-primary text-sm !py-2 !px-4">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 px-4 text-center bg-gradient-to-b from-primary-900/20 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary-600/20 border border-primary-600/30 rounded-full px-4 py-1.5 mb-4">
            <Star className="w-4 h-4 text-primary-400" />
            <span className="text-primary-300 text-xs font-semibold">BEGINNER-FRIENDLY GUIDES</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            How to Buy &amp; Deposit<br />
            <span className="text-gradient">Cryptocurrency</span>
          </h1>
          <p className="text-dark-300 text-lg mb-8">
            Complete step-by-step guides to buying Bitcoin, Ethereum, and other cryptocurrencies — and depositing them to your OldKraken account safely.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="#steps" className="btn-primary !px-6 !py-3 inline-flex items-center gap-2">
              Start Learning <ChevronRight className="w-4 h-4" />
            </a>
            <a href="#videos" className="btn-secondary !px-6 !py-3 inline-flex items-center gap-2">
              Watch Videos <Play className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Quick Overview */}
      <section className="py-10 border-y border-dark-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Clock, label: 'Time to Start', value: '< 5 mins', color: 'text-blue-400' },
              { icon: CreditCard, label: 'Payment Methods', value: 'Card / Crypto', color: 'text-green-400' },
              { icon: Shield, label: 'Security', value: 'Bank-Grade', color: 'text-purple-400' },
              { icon: Bitcoin, label: 'Supported Coins', value: '200+', color: 'text-yellow-400' },
            ].map((item, i) => (
              <div key={i} className="glass-card text-center py-5">
                <item.icon className={`w-7 h-7 ${item.color} mx-auto mb-2`} />
                <div className="text-white font-bold text-lg">{item.value}</div>
                <div className="text-dark-400 text-xs">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Step by Step Guide */}
      <section id="steps" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Step-by-Step Guide</h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">Follow these steps in order to buy cryptocurrency and get it into your OldKraken account.</p>
          </div>

          {/* Step tabs */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {STEPS_BUY_CRYPTO.map((s, i) => (
              <button key={i} onClick={() => setActiveStep(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeStep === i ? 'bg-primary-600 text-white' : 'glass text-dark-300 hover:text-white'}`}>
                <span className="text-lg">{s.icon}</span>
                <span className="hidden sm:inline">Step {s.step}:</span> {s.title.split(' ').slice(0, 3).join(' ')}...
              </button>
            ))}
          </div>

          {/* Active step content */}
          <div className="glass-card !p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-5xl">{STEPS_BUY_CRYPTO[activeStep].icon}</div>
              <div>
                <div className="text-primary-400 text-sm font-semibold mb-1">STEP {STEPS_BUY_CRYPTO[activeStep].step} OF {STEPS_BUY_CRYPTO.length}</div>
                <h3 className="text-2xl font-bold text-white">{STEPS_BUY_CRYPTO[activeStep].title}</h3>
                <p className="text-dark-400 mt-1">{STEPS_BUY_CRYPTO[activeStep].desc}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {STEPS_BUY_CRYPTO[activeStep].details.map((detail, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-dark-800/40 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary-600/30 text-primary-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-dark-200 text-sm leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-yellow-200 text-sm"><strong>Pro Tip:</strong> {STEPS_BUY_CRYPTO[activeStep].tip}</p>
            </div>

            <div className="flex gap-3 mt-6">
              {activeStep > 0 && (
                <button onClick={() => setActiveStep(activeStep - 1)} className="btn-secondary !px-6 !py-2.5">← Previous Step</button>
              )}
              {activeStep < STEPS_BUY_CRYPTO.length - 1 ? (
                <button onClick={() => setActiveStep(activeStep + 1)} className="btn-primary !px-6 !py-2.5 ml-auto">Next Step →</button>
              ) : (
                <Link href="/register" className="btn-primary !px-6 !py-2.5 ml-auto inline-flex items-center gap-2">Create Account Now <ArrowUpRight className="w-4 h-4" /></Link>
              )}
            </div>
          </div>

          {/* All steps overview */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {STEPS_BUY_CRYPTO.map((s, i) => (
              <button key={i} onClick={() => setActiveStep(i)} className={`glass-card text-left p-4 transition-all hover:border-primary-600/50 ${activeStep === i ? 'border-primary-600/50' : ''}`}>
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="text-primary-400 text-xs font-semibold mb-1">STEP {s.step}</div>
                <div className="text-white font-bold text-sm mb-1">{s.title}</div>
                <div className="text-dark-400 text-xs">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Credit Card Buying Guide */}
      <section className="py-16 bg-dark-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Buying Crypto with a Credit or Debit Card</h2>
            <p className="text-dark-400 max-w-2xl mx-auto">The easiest way to get your first cryptocurrency is with a card. Here&apos;s how to do it safely.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-card">
              <CreditCard className="w-8 h-8 text-primary-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-4">Recommended Card Purchase Services</h3>
              <div className="space-y-4">
                {[
                  { name: 'MoonPay', desc: 'Simple interface, supports Visa/Mastercard. Available in 150+ countries. Fees: ~4.5%.', badge: 'Most Popular' },
                  { name: 'Simplex', desc: 'Instant processing, no chargebacks. Supports 50+ cryptocurrencies. Fees: ~3.5–5%.', badge: 'Fast' },
                  { name: 'Transak', desc: 'Global coverage, low fees in many regions. Fiat-to-crypto in minutes. Fees: ~1–5%.', badge: 'Low Fees' },
                  { name: 'Ramp Network', desc: 'Excellent European coverage. Bank transfers and cards accepted. Fees: ~2.5%.', badge: 'Europe' },
                ].map((s) => (
                  <div key={s.name} className="flex items-start gap-3 p-3 bg-dark-800/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold text-sm">{s.name}</span>
                        <span className="text-xs bg-primary-600/30 text-primary-300 px-2 py-0.5 rounded-full">{s.badge}</span>
                      </div>
                      <p className="text-dark-400 text-xs leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card">
              <Wallet className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-4">Step-by-Step: Card to OldKraken</h3>
              <div className="space-y-3">
                {[
                  'Visit MoonPay.com or your preferred card purchase service',
                  'Select USDT (TRC-20) or Bitcoin as your destination cryptocurrency',
                  'Enter the amount you want to buy in your local currency (min. $20)',
                  'Enter your credit/debit card details securely on the provider\'s site',
                  'Provide your external wallet address OR your OldKraken deposit address',
                  'Complete the purchase — crypto arrives within 5–30 minutes',
                  'Log into OldKraken, go to Deposit, and confirm receipt of funds',
                  'Your balance will be credited after our security review (usually within 1 hour)',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-dark-300 text-sm">{step}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-200 text-sm"><strong>💡 Tip:</strong> We recommend USDT on TRC-20 network for the lowest fees and fastest processing when making your first deposit to OldKraken.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Tutorials */}
      <section id="videos" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-600/30 rounded-full px-4 py-1.5 mb-4">
              <Play className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-xs font-semibold">VIDEO TUTORIALS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Watch &amp; Learn</h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">Visual step-by-step tutorials from trusted crypto educators. Click any video to watch.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {YOUTUBE_VIDEOS.map((video) => (
              <div key={video.id} className="glass-card overflow-hidden cursor-pointer group" onClick={() => setActiveVideo(activeVideo === video.id ? null : video.id)}>
                {activeVideo === video.id ? (
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="relative aspect-video bg-dark-800 overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`; }}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                        <Play className="w-7 h-7 text-white fill-white ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">{video.duration}</div>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-primary-300 transition-colors">{video.title}</h3>
                  <p className="text-dark-400 text-xs">{video.channel} · YouTube</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <a href="https://www.youtube.com/results?search_query=how+to+buy+bitcoin+2024" target="_blank" rel="noopener noreferrer" className="btn-secondary !px-6 !py-3 inline-flex items-center gap-2">
              More Video Tutorials on YouTube <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-dark-900/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'What is the minimum deposit amount?', a: 'Minimum deposits vary by cryptocurrency. For USDT, the minimum is $10 worth. For Bitcoin, the minimum is 0.0001 BTC. There is no maximum deposit limit.' },
              { q: 'How long does a deposit take?', a: 'Bitcoin deposits typically take 30–60 minutes after 3 blockchain confirmations. USDT on TRC-20 takes 5–10 minutes. Ethereum typically takes 10–20 minutes. All deposits are also reviewed by our security team, which usually adds no more than 1 hour.' },
              { q: 'Can I buy crypto with a credit card directly on OldKraken?', a: 'OldKraken currently accepts cryptocurrency deposits. To buy with a credit card, we recommend using MoonPay, Simplex, or Transak to purchase crypto and then sending it to your OldKraken deposit address.' },
              { q: 'Is my money safe on OldKraken?', a: 'Yes. OldKraken uses 95% cold storage for client funds, AES-256 encryption, two-factor authentication, and manual withdrawal review. We are a sister platform of Kraken.com — one of the most trusted exchanges since 2011.' },
              { q: 'What cryptocurrencies can I deposit?', a: 'OldKraken supports 200+ cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), USDT, USDC, BNB, Solana, XRP, Cardano, Dogecoin, and many more. Check the Deposit page for a full list.' },
              { q: 'How do I withdraw my funds?', a: 'You can request a withdrawal from your dashboard at any time. All withdrawal requests are reviewed by our security team to protect client funds. Processing usually takes 1–24 hours after request.' },
            ].map((faq, i) => (
              <div key={i} className="glass-card p-5">
                <h3 className="text-white font-semibold mb-2 flex items-start gap-2">
                  <span className="text-primary-400 shrink-0">Q:</span> {faq.q}
                </h3>
                <p className="text-dark-300 text-sm leading-relaxed pl-5"><span className="text-green-400 font-semibold">A:</span> {faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="glass-card !p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/15 to-cyan-600/15" />
            <div className="relative">
              <div className="text-4xl mb-4">🐙</div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Ready to Get Started?</h2>
              <p className="text-dark-300 mb-6">Sign in to your OldKraken account to view your recovered assets and follow the steps to withdraw your funds.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register" className="btn-primary !px-8 !py-3 inline-flex items-center justify-center gap-2">Create Free Account <ArrowUpRight className="w-4 h-4" /></Link>
                <Link href="/login" className="btn-secondary !px-8 !py-3 inline-flex items-center justify-center gap-2">Sign In to Dashboard</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-8 text-center">
        <p className="text-dark-500 text-xs">© 2011–2025 OldKraken Exchange Ltd. All Rights Reserved. Sister Platform of Kraken.com · Co-founded July 2011</p>
      </footer>
    </div>
  );
}
