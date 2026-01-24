import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { hasRole } from '../lib/auth';

export function Users() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetFor, setResetFor] = useState<{ id: number; username: string } | null>(null);
  const [newPass, setNewPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'staff'|'officer'>('staff');
  const [savingCreate, setSavingCreate] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/users');
      setRows(res.data?.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  if (!hasRole(['admin'])) {
    return <div className="text-sm text-slate-600 dark:text-slate-400">You do not have access to this page.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Users
      </div>
      <div>
        <button
          className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white"
          onClick={() => setCreateOpen(true)}
        >
          Add user
        </button>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-transparent">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="text-left px-3 py-2">ID</th>
              <th className="text-left px-3 py-2">Username</th>
              <th className="text-left px-3 py-2">Role</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-3 py-2">{u.id}</td>
                <td className="px-3 py-2">{u.username}</td>
                <td className="px-3 py-2">{u.Role?.name || u.role?.name || u.roleName || '-'}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 text-xs rounded ${u.disabled ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                    {u.disabled ? 'Disabled' : 'Active'}
                  </span>
                </td>
                <td className="px-3 py-2 flex gap-2">
                  <button
                    className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                    onClick={() => setResetFor({ id: u.id, username: u.username })}
                  >
                    Reset password
                  </button>
                  <button
                    className={`${u.disabled ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'} px-3 py-1 rounded`}
                    onClick={async () => {
                      try {
                        await api.patch(`/api/users/${u.id}/disabled`, { disabled: !u.disabled });
                        await loadUsers();
                      } catch (e: any) {
                        alert(e?.response?.data?.error || 'Failed to update status');
                      }
                    }}
                  >
                    {u.disabled ? 'Enable' : 'Disable'}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-slate-600 dark:text-slate-400" colSpan={4}>{loading ? 'Loading…' : 'No users'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {resetFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => { if (!saving) setResetFor(null); }} />
          <div className="relative bg-white border border-slate-200 rounded-lg p-4 z-10 w-[min(92vw,520px)] dark:bg-slate-900 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Reset password — {resetFor.username}</div>
              <button className="px-3 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" onClick={() => { if (!saving) setResetFor(null); }}>Close</button>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showReset ? 'text' : 'password'}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 pr-10 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                  placeholder="New password (min 6 chars)"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={() => setShowReset((v) => !v)}
                >
                  {showReset ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <button className="px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" onClick={() => { if (!saving) setResetFor(null); }}>Cancel</button>
                <button
                  className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-60"
                  disabled={saving || newPass.length < 6}
                  onClick={async () => {
                    if (!resetFor) return;
                    setSaving(true);
                    try {
                      await api.patch(`/api/users/${resetFor.id}/password`, { password: newPass });
                      setNewPass('');
                      setResetFor(null);
                    } catch (e: any) {
                      alert(e?.response?.data?.error || 'Failed to reset password');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => { if (!savingCreate) setCreateOpen(false); }} />
          <div className="relative bg-white border border-slate-200 rounded-lg p-4 z-10 w-[min(92vw,520px)] dark:bg-slate-900 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Add user</div>
              <button className="px-3 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" onClick={() => { if (!savingCreate) setCreateOpen(false); }}>Close</button>
            </div>
            <div className="space-y-3">
              <input
                className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                placeholder="Username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
              <div className="relative">
                <input
                  type={showCreate ? 'text' : 'password'}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 pr-10 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                  placeholder="Password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={() => setShowCreate((v) => !v)}
                >
                  {showCreate ? 'Hide' : 'Show'}
                </button>
              </div>
              <div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Role</div>
                <select
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded px-2 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                  value={newRole}
                  onChange={(e) => setNewRole((e.target.value as 'staff'|'officer') || 'staff')}
                >
                  <option value="staff">staff</option>
                  <option value="officer">officer</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button className="px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" onClick={() => { if (!savingCreate) setCreateOpen(false); }}>Cancel</button>
                <button
                  className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-60"
                  disabled={savingCreate || newUsername.trim().length < 3 || newPassword.length < 6}
                  onClick={async () => {
                    setSavingCreate(true);
                    try {
                      await api.post('/api/users', { username: newUsername.trim(), password: newPassword, role: newRole });
                      setNewUsername('');
                      setNewPassword('');
                      setNewRole('staff');
                      setCreateOpen(false);
                      await loadUsers();
                    } catch (e: any) {
                      alert(e?.response?.data?.error || 'Failed to create user');
                    } finally {
                      setSavingCreate(false);
                    }
                  }}
                >
                  {savingCreate ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
