import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/api';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isBroadcast: boolean;
}

const MemberChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'broadcast'>('all');
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'failed'>('connecting');
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const roomId = 'default';

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await api.get(`/chat/${roomId}/messages`);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // WebSocket connection management with polling fallback
  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let fallbackInterval: any = null;

    const connectWS = () => {
      setWsStatus('connecting');
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/api/chat/${roomId}/connect`;
        
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setWsStatus('connected');
          if (fallbackInterval) {
            clearInterval(fallbackInterval);
            fallbackInterval = null;
          }
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'message' && data.message) {
              setMessages(prev => {
                if (prev.some(m => m.id === data.message.id)) return prev;
                return [...prev, data.message];
              });
            }
          } catch (e) {
            console.error('Error parsing WS message', e);
          }
        };

        socket.onclose = (e) => {
          console.log('WS connection closed. Code:', e.code);
          setWsStatus('connecting');
          // Try to reconnect in 5s
          reconnectTimeout = setTimeout(connectWS, 5000);
          
          // Trigger polling fallback
          if (!fallbackInterval) {
            fallbackInterval = setInterval(fetchMessages, 3000);
          }
        };

        socket.onerror = (err) => {
          console.error('WS socket error:', err);
          setWsStatus('failed');
          socket?.close();
        };
      } catch (err) {
        console.error('Failed to initialize WebSocket', err);
        setWsStatus('failed');
        if (!fallbackInterval) {
          fallbackInterval = setInterval(fetchMessages, 3000);
        }
      }
    };

    connectWS();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const msgText = inputText.trim();
    setInputText('');

    // If WebSocket is connected, send message through it
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'message',
        senderId: user?.id || 'anonymous',
        senderName: user?.name || 'Unknown',
        text: msgText,
        isBroadcast: user?.role === 'Executive' || user?.role === 'Admin'
      };
      wsRef.current.send(JSON.stringify(payload));
    } else {
      // Fallback: Send via POST API
      try {
        const { data } = await api.post(`/chat/${roomId}/messages`, { text: msgText });
        if (data.message) {
          setMessages(prev => {
            if (prev.some(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to send message');
      }
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filtered = messages.filter(m => activeTab === 'broadcast' ? m.isBroadcast : true);

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] max-w-[800px] mx-auto bg-surface-container border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="bg-surface border-b border-outline-variant p-4 flex justify-between items-center px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center overflow-hidden border border-outline-variant">
            <img
              src="/udodiri-app-logo.png"
              alt="Udodiri App Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
          </div>
          <div>
            <h2 className="text-sm font-bold text-on-surface">Member Communication</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${
                wsStatus === 'connected' ? 'bg-secondary' : wsStatus === 'connecting' ? 'bg-tertiary' : 'bg-red-500'
              }`}></span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                {wsStatus === 'connected' ? 'Real-time Connected' : wsStatus === 'connecting' ? 'Connecting...' : 'Offline (Polling)'}
              </span>
            </div>
          </div>
        </div>
        <span className="bg-surface-container-high border border-outline-variant px-3 py-1 rounded-full text-[10px] font-bold text-primary tracking-widest uppercase">
          ID: {user?.id?.slice(-6) || '...'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-container-low border-b border-outline-variant p-1.5 gap-2 shrink-0">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 text-center rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'all' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          All Messages
        </button>
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex-1 py-2 text-center rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'broadcast' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          Broadcasts Only
        </button>
      </div>

      {/* Messages Window */}
      <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-background" ref={scrollRef}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant opacity-60">
            <span className="material-symbols-outlined text-5xl mb-2 text-primary">chat_bubble</span>
            <p className="text-sm font-medium">No messages yet. Greet the brotherhood!</p>
          </div>
        ) : (
          filtered.map((msg, idx) => {
            const isMe = msg.senderId === user?.id;
            const isUrgent = msg.isBroadcast;

            return (
              <div
                key={msg.id || idx}
                className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                {!isMe && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-2">
                    {msg.senderName}
                  </span>
                )}
                
                <div
                  className={`p-3.5 rounded-2xl border text-sm leading-relaxed ${
                    isMe
                      ? isUrgent
                        ? 'bg-gradient-to-tr from-primary-container to-primary/80 border-primary text-white rounded-br-none shadow-lg'
                        : 'bg-primary text-on-primary border-primary/20 rounded-br-none'
                      : isUrgent
                        ? 'bg-gradient-to-tr from-error-container to-primary/25 border-primary text-on-surface rounded-bl-none shadow-md'
                        : 'bg-surface-container-high border-slate-800 text-on-surface rounded-bl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                
                <div className="flex items-center gap-1.5 mt-1 mx-2">
                  <span className="text-[9px] text-on-surface-variant">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && (
                    <span className="material-symbols-outlined text-xs text-secondary">
                      {wsStatus === 'connected' ? 'done_all' : 'done'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Bar */}
      <div className="bg-surface border-t border-outline-variant p-3 md:p-4 flex gap-3 items-center shrink-0">
        <input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message the brotherhood..."
          className="flex-grow bg-surface-container-highest border border-outline-variant rounded-full px-5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-0 outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="bg-primary hover:brightness-110 text-on-primary w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-primary/10"
        >
          <span className="material-symbols-outlined text-base">send</span>
        </button>
      </div>
    </div>
  );
};

export default MemberChat;
