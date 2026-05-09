'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePusher } from '@/contexts/PusherContext';
import { getInitials } from '@/lib/utils';

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
  const [showMembers, setShowMembers] = useState(false);
  const channelRef = useRef<any>(null);
  const hasSubscribed = useRef(false);

  // Build online members list (from other platforms, not self)
  const allOnlineMembers: OnlineMember[] = Array.from(adminOnlineMembers.entries())
    .filter(([id, info]) => info?.platform !== 'frontend-shop')
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
    <div style={{ padding: '24px', height: 'calc(100dvh - 110px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Header (compact single line) ── */}
      <div style={{
        background: 'var(--white)',
        borderRadius: 12,
        padding: '10px 20px',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MessageCircle size={18} color="var(--primary)" />
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
            padding: '6px 12px',
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
      <div style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden', minHeight: 0 }}>
        {/* Members list */}
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
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {allOnlineMembers.length === 0 ? (
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
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Users size={28} color="var(--primary)" style={{ opacity: 0.5 }} />
                </div>
                <p style={{
                  fontSize: 14,
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  fontWeight: 500,
                }}>
                  No hay administradores de otras plataformas en línea
                </p>
                <p style={{
                  fontSize: 12,
                  color: 'var(--text-light)',
                  textAlign: 'center',
                }}>
                  Los administradores conectados desde landingpage o las apps aparecerán aquí
                </p>
              </div>
            ) : (
              allOnlineMembers.map((member) => {
                const memberName = member.name || member.email || 'Admin';
                const memberPlatform = member.platform || 'unknown';
                const platformLabel = getPlatformLabel(memberPlatform);
                const platformColor = getPlatformColor(memberPlatform);

                return (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 20px',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Avatar with online indicator */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: platformColor + '18',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        color: platformColor,
                      }}>
                        {getInitials(memberName)}
                      </div>
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 11,
                        height: 11,
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
                  </div>
                );
              })
            )}
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
            borderRadius: 12,
            boxShadow: 'var(--shadow)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Sidebar header */}
            <div style={{
              padding: '14px 16px 10px',
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
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
              {allOnlineMembers.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
                    No hay administradores de otras plataformas en línea
                  </p>
                </div>
              ) : (
                allOnlineMembers.map((member) => {
                  const memberName = member.name || member.email || 'Admin';
                  const memberPlatform = member.platform || 'unknown';
                  const platformColor = getPlatformColor(memberPlatform);

                  return (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 16px',
                      }}>
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
