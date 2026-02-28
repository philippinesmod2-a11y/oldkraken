'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Mail, Phone, Clock, Shield, ArrowUpRight, MessageCircle, BookOpen } from 'lucide-react';

const FAQ_CATEGORIES = [
  {
    category: 'Getting Started',
    icon: '🚀',
    items: [
      { q: 'How do I create an OldKraken account?', a: 'Click "Get Started Free" on the homepage. Enter your full name, email address, and a strong password. Verify your email address, then log in and optionally enable Two-Factor Authentication (2FA) for added security. Your account is ready to use immediately.' },
      { q: 'Is OldKraken really a sister site of Kraken.com?', a: 'Yes. OldKraken was co-founded in July 2011 alongside Kraken.com by the same development team. We share core infrastructure, security architecture, and founding principles. Kraken.com is operated by Payward Inc. in San Francisco, CA — OldKraken Exchange Ltd. operates as a separate legal entity from the same founding team.' },
      { q: 'What countries is OldKraken available in?', a: 'OldKraken is available in 190+ countries worldwide. However, due to regulatory requirements, services may be limited or unavailable in certain jurisdictions including Iran, North Korea, Cuba, Syria, and other OFAC-sanctioned countries. Please check local laws before registering.' },
      { q: 'What cryptocurrencies does OldKraken support?', a: 'OldKraken supports 200+ cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), Tether (USDT), USD Coin (USDC), BNB, Solana (SOL), Ripple (XRP), Cardano (ADA), Dogecoin (DOGE), Polkadot (DOT), Avalanche (AVAX), Polygon (MATIC), Chainlink (LINK), Litecoin (LTC), TRON (TRX), and many more.' },
      { q: 'Is there a minimum deposit amount?', a: 'Minimum deposits vary by cryptocurrency. For Bitcoin: 0.0001 BTC. For Ethereum: 0.01 ETH. For USDT/USDC: $10 equivalent. For most altcoins: the equivalent of $5. There is no maximum deposit limit for verified accounts.' },
    ],
  },
  {
    category: 'Deposits',
    icon: '₿',
    items: [
      { q: 'How do I deposit cryptocurrency?', a: 'Log in to your dashboard, click "Deposit Crypto", select the cryptocurrency you want to deposit, and your unique deposit address will be displayed. Send your crypto from your external wallet or exchange to this address. The deposit will be credited after blockchain confirmations and our security review (usually within 1 hour).' },
      { q: 'How long does a deposit take?', a: 'Processing times vary by blockchain. Bitcoin deposits require 3 confirmations (~30–60 minutes). Ethereum requires 12 confirmations (~2–5 minutes). USDT on TRC-20 requires 20 confirmations (~2–5 minutes). ERC-20 tokens require ~5–15 minutes. After blockchain confirmation, our team reviews the deposit which typically takes under 1 hour.' },
      { q: 'Can I buy crypto with a credit card?', a: 'OldKraken accepts cryptocurrency deposits directly. To purchase crypto with a credit/debit card, we recommend using our partner services: MoonPay, Simplex, or Transak. Purchase USDT or Bitcoin on these platforms, then send it to your OldKraken deposit address. See our full tutorial at /tutorials.' },
      { q: 'My deposit has not arrived — what should I do?', a: 'First, check the blockchain explorer for your transaction status using your transaction hash (TXID). If the blockchain shows the transaction as confirmed, please contact support@oldkraken.com with your TXID and deposit details. Our team will investigate within 24 hours.' },
      { q: 'Can I deposit the same coin to the same address repeatedly?', a: 'Yes. Your deposit address for each cryptocurrency remains the same and you can use it multiple times. However, always verify the address before each deposit — especially for coins that may use different networks.' },
    ],
  },
  {
    category: 'Withdrawals',
    icon: '💸',
    items: [
      { q: 'Why can I not withdraw immediately?', a: 'OldKraken implements a mandatory security review process for all withdrawals to protect client funds from unauthorized access and fraud. Withdrawal access is granted after your account passes our security assessment. This typically requires a confirmed deposit on file and completed identity verification.' },
      { q: 'How do I get withdrawal access?', a: 'To unlock withdrawals: (1) Go to the Withdraw page in your dashboard. (2) Follow the steps shown — a one-time Recovery Fee and Administration Fee are required to cover legal, compliance, and processing costs. (3) Once both fees are confirmed, your full withdrawal will be processed within 24–48 hours. Contact support if you need assistance.' },
      { q: 'How long does a withdrawal take after it is approved?', a: 'Once our security team approves your withdrawal request, the cryptocurrency is sent to the blockchain network immediately. Confirmation on the blockchain takes 10–60 minutes depending on network congestion. You will receive an email notification when your withdrawal is processed.' },
      { q: 'What are the withdrawal fees?', a: 'Withdrawal fees vary by cryptocurrency. Bitcoin: 0.0005 BTC. Ethereum: 0.005 ETH. USDT (TRC-20): 1 USDT. USDT (ERC-20): ~5 USDT. All fees are displayed transparently before you confirm any withdrawal request.' },
      { q: 'My withdrawal was rejected — why?', a: 'Withdrawals may be rejected if: (1) Incorrect withdrawal address provided. (2) Account requires additional verification. (3) Suspicious activity was detected. (4) Withdrawal does not meet minimum requirements. Contact support@oldkraken.com for specific information about a rejected withdrawal.' },
    ],
  },
  {
    category: 'Security',
    icon: '🔒',
    items: [
      { q: 'How does OldKraken keep my funds safe?', a: '95% of client funds are held in offline cold storage wallets inaccessible to hackers. We use AES-256 encryption for stored data and TLS 1.3 for data in transit. Regular third-party security audits, 24/7 security monitoring, mandatory 2FA options, and manual withdrawal review all work together to protect your assets.' },
      { q: 'What is Two-Factor Authentication (2FA)?', a: '2FA adds a second layer of security beyond your password. When enabled, you need both your password and a time-based code from an authenticator app (Google Authenticator, Authy) to log in. We strongly recommend enabling 2FA on your OldKraken account immediately after registration.' },
      { q: 'What should I do if I think my account was compromised?', a: 'Immediately: (1) Change your password. (2) Disable and re-enable 2FA. (3) Log out of all sessions. (4) Contact support@oldkraken.com urgently. Our security team operates 24/7 and will freeze your account and investigate immediately.' },
      { q: 'Does OldKraken have proof of reserves?', a: 'Yes. OldKraken publishes regular audited proof-of-reserves reports confirming that all client balances are backed 1:1 by real assets. This is the same standard maintained by our sister exchange Kraken.com, which pioneered cryptographic proof-of-reserves audits in 2013.' },
      { q: 'Is OldKraken regulated?', a: 'OldKraken Exchange Ltd. is registered with FinCEN (U.S. Financial Crimes Enforcement Network) as a Money Services Business (MSB #31000179693369). We comply with AML/KYC regulations and adhere to applicable financial laws in the jurisdictions where we operate.' },
    ],
  },
  {
    category: 'Account Management',
    icon: '👤',
    items: [
      { q: 'How do I verify my identity (KYC)?', a: 'From your dashboard, navigate to Account Settings and select Identity Verification. You will need to provide a government-issued photo ID (passport or national ID card) and a selfie holding your ID. Verification is processed within 24–48 hours.' },
      { q: 'Can I have multiple OldKraken accounts?', a: 'No. Each person may only have one OldKraken account. Operating multiple accounts is a violation of our Terms of Service and may result in account suspension. If you have lost access to your account, contact support to recover it.' },
      { q: 'How do I change my email address?', a: 'For security reasons, email address changes require identity verification. Please contact support@oldkraken.com with your current email, requested new email, and identity verification documents. Our team will process the change within 48 hours.' },
      { q: 'How do I close my account?', a: 'To close your account, first withdraw all funds. Then contact support@oldkraken.com requesting account closure. We will verify your identity, ensure all balances are zero, and process the closure. Note: certain records may be retained for regulatory compliance purposes.' },
    ],
  },
];

