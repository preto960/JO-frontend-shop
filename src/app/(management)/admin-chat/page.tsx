'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Users, Circle, MessageCircle, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePusher } from '@/contexts/PusherContext';
import { showToast, getInitials, getRoleBadgeColor } from '@/lib/utils';

interface AdminMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
}

export default function AdminChatPage() {
  const { user } = useAuth();
  const { pusher, isConnected, subscribeToAdminChat, adminOnlineMembers } = usePusher();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<any>(null);
  const hasSubscribed = useRef(false);
  const isNearBottomRef = useRef(true);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/chats/admin/messages');
      const rawMsgs = res?.data || [];
      if (Array.isArray(rawMsgs)) {
        const msgs = rawMsgs.map((msg: any) => ({
          id: String(msg.id),
          content: msg.content,
          senderId: String(msg.senderId),
          senderName: msg.sender?.name || 'Admin',
          senderRole: msg.sender?.email ? 'admin' : '',
          createdAt: msg.createdAt,
        }));
        setMessages(msgs);
      }
    } catch (err: any) {
      console.error('[admin-chat] Error fetching:', err);
      if (err?.response?.status === 403) {
        showToast('No tienes permiso para acceder al chat', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Subscribe to presence channel + admin-message events
  useEffect(() => {
    if (!pusher || !user || hasSubscribed.current) return;
    hasSubscribed.current = true;

    const channel = subscribeToAdminChat();
    if (!channel) return;
    channelRef.current = channel;

    // Listen for new messages
    channel.bind('new-message', (data: any) => {
      setMessages(prev => {
        const msg = {
          id: String(data.id),
          content: data.content,
          senderId: String(data.senderId),
          senderName: data.senderName || 'Admin',
          senderRole: 'admin',
          createdAt: data.createdAt,
        };
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind('new-message');
      }
    };
  }, [pusher, user, subscribeToAdminChat]);

  // Send message
  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;
    const content = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      await api.post('/chats/admin/messages', { content });
      // Re-focus the input after sending
      inputRef.current?.focus();
    } catch (err: any) {
      showToast(err?.message || 'Error al enviar mensaje', 'error');
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Track whether the user is near the bottom of the chat
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 150;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom on new messages only if user is near bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  // Format time
  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  // Format date for separator
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

  // Check if we should show a date separator between messages
  const shouldShowDateSeparator = (current: AdminMessage, previous?: AdminMessage) => {
    if (!previous) return true;
    try {
      const currDate = new Date(current.createdAt).toDateString();
      const prevDate = new Date(previous.createdAt).toDateString();
      return currDate !== prevDate;
    } catch { return false; }
  };

  // Filter: show only admins connected from landingpage (not self, not frontend-shop)
  const onlineMembersArray = Array.from(adminOnlineMembers.entries())
    .filter(([id, info]) => id !== String(user?.id) && info?.platform === 'landingpage')
    .map(([id, info]) => ({
      id,
      ...info,
    }));
  const onlineCount = onlineMembersArray.length;

  return (
    <div style={{ padding: '24px', height: 'calc(100dvh - 80px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Header ── */}
      <div style={{
        background: 'var(--white)',
        borderRadius: 16,
        padding: '16px 20px',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MessageCircle size={22} color="var(--primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Chat de Administradores
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isConnected ? 'var(--success)' : 'var(--text-light)',
                boxShadow: isConnected ? '0 0 6px rgba(46,204,113,0.5)' : 'none',
              }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-light)' }}>·</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {onlineCount} admin{onlineCount !== 1 ? 's' : ''} en línea
              </span>
            </div>
          </div>
        </div>

        {/* Online members toggle button */}
        <button
          onClick={() => setShowMembers(!showMembers)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 10,
            border: '2px solid var(--border)',
            background: showMembers ? 'var(--primary-light)' : 'var(--white)',
            color: showMembers ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            if (!showMembers) {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.color = 'var(--primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!showMembers) {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
        >
          <Users size={16} />
          <span>{onlineCount}</span>
        </button>
      </div>

      {/* ── Main content area ── */}
      <div style={{ flex: 1, display: 'flex', gap: 16, overflow: 'hidden', minHeight: 0 }}>
        {/* ── Messages area ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--white)',
          borderRadius: 16,
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          {/* Messages list */}
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
                <div style={{
                  width: 36,
                  height: 36,
                  border: '3px solid var(--border)',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
              </div>
            ) : messages.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '40px 20px',
              }}>
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <MessageCircle size={32} color="var(--primary)" style={{ opacity: 0.5 }} />
                </div>
                <p style={{
                  fontSize: 15,
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  fontWeight: 500,
                }}>
                  No hay mensajes. Inicia una conversación.
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => {
                  const isOwn = msg.senderId === String(user?.id);
                  const showSeparator = shouldShowDateSeparator(msg, messages[idx - 1]);

                  return (
                    <React.Fragment key={msg.id}>
                      {/* Date separator */}
                      {showSeparator && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          margin: '12px 0',
                        }}>
                          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--text-light)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap',
                          }}>
                            {formatDateSeparator(msg.createdAt)}
                          </span>
                          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        </div>
                      )}

                      {/* Message bubble */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOwn ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        alignSelf: isOwn ? 'flex-end' : 'flex-start',
                      }}>
                        {/* Sender info (only for other users' messages) */}
                        {!isOwn && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 4,
                            paddingLeft: 4,
                          }}>
                            {/* Avatar */}
                            <div style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: getRoleBadgeColor(msg.senderRole),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 9,
                              fontWeight: 700,
                              color: 'var(--white)',
                              flexShrink: 0,
                            }}>
                              {getInitials(msg.senderName)}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                              {msg.senderName}
                            </span>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: getRoleBadgeColor(msg.senderRole),
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-full)',
                              background: getRoleBadgeColor(msg.senderRole) + '18',
                            }}>
                              {msg.senderRole}
                            </span>
                          </div>
                        )}

                        {/* Bubble */}
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: isOwn
                            ? '14px 14px 4px 14px'
                            : '14px 14px 14px 4px',
                          background: isOwn
                            ? 'var(--primary)'
                            : 'var(--input-bg)',
                          color: isOwn
                            ? 'var(--white)'
                            : 'var(--text)',
                          fontSize: 14,
                          lineHeight: 1.5,
                          wordBreak: 'break-word',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                          transition: 'transform 0.15s ease',
                        }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.01)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          {msg.content}
                        </div>

                        {/* Timestamp */}
                        <span style={{
                          fontSize: 10,
                          color: 'var(--text-light)',
                          marginTop: 2,
                          padding: '0 4px',
                        }}>
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

          {/* ── Input area ── */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
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
                flex: 1,
                padding: '10px 16px',
                borderRadius: 12,
                border: '2px solid var(--border)',
                background: 'var(--input-bg)',
                color: 'var(--text)',
                fontSize: 14,
                lineHeight: 1.5,
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                maxHeight: 120,
                minHeight: 42,
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || sending}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                border: 'none',
                background: inputText.trim() && !sending
                  ? 'var(--primary)'
                  : 'var(--border)',
                color: inputText.trim() && !sending
                  ? 'var(--white)'
                  : 'var(--text-light)',
                cursor: inputText.trim() && !sending ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (inputText.trim() && !sending) {
                  e.currentTarget.style.background = 'var(--primary-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (inputText.trim() && !sending) {
                  e.currentTarget.style.background = 'var(--primary)';
                }
              }}
              title="Enviar mensaje"
            >
              {sending ? (
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send size={20} style={{ transform: 'rotate(-45deg)' }} />
              )}
            </button>
          </div>
        </div>

        {/* ── Online members sidebar ── */}
        <div style={{
          width: showMembers ? 260 : 0,
          opacity: showMembers ? 1 : 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <div style={{
            width: 260,
            height: '100%',
            background: 'var(--white)',
            borderRadius: 16,
            boxShadow: 'var(--shadow)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Sidebar header */}
            <div style={{
              padding: '16px 16px 12px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} color="var(--primary)" />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  En línea
                </span>
              </div>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--white)',
                background: 'var(--success)',
                borderRadius: 'var(--radius-full)',
                padding: '2px 8px',
                minWidth: 22,
                textAlign: 'center',
              }}>
                {onlineCount}
              </span>
            </div>

            {/* Members list */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px 0',
            }}>
              {onlineMembersArray.length === 0 ? (
                <div style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 13, color: 'var(--text-light)' }}>
                    No hay administradores del landingpage en línea
                  </p>
                </div>
              ) : (
                onlineMembersArray.map((member) => {
                  const isCurrentUser = member.id === user?.id;
                  const memberName = member.name || member.username || 'Admin';
                  const memberRole = member.role || 'admin';

                  return (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 16px',
                        transition: 'background 0.15s ease',
                        background: isCurrentUser ? 'var(--primary-light)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrentUser) {
                          e.currentTarget.style.background = 'var(--input-bg)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrentUser) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {/* Online indicator + avatar */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: getRoleBadgeColor(memberRole),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--white)',
                        }}>
                          {getInitials(memberName)}
                        </div>
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: 'var(--success)',
                          border: '2px solid var(--white)',
                        }} />
                      </div>

                      {/* Name + role */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text)',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {memberName}
                          {isCurrentUser && (
                            <span style={{ color: 'var(--text-light)', fontWeight: 400 }}> (Tú)</span>
                          )}
                        </p>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: getRoleBadgeColor(memberRole),
                        }}>
                          {memberRole}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Responsive styles ── */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .admin-chat-members-sidebar {
            position: fixed !important;
            right: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            z-index: 500 !important;
            border-radius: 0 !important;
            box-shadow: -8px 0 30px rgba(0,0,0,0.15) !important;
          }
        }

        /* Custom scrollbar for messages */
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: var(--text-light);
        }
      `}</style>
    </div>
  );
}
