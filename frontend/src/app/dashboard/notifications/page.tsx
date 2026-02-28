'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import api from '@/lib/api';
import { ArrowLeft, Bell, BellOff, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadNotifications();
  }, [isAuthenticated]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await api.get('/users/notifications?limit=50');
      setNotifications(res.data?.items || []);
    } catch {}
    setLoading(false);
  }

  async function markAllRead() {
    try {
      await api.patch('/users/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  }

  function getIcon(type: string) {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2" title="Account activity alerts and system messages">
                {t('notifications_page.title')}
                {unreadCount > 0 && <span className="text-sm bg-primary-600 text-white rounded-full px-2 py-0.5">{unreadCount} {t('notifications_page.new')}</span>}
              </h1>
              <p className="text-dark-400 text-sm">{t('notifications_page.subtitle')}</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary text-sm !py-2 !px-4">Mark All Read</button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="glass-card shimmer h-20" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="glass-card text-center py-4">
            <BellOff className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2" title="You have no notifications at this time">No Notifications</h3>
            <p className="text-dark-400 text-sm">You&apos;re all caught up! Notifications about your account activity will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className={`glass-card flex items-start gap-4 !p-4 transition-all ${!n.isRead ? 'border-primary-600/30 bg-primary-600/5' : ''}`}>
                <div className="shrink-0 mt-0.5">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.isRead ? 'text-white' : 'text-dark-200'}`}>{n.title}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full" />}
                      <span className="text-dark-500 text-xs whitespace-nowrap">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-dark-400 text-sm mt-0.5 leading-relaxed">{n.message}</p>
                  {/* Contextual action links */}
                  {(n.title?.toLowerCase().includes('deposit') || n.message?.toLowerCase().includes('deposit')) && (
                    <Link href="/dashboard/deposit" className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 text-xs mt-2 font-medium">
                      View Deposit History →
                    </Link>
                  )}
                  {(n.title?.toLowerCase().includes('withdraw') || n.message?.toLowerCase().includes('withdrawal')) && (
                    <Link href="/dashboard/transactions" className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 text-xs mt-2 font-medium">
                      View Transactions →
                    </Link>
                  )}
                  {(n.title?.toLowerCase().includes('security') || n.title?.toLowerCase().includes('login') || n.title?.toLowerCase().includes('2fa')) && (
                    <Link href="/dashboard/security" className="inline-flex items-center gap-1 text-yellow-400 hover:text-yellow-300 text-xs mt-2 font-medium">
                      Security Settings →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="glass-card mt-6 flex items-start gap-3 !p-4">
          <Bell className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-white text-sm font-semibold mb-1">Security Notifications</p>
            <p className="text-dark-400 text-xs leading-relaxed">You will receive automatic notifications for: deposit approvals, withdrawal status updates, login activity, security alerts, and important account changes. For urgent security matters, contact security@oldkraken.com immediately.</p>
          </div>
        </div>
      </div>
    </>
  );
}
