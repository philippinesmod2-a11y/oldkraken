'use client';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-dark-950">
      <nav className="sticky top-0 z-50 glass border-b border-dark-700/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2"><span className="text-2xl">🐙</span><span className="text-lg font-black text-white">OldKraken</span></Link>
          <div className="flex gap-3"><Link href="/login" className="btn-secondary text-sm !py-2 !px-4">Sign In</Link><Link href="/register" className="btn-primary text-sm !py-2 !px-4">Get Started</Link></div>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-black text-white mb-2">Terms of Service</h1>
        <p className="text-dark-400 text-sm mb-10">Last updated: January 1, 2025 · OldKraken Exchange Ltd.</p>

        <div className="space-y-8 text-dark-300 leading-relaxed">
          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">1. Introduction and Acceptance</h2>
            <p className="mb-3">These Terms of Service ("Terms") govern your use of the OldKraken Exchange platform ("Platform"), operated by OldKraken Exchange Ltd. ("Company", "we", "us", or "our"), a sister company of Kraken.com (Payward Inc.), co-founded July 2011, incorporated in the United States.</p>
            <p className="mb-3">By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Platform.</p>
            <p>OldKraken is an official sister platform of Kraken.com. While the two platforms share foundational infrastructure and security principles, they operate as separate legal entities and maintain separate terms of service.</p>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">2. Eligibility</h2>
            <p className="mb-3">To use the Platform, you must:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Be at least 18 years of age (or the legal age of majority in your jurisdiction)</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be a resident of a country subject to trade sanctions or restrictions where cryptocurrency trading is prohibited</li>
              <li>Complete our identity verification (KYC) process as required</li>
              <li>Not be acting on behalf of any person or entity that is subject to economic sanctions</li>
            </ul>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">3. Account Registration and Security</h2>
            <p className="mb-3">You are responsible for maintaining the confidentiality of your account credentials. You agree to:</p>
            <ul className="list-disc pl-5 space-y-2 mb-3">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Use a strong, unique password and enable two-factor authentication</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Not share your account credentials with any third party</li>
            </ul>
            <p>OldKraken will never ask for your password. We are not responsible for any loss or damage arising from unauthorized access to your account resulting from your failure to keep your credentials secure.</p>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">4. Deposits and Withdrawals</h2>
            <p className="mb-3">OldKraken accepts cryptocurrency deposits. All deposits are subject to our internal review process. Withdrawal requests are subject to our manual security review, which typically completes within 1–24 hours.</p>
            <p className="mb-3">We reserve the right to place holds on accounts or transactions for security purposes, regulatory compliance, or fraud prevention. Withdrawals may be delayed or declined if:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Your identity verification is incomplete</li>
              <li>We detect suspicious activity on your account</li>
              <li>Your account is subject to a legal hold or investigation</li>
              <li>Your withdrawal exceeds applicable limits without prior approval</li>
            </ul>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">5. Fees</h2>
            <p className="mb-3">OldKraken charges fees for certain services including withdrawals. All applicable fees are disclosed on the relevant transaction page before you confirm any transaction. Fees are subject to change with notice.</p>
            <p>There are no fees for account creation or cryptocurrency deposits. All fee information is displayed transparently in your account dashboard.</p>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">6. Prohibited Activities</h2>
            <p className="mb-3">You agree not to use the Platform to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Violate any applicable law or regulation</li>
              <li>Engage in money laundering, terrorist financing, or other financial crimes</li>
              <li>Circumvent any technical security measures of the Platform</li>
              <li>Manipulate or attempt to manipulate the markets</li>
              <li>Use automated scripts or bots without prior written consent</li>
              <li>Engage in any fraudulent, deceptive, or misleading activity</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">7. Risk Disclosure</h2>
            <p className="mb-3"><strong className="text-white">IMPORTANT: Cryptocurrency trading involves substantial risk of loss.</strong> Digital assets are highly volatile and speculative. The value of your holdings can decrease significantly or become worthless. You may lose all of your invested capital.</p>
            <p className="mb-3">OldKraken does not provide investment, financial, tax, or legal advice. Nothing on the Platform should be construed as such. You are solely responsible for your trading decisions.</p>
            <p>Past performance of any cryptocurrency is not indicative of future results. Please only invest amounts you can afford to lose entirely.</p>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">8. Intellectual Property</h2>
            <p>All content on the Platform, including but not limited to text, graphics, logos, icons, and software, is the property of OldKraken Exchange Ltd. or its licensors and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without prior written permission.</p>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">9. Limitation of Liability</h2>
            <p className="mb-3">To the maximum extent permitted by applicable law, OldKraken and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of the Platform, including but not limited to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Loss of profits, revenue, data, or goodwill</li>
              <li>Service interruptions or technical failures</li>
              <li>Unauthorized access to your account</li>
              <li>Market losses or investment decisions</li>
            </ul>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">10. Governing Law and Disputes</h2>
            <p className="mb-3">These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.</p>
            <p>Any disputes arising under these Terms shall first be subject to mandatory good-faith negotiation. If unresolved, disputes shall be submitted to binding arbitration under the American Arbitration Association rules.</p>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">11. Contact Information</h2>
            <div className="space-y-1 text-sm">
              <p><strong className="text-dark-300">Company:</strong> OldKraken Exchange Ltd.</p>
              <p><strong className="text-dark-300">Address:</strong> 237 Kearny Street, Suite #102, San Francisco, CA 94108, USA</p>
              <p><strong className="text-dark-300">Email:</strong> <span className="text-primary-400">legal@oldkraken.com</span></p>
              <p><strong className="text-dark-300">Phone:</strong> +1 (415) 000-0000</p>
              <p><strong className="text-dark-300">Sister Company:</strong> Payward Inc. (Kraken.com)</p>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap gap-3 mt-10">
          <Link href="/privacy" className="btn-secondary text-sm !py-2 !px-4">Privacy Policy</Link>
          <Link href="/" className="btn-secondary text-sm !py-2 !px-4">Back to Home</Link>
        </div>
      </div>
      <footer className="border-t border-dark-800 py-6 text-center">
        <p className="text-dark-500 text-xs">© 2011–2025 OldKraken Exchange Ltd. All Rights Reserved. Sister Platform of Kraken.com</p>
      </footer>
    </div>
  );
}
