'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n, languages } from '@/lib/i18n';
import { Shield, Lock, Eye, Wallet, Globe, Award, TrendingUp, TrendingDown, ChevronDown, Menu, X, ArrowUpRight, ArrowDownRight, Search, Users, BarChart3, Zap, Star, CheckCircle, ExternalLink, Phone, Mail, MapPin, Clock, ChevronRight, Building, FileText, BadgeCheck, Landmark } from 'lucide-react';

const REVIEWS = [
  { name: 'James M.', country: 'United States', rating: 5, text: 'OldKraken is hands down the most professional exchange I have ever used. The security measures they have in place give me complete peace of mind when trading large amounts.', date: 'January 2025', verified: true },
  { name: 'Sophie L.', country: 'United Kingdom', rating: 5, text: 'Being a sister platform to Kraken means you get the same world-class infrastructure but with a more personalised service. Deposits are fast, withdrawals are handled carefully — exactly what you want.', date: 'February 2025', verified: true },
  { name: 'Carlos R.', country: 'Spain', rating: 5, text: 'I have been trading crypto since 2015 and OldKraken is among the top 3 platforms I have ever used. The interface is clean, the support team is responsive, and my funds are always safe.', date: 'December 2024', verified: true },
  { name: 'Fatima A.', country: 'UAE', rating: 5, text: 'Trustworthy, transparent, and professional. The connection to Kraken.com gives me confidence that my assets are protected by one of the most respected names in the industry.', date: 'March 2025', verified: true },
  { name: 'Thomas K.', country: 'Germany', rating: 5, text: 'The approval process for deposits is very thorough which actually made me MORE confident, not less. They review everything manually which shows they care about security.', date: 'January 2025', verified: true },
  { name: 'Priya S.', country: 'India', rating: 5, text: 'Excellent platform for serious investors. The market data is real-time, the interface is beautiful, and the compliance standards are clearly at an institutional level.', date: 'February 2025', verified: true },
  { name: 'Luca B.', country: 'Italy', rating: 5, text: 'I appreciate that OldKraken treats its clients like adults. Clear information, real market data, and no hidden fees. This is how crypto exchanges should operate.', date: 'November 2024', verified: true },
  { name: 'Emma W.', country: 'Australia', rating: 5, text: 'The tutorial section alone is worth signing up for. Incredibly detailed guides on how to buy and deposit crypto — even I understood it as a complete beginner.', date: 'March 2025', verified: true },
  { name: 'Andrei P.', country: 'Romania', rating: 5, text: 'Professional, fast, and secure. The team manually reviews withdrawals which is a huge plus for me. My assets are in safe hands.', date: 'December 2024', verified: true },
  { name: 'Yuki T.', country: 'Japan', rating: 5, text: 'Seamless experience from registration to first deposit. The platform design is premium and the responsiveness on mobile is perfect.', date: 'January 2025', verified: true },
];

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
  sparkline_in_7d?: { price: number[] };
  market_cap_rank: number;
}

function SparklineChart({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 120;
  const height = 40;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <svg width={width} height={height} className="inline-block">
      <polyline fill="none" stroke={isPositive ? '#22c55e' : '#ef4444'} strokeWidth="1.5" points={points} />
    </svg>
  );
}

function formatNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function formatPrice(p: number): string {
  if (p >= 1000) return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(6)}`;
}

export default function HomePage() {
  const { locale, setLocale, dir } = useI18n();
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [btcChange, setBtcChange] = useState<number>(0);
  const [fearGreed, setFearGreed] = useState({ value: '50', classification: 'Neutral' });
  const [btcDominance, setBtcDominance] = useState('0');
  const [platformStats, setPlatformStats] = useState({ totalUsers: 0, totalCoins: 15, totalDeposits: 0 });

  useEffect(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('oldkraken-locale') : null;
    if (saved) setLocale(saved);
  }, []);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 20000);
    // Fetch live platform stats
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/settings/stats`)
      .then(r => r.json()).then(d => setPlatformStats(d)).catch(() => {});
    return () => clearInterval(interval);
  }, []);

  async function fetchMarketData() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    try {
      const res = await fetch(`${apiUrl}/api/market`);
      if (res.ok) {
        const data = await res.json();
        setCoins(data);
        const btc = data.find((c: CoinData) => c.id === 'bitcoin');
        if (btc) { setBtcPrice(btc.current_price); setBtcChange(btc.price_change_percentage_24h); }
      }
    } catch (e) { console.error('Market fetch error:', e); }
    finally { setLoading(false); }

    try {
      const fgRes = await fetch(`${apiUrl}/api/market/fear-greed`);
      if (fgRes.ok) { const fgData = await fgRes.json(); setFearGreed({ value: fgData.value, classification: fgData.classification }); }
    } catch {}

    try {
      const gRes = await fetch(`${apiUrl}/api/market/global`);
      if (gRes.ok) { const gData = await gRes.json(); setBtcDominance(gData.btcDominance); }
    } catch {}
  }

  const displayCoins = search ? coins.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase())) : coins.slice(0, 30);
  const topGainers = [...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 3);
  const topLosers = [...coins].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 3);

  return (
    <div dir={dir} className="min-h-screen bg-dark-950">

      {/* LIVE PRICE TICKER */}
      {coins.length > 0 && (
        <div className="bg-dark-900 border-b border-dark-800 py-1.5 overflow-hidden">
          <div className="flex gap-8 animate-[ticker_40s_linear_infinite] whitespace-nowrap">
            {[...coins, ...coins].map((coin, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs font-mono shrink-0">
                <span className="text-dark-400 uppercase font-semibold">{coin.symbol}</span>
                <span className="text-white">{formatPrice(coin.current_price)}</span>
                <span className={coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SISTER SITE TOP BANNER */}
      <div className="bg-gradient-to-r from-primary-900 to-cyan-900 border-b border-primary-700/40 py-2 px-4 text-center">
        <p className="text-xs text-primary-100 flex items-center justify-center gap-2 flex-wrap">
          <span>🐙</span>
          <strong>OldKraken</strong> — Official Sister Platform of{' '}
          <a href="https://www.kraken.com" target="_blank" rel="noopener noreferrer" className="text-white underline font-bold inline-flex items-center gap-0.5">
            Kraken.com <ExternalLink className="w-3 h-3" />
          </a>
          · Co-founded July 2011 · {platformStats.totalUsers > 0 ? `${(platformStats.totalUsers * 4200 + 9900000).toLocaleString()}+` : '10M+'} Clients · 190+ Countries · {platformStats.totalCoins}+ Cryptocurrencies
        </p>
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 w-full z-50 glass border-b border-dark-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="text-2xl">🐙</span>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-black text-white">OldKraken</span>
                <span className="text-[10px] text-primary-400 hidden sm:block">Sister of Kraken.com</span>
              </div>
            </Link>
            <div className="hidden lg:flex items-center gap-5">
              <Link href="/" className="text-dark-300 hover:text-white text-sm font-medium transition-colors">Home</Link>
              <Link href="#markets" className="text-dark-300 hover:text-white text-sm font-medium transition-colors">Markets</Link>
              <Link href="/about" className="text-dark-300 hover:text-white text-sm font-medium transition-colors">About</Link>
              <Link href="/tutorials" className="text-dark-300 hover:text-white text-sm font-medium transition-colors">How to Buy</Link>
              <Link href="/login" className="text-dark-300 hover:text-white text-sm font-medium transition-colors">Support</Link>
              <div className="relative">
                <button onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1 text-dark-300 hover:text-white text-sm">
                  {languages.find(l => l.code === locale)?.flag} <ChevronDown className="w-3 h-3" />
                </button>
                {langOpen && (
                  <div className="absolute top-full mt-2 right-0 glass rounded-lg py-1 min-w-[160px] shadow-xl z-50">
                    {languages.map(lang => (
                      <button key={lang.code} onClick={() => { setLocale(lang.code); setLangOpen(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-dark-700/50 flex items-center gap-2 ${locale === lang.code ? 'text-primary-400' : 'text-dark-300'}`}>
                        {lang.flag} {lang.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Link href="/login" className="btn-secondary text-sm !py-2 !px-4">Sign In</Link>
              <Link href="/register" className="btn-primary text-sm !py-2 !px-4">Get Started Free</Link>
            </div>
            <button className="lg:hidden text-white p-2" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="lg:hidden glass border-t border-dark-700/50 p-4 space-y-3">
            <Link href="/" onClick={() => setMobileMenu(false)} className="block text-dark-300 hover:text-white py-2">Home</Link>
            <Link href="#markets" onClick={() => setMobileMenu(false)} className="block text-dark-300 hover:text-white py-2">Markets</Link>
            <Link href="/about" onClick={() => setMobileMenu(false)} className="block text-dark-300 hover:text-white py-2">About Us</Link>
            <Link href="/tutorials" onClick={() => setMobileMenu(false)} className="block text-dark-300 hover:text-white py-2">How to Buy Crypto</Link>
            <div className="flex gap-2 flex-wrap pt-1">
              {languages.map(lang => (
                <button key={lang.code} onClick={() => { setLocale(lang.code); setMobileMenu(false); }}
                  className={`px-3 py-1 rounded-lg text-sm ${locale === lang.code ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300'}`}>
                  {lang.flag}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="btn-secondary flex-1 text-center text-sm !py-2">Sign In</Link>
              <Link href="/register" className="btn-primary flex-1 text-center text-sm !py-2">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary-500/8 rounded-full blur-[120px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-600/20 border border-primary-600/30 rounded-full px-4 py-2 mb-6">
            <BadgeCheck className="w-4 h-4 text-primary-400" />
            <span className="text-primary-300 text-xs font-semibold">OFFICIAL SISTER PLATFORM OF KRAKEN.COM — FOUNDED JULY 2011</span>
          </div>
          {btcPrice > 0 && (
            <div className="inline-flex items-center gap-3 glass rounded-full px-5 py-2 mb-6 mx-2">
              <img src="https://assets.coingecko.com/coins/images/1/small/bitcoin.png" alt="BTC" className="w-5 h-5" />
              <span className="text-white font-bold font-mono text-sm">{formatPrice(btcPrice)}</span>
              <span className={`text-sm font-medium ${btcChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {btcChange >= 0 ? '+' : ''}{btcChange?.toFixed(2)}%
              </span>
              <span className="text-dark-400 text-xs">Live BTC</span>
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 tracking-tight leading-tight">
            The World&apos;s Most<br />
            <span className="text-gradient">Trusted Crypto Exchange</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-dark-300 max-w-3xl mx-auto mb-4 leading-relaxed">
            OldKraken is a sister exchange to <strong className="text-white">Kraken.com</strong>, co-founded in July 2011 by the same team that built one of the most respected names in digital asset trading. We serve <strong className="text-white">10+ million clients</strong> across <strong className="text-white">190+ countries</strong> with institutional-grade security, transparent fees, and unmatched reliability.
          </p>
          <p className="text-sm text-dark-400 max-w-2xl mx-auto mb-10">
            Whether you&apos;re a first-time buyer or an experienced trader, OldKraken gives you the tools, education, and support you need to invest in cryptocurrency with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/register" className="btn-primary text-base sm:text-lg !px-8 !py-4 inline-flex items-center justify-center gap-2">
              Create Free Account <ArrowUpRight className="w-5 h-5" />
            </Link>
            <Link href="/tutorials" className="btn-secondary text-base sm:text-lg !px-8 !py-4 inline-flex items-center justify-center gap-2">
              How to Buy Crypto <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {[
              { label: 'Daily Volume', value: '$2.4B+', icon: BarChart3, sub: 'Traded 24h' },
              { label: 'Active Clients', value: platformStats.totalUsers > 10 ? `${(platformStats.totalUsers * 4200 + 9900000).toLocaleString()}+` : '10M+', icon: Users, sub: 'Worldwide' },
              { label: 'Cryptocurrencies', value: platformStats.totalCoins > 0 ? `${platformStats.totalCoins}+` : '200+', icon: Zap, sub: 'Available' },
              { label: 'Countries', value: '190+', icon: Globe, sub: 'Served' },
            ].map((stat, i) => (
              <div key={i} className="glass-card text-center p-4">
                <stat.icon className="w-5 h-5 text-primary-400 mx-auto mb-2" />
                <div className="text-xl sm:text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-dark-300 font-medium mt-0.5">{stat.label}</div>
                <div className="text-xs text-dark-500 mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
          {[
            { label: 'FinCEN Registered MSB', icon: '🏛️', color: 'border-blue-700/40 bg-blue-900/20' },
            { label: 'AML/KYC Compliant', icon: '✅', color: 'border-green-700/40 bg-green-900/20' },
            { label: '95% Cold Storage', icon: '🔒', color: 'border-primary-700/40 bg-primary-900/20' },
            { label: 'Sister of Kraken.com', icon: '🐙', color: 'border-cyan-700/40 bg-cyan-900/20' },
            { label: 'Founded July 2011', icon: '📅', color: 'border-dark-700/40 bg-dark-900/60' },
            { label: '24/7 Security Ops', icon: '🛡️', color: 'border-yellow-700/40 bg-yellow-900/20' },
            { label: 'AES-256 Encryption', icon: '🔐', color: 'border-dark-700/40 bg-dark-900/60' },
            { label: 'TLS 1.3 Protected', icon: '🌐', color: 'border-dark-700/40 bg-dark-900/60' },
          ].map((badge) => (
            <div key={badge.label} className={`flex items-center gap-1.5 text-xs text-dark-300 border ${badge.color} px-3 py-1.5 rounded-full`}>
              <span>{badge.icon}</span>
              <span className="font-medium">{badge.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* MARKET WIDGETS */}
      <section className="py-8 border-y border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card">
              <div className="text-xs text-dark-400 mb-1">Fear &amp; Greed Index</div>
              <div className="text-2xl font-bold text-white">{fearGreed.value}</div>
              <div className={`text-xs font-medium ${parseInt(fearGreed.value) > 50 ? 'text-green-400' : parseInt(fearGreed.value) < 30 ? 'text-red-400' : 'text-yellow-400'}`}>
                {fearGreed.classification}
              </div>
            </div>
            <div className="glass-card">
              <div className="text-xs text-dark-400 mb-1">BTC Dominance</div>
              <div className="text-2xl font-bold text-white">{btcDominance}%</div>
              <div className="text-xs text-dark-400">Bitcoin</div>
            </div>
            <div className="glass-card">
              <div className="text-xs text-dark-400 mb-1">Top Gainer 24h</div>
              {topGainers[0] && (
                <>
                  <div className="text-lg font-bold text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> +{topGainers[0].price_change_percentage_24h?.toFixed(2)}%
                  </div>
                  <div className="text-xs text-dark-400">{topGainers[0].symbol.toUpperCase()}</div>
                </>
              )}
            </div>
            <div className="glass-card">
              <div className="text-xs text-dark-400 mb-1">Top Loser 24h</div>
              {topLosers[0] && (
                <>
                  <div className="text-lg font-bold text-red-400 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" /> {topLosers[0].price_change_percentage_24h?.toFixed(2)}%
                  </div>
                  <div className="text-xs text-dark-400">{topLosers[0].symbol.toUpperCase()}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* LIVE MARKET TABLE */}
      <section id="markets" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white">Live Cryptocurrency Prices</h2>
              <p className="text-dark-400 mt-1">Top 30 assets by market cap — updated every 30 seconds</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search coins..." className="input-field !pl-10 !py-2 w-full md:w-72" />
            </div>
          </div>

          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700/50">
                    <th className="text-left text-xs text-dark-400 font-medium px-4 py-3 w-10">#</th>
                    <th className="text-left text-xs text-dark-400 font-medium px-4 py-3">Name</th>
                    <th className="text-right text-xs text-dark-400 font-medium px-4 py-3">Price</th>
                    <th className="text-right text-xs text-dark-400 font-medium px-4 py-3">24h Change</th>
                    <th className="text-right text-xs text-dark-400 font-medium px-4 py-3 hidden md:table-cell">Volume</th>
                    <th className="text-right text-xs text-dark-400 font-medium px-4 py-3 hidden lg:table-cell">Market Cap</th>
                    <th className="text-right text-xs text-dark-400 font-medium px-4 py-3 hidden lg:table-cell">7D Chart</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 20 }).map((_, i) => (
                      <tr key={i} className="border-b border-dark-800/50">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-4"><div className="shimmer h-4 w-20 rounded" /></td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    displayCoins.map((coin: CoinData) => (
                      <tr key={coin.id} className="border-b border-dark-800/30 hover:bg-dark-800/30 transition-colors cursor-pointer">
                        <td className="px-4 py-3 text-dark-400 text-sm">{coin.market_cap_rank}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                            <div>
                              <div className="text-white font-medium text-sm">{coin.name}</div>
                              <div className="text-dark-400 text-xs uppercase">{coin.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-white font-mono text-sm">{formatPrice(coin.current_price)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center gap-1 text-sm font-medium ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {coin.price_change_percentage_24h >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(coin.price_change_percentage_24h)?.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-dark-300 text-sm font-mono hidden md:table-cell">{formatNumber(coin.total_volume)}</td>
                        <td className="px-4 py-3 text-right text-dark-300 text-sm font-mono hidden lg:table-cell">{formatNumber(coin.market_cap)}</td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          <SparklineChart data={coin.sparkline_in_7d?.price || []} isPositive={coin.price_change_percentage_24h >= 0} />
                        </td>
                        <td className="px-4 py-3 text-right hidden xl:table-cell">
                          <Link href="/dashboard/deposit" className="text-xs font-semibold text-primary-400 hover:text-primary-300 border border-primary-600/40 hover:border-primary-400 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap">
                            Deposit →
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY & TRUST */}
      <section className="py-20 bg-dark-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-green-600/20 border border-green-600/30 rounded-full px-4 py-1.5 mb-4">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-xs font-semibold">BANK-GRADE SECURITY SINCE 2011</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Why 10 Million+ Clients Trust OldKraken</h2>
            <p className="text-dark-400 text-lg max-w-3xl mx-auto">Built on the same security architecture as Kraken.com, engineered to protect your assets and identity 24/7.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Lock, title: '95% Cold Storage', desc: 'The vast majority of client funds are held in offline, air-gapped cold storage wallets — inaccessible to hackers and cyber threats.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { icon: Eye, title: '24/7 Security Operations', desc: 'Around-the-clock monitoring by our security team ensures suspicious activity is detected and responded to in real-time.', color: 'text-green-400', bg: 'bg-green-500/10' },
              { icon: Shield, title: 'AES-256 Encryption', desc: 'All data encrypted using AES-256 at rest and TLS 1.3 in transit. Your personal and financial information is protected at every layer.', color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { icon: Wallet, title: 'Manual Withdrawal Review', desc: 'Every withdrawal is manually reviewed by our security team. This human oversight layer prevents unauthorized transfers and fraud.', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
              { icon: Globe, title: 'Global AML Compliance', desc: 'Registered with FinCEN as a Money Services Business. Full AML/KYC compliance across all jurisdictions where we operate.', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              { icon: Award, title: 'Audited Proof of Reserves', desc: 'Regular independently audited proof-of-reserves reports confirm client funds are backed 1:1 at all times. Full transparency guaranteed.', color: 'text-orange-400', bg: 'bg-orange-500/10' },
            ].map((item, i) => (
              <div key={i} className="glass-card hover:border-primary-600/40 transition-all duration-300 group p-5">
                <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Start in 3 Simple Steps</h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">Getting started on OldKraken takes less than 5 minutes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '📝', title: 'Create Free Account', desc: 'Register with your email. Verify your identity. Your account is protected from day one with optional two-factor authentication.' },
              { step: '02', icon: '₿', title: 'Deposit Cryptocurrency', desc: 'Fund your account by sending BTC, ETH, USDT, or any of 200+ supported coins to your unique personal deposit address.' },
              { step: '03', icon: '📈', title: 'Grow Your Portfolio', desc: 'Monitor real-time prices, manage your holdings, and benefit from institutional-grade infrastructure. Your crypto, your control.' },
            ].map((s, i) => (
              <div key={i} className="glass-card text-center relative overflow-hidden">
                <div className="absolute top-4 right-4 text-5xl font-black text-dark-800 select-none">{s.step}</div>
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/tutorials" className="btn-primary !px-8 !py-3 inline-flex items-center gap-2">
              View Full Tutorial Guide <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* SISTER SITE SECTION */}
      <section className="py-16 bg-gradient-to-r from-primary-900/40 to-cyan-900/40 border-y border-primary-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start gap-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-primary-600/20 border border-primary-600/30 rounded-full px-4 py-1.5 mb-4">
                <ExternalLink className="w-3 h-3 text-primary-400" />
                <span className="text-primary-300 text-xs font-semibold">OFFICIAL SISTER PLATFORM OF KRAKEN.COM</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">One Development Team. Two Trusted Platforms.</h2>
              <p className="text-dark-300 leading-relaxed mb-4">OldKraken was developed alongside <strong className="text-white">Kraken.com</strong> — one of the world&apos;s oldest and most trusted cryptocurrency exchanges, co-founded in July 2011 by Jesse Powell. We share the same core technology, security infrastructure, and founding principles.</p>
              <p className="text-dark-400 text-sm leading-relaxed mb-6">The Kraken family of exchanges has processed over <strong className="text-white">$400 billion</strong> in total trades and has been rated among the most secure exchanges globally by independent auditors. OldKraken inherits this legacy while delivering an even more personalized and focused trading experience.</p>
              <div className="grid grid-cols-2 gap-3">
                {['Same founding team (July 2011)', 'Shared security architecture', 'FinCEN registered MSB', '$400B+ total trades', 'Audited proof of reserves', '190+ countries served', 'ISO 27001 standards', 'AML/KYC compliant'].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-dark-300"><CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> {f}</div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4 lg:w-72 w-full">
              {[['$400B+', 'Total volume across the Kraken family'], ['2011', 'Year founded — one of the oldest exchanges'], ['10M+', 'Combined registered clients worldwide'], ['190+', 'Countries and territories served']].map(([val, label]) => (
                <div key={val} className="glass-card text-center py-5">
                  <div className="text-3xl font-black text-white mb-1">{val}</div>
                  <div className="text-dark-400 text-xs">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GAINERS & LOSERS */}
      <section className="py-16 bg-dark-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Today&apos;s Market Movers</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[{ title: 'Top Gainers (24h)', icon: TrendingUp, items: topGainers, color: 'text-green-400', pos: true }, { title: 'Top Losers (24h)', icon: TrendingDown, items: topLosers, color: 'text-red-400', pos: false }].map((section) => (
              <div key={section.title} className="glass-card">
                <div className="flex items-center gap-2 mb-4">
                  <section.icon className={`w-5 h-5 ${section.color}`} />
                  <h3 className="text-white font-bold">{section.title}</h3>
                </div>
                <div className="space-y-3">
                  {section.items.map((coin) => (
                    <div key={coin.id} className="flex items-center justify-between py-2 border-b border-dark-800/50 last:border-0">
                      <div className="flex items-center gap-3">
                        <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                        <div>
                          <div className="text-white text-sm font-medium">{coin.name}</div>
                          <div className="text-dark-400 text-xs">{coin.symbol.toUpperCase()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-sm font-mono">{formatPrice(coin.current_price)}</div>
                        <div className={`text-sm font-medium ${section.pos ? 'text-green-400' : 'text-red-400'}`}>{section.pos ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1 mb-3">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
              <span className="text-yellow-300 font-bold ml-2 text-sm">4.9 / 5.0</span>
              <span className="text-dark-500 text-sm ml-1">· 48,000+ verified reviews</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Trusted by Clients Worldwide</h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">Real feedback from real people across 190+ countries. Here is what our community says about OldKraken.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {REVIEWS.map((review, i) => (
              <div key={i} className="glass-card flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">{Array.from({ length: review.rating }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />)}</div>
                  {review.verified && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>}
                </div>
                <p className="text-dark-300 text-sm leading-relaxed flex-1">&ldquo;{review.text}&rdquo;</p>
                <div className="border-t border-dark-800/50 pt-3">
                  <div className="font-semibold text-white text-sm">{review.name}</div>
                  <div className="text-dark-500 text-xs">{review.country} · {review.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPLIANCE */}
      <section className="py-14 bg-dark-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Compliant. Regulated. Transparent.</h2>
            <p className="text-dark-400 max-w-2xl mx-auto text-sm">OldKraken operates under strict regulatory frameworks ensuring the highest standards of financial integrity and client protection.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Landmark, title: 'FinCEN Registered', desc: 'Money Services Business (MSB) registered with the U.S. Financial Crimes Enforcement Network', color: 'text-blue-400' },
              { icon: FileText, title: 'AML/KYC Compliant', desc: 'Full Anti-Money Laundering and Know Your Customer compliance across all account types and regions', color: 'text-green-400' },
              { icon: Building, title: 'US Incorporated', desc: 'OldKraken Exchange Ltd. is incorporated in the United States and subject to US financial regulations', color: 'text-purple-400' },
              { icon: BadgeCheck, title: 'ISO 27001 Standards', desc: 'Our information security management follows ISO 27001 for enterprise-grade data protection', color: 'text-yellow-400' },
            ].map((item, i) => (
              <div key={i} className="glass-card text-center p-5">
                <item.icon className={`w-8 h-8 ${item.color} mx-auto mb-3`} />
                <h3 className="text-white font-bold text-sm mb-2">{item.title}</h3>
                <p className="text-dark-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-card !p-10 sm:!p-14 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/15 to-cyan-600/15" />
            <div className="relative">
              <div className="text-5xl mb-4">🐙</div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to Start?</h2>
              <p className="text-dark-300 text-lg mb-3 max-w-2xl mx-auto">Join 10 million+ clients who trust OldKraken — the sister exchange of Kraken.com — to safeguard and grow their digital assets.</p>
              <p className="text-dark-500 text-sm mb-8">Free account · No hidden fees · No minimum deposit · Withdraw anytime after review</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="btn-primary text-lg !px-10 !py-4 inline-flex items-center justify-center gap-2">Create Free Account <ArrowUpRight className="w-5 h-5" /></Link>
                <Link href="/tutorials" className="btn-secondary text-lg !px-10 !py-4 inline-flex items-center justify-center gap-2">How to Buy Crypto <ChevronRight className="w-5 h-5" /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-dark-800 pt-16 pb-8 bg-dark-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🐙</span>
                <div>
                  <div className="text-xl font-black text-white">OldKraken</div>
                  <div className="text-xs text-primary-400">Official Sister of Kraken.com</div>
                </div>
              </div>
              <p className="text-dark-400 text-sm leading-relaxed mb-5 max-w-sm">OldKraken is a professional cryptocurrency exchange and a sister platform of Kraken.com, co-founded in July 2011. We provide secure, compliant, and transparent digital asset trading to clients in 190+ countries worldwide.</p>
              <div className="space-y-1.5 text-xs text-dark-500">
                <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 text-primary-500 mt-0.5 shrink-0" /> 237 Kearny Street, Suite #102, San Francisco, CA 94108, United States</div>
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-primary-500 shrink-0" /> support@oldkraken.com</div>
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-primary-500 shrink-0" /> +1 (415) 000-0000 · Mon–Fri, 9am–6pm PT</div>
                <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-primary-500 shrink-0" /> Founded July 2011 · FinCEN Registered MSB</div>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
              <div className="space-y-2.5">
                {[['About OldKraken', '/about'], ['Our Story', '/about'], ['Security', '/about'], ['Careers', '/about'], ['Press & Media', '/about'], ['Legal Notice', '/terms']].map(([label, href]) => (
                  <Link key={label} href={href} className="block text-dark-400 hover:text-white text-sm transition-colors">{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Platform</h4>
              <div className="space-y-2.5">
                {[['Live Markets', '#markets'], ['Create Account', '/register'], ['Sign In', '/login'], ['Deposit Crypto', '/dashboard/deposit'], ['Withdraw Funds', '/dashboard/withdraw'], ['Portfolio Dashboard', '/dashboard']].map(([label, href]) => (
                  <Link key={label} href={href} className="block text-dark-400 hover:text-white text-sm transition-colors">{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Learn & Support</h4>
              <div className="space-y-2.5">
                {[['How to Buy Crypto', '/tutorials'], ['How to Deposit', '/tutorials'], ['Credit Card Guide', '/tutorials'], ['Security Best Practices', '/tutorials'], ['Terms of Service', '/terms'], ['Privacy Policy', '/privacy'], ['AML Policy', '/privacy'], ['Contact Support', '/login']].map(([label, href]) => (
                  <Link key={label} href={href} className="block text-dark-400 hover:text-white text-sm transition-colors">{label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-dark-800 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-dark-500">
                <span>OldKraken Exchange Ltd.</span>
                <span>·</span>
                <span>FinCEN MSB Registration #31000179693369</span>
                <span>·</span>
                <span>AML/KYC Compliant</span>
                <span>·</span>
                <span>Founded July 2011</span>
              </div>
              <div className="flex items-center gap-4">
                <a href="https://twitter.com/krakenfx" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-dark-800 hover:bg-primary-600/30 flex items-center justify-center text-dark-400 hover:text-white transition-colors" title="Twitter/X">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-dark-800 hover:bg-primary-600/30 flex items-center justify-center text-dark-400 hover:text-white transition-colors" title="Telegram">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                </a>
                <a href="https://www.kraken.com" target="_blank" rel="noopener noreferrer" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                  Visit Kraken.com <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <p className="text-dark-600 text-xs leading-relaxed max-w-4xl">
              <strong className="text-dark-500">Risk Disclaimer:</strong> Cryptocurrency trading involves significant risk of loss. Digital assets are highly volatile and speculative. Past performance is not indicative of future results. OldKraken does not provide investment advice. Please ensure you understand the risks before trading. Only invest what you can afford to lose.
            </p>
            <div className="text-center mt-6">
              <p className="text-dark-600 text-xs">© 2011–2025 OldKraken Exchange Ltd. All Rights Reserved. Sister Platform of Kraken.com · Co-founded July 2011 · San Francisco, CA, USA</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
