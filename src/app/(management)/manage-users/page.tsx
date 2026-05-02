'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Edit2, Trash2, X, ArrowLeft } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import ConfirmModal from '@/components/ConfirmModal';
import { getRoleLabel, getRoleBadgeColor, getInitials, showToast, debounce } from '@/lib/utils';

const styles = {
  overlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(26,29,41,0.6)',
    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 16,
  },
  modal: {
    background: 'var(--card)', borderRadius: 20, padding: 28,
    maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' as const,
    boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
  },
  newBtn: {
    padding: '10px 20px', borderRadius: 10, border: 'none',
    background: 'var(--primary-gradient)',
    color: 'var(--white)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: 'var(--shadow-accent)',
    transition: 'all 0.2s ease',
  },
  searchInput: {
    paddingLeft: 40, paddingRight: 16, background: 'var(--card)',
    borderRadius: 10, height: 44, border: '1px solid var(--border)',
    boxShadow: 'var(--shadow)', fontSize: 14, color: 'var(--text)',
  },
  editBtn: {
    width: 34, height: 34, borderRadius: '50%' as const, border: 'none',
    background: 'var(--info-light)', color: 'var(--info)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  deleteBtn: {
    width: 34, height: 34, borderRadius: '50%' as const, border: 'none',
    background: 'var(--danger-light)', color: 'var(--danger)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  saveBtn: {
    padding: '10px 20px', borderRadius: 10, border: 'none',
    background: 'var(--primary-gradient)',
    color: 'var(--white)', cursor: 'pointer', fontWeight: 600, fontSize: 14,
    boxShadow: 'var(--shadow-accent)',
    transition: 'all 0.2s ease',
  },
  cancelBtn: {
    padding: '10px 20px', borderRadius: 10,
    border: '2px solid var(--border)', background: 'var(--card)',
    color: 'var(--text)', cursor: 'pointer', fontSize: 14,
    transition: 'all 0.2s ease',
  },
};

