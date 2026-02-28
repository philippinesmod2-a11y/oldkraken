'use client';

import { useState, useEffect, Fragment, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import api from '@/lib/api';
import { Users, ArrowDownToLine, ArrowUpFromLine, BarChart3, Settings, Mail, Shield, Coins, Bell, FileText, Home, LogOut, ChevronRight, Clock, CheckCircle, XCircle, Search, Send, AlertTriangle, Eye, UserX, UserCheck, CreditCard, Plus, Minus, Copy, RefreshCw, HelpCircle, MessageSquare, Radio } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

type Tab = 'dashboard' | 'users' | 'deposits' | 'withdrawals' | 'coins' | 'settings' | 'email' | 'logs' | 'marketing' | 'tickets' | 'livechat';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any>({ items: [], total: 0 });
  const [deposits, setDeposits] = useState<any>({ items: [], total: 0 });
  const [withdrawals, setWithdrawals] = useState<any>({ items: [], total: 0 });
  const [logs, setLogs] = useState<any>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [emailForm, setEmailForm] = useState({ toEmail: '', subject: '', body: '' });
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [viewUser, setViewUser] = useState<any>(null);
  const [balanceForm, setBalanceForm] = useState({ coinId: '', amount: '', type: 'credit' as 'credit' | 'debit', reason: '' });
  const [depositApproveForm, setDepositApproveForm] = useState({ amount: '', comment: '' });
  const [withdrawRejectForm, setWithdrawRejectForm] = useState({ reason: '', comment: '' });
  const [magicLinkUser, setMagicLinkUser] = useState<any>(null);
  const [magicLinkResult, setMagicLinkResult] = useState<{ url: string; expiresAt: string } | null>(null);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [coins, setCoins] = useState<any[]>([]);
  const [editingCoin, setEditingCoin] = useState<any>(null);
  const [coinForm, setCoinForm] = useState({ depositAddress: '', depositEnabled: true, withdrawEnabled: true, depositMinimum: '', withdrawalFee: '', withdrawalMinimum: '' });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [mktStats, setMktStats] = useState<any>(null);
  const [mktForms, setMktForms] = useState<any[]>([]);
  const [mktSubs, setMktSubs] = useState<any>({ items: [], total: 0 });
  const [mktCampaigns, setMktCampaigns] = useState<any>({ items: [], total: 0 });
  const [mktFormModal, setMktFormModal] = useState(false);
  const [mktEditFormId, setMktEditFormId] = useState<string | null>(null);
  const [mktFormData, setMktFormData] = useState({ name: '', title: '', description: '', buttonText: 'Subscribe', fields: ['email', 'firstName'] as string[], successMsg: '', topMessage: '' });
  const [mktNewField, setMktNewField] = useState('');
  const [mktCampModal, setMktCampModal] = useState(false);
  const [mktCampData, setMktCampData] = useState({ name: '', subject: '', body: '', fromName: '' });
  const [mktImportText, setMktImportText] = useState('');
  const [mktSending, setMktSending] = useState<string | null>(null);
  const [createUserModal, setCreateUserModal] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'USER', kycStatus: 'APPROVED', withdrawStage: 'BLOCKED', emailVerified: true });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [adminReady, setAdminReady] = useState(false);
  const [tickets, setTickets] = useState<any>({ items: [], total: 0 });
  const [ticketReply, setTicketReply] = useState<Record<string, string>>({});
  const [analytics, setAnalytics] = useState<any>(null);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [chatUnread, setChatUnread] = useState(0);
  const [activeChatSession, setActiveChatSession] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatSocketRef = useRef<Socket | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return; }
    if (isAuthenticated && user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      setAdminReady(true);
      loadDashboard();
    }
  }, [isAuthenticated, user]);

  useEffect(() => { if (adminReady) setPage(1); }, [tab, statusFilter]);
  useEffect(() => { if (adminReady) loadTabData(); }, [tab, statusFilter, page, adminReady]);
  // Debounced user search
  useEffect(() => {
    if (!adminReady || tab !== 'users') return;
    const timer = setTimeout(() => { setPage(1); loadTabData(); }, 400);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (!adminReady) return;
    if (tab === 'marketing') {
      api.get('/marketing/admin/stats').then(r => setMktStats(r.data)).catch(() => {});
      api.get('/marketing/admin/forms').then(r => setMktForms(r.data || [])).catch(() => {});
      api.get('/marketing/admin/subscribers?limit=50').then(r => setMktSubs(r.data || { items: [], total: 0 })).catch(() => {});
      api.get('/marketing/admin/campaigns').then(r => setMktCampaigns(r.data || { items: [], total: 0 })).catch(() => {});
    }
  }, [tab, adminReady]);
  useEffect(() => {
    if (!adminReady) return;
    if (tab === 'settings') {
      if (Object.keys(settingsMap).length === 0) {
        api.get('/admin/settings').then(r => {
          const m: Record<string, string> = {};
          (r.data || []).forEach((s: any) => { m[s.key] = s.value; });
          setSettingsMap(m);
        }).catch(() => {});
      }
      api.get('/settings/announcements').then(r => setAnnouncements(Array.isArray(r.data) ? r.data : r.data?.items || [])).catch(() => {});
    }
  }, [tab, adminReady]);

  // Live Chat WebSocket — connect ONLY when livechat tab is active, 30min auto-refresh
  useEffect(() => {
    if (!adminReady || tab !== 'livechat') return;
    const socket = io(`${SOCKET_URL}/chat`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 60000,
      timeout: 10000,
    });
    chatSocketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('join', { role: 'admin' });
    });
    socket.on('sessions', (data: any) => {
      setChatSessions(data.sessions || []);
      setChatUnread(data.unread || 0);
    });
    socket.on('session-updated', () => {
      // Do NOT call get-sessions here — avoid cascade loop
    });
    socket.on('new-message', (msg: any) => {
      setChatMessages(prev => {
        if (prev.some((m: any) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.sender === 'visitor') {
        setChatUnread(u => u + 1);
      }
    });
    socket.on('unread-count', (count: number) => setChatUnread(count));
    socket.on('messages', (data: any) => {
      setChatMessages(data.messages || []);
    });
    // 30-minute auto-refresh for session list (not nonstop)
    const refreshInterval = setInterval(() => {
      if (socket.connected) socket.emit('get-sessions');
    }, 30 * 60 * 1000);
    return () => {
      clearInterval(refreshInterval);
      socket.disconnect();
      chatSocketRef.current = null;
    };
  }, [adminReady, tab]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  function openChatSession(sessionId: string) {
    setActiveChatSession(sessionId);
    setChatInput('');
    chatSocketRef.current?.emit('load-messages', { sessionId });
    chatSocketRef.current?.emit('mark-read', { sessionId });
  }

  function sendAdminChat() {
    if (!chatInput.trim() || !activeChatSession || !chatSocketRef.current) return;
    chatSocketRef.current.emit('admin-reply', { sessionId: activeChatSession, message: chatInput.trim() });
    setChatInput('');
  }

  function closeChatSession(sessionId: string) {
    chatSocketRef.current?.emit('close-session', { sessionId });
    if (activeChatSession === sessionId) { setActiveChatSession(null); setChatMessages([]); }
  }

  function deleteChatSession(sessionId: string) {
    if (!confirm('Delete this chat session?')) return;
    chatSocketRef.current?.emit('delete-session', { sessionId });
    if (activeChatSession === sessionId) { setActiveChatSession(null); setChatMessages([]); }
  }

  async function loadDashboard() {
    try {
      const [dashRes, depsRes, wdsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/deposits?limit=5'),
        api.get('/admin/withdrawals?limit=5'),
      ]);
      setStats(dashRes.data);
      setDeposits(depsRes.data);
      setWithdrawals(wdsRes.data);
    } catch (err) { console.error('Failed to load admin dashboard:', err); }
    setLoading(false);
  }

  async function loadTabData() {
    try {
      if (tab === 'coins') {
        const res = await api.get('/admin/coins');
        setCoins(res.data || []);
      } else if (tab === 'users') {
        const res = await api.get(`/admin/users?limit=${PAGE_SIZE}&page=${page}&search=${search}&status=${statusFilter}`);
        setUsers(res.data);
      } else if (tab === 'deposits') {
        const res = await api.get(`/admin/deposits?limit=${PAGE_SIZE}&page=${page}&status=${statusFilter}`);
        setDeposits(res.data);
      } else if (tab === 'withdrawals') {
        const res = await api.get(`/admin/withdrawals?limit=${PAGE_SIZE}&page=${page}&status=${statusFilter}`);
        setWithdrawals(res.data);
      } else if (tab === 'logs') {
        const res = await api.get(`/admin/logs?limit=${PAGE_SIZE}&page=${page}`);
        setLogs(res.data);
      } else if (tab === 'email') {
        if (!users.items?.length) {
          const res = await api.get('/admin/users?limit=200');
          setUsers(res.data);
        }
      } else if (tab === 'tickets') {
        const res = await api.get(`/admin/tickets?limit=${PAGE_SIZE}&page=${page}&status=${statusFilter}`);
        setTickets(res.data);
        if (!analytics) {
          const aRes = await api.get('/admin/analytics');
          setAnalytics(aRes.data);
        }
      }
    } catch (err) { console.error('Failed to load tab data:', err); }
  }

  async function approveDeposit(id: string) {
    if (!depositApproveForm.amount) return;
    try {
      await api.patch(`/admin/deposits/${id}/approve`, { amount: parseFloat(depositApproveForm.amount), comment: depositApproveForm.comment });
      setDepositApproveForm({ amount: '', comment: '' });
      loadTabData();
      loadDashboard();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  }

  async function rejectDeposit(id: string, reason?: string) {
    try {
      await api.patch(`/admin/deposits/${id}/reject`, { comment: reason || 'Rejected by admin' });
      loadTabData();
      loadDashboard();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  }

  async function approveWithdrawal(id: string) {
    try {
      await api.patch(`/admin/withdrawals/${id}/approve`, { comment: 'Approved by admin' });
      loadTabData();
      loadDashboard();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  }

  async function rejectWithdrawal(id: string) {
    if (!withdrawRejectForm.reason) return;
    try {
      await api.patch(`/admin/withdrawals/${id}/reject`, { reason: withdrawRejectForm.reason, comment: withdrawRejectForm.comment });
      setWithdrawRejectForm({ reason: '', comment: '' });
      loadTabData();
      loadDashboard();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  }

  async function freezeUser(userId: string) {
    try {
      await api.patch(`/admin/users/${userId}/freeze`);
      loadTabData();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  }

  async function unfreezeUser(userId: string) {
    try {
      await api.patch(`/admin/users/${userId}/unfreeze`);
      loadTabData();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  }

  async function modifyBalance(userId: string) {
    if (!balanceForm.coinId || !balanceForm.amount || !balanceForm.reason) { alert('Please fill in all fields: coin, amount, and reason'); return; }
    try {
      await api.post(`/admin/users/${userId}/balance`, {
        coinId: balanceForm.coinId,
        amount: parseFloat(balanceForm.amount),
        type: balanceForm.type,
        reason: balanceForm.reason,
      });
      setBalanceForm({ coinId: '', amount: '', type: 'credit', reason: '' });
      setSelectedUser(null);
      loadTabData();
      alert('Balance modified successfully');
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  }

  async function sendEmail() {
    if (!emailForm.toEmail || !emailForm.subject || !emailForm.body) return;
    setEmailSending(true);
    setEmailResult('');
    try {
      await api.post('/admin/email/send', emailForm);
      setEmailResult('Email sent successfully!');
      setEmailForm({ toEmail: '', subject: '', body: '' });
    } catch (err: any) {
      setEmailResult(err.response?.data?.message || 'Failed to send email');
    }
    setEmailSending(false);
  }

  async function generateMagicLink(userId: string) {
    setMagicLinkLoading(true);
    setMagicLinkResult(null);
    try {
      const res = await api.post(`/admin/users/${userId}/magic-link`, { expiresInHours: 24 });
      setMagicLinkResult({ url: res.data.url, expiresAt: res.data.expiresAt });
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to generate magic link'); }
    setMagicLinkLoading(false);
  }

  async function reset2FA(userId: string) {
    try {
      await api.patch(`/admin/users/${userId}/reset-2fa`);
      alert('2FA reset successfully');
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  }

  const navItems: { icon: any; label: string; tab: Tab }[] = [
    { icon: BarChart3, label: 'Dashboard', tab: 'dashboard' },
    { icon: Users, label: 'Users', tab: 'users' },
    { icon: ArrowDownToLine, label: 'Deposits', tab: 'deposits' },
    { icon: ArrowUpFromLine, label: 'Withdrawals', tab: 'withdrawals' },
    { icon: Coins, label: 'Coins', tab: 'coins' },
    { icon: Mail, label: 'Send Email', tab: 'email' },
    { icon: Settings, label: 'Settings', tab: 'settings' },
    { icon: Send, label: 'Marketing', tab: 'marketing' },
    { icon: MessageSquare, label: 'Tickets', tab: 'tickets' },
    { icon: Radio, label: 'Live Chat', tab: 'livechat' },
    { icon: FileText, label: 'Audit Logs', tab: 'logs' },
  ];

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-dark-900 border-r border-dark-800 flex-shrink-0 hidden lg:block">
        <div className="p-4 border-b border-dark-800">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🐙</span>
            <span className="font-bold text-white" title="OldKraken Administration Panel">Admin Panel</span>
          </Link>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item, i) => (
            <button key={i} onClick={() => setTab(item.tab)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-colors ${tab === item.tab ? 'bg-primary-600/10 text-primary-400' : 'text-dark-300 hover:bg-dark-800 hover:text-white'}`}
              title={item.label === 'Dashboard' ? 'Overview and quick stats' : item.label === 'Users' ? 'Manage platform users' : item.label === 'Deposits' ? 'Review and approve deposits' : item.label === 'Withdrawals' ? 'Review and approve withdrawals' : item.label === 'Coins' ? 'Manage cryptocurrency listings' : item.label === 'Send Email' ? 'Send emails to users' : item.label === 'Settings' ? 'Platform configuration' : 'View admin audit trail'}>
              <item.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{item.label}</span>
              <span className="text-dark-700 text-[9px] font-mono hidden lg:inline">{i + 1}</span>
              {item.tab === 'deposits' && stats?.pendingDeposits > 0 && <span className="bg-yellow-500/20 text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{stats.pendingDeposits}</span>}
              {item.tab === 'withdrawals' && stats?.pendingWithdrawals > 0 && <span className="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{stats.pendingWithdrawals}</span>}
              {item.tab === 'coins' && coins.length > 0 && <span className="bg-dark-700 text-dark-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{coins.length}</span>}
              {item.tab === 'livechat' && chatUnread > 0 && <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">{chatUnread}</span>}
            </button>
          ))}
          <div className="border-t border-dark-800 my-2" />
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dark-300 hover:bg-dark-800 hover:text-white w-full" title="Return to the user dashboard">
            <Home className="w-4 h-4" /> Back to App
          </Link>
          <button onClick={() => { if (confirm('Are you sure you want to sign out?')) logout(); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dark-400 hover:bg-dark-800 hover:text-red-400 w-full" title="Sign out of your admin session">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 lg:p-8">
        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white" title="Overview of platform activity, stats, and quick actions">Admin Dashboard</h1>
              <button onClick={() => { setLoading(true); loadDashboard(); }} className="btn-secondary text-xs !py-1.5 !px-3 flex items-center gap-1.5" title="Reload all dashboard data">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="glass-card shimmer h-24" />)}
              </div>
            ) : (
              <>
                {/* System Health */}
                <div className="glass-card !py-3 flex items-center gap-3" title="System health status: All backend services are running normally. Backend API, Database, Email Service, and Market Feed are operational.">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse shrink-0" />
                  <div className="flex-1">
                    <p className="text-green-400 text-sm font-semibold">All Systems Operational</p>
                    <p className="text-dark-500 text-[10px]">Backend API · Database · Email Service · Market Feed</p>
                  </div>
                  <span className="text-dark-600 text-[10px] shrink-0">Last refresh: {new Date().toLocaleTimeString()}</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="stat-card border border-blue-600/20 cursor-pointer hover:border-blue-500/40 transition-colors" onClick={() => setTab('users')} title="Total registered users on the platform. Click to manage users.">
                    <Users className="w-5 h-5 text-blue-400" />
                    <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
                    <div className="text-xs text-dark-400">Total Users</div>
                    {stats?.activeUsers !== undefined && <div className="text-xs text-green-400 font-medium">{stats.activeUsers} active{stats?.frozenUsers > 0 && <span className="text-red-400 ml-1">· {stats.frozenUsers} frozen</span>}</div>}
                    {(stats?.newUsersToday > 0 || stats?.newUsersThisWeek > 0) && <div className="text-[10px] text-cyan-400">+{stats.newUsersToday} today · +{stats.newUsersThisWeek} this week</div>}
                    {stats?.totalUsers > 0 && stats?.newUsersThisWeek > 0 && <div className="text-[10px] text-dark-600">{((stats.newUsersThisWeek / stats.totalUsers) * 100).toFixed(1)}% growth this week</div>}
                  </div>
                  <div className="stat-card border border-yellow-600/20 cursor-pointer hover:border-yellow-500/40 transition-colors" onClick={() => setTab('deposits')} title="Deposits awaiting admin review. Click to manage deposits.">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <div className="text-2xl font-bold text-yellow-400">{stats?.pendingDeposits || 0}</div>
                    <div className="text-xs text-dark-400">Pending Deposits</div>
                    <div className="text-xs text-dark-500">{stats?.totalDeposits || 0} total · {stats?.approvedDeposits || 0} approved</div>
                  </div>
                  <div className="stat-card border border-orange-600/20 cursor-pointer hover:border-orange-500/40 transition-colors" onClick={() => setTab('withdrawals')} title="Withdrawals awaiting admin approval. Click to manage withdrawals.">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    <div className="text-2xl font-bold text-orange-400">{stats?.pendingWithdrawals || 0}</div>
                    <div className="text-xs text-dark-400">Pending Withdrawals</div>
                    <div className="text-xs text-dark-500">{stats?.totalWithdrawals || 0} total · {stats?.completedWithdrawals || 0} completed</div>
                  </div>
                  <div className="stat-card border border-green-600/20 cursor-pointer hover:border-green-500/40 transition-colors" onClick={() => setTab('coins')} title="Successfully approved deposits. Click to manage coins.">
                    <ArrowDownToLine className="w-5 h-5 text-green-400" />
                    <div className="text-2xl font-bold text-white">{stats?.approvedDeposits || 0}</div>
                    <div className="text-xs text-dark-400">Approved Deposits</div>
                    <div className="text-xs text-dark-500">{stats?.completedWithdrawals || 0} completed withdrawals</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="glass-card !py-3 text-center cursor-help" title="Total cryptocurrency coins configured on the platform">
                    <div className="text-xl font-bold text-cyan-400">{stats?.totalCoins || 0}</div>
                    <div className="text-xs text-dark-500">Active Coins</div>
                  </div>
                  <div className="glass-card !py-3 text-center cursor-help" title="Currently active announcements visible to users">
                    <div className="text-xl font-bold text-primary-400">{stats?.totalAnnouncements || 0}</div>
                    <div className="text-xs text-dark-500">Live Announcements</div>
                  </div>
                  <div className="glass-card !py-3 text-center cursor-help" title="Users with ACTIVE status who can fully use the platform">
                    <div className="text-xl font-bold text-green-400">{stats?.activeUsers || 0}</div>
                    <div className="text-xs text-dark-500">Active Users</div>
                  </div>
                  <div className="glass-card !py-3 text-center cursor-pointer hover:border-dark-600 transition-colors" onClick={() => setTab('logs')} title="Click to view all admin audit logs">
                    <div className="text-xl font-bold text-dark-300">{logs.total || 0}</div>
                    <div className="text-xs text-dark-500">Audit Logs</div>
                  </div>
                </div>

                {/* Platform Balance Estimate */}
                <div className="glass-card bg-gradient-to-br from-primary-900/20 to-cyan-900/10 border border-primary-600/20" title="Aggregated platform statistics across all user accounts, deposits, and withdrawals">
                  <h3 className="text-white font-bold mb-2 flex items-center gap-2" title="Aggregated overview of platform users, coins, and verification stats">💰 Platform Balance</h3>
                  <p className="text-dark-500 text-[10px] mb-2">Estimated total across all user wallets</p>
                  <div className="text-3xl font-black text-primary-400">{stats?.totalUsers || 0} <span className="text-sm text-dark-400 font-normal">users</span></div>
                  <div className="text-dark-500 text-xs mt-1">{coins.length} coins active · {stats?.totalDeposits || 0} deposits · {stats?.totalWithdrawals || 0} withdrawals · KYC: {stats?.kycApproved || 0}/{stats?.totalUsers || 0} · 2FA: {stats?.twoFaEnabled || 0}/{stats?.totalUsers || 0}</div>
                </div>

                {/* Transaction Summary */}
                <div className="glass-card">
                  <h3 className="text-white font-bold mb-3" title="Overview of all deposit and withdrawal activity on the platform">Transaction Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 text-center" title="All deposit requests received from users">
                      <div className="text-green-400 text-xs mb-1">Total Deposits</div>
                      <div className="text-2xl font-black text-white">{stats?.totalDeposits || 0}</div>
                      <div className="text-dark-500 text-[10px] mt-1">{stats?.approvedDeposits || 0} approved · {stats?.pendingDeposits || 0} pending</div>
                    </div>
                    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-center" title="All withdrawal requests submitted by users">
                      <div className="text-red-400 text-xs mb-1">Total Withdrawals</div>
                      <div className="text-2xl font-black text-white">{stats?.totalWithdrawals || 0}</div>
                      <div className="text-dark-500 text-[10px] mt-1">{stats?.completedWithdrawals || 0} completed · {stats?.pendingWithdrawals || 0} pending</div>
                    </div>
                  </div>
                  {(stats?.totalDeposits > 0 || stats?.totalWithdrawals > 0) && (
                    <div className="text-center text-[10px] text-dark-600 mt-1" title="Deposit-to-Withdrawal ratio across all time">
                      Ratio: {stats?.totalDeposits || 0}:{stats?.totalWithdrawals || 0} (D:W)
                    </div>
                  )}
                </div>

                {(stats?.pendingDeposits > 0 || stats?.pendingWithdrawals > 0) && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
                      <p className="text-yellow-300 text-sm font-medium">
                        You have {stats?.pendingDeposits || 0} pending deposits and {stats?.pendingWithdrawals || 0} pending withdrawals requiring review.
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {stats?.pendingDeposits > 0 && (
                        <button onClick={() => { setStatusFilter('PENDING'); setTab('deposits'); }} className="bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-300 text-xs font-medium py-1.5 px-3 rounded-lg transition-colors" title="Jump to pending deposits for review">
                          Review Deposits →
                        </button>
                      )}
                      {stats?.pendingWithdrawals > 0 && (
                        <button onClick={() => { setStatusFilter('PENDING'); setTab('withdrawals'); }} className="bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-300 text-xs font-medium py-1.5 px-3 rounded-lg transition-colors" title="Jump to pending withdrawals for review">
                          Review Withdrawals →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {stats?.frozenUsers > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <UserX className="w-5 h-5 text-red-400 shrink-0" />
                      <p className="text-red-300 text-sm font-medium">{stats.frozenUsers} frozen user{stats.frozenUsers > 1 ? 's' : ''} on the platform.</p>
                    </div>
                    <button onClick={() => { setStatusFilter('FROZEN'); setTab('users'); }} className="bg-red-600/30 hover:bg-red-600/50 text-red-300 text-xs font-medium py-1.5 px-3 rounded-lg transition-colors shrink-0" title="Jump to frozen users list">
                      View Frozen →
                    </button>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Review Deposits', count: stats?.pendingDeposits || 0, tab: 'deposits', color: 'from-yellow-600/20 to-yellow-700/20', border: 'border-yellow-600/30', textColor: 'text-yellow-400' },
                    { label: 'Review Withdrawals', count: stats?.pendingWithdrawals || 0, tab: 'withdrawals', color: 'from-orange-600/20 to-orange-700/20', border: 'border-orange-600/30', textColor: 'text-orange-400' },
                    { label: 'Manage Users', count: stats?.totalUsers || 0, tab: 'users', color: 'from-blue-600/20 to-blue-700/20', border: 'border-blue-600/30', textColor: 'text-blue-400' },
                  ].map((action) => (
                    <button key={action.tab} onClick={() => setTab(action.tab as any)}
                      className={`glass-card text-left bg-gradient-to-br ${action.color} border ${action.border} hover:opacity-90 transition-all`} title={`${action.label} — ${action.count} items. Click to open.`}>
                      <div className={`text-3xl font-black ${action.textColor} mb-1`}>{action.count}</div>
                      <div className="text-white text-sm font-medium">{action.label}</div>
                      <div className={`text-xs ${action.textColor} mt-1`}>Click to manage →</div>
                    </button>
                  ))}
                </div>

                {/* System Uptime */}
                <div className="glass-card !py-3 flex items-center justify-between" title="Server uptime since last restart and current refresh time">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-dark-400 text-xs">System Online</span>
                  </div>
                  <span className="text-dark-500 text-[10px] font-mono">Uptime: {(() => { const ms = Date.now() - (stats?.serverStartedAt ? new Date(stats.serverStartedAt).getTime() : Date.now()); const h = Math.floor(ms / 3600000); const d = Math.floor(h / 24); return d > 0 ? `${d}d ${h % 24}h` : `${h}h ${Math.floor((ms % 3600000) / 60000)}m`; })()} · Refreshed: {new Date().toLocaleTimeString()}</span>
                </div>

                {/* Platform Health Summary */}
                <div className="glass-card !py-3" title="Quick overview of platform status — pending items, frozen accounts, and active resources">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-dark-400">Platform Health</span>
                    <div className="flex gap-3">
                      <span className={stats?.pendingDeposits > 0 || stats?.pendingWithdrawals > 0 ? 'text-yellow-400' : 'text-green-400'}>{stats?.pendingDeposits > 0 || stats?.pendingWithdrawals > 0 ? '⚠ Pending items' : '✓ No pending'}</span>
                      <span className={stats?.frozenUsers > 0 ? 'text-red-400' : 'text-green-400'}>{stats?.frozenUsers > 0 ? `❄ ${stats.frozenUsers} frozen` : '✓ No frozen'}</span>
                      <span className="text-dark-500">{coins.length} coins · {stats?.totalUsers || 0} users</span>
                    </div>
                  </div>
                </div>

                {/* Pending Items Quick Actions */}
                {(stats?.pendingDeposits > 0 || stats?.pendingWithdrawals > 0) && (
                  <div className="glass-card !py-4">
                    <p className="text-white text-sm font-semibold mb-3" title="Pending items that need admin review or action">⚡ Items Requiring Attention</p>
                    <div className="flex flex-wrap gap-2">
                      {stats?.pendingDeposits > 0 && (
                        <button onClick={() => { setTab('deposits'); setStatusFilter('PENDING'); }}
                          className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-medium px-3 py-2 rounded-lg hover:bg-yellow-500/30 transition-colors" title="Review pending deposit requests">
                          <Clock className="w-3.5 h-3.5" />
                          {stats.pendingDeposits} Pending Deposit{stats.pendingDeposits > 1 ? 's' : ''} →
                        </button>
                      )}
                      {stats?.pendingWithdrawals > 0 && (
                        <button onClick={() => { setTab('withdrawals'); setStatusFilter('PENDING'); }}
                          className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-medium px-3 py-2 rounded-lg hover:bg-orange-500/30 transition-colors" title="Review pending withdrawal requests">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {stats.pendingWithdrawals} Pending Withdrawal{stats.pendingWithdrawals > 1 ? 's' : ''} →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Registrations */}
                <div className="glass-card !py-4">
                  <p className="text-white text-sm font-semibold mb-2" title="Key metrics summarizing platform activity and resources">📊 Platform Overview</p>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="bg-dark-800/40 rounded-lg p-2" title="Users with ACTIVE account status">
                      <p className="text-green-400 text-lg font-bold">{stats?.activeUsers || 0}</p>
                      <p className="text-dark-500 text-[10px]">Active Users</p>
                    </div>
                    <div className="bg-dark-800/40 rounded-lg p-2" title="Accounts currently frozen by admin">
                      <p className="text-red-400 text-lg font-bold">{stats?.frozenUsers || 0}</p>
                      <p className="text-dark-500 text-[10px]">Frozen</p>
                    </div>
                    <div className="bg-dark-800/40 rounded-lg p-2" title="Total deposits approved by admin">
                      <p className="text-primary-400 text-lg font-bold">{stats?.approvedDeposits || 0}</p>
                      <p className="text-dark-500 text-[10px]">Approved Deps</p>
                    </div>
                    <div className="bg-dark-800/40 rounded-lg p-2" title="Total withdrawals successfully completed">
                      <p className="text-cyan-400 text-lg font-bold">{stats?.completedWithdrawals || 0}</p>
                      <p className="text-dark-500 text-[10px]">Completed Wdws</p>
                    </div>
                    <div className="bg-dark-800/40 rounded-lg p-2" title="Active platform announcements">
                      <p className="text-purple-400 text-lg font-bold">{stats?.totalAnnouncements || 0}</p>
                      <p className="text-dark-500 text-[10px]">Announcements</p>
                    </div>
                    <div className="bg-dark-800/40 rounded-lg p-2" title="Total admin emails sent to users">
                      <p className="text-orange-400 text-lg font-bold">{stats?.totalEmails || 0}</p>
                      <p className="text-dark-500 text-[10px]">Emails Sent</p>
                    </div>
                    <div className="bg-dark-800/40 rounded-lg p-2" title="Total platform configuration settings">
                      <p className="text-dark-300 text-lg font-bold">{stats?.totalSettings || 0}</p>
                      <p className="text-dark-500 text-[10px]">Settings</p>
                    </div>
                    <div className="bg-dark-800/40 rounded-lg p-2" title="Total admin audit log entries">
                      <p className="text-amber-400 text-lg font-bold">{logs.total || 0}</p>
                      <p className="text-dark-500 text-[10px]">Audit Logs</p>
                    </div>
                    <div className="bg-dark-800/40 rounded-lg p-2" title="New user registrations today">
                      <p className="text-lime-400 text-lg font-bold">{stats?.newUsersToday || 0}</p>
                      <p className="text-dark-500 text-[10px]">New Today</p>
                    </div>
                    <div className="bg-dark-800/40 rounded-lg p-2" title="Total cryptocurrency wallets across all users">
                      <p className="text-teal-400 text-lg font-bold">{stats?.totalWallets || 0}</p>
                      <p className="text-dark-500 text-[10px]">Wallets</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                    <span title="Most recent admin actions logged on the platform">Recent Admin Activity</span>
                    <button onClick={() => setTab('logs')} className="text-xs text-primary-400 hover:text-primary-300" title="Open full audit logs tab">View All →</button>
                  </h3>
                  {stats?.recentLogs?.length > 0 ? (
                    <div className="space-y-2">
                      {stats.recentLogs.slice(0, 8).map((log: any) => (
                        <div key={log.id} className="flex items-center justify-between py-2 border-b border-dark-800/30 last:border-0 text-sm hover:bg-dark-800/20 rounded px-1 transition-colors cursor-pointer" onClick={() => setTab('logs')}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${log.action?.includes('DELETE') || log.action?.includes('REJECT') || log.action?.includes('FREEZE') ? 'bg-red-500/20 text-red-400' : log.action?.includes('CREATE') || log.action?.includes('APPROVE') ? 'bg-green-500/20 text-green-400' : log.action?.includes('UPDATE') || log.action?.includes('EDIT') ? 'bg-yellow-500/20 text-yellow-400' : 'badge-blue'}`}>{log.action}</span>
                            <span className="text-dark-400 truncate">{log.details?.slice(0, 60)}</span>
                          </div>
                          <span className="text-dark-500 text-xs shrink-0 ml-2">{(() => { const diff = Date.now() - new Date(log.createdAt).getTime(); const m = Math.floor(diff / 60000); const h = Math.floor(m / 60); const d = Math.floor(h / 24); return d > 0 ? `${d}d ago` : h > 0 ? `${h}h ago` : `${m}m ago`; })()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-dark-400 text-sm">No recent admin activity</p>
                  )}
                </div>

                {/* Recent Deposits Mini-list */}
                <div className="glass-card">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                    <span title="Latest deposit requests from users">Recent Deposits</span>
                    <button onClick={() => setTab('deposits')} className="text-xs text-primary-400 hover:text-primary-300" title="Open full deposits management tab">View All →</button>
                  </h3>
                  {deposits.items?.length > 0 ? (
                    <div className="space-y-2">
                      {deposits.items.slice(0, 5).map((dep: any) => (
                        <div key={dep.id} className="flex items-center justify-between py-2 border-b border-dark-800/30 last:border-0 text-sm hover:bg-dark-800/20 rounded px-1 transition-colors cursor-pointer" onClick={() => setTab('deposits')}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={dep.status === 'APPROVED' ? 'badge-green' : dep.status === 'REJECTED' ? 'badge-red' : 'badge-yellow'} title={dep.status === 'APPROVED' ? 'Deposit approved' : dep.status === 'REJECTED' ? 'Deposit rejected' : 'Awaiting review'}>{dep.status}</span>
                            <span className="text-white font-mono text-xs">{parseFloat(dep.amount || 0).toFixed(4)} {dep.coin?.symbol}</span>
                            <span className="text-dark-500 text-xs truncate">{dep.user?.email}</span>
                          </div>
                          <span className="text-dark-500 text-xs shrink-0 ml-2">{(() => { const diff = Date.now() - new Date(dep.createdAt).getTime(); const m = Math.floor(diff / 60000); const h = Math.floor(m / 60); const d = Math.floor(h / 24); return d > 0 ? `${d}d ago` : h > 0 ? `${h}h ago` : `${m}m ago`; })()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-dark-400 text-sm">No deposits yet</p>
                  )}
                </div>

                {/* Recent Withdrawals Mini-list */}
                <div className="glass-card">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                    <span title="Latest withdrawal requests from users">Recent Withdrawals</span>
                    <button onClick={() => setTab('withdrawals')} className="text-xs text-primary-400 hover:text-primary-300" title="Open full withdrawals management tab">View All →</button>
                  </h3>
                  {withdrawals.items?.length > 0 ? (
                    <div className="space-y-2">
                      {withdrawals.items.slice(0, 5).map((w: any) => (
                        <div key={w.id} className="flex items-center justify-between py-2 border-b border-dark-800/30 last:border-0 text-sm hover:bg-dark-800/20 rounded px-1 transition-colors cursor-pointer" onClick={() => setTab('withdrawals')}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={w.status === 'APPROVED' || w.status === 'COMPLETED' ? 'badge-green' : w.status === 'REJECTED' ? 'badge-red' : 'badge-yellow'} title={w.status === 'APPROVED' || w.status === 'COMPLETED' ? 'Withdrawal processed' : w.status === 'REJECTED' ? 'Withdrawal rejected' : 'Awaiting review'}>{w.status}</span>
                            <span className="text-white font-mono text-xs">{parseFloat(w.amount || 0).toFixed(4)} {w.coin?.symbol}</span>
                            <span className="text-dark-500 text-xs truncate">{w.user?.email}</span>
                          </div>
                          <span className="text-dark-500 text-xs shrink-0 ml-2">{(() => { const diff = Date.now() - new Date(w.createdAt).getTime(); const m = Math.floor(diff / 60000); const h = Math.floor(m / 60); const d = Math.floor(h / 24); return d > 0 ? `${d}d ago` : h > 0 ? `${h}h ago` : `${m}m ago`; })()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-dark-400 text-sm">No withdrawals yet</p>
                  )}
                </div>

                {/* Coin Overview Mini-Grid */}
                {coins.length > 0 && (
                  <div className="glass-card">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center justify-between">
                      <span title="Quick overview of coin deposit/withdrawal status">Coin Status</span>
                      <button onClick={() => setTab('coins')} className="text-xs text-primary-400 hover:text-primary-300" title="Open full coins management tab">Manage →</button>
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {coins.slice(0, 10).map((c: any) => (
                        <div key={c.id} className="bg-dark-800/40 rounded-lg p-2 text-center" title={`${c.symbol} — ${c.name || c.symbol}`}>
                          <span className="text-white text-xs font-bold">{c.symbol}</span>
                          {c.network && <span className="text-dark-600 text-[8px] block">{c.network}</span>}
                          <div className="flex justify-center gap-1 mt-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${c.depositEnabled ? 'bg-green-400' : 'bg-red-400'}`} title={c.depositEnabled ? 'Deposit ON' : 'Deposit OFF'} />
                            <span className={`w-1.5 h-1.5 rounded-full ${c.withdrawEnabled ? 'bg-green-400' : 'bg-red-400'}`} title={c.withdrawEnabled ? 'Withdraw ON' : 'Withdraw OFF'} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Audit Logs Mini-list */}
                <div className="glass-card">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                    <span title="Latest admin actions from the audit trail">Recent Admin Activity</span>
                    <button onClick={() => setTab('logs')} className="text-xs text-primary-400 hover:text-primary-300" title="Open full audit logs tab">View All →</button>
                  </h3>
                  {stats?.recentLogs?.length > 0 ? (
                    <div className="space-y-2">
                      {stats.recentLogs.slice(0, 5).map((log: any) => (
                        <div key={log.id} className="flex items-center justify-between py-2 border-b border-dark-800/30 last:border-0 text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="badge-blue text-[10px]" title={`Admin action: ${log.action}`}>{log.action}</span>
                            <span className="text-dark-500 text-xs truncate">{log.targetType} {log.targetId?.slice(0, 6)}</span>
                          </div>
                          <span className="text-dark-600 text-xs shrink-0 ml-2">{(() => { const diff = Date.now() - new Date(log.createdAt).getTime(); const m = Math.floor(diff / 60000); const h = Math.floor(m / 60); const d = Math.floor(h / 24); return d > 0 ? `${d}d ago` : h > 0 ? `${h}h ago` : `${m}m ago`; })()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-dark-400 text-sm">No admin activity yet</p>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="glass-card">
                  <h3 className="text-lg font-semibold text-white mb-3" title="Shortcuts to common admin tasks">Quick Actions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: 'Manage Users', tab: 'users', icon: '👥', tip: 'View, freeze, and manage user accounts' },
                      { label: 'View Deposits', tab: 'deposits', icon: '📥', tip: 'Review and approve pending deposits' },
                      { label: 'View Withdrawals', tab: 'withdrawals', icon: '📤', tip: 'Review and process withdrawal requests' },
                      { label: 'Send Email', tab: 'email', icon: '📧', tip: 'Send custom emails to users' },
                      { label: 'Manage Coins', tab: 'coins', icon: '🪙', tip: 'Configure coins, addresses, and fees' },
                      { label: 'Settings', tab: 'settings', icon: '⚙️', tip: 'Platform settings and configuration' },
                      { label: 'Audit Logs', tab: 'logs', icon: '📋', tip: 'View all admin actions and system events' },
                      { label: 'Announcements', tab: 'settings', icon: '📢', tip: 'Create and manage user announcements' },
                    ].map((action) => (
                      <button key={action.label} onClick={() => setTab(action.tab as Tab)} className="bg-dark-800/40 hover:bg-dark-700/40 rounded-lg p-2.5 text-left transition-colors" title={action.tip}>
                        <span className="text-sm">{action.icon}</span>
                        <p className="text-dark-300 text-xs mt-1">{action.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white" title="View, search, freeze, and manage all registered users">User Management <span className="text-dark-400 text-sm font-normal">({users.total || 0} total)</span></h1>
                <div className="flex gap-3 mt-1 text-[10px]">
                  <span className="text-green-400">{users.items?.filter((u: any) => u.status === 'ACTIVE').length || 0} active</span>
                  <span className="text-red-400">{users.items?.filter((u: any) => u.status === 'FROZEN').length || 0} frozen</span>
                  <span className="text-cyan-400">{users.items?.filter((u: any) => u.kycStatus === 'APPROVED').length || 0} KYC verified</span>
                  <span className="text-dark-500">{users.items?.filter((u: any) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length || 0} admins</span>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => setCreateUserModal(true)} className="btn-primary text-xs !py-2 !px-3" title="Create a new user account with custom settings">+ Create User</button>
                <button onClick={() => {
                  const rows = [['Email','First Name','Last Name','Role','Status','KYC','2FA','Registered','Referral Code']];
                  users.items?.forEach((u: any) => rows.push([u.email, u.firstName, u.lastName, u.role, u.status, u.kycStatus, u.twoFactorEnabled ? 'ON' : 'OFF', new Date(u.createdAt).toLocaleDateString(), u.referralCode || '']));
                  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `users_${Date.now()}.csv`; a.click();
                }} className="btn-secondary text-xs !py-2 !px-3" title="Download user list as CSV file">📥 Export CSV</button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadTabData()}
                    className="input-field !pl-10 !py-2 w-60" placeholder="Search users..." title="Search by name, email, or referral code — press Enter to search" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field !py-2 w-32" title="Filter users by account status">
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="FROZEN">Frozen</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
                <select onChange={(e) => { if (e.target.value) setSearch(e.target.value === 'ALL' ? '' : `kyc:${e.target.value}`); }} className="input-field !py-2 w-32" title="Filter users by KYC verification status">
                  <option value="">KYC Filter</option>
                  <option value="APPROVED">KYC Approved</option>
                  <option value="PENDING">KYC Pending</option>
                  <option value="NONE">KYC None</option>
                  <option value="ALL">All KYC</option>
                </select>
                <select onChange={(e) => { if (e.target.value) setSearch(e.target.value === 'ALL' ? '' : `verified:${e.target.value}`); }} className="input-field !py-2 w-32" title="Filter users by email verification status">
                  <option value="">Email</option>
                  <option value="true">Verified</option>
                  <option value="false">Unverified</option>
                  <option value="ALL">All</option>
                </select>
                <select onChange={(e) => { if (e.target.value) setSearch(e.target.value === 'ALL' ? '' : `sort:${e.target.value}`); }} className="input-field !py-2 w-32" title="Sort user list by registration date">
                  <option value="">Sort By</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="ALL">Default</option>
                </select>
              </div>
            </div>

            {users.total > PAGE_SIZE && (
              <div className="flex items-center justify-between glass-card !py-3">
                <p className="text-dark-400 text-sm">{users.total} users · Page {page} of {Math.ceil(users.total / PAGE_SIZE)} · Showing {Math.min(PAGE_SIZE, users.items?.length || 0)} per page · <span title="Number of users on this page who have verified their email address">{users.items?.filter((u: any) => u.emailVerified).length || 0} verified</span></p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary !py-1.5 !px-3 text-sm disabled:opacity-40" title="Go to previous page">← Prev</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(users.total / PAGE_SIZE)} className="btn-secondary !py-1.5 !px-3 text-sm disabled:opacity-40" title="Go to next page">Next →</button>
                </div>
              </div>
            )}
            <div className="glass rounded-xl overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700/50">
                    <th className="text-left text-xs text-dark-400 font-medium px-4 py-3" title="User name, email, and referral code">User</th>
                    <th className="text-left text-xs text-dark-400 font-medium px-4 py-3" title="User permission level">Role</th>
                    <th className="text-left text-xs text-dark-400 font-medium px-4 py-3" title="Account status — Active, Frozen, or Suspended">Status</th>
                    <th className="text-left text-xs text-dark-400 font-medium px-4 py-3" title="Know Your Customer verification status">KYC</th>
                    <th className="text-left text-xs text-dark-400 font-medium px-4 py-3" title="Two-Factor Authentication and email verification">2FA</th>
                    <th className="text-left text-xs text-dark-400 font-medium px-4 py-3 cursor-help" title="Sorted by registration date">Joined ↕</th>
                    <th className="text-left text-xs text-dark-400 font-medium px-4 py-3" title="Available admin actions for each user">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.items?.map((u: any) => (
                    <tr key={u.id} className="border-b border-dark-800/30 hover:bg-dark-800/20 transition-colors cursor-pointer" onClick={async (e) => { if ((e.target as HTMLElement).closest('button, select, a')) return; try { const r = await api.get(`/admin/users/${u.id}`); setViewUser(r.data); } catch { setViewUser(u); } }}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white text-sm font-medium">{u.firstName} {u.lastName}</p>
                          <p className="text-dark-400 text-xs cursor-pointer hover:text-primary-400 transition-colors" onClick={(e) => { navigator.clipboard.writeText(u.email); const el = e.target as HTMLElement; const orig = el.textContent; el.textContent = '✅ Copied!'; setTimeout(() => { el.textContent = orig; }, 1000); }} title="Click to copy email">{u.email}</p>
                          {u.referralCode && <code className="text-dark-600 text-[10px] cursor-pointer hover:text-primary-400 transition-colors" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(u.referralCode); const el = e.target as HTMLElement; const orig = el.textContent; el.textContent = '✅ Copied!'; setTimeout(() => { el.textContent = orig; }, 1000); }} title="Click to copy referral code">REF: {u.referralCode}</code>}
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={u.role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-400 text-[10px] px-2 py-0.5 rounded-full font-medium' : u.role === 'ADMIN' ? 'badge-blue' : 'text-dark-500 text-xs'} title={u.role === 'SUPER_ADMIN' ? 'Full platform control including admin management' : u.role === 'ADMIN' ? 'Can manage users, deposits, and withdrawals' : 'Standard user with basic access'}>{u.role}</span></td>
                      <td className="px-4 py-3"><span className={u.status === 'ACTIVE' ? 'badge-green' : u.status === 'FROZEN' ? 'badge-red' : 'badge-yellow'} title={u.status === 'ACTIVE' ? 'Account is active and fully operational' : u.status === 'FROZEN' ? 'Account is frozen — user cannot trade or withdraw' : 'Account is suspended or pending review'}>{u.status}</span></td>
                      <td className="px-4 py-3"><span className={u.kycStatus === 'APPROVED' ? 'badge-green' : 'badge-yellow'} title={u.kycStatus === 'APPROVED' ? 'Identity verified — full platform access' : u.kycStatus === 'PENDING' ? 'KYC documents submitted, awaiting review' : 'KYC not started — limited functionality'}>{u.kycStatus}</span></td>
                      <td className="px-4 py-3">
                        <span className={u.twoFactorEnabled ? 'badge-green' : 'badge-red'} title={u.twoFactorEnabled ? 'Two-Factor Authentication is enabled for this account' : 'Two-Factor Authentication is disabled — account may be vulnerable'}>{u.twoFactorEnabled ? '🔐 ON' : '⚠ OFF'}</span>
                        <div className={`text-[10px] mt-0.5 ${u.emailVerified ? 'text-green-500' : 'text-red-400'}`} title={u.emailVerified ? 'User has confirmed their email address' : 'Email not yet verified — user may have limited access'}>{u.emailVerified ? '✓ Email verified' : '✗ Unverified'}</div>
                      </td>
                      <td className="px-4 py-3 text-dark-400 text-xs">
                        <div title={`Registered: ${new Date(u.createdAt).toLocaleString()}`}>{new Date(u.createdAt).toLocaleDateString()} <span className="text-dark-600">({(() => { const d = Math.floor((Date.now() - new Date(u.createdAt).getTime()) / 86400000); return d > 365 ? `${Math.floor(d/365)}y` : d > 30 ? `${Math.floor(d/30)}m` : `${d}d`; })()})</span></div>
                        <div className="text-dark-600 text-[10px]" title={`Wallets: ${u._count?.wallets || 0}, Deposits: ${u._count?.deposits || 0}, Withdrawals: ${u._count?.withdrawals || 0}, Transactions: ${u._count?.transactions || 0}`}>{u._count?.wallets || 0}w · {u._count?.deposits || 0}d · {u._count?.withdrawals || 0}wd · {u._count?.transactions || 0}tx</div>
                        {u.lastLoginAt && <div className="text-dark-600 text-[10px]" title={`Last login: ${new Date(u.lastLoginAt).toLocaleString()}`}>Last: {(() => {
                          const diff = Date.now() - new Date(u.lastLoginAt).getTime();
                          const m = Math.floor(diff / 60000); const h = Math.floor(m / 60); const d = Math.floor(h / 24);
                          return d > 0 ? `${d}d ago` : h > 0 ? `${h}h ago` : `${m}m ago`;
                        })()}</div>}
                        {u.lastLoginIp && <div className="text-dark-600 text-[10px] font-mono" title="Last known IP address of this user">{u.lastLoginIp}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          {u.status === 'ACTIVE' ? (
                            <button onClick={() => { if (confirm(`Freeze account for ${u.email}?`)) freezeUser(u.id); }} className="text-red-400 hover:text-red-300 text-xs font-medium" title="Freeze this account — blocks trading and withdrawals">Freeze</button>
                          ) : (
                            <button onClick={() => { if (confirm(`Unfreeze account for ${u.email}?`)) unfreezeUser(u.id); }} className="text-green-400 hover:text-green-300 text-xs font-medium" title="Restore full access for this account">Unfreeze</button>
                          )}
                          <button onClick={() => { if (confirm(`Reset 2FA for ${u.email}? They will need to re-enable it.`)) reset2FA(u.id); }} className="text-yellow-400 hover:text-yellow-300 text-xs font-medium" title="Remove 2FA — user must set it up again">Reset 2FA</button>
                          <button onClick={() => { navigator.clipboard.writeText(u.id); }} className="text-dark-600 hover:text-dark-300 text-xs font-medium" title="Copy User ID">ID</button>
                          <button onClick={async () => { try { const r = await api.get(`/admin/users/${u.id}`); setViewUser(r.data); } catch { setViewUser(u); } }} className="text-dark-300 hover:text-white text-xs font-medium" title="View full user details and activity">View</button>
                          <button onClick={async () => { try { const r = await api.get('/admin/coins'); setCoins(r.data || []); } catch { try { const r2 = await api.get('/coins'); setCoins(r2.data || []); } catch {} } setSelectedUser(u); }} className="text-primary-400 hover:text-primary-300 text-xs font-medium" title="Credit or debit this user's wallet">Balance</button>
                          <button onClick={() => { setTab('email'); setEmailForm(prev => ({ ...prev, toEmail: u.email })); }} className="text-dark-400 hover:text-white text-xs font-medium" title="Send a custom email to this user">✉ Email</button>
                          {u.kycStatus !== 'APPROVED' && <button onClick={() => api.patch(`/admin/users/${u.id}/kyc`, { kycStatus: 'APPROVED' }).then(() => loadTabData())} className="text-cyan-400 hover:text-cyan-300 text-xs font-medium" title="Approve KYC verification for this user">✓ KYC</button>}
                          {u.kycStatus === 'APPROVED' && <button onClick={() => api.patch(`/admin/users/${u.id}/kyc`, { kycStatus: 'NONE' }).then(() => loadTabData())} className="text-orange-400 hover:text-orange-300 text-xs font-medium" title="Remove KYC verification — limits user access">Revoke KYC</button>}
                          <button onClick={() => { setMagicLinkUser(u); setMagicLinkResult(null); }} className="text-green-400 hover:text-green-300 text-xs font-medium" title="Generate a one-time login link for this user">🔗 Magic Link</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Magic Link Modal */}
            {magicLinkUser && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setMagicLinkUser(null)}>
                <div className="glass-card max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-white mb-4" title="Create a one-time login URL that bypasses normal authentication">🔗 Generate Magic Login Link</h3>
                  <p className="text-dark-300 text-sm mb-4">Generate a one-time login URL for <strong className="text-white">{magicLinkUser.email}</strong></p>
                  
                  {magicLinkResult ? (
                    <div className="space-y-4">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <p className="text-green-400 text-sm font-medium mb-2">✅ Magic link generated!</p>
                        <p className="text-dark-400 text-xs mb-2">Expires: {new Date(magicLinkResult.expiresAt).toLocaleString()}</p>
                        <div className="bg-dark-900 rounded p-3 break-all">
                          <code className="text-primary-400 text-xs">{magicLinkResult.url}</code>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => { navigator.clipboard.writeText(magicLinkResult.url); alert('Copied!'); }} className="btn-primary flex-1" title="Copy the magic link URL to clipboard">📋 Copy URL</button>
                        <button onClick={() => setMagicLinkUser(null)} className="btn-secondary flex-1" title="Close this dialog">Close</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-dark-400 text-sm">This will generate a single-use link that logs this user in automatically. The link expires in 24 hours.</p>
                      <div className="flex gap-3">
                        <button onClick={() => setMagicLinkUser(null)} className="btn-secondary flex-1" title="Cancel and close">Cancel</button>
                        <button onClick={() => generateMagicLink(magicLinkUser.id)} disabled={magicLinkLoading} className="btn-primary flex-1 disabled:opacity-50" title="Create a single-use login link valid for 24 hours">
                          {magicLinkLoading ? 'Generating...' : 'Generate Link'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Create User Modal */}
            {createUserModal && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setCreateUserModal(false)}>
                <div className="glass-card max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-white mb-4">Create New User</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-dark-400 mb-1 font-medium">Email *</label>
                        <input type="email" value={createUserForm.email} onChange={(e) => setCreateUserForm({...createUserForm, email: e.target.value})} className="input-field text-sm" placeholder="user@email.com" />
                      </div>
                      <div>
                        <label className="block text-xs text-dark-400 mb-1 font-medium">Password *</label>
                        <input type="text" value={createUserForm.password} onChange={(e) => setCreateUserForm({...createUserForm, password: e.target.value})} className="input-field text-sm" placeholder="min 8 chars" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-dark-400 mb-1 font-medium">First Name</label>
                        <input type="text" value={createUserForm.firstName} onChange={(e) => setCreateUserForm({...createUserForm, firstName: e.target.value})} className="input-field text-sm" placeholder="John" />
                      </div>
                      <div>
                        <label className="block text-xs text-dark-400 mb-1 font-medium">Last Name</label>
                        <input type="text" value={createUserForm.lastName} onChange={(e) => setCreateUserForm({...createUserForm, lastName: e.target.value})} className="input-field text-sm" placeholder="Doe" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-dark-400 mb-1 font-medium">Role</label>
                        <select value={createUserForm.role} onChange={(e) => setCreateUserForm({...createUserForm, role: e.target.value})} className="input-field text-sm">
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-dark-400 mb-1 font-medium">KYC Status</label>
                        <select value={createUserForm.kycStatus} onChange={(e) => setCreateUserForm({...createUserForm, kycStatus: e.target.value})} className="input-field text-sm">
                          <option value="APPROVED">APPROVED</option>
                          <option value="PENDING">PENDING</option>
                          <option value="NONE">NONE</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-dark-400 mb-1 font-medium">Withdrawal Stage</label>
                        <select value={createUserForm.withdrawStage} onChange={(e) => setCreateUserForm({...createUserForm, withdrawStage: e.target.value})} className="input-field text-sm">
                          <option value="BLOCKED">BLOCKED — 8% Fee Required</option>
                          <option value="FEE1_REQUIRED">FEE1_REQUIRED</option>
                          <option value="FEE1_PAID">FEE1_PAID — 5% Fee Required</option>
                          <option value="FEE2_REQUIRED">FEE2_REQUIRED</option>
                          <option value="FEE2_PAID">FEE2_PAID — Processing</option>
                          <option value="UNLOCKED">UNLOCKED — Full Access</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-dark-400 mb-1 font-medium">Email Verified</label>
                        <select value={createUserForm.emailVerified ? 'true' : 'false'} onChange={(e) => setCreateUserForm({...createUserForm, emailVerified: e.target.value === 'true'})} className="input-field text-sm">
                          <option value="true">Yes — Verified</option>
                          <option value="false">No — Unverified</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setCreateUserModal(false)} className="btn-secondary flex-1">Cancel</button>
                      <button onClick={async () => {
                        if (!createUserForm.email || !createUserForm.password) { alert('Email and password required'); return; }
                        if (createUserForm.password.length < 8) { alert('Password must be at least 8 characters'); return; }
                        setCreateUserLoading(true);
                        try {
                          const res = await api.post('/admin/users', createUserForm);
                          alert(`User created: ${res.data.email} (ID: ${res.data.id})`);
                          setCreateUserModal(false);
                          setCreateUserForm({ email: '', password: '', firstName: '', lastName: '', role: 'USER', kycStatus: 'APPROVED', withdrawStage: 'BLOCKED', emailVerified: true });
                          loadTabData();
                        } catch (err: any) { alert(err.response?.data?.message || 'Failed to create user'); }
                        setCreateUserLoading(false);
                      }} disabled={createUserLoading} className="btn-primary flex-1 disabled:opacity-50">
                        {createUserLoading ? 'Creating...' : 'Create User'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Balance Modification Modal */}
            {selectedUser && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
                <div className="glass-card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-white mb-1" title="Credit or debit a user's cryptocurrency wallet balance">Modify Balance</h3>
                  <p className="text-dark-400 text-sm mb-1">{selectedUser.firstName} {selectedUser.lastName}</p>
                  <p className="text-primary-400 text-xs mb-4 font-mono">{selectedUser.email}</p>
                  <p className="text-dark-500 text-xs mb-3">{selectedUser._count?.wallets || 0} wallet(s) · {selectedUser._count?.deposits || 0} deposit(s) · {selectedUser._count?.withdrawals || 0} withdrawal(s)</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-dark-400 mb-1.5 font-medium">Select Cryptocurrency</label>
                      <select value={balanceForm.coinId} onChange={(e) => setBalanceForm({...balanceForm, coinId: e.target.value})} className="input-field" title="Choose which cryptocurrency wallet to modify">
                        <option value="">Select a coin...</option>
                        {coins.map((c: any) => <option key={c.id} value={c.id}>{c.symbol} — {c.name}</option>)}
                      </select>
                    </div>
                    <input type="number" value={balanceForm.amount} onChange={(e) => setBalanceForm({...balanceForm, amount: e.target.value})}
                      className="input-field" placeholder="Amount" step="any" title="Amount to add or remove from the wallet" />
                    <select value={balanceForm.type} onChange={(e) => setBalanceForm({...balanceForm, type: e.target.value as 'credit' | 'debit'})} className="input-field" title="Credit adds funds, Debit removes funds">
                      <option value="credit">Credit (Add)</option>
                      <option value="debit">Debit (Remove)</option>
                    </select>
                    <input type="text" value={balanceForm.reason} onChange={(e) => setBalanceForm({...balanceForm, reason: e.target.value})}
                      className="input-field" placeholder="Reason (required)" title="Required justification for this balance change — logged for audit" />
                    <div className="flex gap-3">
                      <button onClick={() => setSelectedUser(null)} className="btn-secondary flex-1" title="Cancel and close this dialog">Cancel</button>
                      <button onClick={() => modifyBalance(selectedUser.id)} className="btn-primary flex-1" title="Apply the balance modification to this user's wallet">Apply</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Detail Modal */}
            {viewUser && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setViewUser(null)}>
                <div className="glass-card max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white" title="Detailed view of this user's account information and activity">User Details</h3>
                      <button onClick={() => navigator.clipboard.writeText(viewUser.id)} className="text-dark-600 hover:text-primary-400 text-[10px] font-mono transition-colors" title="Copy User ID">ID 📋</button>
                    </div>
                    <button onClick={() => setViewUser(null)} className="text-dark-400 hover:text-white text-xl" title="Close user details">✕</button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary-600/20 flex items-center justify-center text-lg font-bold text-primary-400">
                        {viewUser.firstName?.[0]}{viewUser.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">{viewUser.firstName} {viewUser.lastName} {viewUser._count?.notifications > 0 && <span className="bg-primary-500/20 text-primary-400 text-[10px] px-1.5 py-0.5 rounded-full font-medium">{viewUser._count.notifications} notifs</span>}</p>
                        <p className="text-primary-400 text-sm font-mono flex items-center gap-1">{viewUser.email} <button onClick={() => navigator.clipboard.writeText(viewUser.email)} className="text-dark-500 hover:text-white transition-colors" title="Copy email"><Copy className="w-3 h-3" /></button></p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'User ID', value: viewUser.id?.slice(0, 12) + '...', copyable: viewUser.id },
                        { label: 'Role', value: viewUser.role, editable: true },
                        { label: 'Status', value: viewUser.status },
                        { label: 'KYC Status', value: viewUser.kycStatus },
                        { label: '2FA', value: viewUser.twoFactorEnabled ? 'Enabled' : 'Disabled' },
                        { label: 'Email Verified', value: viewUser.emailVerified ? 'Yes' : 'No' },
                        { label: 'Registered', value: `${new Date(viewUser.createdAt).toLocaleDateString()} (${(() => { const d = Math.floor((Date.now() - new Date(viewUser.createdAt).getTime()) / 86400000); return d > 365 ? `${Math.floor(d/365)}y ${Math.floor((d%365)/30)}m` : d > 30 ? `${Math.floor(d/30)}m ${d%30}d` : `${d}d`; })()})` },
                        { label: 'Wallets', value: `${viewUser._count?.wallets || 0}` },
                        { label: 'Deposits', value: `${viewUser._count?.deposits || 0}` },
                        { label: 'Withdrawals', value: `${viewUser._count?.withdrawals || 0}` },
                        { label: 'Transactions', value: `${viewUser._count?.transactions || 0}` },
                        { label: 'Notifications', value: `${viewUser._count?.notifications || 0}` },
                        { label: 'Last Login', value: viewUser.lastLoginAt ? `${new Date(viewUser.lastLoginAt).toLocaleString()} (${(() => { const diff = Date.now() - new Date(viewUser.lastLoginAt).getTime(); const m = Math.floor(diff / 60000); const h = Math.floor(m / 60); const d = Math.floor(h / 24); return d > 0 ? `${d}d ago` : h > 0 ? `${h}h ago` : `${m}m ago`; })()})` : 'Never' },
                        { label: 'Last Login IP', value: viewUser.lastLoginIp || '—' },
                        { label: 'Referral Code', value: viewUser.referralCode || '—', tip: 'Unique code for user referrals' },
                      ].map((item: any) => (
                        <div key={item.label} className="bg-dark-800/40 rounded-lg p-2.5" title={item.tip || item.label}>
                          <p className="text-dark-400 text-xs">{item.label}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {item.editable ? (
                              <select defaultValue={item.value} onChange={async (e) => {
                                try { await api.put(`/admin/users/${viewUser.id}`, { role: e.target.value }); alert('Role updated!'); loadTabData(); } catch { alert('Failed'); }
                              }} className="bg-dark-900 text-white text-sm border border-dark-700 rounded px-1.5 py-0.5">
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                              </select>
                            ) : (
                              <p className="text-white text-sm font-medium">{item.value}</p>
                            )}
                            {item.copyable && <button onClick={() => navigator.clipboard.writeText(item.copyable)} className="text-dark-500 hover:text-primary-400 transition-colors" title="Copy"><Copy className="w-3 h-3" /></button>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {viewUser.lastLoginAt && (
                      <div className="bg-dark-800/40 rounded-lg p-2.5" title="Most recent login session details">
                        <p className="text-dark-400 text-xs">Last Login</p>
                        <p className="text-white text-sm font-medium mt-0.5">{new Date(viewUser.lastLoginAt).toLocaleString()}</p>
                        {viewUser.lastLoginIp && <p className="text-dark-500 text-xs font-mono mt-0.5">{viewUser.lastLoginIp}</p>}
                      </div>
                    )}
                    {/* Login History */}
                    {viewUser.loginHistory?.length > 0 && (
                      <div className="bg-dark-800/40 rounded-lg p-2.5">
                        <p className="text-dark-400 text-xs mb-2" title="Recent login attempts with IP addresses and success/failure status">Login History (last {viewUser.loginHistory.length})</p>
                        <div className="space-y-1 max-h-28 overflow-y-auto">
                          {viewUser.loginHistory.map((lh: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-dark-800/30 last:border-0" title={lh.success ? `Successful login from ${lh.ipAddress || 'unknown IP'}` : `Failed login attempt from ${lh.ipAddress || 'unknown IP'}`}>
                              <div className="flex items-center gap-2">
                                <span className={lh.success ? 'text-green-400' : 'text-red-400'}>{lh.success ? '✓' : '✗'}</span>
                                <span className="text-dark-400 font-mono">{lh.ipAddress || 'unknown'}</span>
                              </div>
                              <span className="text-dark-500">{new Date(lh.createdAt).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Wallet Balances */}
                    {viewUser.wallets?.length > 0 && (
                      <div className="bg-dark-800/40 rounded-lg p-2.5">
                        <p className="text-dark-400 text-xs mb-2" title="Current cryptocurrency balances held by this user">Wallet Balances</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {viewUser.wallets.filter((w: any) => parseFloat(w.balance) > 0 || parseFloat(w.frozenBalance) > 0).map((w: any) => (
                            <div key={w.id} className="flex items-center justify-between bg-dark-900/50 rounded px-2 py-1.5" title={`${w.coin?.symbol}: Available ${parseFloat(w.balance).toFixed(6)}${parseFloat(w.frozenBalance) > 0 ? `, Frozen ${parseFloat(w.frozenBalance).toFixed(6)}` : ''}`}>
                              <span className="text-white text-xs font-semibold">{w.coin?.symbol}</span>
                              <div className="text-right">
                                <span className="text-green-400 text-xs font-mono">{parseFloat(w.balance).toFixed(6)}</span>
                                {parseFloat(w.frozenBalance) > 0 && <span className="text-yellow-400 text-[10px] font-mono ml-1" title="Frozen balance — cannot be withdrawn by user">🔒{parseFloat(w.frozenBalance).toFixed(4)}</span>}
                              </div>
                            </div>
                          ))}
                          {viewUser.wallets.filter((w: any) => parseFloat(w.balance) > 0 || parseFloat(w.frozenBalance) > 0).length === 0 && (
                            <p className="text-dark-500 text-xs col-span-2">No balances</p>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Recent Deposits/Withdrawals */}
                    {(viewUser.deposits?.length > 0 || viewUser.withdrawals?.length > 0) && (
                      <div className="bg-dark-800/40 rounded-lg p-2.5">
                        <p className="text-dark-400 text-xs mb-2" title="Most recent deposits and withdrawals for this user">Recent Activity</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {viewUser.deposits?.slice(0, 3).map((d: any) => (
                            <div key={d.id} className="flex items-center justify-between text-xs py-1" title={`Deposit: ${parseFloat(d.amount || 0).toFixed(6)} ${d.coin?.symbol} — ${d.status}`}>
                              <div className="flex items-center gap-1.5">
                                <span className="text-green-400">↓</span>
                                <span className="text-white font-mono">{parseFloat(d.amount || 0).toFixed(4)} {d.coin?.symbol}</span>
                              </div>
                              <span className={d.status === 'APPROVED' ? 'text-green-400' : d.status === 'REJECTED' ? 'text-red-400' : 'text-yellow-400'}>{d.status}</span>
                            </div>
                          ))}
                          {viewUser.withdrawals?.slice(0, 3).map((w: any) => (
                            <div key={w.id} className="flex items-center justify-between text-xs py-1" title={`Withdrawal: ${parseFloat(w.amount || 0).toFixed(6)} ${w.coin?.symbol} — ${w.status}`}>
                              <div className="flex items-center gap-1.5">
                                <span className="text-red-400">↑</span>
                                <span className="text-white font-mono">{parseFloat(w.amount || 0).toFixed(4)} {w.coin?.symbol}</span>
                              </div>
                              <span className={w.status === 'APPROVED' || w.status === 'COMPLETED' ? 'text-green-400' : w.status === 'REJECTED' ? 'text-red-400' : 'text-yellow-400'}>{w.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Admin Notes */}
                    <div className="bg-dark-800/40 rounded-lg p-2.5">
                      <p className="text-dark-400 text-xs mb-1" title="Private admin-only notes about this user">Admin Notes</p>
                      <div className="flex gap-2">
                        <textarea id="admin-note-input" defaultValue={viewUser.adminNotes || ''} className="input-field text-xs resize-none flex-1" rows={2} placeholder="Internal admin notes..." title="Private notes about this user — only visible to admins" />
                        <button onClick={async () => {
                          const note = (document.getElementById('admin-note-input') as HTMLTextAreaElement)?.value || '';
                          try { await api.patch(`/admin/users/${viewUser.id}/notes`, { note }); alert('Note saved!'); } catch { alert('Failed'); }
                        }} className="btn-primary text-xs !py-1 !px-2 self-end shrink-0">Save</button>
                      </div>
                    </div>
                    {/* Send Notification Inline */}
                    <div className="bg-dark-800/40 rounded-lg p-2.5">
                      <p className="text-dark-400 text-xs mb-1" title="Send an in-app notification directly to this user">Send Notification</p>
                      <div className="space-y-1.5">
                        <input id="notif-title" type="text" className="input-field text-xs" placeholder="Notification title" title="Title of the in-app notification" />
                        <textarea id="notif-msg" className="input-field text-xs resize-none" rows={2} placeholder="Message..." title="Notification message content shown to the user" />
                        <button onClick={async () => {
                          const title = (document.getElementById('notif-title') as HTMLInputElement)?.value;
                          const msg = (document.getElementById('notif-msg') as HTMLTextAreaElement)?.value;
                          if (!title || !msg) { alert('Title and message required'); return; }
                          try { await api.post(`/admin/users/${viewUser.id}/notify`, { title, message: msg }); alert('Notification sent!'); (document.getElementById('notif-title') as HTMLInputElement).value = ''; (document.getElementById('notif-msg') as HTMLTextAreaElement).value = ''; } catch { alert('Failed'); }
                        }} className="btn-primary text-xs !py-1.5 w-full" title="Send an in-app notification to this user">Send Notification</button>
                      </div>
                    </div>
                    {/* Withdrawal Stage Control */}
                    <div className="bg-dark-800/40 rounded-lg p-2.5">
                      <p className="text-dark-400 text-xs mb-1" title="Control which withdrawal fee stage this user sees">Withdrawal Stage</p>
                      <div className="flex gap-2 items-center">
                        <select defaultValue={viewUser.withdrawStage || 'BLOCKED'} onChange={async (e) => {
                          try {
                            await api.patch(`/admin/users/${viewUser.id}/withdraw-stage`, { stage: e.target.value });
                            setViewUser({ ...viewUser, withdrawStage: e.target.value });
                            alert(`Withdraw stage updated to ${e.target.value}`);
                          } catch { alert('Failed to update'); }
                        }} className="input-field text-xs flex-1" title="BLOCKED=8% fee required, FEE1_PAID=5% fee required, FEE2_PAID=Processing, UNLOCKED=Can withdraw">
                          <option value="BLOCKED">BLOCKED — 8% Recovery Fee Required</option>
                          <option value="FEE1_REQUIRED">FEE1_REQUIRED — 8% Fee Shown</option>
                          <option value="FEE1_PAID">FEE1_PAID — 5% Admin Fee Required</option>
                          <option value="FEE2_REQUIRED">FEE2_REQUIRED — 5% Fee Shown</option>
                          <option value="FEE2_PAID">FEE2_PAID — Processing Withdrawal</option>
                          <option value="UNLOCKED">UNLOCKED — Full Withdrawal Access</option>
                        </select>
                      </div>
                      <p className="text-dark-600 text-[10px] mt-1">Current: <span className="text-primary-400 font-medium">{viewUser.withdrawStage || 'BLOCKED'}</span></p>
                    </div>
                    <div className="flex gap-2 pt-2 flex-wrap">
                      <button onClick={() => { setViewUser(null); setTab('email'); setEmailForm(prev => ({ ...prev, toEmail: viewUser.email })); }} className="btn-secondary flex-1 text-sm" title="Send a custom email to this user">✉ Email</button>
                      {viewUser.status === 'ACTIVE' ? (
                        <button onClick={async () => { if (!confirm(`Freeze account for ${viewUser.email}?`)) return; try { await api.patch(`/admin/users/${viewUser.id}/freeze`); setViewUser({...viewUser, status: 'FROZEN'}); loadTabData(); } catch { alert('Failed'); } }} className="bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium py-2 px-3 rounded-xl flex-1 transition-colors" title="Freeze account — prevents trading and withdrawals">❄ Freeze</button>
                      ) : (
                        <button onClick={async () => { if (!confirm(`Unfreeze account for ${viewUser.email}?`)) return; try { await api.patch(`/admin/users/${viewUser.id}/unfreeze`); setViewUser({...viewUser, status: 'ACTIVE'}); loadTabData(); } catch { alert('Failed'); } }} className="bg-green-600/20 hover:bg-green-600/30 text-green-400 text-sm font-medium py-2 px-3 rounded-xl flex-1 transition-colors" title="Restore full account access for this user">🔓 Unfreeze</button>
                      )}
                      <button onClick={async () => { setViewUser(null); setSelectedUser(viewUser); if (coins.length === 0) { try { const r = await api.get('/coins'); setCoins(r.data || []); } catch {} } }} className="btn-primary flex-1 text-sm" title="Credit or debit this user's wallet balance">Modify Balance</button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {viewUser.kycStatus !== 'APPROVED' ? (
                        <button onClick={async () => { if (!confirm(`Approve KYC for ${viewUser.email}?`)) return; try { await api.patch(`/admin/users/${viewUser.id}/kyc`, { kycStatus: 'APPROVED' }); setViewUser({...viewUser, kycStatus: 'APPROVED'}); loadTabData(); } catch { alert('Failed'); } }} className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 text-xs font-medium py-1.5 px-3 rounded-lg flex-1 transition-colors" title="Verify this user's identity and grant full access">✓ Approve KYC</button>
                      ) : (
                        <button onClick={async () => { if (!confirm(`Revoke KYC for ${viewUser.email}?`)) return; try { await api.patch(`/admin/users/${viewUser.id}/kyc`, { kycStatus: 'NONE' }); setViewUser({...viewUser, kycStatus: 'NONE'}); loadTabData(); } catch { alert('Failed'); } }} className="bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-xs font-medium py-1.5 px-3 rounded-lg flex-1 transition-colors" title="Remove KYC verification — user will have limited access">✗ Revoke KYC</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DEPOSITS TAB */}
        {tab === 'deposits' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white" title="Review, approve, or reject user deposit requests">Deposit Management <span className="text-dark-400 text-sm font-normal">({deposits.total || 0} total)</span> <span className={`text-[10px] px-2 py-0.5 rounded-full ${deposits.items?.some((d: any) => d.status === 'PENDING') ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{deposits.items?.some((d: any) => d.status === 'PENDING') ? '⚠ Needs review' : '✓ All reviewed'}</span></h1>
                <div className="flex gap-3 mt-1 text-[10px]">
                  <span className="text-yellow-400">{deposits.items?.filter((d: any) => d.status === 'PENDING').length || 0} pending</span>
                  <span className="text-green-400">{deposits.items?.filter((d: any) => d.status === 'APPROVED').length || 0} approved</span>
                  <span className="text-red-400">{deposits.items?.filter((d: any) => d.status === 'REJECTED').length || 0} rejected</span>
                  <span className="text-dark-500">Total on page: {deposits.items?.reduce((sum: number, d: any) => sum + parseFloat(d.amount || 0), 0).toFixed(4) || '0'}</span>
                  {search && <span className="text-primary-400">· Filtered by: &quot;{search}&quot;</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field !py-2 w-40 text-xs" placeholder="Search by email..." title="Search deposits by user email address" />
                <button onClick={() => {
                  const rows = [['Date','User','Email','Coin','Amount','Status','TX Hash','Comment']];
                  deposits.items?.forEach((d: any) => rows.push([new Date(d.createdAt).toLocaleDateString(), `${d.user?.firstName} ${d.user?.lastName}`, d.user?.email, d.coin?.symbol, d.amount, d.status, d.txHash || '', d.adminComment || '']));
                  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `deposits_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
                }} className="btn-secondary text-xs !py-2 !px-3" title="Download deposits as CSV file">📥 Export CSV</button>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field !py-2 w-40" title="Filter deposits by approval status">
                  <option value="">All</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {deposits.total > PAGE_SIZE && (
              <div className="flex items-center justify-between glass-card !py-3">
                <p className="text-dark-400 text-sm">{deposits.total} total · Page {page} of {Math.ceil(deposits.total / PAGE_SIZE)} · Showing {Math.min(PAGE_SIZE, deposits.items?.length || 0)}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary !py-1.5 !px-3 text-sm disabled:opacity-40" title="Go to previous page of deposits">← Prev</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(deposits.total / PAGE_SIZE)} className="btn-secondary !py-1.5 !px-3 text-sm disabled:opacity-40" title="Go to next page of deposits">Next →</button>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {deposits.items?.length === 0 && <div className="glass-card text-center py-12"><p className="text-dark-400">No deposits found</p></div>}
              {deposits.items?.map((dep: any) => (
                <div key={dep.id} className={`glass-card border-l-4 ${dep.status === 'PENDING' ? 'border-yellow-500 animate-pulse' : dep.status === 'APPROVED' ? 'border-green-500' : 'border-red-500'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center text-xs font-bold text-primary-400 overflow-hidden">{dep.coin?.icon ? <img src={dep.coin.icon} alt={dep.coin.symbol} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).parentElement!.textContent = dep.coin?.symbol?.slice(0, 2) || '??'; }} /> : dep.coin?.symbol?.slice(0, 2)}</div>
                      <div>
                        <p className="text-white font-bold">{dep.coin?.symbol} — {dep.coin?.name}</p>
                        <p className="text-dark-400 text-xs mt-0.5">
                          <span className="text-dark-300">{dep.user?.firstName} {dep.user?.lastName}</span> ({dep.user?.email})
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-dark-500 text-xs">{new Date(dep.createdAt).toLocaleString()} <span className="text-dark-600">({(() => { const diff = Date.now() - new Date(dep.createdAt).getTime(); const m = Math.floor(diff / 60000); const h = Math.floor(m / 60); const d = Math.floor(h / 24); return d > 0 ? `${d}d ago` : h > 0 ? `${h}h ago` : `${m}m ago`; })()})</span></p>
                          {dep.user?.kycStatus && <span className={`text-[10px] px-1.5 py-0.5 rounded ${dep.user.kycStatus === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>KYC: {dep.user.kycStatus}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={dep.status === 'APPROVED' ? 'badge-green' : dep.status === 'REJECTED' ? 'badge-red' : 'badge-yellow'} title={dep.status === 'APPROVED' ? 'Deposit approved and credited' : dep.status === 'REJECTED' ? 'Deposit was rejected by admin' : 'Awaiting admin review'}>{dep.status}</span>
                      {dep.amount && <p className={`text-sm font-mono mt-1 font-bold ${parseFloat(dep.amount) >= 10 ? 'text-green-300' : parseFloat(dep.amount) >= 1 ? 'text-green-400' : parseFloat(dep.amount) >= 0.1 ? 'text-white' : 'text-dark-300'}`}>{parseFloat(dep.amount).toFixed(8)} {dep.coin?.symbol}</p>}
                    </div>
                  </div>
                  {dep.txHash && (
                    <div className="bg-dark-800/50 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                      <p className="text-dark-400 text-xs font-mono break-all flex-1" title={`Full TX Hash: ${dep.txHash}`}>TX Hash: <span className="text-primary-400">{dep.txHash}</span></p>
                      <button onClick={(e) => { navigator.clipboard.writeText(dep.txHash); const el = e.currentTarget; el.textContent = '✅'; setTimeout(() => { el.textContent = ''; const icon = document.createElement('span'); el.innerHTML = ''; }, 1000); }} className="text-dark-500 hover:text-white transition-colors shrink-0" title="Copy TX Hash"><Copy className="w-3 h-3" /></button>
                    </div>
                  )}
                  {dep.coin?.network && (
                    <div className="mb-2"><span className="bg-dark-700/50 text-dark-300 px-1.5 py-0.5 rounded text-[10px] font-mono">Network: {dep.coin.network}</span></div>
                  )}
                  {dep.userNote && <p className="text-dark-300 text-xs mb-2 italic bg-dark-800/30 rounded px-2 py-1">📝 User: "{dep.userNote}"</p>}
                  {dep.adminComment && <p className={`text-xs mb-2 rounded px-2 py-1 ${dep.status === 'REJECTED' ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-dark-400 bg-dark-800/30'}`} title={dep.status === 'REJECTED' ? 'Rejection reason visible to the user' : 'Internal admin note attached to this deposit'}>{dep.status === 'REJECTED' ? '⚠ Rejection' : '💬 Admin'}: <span className={dep.status === 'REJECTED' ? 'text-red-300' : 'text-dark-300'}>{dep.adminComment}</span></p>}
                  {dep.coinDepositAddress && (
                    <div className="bg-dark-800/50 rounded-lg px-3 py-2 mb-2 flex items-center gap-2">
                      <span className="text-dark-400 text-xs shrink-0">Deposit addr:</span>
                      <code className="text-xs text-primary-400 font-mono flex-1 truncate" title={`Full address: ${dep.coinDepositAddress}`}>{dep.coinDepositAddress}</code>
                      <button onClick={(e) => { navigator.clipboard.writeText(dep.coinDepositAddress); const el = e.currentTarget; el.textContent = '✅'; setTimeout(() => { el.textContent = ''; }, 1000); }} className="text-dark-400 hover:text-white transition-colors shrink-0" title="Copy address">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {dep.status === 'PENDING' && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-dark-800">
                      <input type="number" value={depositApproveForm.amount} onChange={(e) => setDepositApproveForm({...depositApproveForm, amount: e.target.value})}
                        className="input-field !py-2 w-32" placeholder="Amount" step="any" title="Amount to credit to the user's wallet"
                        onFocus={() => { if (!depositApproveForm.amount && dep.amount) setDepositApproveForm(prev => ({ ...prev, amount: String(parseFloat(dep.amount)) })); }} />
                      <input type="text" value={depositApproveForm.comment} onChange={(e) => setDepositApproveForm({...depositApproveForm, comment: e.target.value})}
                        className="input-field !py-2 flex-1 min-w-[150px]" placeholder="Admin comment (optional)" title="Internal note attached to this deposit approval" />
                      <button onClick={() => approveDeposit(dep.id)} className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium !py-2 !px-4 rounded-xl transition-colors" title="Approve deposit and credit the user's wallet">✓ Approve</button>
                      <button onClick={() => {
                        const reason = window.prompt('Rejection reason (optional):', 'Unable to verify this deposit.');
                        if (reason !== null) rejectDeposit(dep.id, reason);
                      }} className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium !py-2 !px-4 rounded-xl transition-colors" title="Reject this deposit — a reason prompt will appear">✗ Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WITHDRAWALS TAB */}
        {tab === 'withdrawals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white" title="Review, approve, or reject user withdrawal requests">Withdrawal Management <span className="text-dark-400 text-sm font-normal">({withdrawals.total || 0} total)</span> <span className={`text-[10px] px-2 py-0.5 rounded-full ${withdrawals.items?.some((w: any) => w.status === 'PENDING') ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>{withdrawals.items?.some((w: any) => w.status === 'PENDING') ? '⚠ Needs review' : '✓ All reviewed'}</span></h1>
                <div className="flex gap-3 mt-1 text-[10px]">
                  <span className="text-yellow-400">{withdrawals.items?.filter((w: any) => w.status === 'PENDING').length || 0} pending</span>
                  <span className="text-green-400">{withdrawals.items?.filter((w: any) => w.status === 'APPROVED' || w.status === 'COMPLETED').length || 0} approved</span>
                  <span className="text-red-400">{withdrawals.items?.filter((w: any) => w.status === 'REJECTED').length || 0} rejected</span>
                  <span className="text-dark-500">Total on page: {withdrawals.items?.reduce((sum: number, w: any) => sum + parseFloat(w.amount || 0), 0).toFixed(4) || '0'}</span>
                  {search && <span className="text-primary-400">· Filtered by: &quot;{search}&quot;</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field !py-2 w-40 text-xs" placeholder="Search by email..." title="Search withdrawals by user email address" />
                <button onClick={() => {
                  const rows = [['Date','User','Email','Coin','Amount','Fee','Address','Network','Status','Rejection']];
                  withdrawals.items?.forEach((w: any) => rows.push([new Date(w.createdAt).toLocaleDateString(), `${w.user?.firstName} ${w.user?.lastName}`, w.user?.email, w.coin?.symbol, w.amount, w.fee || '0', w.address, w.network || '', w.status, w.rejectionReason || '']));
                  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `withdrawals_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
                }} className="btn-secondary text-xs !py-2 !px-3" title="Download withdrawals as CSV file">📥 Export CSV</button>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field !py-2 w-40" title="Filter withdrawals by approval status">
                  <option value="">All</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {withdrawals.total > PAGE_SIZE && (
              <div className="flex items-center justify-between glass-card !py-3">
                <p className="text-dark-400 text-sm">{withdrawals.total} total · Page {page} of {Math.ceil(withdrawals.total / PAGE_SIZE)} · Showing {Math.min(PAGE_SIZE, withdrawals.items?.length || 0)}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary !py-1.5 !px-3 text-sm disabled:opacity-40" title="Go to previous page of withdrawals">← Prev</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(withdrawals.total / PAGE_SIZE)} className="btn-secondary !py-1.5 !px-3 text-sm disabled:opacity-40" title="Go to next page of withdrawals">Next →</button>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {withdrawals.items?.length === 0 && <div className="glass-card text-center py-12"><p className="text-dark-400">No withdrawals found</p></div>}
              {withdrawals.items?.map((w: any) => (
                <div key={w.id} className={`glass-card border-l-4 ${w.status === 'PENDING' ? 'border-orange-500 animate-pulse' : w.status === 'APPROVED' || w.status === 'COMPLETED' ? 'border-green-500' : 'border-red-500'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center text-xs font-bold text-red-400 overflow-hidden">{w.coin?.icon ? <img src={w.coin.icon} alt={w.coin.symbol} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).parentElement!.textContent = w.coin?.symbol?.slice(0, 2) || '??'; }} /> : w.coin?.symbol?.slice(0, 2)}</div>
                      <div>
                        <p className={`font-bold text-lg ${parseFloat(w.amount) >= 10 ? 'text-red-300' : parseFloat(w.amount) >= 1 ? 'text-red-400' : parseFloat(w.amount) >= 0.1 ? 'text-white' : 'text-dark-300'}`}>{parseFloat(w.amount).toFixed(8)} <span className="text-dark-300">{w.coin?.symbol}</span></p>
                        <p className="text-dark-400 text-xs mt-0.5">
                          <span className="text-dark-300">{w.user?.firstName} {w.user?.lastName}</span> ({w.user?.email})
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-dark-500 text-xs">{new Date(w.createdAt).toLocaleString()} <span className="text-dark-600">({(() => { const diff = Date.now() - new Date(w.createdAt).getTime(); const m = Math.floor(diff / 60000); const h = Math.floor(m / 60); const d = Math.floor(h / 24); return d > 0 ? `${d}d ago` : h > 0 ? `${h}h ago` : `${m}m ago`; })()})</span></p>
                          {w.user?.kycStatus && <span className={`text-[10px] px-1.5 py-0.5 rounded ${w.user.kycStatus === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>KYC: {w.user.kycStatus}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={w.status === 'APPROVED' || w.status === 'COMPLETED' ? 'badge-green' : w.status === 'REJECTED' ? 'badge-red' : 'badge-yellow'}>{w.status}</span>
                      <p className={`text-xs mt-1 ${parseFloat(w.fee || '0') > 0 ? 'text-yellow-400' : 'text-dark-500'}`} title="Network fee deducted from withdrawal amount">Fee: {parseFloat(w.fee || '0').toFixed(8)} {w.coin?.symbol}</p>
                    </div>
                  </div>
                  <div className="bg-dark-800/50 rounded-lg px-3 py-2 mb-2">
                    <p className="text-dark-400 text-xs flex items-center gap-1" title={`Full withdrawal address: ${w.address}`}>To Address: <code className="text-yellow-400 font-mono break-all">{w.address}</code>
                      <button onClick={(e) => { navigator.clipboard.writeText(w.address); const el = e.currentTarget; el.textContent = '✅'; setTimeout(() => { el.textContent = ''; }, 1000); }} className="text-dark-500 hover:text-white transition-colors shrink-0" title="Copy address"><Copy className="w-3 h-3" /></button>
                    </p>
                    {w.network && <p className="text-dark-500 text-xs mt-0.5">Network: <span className="bg-dark-700/50 text-dark-300 px-1.5 py-0.5 rounded text-[10px] font-mono">{w.network}</span></p>}
                  </div>
                  {w.userNote && <p className="text-dark-300 text-xs mb-2 italic bg-dark-800/30 rounded px-2 py-1">📝 User: &ldquo;{w.userNote}&rdquo;</p>}
                  {w.rejectionReason && <p className="text-red-400 text-xs mb-2 bg-red-500/10 rounded px-2 py-1 border border-red-500/20" title="Reason provided to user for withdrawal rejection">⚠ Rejection: {w.rejectionReason}</p>}
                  {w.status === 'PENDING' && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-dark-800">
                      <button onClick={() => approveWithdrawal(w.id)} className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors" title="Approve withdrawal and process the transfer">✓ Approve &amp; Send</button>
                      <input type="text" value={withdrawRejectForm.reason} onChange={(e) => setWithdrawRejectForm({...withdrawRejectForm, reason: e.target.value})}
                        className="input-field !py-2 flex-1 min-w-[150px]" placeholder="Rejection reason (required to reject)" title="Reason shown to the user for why their withdrawal was rejected" />
                      <button onClick={() => rejectWithdrawal(w.id)} className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors" title="Reject this withdrawal — reason required">✗ Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EMAIL TAB */}
        {tab === 'email' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white" title="Send emails, use templates, and view email history">Email Management <span className="text-dark-400 text-sm font-normal">({users.items?.length || 0} recipients available)</span></h1>
            <div className="glass-card max-w-2xl">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2" title="Compose and send a custom email to any user"><Mail className="w-4 h-4 text-primary-400" /> Send Custom Email</h3>
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm text-dark-300 mb-2" title="Recipient's email address — required field">To Email *</label>
                  <input type="email" value={emailForm.toEmail} onChange={(e) => setEmailForm({...emailForm, toEmail: e.target.value})}
                    className="input-field" placeholder="recipient@email.com" list="user-emails" title="Email address of the recipient" />
                  <datalist id="user-emails">
                    {(users.items || []).map((u: any) => (
                      <option key={u.id} value={u.email}>{u.firstName} {u.lastName}</option>
                    ))}
                  </datalist>
                  {users.items?.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <span className="text-dark-600 text-[10px]">Quick:</span>
                      {users.items.slice(0, 5).map((u: any) => (
                        <button key={u.id} type="button" onClick={() => setEmailForm({...emailForm, toEmail: u.email})} className="text-[10px] text-dark-500 hover:text-primary-400 transition-colors bg-dark-800/40 px-1.5 py-0.5 rounded">{u.email.split('@')[0]}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-2" title="Email subject line — required field">Subject *</label>
                  <input type="text" value={emailForm.subject} onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                    className="input-field" placeholder="Email subject" title="Subject line of the email" />
                  <span className="text-dark-600 text-[10px]">{emailForm.subject?.length || 0} chars</span>
                  {emailForm.subject && <p className="text-dark-600 text-[10px] mt-1">Preview: <span className="text-dark-400">&quot;{emailForm.subject}&quot;</span> → {emailForm.toEmail || 'recipient'}</p>}
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-2" title="Email body content — HTML formatting is supported">Body (HTML supported) *</label>
                  <textarea value={emailForm.body} onChange={(e) => setEmailForm({...emailForm, body: e.target.value})}
                    className="input-field resize-none" rows={8} placeholder="Write your email content here... HTML is supported." title="Email body content — HTML tags are supported for formatting" />
                  <p className={`text-[10px] mt-1 text-right ${emailForm.body.length > 5000 ? 'text-red-400' : emailForm.body.length > 2000 ? 'text-yellow-400' : 'text-dark-600'}`}>{emailForm.body.length} characters{emailForm.body.length > 5000 ? ' ⚠ Very long' : emailForm.body.length > 2000 ? ' — Long' : ''}</p>
                </div>
                {emailResult && (
                  <div className={`rounded-lg p-3 ${emailResult.includes('success') ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    <p className={emailResult.includes('success') ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>{emailResult}</p>
                  </div>
                )}
                <button onClick={sendEmail} disabled={emailSending || !emailForm.toEmail || !emailForm.subject || !emailForm.body}
                  className="btn-primary disabled:opacity-50 flex items-center gap-2" title="Send this email to the specified recipient">
                  <Send className="w-4 h-4" />
                  {emailSending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>

            {/* Email Preview */}
            {emailForm.body && (
              <div className="glass-card max-w-2xl">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2" title="Live preview of the email content before sending"><Eye className="w-4 h-4 text-primary-400" /> Email Preview</h3>
                <div className="bg-white rounded-lg p-4 text-dark-900 text-sm max-h-60 overflow-y-auto">
                  <p className="font-bold text-dark-800 mb-2">{emailForm.subject || '(No subject)'}</p>
                  <div dangerouslySetInnerHTML={{ __html: emailForm.body }} />
                </div>
                <p className="text-dark-600 text-[10px] mt-2">To: {emailForm.toEmail || '(not set)'} · From: noreply@oldkraken.com</p>
              </div>
            )}

            {/* Recent Email Logs */}
            <div className="glass-card max-w-2xl">
              <h3 className="text-white font-bold mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2" title="History of emails sent from the admin panel"><Mail className="w-4 h-4 text-primary-400" /> Recent Email Logs</span>
                <button onClick={async () => {
                  try { const r = await api.get('/admin/email/logs?limit=10'); setLogs(r.data); } catch {}
                }} className="text-xs text-primary-400 hover:text-primary-300" title="Reload email logs from server">Refresh</button>
              </h3>
              {logs.items?.length > 0 ? (
                <div className="space-y-2">
                  {logs.items.slice(0, 8).map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between py-2 border-b border-dark-800/30 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-dark-300 text-sm truncate">{log.toEmail}</p>
                        <p className="text-dark-500 text-xs truncate">{log.subject}</p>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <span className={log.status === 'sent' ? 'badge-green' : 'badge-red'} title={log.status === 'sent' ? 'Email delivered successfully' : 'Email delivery failed'}>{log.status}</span>
                        <p className="text-dark-500 text-xs mt-0.5" title={new Date(log.createdAt).toLocaleString()}>{new Date(log.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-sm">No email logs yet. Send an email to see logs here.</p>
              )}
            </div>

            {/* Predefined email templates */}
            <div className="glass-card max-w-2xl">
              <h3 className="text-white font-bold mb-4" title="Pre-written email templates — click to load into the email form">Quick Email Templates</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: '✅ Deposit Approved', subject: 'Your Deposit Has Been Approved', body: 'Dear Client,\n\nYour deposit has been reviewed and approved by our security team. The funds have been credited to your OldKraken account.\n\nThank you for choosing OldKraken — Sister of Kraken.com.\n\nBest regards,\nOldKraken Security Team' },
                  { label: '❌ Deposit Rejected', subject: 'Deposit Review - Action Required', body: 'Dear Client,\n\nUnfortunately, we were unable to verify your recent deposit. Please contact our support team at support@oldkraken.com for assistance.\n\nBest regards,\nOldKraken Support Team' },
                  { label: '⚠️ Security Alert', subject: 'Important Security Notice — OldKraken', body: 'Dear Client,\n\nWe have detected unusual activity on your account. As a precaution, please log in to verify your account security settings and ensure your 2FA is enabled.\n\nIf you did not initiate this, contact security@oldkraken.com immediately.\n\nOldKraken Security Team' },
                  { label: '🎉 Welcome Email', subject: 'Welcome to OldKraken — Sister of Kraken.com', body: 'Dear Client,\n\nWelcome to OldKraken! We are thrilled to have you as part of our growing community of 10 million+ clients worldwide.\n\nAs a sister platform of Kraken.com, co-founded in July 2011, you can trust that your recovered assets are in safe hands.\n\nLog in to your dashboard to view your portfolio and initiate a withdrawal: https://oldkraken.com/dashboard\n\nBest regards,\nThe OldKraken Team' },
                ].map((tmpl) => (
                  <button key={tmpl.label} onClick={() => setEmailForm({ ...emailForm, subject: tmpl.subject, body: tmpl.body })}
                    className="glass-card text-left text-sm hover:border-primary-600/50 transition-all p-3" title={`Load "${tmpl.subject}" template into the email form`}>
                    <p className="text-white font-medium">{tmpl.label}</p>
                    <p className="text-dark-400 text-xs mt-0.5 truncate">{tmpl.subject}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Broadcast Notification */}
            <div className="glass-card max-w-2xl">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-primary-400" /> Broadcast Notification</h3>
              <p className="text-dark-400 text-xs mb-3">Send an in-app notification to all active users at once.</p>
              <div className="space-y-3">
                <input id="broadcast-title" type="text" className="input-field" placeholder="Notification title (e.g. Scheduled Maintenance)" title="Title shown to all users in their notification panel" />
                <textarea id="broadcast-msg" className="input-field resize-none" rows={3} placeholder="Notification message..." title="Message body sent to every active user on the platform" onInput={(e) => { const el = e.target as HTMLTextAreaElement; const counter = el.parentElement?.querySelector('[data-broadcast-count]'); if (counter) counter.textContent = `${el.value.length} characters`; }} />
                <p className="text-dark-600 text-[10px] text-right" data-broadcast-count="">0 characters</p>
                <button onClick={async () => {
                  const title = (document.getElementById('broadcast-title') as HTMLInputElement)?.value;
                  const message = (document.getElementById('broadcast-msg') as HTMLTextAreaElement)?.value;
                  if (!title || !message) { alert('Fill in title and message'); return; }
                  if (!confirm(`Send notification to ALL active users?\n\nTitle: ${title}\nMessage: ${message}`)) return;
                  try {
                    const r = await api.post('/admin/broadcast', { title, message });
                    alert(`Notification sent to ${r.data?.sent || 0} users!`);
                    (document.getElementById('broadcast-title') as HTMLInputElement).value = '';
                    (document.getElementById('broadcast-msg') as HTMLTextAreaElement).value = '';
                  } catch { alert('Failed to broadcast notification'); }
                }} className="btn-primary text-sm flex items-center gap-2" title="Broadcast this notification to every active user on the platform">
                  <Bell className="w-4 h-4" /> Send to All Users
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {tab === 'logs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white" title="Complete history of all admin actions on the platform">Audit Logs <span className="text-dark-400 text-sm font-normal">({logs.total || 0} total)</span></h1>
                <div className="flex gap-3 mt-1 text-[10px]">
                  <span className="text-dark-500" title={`Displaying ${Math.min(PAGE_SIZE, logs.items?.length || 0)} entries per page out of ${logs.total || 0} total audit log entries`}>Page {page} of {Math.ceil((logs.total || 1) / PAGE_SIZE)} · Showing {Math.min(PAGE_SIZE, logs.items?.length || 0)}</span>
                  {statusFilter && <span className="text-primary-400">Filter: {statusFilter}</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <button onClick={() => {
                  const rows = [['Date','Action','Target','Details']];
                  logs.items?.forEach((l: any) => rows.push([new Date(l.createdAt).toLocaleString(), l.action, `${l.targetType} ${l.targetId?.slice(0,8)}`, l.details || '']));
                  const csv = rows.map(r => r.map(c => `"${(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
                }} className="btn-secondary text-xs !py-1.5 !px-3" title="Download audit logs as CSV file">📥 Export</button>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field text-xs !py-1.5 !px-3 w-auto" title="Filter audit logs by action type">
                  {['', 'APPROVE_DEPOSIT', 'REJECT_DEPOSIT', 'APPROVE_WITHDRAWAL', 'REJECT_WITHDRAWAL', 'FREEZE_USER', 'UNFREEZE_USER', 'UPDATE_KYC', 'MODIFY_BALANCE', 'CREATE_MAGIC_LINK', 'SEND_NOTIFICATION', 'BROADCAST_NOTIFICATION', 'UPDATE_USER'].map(action => (
                    <option key={action} value={action}>{action || 'All Actions'}</option>
                  ))}
                </select>
              </div>
            </div>
            {logs.total > PAGE_SIZE && (
              <div className="flex items-center justify-between glass-card !py-3">
                <p className="text-dark-400 text-sm">{logs.total} total · Page {page} of {Math.ceil(logs.total / PAGE_SIZE)}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary !py-1.5 !px-3 text-sm disabled:opacity-40" title="Go to previous page of logs">← Prev</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(logs.total / PAGE_SIZE)} className="btn-secondary !py-1.5 !px-3 text-sm disabled:opacity-40" title="Go to next page of logs">Next →</button>
                </div>
              </div>
            )}
            <div className="glass rounded-xl overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700/50">
                    <th className="text-left text-xs text-dark-400 font-medium px-4 py-3" title="Type of admin action performed">Action</th>
                    <th className="text-left text-xs text-dark-400 font-medium px-4 py-3" title="Entity affected by the action">Target</th>
                    <th className="text-left text-xs text-dark-400 font-medium px-4 py-3" title="Additional context about the action">Details</th>
                    <th className="text-left text-xs text-dark-400 font-medium px-4 py-3" title="When the action was performed">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.items?.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-dark-400">No logs found</td></tr>
                  )}
                  {logs.items?.map((log: any) => (
                    <Fragment key={log.id}>
                    <tr className="border-b border-dark-800/30 hover:bg-dark-800/20 transition-colors cursor-pointer" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.action?.includes('DELETE') || log.action?.includes('REJECT') || log.action?.includes('FREEZE') ? 'bg-red-500/20 text-red-400' : log.action?.includes('CREATE') || log.action?.includes('APPROVE') ? 'bg-green-500/20 text-green-400' : log.action?.includes('UPDATE') || log.action?.includes('EDIT') ? 'bg-yellow-500/20 text-yellow-400' : 'badge-blue'}`} title={log.action?.includes('DELETE') || log.action?.includes('REJECT') || log.action?.includes('FREEZE') ? 'Destructive action' : log.action?.includes('CREATE') || log.action?.includes('APPROVE') ? 'Constructive action' : log.action?.includes('UPDATE') || log.action?.includes('EDIT') ? 'Modification action' : 'System action'}>{log.action}</span></td>
                        <td className="px-4 py-3 text-dark-300 text-sm" title={`Target: ${log.targetType} — Full ID: ${log.targetId || 'N/A'}`}>{log.targetType} <code className="text-dark-500 text-xs">{log.targetId?.slice(0, 8)}</code></td>
                        <td className="px-4 py-3 text-dark-400 text-sm max-w-xs truncate" title={log.details || 'No details'}>{log.details}</td>
                        <td className="px-4 py-3 text-dark-500 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString()} <span className="text-dark-600">({(() => { const diff = Date.now() - new Date(log.createdAt).getTime(); const m = Math.floor(diff / 60000); const h = Math.floor(m / 60); const d = Math.floor(h / 24); return d > 0 ? `${d}d ago` : h > 0 ? `${h}h ago` : `${m}m ago`; })()})</span></td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr><td colSpan={4} className="px-4 py-3 bg-dark-800/30">
                        <div className="text-xs space-y-1">
                          <div className="flex gap-2"><span className="text-dark-500 w-16 shrink-0">ID:</span><code className="text-dark-400 font-mono">{log.id}</code></div>
                          <div className="flex gap-2"><span className="text-dark-500 w-16 shrink-0">Action:</span><span className="text-white">{log.action}</span></div>
                          <div className="flex gap-2"><span className="text-dark-500 w-16 shrink-0">Target:</span><span className="text-dark-300">{log.targetType} — <code className="text-primary-400 font-mono">{log.targetId}</code></span></div>
                          <div className="flex gap-2"><span className="text-dark-500 w-16 shrink-0">Details:</span><span className="text-dark-300 break-all">{log.details || '—'}</span></div>
                          <div className="flex gap-2"><span className="text-dark-500 w-16 shrink-0">Date:</span><span className="text-dark-400">{new Date(log.createdAt).toLocaleString()}</span></div>
                          {log.admin && <div className="flex gap-2"><span className="text-dark-500 w-16 shrink-0">Admin:</span><span className="text-dark-300">{log.admin.firstName} {log.admin.lastName} ({log.admin.email})</span></div>}
                        </div>
                      </td></tr>
                    )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TICKETS TAB */}
        {tab === 'tickets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">Support Tickets <span className="text-dark-400 text-sm font-normal">({tickets.total || 0} total)</span></h1>
                <p className="text-dark-400 text-sm mt-0.5">Manage user support requests and inquiries</p>
              </div>
              <div className="flex gap-2">
                {['', 'open', 'replied', 'closed'].map(s => (
                  <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'glass text-dark-300 hover:text-white'}`}>{s || 'All'}</button>
                ))}
              </div>
            </div>

            {analytics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="glass-card !py-3 text-center"><div className="text-xl font-bold text-primary-400">{analytics.tickets?.total || 0}</div><div className="text-dark-500 text-[10px]">Total Tickets</div></div>
                <div className="glass-card !py-3 text-center"><div className="text-xl font-bold text-yellow-400">{analytics.tickets?.open || 0}</div><div className="text-dark-500 text-[10px]">Open</div></div>
                <div className="glass-card !py-3 text-center"><div className="text-xl font-bold text-green-400">{analytics.logins?.success || 0}</div><div className="text-dark-500 text-[10px]">Successful Logins</div></div>
                <div className="glass-card !py-3 text-center"><div className="text-xl font-bold text-red-400">{analytics.logins?.failed || 0}</div><div className="text-dark-500 text-[10px]">Failed Logins</div></div>
              </div>
            )}

            {tickets.items?.length === 0 ? (
              <div className="glass-card text-center py-12">
                <MessageSquare className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400">No support tickets found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.items?.map((ticket: any) => (
                  <div key={ticket.id} className={`glass-card !p-4 ${ticket.status === 'open' ? 'border-yellow-500/30' : ticket.status === 'replied' ? 'border-green-500/30' : 'border-dark-700/30'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${ticket.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' : ticket.status === 'replied' ? 'bg-green-500/20 text-green-400' : 'bg-dark-700 text-dark-400'}`}>{ticket.status.toUpperCase()}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded ${ticket.priority === 'high' ? 'bg-red-500/20 text-red-400' : ticket.priority === 'urgent' ? 'bg-red-600/30 text-red-300' : 'bg-dark-700 text-dark-400'}`}>{ticket.priority}</span>
                        </div>
                        <h3 className="text-white font-semibold text-sm">{ticket.subject}</h3>
                        <p className="text-dark-400 text-xs mt-1">{ticket.email}</p>
                        <p className="text-dark-300 text-xs mt-2 leading-relaxed bg-dark-800/40 rounded-lg p-3">{ticket.message}</p>
                        {ticket.adminReply && (
                          <div className="mt-2 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                            <p className="text-green-400 text-[10px] font-semibold mb-1">Admin Reply:</p>
                            <p className="text-green-300 text-xs">{ticket.adminReply}</p>
                          </div>
                        )}
                        <p className="text-dark-600 text-[10px] mt-2">{new Date(ticket.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {ticket.status === 'open' && (
                          <>
                            <div className="flex gap-1">
                              <input type="text" value={ticketReply[ticket.id] || ''} onChange={(e) => setTicketReply(prev => ({ ...prev, [ticket.id]: e.target.value }))} placeholder="Type reply..." className="input-field text-xs !py-1.5 !px-2 w-40" />
                              <button onClick={async () => { if (!ticketReply[ticket.id]) return; try { await api.patch(`/admin/tickets/${ticket.id}/reply`, { reply: ticketReply[ticket.id] }); setTicketReply(prev => { const n = { ...prev }; delete n[ticket.id]; return n; }); loadTabData(); } catch (e: any) { alert(e.response?.data?.message || 'Failed'); } }} className="btn-primary text-[10px] !py-1.5 !px-2">Send</button>
                            </div>
                          </>
                        )}
                        {ticket.status !== 'closed' && (
                          <button onClick={async () => { try { await api.patch(`/admin/tickets/${ticket.id}/close`); loadTabData(); } catch {} }} className="btn-secondary text-[10px] !py-1 !px-2">Close</button>
                        )}
                        <button onClick={async () => { if (!confirm('Delete this ticket?')) return; try { await api.delete(`/admin/tickets/${ticket.id}`); loadTabData(); } catch {} }} className="text-red-400 hover:text-red-300 text-[10px] text-center">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tickets.total > PAGE_SIZE && (
              <div className="flex items-center justify-between glass-card !py-3">
                <p className="text-dark-400 text-sm">{tickets.total} total · Page {page}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary !py-1.5 !px-3 text-sm disabled:opacity-40">← Prev</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(tickets.total / PAGE_SIZE)} className="btn-secondary !py-1.5 !px-3 text-sm disabled:opacity-40">Next →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LIVE CHAT TAB */}
        {tab === 'livechat' && (
          <div className="flex h-[calc(100vh-2rem)] gap-0 -m-6">
            {/* Sessions List */}
            <div className="w-80 bg-dark-900 border-r border-dark-800 flex flex-col shrink-0">
              <div className="p-4 border-b border-dark-800">
                <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Radio className="w-4 h-4 text-green-400 animate-pulse" />
                  Live Chat
                  {chatUnread > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{chatUnread}</span>}
                </h2>
                <p className="text-dark-500 text-[10px] mt-1">{chatSessions.length} conversation{chatSessions.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {chatSessions.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageSquare className="w-8 h-8 text-dark-700 mx-auto mb-2" />
                    <p className="text-dark-500 text-xs">No chat sessions yet</p>
                    <p className="text-dark-600 text-[10px] mt-1">Waiting for visitors...</p>
                  </div>
                ) : (
                  chatSessions.map((s: any) => {
                    const lastMsg = s.messages?.[0];
                    const unreadCount = s._count?.messages || 0;
                    return (
                      <button
                        key={s.id}
                        onClick={() => openChatSession(s.id)}
                        className={`w-full text-left p-3 border-b border-dark-800/50 hover:bg-dark-800/50 transition-colors ${activeChatSession === s.id ? 'bg-primary-600/10 border-l-2 border-l-primary-500' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white text-xs font-medium truncate">
                            {s.visitorName || s.visitorEmail || s.visitorId?.slice(0, 12)}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${s.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-dark-700 text-dark-500'}`}>
                            {s.status}
                          </span>
                        </div>
                        {lastMsg && (
                          <p className="text-dark-400 text-[10px] truncate">
                            {lastMsg.sender === 'admin' ? 'You: ' : ''}{lastMsg.message}
                          </p>
                        )}
                        <p className="text-dark-600 text-[9px] mt-1">
                          {s.lastMessageAt ? new Date(s.lastMessageAt).toLocaleString() : new Date(s.createdAt).toLocaleString()}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-dark-950">
              {!activeChatSession ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Radio className="w-12 h-12 text-dark-700 mx-auto mb-3" />
                    <p className="text-dark-500 text-sm">Select a conversation</p>
                    <p className="text-dark-600 text-xs mt-1">Choose a chat session from the left panel</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="px-4 py-3 border-b border-dark-800 flex items-center justify-between bg-dark-900/50 shrink-0">
                    <div>
                      <h3 className="text-white text-sm font-semibold">
                        {chatSessions.find((s: any) => s.id === activeChatSession)?.visitorName || 
                         chatSessions.find((s: any) => s.id === activeChatSession)?.visitorEmail || 
                         'Visitor'}
                      </h3>
                      <p className="text-dark-500 text-[10px]">
                        {chatSessions.find((s: any) => s.id === activeChatSession)?.visitorEmail || 'No email provided'}
                        {' · '}
                        Session: {activeChatSession.slice(0, 8)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => closeChatSession(activeChatSession)} className="btn-secondary text-[10px] !py-1 !px-2">Close</button>
                      <button onClick={() => deleteChatSession(activeChatSession)} className="text-red-400 hover:text-red-300 text-[10px] px-2">Delete</button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-dark-600 text-xs">No messages in this session</p>
                      </div>
                    )}
                    {chatMessages.map((msg: any) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${
                          msg.sender === 'admin'
                            ? 'bg-primary-600 text-white rounded-br-sm'
                            : 'bg-dark-800 text-dark-200 rounded-bl-sm border border-dark-700'
                        }`}>
                          <p className="break-words whitespace-pre-wrap">{msg.message}</p>
                          <p className={`text-[9px] mt-1 ${msg.sender === 'admin' ? 'text-primary-200' : 'text-dark-500'}`}>
                            {msg.sender === 'admin' ? 'Admin' : 'Visitor'} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatMessagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-dark-800 bg-dark-900/50 shrink-0">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendAdminChat()}
                        placeholder="Type your reply..."
                        className="flex-1 px-3 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white text-sm placeholder-dark-500 focus:border-primary-500 outline-none"
                      />
                      <button
                        onClick={sendAdminChat}
                        disabled={!chatInput.trim()}
                        className="px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" /> Send
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white" title="Configure platform behavior, toggles, and custom settings">Platform Settings <span className="text-dark-400 text-sm font-normal">({Object.keys(settingsMap).length} settings)</span></h1>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Show maintenance page to all users', type: 'toggle' },
                { key: 'registration_enabled', label: 'Registration Enabled', desc: 'Allow new user registrations', type: 'toggle' },
                { key: 'withdraw_global_enabled', label: 'Withdrawals Enabled', desc: 'Allow all withdrawal requests', type: 'toggle' },
                { key: 'deposit_global_enabled', label: 'Deposits Enabled', desc: 'Allow all deposit submissions', type: 'toggle' },
                { key: 'platform_name', label: 'Platform Name', desc: 'Display name of the platform', type: 'text' },
                { key: 'support_email', label: 'Support Email', desc: 'Support contact email address', type: 'email' },
                { key: 'withdraw_fee1_percent', label: 'Recovery Fee %', desc: 'Percentage for the first withdrawal fee (default: 8)', type: 'text' },
                { key: 'withdraw_fee2_percent', label: 'Admin Fee %', desc: 'Percentage for the second withdrawal fee (default: 5)', type: 'text' },
                { key: 'withdraw_fee1_title', label: 'Recovery Fee Title', desc: 'Title shown on the 8% fee stage', type: 'text' },
                { key: 'withdraw_fee1_subtitle', label: 'Recovery Fee Subtitle', desc: 'Subtitle on the 8% fee stage', type: 'text' },
                { key: 'withdraw_fee1_message', label: 'Recovery Fee Message', desc: 'Full body text for the 8% fee stage (replaces default)', type: 'textarea' },
                { key: 'withdraw_fee2_title', label: 'Admin Fee Title', desc: 'Title shown on the 5% fee stage', type: 'text' },
                { key: 'withdraw_fee2_subtitle', label: 'Admin Fee Subtitle', desc: 'Subtitle on the 5% fee stage', type: 'text' },
                { key: 'withdraw_fee2_message', label: 'Admin Fee Message', desc: 'Full body text for the 5% fee stage (replaces default)', type: 'textarea' },
                { key: 'withdraw_warning', label: 'Withdrawal Warning Box', desc: 'Yellow warning box text on withdrawal page', type: 'textarea' },
                { key: 'withdraw_btn_deposit', label: 'Deposit Button Text', desc: 'Text for the deposit CTA button on withdrawal page', type: 'text' },
                { key: 'deposit_instructions', label: 'Deposit Instructions', desc: 'Custom instructions shown on deposit page', type: 'textarea' },
                { key: 'hero_title', label: 'Hero Title', desc: 'Landing page main headline', type: 'text' },
                { key: 'default_language', label: 'Default Language', desc: 'Default language for new users (en, es, fr, de, ar)', type: 'select', options: [{v:'en',l:'🇺🇸 English'},{v:'es',l:'🇪🇸 Español'},{v:'fr',l:'🇫🇷 Français'},{v:'de',l:'🇩🇪 Deutsch'},{v:'ar',l:'🇸🇦 العربية'}] },
              ].map((setting) => {
                const inputId = `setting-${setting.key}`;
                const currentVal = settingsMap[setting.key] || '';
                return (
                <div key={setting.key} className="glass-card" title={setting.desc}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-white font-semibold text-sm">{setting.label}</p>
                      <p className="text-dark-400 text-xs mt-0.5">{setting.desc}</p>
                      <code className="text-primary-400 text-xs">{setting.key}</code>
                    </div>
                    {currentVal && <span className="badge-green text-xs shrink-0">Set</span>}
                  </div>
                  {setting.type === 'toggle' ? (
                    <button onClick={async () => {
                      const newVal = currentVal === 'true' ? 'false' : 'true';
                      try {
                        await api.put('/admin/settings', { key: setting.key, value: newVal });
                        setSettingsMap(prev => ({ ...prev, [setting.key]: newVal }));
                      } catch(e: any) { alert(e.response?.data?.message || 'Failed'); }
                    }} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors mt-1 ${currentVal === 'true' ? 'bg-green-500' : 'bg-dark-700'}`} title={`${setting.label}: currently ${currentVal === 'true' ? 'enabled' : 'disabled'} — click to toggle`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${currentVal === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  ) : setting.type === 'select' ? (
                    <select id={inputId} key={currentVal} className="input-field text-sm" defaultValue={currentVal || 'en'}>
                      {(setting as any).options?.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ) : setting.type === 'textarea' ? (
                    <textarea id={inputId} key={currentVal} className="input-field resize-none text-sm" rows={3} defaultValue={currentVal} placeholder={`Enter ${setting.label}...`} title={`Current value for ${setting.label}`} />
                  ) : (
                    <input id={inputId} key={currentVal} type={setting.type} className="input-field text-sm" defaultValue={currentVal} placeholder={`Enter ${setting.label}...`} title={`Current value for ${setting.label}`} />
                  )}
                  {setting.type !== 'toggle' && (
                    <button onClick={async () => {
                      try {
                        const el = document.getElementById(inputId) as HTMLInputElement | HTMLTextAreaElement;
                        const val = el?.value;
                        if (val !== undefined) {
                          await api.put('/admin/settings', { key: setting.key, value: val });
                          setSettingsMap(prev => ({ ...prev, [setting.key]: val }));
                          alert('Setting updated!');
                        }
                      } catch(e: any) { alert(e.response?.data?.message || 'Failed'); }
                    }} className="btn-primary text-xs !py-1.5 !px-3 mt-3" title="Save this setting value to the database">Update</button>
                  )}
                </div>
                );
              })}
            </div>
            {/* Add Custom Setting */}
            <div className="glass-card">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2" title="Create a new platform setting with a custom key and value"><Settings className="w-4 h-4 text-primary-400" /> Add Custom Setting</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input id="custom-key" type="text" className="input-field flex-1" placeholder="Setting key (e.g. min_deposit_btc)" title="Unique identifier for the setting (snake_case recommended)" />
                <input id="custom-val" type="text" className="input-field flex-1" placeholder="Value" title="Value for this setting (string, number, or boolean)" />
                <button onClick={async () => {
                  const key = (document.getElementById('custom-key') as HTMLInputElement)?.value;
                  const value = (document.getElementById('custom-val') as HTMLInputElement)?.value;
                  if (!key || !value) { alert('Fill in key and value'); return; }
                  try {
                    await api.put('/admin/settings', { key, value });
                    setSettingsMap(prev => ({ ...prev, [key]: value }));
                    (document.getElementById('custom-key') as HTMLInputElement).value = '';
                    (document.getElementById('custom-val') as HTMLInputElement).value = '';
                    alert('Setting saved!');
                  } catch(e: any) { alert(e.response?.data?.message || 'Failed'); }
                }} className="btn-primary text-sm !py-2 shrink-0" title="Create a new custom platform setting">Add Setting</button>
              </div>
            </div>

            {/* All Settings List */}
            <div className="glass-card">
              <h3 className="text-white font-bold mb-4" title="Complete list of all platform settings with their current values">All Settings ({Object.keys(settingsMap).length})</h3>
              {Object.keys(settingsMap).length > 0 ? (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {Object.entries(settingsMap).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 px-2 border-b border-dark-800/30 last:border-0 hover:bg-dark-800/20 rounded">
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-xs font-mono" title={`Key: ${key}\nType: ${value === 'true' || value === 'false' ? 'Boolean' : !isNaN(Number(value)) ? 'Number' : 'String'}`}>{key} <span className={`text-[9px] px-1 py-0.5 rounded ${value === 'true' || value === 'false' ? 'bg-blue-500/20 text-blue-400' : !isNaN(Number(value)) && value !== '' ? 'bg-green-500/20 text-green-400' : 'bg-dark-700/50 text-dark-400'}`}>{value === 'true' || value === 'false' ? 'bool' : !isNaN(Number(value)) && value !== '' ? 'num' : 'str'}</span></p>
                        {(value === 'true' || value === 'false') ? (
                          <button onClick={() => {
                            const newVal = value === 'true' ? 'false' : 'true';
                            api.put('/admin/settings', { key, value: newVal }).then(() => setSettingsMap(prev => ({ ...prev, [key]: newVal }))).catch(() => alert('Failed'));
                          }} className={`text-xs px-2 py-0.5 rounded cursor-pointer ${value === 'true' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'} transition-colors`} title={`Click to toggle to ${value === 'true' ? 'false' : 'true'}`}>{value === 'true' ? '✓ true' : '✗ false'}</button>
                        ) : (
                          <p className="text-dark-400 text-xs truncate cursor-pointer hover:text-dark-300" onClick={() => {
                            const newVal = window.prompt(`Edit "${key}":`, value);
                            if (newVal !== null && newVal !== value) {
                              api.put('/admin/settings', { key, value: newVal }).then(() => setSettingsMap(prev => ({ ...prev, [key]: newVal }))).catch(() => alert('Failed'));
                            }
                          }} title="Click to edit">{value}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button onClick={() => navigator.clipboard.writeText(`${key}=${value}`)} className="text-dark-500 hover:text-primary-400 transition-colors" title="Copy"><Copy className="w-3 h-3" /></button>
                        <button onClick={async () => {
                          if (!confirm(`Delete setting "${key}"?`)) return;
                          try { await api.delete(`/admin/settings/${key}`); setSettingsMap(prev => { const n = {...prev}; delete n[key]; return n; }); } catch { alert('Failed to delete'); }
                        }} className="text-dark-600 hover:text-red-400 transition-colors" title="Delete">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-sm">No settings configured</p>
              )}
            </div>

            {/* Announcements Management */}
            <div className="glass-card">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2" title="Create and manage platform-wide announcements visible to all users"><Bell className="w-4 h-4 text-primary-400" /> Announcements <span className="text-dark-400 text-sm font-normal">({announcements.length})</span></h3>
              <div className="space-y-3 mb-5">
                <input id="ann-title" type="text" className="input-field" placeholder="Title (e.g. Scheduled Maintenance)" title="Announcement title shown to all users" />
                <textarea id="ann-content" className="input-field resize-none" rows={3} placeholder="Message content..." title="Announcement message body displayed on user dashboards" onInput={(e) => { const el = e.target as HTMLTextAreaElement; const counter = document.getElementById('ann-char-count'); if (counter) counter.textContent = `${el.value.length} chars`; }} />
                <span id="ann-char-count" className="text-dark-600 text-[10px]">0 chars</span>
                <div className="flex gap-3 items-center">
                  <select id="ann-type" className="input-field flex-1" title="Choose the visual style of the announcement" onChange={(e) => { const preview = document.getElementById('ann-type-preview'); if (preview) preview.className = `w-3 h-3 rounded-full shrink-0 ${e.target.value === 'warning' ? 'bg-yellow-400' : e.target.value === 'success' ? 'bg-green-400' : 'bg-blue-400'}`; }}>
                    <option value="info">Info (Blue)</option>
                    <option value="warning">Warning (Yellow)</option>
                    <option value="success">Success (Green)</option>
                  </select>
                  <span id="ann-type-preview" className="w-3 h-3 rounded-full shrink-0 bg-blue-400" />
                  <button onClick={async () => {
                    const title = (document.getElementById('ann-title') as HTMLInputElement)?.value;
                    const content = (document.getElementById('ann-content') as HTMLTextAreaElement)?.value;
                    const type = (document.getElementById('ann-type') as HTMLSelectElement)?.value;
                    if (!title || !content) { alert('Fill in title and content'); return; }
                    try {
                      await api.post('/admin/announcements', { title, content, type, isActive: true });
                      const res = await api.get('/settings/announcements');
                      (window as any).__setAnns?.(Array.isArray(res.data) ? res.data : res.data?.items || []);
                      alert('Announcement created!');
                    } catch(e: any) { alert(e.response?.data?.message || 'Failed'); }
                  }} className="btn-primary text-sm !py-2 !px-5" title="Publish this announcement to all users">Post</button>
                </div>
              </div>
            </div>

            {/* Announcement Preview */}
            <div className="glass-card">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2" title="Preview how announcements appear on the user dashboard"><Eye className="w-4 h-4 text-primary-400" /> User Preview</h3>
              <p className="text-dark-500 text-[10px] mb-2">This is how announcements appear on the user dashboard:</p>
              <div className="flex items-start gap-3 p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                <span className="text-lg shrink-0">ℹ️</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-primary-300">Sample Announcement Title</p>
                  <p className="text-dark-400 text-xs mt-0.5">This is how announcement content appears to users on their dashboard.</p>
                </div>
                <button className="text-dark-500 shrink-0 cursor-default">✕</button>
              </div>
            </div>

            {/* Existing Announcements List */}
            <div className="glass-card">
              <h3 className="text-white font-bold mb-4">Active Announcements</h3>
              {announcements.length > 0 ? (
                <div className="space-y-2">
                  {announcements.map((ann: any) => (
                    <div key={ann.id} className={`flex items-center justify-between py-2.5 px-3 rounded-lg border ${ann.isActive ? 'bg-dark-800/30 border-dark-700/50' : 'bg-dark-900/50 border-dark-800/30 opacity-60'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm shrink-0">{ann.type === 'warning' ? '⚠️' : ann.type === 'success' ? '✅' : 'ℹ️'}</span>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{ann.title} <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${ann.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : ann.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`} title={ann.type === 'warning' ? 'Warning — shown with yellow highlight to users' : ann.type === 'success' ? 'Success — shown with green highlight to users' : 'Info — shown with blue highlight to users'}>{ann.type}</span></p>
                          <p className="text-dark-500 text-xs truncate">{ann.content?.slice(0, 60)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <button onClick={async () => {
                          try {
                            await api.put(`/admin/announcements/${ann.id}`, { isActive: !ann.isActive });
                            const res = await api.get('/settings/announcements');
                            setAnnouncements(Array.isArray(res.data) ? res.data : res.data?.items || []);
                          } catch { alert('Failed'); }
                        }} className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${ann.isActive ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-dark-700 text-dark-400 hover:bg-dark-600'}`}>
                          {ann.isActive ? 'Active' : 'Inactive'}
                        </button>
                        <button onClick={async () => {
                          if (!confirm('Delete this announcement?')) return;
                          try { await api.delete(`/admin/announcements/${ann.id}`); const res = await api.get('/settings/announcements'); setAnnouncements(Array.isArray(res.data) ? res.data : res.data?.items || []); } catch { alert('Failed'); }
                        }} className="text-dark-500 hover:text-red-400 transition-colors text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-sm">No announcements created yet</p>
              )}
            </div>
          </div>
        )}

        {/* COINS TAB */}
        {tab === 'coins' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white" title="Configure cryptocurrency listings, addresses, fees, and deposit/withdrawal toggles">Coin Management <span className="text-dark-400 text-sm font-normal">({coins.length} coins)</span> <span className={`text-[10px] px-2 py-0.5 rounded-full ${coins.filter((c: any) => !c.depositAddress).length === 0 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{coins.filter((c: any) => !c.depositAddress).length === 0 ? '✓ All configured' : '⚠ Setup needed'}</span></h1>
                <div className="flex gap-3 mt-1 text-[10px]">
                  <span className="text-green-400">{coins.filter((c: any) => c.depositEnabled).length} deposit ON</span>
                  <span className="text-cyan-400">{coins.filter((c: any) => c.withdrawEnabled).length} withdraw ON</span>
                  <span className="text-red-400">{coins.filter((c: any) => !c.depositEnabled || !c.withdrawEnabled).length} partially disabled</span>
                  <span className="text-dark-500">{coins.reduce((sum: number, c: any) => sum + (c._count?.wallets || 0), 0)} total wallets</span>
                  <span className="text-dark-600">{coins.filter((c: any) => !c.depositAddress).length} missing address</span>
                </div>
              </div>
              <div className="relative">
                <input type="text" id="coin-search" className="input-field !py-2 !pl-9 w-48" placeholder="Search coins..." title="Filter coins by symbol or name" />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            <div className="glass rounded-xl overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700/50">
                    <th className="text-left text-xs text-dark-400 font-medium px-4 py-3" title="Ticker symbol used on exchanges">Symbol</th>
                    <th className="text-left text-xs text-dark-400 font-medium px-4 py-3" title="Coin full name and blockchain network">Name / Network</th>
                    <th className="text-left text-xs text-dark-400 font-medium px-4 py-3" title="Platform deposit address for this coin">Deposit Address</th>
                    <th className="text-left text-xs text-dark-400 font-medium px-4 py-3 hidden lg:table-cell" title="Minimum deposit, withdrawal fee, and minimum withdrawal">Min/Fee</th>
                    <th className="text-center text-xs text-dark-400 font-medium px-4 py-3" title="Toggle deposit on/off">Deposit</th>
                    <th className="text-center text-xs text-dark-400 font-medium px-4 py-3" title="Toggle withdrawal on/off">Withdraw</th>
                    <th className="text-right text-xs text-dark-400 font-medium px-4 py-3" title="Edit coin settings or deactivate">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coins.map((coin: any) => (
                    <tr key={coin.id} className="border-b border-dark-800/30 hover:bg-dark-800/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-dark-700 flex items-center justify-center text-[10px] font-bold text-primary-400 overflow-hidden shrink-0">
                            {coin.icon ? <img src={coin.icon} alt={coin.symbol} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} /> : coin.symbol.slice(0, 2)}
                          </div>
                          <span className="text-white font-bold">{coin.symbol}</span>
                          {(!coin.depositEnabled && !coin.withdrawEnabled) && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Both deposits and withdrawals disabled" />}
                          {(coin.depositEnabled && coin.withdrawEnabled) && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Fully active" />}
                          {(coin.depositEnabled !== coin.withdrawEnabled) && <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" title="Partially active" />}
                        </div>
                      </td>
                      <td className="px-4 py-3"><div className="text-white text-sm">{coin.name}</div><div className="text-xs"><span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${coin.network === 'ERC20' ? 'bg-blue-500/20 text-blue-400' : coin.network === 'BEP20' ? 'bg-yellow-500/20 text-yellow-400' : coin.network === 'TRC20' ? 'bg-red-500/20 text-red-400' : coin.network === 'SOL' ? 'bg-purple-500/20 text-purple-400' : 'bg-dark-700/50 text-dark-400'}`} title={coin.network === 'ERC20' ? 'Ethereum (ERC-20)' : coin.network === 'BEP20' ? 'Binance Smart Chain (BEP-20)' : coin.network === 'TRC20' ? 'Tron (TRC-20)' : coin.network === 'SOL' ? 'Solana (SPL)' : coin.network || 'Native'}>{coin.network || '—'}</span></div></td>
                      <td className="px-4 py-3">{coin.depositAddress ? <code className="text-xs text-primary-400 font-mono cursor-pointer hover:text-primary-300" onClick={(e) => { navigator.clipboard.writeText(coin.depositAddress); const el = e.target as HTMLElement; const orig = el.textContent; el.textContent = '✅ Copied!'; setTimeout(() => { el.textContent = orig; }, 1000); }} title="Click to copy">{coin.depositAddress.slice(0, 16)}...</code> : <span className="text-red-400 text-xs" title="No deposit address configured — users cannot deposit this coin">Not set</span>}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="text-[10px] text-dark-500 space-y-0.5">
                          {coin.depositMinimum && <div title="Minimum deposit amount required">Min dep: <span className="text-dark-400">{coin.depositMinimum}</span></div>}
                          {coin.withdrawalFee && <div title="Fee charged per withdrawal">Fee: <span className="text-dark-400">{coin.withdrawalFee}</span></div>}
                          {coin.withdrawalMinimum && <div title="Minimum withdrawal amount">Min wdw: <span className="text-dark-400">{coin.withdrawalMinimum}</span></div>}
                          {coin._count?.wallets !== undefined && <div title="Number of user wallets holding this coin">Wallets: <span className="text-dark-400">{coin._count.wallets}</span></div>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center"><button onClick={async () => { if (!confirm(`${coin.depositEnabled ? 'Disable' : 'Enable'} deposits for ${coin.symbol}?`)) return; try { await api.put(`/admin/coins/${coin.id}`, { depositEnabled: !coin.depositEnabled }); const res = await api.get('/coins'); setCoins(res.data || []); } catch { alert('Failed'); } }} className={`${coin.depositEnabled ? 'badge-green' : 'badge-red'} cursor-pointer hover:opacity-80`} title={coin.depositEnabled ? 'Deposits enabled — click to disable' : 'Deposits disabled — click to enable'}>{coin.depositEnabled ? 'ON' : 'OFF'}</button></td>
                      <td className="px-4 py-3 text-center"><button onClick={async () => { if (!confirm(`${coin.withdrawEnabled ? 'Disable' : 'Enable'} withdrawals for ${coin.symbol}?`)) return; try { await api.put(`/admin/coins/${coin.id}`, { withdrawEnabled: !coin.withdrawEnabled }); const res = await api.get('/coins'); setCoins(res.data || []); } catch { alert('Failed'); } }} className={`${coin.withdrawEnabled ? 'badge-green' : 'badge-red'} cursor-pointer hover:opacity-80`} title={coin.withdrawEnabled ? 'Withdrawals enabled — click to disable' : 'Withdrawals disabled — click to enable'}>{coin.withdrawEnabled ? 'ON' : 'OFF'}</button></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end items-center">
                          {coin.createdAt && <span className="text-dark-600 text-[9px] mr-1" title={`Added: ${new Date(coin.createdAt).toLocaleDateString()}`}>{(() => { const d = Math.floor((Date.now() - new Date(coin.createdAt).getTime()) / 86400000); return d > 365 ? `${Math.floor(d/365)}y` : d > 30 ? `${Math.floor(d/30)}m` : `${d}d`; })()}</span>}
                          <button onClick={() => { setEditingCoin(coin); setCoinForm({ depositAddress: coin.depositAddress || '', depositEnabled: coin.depositEnabled, withdrawEnabled: coin.withdrawEnabled, depositMinimum: coin.depositMinimum || '', withdrawalFee: coin.withdrawalFee || '', withdrawalMinimum: coin.withdrawalMinimum || '' }); }} className="text-primary-400 hover:text-primary-300 text-xs font-medium" title="Edit coin settings, deposit address, and fees">Edit</button>
                          <button onClick={async () => {
                            if (!confirm(`Deactivate ${coin.symbol}? Users won't be able to deposit/withdraw.`)) return;
                            try { await api.delete(`/admin/coins/${coin.id}`); const res = await api.get('/coins'); setCoins(res.data || []); }
                            catch(e: any) { alert(e.response?.data?.message || 'Failed'); }
                          }} className="text-red-400 hover:text-red-300 text-xs font-medium" title="Disable all deposits and withdrawals for this coin">Deactivate</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Create New Coin */}
            <div className="glass-card">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2" title="Register a new cryptocurrency on the platform"><Plus className="w-4 h-4 text-green-400" /> Add New Coin</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <input id="new-coin-symbol" type="text" className="input-field text-sm" placeholder="Symbol (e.g. BTC)" title="Ticker symbol for the cryptocurrency" />
                <input id="new-coin-name" type="text" className="input-field text-sm" placeholder="Name (e.g. Bitcoin)" title="Full name of the cryptocurrency" />
                <input id="new-coin-network" type="text" className="input-field text-sm" placeholder="Network (e.g. Bitcoin)" title="Blockchain network this coin operates on" />
                <input id="new-coin-address" type="text" className="input-field font-mono text-sm" placeholder="Deposit address" title="Platform wallet address for receiving deposits" />
              </div>
              <button onClick={async () => {
                const symbol = (document.getElementById('new-coin-symbol') as HTMLInputElement)?.value;
                const name = (document.getElementById('new-coin-name') as HTMLInputElement)?.value;
                const network = (document.getElementById('new-coin-network') as HTMLInputElement)?.value;
                const depositAddress = (document.getElementById('new-coin-address') as HTMLInputElement)?.value;
                if (!symbol || !name) { alert('Symbol and name are required'); return; }
                try {
                  await api.post('/admin/coins', { symbol: symbol.toUpperCase(), name, network, depositAddress, depositEnabled: true, withdrawEnabled: false, isActive: true });
                  const res = await api.get('/coins'); setCoins(res.data || []);
                  alert('Coin created!');
                } catch(e: any) { alert(e.response?.data?.message || 'Failed'); }
              }} className="btn-primary text-sm !py-2 !px-5" title="Create a new coin on the platform">Add Coin</button>
            </div>

            {/* Edit Coin Modal */}
            {editingCoin && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditingCoin(null)}>
                <div className="glass-card max-w-lg w-full" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-white mb-4" title={`Edit configuration for ${editingCoin.symbol} (${editingCoin.name})`}>Edit {editingCoin.symbol} — {editingCoin.name}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                        {editingCoin.icon ? <img src={editingCoin.icon} alt={editingCoin.symbol} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} /> : editingCoin.symbol.slice(0, 2)}
                      </div>
                      <div className="text-white font-bold">{editingCoin.symbol}</div>
                      <div className="text-dark-400 text-sm">{editingCoin.name}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-dark-300 mb-1.5 font-medium" title="Wallet address where users send deposits for this coin">Deposit Address</label>
                      <div className="flex gap-2">
                        <input type="text" value={coinForm.depositAddress} onChange={e => setCoinForm({...coinForm, depositAddress: e.target.value})} className="input-field font-mono text-sm flex-1" placeholder="Enter wallet address" title="Platform wallet address where users send deposits for this coin" />
                        {coinForm.depositAddress && <button onClick={() => navigator.clipboard.writeText(coinForm.depositAddress)} className="btn-secondary text-xs !py-2 !px-2 shrink-0" title="Copy"><Copy className="w-3.5 h-3.5" /></button>}
                      </div>
                      {editingCoin.depositAddress && <p className="text-dark-600 text-[10px] font-mono mt-1 break-all">Current: {editingCoin.depositAddress}</p>}
                    </div>
                    <div className="bg-dark-800/30 rounded-lg p-2 mb-1">
                      <p className="text-dark-500 text-[9px] uppercase tracking-wider mb-1" title="Currently saved values for this coin's configuration">Current Values</p>
                      <div className="flex gap-3 text-[10px] text-dark-400 flex-wrap">
                        <span>Min Dep: <span className="text-white">{editingCoin.depositMinimum || '—'}</span></span>
                        <span>Fee: <span className="text-white">{editingCoin.withdrawalFee || '—'}</span></span>
                        <span>Min Wdw: <span className="text-white">{editingCoin.withdrawalMinimum || '—'}</span></span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-dark-400 mb-1.5" title="Minimum deposit amount accepted for this coin">Min Deposit</label>
                        <input type="text" value={coinForm.depositMinimum} onChange={e => setCoinForm({...coinForm, depositMinimum: e.target.value})} className="input-field text-sm" placeholder="0.001" title="Minimum amount required for a deposit to be accepted" />
                        <p className="text-dark-600 text-[9px] mt-0.5">Numeric value only</p>
                      </div>
                      <div>
                        <label className="block text-xs text-dark-400 mb-1.5" title="Fee deducted from each withdrawal of this coin">Withdrawal Fee</label>
                        <input type="text" value={coinForm.withdrawalFee} onChange={e => setCoinForm({...coinForm, withdrawalFee: e.target.value})} className="input-field text-sm" placeholder="0.0005" title="Fee deducted from each withdrawal" />
                        <p className="text-dark-600 text-[9px] mt-0.5">Fee per withdrawal</p>
                      </div>
                      <div>
                        <label className="block text-xs text-dark-400 mb-1.5" title="Minimum amount required for a withdrawal request">Min Withdrawal</label>
                        <input type="text" value={coinForm.withdrawalMinimum} onChange={e => setCoinForm({...coinForm, withdrawalMinimum: e.target.value})} className="input-field text-sm" placeholder="0.01" title="Minimum amount required for a withdrawal request" />
                        <p className="text-dark-600 text-[9px] mt-0.5">Minimum amount</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={coinForm.depositEnabled} onChange={e => setCoinForm({...coinForm, depositEnabled: e.target.checked})} className="w-4 h-4" title="Toggle whether users can deposit this coin" />
                        <span className="text-dark-300 text-sm">Deposits Enabled</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={coinForm.withdrawEnabled} onChange={e => setCoinForm({...coinForm, withdrawEnabled: e.target.checked})} className="w-4 h-4" title="Toggle whether users can withdraw this coin" />
                        <span className="text-dark-300 text-sm">Withdrawals Enabled</span>
                      </label>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setEditingCoin(null)} className="btn-secondary flex-1" title="Discard changes and close">Cancel</button>
                      <button onClick={async () => { try { await api.put(`/admin/coins/${editingCoin.id}`, { depositAddress: coinForm.depositAddress, depositEnabled: coinForm.depositEnabled, withdrawEnabled: coinForm.withdrawEnabled, depositMinimum: parseFloat(coinForm.depositMinimum) || undefined, withdrawalFee: parseFloat(coinForm.withdrawalFee) || undefined, withdrawalMinimum: parseFloat(coinForm.withdrawalMinimum) || undefined }); alert(`✅ ${editingCoin.symbol} updated successfully!`); setEditingCoin(null); const res = await api.get('/coins'); setCoins(res.data || []); } catch(e: any) { alert(e.response?.data?.message || 'Failed'); } }} className="btn-primary flex-1" title="Save all coin configuration changes">Save Changes</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MARKETING TAB */}
        {tab === 'marketing' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Email Marketing <span className="text-dark-400 text-sm font-normal">{mktStats ? `${mktStats.confirmed} confirmed subscribers` : ''}</span></h1>

            {/* Stats */}
            {mktStats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Total Subscribers', val: mktStats.totalSubscribers, color: 'text-primary-400' },
                  { label: 'Confirmed', val: mktStats.confirmed, color: 'text-green-400' },
                  { label: 'Pending', val: mktStats.pending, color: 'text-yellow-400' },
                  { label: 'Unsubscribed', val: mktStats.unsubscribed, color: 'text-red-400' },
                  { label: 'Forms', val: mktStats.totalForms, color: 'text-cyan-400' },
                  { label: 'Campaigns', val: mktStats.totalCampaigns, color: 'text-purple-400' },
                ].map(s => (
                  <div key={s.label} className="glass-card !py-3 text-center">
                    <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
                    <div className="text-dark-500 text-[10px]">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Subscription Forms */}
            <div className="glass-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">Subscription Forms</h3>
                <button onClick={() => { setMktEditFormId(null); setMktFormData({ name: '', title: '', description: '', buttonText: 'Subscribe', fields: ['email', 'firstName'], successMsg: '', topMessage: '' }); setMktNewField(''); setMktFormModal(true); }} className="btn-primary text-xs !py-2 !px-3">+ New Form</button>
              </div>
              {mktForms.length === 0 ? (
                <p className="text-dark-400 text-sm">No forms yet. Create one to start collecting subscribers.</p>
              ) : (
                <div className="space-y-2">
                  {mktForms.map((f: any) => {
                    const formUrl = `${window.location.origin}/subscribe/${f.slug}`;
                    return (
                    <div key={f.id} className="bg-dark-800/30 rounded-lg p-3 border border-dark-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${f.active !== false ? 'bg-green-400' : 'bg-red-400'}`} />
                          <p className="text-white font-semibold text-xs">{f.name}</p>
                          <span className="text-[9px] text-dark-500 bg-dark-800 px-1.5 py-0.5 rounded font-mono">{f.subscriberCount || 0} subs</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a href={formUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium">Preview ↗</a>
                          <button onClick={() => { navigator.clipboard.writeText(formUrl); alert('Link copied!'); }} className="text-[10px] text-primary-400 hover:text-primary-300 font-medium">Copy Link</button>
                          <button onClick={() => {
                            const parsedFields = (() => { try { const p = JSON.parse(f.fields || '[]'); return Array.isArray(p) ? p : ['email']; } catch { return (f.fields || 'email').split(',').map((x: string) => x.trim()); } })();
                            setMktEditFormId(f.id);
                            setMktFormData({ name: f.name, title: f.title || '', description: f.description || '', buttonText: f.buttonText || 'Subscribe', fields: parsedFields, successMsg: f.successMsg || '', topMessage: f.topMessage || '' });
                            setMktNewField('');
                            setMktFormModal(true);
                          }} className="text-[10px] text-yellow-400 hover:text-yellow-300 font-medium">Edit</button>
                          <button onClick={async () => { if (confirm('Delete this form?')) { await api.delete(`/marketing/admin/forms/${f.id}`); setMktForms(mktForms.filter((x: any) => x.id !== f.id)); }}} className="text-[10px] text-red-400 hover:text-red-300 font-medium">Delete</button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-dark-900/60 rounded px-2.5 py-1.5">
                        <span className="text-dark-500 text-[10px] shrink-0">URL:</span>
                        <code className="text-primary-400 text-[10px] font-mono truncate flex-1">{formUrl}</code>
                        <button onClick={() => { navigator.clipboard.writeText(formUrl); }} className="text-dark-500 hover:text-primary-400 shrink-0" title="Copy URL">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[9px] text-dark-500">
                        <span>Slug: <code className="text-dark-400">{f.slug}</code></span>
                        <span>·</span>
                        <span>Button: &quot;{f.buttonText || 'Subscribe'}&quot;</span>
                        <span>·</span>
                        <span>Fields: {(() => { try { return JSON.parse(f.fields || '[]').join(', '); } catch { return f.fields; } })()}</span>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Form Modal (Create / Edit) */}
            {mktFormModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => { setMktFormModal(false); setMktEditFormId(null); }}>
                <div className="glass-card max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="text-white font-bold mb-4">{mktEditFormId ? 'Edit Subscription Form' : 'Create Subscription Form'}</h3>
                  <div className="space-y-3">
                    <div><label className="text-dark-300 text-xs mb-1 block">Form Name *</label><input value={mktFormData.name} onChange={e => setMktFormData({...mktFormData, name: e.target.value})} className="input-field text-sm" placeholder="Newsletter Signup" /></div>
                    <div><label className="text-dark-300 text-xs mb-1 block">Title (heading shown on the form page)</label><input value={mktFormData.title} onChange={e => setMktFormData({...mktFormData, title: e.target.value})} className="input-field text-sm" placeholder="Subscribe to Our Newsletter" /></div>
                    <div><label className="text-dark-300 text-xs mb-1 block">Top Message (text displayed above the form)</label><textarea value={mktFormData.topMessage} onChange={e => setMktFormData({...mktFormData, topMessage: e.target.value})} className="input-field text-sm resize-none" rows={2} placeholder="Join thousands of crypto enthusiasts and get exclusive updates..." /></div>
                    <div><label className="text-dark-300 text-xs mb-1 block">Description</label><textarea value={mktFormData.description} onChange={e => setMktFormData({...mktFormData, description: e.target.value})} className="input-field text-sm resize-none" rows={2} placeholder="Stay updated with the latest news..." /></div>
                    <div><label className="text-dark-300 text-xs mb-1 block">Button Text</label><input value={mktFormData.buttonText} onChange={e => setMktFormData({...mktFormData, buttonText: e.target.value})} className="input-field text-sm" placeholder="Subscribe" /></div>
                    <div><label className="text-dark-300 text-xs mb-1 block">Success Message (after submit)</label><input value={mktFormData.successMsg} onChange={e => setMktFormData({...mktFormData, successMsg: e.target.value})} className="input-field text-sm" placeholder="Thank you for subscribing! Check your email to confirm." /></div>

                    {/* Dynamic Fields */}
                    <div>
                      <label className="text-dark-300 text-xs mb-2 block font-semibold">Form Fields</label>
                      <div className="space-y-1.5 mb-2">
                        {mktFormData.fields.map((field, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-dark-500 text-xs w-5 text-right">{idx + 1}.</span>
                            <input value={field} onChange={e => { const nf = [...mktFormData.fields]; nf[idx] = e.target.value; setMktFormData({...mktFormData, fields: nf}); }} className="input-field text-sm flex-1 !py-1.5" placeholder="Field name" />
                            <button onClick={() => { if (mktFormData.fields.length <= 1) return; const nf = mktFormData.fields.filter((_, i) => i !== idx); setMktFormData({...mktFormData, fields: nf}); }} className="text-red-400 hover:text-red-300 p-1" title="Remove field"><Minus className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input value={mktNewField} onChange={e => setMktNewField(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && mktNewField.trim()) { setMktFormData({...mktFormData, fields: [...mktFormData.fields, mktNewField.trim()]}); setMktNewField(''); }}} className="input-field text-sm flex-1 !py-1.5" placeholder="Add new field (e.g. phone, company, city...)" />
                        <button onClick={() => { if (mktNewField.trim()) { setMktFormData({...mktFormData, fields: [...mktFormData.fields, mktNewField.trim()]}); setMktNewField(''); }}} className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1" title="Add field"><Plus className="w-3 h-3" /> Add</button>
                      </div>
                      <p className="text-dark-600 text-[10px] mt-1">Common fields: email, firstName, lastName, phone, company, country, city</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={() => { setMktFormModal(false); setMktEditFormId(null); }} className="btn-secondary flex-1">Cancel</button>
                      <button onClick={async () => {
                        if (!mktFormData.name) { alert('Form name is required'); return; }
                        try {
                          const payload = { ...mktFormData, fields: mktFormData.fields.filter(f => f.trim()) };
                          if (mktEditFormId) {
                            const res = await api.put(`/marketing/admin/forms/${mktEditFormId}`, payload);
                            setMktForms(mktForms.map((f: any) => f.id === mktEditFormId ? { ...f, ...res.data } : f));
                          } else {
                            const res = await api.post('/marketing/admin/forms', payload);
                            setMktForms([res.data, ...mktForms]);
                          }
                          setMktFormModal(false);
                          setMktEditFormId(null);
                          setMktFormData({ name: '', title: '', description: '', buttonText: 'Subscribe', fields: ['email', 'firstName'], successMsg: '', topMessage: '' });
                          setMktNewField('');
                        } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
                      }} className="btn-primary flex-1">{mktEditFormId ? 'Save Changes' : 'Create Form'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subscribers */}
            <div className="glass-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">Subscribers <span className="text-dark-400 text-sm font-normal">({mktSubs.total})</span></h3>
              </div>

              {/* Import emails */}
              <div className="mb-4 p-3 bg-dark-800/30 rounded-lg">
                <p className="text-dark-300 text-xs mb-2 font-semibold">Bulk Import Emails</p>
                <textarea value={mktImportText} onChange={e => setMktImportText(e.target.value)} className="input-field text-xs resize-none mb-2" rows={2} placeholder="Paste emails, one per line or comma-separated..." />
                <button onClick={async () => {
                  const emails = mktImportText.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
                  if (emails.length === 0) return;
                  try {
                    const res = await api.post('/marketing/admin/subscribers/import', { emails });
                    alert(`Imported ${res.data.imported}, skipped ${res.data.skipped}`);
                    setMktImportText('');
                    api.get('/marketing/admin/subscribers?limit=50').then(r => setMktSubs(r.data)).catch(() => {});
                    api.get('/marketing/admin/stats').then(r => setMktStats(r.data)).catch(() => {});
                  } catch { alert('Import failed'); }
                }} className="btn-primary text-xs !py-1.5 !px-3">Import</button>
              </div>

              {(mktSubs.items || []).length === 0 ? (
                <p className="text-dark-400 text-sm">No subscribers yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="pro-table">
                    <thead><tr>
                      <th>Email</th><th>Name</th><th>Status</th><th>Source</th><th>Country / City</th><th>IP Address</th><th>Device</th><th>Subscribed</th><th className="text-right">Actions</th>
                    </tr></thead>
                    <tbody>
                      {(mktSubs.items || []).map((s: any) => (
                        <tr key={s.id}>
                          <td className="text-white font-mono">{s.email}</td>
                          <td className="text-dark-300">{s.firstName || ''} {s.lastName || ''}</td>
                          <td><span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${s.status === 'confirmed' ? 'bg-green-500/15 text-green-400' : s.status === 'pending' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>{s.status}</span></td>
                          <td className="text-dark-500">{s.source}</td>
                          <td>{s.country ? <span className="text-dark-300">{s.country}{s.city ? `, ${s.city}` : ''}</span> : <span className="text-dark-600">—</span>}</td>
                          <td className="font-mono text-dark-500">{s.ipAddress || '—'}</td>
                          <td className="text-dark-500 max-w-[120px] truncate" title={s.userAgent || ''}>{s.userAgent ? (s.userAgent.includes('Mobile') ? '📱 Mobile' : s.userAgent.includes('Windows') ? '🖥 Windows' : s.userAgent.includes('Mac') ? '🖥 macOS' : s.userAgent.includes('Linux') ? '🖥 Linux' : '🌐 Browser') : '—'}</td>
                          <td className="text-dark-500 whitespace-nowrap">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
                          <td className="text-right"><button onClick={async () => { if (confirm('Remove subscriber?')) { await api.delete(`/marketing/admin/subscribers/${s.id}`); setMktSubs({...mktSubs, items: mktSubs.items.filter((x: any) => x.id !== s.id), total: mktSubs.total - 1}); }}} className="text-red-400 hover:text-red-300 text-[10px] font-medium">Remove</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Campaigns */}
            <div className="glass-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">Email Campaigns</h3>
                <button onClick={() => setMktCampModal(true)} className="btn-primary text-xs !py-2 !px-3">+ New Campaign</button>
              </div>
              {(mktCampaigns.items || []).length === 0 ? (
                <p className="text-dark-400 text-sm">No campaigns yet. Create one to send mass emails.</p>
              ) : (
                <div className="space-y-2">
                  {(mktCampaigns.items || []).map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between bg-dark-800/30 rounded-lg px-4 py-3">
                      <div>
                        <p className="text-white font-medium text-sm">{c.name}</p>
                        <p className="text-dark-400 text-xs">Subject: {c.subject} · Status: <span className={c.status === 'sent' ? 'text-green-400' : c.status === 'sending' ? 'text-yellow-400' : 'text-dark-300'}>{c.status}</span></p>
                        {c.status === 'sent' && <p className="text-dark-500 text-[10px]">Sent: {c.sentCount} · Failed: {c.failedCount}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {c.status === 'draft' && (
                          <button disabled={mktSending === c.id} onClick={async () => {
                            if (!confirm(`Send this campaign to all confirmed subscribers?`)) return;
                            setMktSending(c.id);
                            try {
                              const res = await api.post(`/marketing/admin/campaigns/${c.id}/send`);
                              alert(`Sent to ${res.data.sentCount} subscribers (${res.data.failedCount} failed)`);
                              api.get('/marketing/admin/campaigns').then(r => setMktCampaigns(r.data)).catch(() => {});
                            } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
                            setMktSending(null);
                          }} className="text-xs text-green-400 hover:text-green-300 font-medium">
                            {mktSending === c.id ? 'Sending...' : 'Send Now'}
                          </button>
                        )}
                        <button onClick={async () => { if (confirm('Delete?')) { await api.delete(`/marketing/admin/campaigns/${c.id}`); setMktCampaigns({...mktCampaigns, items: mktCampaigns.items.filter((x: any) => x.id !== c.id)}); }}} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* New Campaign Modal */}
            {mktCampModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setMktCampModal(false)}>
                <div className="glass-card max-w-lg w-full" onClick={e => e.stopPropagation()}>
                  <h3 className="text-white font-bold mb-4">Create Email Campaign</h3>
                  <div className="space-y-3">
                    <div><label className="text-dark-300 text-xs mb-1 block">Campaign Name *</label><input value={mktCampData.name} onChange={e => setMktCampData({...mktCampData, name: e.target.value})} className="input-field text-sm" placeholder="February Newsletter" /></div>
                    <div><label className="text-dark-300 text-xs mb-1 block">Email Subject *</label><input value={mktCampData.subject} onChange={e => setMktCampData({...mktCampData, subject: e.target.value})} className="input-field text-sm" placeholder="Exciting news from OldKraken!" /></div>
                    <div><label className="text-dark-300 text-xs mb-1 block">From Name</label><input value={mktCampData.fromName} onChange={e => setMktCampData({...mktCampData, fromName: e.target.value})} className="input-field text-sm" placeholder="OldKraken (optional)" /></div>
                    <div>
                      <label className="text-dark-300 text-xs mb-1 block">Email Body (HTML supported)</label>
                      <textarea value={mktCampData.body} onChange={e => setMktCampData({...mktCampData, body: e.target.value})} className="input-field text-sm resize-none font-mono" rows={8} placeholder="<p>Hi {{firstName}},</p><p>We have exciting news...</p>" />
                      <p className="text-dark-600 text-[10px] mt-1">Variables: {'{{firstName}}'}, {'{{lastName}}'}, {'{{email}}'}</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setMktCampModal(false)} className="btn-secondary flex-1">Cancel</button>
                      <button onClick={async () => {
                        if (!mktCampData.name || !mktCampData.subject || !mktCampData.body) { alert('Fill in all required fields'); return; }
                        try {
                          const res = await api.post('/marketing/admin/campaigns', mktCampData);
                          setMktCampaigns({...mktCampaigns, items: [res.data, ...(mktCampaigns.items || [])]});
                          setMktCampModal(false);
                          setMktCampData({ name: '', subject: '', body: '', fromName: '' });
                        } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
                      }} className="btn-primary flex-1">Create Campaign</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      {/* Admin Footer */}
      <div className="fixed bottom-0 right-0 p-2 text-dark-700 text-[10px] z-10" title="OldKraken Admin Panel — current version and build year">
        OldKraken Admin v2.0.0 · {new Date().getFullYear()}
      </div>
    </div>
  );
}
