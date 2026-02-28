'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageSquare, X, Send, Minimize2 } from 'lucide-react';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

function getVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let vid = localStorage.getItem('okr_visitor_id');
  if (!vid) {
    vid = 'v_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('okr_visitor_id', vid);
  }
  return vid;
}

interface ChatMsg {
  id: string;
  sessionId: string;
  sender: 'visitor' | 'admin';
  message: string;
  createdAt: string;
}

export default function LiveChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [started, setStarted] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Only connect socket AFTER user clicks "Start Chat" — never on page load
  useEffect(() => {
    if (!started) return;

    const socket = io(`${SOCKET_URL}/chat`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 30000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join', {
        visitorId: getVisitorId(),
        visitorName: nameInput || undefined,
        visitorEmail: emailInput || undefined,
      });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('session', (session: any) => {
      setSessionId(session.id);
      if (session.messages?.length) {
        setMessages(session.messages);
      }
    });

    socket.on('new-message', (msg: ChatMsg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.sender === 'admin') {
        setUnread(u => u + 1);
      }
    });

    socket.on('session-closed', () => {
      setMessages(prev => [...prev, {
        id: 'system-closed-' + Date.now(),
        sessionId: '',
        sender: 'admin' as const,
        message: 'This chat has been closed by support. Feel free to start a new conversation!',
        createdAt: new Date().toISOString(),
      }]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [started]);

  function sendMessage() {
    if (!input.trim() || !sessionId || !socketRef.current) return;
    socketRef.current.emit('send-message', {
      sessionId,
      message: input.trim(),
      sender: 'visitor',
    });
    setInput('');
  }

  function handleStartChat() {
    setStarted(true);
  }

  function handleOpen() {
    setOpen(true);
    setUnread(0);
  }

  return (
    <>
      {/* Floating Chat Button — always visible bottom-right */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
          title="Live Chat Support"
        >
          <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unread}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[9999] w-[360px] h-[500px] bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">Live Support</h3>
                <p className="text-primary-200 text-[10px]">
                  {connected ? '● Online' : started ? '○ Connecting...' : '○ Click Start to begin'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors">
                <Minimize2 className="w-3.5 h-3.5 text-white" />
              </button>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Pre-chat form — NO socket connection until user clicks Start */}
          {!started ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mb-2">
                <MessageSquare className="w-8 h-8 text-primary-400" />
              </div>
              <h4 className="text-white font-semibold text-lg">Welcome!</h4>
              <p className="text-dark-400 text-xs text-center">Start a conversation with our support team. We typically reply within minutes.</p>
              <input type="text" placeholder="Your name (optional)" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-dark-800 border border-dark-700 text-white text-sm placeholder-dark-500 focus:border-primary-500 outline-none" />
              <input type="email" placeholder="Your email (optional)" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-dark-800 border border-dark-700 text-white text-sm placeholder-dark-500 focus:border-primary-500 outline-none" />
              <button onClick={handleStartChat} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold text-sm hover:from-primary-400 hover:to-primary-500 transition-all">
                Start Chat
              </button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-dark-500 text-xs">Send a message to start the conversation</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.sender === 'visitor' ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-dark-800 text-dark-200 rounded-bl-sm border border-dark-700'}`}>
                      <p className="break-words whitespace-pre-wrap">{msg.message}</p>
                      <p className={`text-[9px] mt-1 ${msg.sender === 'visitor' ? 'text-primary-200' : 'text-dark-500'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-dark-700 shrink-0">
                <div className="flex gap-2">
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." className="flex-1 px-3 py-2 rounded-lg bg-dark-800 border border-dark-700 text-white text-sm placeholder-dark-500 focus:border-primary-500 outline-none" disabled={!connected} />
                  <button onClick={sendMessage} disabled={!input.trim() || !connected} className="w-9 h-9 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0">
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
