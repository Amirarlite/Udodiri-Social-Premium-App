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
  const [ws, setWs] = useState<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const roomId = 'default';

  // Fetch initial messages
  const storageKey = `udodiri_chat_${roomId}`;

  // Load cached messages from localStorage first (if any)
  useEffect(() => {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        setMessages(JSON.parse(cached));
      } catch { /* ignore malformed */ }
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await api.get(`/chat/${roomId}/messages`);
      const msgs = data.messages || [];
      setMessages(msgs);
      // Persist to localStorage for offline use
      localStorage.setItem(storageKey, JSON.stringify(msgs));
    } catch (err) { console.error(err); }
  }, [roomId]);

  // Initial load (cached then fresh)
  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // WebSocket connection for real-time updates
  // Poll for new messages every few seconds and also refetch when online
  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000);
    const handleOnline = () => fetchMessages();
    window.addEventListener('online', handleOnline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    try {
      const { data } = await api.post(`/chat/${roomId}/messages`, { text: inputText.trim() });
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }
      setInputText('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send');
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const filtered = messages.filter(m => activeTab === 'broadcast' ? m.isBroadcast : true);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-4 h-16 w-full bg-surface dark:bg-surface-dim border-b border-surface-variant dark:border-outline-variant shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant">
            <img 
              alt="Club Logo" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRbFVy5HEUfW-W3DJXDyepgDkJTYO5zg_RBV9QbRRXYs4ekl3or4bVwsxD4JEomyWBj5DrvfHd9bsi5IwyHvr8R7Z_VzlPt2EnQYNuC1-Nq88--xl-9AcdevvU8xqj3kq883D3sYALuMav8v0PYNWwS7lmBrsfSh9RlnEfd63yIktDyeTI2gtdNLrIkD27WybhVbu5J-d0WbECYA6ol4T6thSCHTktKmJPKFWjUPjAbgr7Ho4B-K-Adwq6xsp9uOsS2XAc0s9tSQ6G" 
            />
          </div>
          <div>
            <h1 className="font-title-md text-title-md font-bold text-primary">Udodiri Young Social Club</h1>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              <span className="font-label-caps text-label-caps text-on-surface-variant">14 Members Online</span>
            </div>
          </div>
        </div>
        <div className="cursor-pointer active:opacity-80 hover:bg-surface-container-high transition-colors p-2 rounded-full">
          <span className="material-symbols-outlined text-primary" data-icon="notifications">notifications</span>
        </div>
      </header>

      {/* Main Chat Canvas */}
      <main className="flex-1 overflow-y-auto chat-container flex flex-col px-4 py-3 space-y-3">
        {/* Date Divider */}
        <div className="flex justify-center my-2">
          <span className="bg-surface-container text-on-surface-variant font-label-caps text-label-caps px-4 py-1 border border-outline-variant rounded-full">TODAY</span>
        </div>

        {/* Messages */}
        {filtered.length === 0 && (
          <div className="empty-state text-center padding-4">
            <div className="icon text-4xl mb-2">💬</div>
            <p className="text-on-surface-variant">No messages yet. Say hello to the brotherhood!</p>
          </div>
        )}
        
        {filtered.map(msg => (
          <div key={msg.id} className={`flex items-end gap-2 max-w-[85%] ${msg.senderId === user?.id ? 'ml-auto flex-row-reverse gap-2' : ''}`}>
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-outline-variant">
              <img 
                alt="Member Avatar" 
                className="w-full h-full object-cover" 
                src="https://via.placeholder.com/32" 
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-on-surface-variant ml-1">{msg.senderName}</span>
              <div className={`p-3 rounded-xl border border-outline-variant ${msg.senderId === user?.id ? 'bg-primary-container text-on-primary-container rounded-br-none' : 'bg-secondary-container text-on-secondary-container rounded-bl-none'}`}>
                <p className="font-body-sm text-body-sm">{msg.text}</p>
              </div>
              <span className="text-[10px] text-on-surface-variant ml-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        <div ref={scrollRef} className="h-20 shrink-0"></div>
      </main>

      {/* Sticky Chat Input */}
      <section className="sticky bottom-20 w-full px-4 pb-3 z-40">
        <div className="bg-surface-container-highest border border-outline-variant rounded-full p-1 flex items-center shadow-2xl">
          <button className="p-2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined" data-icon="add_circle">add_circle</span>
          </button>
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/50 font-body-sm px-2"
          />
          <button 
            className="bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 hover:brightness-110 disabled:opacity-50"
            onClick={handleSend}
            disabled={!inputText.trim()}
          >
            <span className="material-symbols-outlined" data-icon="send">send</span>
          </button>
        </div>
      </section>

      {/* Bottom NavBar */}
      <nav className="fixed bottom-0 w-full z-50 bg-surface-container dark:bg-surface-container-low flex justify-around items-center h-20 px-1 pb-safe border-t border-surface-variant dark:border-outline-variant">
        <div className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-transform scale-95 active:scale-90 cursor-pointer">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-caps text-label-caps mt-0.5">Dashboard</span>
        </div>
        <div className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-transform scale-95 active:scale-90 cursor-pointer">
          <span className="material-symbols-outlined">campaign</span>
          <span className="font-label-caps text-label-caps mt-0.5">Alerts</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 scale-95 transition-transform active:scale-90 cursor-pointer">
          <span className="material-symbols-outlined" data-icon="chat">chat</span>
          <span className="font-label-caps text-label-caps">Chat</span>
        </div>
        <div className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-transform scale-95 active:scale-90 cursor-pointer">
          <span className="material-symbols-outlined">event</span>
          <span className="font-label-caps text-label-caps mt-0.5">Meetings</span>
        </div>
      </nav>
    </div>
  );
};

export default MemberChat;
