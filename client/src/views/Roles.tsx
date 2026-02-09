import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Permission {
    slug: string;
    description: string;
}

interface Role {
    id: number;
    name: string;
    permissions: Permission[];
    _count?: { users: number };
}

export function Roles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({ name: '', permissions: [] as string[] });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setLoading(true);
            const [rRes, pRes] = await Promise.all([
                api.get('/api/roles'),
                api.get('/api/permissions')
            ]);
            console.log('Roles data:', rRes.data);
            console.log('Permissions data:', pRes.data);

            setRoles(Array.isArray(rRes.data) ? rRes.data : []);
            setAllPermissions(Array.isArray(pRes.data) ? pRes.data : []);
        } catch (err: any) {
            console.error('Fetch error:', err);
            setError(err?.response?.data?.error || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }

    function openCreateModal() {
        setEditingRole(null);
        setFormData({ name: '', permissions: [] });
        setIsModalOpen(true);
    }

    function openEditModal(role: Role) {
        setEditingRole(role);
        setFormData({
            name: role.name,
            permissions: (role.permissions || []).map(p => p.slug)
        });
        setIsModalOpen(true);
    }

    async function handleDelete(id: number) {
        if (!confirm('Are you sure you want to delete this role? This cannot be undone.')) return;
        try {
            await api.delete(`/api/roles/${id}`);
            fetchData();
        } catch (err: any) {
            alert(err?.response?.data?.error || 'Failed to delete role');
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingRole) {
                await api.patch(`/api/roles/${editingRole.id}`, formData);
            } else {
                await api.post('/api/roles', formData);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err: any) {
            alert(err?.response?.data?.error || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    }

    function togglePermission(slug: string) {
        setFormData(prev => {
            if (prev.permissions.includes(slug)) {
                return { ...prev, permissions: prev.permissions.filter(p => p !== slug) };
            } else {
                return { ...prev, permissions: [...prev.permissions, slug] };
            }
        });
    }

    // Group permissions by resource (prefix before colon)
    const groupedPermissions = allPermissions.reduce((acc, p) => {
        if (!p || !p.slug) return acc;
        const [resource] = p.slug.split(':');
        if (!acc[resource]) acc[resource] = [];
        acc[resource].push(p);
        return acc;
    }, {} as Record<string, Permission[]>);

    if (loading && roles.length === 0) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage user roles and their access levels.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md font-medium"
                >
                    Create Role
                </button>
            </div>

            {error && <div className="bg-rose-50 text-rose-600 p-4 rounded-md border border-rose-200">{error}</div>}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {roles.map(role => (
                    <div key={role.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold">{role.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {(role.permissions || []).length === 0 ? 'No permissions' :
                                        (role.permissions || []).length === allPermissions.length ? 'Full Access' :
                                            `${(role.permissions || []).length} permissions`}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openEditModal(role)}
                                    className="text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                                    title="Edit"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                </button>
                                {role.name !== 'admin' && (
                                    <button
                                        onClick={() => handleDelete(role.id)}
                                        className="text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                                        title="Delete"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-hidden relative">
                            {(role.permissions || []).slice(0, 10).map(p => (
                                <span key={p.slug} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-xs rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                    {p.slug}
                                </span>
                            ))}
                            {(role.permissions || []).length > 10 && (
                                <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-xs rounded text-slate-500 border border-slate-200 dark:border-slate-700">
                                    +{role.permissions.length - 10} more
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold">{editingRole ? 'Edit Role' : 'Create Role'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                            <div className="p-6 overflow-y-auto flex-1">
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-1">Role Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        disabled={editingRole?.name === 'admin'}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 disabled:opacity-60"
                                        placeholder="e.g. Supervisor"
                                    />
                                    {editingRole?.name === 'admin' && <p className="text-xs text-slate-500 mt-1">Admin role name cannot be changed.</p>}
                                </div>

                                <div className="space-y-6">
                                    <h3 className="font-medium border-b border-slate-200 dark:border-slate-700 pb-2">Permissions</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {Object.entries(groupedPermissions).map(([resource, perms]) => (
                                            <div key={resource}>
                                                <h4 className="font-medium text-sm text-slate-500 uppercase tracking-wider mb-2">{resource}</h4>
                                                <div className="space-y-2">
                                                    {perms.map(p => (
                                                        <label key={p.slug} className="flex items-start gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 rounded -ml-1">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.permissions.includes(p.slug)}
                                                                onChange={() => togglePermission(p.slug)}
                                                                className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <div className="text-sm">
                                                                <div className="font-medium">{p.slug}</div>
                                                                <div className="text-slate-500 text-xs">{p.description}</div>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950/50">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-60">
                                    {submitting ? 'Saving...' : 'Save Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
