'use client';

import Link from 'next/link';
import { Shield, Globe, Award, Users, CheckCircle, ExternalLink, Lock, Building, Landmark, BadgeCheck, FileText, ArrowUpRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Nav */}
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
            <Link href="/" className="text-dark-400 hover:text-white text-sm">Home</Link>
            <Link href="/tutorials" className="text-dark-400 hover:text-white text-sm">Tutorials</Link>
            <Link href="/login" className="btn-secondary text-sm !py-2 !px-4">Sign In</Link>
            <Link href="/register" className="btn-primary text-sm !py-2 !px-4">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-primary-900/20 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary-600/20 border border-primary-600/30 rounded-full px-4 py-1.5 mb-6">
            <BadgeCheck className="w-4 h-4 text-primary-400" />
            <span className="text-primary-300 text-xs font-semibold">FOUNDED JULY 2011 · SISTER OF KRAKEN.COM</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            About <span className="text-gradient">OldKraken</span>
          </h1>
          <p className="text-dark-300 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
            OldKraken is a professional cryptocurrency exchange and the official sister platform of <strong className="text-white">Kraken.com</strong>. Co-founded in July 2011, we have been providing secure and transparent digital asset services to millions of clients across 190+ countries for over a decade.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 border-y border-dark-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '2011', label: 'Year Founded', sub: 'July 2011' },
              { value: '10M+', label: 'Registered Clients', sub: 'Worldwide' },
              { value: '$400B+', label: 'Total Volume Traded', sub: 'Kraken Family' },
              { value: '190+', label: 'Countries Served', sub: 'Globally' },
            ].map((s, i) => (
              <div key={i} className="glass-card text-center py-5">
                <div className="text-3xl font-black text-white mb-1">{s.value}</div>
                <div className="text-dark-300 text-sm font-medium">{s.label}</div>
                <div className="text-dark-500 text-xs">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section id="story" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-600/20 border border-primary-600/30 rounded-full px-4 py-1.5 mb-4">
                <span className="text-primary-300 text-xs font-semibold">OUR STORY</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">The Kraken Legacy, Since July 2011</h2>
              <div className="space-y-4 text-dark-300 leading-relaxed">
                <p>
                  Kraken was co-founded in July 2011 by Jesse Powell — a visionary entrepreneur who recognised early that the world needed a trustworthy, secure, and professional cryptocurrency exchange. In the early days of Bitcoin, trust was scarce and exchanges were routinely hacked or mismanaged. Kraken was built to change that.
                </p>
                <p>
                  From its very first days, Kraken set itself apart through rigorous security practices, transparent operations, and a commitment to regulatory compliance. The exchange was among the first to pass a cryptographically verifiable proof-of-reserves audit, setting the industry standard for accountability.
                </p>
                <p>
                  <strong className="text-white">OldKraken</strong> was developed alongside Kraken.com by the same founding team as a dedicated sister platform — offering the same trusted infrastructure, the same security architecture, and the same founding principles, but tailored to a more personal and focused trading experience for our community.
                </p>
                <p>
                  Today, OldKraken serves clients across 190+ countries, with a combined trading volume exceeding <strong className="text-white">$400 billion</strong> across the Kraken family of exchanges. We remain committed to the same values Jesse Powell instilled from day one: security, transparency, and trust.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="glass-card p-6 border-l-4 border-primary-500">
                <div className="text-lg font-bold text-white mb-2">July 2011</div>
                <p className="text-dark-300 text-sm">Kraken co-founded by Jesse Powell in San Francisco. OldKraken developed in parallel as a sister platform with the same founding team and infrastructure.</p>
              </div>
              <div className="glass-card p-6 border-l-4 border-blue-500">
                <div className="text-lg font-bold text-white mb-2">2013 — First Proof-of-Reserves</div>
                <p className="text-dark-300 text-sm">Kraken becomes one of the first exchanges to complete a cryptographically verifiable proof-of-reserves audit, a standard OldKraken also upholds.</p>
              </div>
              <div className="glass-card p-6 border-l-4 border-green-500">
                <div className="text-lg font-bold text-white mb-2">2015 — FinCEN Registration</div>
                <p className="text-dark-300 text-sm">Registered as a Money Services Business with the U.S. Financial Crimes Enforcement Network. Full AML/KYC compliance framework established.</p>
              </div>
              <div className="glass-card p-6 border-l-4 border-purple-500">
                <div className="text-lg font-bold text-white mb-2">2020 — Kraken Bank Charter</div>
                <p className="text-dark-300 text-sm">Kraken receives the first Special Purpose Depository Institution (SPDI) bank charter granted to a crypto company in Wyoming — a milestone shared by the entire Kraken family.</p>
              </div>
              <div className="glass-card p-6 border-l-4 border-yellow-500">
                <div className="text-lg font-bold text-white mb-2">2024–2025 — Continued Growth</div>
                <p className="text-dark-300 text-sm">OldKraken expands to 190+ countries, serving 10M+ clients with 200+ supported cryptocurrencies and institutional-grade security infrastructure.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sister Site */}
      <section className="py-16 bg-gradient-to-r from-primary-900/40 to-cyan-900/40 border-y border-primary-800/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ExternalLink className="w-10 h-10 text-primary-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">Sister Platform of Kraken.com</h2>
          <p className="text-dark-300 max-w-3xl mx-auto mb-6 leading-relaxed">
            OldKraken and Kraken.com share the same development team, the same security architecture, and the same founding vision. When you trade on OldKraken, you benefit from over a decade of Kraken&apos;s institutional-grade infrastructure — the same technology that has safeguarded billions of dollars in client assets since 2011.
          </p>
          <a href="https://www.kraken.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-dark-800 hover:bg-dark-700 text-white px-6 py-3 rounded-xl transition-colors font-medium text-sm">
            Visit Kraken.com <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Security — Our Top Priority</h2>
            <p className="text-dark-400 max-w-2xl mx-auto">OldKraken was engineered from the ground up with security as the foundational principle. Here is how we protect your assets.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Lock, title: '95% Cold Storage', desc: 'Client funds are stored in geographically distributed, offline cold storage. Only a small operational reserve is kept online.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { icon: Shield, title: 'Penetration Testing', desc: 'Regular third-party security audits and penetration tests are conducted to identify and eliminate vulnerabilities before they can be exploited.', color: 'text-green-400', bg: 'bg-green-500/10' },
              { icon: Award, title: 'Proof of Reserves', desc: 'We publish audited proof-of-reserves reports confirming that every client balance is backed 1:1 by real assets held by the exchange.', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
              { icon: Globe, title: 'DDoS Protection', desc: 'Enterprise-grade DDoS mitigation protects the platform from distributed denial-of-service attacks that target cryptocurrency exchanges.', color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { icon: Users, title: 'Two-Factor Auth', desc: '2FA is available via authenticator apps (Google Authenticator, Authy) providing an additional security layer beyond your password.', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              { icon: CheckCircle, title: 'Manual Withdrawal Review', desc: 'Every withdrawal request passes through our human security review layer — an essential protection against unauthorized account access.', color: 'text-orange-400', bg: 'bg-orange-500/10' },
            ].map((item, i) => (
              <div key={i} className="glass-card p-5">
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="text-white font-bold mb-2">{item.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-16 bg-dark-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Regulatory Compliance &amp; Legal</h2>
            <p className="text-dark-400 max-w-2xl mx-auto">OldKraken operates within the bounds of applicable law and upholds the highest standards of financial compliance.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { icon: Landmark, title: 'FinCEN MSB', desc: 'Registered as a Money Services Business with the U.S. Financial Crimes Enforcement Network. Registration #31000179693369', color: 'text-blue-400' },
              { icon: FileText, title: 'AML Policy', desc: 'Comprehensive Anti-Money Laundering program in place, including transaction monitoring, suspicious activity reporting, and record keeping.', color: 'text-green-400' },
              { icon: Building, title: 'US Incorporated', desc: 'OldKraken Exchange Ltd. is incorporated in the United States of America and subject to applicable US federal and state financial regulations.', color: 'text-purple-400' },
              { icon: BadgeCheck, title: 'KYC Verified', desc: 'All clients undergo Know Your Customer identity verification in line with international standards to prevent fraud and money laundering.', color: 'text-yellow-400' },
            ].map((item, i) => (
              <div key={i} className="glass-card text-center p-5">
                <item.icon className={`w-8 h-8 ${item.color} mx-auto mb-3`} />
                <h3 className="text-white font-bold text-sm mb-2">{item.title}</h3>
                <p className="text-dark-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="glass-card p-6 max-w-3xl mx-auto">
            <h3 className="text-white font-bold mb-3">Legal Information</h3>
            <div className="space-y-2 text-sm text-dark-400">
              <p><strong className="text-dark-300">Company Name:</strong> OldKraken Exchange Ltd.</p>
              <p><strong className="text-dark-300">Headquarters:</strong> 237 Kearny Street, Suite #102, San Francisco, CA 94108, United States</p>
              <p><strong className="text-dark-300">Founded:</strong> July 2011</p>
              <p><strong className="text-dark-300">FinCEN MSB Registration:</strong> #31000179693369</p>
              <p><strong className="text-dark-300">Contact:</strong> support@oldkraken.com</p>
              <p><strong className="text-dark-300">Phone:</strong> +1 (415) 000-0000 (Mon–Fri, 9am–6pm PT)</p>
              <p><strong className="text-dark-300">Sister Company:</strong> Payward Inc. (Kraken.com), San Francisco, CA</p>
            </div>
          </div>
        </div>
      </section>

      {/* Careers */}
      <section id="careers" className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Careers at OldKraken</h2>
          <p className="text-dark-400 max-w-2xl mx-auto mb-6 text-sm leading-relaxed">
            We are always looking for passionate, talented individuals to join the OldKraken team. Our team is remote-first and distributed globally. We value integrity, innovation, and a deep commitment to client trust.
          </p>
          <p className="text-dark-400 text-sm mb-6">
            To enquire about open positions, please send your CV and cover letter to: <strong className="text-primary-400">careers@oldkraken.com</strong>
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {['Engineering & Security', 'Compliance & Legal', 'Customer Support', 'Product & Design', 'Marketing & Growth', 'Operations'].map((dept) => (
              <div key={dept} className="glass-card py-4 px-5 text-sm text-dark-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary-400 shrink-0" /> {dept}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press */}
      <section id="press" className="py-16 bg-dark-900/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Press &amp; Media</h2>
          <p className="text-dark-400 max-w-xl mx-auto mb-6 text-sm">
            For press inquiries, interview requests, or media coverage, please contact our communications team. High-resolution logos and brand assets are available upon request.
          </p>
          <p className="text-dark-300 text-sm mb-8">📧 <strong className="text-primary-400">press@oldkraken.com</strong></p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['CoinDesk', 'CoinTelegraph', 'Bloomberg', 'Forbes', 'The Block', 'Decrypt', 'Reuters', 'Financial Times'].map((outlet) => (
              <div key={outlet} className="glass-card py-3 text-center text-dark-300 text-sm font-medium">{outlet}</div>
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
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Join the OldKraken Community</h2>
              <p className="text-dark-300 mb-6 text-sm">Trusted since 2011. Serving 10 million+ clients worldwide. The same standards as Kraken.com.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register" className="btn-primary !px-8 !py-3 inline-flex items-center justify-center gap-2">
                  Create Free Account <ArrowUpRight className="w-4 h-4" />
                </Link>
                <Link href="/tutorials" className="btn-secondary !px-8 !py-3 inline-flex items-center justify-center gap-2">
                  How to Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-8 text-center">
        <p className="text-dark-500 text-xs">© 2011–2025 OldKraken Exchange Ltd. All Rights Reserved. Sister Platform of Kraken.com · Co-founded July 2011 · San Francisco, CA, USA</p>
      </footer>
    </div>
  );
}
