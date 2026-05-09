'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Users, Circle, MessageCircle, X, Loader2, ArrowLeft, Search } from 'lucide-react';
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
  senderPlatform: string;
  recipientId: string | null;
  targetPlatform: string;
  createdAt: string;
}

interface OnlineMember {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  platform?: string;
}

export default function AdminChatPage() {
  const { user } = useAuth();
  const { pusher, isConnected, subscribeToAdminChat, adminOnlineMembers } = usePusher();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OnlineMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<any>(null);
  const hasSubscribed = useRef(false);
  const isNearBottomRef = useRef(true);

  // Build online members list (from other platforms, not self)
  const allOnlineMembers: OnlineMember[] = Array.from(adminOnlineMembers.entries())
    .filter(([id, info]) => id !== String(user?.id) && info?.platform !== 'frontend-shop')
    .map(([id, info]) => ({
      id,
      name: info?.name,
      email: info?.email,
      role: info?.role || 'admin',
      platform: info?.platform,
    }));

  const filteredMembers = allOnlineMembers.filter(m =>
    (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onlineCount = allOnlineMembers.length;

  // Fetch messages (filtered by recipient if one is selected)
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const params = selectedMember ? `?recipientId=${selectedMember.id}` : '';
      const res = await api.get(`/chats/admin/messages${params}`);
      const rawMsgs = res?.data || [];
      if (Array.isArray(rawMsgs)) {
        const msgs = rawMsgs.map((msg: any) => ({
          id: String(msg.id),
          content: msg.content,
          senderId: String(msg.senderId),
          senderName: msg.sender?.name || 'Admin',
          senderPlatform: msg.platform || 'unknown',
          recipientId: msg.recipientId ? String(msg.recipientId) : null,
          targetPlatform: msg.targetPlatform || 'all',
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
  }, [selectedMember]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Subscribe to presence channel + new-message events
  useEffect(() => {
    if (!pusher || !user || hasSubscribed.current) return;
    hasSubscribed.current = true;

    const channel = subscribeToAdminChat();
    if (!channel) return;
    channelRef.current = channel;

    // Listen for new messages
    channel.bind('new-message', (data: any) => {
      const newMsg: AdminMessage = {
        id: String(data.id),
        content: data.content,
        senderId: String(data.senderId),
        senderName: data.senderName || 'Admin',
        senderPlatform: data.senderPlatform || data.platform || 'unknown',
        recipientId: data.recipientId ? String(data.recipientId) : null,
        targetPlatform: data.targetPlatform || 'all',
        senderRole: 'admin',
        createdAt: data.createdAt,
      };

      // If no chat is selected, only show broadcast messages
      if (!selectedMember) {
        if (!newMsg.recipientId) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
        return;
      }

      // If a chat is selected, only show messages relevant to that conversation
      const isRelevant =
        // I sent this message to the selected member
        (newMsg.senderId === String(user?.id) && newMsg.recipientId === selectedMember.id) ||
        // The selected member sent this message to me
        (newMsg.senderId === selectedMember.id && (newMsg.recipientId === String(user?.id) || !newMsg.recipientId)) ||
        // I sent a broadcast message
        (newMsg.senderId === String(user?.id) && !newMsg.recipientId);

      if (isRelevant) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind('new-message');
      }
    };
  }, [pusher, user, subscribeToAdminChat, selectedMember]);

  // Select a member to chat with
  const openChat = (member: OnlineMember) => {
    setSelectedMember(member);
    setMessages([]);
    setInputText('');
  };

  // Go back to user list
  const closeChat = () => {
    setSelectedMember(null);
    setMessages([]);
    setInputText('');
  };

  // Send message
  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;
    const content = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      const body: any = { content };
      if (selectedMember) {
        body.recipientId = parseInt(selectedMember.id);
        body.targetPlatform = selectedMember.platform || 'all';
      }
      await api.post('/chats/admin/messages', body);
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
  }, [selectedMember]);

  // Auto-scroll to bottom on new messages only if user is near bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (!loading && selectedMember) {
      inputRef.current?.focus();
    }
  }, [loading, selectedMember]);

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

  const getPlatformLabel = (platform?: string) => {
    switch (platform) {
      case 'landingpage': return 'Landing';
      case 'frontend-shop': return 'Tienda';
      case 'app-shop': return 'App Shop';
      case 'app-delivery': return 'App Delivery';
      default: return '';
    }
  };

  const getPlatformColor = (platform?: string) => {
    switch (platform) {
      case 'landingpage': return '#C9A84C';
      case 'frontend-shop': return '#3b82f6';
      case 'app-shop': return '#22c55e';
      case 'app-delivery': return '#f97316';
      default: return 'var(--text-light)';
    }
  };

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
        >
          <Users size={16} />
          <span>{onlineCount}</span>
        </button>
      </div>

      {/* ── Main content area ── */}
      <div style={{ flex: 1, display: 'flex', gap: 16, overflow: 'hidden', minHeight: 0 }}>

        {/* ════════════════════════════════════════════════════════
            VIEW 1: USER LIST (no chat selected)
           ════════════════════════════════════════════════════════ */}
        {!selectedMember ? (
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
            {/* Search bar */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 12,
                border: '2px solid var(--border)',
                background: 'var(--input-bg)',
              }}>
                <Search size={16} color="var(--text-light)" />
                <input
                  type="text"
                  placeholder="Buscar administrador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    fontSize: 14,
                    color: 'var(--text)',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Members list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {filteredMembers.length === 0 ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: '60px 20px',
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
                    <Users size={32} color="var(--primary)" style={{ opacity: 0.5 }} />
                  </div>
                  <p style={{
                    fontSize: 15,
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    fontWeight: 500,
                  }}>
                    {searchTerm ? 'No se encontraron administradores' : 'No hay administradores de otras plataformas en línea'}
                  </p>
                  <p style={{
                    fontSize: 13,
                    color: 'var(--text-light)',
                    textAlign: 'center',
                  }}>
                    {searchTerm ? 'Intenta con otro término de búsqueda' : 'Los administradores conectados desde landingpage o las apps aparecerán aquí'}
                  </p>
                </div>
              ) : (
                filteredMembers.map((member) => {
                  const memberName = member.name || member.email || 'Admin';
                  const memberPlatform = member.platform || 'unknown';
                  const platformLabel = getPlatformLabel(memberPlatform);
                  const platformColor = getPlatformColor(memberPlatform);

                  return (
                    <div
                      key={member.id}
                      onClick={() => openChat(member)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '14px 20px',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--input-bg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Avatar with online indicator */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: 'var(--primary-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--primary)',
                        }}>
                          {getInitials(memberName)}
                        </div>
                        <div style={{
                          position: 'absolute',
                          bottom: 1,
                          right: 1,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: 'var(--success)',
                          border: '2px solid var(--white)',
                        }} />
                      </div>

                      {/* Name + platform */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--text)',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {memberName}
                        </p>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: platformColor,
                          padding: '1px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: platformColor + '18',
                        }}>
                          {platformLabel}
                        </span>
                      </div>

                      {/* Arrow */}
                      <div style={{
                        color: 'var(--text-light)',
                        fontSize: 18,
                        flexShrink: 0,
                      }}>
                        ›
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Broadcast messages section (if any) */}
            {!searchTerm && messages.length > 0 && (
              <div style={{
                borderTop: '1px solid var(--border)',
                maxHeight: 200,
                overflowY: 'auto',
              }}>
                <div style={{
                  padding: '8px 20px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Mensajes recientes (general)
                </div>
                {messages.slice(-5).map((msg) => (
                  <div key={msg.id} style={{
                    padding: '6px 20px',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                  }}>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: getPlatformColor(msg.senderPlatform),
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: getPlatformColor(msg.senderPlatform) + '18',
                      flexShrink: 0,
                    }}>
                      {msg.senderName.split(' ')[0]}
                    </span>
                    <span style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {msg.content}
                    </span>
                    <span style={{
                      fontSize: 10,
                      color: 'var(--text-light)',
                      flexShrink: 0,
                      marginLeft: 'auto',
                    }}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ════════════════════════════════════════════════════════
              VIEW 2: CHAT CONVERSATION (member selected)
             ════════════════════════════════════════════════════════ */
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
            {/* Chat header with back button */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <button
                onClick={closeChat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--input-bg)',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--input-bg)';
                }}
              >
                <ArrowLeft size={16} />
              </button>

              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--primary)',
                }}>
                  {getInitials(selectedMember.name || 'Admin')}
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

              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text)',
                  margin: 0,
                }}>
                  {selectedMember.name || selectedMember.email || 'Admin'}
                </p>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: getPlatformColor(selectedMember.platform),
                }}>
                  {getPlatformLabel(selectedMember.platform)} · En línea
                </span>
              </div>
            </div>

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
                    Inicia una conversación con {selectedMember.name || 'este administrador'}
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
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                                {msg.senderName}
                              </span>
                              <span style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: getPlatformColor(msg.senderPlatform),
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-full)',
                                background: getPlatformColor(msg.senderPlatform) + '18',
                              }}>
                                {getPlatformLabel(msg.senderPlatform)}
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
                          }}>
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
                placeholder={`Escribe un mensaje a ${selectedMember.name || 'admin'}...`}
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
        )}

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
              {allOnlineMembers.length === 0 ? (
                <div style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 13, color: 'var(--text-light)' }}>
                    No hay administradores de otras plataformas en línea
                  </p>
                </div>
              ) : (
                allOnlineMembers.map((member) => {
                  const memberName = member.name || member.email || 'Admin';
                  const memberPlatform = member.platform || 'unknown';
                  const isSelected = selectedMember?.id === member.id;

                  return (
                    <div
                      key={member.id}
                      onClick={() => openChat(member)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 16px',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                        background: isSelected ? 'var(--primary-light)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'var(--input-bg)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
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
                          background: getPlatformColor(memberPlatform) + '20',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          color: getPlatformColor(memberPlatform),
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

                      {/* Name + platform */}
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
                        </p>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: getPlatformColor(memberPlatform),
                        }}>
                          {getPlatformLabel(memberPlatform)}
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