function PasswordCheck({ label, met }: { label: string; met: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: met ? 'var(--success)' : 'var(--border)', transition: 'all 0.2s ease', flexShrink: 0,
      }}>
        {met && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </div>
      <span style={{ color: met ? 'var(--success)' : 'var(--text-light)', fontWeight: met ? 600 : 400, transition: 'color 0.2s ease' }}>
        {label}
      </span>
    </div>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { isMultiStore } = useConfig();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'customer', storeIds: [] as string[],
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let url = '/auth/users';
      if (search) url += `?search=${encodeURIComponent(search)}`;
      const res = await api.get(url);
      setUsers(extractData(res));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/auth/roles');
      setRoles(extractData(res));
    } catch { /* ignore */ }
  };

  const fetchStores = async () => {
    if (!isMultiStore) return;
    try {
      const res = await api.get('/stores');
      setStores(extractData(res));
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchRoles(); fetchStores(); }, [isMultiStore]);
  useEffect(() => { fetchUsers(); }, [search]);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', role: 'customer', storeIds: [] });
    setModalOpen(true);
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'customer',
      storeIds: user.storeIds || user.stores?.map((s: any) => s.id) || [],
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      showToast('Nombre y correo son obligatorios', 'error');
      return;
    }
    if (!editingUser && !form.password) {
      showToast('La contraseña es obligatoria', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: any = { name: form.name, email: form.email, role: form.role };
      if (form.password) payload.password = form.password;
      if (form.storeIds.length > 0) payload.storeIds = form.storeIds;

      if (editingUser) {
        await api.put(`/auth/users/${editingUser.id}`, payload);
        showToast('Usuario actualizado', 'success');
      } else {
        await api.post('/auth/users', payload);
        showToast('Usuario creado', 'success');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      const errorMsg = err?.error || err?.message || 'Error al guardar';
      showToast(errorMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.delete(`/auth/users/${deleteModal.id}`);
      showToast('Usuario eliminado', 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar', 'error');
    } finally {
      setDeleteModal(null);
    }
  };

  const toggleStore = (storeId: string) => {
    setForm(prev => ({
      ...prev,
      storeIds: prev.storeIds.includes(storeId)
        ? prev.storeIds.filter((s: string) => s !== storeId)
        : [...prev.storeIds, storeId],
    }));
  };

  const debouncedSearch = React.useCallback(
    debounce((val: string) => setSearch(val), 400), []
  );

  const userRoles = ['admin', 'editor', 'delivery', 'customer'];

  return (
    <div style={{ padding: 24 }}>
      {/* Back button */}
      <button
        onClick={() => router.push('/settings')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500,
          marginBottom: 20, padding: 0, transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      >
        <ArrowLeft size={18} />
        Volver a Configuracion
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Usuarios</h1>
        <button
          onClick={openCreate}
          style={styles.newBtn}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-accent)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-accent)'; }}
        >
          <Plus size={18} /> Nuevo usuario
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
        <input
          type="text" placeholder="Buscar usuarios..." defaultValue={search}
          onChange={(e) => debouncedSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Users list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid var(--border)', borderTopColor: 'var(--primary)',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
        </div>
      ) : users.length === 0 ? (
        <div style={{ background: 'var(--card)', borderRadius: 14, padding: 48, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>👥</p>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>No hay usuarios</p>
          <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>Los usuarios aparecerán aquí cuando se registren</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {users.map((user: any) => (
            <div
              key={user.id} className="animate-fade-in"
              style={{
                background: 'var(--card)', borderRadius: 14, padding: 18,
                boxShadow: 'var(--shadow)', transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: '50%',
                    background: getRoleBadgeColor(user.role),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--white)', fontSize: 16, fontWeight: 600, flexShrink: 0,
                    boxShadow: `0 4px 12px ${getRoleBadgeColor(user.role)}40`,
                  }}>
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{user.name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{user.email}</p>
                    <span style={{
                      display: 'inline-block', marginTop: 6, padding: '3px 10px', borderRadius: 12,
                      fontSize: 11, fontWeight: 600,
                      background: getRoleBadgeColor(user.role) + '18',
                      color: getRoleBadgeColor(user.role),
                    }}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>
                {currentUser?.id !== user.id && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => openEdit(user)} style={styles.editBtn}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLElement).style.background = 'var(--info)'; (e.currentTarget as HTMLElement).style.color = 'var(--white)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.background = 'var(--info-light)'; (e.currentTarget as HTMLElement).style.color = 'var(--info)'; }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteModal(user)} style={styles.deleteBtn}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLElement).style.background = 'var(--danger)'; (e.currentTarget as HTMLElement).style.color = 'var(--white)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.background = 'var(--danger-light)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <div
        style={{ ...styles.overlay, display: modalOpen ? 'flex' : 'none' }}
        onClick={() => setModalOpen(false)}
      >
        <div className="animate-fade-in" onClick={(e) => e.stopPropagation()} style={styles.modal}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</h2>
            <button
              onClick={() => setModalOpen(false)}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: 'var(--input-bg)', color: 'var(--text-secondary)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Nombre *</label>
              <input
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre completo"
                style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: 'var(--card)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Correo electrónico *</label>
              <input
                type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="correo@ejemplo.com" disabled={!!editingUser}
                style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: editingUser ? 'var(--text-light)' : 'var(--text)', background: editingUser ? 'var(--input-bg)' : 'var(--card)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
                Contraseña {editingUser ? '(dejar vacío para no cambiar)' : '*'}
              </label>
              <input
                type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: 'var(--card)', outline: 'none' }}
              />
              {form.password && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <PasswordCheck label="Mínimo 6 caracteres" met={form.password.length >= 6} />
                  <PasswordCheck label="Al menos una mayúscula" met={/[A-Z]/.test(form.password)} />
                  <PasswordCheck label="Al menos un número" met={/[0-9]/.test(form.password)} />
                </div>
              )}
            </div>

            {/* Role selection */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text)' }}>Rol</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {userRoles.map((role) => (
                  <label
                    key={role}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                      borderRadius: 10, border: `2px solid ${form.role === role ? getRoleBadgeColor(role) : 'var(--border)'}`,
                      background: form.role === role ? getRoleBadgeColor(role) + '10' : 'var(--card)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="radio" name="role" value={role}
                      checked={form.role === role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%',
                      border: `2px solid ${form.role === role ? getRoleBadgeColor(role) : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {form.role === role && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: getRoleBadgeColor(role) }} />
                      )}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: form.role === role ? 600 : 400, color: getRoleBadgeColor(role) }}>
                      {getRoleLabel(role)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Store assignment */}
            {isMultiStore && stores.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text)' }}>Tiendas asignadas</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stores.map((store: any) => {
                    const isChecked = form.storeIds.includes(store.id);
                    return (
                      <label
                        key={store.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                          borderRadius: 10,
                          border: `2px solid ${isChecked ? 'var(--primary)' : 'var(--border)'}`,
                          background: isChecked ? 'var(--primary-light)' : 'var(--card)',
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStore(store.id)}
                          style={{ display: 'none' }}
                        />
                        <div style={{
                          width: 18, height: 18, borderRadius: 4,
                          border: `2px solid ${isChecked ? 'var(--primary)' : 'var(--border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isChecked ? 'var(--primary)' : 'transparent',
                        }}>
                          {isChecked && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                          )}
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>{store.name || store.nombre}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button onClick={() => setModalOpen(false)} style={styles.cancelBtn}>Cancelar</button>
            <button
              onClick={handleSave} disabled={saving}
              style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1, background: saving ? 'var(--warning)' : styles.saveBtn.background }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteModal}
        title="Eliminar usuario"
        message={`¿Estás seguro de eliminar al usuario "${deleteModal?.name || ''}"?`}
        confirmText="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  );
}
