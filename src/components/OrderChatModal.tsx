'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, MessageCircle, Loader2, User } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePusher } from '@/contexts/PusherContext';

interface OrderChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderNumber: string;
  otherUserName: string;
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  type: string;
}

export default function OrderChatModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  otherUserName,
}: OrderChatModalProps) {
  const { user } = useAuth();
  const { subscribeToOrderChannel, unsubscribeFromOrderChannel, isConnected } = usePusher();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasSubscribed = useRef(false);
  const isNearBottomRef = useRef(true);

  // Fetch message history
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/chats/orders/${orderId}/messages`);
      const rawMsgs = res?.data || [];
      if (Array.isArray(rawMsgs)) {
        const msgs = rawMsgs.map((msg: any) => ({
          id: String(msg.id),
          content: msg.content,
          senderId: String(msg.senderId),
          senderName: msg.sender?.name || '',
          createdAt: msg.createdAt,
          type: msg.type || 'text',
        }));
        setMessages(msgs);
      }
    } catch (err: any) {
      console.error('[order-chat] Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Open/close management
  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      hasSubscribed.current = false;
    } else {
      // Cleanup on close
      setMessages([]);
      setInputText('');
      if (hasSubscribed.current) {
        unsubscribeFromOrderChannel(orderId);
        hasSubscribed.current = false;
      }
    }
  }, [isOpen, orderId, fetchMessages, unsubscribeFromOrderChannel]);

  // Subscribe to Pusher for real-time messages
  useEffect(() => {
    if (!isOpen || !isConnected || hasSubscribed.current) return;
    hasSubscribed.current = true;

    const channel = subscribeToOrderChannel(orderId);
    if (!channel) return;

    const handleNewMessage = (data: any) => {
      setMessages(prev => {
        const msg: ChatMessage = {
          id: String(data.id),
          content: data.content,
          senderId: String(data.senderId),
          senderName: data.senderName || '',
          createdAt: data.createdAt,
          type: data.type || 'text',
        };
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    channel.bind('new-message', handleNewMessage);

    return () => {
      channel.unbind('new-message');
    };
  }, [isOpen, isConnected, orderId, subscribeToOrderChannel]);

  // Send message
  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;
    const content = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      await api.post(`/chats/orders/${orderId}/messages`, { content });
      inputRef.current?.focus();
    } catch (err: any) {
      console.error('[order-chat] Error sending:', err);
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Track scroll position
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 150;
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  // Focus input on mount
  useEffect(() => {
    if (isOpen && !loading) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, loading]);

  // Format time
  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  // Format date separator
  const formatDateSeparator = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === today.toDateString()) return 'Hoy';
      if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return ''; }
  };

  const shouldShowDateSeparator = (current: ChatMessage, previous?: ChatMessage) => {
    if (!previous) return true;
    try {
      return new Date(current.createdAt).toDateString() !== new Date(previous.createdAt).toDateString();
    } catch { return false; }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      padding: 16,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        height: '85vh',
        maxHeight: 700,
        background: 'var(--white)',
        borderRadius: 20,
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--white)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MessageCircle size={20} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Chat Pedido #{orderNumber}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                {otherUserName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--white)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--input-bg)';
              e.currentTarget.style.color = 'var(--text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--white)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={28} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--primary)' }} />
            </div>
          ) : messages.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MessageCircle size={28} color="var(--primary)" style={{ opacity: 0.5 }} />
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>
                No hay mensajes. Inicia una conversacion con {otherUserName}.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const isOwn = msg.senderId === String(user?.id);
                const showSep = shouldShowDateSeparator(msg, messages[idx - 1]);
                return (
                  <React.Fragment key={msg.id}>
                    {showSep && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0',
                      }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: 'var(--text-light)',
                          textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                        }}>
                          {formatDateSeparator(msg.createdAt)}
                        </span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      </div>
                    )}
                    <div style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: isOwn ? 'flex-end' : 'flex-start',
                      maxWidth: '78%', alignSelf: isOwn ? 'flex-end' : 'flex-start',
                    }}>
                      {!isOwn && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, paddingLeft: 4,
                        }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: '#F39C12',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, fontWeight: 700, color: 'var(--white)',
                          }}>
                            {msg.senderName ? msg.senderName[0].toUpperCase() : <User size={10} />}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>
                            {msg.senderName || 'Delivery'}
                          </span>
                        </div>
                      )}
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: isOwn ? 'var(--primary)' : 'var(--input-bg)',
                        color: isOwn ? 'var(--white)' : 'var(--text)',
                        fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                      }}>
                        {msg.content}
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 2, padding: '0 4px' }}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'flex-end', gap: 10,
          background: 'var(--white)',
        }}>
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 12,
              border: '2px solid var(--border)',
              background: 'var(--input-bg)', color: 'var(--text)',
              fontSize: 14, lineHeight: 1.5, outline: 'none', resize: 'none',
              fontFamily: 'inherit', maxHeight: 100, minHeight: 42,
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || sending}
            style={{
              width: 42, height: 42, borderRadius: 12, border: 'none',
              background: inputText.trim() && !sending ? 'var(--primary)' : 'var(--border)',
              color: inputText.trim() && !sending ? 'var(--white)' : 'var(--text-light)',
              cursor: inputText.trim() && !sending ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease', flexShrink: 0,
            }}
          >
            {sending ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={20} style={{ transform: 'rotate(-45deg)' }} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
