'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import api from '@/lib/api';
import { ArrowLeft, Activity, Monitor, Globe, Clock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function ActivityPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { t } = useI18n();
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadActivity();
  }, [isAuthenticated, page]);

  async function loadActivity() {
    setLoading(true);
    try {
      const res = await api.get(`/users/activity?page=${page}&limit=${limit}`);
      setLogs(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch {}
    setLoading(false);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <div className="max-w-4xl">
        <div className="mb-3">
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2" title="Login history and account events timeline">
              <Activity className="w-6 h-6 text-primary-400" /> {t('activity_page.title')}
            </h1>
            <p className="text-dark-400 text-sm">{t('activity_page.subtitle')}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="glass-card shimmer h-16" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="glass-card text-center py-4">
            <Activity className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">{t('activity_page.no_logs')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log: any) => (
              <div key={log.id} className="glass-card !p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center shrink-0">
                  {log.action?.includes('LOGIN') ? <Monitor className="w-4 h-4 text-primary-400" /> :
                   log.action?.includes('PASSWORD') ? <Clock className="w-4 h-4 text-yellow-400" /> :
                   <Globe className="w-4 h-4 text-dark-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{log.action?.replace(/_/g, ' ')}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {log.ipAddress && <span className="text-dark-500 text-xs font-mono">{log.ipAddress}</span>}
                    {log.userAgent && <span className="text-dark-600 text-xs truncate max-w-[200px]">{log.userAgent?.slice(0, 50)}</span>}
                  </div>
                </div>
                <div className="text-dark-500 text-xs whitespace-nowrap shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-dark-400 text-sm">{total} events total</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary text-sm !py-2 !px-4 disabled:opacity-50">← Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="btn-secondary text-sm !py-2 !px-4 disabled:opacity-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
