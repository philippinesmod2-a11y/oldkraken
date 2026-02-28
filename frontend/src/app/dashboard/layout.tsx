'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/store';
import api from '@/lib/api';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, History, Bell, Settings, LogOut, Shield, Activity, Menu, X, User, Home, BookOpen, Star, Lock, Globe, ChevronDown } from 'lucide-react';
import { useI18n, languages } from '@/lib/i18n';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, fetchProfile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [walletCount, setWalletCount] = useState(0);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const { locale, setLocale, t, initFromSettings } = useI18n();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchProfile();
    api.get('/users/notifications?limit=1').then(r => setUnreadCount(r.data?.unreadCount || 0)).catch(() => {});
    api.get('/wallets').then(r => setWalletCount((r.data || []).length)).catch(() => {});
    api.get('/settings/public').then(r => {
      const settings = r.data || {};
      const defaultLang = settings.default_language || settings.defaultLanguage || 'en';
      initFromSettings(defaultLang);
    }).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const curLang = languages.find(l => l.code === locale);

  const navItems = [
    { icon: Home, label: t('nav.dashboard'), href: '/dashboard' },
    { icon: Wallet, label: t('nav.wallet'), href: '/dashboard/wallets', badge: walletCount > 0 ? String(walletCount) : undefined },
    { icon: ArrowDownToLine, label: t('nav.deposit'), href: '/dashboard/deposit' },
    { icon: ArrowUpFromLine, label: t('nav.withdraw'), href: '/dashboard/withdraw' },
    { icon: History, label: t('nav.transactions'), href: '/dashboard/transactions' },
    { icon: Bell, label: t('nav.notifications'), href: '/dashboard/notifications', badge: unreadCount > 0 ? String(unreadCount) : undefined },
    { icon: Activity, label: t('nav.activity'), href: '/dashboard/activity' },
    { icon: User, label: t('nav.profile'), href: '/dashboard/profile' },
    { icon: Shield, label: t('nav.security'), href: '/dashboard/security' },
    { icon: BookOpen, label: t('nav.how_to_buy'), href: '/dashboard/deposit?guide=1' },
    { icon: Star, label: t('nav.referral'), href: '/dashboard/referral' },
    { icon: Settings, label: t('nav.settings'), href: '/dashboard/settings' },
    ...((user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? [{ icon: Lock, label: t('nav.admin'), href: '/admin', special: true }] : []),
  ];

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Sidebar — compact Kraken-style */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[200px] bg-dark-900/95 border-r border-dark-800/60 transform transition-transform duration-200 lg:translate-x-0 lg:static flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-dark-800/60">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-base">🐙</span>
            <span className="font-bold text-white text-sm">OldKraken</span>
          </Link>
          <button className="lg:hidden text-dark-400" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 py-2 border-b border-dark-800/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary-600/20 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-primary-400">{user?.firstName?.[0] || '?'}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.firstName || user?.email?.split('@')[0]}</p>
              <p className="text-dark-500 text-[10px] truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-1.5 space-y-0.5 overflow-y-auto">
          {navItems.map((item: any, i) => {
            const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
            return (
              <Link key={i} href={item.href}
                className={`flex items-center gap-2 px-2.5 py-[6px] rounded text-[11px] font-medium transition-colors ${
                  isActive ? 'bg-primary-600/10 text-primary-400 border-l-2 border-primary-500' :
                  item.special ? 'bg-yellow-500/5 text-yellow-400 hover:bg-yellow-500/10' :
                  'text-dark-400 hover:bg-dark-800/50 hover:text-dark-200'
                }`}>
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badge && <span className="ml-auto text-[9px] bg-primary-600 text-white w-4 h-4 rounded-full flex items-center justify-center font-bold">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-dark-800/40 px-2 py-1.5">
          <button onClick={() => { if (confirm(t('nav.sign_out_confirm'))) logout(); }} className="flex items-center gap-2 px-2.5 py-[6px] rounded text-[11px] font-medium text-dark-500 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors">
            <LogOut className="w-3.5 h-3.5" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-dark-950/90 backdrop-blur-md border-b border-dark-800/40 px-3 py-1.5 flex items-center justify-between lg:px-5">
          <button className="lg:hidden text-dark-300" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-dark-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Connected
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-dark-400 hover:bg-dark-800/60 hover:text-dark-200 transition-colors"
              >
                <span className="text-sm leading-none">{curLang?.flag}</span>
                <ChevronDown className={`w-2.5 h-2.5 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-dark-800 border border-dark-700 rounded-md shadow-xl overflow-hidden z-50">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setLocale(lang.code); setLangOpen(false); }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 text-[11px] w-full text-left hover:bg-dark-700 transition-colors ${locale === lang.code ? 'text-primary-400 bg-primary-600/10' : 'text-dark-300'}`}
                    >
                      <span className="text-sm">{lang.flag}</span>
                      <span>{lang.name}</span>
                      {locale === lang.code && <span className="ml-auto text-primary-400">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link href="/dashboard/notifications" className="relative text-dark-500 hover:text-white p-1">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold px-0.5">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </Link>
            <Link href="/dashboard/profile" className="w-6 h-6 rounded-full bg-primary-600/20 flex items-center justify-center text-[10px] font-bold text-primary-400 hover:bg-primary-600/30 transition-colors">
              {user?.firstName?.[0] || '?'}
            </Link>
          </div>
        </header>

        <div className="p-3 lg:p-4 space-y-3">
          {children}
        </div>
      </main>
    </div>
  );
}
