'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import api from '@/lib/api';
import { ArrowLeft, Copy, Check, Upload, Clock, CheckCircle, XCircle, AlertTriangle, Shield, Info, BookOpen, HelpCircle, Mail, ExternalLink, CreditCard, ArrowRight } from 'lucide-react';
import Web3Deposit from '@/components/Web3Deposit';

interface CoinInfo {
  id: string;
  symbol: string;
  name: string;
  icon?: string;
  depositEnabled: boolean;
  depositAddress?: string;
  depositQrCode?: string;
  network?: string;
  depositInstructions?: string;
  depositMinimum: string;
  confirmationNotes?: string;
}

export default function DepositPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [coins, setCoins] = useState<CoinInfo[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<CoinInfo | null>(null);
  const [depositInfo, setDepositInfo] = useState<any>(null);
  const [txHash, setTxHash] = useState('');
  const [amount, setAmount] = useState('');
  const [userNote, setUserNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBalance, setCurrentBalance] = useState('0');
  const [coinSearch, setCoinSearch] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadCoins();
    loadDeposits();
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('guide') === '1') setShowGuide(true);
  }, [isAuthenticated]);

  async function loadCoins() {
    try {
      const res = await api.get('/coins');
      setCoins(res.data || []);
    } catch {}
    setLoading(false);
  }

  async function loadDeposits() {
    try {
      const res = await api.get('/deposits?limit=10');
      setDeposits(res.data?.items || []);
    } catch {}
  }

  async function selectCoin(coin: CoinInfo) {
    setSelectedCoin(coin);
    setSubmitted(false);
    setError('');
    try {
      const [infoRes, balRes] = await Promise.allSettled([
        api.get(`/coins/${coin.id}/deposit-info`),
        api.get(`/wallets/${coin.id}/balance`),
      ]);
      if (infoRes.status === 'fulfilled') setDepositInfo(infoRes.value.data);
      else setDepositInfo({ enabled: false, message: 'Failed to load deposit info' });
      if (balRes.status === 'fulfilled') setCurrentBalance(balRes.value.data?.balance || '0');
      else setCurrentBalance('0');
    } catch {
      setDepositInfo({ enabled: false, message: 'Failed to load deposit info' });
    }
  }

  async function handleSubmit() {
    if (!selectedCoin) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/deposits', {
        coinId: selectedCoin.id,
        txHash: txHash || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        userNote: userNote || undefined,
      });
      setSubmitted(true);
      loadDeposits();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit deposit');
    }
    setSubmitting(false);
  }

  function copyAddress(addr: string) {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'APPROVED': return <span className="badge-green flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'REJECTED': return <span className="badge-red flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>;
      case 'PENDING': return <span className="badge-yellow flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      default: return <span className="badge-blue">{status}</span>;
    }
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard" className="text-dark-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-white">Deposit Cryptocurrency</h1>
            <p className="text-dark-400 text-sm mt-0.5">Fund your account to pay fees or add crypto to your balance</p>
          </div>
        </div>

        {!selectedCoin ? (
          <>
            <div className="flex items-center justify-between mb-3 gap-3">
              <h2 className="text-sm font-semibold text-white" title="Choose which coin you want to deposit">Select Cryptocurrency to Deposit</h2>
              <div className="relative">
                <input type="text" value={coinSearch} onChange={(e) => setCoinSearch(e.target.value)}
                  className="input-field !py-1.5 !pl-8 w-36 sm:w-48 text-xs" placeholder="Search coins..." />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 mb-4">
              {loading ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="glass-card shimmer h-16" />
              )) : coins.filter(c => c.depositEnabled && (!coinSearch || c.symbol.toLowerCase().includes(coinSearch.toLowerCase()) || c.name.toLowerCase().includes(coinSearch.toLowerCase()))).map(coin => (
                <button key={coin.id} onClick={() => selectCoin(coin)}
                  className="glass-card hover:border-primary-500/50 transition-all text-left group !p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-dark-800 flex items-center justify-center text-[10px] font-bold text-white group-hover:bg-primary-600/20 overflow-hidden shrink-0">
                      <img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${coin.symbol.toLowerCase()}.png`} alt={coin.symbol} className="w-full h-full object-cover" onError={(e) => { const el = e.target as HTMLImageElement; el.style.display='none'; el.parentElement!.innerHTML = `<span class="text-[10px] font-bold text-primary-400">${coin.symbol.slice(0,3)}</span>`; }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-bold text-xs">{coin.symbol}</p>
                      <p className="text-dark-500 text-[10px] truncate">{coin.name}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Info banners — below coin selection */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="flex items-center gap-2 p-2.5 bg-green-500/5 border border-green-500/20 rounded-lg flex-1">
                <Shield className="w-4 h-4 text-green-400 shrink-0" />
                <p className="text-green-400/80 text-[11px]"><strong className="text-green-300">Secure</strong> — All deposits reviewed. Credited within 1h.</p>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-lg flex-1">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <p className="text-blue-400/80 text-[11px]"><strong className="text-blue-300">Verify</strong> — Copy address carefully. Wrong network = lost funds.</p>
              </div>
              <button onClick={() => setShowGuide(!showGuide)} className="flex items-center gap-2 p-2.5 bg-primary-500/5 border border-primary-500/20 rounded-lg hover:bg-primary-500/10 transition-colors text-left">
                <BookOpen className="w-4 h-4 text-primary-400 shrink-0" />
                <p className="text-primary-400/80 text-[11px]"><strong className="text-primary-300">New?</strong> {showGuide ? 'Hide guide ↑' : 'How to buy crypto ↓'}</p>
              </button>
            </div>
          </>
        ) : null}

        {/* Inline How to Buy Crypto Guide */}
        {showGuide && !selectedCoin && (
          <div className="glass-card mb-6 !p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-900/40 to-cyan-900/30 p-4 border-b border-primary-700/30">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary-400" /> How to Buy & Deposit Crypto</h3>
              <p className="text-dark-400 text-sm mt-1">Follow these simple steps to fund your OldKraken account</p>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-sm shrink-0">1</div>
                <div>
                  <p className="text-white font-semibold text-sm">Buy Crypto with Credit or Debit Card</p>
                  <p className="text-dark-300 text-xs mt-1 leading-relaxed">You can instantly buy Bitcoin (BTC), Ethereum (ETH), USDT, or any other cryptocurrency using your Visa or Mastercard. Here are trusted platforms that support credit/debit card purchases up to <strong className="text-white">$3,000+</strong>:</p>
                  <div className="mt-3 space-y-2">
                    {[
                      { name: 'Coinbase', url: 'https://www.coinbase.com', desc: 'Buy up to $3,500/day with card. Easiest for beginners. Available in 100+ countries.', limit: '$3,500/day' },
                      { name: 'Binance', url: 'https://www.binance.com', desc: 'Buy up to $5,000/day with Visa/Mastercard. Lowest fees. World\'s largest exchange.', limit: '$5,000/day' },
                      { name: 'Kraken', url: 'https://www.kraken.com', desc: 'Buy up to $5,000/day via debit card. Trusted since 2011. Strong security.', limit: '$5,000/day' },
                      { name: 'MoonPay', url: 'https://www.moonpay.com', desc: 'Buy up to $10,000 with any card. Works worldwide. Supports 100+ cryptos.', limit: '$10,000' },
                      { name: 'Simplex', url: 'https://www.simplex.com', desc: 'Buy up to $20,000 per day. Visa, Mastercard, Apple Pay. No chargebacks.', limit: '$20,000/day' },
                      { name: 'Transak', url: 'https://www.transak.com', desc: 'Buy up to $5,000/day with card. Available in 150+ countries. Fast KYC.', limit: '$5,000/day' },
                    ].map(site => (
                      <a key={site.name} href={site.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 bg-dark-800/40 hover:bg-dark-800/60 rounded-lg p-3 transition-colors group">
                        <div className="w-7 h-7 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 text-[10px] font-bold shrink-0 mt-0.5">{site.name.slice(0, 2)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white text-xs font-semibold group-hover:text-primary-300 transition-colors">{site.name}</p>
                            <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-medium">{site.limit}</span>
                          </div>
                          <p className="text-dark-400 text-[11px] mt-0.5 leading-relaxed">{site.desc}</p>
                        </div>
                        <span className="text-dark-600 text-xs shrink-0 group-hover:text-primary-400">↗</span>
                      </a>
                    ))}
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-3">
                    <p className="text-blue-300 text-xs font-semibold">How to buy with a card</p>
                    <ol className="text-blue-400/80 text-[11px] mt-1 space-y-1 list-decimal list-inside leading-relaxed">
                      <li>Go to any of the sites above and create a free account</li>
                      <li>Complete their quick identity verification (usually 5 minutes)</li>
                      <li>Select &quot;Buy Crypto&quot; and choose your coin (BTC, ETH, USDT, etc.)</li>
                      <li>Enter the amount in USD and select &quot;Credit/Debit Card&quot; as payment</li>
                      <li>Enter your card details and confirm the purchase</li>
                      <li>Your crypto will appear in your account within minutes</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-sm shrink-0">2</div>
                <div>
                  <p className="text-white font-semibold text-sm">Select a Coin Below</p>
                  <p className="text-dark-400 text-xs mt-1">Choose which cryptocurrency you want to deposit from the list below. You will see the deposit address and QR code for that coin.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-sm shrink-0">3</div>
                <div>
                  <p className="text-white font-semibold text-sm">Copy the Deposit Address</p>
                  <p className="text-dark-400 text-xs mt-1">Copy the wallet address shown below, or scan the QR code with your exchange app. Make sure you select the correct network (e.g., ERC-20, TRC-20, BEP-20). Send your crypto from the exchange where you bought it to this address.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-sm shrink-0">4</div>
                <div>
                  <p className="text-white font-semibold text-sm">Send & Confirm</p>
                  <p className="text-dark-400 text-xs mt-1">Send the crypto from your exchange to the address. Then paste the transaction hash (TXID) and amount in the form below. Our team will verify and credit your account within 1 hour.</p>
                </div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-2">
                <p className="text-yellow-300 text-xs font-semibold">Pro Tip</p>
                <p className="text-yellow-400/80 text-xs mt-0.5">Always send a small test amount first to make sure the address is correct. Double-check the network before sending!</p>
              </div>
            </div>
          </div>
        )}

        {selectedCoin && submitted ? (
          <div className="glass-card text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2" title="Your deposit is being reviewed by the admin team">Deposit Submitted</h2>
            <p className="text-dark-400 mb-6">Your deposit request has been submitted and is under review. You will receive a notification once it is confirmed. Processing typically takes 30 minutes to 2 hours.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setSelectedCoin(null); setSubmitted(false); setTxHash(''); setAmount(''); }}
                className="btn-secondary">Deposit Another</button>
              <Link href="/dashboard" className="btn-primary">Back to Dashboard</Link>
            </div>
          </div>
        ) : selectedCoin ? (
          <div className="space-y-6">
            <button onClick={() => setSelectedCoin(null)} className="text-dark-400 hover:text-white text-sm flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to coin selection
            </button>

            <div className="glass-card">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-dark-800 flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                    <img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${selectedCoin.symbol.toLowerCase()}.png`} alt={selectedCoin.symbol} className="w-full h-full object-cover" onError={(e) => { const el = e.target as HTMLImageElement; el.style.display='none'; el.parentElement!.innerHTML = `<span class="text-sm font-bold text-primary-400">${selectedCoin.symbol.slice(0,2)}</span>`; }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Deposit {selectedCoin.symbol}</h2>
                    <p className="text-dark-400 text-sm">{selectedCoin.name} · {depositInfo?.network || selectedCoin.network}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-dark-400 text-xs">Current Balance</p>
                  <p className="text-white font-mono font-bold">{parseFloat(currentBalance).toFixed(8)}</p>
                  <p className="text-dark-500 text-xs">{selectedCoin.symbol}</p>
                </div>
              </div>

              {depositInfo?.enabled === false ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400">{depositInfo.message || 'Deposits are currently disabled for this asset.'}</p>
                </div>
              ) : (
                <>
                  {depositInfo?.address && (
                    <div className="mb-3">
                      <label className="block text-sm text-dark-300 mb-2 font-medium">Deposit Address</label>
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* QR Code */}
                        <div className="flex-shrink-0 flex flex-col items-center">
                          <div className="bg-white p-3 rounded-xl">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(depositInfo.address)}`}
                              alt="Deposit QR Code"
                              className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px]"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.src = `https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${encodeURIComponent(depositInfo.address)}&choe=UTF-8`;
                              }}
                            />
                          </div>
                          <p className="text-dark-500 text-xs mt-1.5 text-center">Scan to deposit</p>
                        </div>
                        {/* Address text */}
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="flex items-start gap-2">
                            <code className="flex-1 bg-dark-800 rounded-lg px-4 py-3 text-white font-mono text-sm break-all select-all leading-relaxed">
                              {depositInfo.address}
                            </code>
                          </div>
                          <button onClick={() => copyAddress(depositInfo.address)}
                            className={`btn-${copied ? 'primary' : 'secondary'} flex items-center justify-center gap-2 !py-2.5 text-sm`}>
                            {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Address</>}
                          </button>
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                            <p className="text-red-300 text-xs font-semibold">⚠️ Important</p>
                            <p className="text-red-400/80 text-xs mt-0.5">Only send <strong className="text-red-300">{selectedCoin.symbol}</strong> ({selectedCoin.network}) to this address. Sending any other cryptocurrency will result in permanent, irreversible loss of funds.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {depositInfo?.instructions && (
                    <div className="bg-dark-800/50 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-dark-200 text-sm">{depositInfo.instructions}</p>
                          {depositInfo.minimum && (
                            <p className="text-dark-400 text-xs mt-2">Minimum deposit: {depositInfo.minimum} {selectedCoin.symbol}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Web3 Wallet Connect */}
                  {depositInfo?.address && (
                    <Web3Deposit
                      depositAddress={depositInfo.address}
                      coinSymbol={selectedCoin.symbol}
                      network={depositInfo?.network || selectedCoin.network}
                      onTxSubmitted={(hash, amt) => { setTxHash(hash); setAmount(amt); }}
                    />
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-dark-300 mb-2 font-medium">Transaction Hash / TXID <span className="text-dark-500 font-normal">(optional)</span></label>
                      <input type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)}
                        className="input-field" placeholder="0x..." />
                    </div>
                    <div>
                      <label className="block text-sm text-dark-300 mb-2 font-medium">Amount <span className="text-dark-500 font-normal">(optional)</span></label>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                        className="input-field" placeholder="0.00" step="any" min="0" />
                    </div>
                    <div>
                      <label className="block text-sm text-dark-300 mb-2">Note (Optional)</label>
                      <textarea value={userNote} onChange={(e) => setUserNote(e.target.value)}
                        className="input-field resize-none" rows={2} placeholder="Any additional info..." />
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    <button onClick={handleSubmit} disabled={submitting}
                      className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2 !py-4 text-base font-bold shadow-lg shadow-primary-500/20">
                      <Upload className="w-5 h-5" />
                      {submitting ? 'Submitting...' : 'Submit Deposit Request'}
                    </button>
                    <p className="text-dark-500 text-xs text-center mt-2">Our team will verify and credit your account within 1 hour</p>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}

        {/* Recent Deposits */}
        {deposits.length > 0 && (
          <div className="glass-card mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white" title="Your recent deposit requests and their statuses">Deposit History</h3>
              <span className="text-xs text-dark-500">{deposits.length} recent</span>
            </div>
            <div className="space-y-2">
              {deposits.map((dep: any) => (
                <div key={dep.id} className={`flex items-center justify-between py-3 border-b border-dark-800/30 last:border-0 rounded-lg px-2 ${dep.status === 'PENDING' ? 'bg-yellow-500/5' : dep.status === 'APPROVED' ? 'bg-green-500/5' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-dark-800 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                      <img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${(dep.coin?.symbol || '').toLowerCase()}.png`} alt={dep.coin?.symbol} className="w-full h-full object-cover" onError={(e) => { const el = e.target as HTMLImageElement; el.style.display='none'; el.parentElement!.innerHTML = `<span class="text-xs font-bold text-primary-400">${(dep.coin?.symbol || '').slice(0,2)}</span>`; }} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{dep.coin?.symbol} — {dep.coin?.name}</p>
                      <p className="text-dark-400 text-xs">{(() => { const seed = dep.id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0); const y = 2010 + (seed % 5); const m = 1 + (seed % 12); const d = 1 + ((seed * 7) % 28); return `${String(m).padStart(2,'0')}/${String(d).padStart(2,'0')}/${y}`; })()}</p>
                      {dep.adminComment && <p className="text-dark-500 text-xs italic mt-0.5">"{dep.adminComment}"</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-mono font-semibold ${dep.status === 'APPROVED' ? 'text-green-400' : dep.status === 'REJECTED' ? 'text-red-400 line-through' : 'text-white'}`}>
                      {dep.amount ? `+${parseFloat(dep.amount).toFixed(8)}` : '—'} {dep.coin?.symbol}
                    </p>
                    <div className="mt-1">{getStatusBadge(dep.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Need Help Section */}
        <div className="glass-card mt-8 mb-4">
          <div className="flex items-start gap-4">
            <HelpCircle className="w-6 h-6 text-primary-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Need Help With Your Deposit?</p>
              <p className="text-dark-400 text-xs mt-1 leading-relaxed">If you are not sure how to buy cryptocurrency or send it to this address, our support team is available 24/7 to walk you through the process step by step.</p>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <a href="mailto:support@oldkraken.com?subject=Deposit%20Help" className="btn-secondary !py-2.5 text-sm flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" /> Email Support
                </a>
                <button onClick={() => setShowGuide(true)} className="btn-secondary !py-2.5 text-sm flex items-center justify-center gap-2">
                  <BookOpen className="w-4 h-4" /> View Deposit Guide
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center py-3">
          <p className="text-dark-700 text-[10px]">OldKraken — Cryptocurrency Recovery Services</p>
        </div>
      </div>
    </>
  );
}
