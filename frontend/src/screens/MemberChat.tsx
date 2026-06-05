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
  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await api.get(`/chat/${roomId}/messages`);
      setMessages(data.messages || []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // WebSocket connection
  useEffect(() => {
    const wsUrl = window.location.origin.replace(/^http/, 'ws');
    // For now, polling fallback since WS to DO requires routing
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
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
    <div>
      <h1 className="page-title">💬 Member Chat</h1>
      <div className="chat-container">
        <div className="chat-header">
          <h3>Club Communication</h3>
          <span className="badge badge-primary">Verified: {user?.id?.slice(-6) || '...'}</span>
        </div>
        <div className="chat-tabs">
          <button className={`chat-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            All Messages
          </button>
          <button className={`chat-tab ${activeTab === 'broadcast' ? 'active' : ''}`} onClick={() => setActiveTab('broadcast')}>
            Broadcasts Only
          </button>
        </div>
        <div className="chat-messages" ref={scrollRef}>
          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="icon">💬</div>
              <p>No messages yet. Say hello to the brotherhood!</p>
            </div>
          )}
          {filtered.map(msg => (
            <div
              key={msg.id}
              className={`chat-message ${msg.senderId === user?.id ? 'sent' : 'received'} ${msg.isBroadcast ? 'broadcast' : ''}`}
            >
              <span className="chat-msg-sender">{msg.senderName}</span>
              <div className="chat-msg-bubble">{msg.text}</div>
              <span className="chat-msg-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
        <div className="chat-input-bar">
          <input
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Message the brotherhood..."
          />
          <button className="chat-send-btn" onClick={handleSend} disabled={!inputText.trim()}>
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberChat;
