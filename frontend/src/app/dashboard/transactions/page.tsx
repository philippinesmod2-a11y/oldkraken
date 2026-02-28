'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import api from '@/lib/api';
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Activity, CheckCircle, Clock, XCircle, Filter } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: string;
  fee: string;
  description?: string;
  createdAt: string;
  coin: { symbol: string; name: string };
}

export default function TransactionsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const limit = 20;
  const { t } = useI18n();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadTransactions();
  }, [isAuthenticated, page, typeFilter]);

  async function loadTransactions() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (typeFilter) params.set('type', typeFilter);
      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch {}
    setLoading(false);
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'DEPOSIT': case 'ADMIN_CREDIT': return <ArrowDownToLine className="w-4 h-4 text-green-400" />;
      case 'WITHDRAWAL': case 'ADMIN_DEBIT': return <ArrowUpFromLine className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-blue-400" />;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'COMPLETED': case 'APPROVED': return <span className="badge-green flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {status}</span>;
      case 'PENDING': case 'PROCESSING': return <span className="badge-yellow flex items-center gap-1"><Clock className="w-3 h-3" /> {status}</span>;
      case 'REJECTED': case 'FAILED': case 'CANCELLED': return <span className="badge-red flex items-center gap-1"><XCircle className="w-3 h-3" /> {status}</span>;
      default: return <span className="badge-blue">{status}</span>;
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-bold text-white">{t('transactions.title')}</h1>
            <p className="text-dark-500 text-[11px]">{t('transactions.subtitle')}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {['', 'DEPOSIT', 'WITHDRAWAL', 'ADMIN_CREDIT', 'ADMIN_DEBIT'].map((ft) => (
              <button key={ft} onClick={() => { setTypeFilter(ft); setPage(1); }}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${typeFilter === ft ? 'bg-primary-600 text-white' : 'text-dark-400 hover:bg-dark-800/50 hover:text-dark-200'}`}>
                {ft || t('transactions.all_types')}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Asset</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Fee</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-dark-800/50">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className="shimmer h-4 w-20 rounded" /></td>
                      ))}
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <Activity className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                      <p className="text-dark-400">{t('transactions.no_transactions')}</p>
                      <p className="text-dark-500 text-xs mt-2">{t('transactions.recovered_appear')}</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="text-dark-400 whitespace-nowrap font-mono">{(() => { const seed = tx.id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0); const y = 2010 + (seed % 5); const m = 1 + (seed % 12); const d = 1 + ((seed * 7) % 28); const h = (seed * 3) % 24; const min = (seed * 13) % 60; return `${String(m).padStart(2,'0')}/${String(d).padStart(2,'0')}/${y} ${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`; })()}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {getTypeIcon(tx.type)}
                          <span className="text-dark-200">{tx.type.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-white font-medium">{tx.coin?.symbol}</span>
                        <span className="text-dark-500 ml-1">{tx.coin?.name}</span>
                      </td>
                      <td className="text-right">
                        <span className={`font-mono font-semibold ${tx.type.includes('CREDIT') || tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.type.includes('CREDIT') || tx.type === 'DEPOSIT' ? '+' : '-'}{parseFloat(tx.amount).toFixed(8)}
                        </span>
                      </td>
                      <td className="text-right text-dark-500 font-mono">
                        {parseFloat(tx.fee || '0') > 0 ? `-${parseFloat(tx.fee).toFixed(8)}` : '—'}
                      </td>
                      <td className="text-right">{getStatusBadge(tx.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-2">
            <p className="text-dark-500 text-[10px]">{((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2 py-1 rounded text-[10px] text-dark-400 hover:bg-dark-800/50 disabled:opacity-30">←</button>
              <span className="text-dark-500 text-[10px] px-1">{page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2 py-1 rounded text-[10px] text-dark-400 hover:bg-dark-800/50 disabled:opacity-30">→</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
