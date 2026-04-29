'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Shield, ShieldCheck, ShieldOff, Users } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';
import { showToast } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════
   Roles & Permissions Management
   Matches the mobile app logic:
     - GET /auth/roles → roles with embedded permissions
     - GET /auth/permissions → all available permissions
     - PUT /auth/roles/{id} → { permissionIds: [1,2,3] }
   ═══════════════════════════════════════════════════════════════ */

const moduleLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  products: 'Productos',
  categories: 'Categorías',
  orders: 'Pedidos',
  delivery: 'Delivery',
  stores: 'Tiendas',
  users: 'Usuarios',
  roles: 'Roles',
};

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
    background: 'var(--primary-gradient)',
    color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: 'var(--shadow-accent)',
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
    background: 'var(--primary-gradient)',
    color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14,
    boxShadow: 'var(--shadow-accent)',
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
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [togglingPerm, setTogglingPerm] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/auth/roles'),
        api.get('/auth/permissions'),
      ]);

      // Extract roles array
      const extractedRoles = extractData(rolesRes);
      setRoles(Array.isArray(extractedRoles) ? extractedRoles : []);

      // Extract permissions from { permissions: [...] } or direct array
      let perms: any[] = [];
      if (Array.isArray(permsRes)) {
        perms = permsRes;
      } else if (permsRes?.permissions && Array.isArray(permsRes.permissions)) {
        perms = permsRes.permissions;
      } else if (permsRes?.data && Array.isArray(permsRes.data)) {
        perms = permsRes.data;
      } else {
        perms = extractData(permsRes);
      }
      setAllPermissions(perms);
    } catch (err: any) {
      console.error('Error loading roles:', err);
      showToast('Error al cargar roles', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Group permissions by module
  const getGroupedPermissions = useCallback(() => {
    const grouped: Record<string, any[]> = {};
    for (const perm of allPermissions) {
      const mod = perm.module || 'other';
      if (!grouped[mod]) grouped[mod] = [];
      grouped[mod].push(perm);
    }
    return grouped;
  }, [allPermissions]);

  // Count active permissions for a role
  const getPermCount = (role: any) => {
    const perms = role.permissions;
    if (!perms || !Array.isArray(perms)) return 0;
    return perms.length;
  };

  // Check if a permission is assigned to the selected role
  const isPermAssigned = (permId: number) => {
    if (!selectedRole?.permissions) return false;
    return selectedRole.permissions.some((rp: any) => rp.permissionId === permId);
  };

  // Toggle a permission on the selected role (immediate save like the app)
  const togglePermission = async (permId: number) => {
    if (!selectedRole) return;
    setTogglingPerm(permId);
    try {
      const currentIds = selectedRole.permissions.map((rp: any) => rp.permissionId);
      const newIds = currentIds.includes(permId)
        ? currentIds.filter((id: number) => id !== permId)
        : [...currentIds, permId];

      await api.put(`/auth/roles/${selectedRole.id}`, { permissionIds: newIds });

      // Update local state optimistically
      setSelectedRole((prev: any) => ({
        ...prev,
        permissions: newIds.map((id: number) => {
          // Preserve existing permission objects, create new ones for added
          const existing = prev.permissions.find((rp: any) => rp.permissionId === id);
          if (existing) return existing;
          const permInfo = allPermissions.find((p: any) => p.id === id);
          return {
            permissionId: id,
            permission: permInfo || { id, name: `Perm ${id}`, code: `perm.${id}`, module: 'other' },
          };
        }),
      }));

      // Also update the roles list
      setRoles((prev: any[]) => prev.map((r: any) => {
        if (r.id !== selectedRole.id) return r;
        return {
          ...r,
          permissions: newIds.map((id: number) => {
            const existing = r.permissions?.find((rp: any) => rp.permissionId === id);
            if (existing) return existing;
            const permInfo = allPermissions.find((p: any) => p.id === id);
            return {
              permissionId: id,
              permission: permInfo || { id, name: `Perm ${id}`, code: `perm.${id}`, module: 'other' },
            };
          }),
        };
      }));

      showToast('Permiso actualizado', 'success');
    } catch (err: any) {
      console.error('Error toggling permission:', err);
      showToast(err?.message || 'Error al actualizar permiso', 'error');
    } finally {
      setTogglingPerm(null);
    }
  };

  // Create or edit role (name/description only)
  const openCreate = () => {
    setEditingRole(null);
    setForm({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (role: any) => {
    setEditingRole(role);
    setForm({ name: role.name || '', description: role.description || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name, description: form.description };
      if (editingRole) {
        await api.put(`/auth/roles/${editingRole.id}`, payload);
        showToast('Rol actualizado', 'success');
      } else {
        await api.post('/auth/roles', payload);
        showToast('Rol creado', 'success');
      }
      setModalOpen(false);
      loadData();
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
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar', 'error');
    } finally {
      setDeleteModal(null);
    }
  };

  const openDetail = (role: any) => {
    setSelectedRole(role);
    setDetailOpen(true);
  };

  const groupedPerms = getGroupedPermissions();
  const moduleKeys = Object.keys(groupedPerms);

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Roles y Permisos</h1>
        <button
          onClick={openCreate}
          style={styles.newBtn}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-accent)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-accent)'; }}
        >
          <Plus size={18} /> Nuevo rol
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid var(--border)', borderTopColor: 'var(--primary)',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
        </div>
      ) : roles.length === 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 48, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Shield size={28} color="var(--primary)" />
          </div>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>No hay roles personalizados</p>
          <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>Crea roles para gestionar los permisos de tu equipo</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {roles.map((role: any) => {
            const permCount = getPermCount(role);
            const userCount = role._count?.users || 0;

            return (
              <div
                key={role.id} className="animate-fade-in"
                style={{
                  background: '#FFFFFF', borderRadius: 14, padding: 18,
                  boxShadow: 'var(--shadow)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}
                    onClick={() => openDetail(role)}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, background: 'var(--primary-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
                      flexShrink: 0,
                    }}>
                      <Shield size={24} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{role.name}</h3>
                      {role.description && (
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {role.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ShieldCheck size={12} /> {permCount} permiso(s)
                        </span>
                        {userCount > 0 && (
                          <span style={{ fontSize: 12, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={12} /> {userCount} usuario(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); openDetail(role); }}
                      style={{
                        ...styles.editBtn,
                        background: 'var(--primary-light)', color: 'var(--primary)',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLElement).style.background = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.background = 'var(--primary-light)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)'; }}
                      title="Gestionar permisos"
                    >
                      <ShieldCheck size={15} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(role); }}
                      style={styles.editBtn}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLElement).style.background = '#54A0FF'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.background = '#E8F1FF'; (e.currentTarget as HTMLElement).style.color = '#54A0FF'; }}
                      title="Editar rol"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteModal(role); }}
                      style={styles.deleteBtn}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLElement).style.background = '#FF6B6B'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.background = '#FFE8E8'; (e.currentTarget as HTMLElement).style.color = '#FF6B6B'; }}
                      title="Eliminar rol"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          CREATE/EDIT ROLE MODAL (name + description only)
         ═══════════════════════════════════════════ */}
      <div
        style={{ ...styles.overlay, display: modalOpen ? 'flex' : 'none' }}
        onClick={() => setModalOpen(false)}
      >
        <div className="animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ ...styles.modal, maxWidth: 440 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{editingRole ? 'Editar rol' : 'Nuevo rol'}</h2>
            <button
              onClick={() => setModalOpen(false)}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: 'var(--input-bg)', color: 'var(--text-secondary)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
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

      {/* ═══════════════════════════════════════════
          PERMISSIONS DETAIL MODAL (like the mobile app)
         ═══════════════════════════════════════════ */}
      <div
        style={{ ...styles.overlay, display: detailOpen ? 'flex' : 'none' }}
        onClick={() => setDetailOpen(false)}
      >
        <div className="animate-fade-in" onClick={(e) => e.stopPropagation()} style={styles.modal}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
              }}>
                <Shield size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{selectedRole?.name}</h2>
                {selectedRole?.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{selectedRole.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setDetailOpen(false)}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: 'var(--input-bg)', color: 'var(--text-secondary)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 20 }}>
            Activa o desactiva permisos. Los cambios se guardan automáticamente.
          </p>

          {/* Permissions grouped by module */}
          {allPermissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Cargando permisos...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {moduleKeys.map((mod) => (
                <div key={mod} style={{
                  background: 'var(--input-bg)', borderRadius: 12,
                  overflow: 'hidden',
                }}>
                  {/* Module header */}
                  <div style={{
                    padding: '10px 16px',
                    fontSize: 13, fontWeight: 700, color: 'var(--text)',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    {moduleLabels[mod] || mod}
                  </div>

                  {/* Permission rows */}
                  {groupedPerms[mod].map((perm: any) => {
                    const assigned = isPermAssigned(perm.id);
                    const isToggling = togglingPerm === perm.id;

                    return (
                      <div
                        key={perm.id}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 16px',
                          borderBottom: groupedPerms[mod].indexOf(perm) < groupedPerms[mod].length - 1
                            ? '1px solid var(--border)' : 'none',
                          background: assigned ? '#E8FBF5' : 'transparent',
                          transition: 'background 0.2s ease',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                            {perm.name || perm.code}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 1 }}>
                            {perm.code}
                          </p>
                        </div>
                        <button
                          onClick={() => togglePermission(perm.id)}
                          disabled={isToggling}
                          style={{
                            width: 40, height: 24, borderRadius: 12, border: 'none',
                            background: assigned ? '#00B894' : '#DFE4EA',
                            cursor: 'pointer', position: 'relative',
                            transition: 'all 0.25s ease',
                            opacity: isToggling ? 0.6 : 1,
                            flexShrink: 0, marginLeft: 12,
                          }}
                        >
                          {/* Toggle knob */}
                          <div style={{
                            position: 'absolute',
                            top: 2,
                            left: assigned ? 20 : 2,
                            width: 20, height: 20,
                            borderRadius: '50%',
                            background: '#FFFFFF',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            transition: 'left 0.25s ease',
                          }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={!!deleteModal}
        title="Eliminar rol"
        message={`¿Estás seguro de eliminar el rol "${deleteModal?.name || ''}"?`}
        confirmText="Eliminar"
        confirmColor="#FF6B6B"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  );
}
