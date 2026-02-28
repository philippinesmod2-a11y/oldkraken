'use client';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark-950">
      <nav className="sticky top-0 z-50 glass border-b border-dark-700/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2"><span className="text-2xl">🐙</span><span className="text-lg font-black text-white">OldKraken</span></Link>
          <div className="flex gap-3"><Link href="/login" className="btn-secondary text-sm !py-2 !px-4">Sign In</Link><Link href="/register" className="btn-primary text-sm !py-2 !px-4">Get Started</Link></div>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-black text-white mb-2">Privacy Policy</h1>
        <p className="text-dark-400 text-sm mb-10">Last updated: January 1, 2025 · OldKraken Exchange Ltd.</p>

        <div className="space-y-8 text-dark-300 leading-relaxed">
          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
            <p className="mb-3">OldKraken Exchange Ltd. ("we", "us", "our") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use the OldKraken platform.</p>
            <p>OldKraken is a sister platform of Kraken.com, operating under the same high standards of data protection that have been upheld since our co-founding in July 2011. We comply with applicable data protection laws including GDPR (for EU/EEA users), CCPA (for California residents), and other applicable regional regulations.</p>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">2. Information We Collect</h2>
            <p className="mb-3"><strong className="text-white">Identity Information:</strong> Full name, date of birth, nationality, government-issued ID documents (for KYC verification), tax identification number where required.</p>
            <p className="mb-3"><strong className="text-white">Contact Information:</strong> Email address, phone number, residential and mailing address.</p>
            <p className="mb-3"><strong className="text-white">Financial Information:</strong> Cryptocurrency wallet addresses, transaction history, deposit and withdrawal records, account balances.</p>
            <p className="mb-3"><strong className="text-white">Technical Information:</strong> IP address, browser type, device information, login history, session data, and cookies.</p>
            <p><strong className="text-white">Communications:</strong> Support tickets, emails, and any other communications you send to us.</p>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To verify your identity and comply with KYC/AML regulatory requirements</li>
              <li>To process your transactions, deposits, and withdrawals</li>
              <li>To provide customer support and respond to your enquiries</li>
              <li>To detect and prevent fraud, money laundering, and unauthorized account access</li>
              <li>To send service notifications, security alerts, and important account updates</li>
              <li>To improve the Platform and develop new features</li>
              <li>To comply with applicable laws and legal obligations</li>
              <li>To conduct analytics and monitor Platform performance</li>
            </ul>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">4. Information Sharing and Disclosure</h2>
            <p className="mb-3">We do not sell your personal information to third parties. We may share your information with:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-dark-300">Regulatory Authorities:</strong> As required by law, including FinCEN, law enforcement agencies, and financial regulators</li>
              <li><strong className="text-dark-300">Service Providers:</strong> Identity verification services, cloud hosting providers, email service providers, operating under strict data processing agreements</li>
              <li><strong className="text-dark-300">Legal Proceedings:</strong> When required by court order, subpoena, or other legal process</li>
              <li><strong className="text-dark-300">Business Transfers:</strong> In connection with a merger, acquisition, or sale of all or substantially all assets</li>
            </ul>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">5. Data Security</h2>
            <p className="mb-3">We implement industry-leading security measures to protect your personal information:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>AES-256 encryption for data at rest</li>
              <li>TLS 1.3 encryption for all data in transit</li>
              <li>Multi-factor authentication for staff access to systems</li>
              <li>Regular third-party security audits and penetration testing</li>
              <li>Strict access controls and the principle of least privilege</li>
              <li>24/7 security monitoring and incident response</li>
            </ul>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">6. Data Retention</h2>
            <p className="mb-3">We retain your personal information for as long as your account is active and for a period thereafter as required by law. Financial and transaction records are typically retained for a minimum of 5–7 years in compliance with anti-money laundering regulations.</p>
            <p>You may request deletion of your account and associated data by contacting support@oldkraken.com. Note that we may be required to retain certain information for regulatory compliance purposes even after account closure.</p>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">7. Your Rights</h2>
            <p className="mb-3">Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-dark-300">Right of Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong className="text-dark-300">Right to Rectification:</strong> Request correction of inaccurate personal data</li>
              <li><strong className="text-dark-300">Right to Erasure:</strong> Request deletion of your data (subject to legal retention requirements)</li>
              <li><strong className="text-dark-300">Right to Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong className="text-dark-300">Right to Object:</strong> Object to processing of your data for certain purposes</li>
              <li><strong className="text-dark-300">Right to Restrict Processing:</strong> Request limitation of processing in certain circumstances</li>
            </ul>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">8. Cookies</h2>
            <p className="mb-3">We use cookies and similar tracking technologies to enhance your experience on the Platform. These include:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-dark-300">Essential Cookies:</strong> Required for the Platform to function correctly, including authentication and security</li>
              <li><strong className="text-dark-300">Analytics Cookies:</strong> Help us understand how users interact with the Platform</li>
              <li><strong className="text-dark-300">Preference Cookies:</strong> Remember your language and display preferences</li>
            </ul>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">9. AML Policy Summary</h2>
            <p className="mb-3">OldKraken maintains a comprehensive Anti-Money Laundering (AML) and Counter-Terrorism Financing (CTF) programme in compliance with applicable laws including the Bank Secrecy Act (BSA). This programme includes:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Customer Due Diligence (CDD) and Enhanced Due Diligence (EDD) for high-risk clients</li>
              <li>Ongoing transaction monitoring for suspicious activity</li>
              <li>Suspicious Activity Report (SAR) filing with FinCEN as required</li>
              <li>Employee AML training and compliance oversight</li>
              <li>Record-keeping in accordance with BSA requirements</li>
            </ul>
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">10. Contact Us</h2>
            <div className="space-y-1 text-sm">
              <p><strong className="text-dark-300">Data Protection Officer:</strong> privacy@oldkraken.com</p>
              <p><strong className="text-dark-300">General Enquiries:</strong> support@oldkraken.com</p>
              <p><strong className="text-dark-300">Address:</strong> OldKraken Exchange Ltd., 237 Kearny Street, Suite #102, San Francisco, CA 94108, USA</p>
              <p><strong className="text-dark-300">Phone:</strong> +1 (415) 000-0000</p>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap gap-3 mt-10">
          <Link href="/terms" className="btn-secondary text-sm !py-2 !px-4">Terms of Service</Link>
          <Link href="/" className="btn-secondary text-sm !py-2 !px-4">Back to Home</Link>
        </div>
      </div>
      <footer className="border-t border-dark-800 py-6 text-center">
        <p className="text-dark-500 text-xs">© 2011–2025 OldKraken Exchange Ltd. All Rights Reserved. Sister Platform of Kraken.com</p>
      </footer>
    </div>
  );
}
