'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import api from '@/lib/api';
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Wallet, TrendingUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface WalletData {
  id: string;
  balance: string;
  frozenBalance: string;
  coin: { id: string; symbol: string; name: string; network?: string };
}

const COIN_PRICES: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', USDT: 'tether', USDC: 'usd-coin',
  BNB: 'binancecoin', SOL: 'solana', XRP: 'ripple', ADA: 'cardano',
  DOGE: 'dogecoin', DOT: 'polkadot', AVAX: 'avalanche-2', MATIC: 'matic-network',
  LINK: 'chainlink', LTC: 'litecoin', TRX: 'tron',
};

const COIN_IMG_IDS: Record<string, number> = { BTC: 1, ETH: 279, USDT: 325, USDC: 6319, BNB: 825, SOL: 4128, XRP: 44, ADA: 2010, DOGE: 5, DOT: 12171, AVAX: 12559, MATIC: 4713, LINK: 877, LTC: 2, TRX: 1958 };

function CoinIcon({ symbol, size = 9 }: { symbol: string; size?: number }) {
  const sizeClass = `w-${size} h-${size}`;
  return (
    <div className={`${sizeClass} rounded-full bg-dark-800 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0`}>
      <img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symbol.toLowerCase()}.png`} alt={symbol} className="w-full h-full object-cover" onError={(e) => { const el = e.target as HTMLImageElement; el.style.display='none'; el.parentElement!.innerHTML = `<span class="text-xs font-bold text-primary-400">${symbol.slice(0,2)}</span>`; }} />
    </div>
  );
}

export default function WalletsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadData();
  }, [isAuthenticated]);

  async function loadData() {
    setLoading(true);
    try {
      const walletsRes = await api.get('/wallets');
      const data = walletsRes.data || [];
      setWallets(data);
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
        }
      } catch {}
    } catch {}
    setLoading(false);
  }

  const totalUSD = wallets.reduce((sum, w) => sum + parseFloat(w.balance) * (prices[w.coin.symbol] || 0), 0);

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-bold text-white">{t('wallet.my_wallets')}</h1>
            <p className="text-dark-500 text-[11px]">{t('wallet.all_balances')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/deposit" className="btn-primary inline-flex items-center gap-1.5">
              <ArrowDownToLine className="w-3 h-3" /> {t('wallet.deposit')}
            </Link>
            <Link href="/dashboard/withdraw" className="btn-secondary inline-flex items-center gap-1.5">
              <ArrowUpFromLine className="w-3 h-3" /> {t('wallet.withdraw')}
            </Link>
          </div>
        </div>

        {/* Portfolio total */}
        <div className="glass-card mb-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/20 to-cyan-900/10" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-dark-500 text-[10px] uppercase tracking-wider mb-0.5">{t('wallet.total_portfolio')}</p>
              <h2 className="text-2xl font-black text-white">${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            </div>
            <div className="text-right">
              <p className="text-dark-400 text-xs">{wallets.length} {t('wallet.assets')}</p>
            </div>
          </div>
        </div>

        {/* Wallet list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="glass-card shimmer h-20" />)}
          </div>
        ) : wallets.length === 0 ? (
          <div className="glass-card text-center py-16">
            <Wallet className="w-14 h-14 text-dark-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">{t('wallet.wallets_loading')}</h3>
            <p className="text-dark-400 mb-6 max-w-sm mx-auto">{t('wallet.wallets_loading_msg')}</p>
            <Link href="/dashboard/withdraw" className="btn-primary !py-3 !px-8 inline-flex items-center gap-2">
              <ArrowUpFromLine className="w-4 h-4" /> {t('dashboard.withdraw_funds')}
            </Link>
          </div>
        ) : (
          <div className="glass rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>{t('wallet.asset')}</th>
                    <th className="text-right">{t('wallet.balance')}</th>
                    <th className="text-right hidden sm:table-cell">{t('wallet.frozen_col')}</th>
                    <th className="text-right hidden md:table-cell">{t('wallet.price')}</th>
                    <th className="text-right">{t('wallet.value_usd')}</th>
                    <th className="text-right">{t('wallet.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((wallet) => {
                    const balance = parseFloat(wallet.balance);
                    const frozen = parseFloat(wallet.frozenBalance);
                    const price = prices[wallet.coin.symbol] || 0;
                    const usdVal = balance * price;
                    const pct = totalUSD > 0 ? (usdVal / totalUSD) * 100 : 0;
                    return (
                      <tr key={wallet.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <CoinIcon symbol={wallet.coin.symbol} size={9} />
                            <div>
                              <span className="text-white font-semibold">{wallet.coin.symbol}</span>
                              <span className="text-dark-500 ml-1.5">{wallet.coin.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="text-right font-mono text-white">{balance.toFixed(8)}</td>
                        <td className="text-right hidden sm:table-cell">
                          <span className={`font-mono ${frozen > 0 ? 'text-yellow-400' : 'text-dark-600'}`}>{frozen.toFixed(8)}</span>
                        </td>
                        <td className="text-right hidden md:table-cell font-mono">{price > 0 ? `$${price.toLocaleString()}` : '—'}</td>
                        <td className="text-right">
                          <span className={`font-mono font-semibold ${usdVal > 0 ? 'text-white' : 'text-dark-500'}`}>
                            {usdVal > 0 ? `$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                          </span>
                          {pct > 0 && <span className="text-dark-500 text-[10px] ml-1">({pct.toFixed(1)}%)</span>}
                        </td>
                        <td className="text-right">
                          <div className="flex gap-1.5 justify-end">
                            <Link href="/dashboard/deposit" className="text-green-400 hover:text-green-300 text-[10px] font-medium">Deposit</Link>
                            <Link href="/dashboard/withdraw" className="text-red-400 hover:text-red-300 text-[10px] font-medium">Withdraw</Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-2 px-1">
          <p className="text-dark-600 text-[10px]">
            Balances reflect confirmed deposits. Frozen balances are locked pending withdrawal. All funds secured in 95% cold storage.
          </p>
        </div>
      </div>
    </>
  );
}