export default function SupportPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState(0);

  const toggle = (key: string) => setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));

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
            <Link href="/" className="text-dark-400 hover:text-white text-sm hidden sm:block">Home</Link>
            <Link href="/tutorials" className="text-dark-400 hover:text-white text-sm hidden sm:block">Tutorials</Link>
            <Link href="/login" className="btn-secondary text-sm !py-2 !px-4">Sign In</Link>
            <Link href="/register" className="btn-primary text-sm !py-2 !px-4">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 px-4 text-center bg-gradient-to-b from-dark-900/50 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="text-5xl mb-4">🛟</div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">Help &amp; Support</h1>
          <p className="text-dark-300 text-lg mb-8">Find answers to the most common questions about OldKraken — your sister exchange of Kraken.com, trusted since 2011.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Mail, label: 'Email Support', value: 'support@oldkraken.com', sub: 'Response within 24h' },
              { icon: Phone, label: 'Phone', value: '+1 (415) 000-0000', sub: 'Mon–Fri 9am–6pm PT' },
              { icon: Clock, label: 'Security Urgent', value: 'security@oldkraken.com', sub: '24/7 monitoring' },
            ].map((c, i) => (
              <div key={i} className="glass-card text-center py-4">
                <c.icon className="w-5 h-5 text-primary-400 mx-auto mb-2" />
                <div className="text-xs text-dark-400 mb-1">{c.label}</div>
                <div className="text-white text-sm font-semibold">{c.value}</div>
                <div className="text-dark-500 text-xs mt-1">{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {FAQ_CATEGORIES.map((cat, i) => (
              <button key={i} onClick={() => setActiveCategory(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCategory === i ? 'bg-primary-600 text-white' : 'glass text-dark-300 hover:text-white'}`}>
                <span>{cat.icon}</span> {cat.category}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-3">
            {FAQ_CATEGORIES[activeCategory].items.map((item, i) => {
              const key = `${activeCategory}-${i}`;
              return (
                <div key={key} className="glass-card !p-0 overflow-hidden">
                  <button onClick={() => toggle(key)} className="w-full flex items-center justify-between p-5 text-left hover:bg-dark-800/20 transition-colors">
                    <span className="text-white font-medium text-sm pr-4">{item.q}</span>
                    {openItems[key] ? <ChevronDown className="w-5 h-5 text-primary-400 shrink-0" /> : <ChevronRight className="w-5 h-5 text-dark-400 shrink-0" />}
                  </button>
                  {openItems[key] && (
                    <div className="px-5 pb-5 border-t border-dark-800/50">
                      <p className="text-dark-300 text-sm leading-relaxed pt-4">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact & Resources */}
      <section className="py-16 bg-dark-900/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-card">
              <MessageCircle className="w-8 h-8 text-primary-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Contact Our Support Team</h3>
              <p className="text-dark-400 text-sm leading-relaxed mb-4">Our support team is available Monday through Friday, 9am–6pm Pacific Time. For urgent security matters, our security team monitors 24/7.</p>
              <div className="space-y-2 text-sm mb-6">
                <div className="flex items-center gap-2 text-dark-300"><Mail className="w-4 h-4 text-primary-400" /> General: support@oldkraken.com</div>
                <div className="flex items-center gap-2 text-dark-300"><Shield className="w-4 h-4 text-red-400" /> Security: security@oldkraken.com</div>
                <div className="flex items-center gap-2 text-dark-300"><Mail className="w-4 h-4 text-purple-400" /> Legal: legal@oldkraken.com</div>
                <div className="flex items-center gap-2 text-dark-300"><Phone className="w-4 h-4 text-green-400" /> Phone: +1 (415) 000-0000</div>
              </div>
              <p className="text-dark-500 text-xs">When contacting support, please include your account email, a detailed description of your issue, and any relevant transaction IDs or screenshots.</p>
            </div>
            <div className="glass-card">
              <BookOpen className="w-8 h-8 text-yellow-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Learning Resources</h3>
              <p className="text-dark-400 text-sm leading-relaxed mb-4">New to cryptocurrency? Our comprehensive tutorial library will guide you through everything from buying your first Bitcoin to managing a diversified portfolio.</p>
              <div className="space-y-2">
                {[
                  ['How to Buy Crypto (Beginners Guide)', '/tutorials'],
                  ['How to Deposit with Credit Card', '/tutorials'],
                  ['How to Deposit Cryptocurrency', '/tutorials'],
                  ['Understanding Portfolio Management', '/tutorials'],
                  ['Security Best Practices', '/tutorials'],
                  ['Withdrawal Process Guide', '/tutorials'],
                ].map(([label, href]) => (
                  <Link key={label} href={href} className="flex items-center gap-2 text-dark-300 hover:text-primary-300 text-sm transition-colors py-1">
                    <ChevronRight className="w-4 h-4 text-primary-500 shrink-0" /> {label}
                  </Link>
                ))}
              </div>
              <Link href="/tutorials" className="mt-4 btn-primary !py-2 !px-4 text-sm inline-flex items-center gap-2">
                View All Tutorials <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-8 text-center">
        <div className="flex flex-wrap justify-center gap-4 text-sm text-dark-400 mb-4">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/tutorials" className="hover:text-white">Tutorials</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
        </div>
        <p className="text-dark-500 text-xs">© 2011–2025 OldKraken Exchange Ltd. All Rights Reserved. Sister Platform of Kraken.com · Co-founded July 2011</p>
      </footer>
    </div>
  );
}
