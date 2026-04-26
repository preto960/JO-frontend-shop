'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import ConfirmModal from '@/components/ConfirmModal';
import { getRoleLabel, getRoleBadgeColor, getInitials, showToast, debounce } from '@/lib/utils';

export default function AdminUsersPage() {
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
      let url = '/users';
      if (search) url += `?search=${encodeURIComponent(search)}`;
      const res = await api.get(url);
      setUsers(extractData(res));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
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
        await api.put(`/users/${editingUser.id}`, payload);
        showToast('Usuario actualizado', 'success');
      } else {
        await api.post('/users', payload);
        showToast('Usuario creado', 'success');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.delete(`/users/${deleteModal.id}`);
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
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Usuarios</h1>
        <button onClick={openCreate} style={{
          padding: '10px 20px', borderRadius: 8, background: 'var(--accent)',
          color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Plus size={18} /> Nuevo usuario
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          type="text" placeholder="Buscar usuarios..." defaultValue={search}
          onChange={(e) => debouncedSearch(e.target.value)}
          style={{ paddingLeft: 40, paddingRight: 16, background: 'var(--white)', borderRadius: 10, height: 44 }}
        />
      </div>

      {/* Users list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : users.length === 0 ? (
        <div style={{ background: 'var(--white)', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>👥</p>
          <p style={{ color: 'var(--text-secondary)' }}>No hay usuarios</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {users.map((user: any) => (
            <div key={user.id} className="animate-fade-in" style={{
              background: 'var(--white)', borderRadius: 12, padding: 16,
              boxShadow: 'var(--shadow)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: getRoleBadgeColor(user.role),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 16, fontWeight: 600, flexShrink: 0,
                  }}>
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{user.name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user.email}</p>
                    <span style={{
                      display: 'inline-block', marginTop: 4, padding: '2px 10px', borderRadius: 10,
                      fontSize: 11, fontWeight: 600,
                      background: getRoleBadgeColor(user.role) + '20',
                      color: getRoleBadgeColor(user.role),
                    }}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>
                {currentUser?.id !== user.id && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openEdit(user)} style={{
                      width: 32, height: 32, borderRadius: 6, border: 'none',
                      background: '#3498DB15', color: '#3498DB', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteModal(user)} style={{
                      width: 32, height: 32, borderRadius: 6, border: 'none',
                      background: '#E9456015', color: '#E94560', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: modalOpen ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }} onClick={() => setModalOpen(false)}>
        <div className="animate-fade-in" onClick={(e) => e.stopPropagation()} style={{
          background: 'var(--white)', borderRadius: 16, padding: 24,
          maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</h2>
            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Nombre *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Correo electrónico *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" disabled={!!editingUser} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Contraseña {editingUser ? '(dejar vacío para no cambiar)' : '*'}
              </label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>

            {/* Role selection */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Rol</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {userRoles.map((role) => (
                  <label
                    key={role}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                      borderRadius: 8, border: `2px solid ${form.role === role ? getRoleBadgeColor(role) : 'var(--border)'}`,
                      background: form.role === role ? getRoleBadgeColor(role) + '10' : 'var(--white)',
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
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Tiendas asignadas</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {stores.map((store: any) => (
                    <label
                      key={store.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                        borderRadius: 8, border: `1px solid ${form.storeIds.includes(store.id) ? 'var(--accent)' : 'var(--border)'}`,
                        background: form.storeIds.includes(store.id) ? 'var(--accent)10' : 'var(--white)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.storeIds.includes(store.id)}
                        onChange={() => toggleStore(store.id)}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: 18, height: 18, borderRadius: 4,
                        border: `2px solid ${form.storeIds.includes(store.id) ? 'var(--accent)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: form.storeIds.includes(store.id) ? 'var(--accent)' : 'transparent',
                      }}>
                        {form.storeIds.includes(store.id) && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                        )}
                      </div>
                      <span style={{ fontSize: 13 }}>{store.name || store.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={() => setModalOpen(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--white)', color: 'var(--text)', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600,
            }}>
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
