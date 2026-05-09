'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, MessageCircle, Send, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePusher } from '@/contexts/PusherContext';
import { getInitials } from '@/lib/utils';
import api from '@/lib/api';

interface OnlineMember {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  platform?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderPlatform: string;
  recipientId: string | null;
  targetPlatform: string;
  createdAt: string;
}

export default function AdminChatPage() {
  const { user } = useAuth();
  const { pusher, isConnected, subscribeToAdminChat, adminOnlineMembers } = usePusher();
  const [showMembers, setShowMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OnlineMember | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const channelRef = useRef<any>(null);
  const hasSubscribed = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const myUserId = String(user?.id || '');

  // Build online members list (from other platforms, not self)
  const allOnlineMembers: OnlineMember[] = Array.from(adminOnlineMembers.entries())
    .filter(([, info]) => info?.platform !== 'frontend-shop')
    .map(([id, info]) => ({
      id,
      name: info?.name,
      email: info?.email,
      role: info?.role || 'admin',
      platform: info?.platform,
    }));

  const onlineCount = allOnlineMembers.length;

  // Subscribe to presence channel (once)
  useEffect(() => {
    if (!pusher || !user || hasSubscribed.current) return;
    hasSubscribed.current = true;

    const channel = subscribeToAdminChat();
    if (!channel) return;
    channelRef.current = channel;
  }, [pusher, user, subscribeToAdminChat]);

  // Listen for new messages via Pusher (re-binds when selectedMember changes)
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;

    const handleNewMessage = (data: any) => {
      console.log('[AdminChat] Received new-message event:', data);
      if (!selectedMember) return;
      const numericSenderId = String(data.senderId);
      const numericRecipientId = data.recipientId ? String(data.recipientId) : null;
      const selectedNumericId = selectedMember.id.split('-')[0];
      const senderPlatform = data.senderPlatform || 'unknown';

      // Must match BOTH user ID, platform AND targetPlatform to isolate conversations
      const targetPlatform = data.targetPlatform || 'all';
      const isFromSelected =
        (numericSenderId === selectedNumericId && senderPlatform === selectedMember.platform && targetPlatform === 'frontend-shop') ||
        (numericSenderId === myUserId && senderPlatform === 'frontend-shop' && targetPlatform === selectedMember.platform);

      if (isFromSelected) {
        setMessages(prev => {
          if (prev.some(m => m.id === String(data.id))) return prev;
          return [...prev, {
            id: String(data.id),
            content: data.content,
            senderId: numericSenderId,
            senderName: data.senderName || 'Admin',
            senderPlatform: senderPlatform,
            recipientId: numericRecipientId,
            targetPlatform: data.targetPlatform || 'all',
            createdAt: data.createdAt,
          }];
        });
      }
    };

    channel.bind('new-message', handleNewMessage);
    return () => channel.unbind('new-message', handleNewMessage);
  }, [selectedMember, myUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when member selected
  useEffect(() => {
    if (selectedMember) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedMember]);

  // Extract numeric ID from composite ID (e.g., "1-landingpage" → 1)
  const getNumericId = (compositeId: string) => parseInt(compositeId.split('-')[0]);

  // Load messages for a selected member
  const loadMessages = useCallback(async (member: OnlineMember) => {
    const recipientId = getNumericId(member.id);
    if (isNaN(recipientId)) return;

    setLoadingMessages(true);
    try {
      const res: any = await api.get('/chats/admin/messages', {
        params: {
          recipientId,
          senderPlatform: 'frontend-shop',
          recipientPlatform: member.platform || 'all',
        },
      });
      const rawMessages = res.data || [];
      setMessages(rawMessages.map((msg: any) => ({
        id: String(msg.id),
        content: msg.content,
        senderId: String(msg.senderId),
        senderName: msg.sender?.name || 'Admin',
        senderPlatform: msg.platform || 'unknown',
        recipientId: msg.recipientId ? String(msg.recipientId) : null,
        targetPlatform: msg.targetPlatform || 'all',
        createdAt: msg.createdAt,
      })));
    } catch (err) {
      console.error('[AdminChat] Error loading messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Select a member → open chat
  const handleSelectMember = useCallback((member: OnlineMember) => {
    setSelectedMember(member);
    setMessages([]);
    loadMessages(member);
  }, [loadMessages]);

  // Close chat
  const handleCloseChat = useCallback(() => {
    setSelectedMember(null);
    setMessages([]);
    setNewMessage('');
  }, []);

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedMember || sendingMessage) return;

    const recipientId = getNumericId(selectedMember.id);
    if (isNaN(recipientId)) return;

    setSendingMessage(true);
    try {
      const res: any = await api.post('/chats/admin/messages', {
        content: newMessage.trim(),
        recipientId,
        targetPlatform: selectedMember.platform || 'all',
      });
      // Optimistic: add the sent message immediately so user sees it right away
      const savedMsg = res?.message || res?.data;
      if (savedMsg) {
        setMessages(prev => {
          if (prev.some(m => m.id === String(savedMsg.id))) return prev;
          return [...prev, {
            id: String(savedMsg.id),
            content: savedMsg.content,
            senderId: String(savedMsg.senderId),
            senderName: savedMsg.sender?.name || 'Admin',
            senderPlatform: savedMsg.platform || 'frontend-shop',
            recipientId: savedMsg.recipientId ? String(savedMsg.recipientId) : null,
            targetPlatform: savedMsg.targetPlatform || 'all',
            createdAt: savedMsg.createdAt,
          }];
        });
      }
      setNewMessage('');
    } catch (err) {
      console.error('[AdminChat] Error sending message:', err);
    } finally {
      setSendingMessage(false);
      inputRef.current?.focus();
    }
  }, [newMessage, selectedMember, sendingMessage]);

  // Keyboard send
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div style={{ padding: '16px 24px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Header (compact single line) ── */}
      <div style={{
        background: 'var(--white)',
        borderRadius: 12,
        padding: '8px 16px',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageCircle size={16} color="var(--primary)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
            Chat de Administradores
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isConnected ? 'var(--success)' : 'var(--text-light)',
              boxShadow: isConnected ? '0 0 5px rgba(46,204,113,0.5)' : 'none',
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

        <button
          onClick={() => setShowMembers(!showMembers)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 8,
            border: '2px solid var(--border)',
            background: showMembers ? 'var(--primary-light)' : 'var(--white)',
            color: showMembers ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
          }}
        >
          <Users size={14} />
          <span>{onlineCount}</span>
        </button>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', gap: 10, overflow: 'hidden', minHeight: 0 }}>
        {/* ── Left: Chat area (empty or conversation) ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--white)',
          borderRadius: 12,
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          {selectedMember ? (
            <>
              {/* Chat header */}
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: getPlatformColor(selectedMember.platform) + '18',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: getPlatformColor(selectedMember.platform),
                    }}>
                      {getInitials(selectedMember.name || 'Admin')}
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: -1,
                      right: -1,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: 'var(--success)',
                      border: '2px solid var(--white)',
                    }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                      {selectedMember.name || selectedMember.email || 'Admin'}
                    </p>
                    <span style={{ fontSize: 10, fontWeight: 600, color: getPlatformColor(selectedMember.platform) }}>
                      {getPlatformLabel(selectedMember.platform)} · En línea
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCloseChat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-light)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Messages area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {loadingMessages ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-light)' }}>Cargando mensajes...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <MessageCircle size={24} color="var(--text-light)" style={{ opacity: 0.4 }} />
                    <p style={{ fontSize: 13, color: 'var(--text-light)', margin: 0 }}>
                      Inicia la conversación
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === myUserId && msg.senderPlatform === 'frontend-shop';
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          justifyContent: isMine ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div style={{
                          maxWidth: '70%',
                          padding: '8px 12px',
                          borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          background: isMine ? 'var(--primary)' : 'var(--bg)',
                          color: isMine ? 'var(--white)' : 'var(--text)',
                          fontSize: 13,
                          lineHeight: 1.4,
                        }}>
                          <p style={{ margin: 0, wordBreak: 'break-word' }}>{msg.content}</p>
                          <p style={{
                            margin: '3px 0 0',
                            fontSize: 10,
                            opacity: 0.6,
                            textAlign: isMine ? 'right' : 'left',
                          }}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: 8,
                flexShrink: 0,
              }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje..."
                  style={{
                    flex: 1,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'inherit',
                    color: 'var(--text)',
                    background: 'var(--bg)',
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: 'none',
                    background: newMessage.trim() ? 'var(--primary)' : 'var(--border)',
                    color: newMessage.trim() ? 'var(--white)' : 'var(--text-light)',
                    cursor: newMessage.trim() ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            /* Empty state */
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MessageCircle size={24} color="var(--primary)" style={{ opacity: 0.4 }} />
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, fontWeight: 500, textAlign: 'center' }}>
                Selecciona un administrador para chatear
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-light)', margin: 0, textAlign: 'center' }}>
                Usa el botón de la esquina para ver los administradores conectados
              </p>
            </div>
          )}
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
            borderRadius: 12,
            boxShadow: 'var(--shadow)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Sidebar header */}
            <div style={{
              padding: '12px 14px 8px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={14} color="var(--primary)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  En línea
                </span>
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--white)',
                background: 'var(--success)',
                borderRadius: 'var(--radius-full)',
                padding: '2px 8px',
                minWidth: 20,
                textAlign: 'center',
              }}>
                {onlineCount}
              </span>
            </div>

            {/* Members list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
              {allOnlineMembers.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-light)', margin: 0 }}>
                    No hay administradores conectados
                  </p>
                </div>
              ) : (
                allOnlineMembers.map((member) => {
                  const memberName = member.name || member.email || 'Admin';
                  const memberPlatform = member.platform || 'unknown';
                  const platformColor = getPlatformColor(memberPlatform);
                  const isSelected = selectedMember?.id === member.id;

                  return (
                    <div
                      key={member.id}
                      onClick={() => handleSelectMember(member)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                        background: isSelected ? 'var(--primary-light)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                      }}
                    >
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: platformColor + '20',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: platformColor,
                        }}>
                          {getInitials(memberName)}
                        </div>
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 9,
                          height: 9,
                          borderRadius: '50%',
                          background: 'var(--success)',
                          border: '2px solid var(--white)',
                        }} />
                      </div>
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
                          color: platformColor,
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
    </div>
  );
}
