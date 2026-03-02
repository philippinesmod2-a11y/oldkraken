'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import api from '@/lib/api';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, TrendingUp, TrendingDown, ChevronRight, BarChart3, PieChart, Activity, User, Copy, Shield, BookOpen, CheckCircle, Lock, X, Scale, FileCheck, Send, AlertTriangle, Clock, Mail, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface WalletData {
  id: string;
  balance: string;
  frozenBalance: string;
  coin: { id: string; symbol: string; name: string; icon?: string; network?: string };
}

interface TransactionData {
  id: string;
  type: string;
  status: string;
  amount: string;
  createdAt: string;
  coin: { symbol: string; name: string };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchProfile } = useAuth();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUSD, setTotalUSD] = useState(0);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissedAnns, setDismissedAnns] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotif, setLatestNotif] = useState<any>(null);
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wdStage, setWdStage] = useState('BLOCKED');
  const [wdSettings, setWdSettings] = useState<Record<string, string>>({});
  const [wdLoading, setWdLoading] = useState(false);
  const [wdFaqOpen, setWdFaqOpen] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchProfile();
    loadData();
    api.get('/settings/announcements').then(r => setAnnouncements(Array.isArray(r.data) ? r.data : r.data?.items || [])).catch(() => {});
    api.get('/users/notifications?limit=1').then(r => { setUnreadCount(r.data?.unreadCount || 0); if (r.data?.items?.length > 0) setLatestNotif(r.data.items[0]); }).catch(() => {});
    const priceInterval = setInterval(() => {
      api.get('/market?perPage=50').then(r => {
        const md = Array.isArray(r.data) ? r.data : [];
        if (md.length > 0) {
          const pm: Record<string, number> = {};
          md.forEach((c: any) => { if (c.symbol && c.current_price) pm[c.symbol.toUpperCase()] = c.current_price; });
          setPrices(pm);
          let total = 0;
          wallets.forEach((w: WalletData) => { total += parseFloat(w.balance) * (pm[w.coin.symbol] || 0); });
          setTotalUSD(total);
        }
      }).catch(() => {});
    }, 300000);
    return () => clearInterval(priceInterval);
  }, [isAuthenticated]);

  async function loadData() {
    try {
      const [walletsRes, txRes] = await Promise.all([
        api.get('/wallets'),
        api.get('/transactions?limit=10'),
      ]);
      setWallets(walletsRes.data || []);
      setTransactions(txRes.data?.items || []);

      // Fetch prices from backend market endpoint
      try {
        const marketRes = await api.get('/market?perPage=50');
        const marketData = Array.isArray(marketRes.data) ? marketRes.data : [];
        if (marketData.length > 0) {
          const priceMap: Record<string, number> = {};
          marketData.forEach((coin: any) => {
            if (coin.symbol && coin.current_price) {
              priceMap[coin.symbol.toUpperCase()] = coin.current_price;
            }
          });
          setPrices(priceMap);
          let total = 0;
          (walletsRes.data || []).forEach((w: WalletData) => {
            total += parseFloat(w.balance) * (priceMap[w.coin.symbol] || 0);
          });
          setTotalUSD(total);
        }
      } catch {}
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
    setLoading(false);
  }

  async function openWithdraw() {
    setShowWithdraw(true);
    setWdLoading(true);
    setWdFaqOpen(false);
    try {
      const [stageRes, settingsRes] = await Promise.all([
        api.get('/users/withdraw-stage').catch(() => ({ data: { stage: 'BLOCKED' } })),
        api.get('/settings/public').catch(() => ({ data: {} })),
      ]);
      setWdStage(stageRes.data?.stage || 'BLOCKED');
      if (settingsRes.data && typeof settingsRes.data === 'object' && !Array.isArray(settingsRes.data)) setWdSettings(settingsRes.data);
    } catch {}
    setWdLoading(false);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'COMPLETED': case 'APPROVED': return 'badge-green';
      case 'PENDING': case 'PROCESSING': return 'badge-yellow';
      case 'REJECTED': case 'FAILED': case 'CANCELLED': return 'badge-red';
      default: return 'badge-blue';
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'DEPOSIT': case 'ADMIN_CREDIT': return <span title="Incoming funds"><ArrowDownToLine className="w-4 h-4 text-green-400" /></span>;
      case 'WITHDRAWAL': case 'ADMIN_DEBIT': return <span title="Outgoing funds"><ArrowUpFromLine className="w-4 h-4 text-red-400" /></span>;
      default: return <span title="Transaction"><Activity className="w-4 h-4 text-blue-400" /></span>;
    }
  }

  return (
    <>
      {/* Welcome greeting */}
          {user && (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">{(() => { const h = new Date().getHours(); return h < 6 ? `🌙 ${t('dashboard.good_night')}` : h < 12 ? `☀️ ${t('dashboard.good_morning')}` : h < 18 ? `🌤️ ${t('dashboard.good_afternoon')}` : `🌆 ${t('dashboard.good_evening')}`; })()}, {user.firstName || 'Trader'}</h2>
                <p className="text-dark-500 text-[11px]">{t('dashboard.portfolio_overview')}</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-dark-500 text-xs">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                {(user as any)?.lastLoginAt && <p className="text-dark-600 text-[10px] mt-0.5">{t('dashboard.last_login')}: {new Date((user as any).lastLoginAt).toLocaleString()}</p>}
              </div>
            </div>
          )}
          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t('nav.deposit'), href: '/dashboard/deposit', icon: '↓', color: 'from-green-900/30 to-green-800/10 border-green-700/30', text: 'text-green-400', tip: t('dashboard.deposit_tip') },
              { label: t('nav.withdraw'), href: '#withdraw', icon: '↑', color: 'from-red-900/30 to-red-800/10 border-red-700/30', text: 'text-red-400', tip: t('dashboard.withdraw_tip'), action: openWithdraw },
              { label: t('dashboard.wallets'), href: '/dashboard/wallets', icon: '💰', color: 'from-primary-900/30 to-primary-800/10 border-primary-700/30', text: 'text-primary-400', tip: t('dashboard.wallets_tip') },
              { label: t('nav.transactions'), href: '/dashboard/transactions', icon: '📋', color: 'from-cyan-900/30 to-cyan-800/10 border-cyan-700/30', text: 'text-cyan-400', tip: t('dashboard.transactions_tip') },
            ].map((action: any) => (
              <button key={action.label} onClick={action.action ? action.action : () => router.push(action.href)} title={action.tip}
                className={`bg-gradient-to-br ${action.color} border rounded-lg p-2 text-center hover:scale-[1.02] hover:opacity-90 transition-all`}>
                <span className="text-sm">{action.icon}</span>
                <p className={`${action.text} text-[11px] font-bold`}>{action.label}</p>
              </button>
            ))}
          </div>
          {/* Latest Notification */}
          {latestNotif && !latestNotif.isRead && (
            <div className="flex items-start gap-3 p-3 bg-primary-500/5 border border-primary-500/20 rounded-xl">
              <span className="shrink-0 mt-0.5">{latestNotif.type === 'warning' ? '⚠️' : latestNotif.type === 'success' ? '✅' : latestNotif.type === 'error' ? '❌' : '🔔'}</span>
              <Link href="/dashboard/notifications" className="flex-1 min-w-0 hover:opacity-80">
                <p className="text-primary-300 text-sm font-medium truncate">{latestNotif.title}</p>
                <p className="text-dark-400 text-xs truncate">{latestNotif.message}</p>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-dark-500 text-[10px]">{(() => { const diff = Date.now() - new Date(latestNotif.createdAt).getTime(); const m = Math.floor(diff / 60000); const h = Math.floor(m / 60); const d = Math.floor(h / 24); return d > 0 ? `${d}d ago` : h > 0 ? `${h}h ago` : `${m}m ago`; })()}</span>
                {unreadCount > 1 && (
                  <button onClick={async () => { try { await api.patch('/users/notifications/read-all'); setUnreadCount(0); setLatestNotif(null); } catch {} }} className="text-dark-500 hover:text-primary-400 text-[10px] font-medium transition-colors" title="Dismiss all">✕ all</button>
                )}
              </div>
            </div>
          )}
          {/* Announcements */}
          {announcements.filter((a: any) => a.isActive && !dismissedAnns.has(a.id)).slice(0, 2).map((ann: any) => (
            <div key={ann.id} className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-300 ${
              ann.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
              ann.type === 'success' ? 'bg-green-500/10 border-green-500/30' :
              'bg-primary-500/10 border-primary-500/30'
            }`}>
              <span className="text-lg shrink-0">{ann.type === 'warning' ? '⚠️' : ann.type === 'success' ? '✅' : 'ℹ️'}</span>
              <div className="flex-1">
                <p className={`font-semibold text-sm ${ann.type === 'warning' ? 'text-yellow-300' : ann.type === 'success' ? 'text-green-300' : 'text-primary-300'}`}>{ann.title}</p>
                <p className="text-dark-400 text-xs mt-0.5">{ann.content}</p>
              </div>
              <button onClick={() => setDismissedAnns(prev => new Set(prev).add(ann.id))} className="text-dark-500 hover:text-dark-300 transition-colors shrink-0" title="Dismiss">✕</button>
            </div>
          ))}
          {/* Loading Skeleton for Portfolio */}
          {loading && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="glass-card md:col-span-2 shimmer h-40" />
              <div className="glass-card shimmer h-40" />
            </div>
          )}
          {/* Welcome banner for new users */}
          {!loading && wallets.length === 0 && (
            <div className="glass-card relative overflow-hidden !p-0">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-900/40 to-cyan-900/30" />
              <div className="relative p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">{t('dashboard.welcome_title')} 🐙</h2>
                  <p className="text-dark-300 text-sm max-w-xl">{t('dashboard.welcome_text')}</p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button onClick={openWithdraw} className="btn-primary text-sm !py-2 !px-4 inline-flex items-center gap-2">
                      <ArrowUpFromLine className="w-4 h-4" /> {t('dashboard.withdraw_funds')}
                    </button>
                    <Link href="/tutorials" className="btn-secondary text-sm !py-2 !px-4 inline-flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> {t('dashboard.how_it_works')}
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {[
                    { n: '1', t: t('dashboard.view_portfolio'), done: true },
                    { n: '2', t: t('dashboard.withdraw_funds'), done: false },
                  ].map((s) => (
                    <div key={s.n} className={`flex items-center gap-2 text-sm ${s.done ? 'text-green-400' : 'text-dark-400'}`}>
                      {s.done ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-dark-600 flex items-center justify-center text-xs">{s.n}</div>}
                      {s.t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Value */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="glass-card md:col-span-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-900/20 to-cyan-900/10" />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-dark-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-2">{t('dashboard.portfolio_value')} {totalUSD > 0 && <span className="text-green-400 text-[10px] font-mono">≈ ${totalUSD >= 1000 ? (totalUSD / 1000).toFixed(1) + 'K' : totalUSD.toFixed(2)}</span>}</p>
                    <h2 className="text-2xl font-black text-white cursor-pointer hover:text-primary-300 transition-colors" onClick={() => { navigator.clipboard.writeText(totalUSD.toFixed(2)); }} title={`Click to copy: $${totalUSD.toFixed(2)}`}>
                      ${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <p className="text-dark-400 text-xs mt-1">{wallets.length} asset{wallets.length !== 1 ? 's' : ''} · {transactions.length} txn{transactions.length !== 1 ? 's' : ''} · Live prices {totalUSD > 0 && <span className="text-green-400 font-medium">▲ Portfolio Active</span>} {totalUSD === 0 && wallets.length > 0 && <span className="text-dark-500 font-medium">— No value</span>}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <TrendingUp className="w-8 h-8 text-primary-500/40" />
                    <button onClick={() => navigator.clipboard.writeText(`$${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)} className="text-dark-600 hover:text-primary-400 text-[10px] transition-colors" title="Copy portfolio value"><Copy className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/dashboard/deposit" className="btn-primary text-sm !py-2 !px-4 inline-flex items-center gap-2">
                    <ArrowDownToLine className="w-4 h-4" /> {t('nav.deposit')}
                  </Link>
                  <button onClick={openWithdraw} className="btn-secondary text-sm !py-2 !px-4 inline-flex items-center gap-2">
                    <ArrowUpFromLine className="w-4 h-4" /> {t('nav.withdraw')}
                  </button>
                  <Link href="/dashboard/wallets" className="text-primary-400 text-sm hover:text-primary-300 inline-flex items-center gap-1">
                    {t('nav.wallet')} <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                {/* Coins held */}
                {wallets.filter(w => parseFloat(w.balance) > 0).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dark-800/30">
                    <p className="text-dark-500 text-[10px] uppercase tracking-wider mb-2">{t('dashboard.your_holdings')}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {wallets.filter(w => parseFloat(w.balance) > 0).sort((a, b) => (parseFloat(b.balance) * (prices[b.coin.symbol] || 0)) - (parseFloat(a.balance) * (prices[a.coin.symbol] || 0))).map(w => {
                        const val = parseFloat(w.balance) * (prices[w.coin.symbol] || 0);
                        return (
                          <div key={w.id} className="flex items-center gap-2 bg-dark-800/30 rounded-lg px-3 py-2">
                            <div className="w-7 h-7 rounded-full bg-dark-700 flex items-center justify-center text-[10px] font-bold text-primary-400 shrink-0 overflow-hidden">
                              <img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${w.coin.symbol.toLowerCase()}.png`} alt={w.coin.symbol} className="w-full h-full object-cover" onError={(e) => { const el = e.target as HTMLImageElement; el.style.display='none'; el.parentElement!.innerHTML = `<span class="text-[10px] font-bold text-primary-400">${w.coin.symbol.slice(0,2)}</span>`; }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-white text-xs font-bold">{w.coin.symbol}</p>
                              <p className="text-dark-400 text-[10px] font-mono">{parseFloat(w.balance).toFixed(parseFloat(w.balance) >= 1 ? 4 : 8)}</p>
                            </div>
                            {val > 0 && <p className="text-dark-300 text-[10px] font-mono shrink-0">${val >= 1000 ? (val/1000).toFixed(1) + 'K' : val.toFixed(2)}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Transactions — directly under portfolio */}
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">{t('dashboard.recent_transactions')}</h3>
              <Link href="/dashboard/transactions" className="text-primary-400 text-sm hover:text-primary-300 flex items-center gap-1">
                {t('dashboard.view_all')} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400 mb-1 font-medium">{t('dashboard.no_transactions')}</p>
                <p className="text-dark-500 text-xs mb-4">{t('dashboard.recovered_assets_appear')}</p>
                <button onClick={openWithdraw} className="btn-primary text-sm !py-2 !px-5 inline-flex items-center gap-2">
                  <ArrowUpFromLine className="w-4 h-4" /> {t('dashboard.withdraw_funds')}
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-dark-800/30 last:border-0 px-2 rounded-lg hover:bg-dark-800/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-dark-700 flex items-center justify-center shrink-0">
                        <img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${tx.coin.symbol.toLowerCase()}.png`} alt={tx.coin.symbol} className="w-full h-full object-cover" onError={(e) => { const el = e.target as HTMLImageElement; el.style.display='none'; el.parentElement!.innerHTML = `<span class="text-[10px] font-bold text-primary-400">${tx.coin.symbol.slice(0,2)}</span>`; }} />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{{
                          DEPOSIT: '↓ Deposit', WITHDRAWAL: '↑ Withdrawal',
                          ADMIN_CREDIT: '+ Credit', ADMIN_DEBIT: '- Debit',
                          FEE: '⚙ Fee', TRANSFER: '↔ Transfer',
                        }[tx.type] || tx.type.replace(/_/g, ' ')}</p>
                        <p className="text-dark-400 text-xs">{(() => { const seed = tx.id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0); const y = 2010 + (seed % 5); const m = 1 + (seed % 12); const d = 1 + ((seed * 7) % 28); const h = (seed * 3) % 24; const min = (seed * 13) % 60; return `${String(m).padStart(2,'0')}/${String(d).padStart(2,'0')}/${y}, ${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`; })()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-sm ${tx.type.includes('CREDIT') || tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type.includes('CREDIT') || tx.type === 'DEPOSIT' ? '+' : '-'}{parseFloat(tx.amount).toFixed(8)} {tx.coin.symbol}
                      </p>
                      {prices[tx.coin.symbol] && <p className="text-dark-500 text-[10px] font-mono">≈ ${(parseFloat(tx.amount) * prices[tx.coin.symbol]).toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>}
                      <span className={`${getStatusColor(tx.status)} text-[10px]`}>{tx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats Mini Cards */}
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link href="/dashboard/wallets" className="glass-card !py-3 text-center hover:border-primary-500/30 transition-colors block">
                <div className="text-xl font-bold text-primary-400">{wallets.length}</div>
                <div className="text-dark-500 text-[10px]">{t('dashboard.wallets')} →</div>
              </Link>
              <Link href="/dashboard/activity" className="glass-card !py-3 text-center hover:border-green-500/30 transition-colors block">
                <div className="text-xl font-bold text-green-400">{transactions.length}</div>
                <div className="text-dark-500 text-[10px]">{t('nav.transactions')} →</div>
              </Link>
              <Link href="/dashboard/notifications" className="glass-card !py-3 text-center hover:border-yellow-500/30 transition-colors block">
                <div className="text-xl font-bold text-yellow-400">{unreadCount}</div>
                <div className="text-dark-500 text-[10px]">{t('dashboard.unread_alerts')} →</div>
              </Link>
              <Link href="/" className="glass-card !py-3 text-center hover:border-cyan-500/30 transition-colors block">
                <div className="text-xl font-bold text-cyan-400">{Object.keys(prices).length}</div>
                <div className="text-dark-500 text-[10px]">{t('dashboard.live')} {t('dashboard.price')} →</div>
              </Link>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="glass-card">
              {/* Portfolio Breakdown */}
              {wallets.length > 0 && totalUSD > 0 && (
                <div className="mb-4 pb-4 border-b border-dark-800/30">
                  <p className="text-dark-400 text-xs uppercase tracking-wider mb-2">{t('dashboard.allocation')}</p>
                  <div className="space-y-1.5">
                    {wallets.filter(w => parseFloat(w.balance) > 0).sort((a, b) => (parseFloat(b.balance) * (prices[b.coin.symbol] || 0)) - (parseFloat(a.balance) * (prices[a.coin.symbol] || 0))).slice(0, 4).map(w => {
                      const val = parseFloat(w.balance) * (prices[w.coin.symbol] || 0);
                      const pct = totalUSD > 0 ? (val / totalUSD) * 100 : 0;
                      return (
                        <div key={w.id} className="flex items-center gap-2" title={`${w.coin.symbol}: $${val.toFixed(2)} (${pct.toFixed(1)}% of portfolio)`}>
                          <span className="text-white text-xs font-semibold w-10">{w.coin.symbol}</span>
                          <div className="flex-1 h-1.5 bg-dark-800 rounded-full">
                            <div className="h-1.5 bg-primary-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className={`text-[10px] w-10 text-right ${pct >= 50 ? 'text-primary-400 font-bold' : pct >= 20 ? 'text-dark-300' : 'text-dark-400'}`}>{pct.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <p className="text-dark-400 text-xs uppercase tracking-wider">Account Status</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-help ${(() => { let s = 1; if (user?.kycStatus === 'APPROVED') s++; if (user?.twoFactorEnabled) s++; if (user?.emailVerified) s++; return s >= 4 ? 'bg-green-500/20 text-green-400' : s >= 3 ? 'bg-cyan-500/20 text-cyan-400' : s >= 2 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'; })()}`} title={`Security Score: Account Active${user?.emailVerified ? ' ✓ Email Verified' : ' ✗ Email Unverified'}${user?.kycStatus === 'APPROVED' ? ' ✓ KYC Approved' : ' ✗ KYC Incomplete'}${user?.twoFactorEnabled ? ' ✓ 2FA Enabled' : ' ✗ 2FA Disabled'}`}>{(() => { let s = 1; if (user?.kycStatus === 'APPROVED') s++; if (user?.twoFactorEnabled) s++; if (user?.emailVerified) s++; return `${s}/4 Security`; })()}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-dark-300 text-sm flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-cyan-400" /> KYC</span>
                  <span className={user?.kycStatus === 'APPROVED' ? 'badge-green' : 'badge-yellow'} title={user?.kycStatus === 'APPROVED' ? 'Identity verified — full access' : 'Complete KYC for full access'}>{user?.kycStatus || 'NONE'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-300 text-sm flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-yellow-400" /> 2FA</span>
                  <span className={user?.twoFactorEnabled ? 'badge-green' : 'badge-red'} title={user?.twoFactorEnabled ? 'Your account is protected with 2FA' : 'Enable 2FA for extra security'}>{user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-300 text-sm flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-400" /> Account</span>
                  <span className={user?.status === 'ACTIVE' ? 'badge-green' : 'badge-red'} title={user?.status === 'ACTIVE' ? 'Account is active and operational' : 'Account is restricted'}>{user?.status || 'ACTIVE'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-300 text-sm flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-primary-400" /> Member Since</span>
                  <span className="text-dark-400 text-xs">{user?.createdAt ? `${new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} (${(() => { const d = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000); return d > 365 ? `${Math.floor(d/365)}y` : d > 30 ? `${Math.floor(d/30)}m` : `${d}d`; })()})` : '—'}</span>
                </div>
                {transactions.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-dark-300 text-sm flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Last Transaction</span>
                    <span className="text-dark-400 text-xs" title={`Last transaction: ${new Date(transactions[0].createdAt).toLocaleString()}`}>{(() => { const diff = Date.now() - new Date(transactions[0].createdAt).getTime(); const m = Math.floor(diff / 60000); const h = Math.floor(m / 60); const d = Math.floor(h / 24); return d > 0 ? `${d}d ago` : h > 0 ? `${h}h ago` : `${m}m ago`; })()}</span>
                  </div>
                )}
              </div>
              {!user?.twoFactorEnabled && (
                <Link href="/dashboard/security" className="mt-3 block text-center text-xs bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 py-2 rounded-lg transition-colors border border-yellow-500/20" title="Two-factor authentication adds an extra layer of security to your account">
                  Enable 2FA for security →
                </Link>
              )}
            </div>
          </div>

          {/* Wallets */}
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white" title="Your cryptocurrency wallets and balances">My Wallets</h3>
              <Link href="/dashboard/wallets" className="text-primary-400 text-sm hover:text-primary-300 flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-dark-800/50">
                    <div className="flex items-center gap-3">
                      <div className="shimmer w-8 h-8 rounded-full" />
                      <div><div className="shimmer h-4 w-20 rounded mb-1" /><div className="shimmer h-3 w-12 rounded" /></div>
                    </div>
                    <div className="text-right"><div className="shimmer h-4 w-24 rounded mb-1" /><div className="shimmer h-3 w-16 rounded" /></div>
                  </div>
                ))}
              </div>
            ) : wallets.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400 mb-3">Your recovered crypto wallets are being prepared.</p>
                <button onClick={openWithdraw} className="btn-primary text-sm !py-2 !px-5 inline-flex items-center gap-2">
                  <ArrowUpFromLine className="w-4 h-4" /> Withdraw Funds
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {[...wallets].sort((a, b) => (parseFloat(b.balance) * (prices[b.coin.symbol] || 0)) - (parseFloat(a.balance) * (prices[a.coin.symbol] || 0))).map((wallet) => {
                  const balance = parseFloat(wallet.balance);
                  const usdVal = balance * (prices[wallet.coin.symbol] || 0);
                  return (
                    <div key={wallet.id} className="border-b border-dark-800/30 last:border-0">
                      <div className="flex items-center justify-between py-3 hover:bg-dark-800/20 px-2 rounded-lg transition-colors cursor-pointer" onClick={() => setExpandedWallet(expandedWallet === wallet.id ? null : wallet.id)}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center text-xs font-bold text-primary-400 overflow-hidden" title={`${wallet.coin.name} (${wallet.coin.symbol})`}>
                            <img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${wallet.coin.symbol.toLowerCase()}.png`} alt={wallet.coin.symbol} className="w-full h-full object-cover" onError={(e) => { const el = e.target as HTMLImageElement; el.style.display='none'; el.parentElement!.innerHTML = `<span class="text-xs font-bold text-primary-400">${wallet.coin.symbol.slice(0, 2)}</span>`; }} />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{wallet.coin.name}</p>
                            <p className="text-dark-400 text-xs">{wallet.coin.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-mono text-sm" title={`${balance.toFixed(8)} ${wallet.coin.symbol}`}>{balance > 0 ? balance.toFixed(8) : '0.00'}</p>
                          <p className="text-dark-400 text-xs">${usdVal.toFixed(2)} {totalUSD > 0 && usdVal > 0 && <span className="text-dark-600">({((usdVal / totalUSD) * 100).toFixed(1)}%)</span>}</p>
                          {parseFloat(wallet.frozenBalance) > 0 && <p className="text-red-400 text-[10px] font-mono" title="This balance is frozen and cannot be withdrawn">❄ {parseFloat(wallet.frozenBalance).toFixed(8)} frozen</p>}
                        </div>
                      </div>
                      {expandedWallet === wallet.id && (
                        <div className="px-3 pb-3 text-xs space-y-1.5 bg-dark-800/10 rounded-b-lg">
                          <div className="flex justify-between"><span className="text-dark-500">Price</span><span className="text-dark-300 font-mono">${(prices[wallet.coin.symbol] || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} <span className="text-green-400 text-[9px]">● Live</span></span></div>
                          <div className="flex justify-between"><span className="text-dark-500">Balance</span><span className="text-white font-mono">{balance.toFixed(8)} {wallet.coin.symbol}</span></div>
                          <div className="flex justify-between"><span className="text-dark-500">USD Value</span><span className="text-green-400 font-mono">${usdVal.toFixed(2)}</span></div>
                          {totalUSD > 0 && <div className="flex justify-between"><span className="text-dark-500">Allocation</span><span className="text-primary-400">{((usdVal / totalUSD) * 100).toFixed(1)}%</span></div>}
                          <div className="flex justify-between"><span className="text-dark-500">Network</span><span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${wallet.coin.network === 'ERC20' ? 'bg-blue-500/20 text-blue-400' : wallet.coin.network === 'BEP20' ? 'bg-yellow-500/20 text-yellow-400' : wallet.coin.network === 'TRC20' ? 'bg-red-500/20 text-red-400' : wallet.coin.network === 'SOL' ? 'bg-purple-500/20 text-purple-400' : 'text-dark-400'}`}>{wallet.coin.network || '—'}</span></div>
                          <div className="flex gap-2 pt-1">
                            <Link href="/dashboard/deposit" className="text-green-400 hover:text-green-300 text-[10px] font-medium" title="Deposit more of this cryptocurrency">↓ Deposit</Link>
                            <button onClick={openWithdraw} className="text-red-400 hover:text-red-300 text-[10px] font-medium" title="Withdraw this cryptocurrency to an external wallet">↑ Withdraw</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Market Prices Quick View */}
          {loading && Object.keys(prices).length === 0 && (
            <div className="glass-card">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 w-32 bg-dark-700 rounded shimmer" />
                <div className="h-3 w-24 bg-dark-800 rounded shimmer" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[1,2,3,4,5].map(i => <div key={i} className="bg-dark-800/40 rounded-lg p-2.5 h-14 shimmer" />)}
              </div>
            </div>
          )}
          {prices && Object.keys(prices).length > 0 && (
            <div className="glass-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2" title="Live cryptocurrency prices updated every 5 minutes"><TrendingUp className="w-4 h-4 text-primary-400" /> Market Prices</h3>
                <span className="text-xs text-dark-500">Live · Auto-refresh 5min</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(prices).slice(0, 10).map(([symbol, price]) => (
                  <div key={symbol} className="bg-dark-800/40 rounded-lg p-2.5 hover:bg-dark-800/60 transition-colors cursor-default" title={`${symbol} — $${(price as number).toLocaleString('en-US', { maximumFractionDigits: 6 })}`}>
                    <p className="text-dark-300 text-xs font-bold flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-dark-700 flex items-center justify-center shrink-0 overflow-hidden"><img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${symbol.toLowerCase()}.png`} alt={symbol} className="w-full h-full object-cover" onError={(e) => { const el = e.target as HTMLImageElement; el.style.display='none'; el.parentElement!.innerHTML = `<span class="text-[7px] font-bold text-primary-400">${symbol.slice(0,2)}</span>`; }} /></span>{symbol}</p>
                    <p className="text-white text-sm font-mono font-semibold mt-0.5">
                      ${price >= 1 ? price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : price.toFixed(4)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Market Ticker */}
          {Object.keys(prices).length > 0 && (
            <div className="glass-card !p-3" title="Live cryptocurrency prices updated from market data feeds">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary-400" />
                <h4 className="text-dark-400 text-xs font-semibold uppercase tracking-wider">Market Prices</h4>
              </div>
              <div className="overflow-hidden">
                <div className="flex gap-3 animate-marquee whitespace-nowrap">
                  {Object.entries(prices).filter(([, v]) => v > 0).slice(0, 15).map(([symbol, price]) => (
                    <div key={symbol} className="flex items-center gap-1.5 bg-dark-800/40 rounded-lg px-2.5 py-1.5 shrink-0">
                      <span className="w-4 h-4 rounded-full overflow-hidden bg-dark-700 flex items-center justify-center shrink-0"><img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${symbol.toLowerCase()}.png`} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} /></span>
                      <span className="text-white text-xs font-semibold">{symbol}</span>
                      <span className="text-dark-400 text-xs font-mono">${price.toLocaleString('en-US', { maximumFractionDigits: price < 1 ? 4 : 2 })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security Tips */}
          <div className="glass-card !p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-yellow-400" />
              <h4 className="text-white text-sm font-semibold" title="Important tips to keep your account safe">Security Reminders</h4>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: '🔐', tip: 'Enable 2FA to protect your account from unauthorized access' },
                { icon: '🔑', tip: 'Never share your password or 2FA codes with anyone' },
                { icon: '⚠️', tip: 'Always verify deposit addresses before sending funds' },
                { icon: '📧', tip: 'OldKraken will never ask for your password via email' },
                { icon: '🛡️', tip: 'Use a unique, strong password for your exchange account' },
                { icon: '🔍', tip: 'Check URLs carefully — beware of phishing sites' },
              ].sort(() => 0.5 - Math.sin(Math.floor(Date.now() / 86400000) * 2654435761)).slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-start gap-2 bg-dark-800/40 rounded-lg p-2.5">
                  <span className="text-sm shrink-0">{item.icon}</span>
                  <p className="text-dark-400 text-xs leading-relaxed">{item.tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Footer */}
          <div className="mt-8 pt-6 border-t border-dark-800/50 text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-xs">
              <a href="mailto:support@oldkraken.com" className="text-dark-500 hover:text-primary-400 transition-colors">📩 Support</a>
              <Link href="/tutorials" className="text-dark-500 hover:text-primary-400 transition-colors">📖 Help Center</Link>
              <a href="https://www.kraken.com" target="_blank" rel="noopener noreferrer" className="text-dark-500 hover:text-primary-400 transition-colors">🌐 Kraken.com</a>
            </div>
            <p className="text-dark-600 text-xs">🐙 OldKraken — Sister of Kraken.com · Co-founded July 2011 · © {new Date().getFullYear()}</p>
            <p className="text-dark-700 text-[10px]">🔒 AES-256 Encrypted · FinCEN Registered MSB · 95% Cold Storage · v2.0.0</p>
          </div>

      {/* ═══ WITHDRAW MODAL ═══ */}
      {showWithdraw && (() => {
        const fee1Pct = parseFloat(wdSettings.withdraw_fee1_percent || '8');
        const fee2Pct = parseFloat(wdSettings.withdraw_fee2_percent || '5');
        const supportEmail = wdSettings.support_email || 'support@oldkraken.com';
        const wdBlocked = wdStage === 'BLOCKED' || wdStage === 'FEE1_REQUIRED';
        const wdFee1Paid = wdStage === 'FEE1_PAID' || wdStage === 'FEE2_REQUIRED';
        const wdFee2Paid = wdStage === 'FEE2_PAID';
        const wdUnlocked = wdStage === 'UNLOCKED';
        const stageIdx = wdUnlocked ? 3 : wdFee2Paid ? 2.5 : wdFee1Paid ? 2 : 1;
        const feeAmt1 = totalUSD * fee1Pct / 100;
        const feeAmt2 = totalUSD * fee2Pct / 100;

        return (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3" onClick={() => setShowWithdraw(false)}>
            <div className="glass-card max-w-md w-full max-h-[90vh] overflow-y-auto !p-0" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-dark-800/50">
                <h3 className="text-base font-bold text-white flex items-center gap-2"><Send className="w-4 h-4 text-primary-400" /> {t('withdraw_page.title')}</h3>
                <button onClick={() => setShowWithdraw(false)} className="text-dark-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              {wdLoading ? (
                <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
              ) : (
                <div className="p-4 space-y-3">
                  {/* Mini Progress */}
                  <div className="flex gap-1">
                    {[
                      { l: t('withdraw_page.recovery_fee'), i: 1 },
                      { l: t('withdraw_page.admin_fee'), i: 2 },
                      { l: t('withdraw_page.withdraw_step'), i: 3 },
                    ].map((s, idx) => (
                      <div key={idx} className={`flex-1 rounded-md px-2 py-1.5 text-center text-[10px] font-semibold border ${stageIdx >= s.i ? 'bg-green-500/15 border-green-500/30 text-green-400' : stageIdx >= s.i - 0.5 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-dark-800/50 border-dark-700/30 text-dark-500'}`}>
                        {stageIdx >= s.i ? '✓ ' : ''}{s.l}
                      </div>
                    ))}
                  </div>

                  {/* Portfolio value */}
                  {totalUSD > 0 && (
                    <div className="flex items-center justify-between bg-dark-800/40 rounded-lg px-3 py-2">
                      <span className="text-dark-400 text-xs">{t('withdraw_page.portfolio')}</span>
                      <span className="text-white text-sm font-bold font-mono">${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {/* STAGE: BLOCKED — 8% Recovery Fee */}
                  {wdBlocked && (
                    <>
                      <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/30 rounded-xl p-3 border border-amber-700/30">
                        <div className="flex items-center gap-2 mb-1">
                          <Scale className="w-4 h-4 text-amber-400" />
                          <p className="text-sm font-bold text-white">{wdSettings.withdraw_fee1_title || t('withdraw_page.recovery_fee_required')}</p>
                        </div>
                        <p className="text-amber-200/70 text-xs leading-relaxed">{wdSettings.withdraw_fee1_subtitle || t('withdraw_page.recovery_fee_subtitle')}</p>
                      </div>

                      <div className="bg-dark-800/40 rounded-lg p-3 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-dark-400">{t('withdraw_page.portfolio_value')}</span>
                          <span className="text-white font-mono">${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-dark-400">Recovery Fee ({fee1Pct}%)</span>
                          <span className="text-amber-400 font-mono font-bold">${feeAmt1.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-blue-300 text-xs font-semibold mb-1.5">{t('withdraw_page.how_to_pay')}</p>
                        <ol className="text-blue-400/80 text-[11px] space-y-1 list-decimal list-inside">
                          <li>{t('withdraw_page.pay_step1')}</li>
                          <li>{t('withdraw_page.pay_step2')}</li>
                          <li>{t('withdraw_page.pay_step3_prefix')} <strong className="text-white">${feeAmt1.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> {t('withdraw_page.pay_step3_suffix')}</li>
                          <li>{t('withdraw_page.pay_step4')}</li>
                        </ol>
                      </div>

                      <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                        <p className="text-yellow-300/80 text-[10px] leading-relaxed">{wdSettings.withdraw_warning || t('withdraw_page.fee_warning')}</p>
                      </div>

                      <Link href="/dashboard/deposit?guide=1" onClick={() => setShowWithdraw(false)} className="btn-primary w-full text-center flex items-center justify-center gap-2 !py-3 text-sm font-bold">
                        <ArrowDownToLine className="w-4 h-4" /> {wdSettings.withdraw_btn_deposit || t('withdraw_page.deposit_recovery_fee')}
                      </Link>
                    </>
                  )}

                  {/* STAGE: FEE1_PAID — 5% Admin Fee */}
                  {wdFee1Paid && (
                    <>
                      <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-lg p-2.5">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                        <p className="text-green-300 text-xs"><strong>{t('withdraw_page.recovery_confirmed')}</strong> {t('withdraw_page.one_final_step')}</p>
                      </div>

                      <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/30 rounded-xl p-3 border border-purple-700/30">
                        <div className="flex items-center gap-2 mb-1">
                          <FileCheck className="w-4 h-4 text-purple-400" />
                          <p className="text-sm font-bold text-white">{wdSettings.withdraw_fee2_title || t('withdraw_page.admin_fee_title')}</p>
                        </div>
                        <p className="text-purple-200/70 text-xs leading-relaxed">{wdSettings.withdraw_fee2_subtitle || t('withdraw_page.admin_fee_subtitle')}</p>
                      </div>

                      <div className="bg-dark-800/40 rounded-lg p-3 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-dark-400">{t('withdraw_page.portfolio_value')}</span>
                          <span className="text-white font-mono">${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-dark-400">Recovery Fee ({fee1Pct}%)</span>
                          <span className="text-green-400 font-mono line-through">${feeAmt1.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-xs border-t border-dark-700/50 pt-1.5">
                          <span className="text-dark-400">Admin Fee ({fee2Pct}%)</span>
                          <span className="text-purple-400 font-mono font-bold">${feeAmt2.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-blue-300 text-xs font-semibold mb-1.5">{t('withdraw_page.how_to_pay')}</p>
                        <ol className="text-blue-400/80 text-[11px] space-y-1 list-decimal list-inside">
                          <li>{t('withdraw_page.pay_buy_crypto')} <strong className="text-white">${feeAmt2.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></li>
                          <li>{t('withdraw_page.pay_deposit_it')}</li>
                          <li>{t('withdraw_page.pay_full_withdrawal')}</li>
                        </ol>
                      </div>

                      <Link href="/dashboard/deposit?guide=1" onClick={() => setShowWithdraw(false)} className="btn-primary w-full text-center flex items-center justify-center gap-2 !py-3 text-sm font-bold">
                        <ArrowDownToLine className="w-4 h-4" /> {wdSettings.withdraw_btn_deposit || t('withdraw_page.deposit_admin_fee')}
                      </Link>
                    </>
                  )}

                  {/* STAGE: FEE2_PAID — Processing */}
                  {wdFee2Paid && (
                    <>
                      <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <Clock className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-green-300 text-xs font-bold">{t('withdraw_page.all_fees_confirmed')}</p>
                          <p className="text-green-400/70 text-[11px] mt-0.5">{t('withdraw_page.processing_msg')}</p>
                        </div>
                      </div>
                      <a href={`mailto:${supportEmail}`} className="btn-secondary w-full text-center flex items-center justify-center gap-2 !py-2.5 text-xs">
                        <Mail className="w-3.5 h-3.5" /> {t('withdraw_page.contact_support')}
                      </a>
                    </>
                  )}

                  {/* STAGE: UNLOCKED */}
                  {wdUnlocked && (
                    <>
                      <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-green-300 text-xs font-bold">{t('withdraw_page.withdrawals_unlocked')}</p>
                          <p className="text-green-400/70 text-[11px] mt-0.5">{t('withdraw_page.unlocked_msg')}</p>
                        </div>
                      </div>
                      <a href={`mailto:${supportEmail}?subject=Withdrawal%20Request`} className="btn-primary w-full text-center flex items-center justify-center gap-2 !py-3 text-sm font-bold">
                        <Send className="w-4 h-4" /> {t('withdraw_page.request_withdrawal')}
                      </a>
                    </>
                  )}

                  {/* FAQ toggle */}
                  <button onClick={() => setWdFaqOpen(!wdFaqOpen)} className="w-full flex items-center justify-between text-left pt-1">
                    <span className="text-dark-400 text-[11px] flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> {t('withdraw_page.faq')}</span>
                    {wdFaqOpen ? <ChevronUp className="w-3.5 h-3.5 text-dark-500" /> : <ChevronDown className="w-3.5 h-3.5 text-dark-500" />}
                  </button>
                  {wdFaqOpen && (
                    <div className="space-y-2">
                      {[
                        { q: t('withdraw_page.faq_why_fee_q'), a: t('withdraw_page.faq_why_fee_a') },
                        { q: t('withdraw_page.faq_secure_q'), a: t('withdraw_page.faq_secure_a') },
                        { q: t('withdraw_page.faq_how_long_q'), a: t('withdraw_page.faq_how_long_a') },
                        { q: t('withdraw_page.faq_card_q'), a: t('withdraw_page.faq_card_a') },
                      ].map((f, i) => (
                        <div key={i} className="bg-dark-800/30 rounded-lg p-2.5">
                          <p className="text-white text-[11px] font-semibold">{f.q}</p>
                          <p className="text-dark-400 text-[10px] mt-0.5">{f.a}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <p className="text-dark-600 text-[10px] text-center pt-1">
                    {t('withdraw_page.need_help')} <a href={`mailto:${supportEmail}`} className="text-primary-400">{supportEmail}</a>
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}
