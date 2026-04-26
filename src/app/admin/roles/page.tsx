'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Shield, ShieldCheck, ShieldOff } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';
import { showToast } from '@/lib/utils';

const MODULES = ['dashboard', 'products', 'categories', 'orders', 'stores', 'users', 'roles'];

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', permissions: {} as Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }> });

  const initPermissions = (existing?: any) => {
    const perms: any = {};
    MODULES.forEach(m => {
      perms[m] = {
        canView: existing?.[m]?.canView || false,
        canCreate: existing?.[m]?.canCreate || false,
        canEdit: existing?.[m]?.canEdit || false,
        canDelete: existing?.[m]?.canDelete || false,
      };
    });
    return perms;
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/roles');
      setRoles(extractData(res));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRoles(); }, []);

  const openCreate = () => {
    setEditingRole(null);
    setForm({ name: '', description: '', permissions: initPermissions() });
    setModalOpen(true);
  };

  const openEdit = (role: any) => {
    setEditingRole(role);
    setForm({
      name: role.name || '',
      description: role.description || '',
      permissions: initPermissions(role.permissions || role.permissions),
    });
    setModalOpen(true);
  };

  const togglePermission = (module: string, action: string) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: !prev.permissions[module][action as keyof typeof prev.permissions[typeof module]],
        },
      },
    }));
  };

  const handleSave = async () => {
    if (!form.name) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name, description: form.description, permissions: form.permissions };
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, payload);
        showToast('Rol actualizado', 'success');
      } else {
        await api.post('/roles', payload);
        showToast('Rol creado', 'success');
      }
      setModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.delete(`/roles/${deleteModal.id}`);
      showToast('Rol eliminado', 'success');
      fetchRoles();
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar', 'error');
    } finally {
      setDeleteModal(null);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Roles y Permisos</h1>
        <button onClick={openCreate} style={{
          padding: '10px 20px', borderRadius: 8, background: 'var(--accent)',
          color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Plus size={18} /> Nuevo rol
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : roles.length === 0 ? (
        <div style={{ background: 'var(--white)', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>🛡️</p>
          <p style={{ color: 'var(--text-secondary)' }}>No hay roles personalizados</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {roles.map((role: any) => {
            const perms = role.permissions || {};
            const totalPerms = MODULES.reduce((sum, m) => {
              const p = perms[m];
              if (!p) return sum;
              return sum + (p.canView ? 1 : 0) + (p.canCreate ? 1 : 0) + (p.canEdit ? 1 : 0) + (p.canDelete ? 1 : 0);
            }, 0);

            return (
              <div key={role.id} className="animate-fade-in" style={{
                background: 'var(--white)', borderRadius: 12, padding: 16,
                boxShadow: 'var(--shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, background: '#9B59B615',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9B59B6',
                  }}>
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{role.name}</h3>
                    {role.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{role.description}</p>}
                    <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
                      {totalPerms} permiso(s) activo(s)
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openEdit(role)} style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    background: '#3498DB15', color: '#3498DB', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setDeleteModal(role)} style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    background: '#E9456015', color: '#E94560', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
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
          maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editingRole ? 'Editar rol' : 'Nuevo rol'}</h2>
            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Nombre *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre del rol" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Descripción</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción del rol" />
            </div>
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>Permisos</h3>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Módulo</th>
                  <th style={{ textAlign: 'center', padding: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Ver</th>
                  <th style={{ textAlign: 'center', padding: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Crear</th>
                  <th style={{ textAlign: 'center', padding: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Editar</th>
                  <th style={{ textAlign: 'center', padding: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map((mod) => (
                  <tr key={mod} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 8, fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{mod}</td>
                    {(['canView', 'canCreate', 'canEdit', 'canDelete'] as const).map((action) => (
                      <td key={action} style={{ padding: 8, textAlign: 'center' }}>
                        <button
                          onClick={() => togglePermission(mod, action)}
                          style={{
                            width: 28, height: 28, borderRadius: 6, border: 'none',
                            background: form.permissions[mod]?.[action] ? 'var(--success)' : 'var(--input-bg)',
                            color: form.permissions[mod]?.[action] ? 'white' : 'var(--text-light)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {form.permissions[mod]?.[action] ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
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
        title="Eliminar rol"
        message={`¿Estás seguro de eliminar el rol "${deleteModal?.name || ''}"?`}
        confirmText="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  );
}
