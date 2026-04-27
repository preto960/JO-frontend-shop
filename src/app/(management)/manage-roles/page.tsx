'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Shield, ShieldCheck, ShieldOff } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';
import { showToast } from '@/lib/utils';

const MODULES = ['dashboard', 'products', 'categories', 'orders', 'stores', 'users', 'roles'];

const styles = {
  overlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(26,29,41,0.6)',
    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 16,
  },
  modal: {
    background: '#FFFFFF', borderRadius: 20, padding: 28,
    maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto' as const,
    boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
  },
  newBtn: {
    padding: '10px 20px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #FF6B35, #FF8C5E)',
    color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: '0 4px 15px rgba(255,107,53,0.35)',
    transition: 'all 0.2s ease',
  },
  editBtn: {
    width: 34, height: 34, borderRadius: '50%' as const, border: 'none',
    background: '#E8F1FF', color: '#54A0FF', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  deleteBtn: {
    width: 34, height: 34, borderRadius: '50%' as const, border: 'none',
    background: '#FFE8E8', color: '#FF6B6B', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  saveBtn: {
    padding: '10px 20px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #FF6B35, #FF8C5E)',
    color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14,
    boxShadow: '0 4px 15px rgba(255,107,53,0.35)',
    transition: 'all 0.2s ease',
  },
  cancelBtn: {
    padding: '10px 20px', borderRadius: 10,
    border: '2px solid var(--border)', background: '#FFFFFF',
    color: 'var(--text)', cursor: 'pointer', fontSize: 14,
    transition: 'all 0.2s ease',
  },
};

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
      const res = await api.get('/auth/roles');
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
        await api.put(`/auth/roles/${editingRole.id}`, payload);
        showToast('Rol actualizado', 'success');
      } else {
        await api.post('/auth/roles', payload);
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
      await api.delete(`/auth/roles/${deleteModal.id}`);
      showToast('Rol eliminado', 'success');
      fetchRoles();
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar', 'error');
    } finally {
      setDeleteModal(null);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Roles y Permisos</h1>
        <button
          onClick={openCreate}
          style={styles.newBtn}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(255,107,53,0.45)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 15px rgba(255,107,53,0.35)'; }}
        >
          <Plus size={18} /> Nuevo rol
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid var(--border)', borderTopColor: '#FF6B35',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
        </div>
      ) : roles.length === 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 48, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>🛡️</p>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>No hay roles personalizados</p>
          <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>Crea roles para gestionar los permisos de tu equipo</p>
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
              <div
                key={role.id} className="animate-fade-in"
                style={{
                  background: '#FFFFFF', borderRadius: 14, padding: 18,
                  boxShadow: 'var(--shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, background: '#FFF0E9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B35',
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
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => openEdit(role)} style={styles.editBtn}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLElement).style.background = '#54A0FF'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.background = '#E8F1FF'; (e.currentTarget as HTMLElement).style.color = '#54A0FF'; }}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteModal(role)} style={styles.deleteBtn}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLElement).style.background = '#FF6B6B'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.background = '#FFE8E8'; (e.currentTarget as HTMLElement).style.color = '#FF6B6B'; }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <div
        style={{ ...styles.overlay, display: modalOpen ? 'flex' : 'none' }}
        onClick={() => setModalOpen(false)}
      >
        <div className="animate-fade-in" onClick={(e) => e.stopPropagation()} style={styles.modal}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{editingRole ? 'Editar rol' : 'Nuevo rol'}</h2>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Nombre *</label>
              <input
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre del rol"
                style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Descripción</label>
              <input
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripción del rol"
                style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
              />
            </div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--text)' }}>Permisos</h3>
          <div style={{ background: '#FFFFFF', borderRadius: 14, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--input-bg)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Módulo</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Ver</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Crear</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Editar</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((mod) => (
                    <tr key={mod} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 500, textTransform: 'capitalize', color: 'var(--text)' }}>{mod}</td>
                      {(['canView', 'canCreate', 'canEdit', 'canDelete'] as const).map((action) => {
                        const isActive = form.permissions[mod]?.[action];
                        return (
                          <td key={action} style={{ padding: '8px 8px', textAlign: 'center' }}>
                            <button
                              onClick={() => togglePermission(mod, action)}
                              style={{
                                width: 32, height: 32, borderRadius: '50%', border: 'none',
                                background: isActive ? '#00B894' : 'var(--input-bg)',
                                color: isActive ? 'white' : 'var(--text-light)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                boxShadow: isActive ? '0 2px 8px rgba(0,184,148,0.3)' : 'none',
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                            >
                              {isActive ? <ShieldCheck size={15} /> : <ShieldOff size={15} />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button onClick={() => setModalOpen(false)} style={styles.cancelBtn}>Cancelar</button>
            <button
              onClick={handleSave} disabled={saving}
              style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1, background: saving ? '#FDCB6E' : styles.saveBtn.background }}
            >
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
