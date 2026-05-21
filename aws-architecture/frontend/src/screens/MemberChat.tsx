import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isBroadcast: boolean;
}

interface MemberChatProps {
  user: User;
  onBack: () => void;
}

const MemberChat: React.FC<MemberChatProps> = ({ user, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'brotherhood' | 'broadcast'>('brotherhood');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial mock data - In production, this will sync with your AWS RDS/Firebase
    const mockMessages: Message[] = [
      { id: '1', senderId: 'ADMIN', senderName: 'Secretary', text: 'Brothers, the levy for the Charity Outreach is now due.', timestamp: '09:00 AM', isBroadcast: true },
      { id: '2', senderId: 'UYSC-123', senderName: 'Chidi', text: 'I just cleared mine via the portal. Seamless!', timestamp: '10:15 AM', isBroadcast: false }
    ];
    setMessages(mockMessages);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBroadcast: activeTab === 'broadcast' && user.role === 'Executive'
    };
    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] animate-in fade-in duration-500">
      <div className="p-6 bg-white/5 backdrop-blur-xl border-b border-white/5 flex items-center justify-between rounded-b-[2.5rem]">
        <button onClick={onBack} className="text-white bg-white/10 p-2 rounded-xl active:scale-90 transition-transform">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="text-center">
          <h2 className="text-white font-black uppercase tracking-widest text-xs italic">Club Communication</h2>
          <p className="text-primary text-[9px] font-bold uppercase tracking-[0.3em] mt-1">Verified: {user.id}</p>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex p-4 gap-2">
        <button onClick={() => setActiveTab('brotherhood')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'brotherhood' ? 'bg-primary text-white shadow-[0_0_20px_rgba(0,0,0,0.3)]' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
          <span className="material-symbols-outlined text-lg mr-2">group</span>Brotherhood Chat
        </button>
        <button onClick={() => setActiveTab('broadcast')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'broadcast' ? 'bg-secondary text-white shadow-[0_0_20px_rgba(234,42,51,0.3)]' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
          <span className="material-symbols-outlined text-lg mr-2">campaign</span>Broadcasts
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar" ref={scrollRef}>
        <AnimatePresence>
          {messages.filter(m => activeTab === 'broadcast' ? m.isBroadcast : !m.isBroadcast).map((msg) => (
            <motion.div 
              initial={{ opacity: 0, x: msg.senderId === user.id ? 20 : -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: msg.senderId === user.id ? 20 : -20 }}
              key={msg.id} 
              className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 px-2">{msg.senderName}</span>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.isBroadcast ? 'bg-gradient-to-br from-secondary to-primary text-white border border-white/20 shadow-lg shadow-secondary/20' : msg.senderId === user.id ? 'bg-white text-slate-900 font-bold shadow-lg' : 'bg-white/5 text-white border border-white/5'}`}>
                {msg.text}
                <p className={`text-[8px] mt-2 opacity-50 ${msg.senderId === user.id ? 'text-slate-900' : 'text-white'}`}>{msg.timestamp}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-6 pb-10">
        {activeTab === 'broadcast' && user.role !== 'Executive' ? (
          <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/5 backdrop-blur">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <span className="material-symbols-outlined text-base mr-2">lock</span>Read-Only Mode for Broadcasts
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-[2rem] border border-white/10 backdrop-blur">
            <input 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)} 
              onKeyPress={handleKeyPress}
              placeholder={activeTab === 'broadcast' ? 'Executive broadcast..." : "Message the brotherhood..."} 
              className="flex-1 bg-transparent border-none text-white text-sm focus:ring-0 px-4 placeholder-slate-500" 
            />
            <button 
              onClick={handleSendMessage} 
              disabled={!inputText.trim()}
              className="bg-primary text-white size-12 rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberChat;