// frontend/src/components/admin/PermissionManager.tsx
import React, { useEffect, useState } from 'react';
import { fetchAllPermissions, grantUserPermissions, revokePermission, fetchProjectsAndModulesForUser } from '../../services/projectService';
import { fetchAllUsers } from '../../services/authService';
import { AppUser, MasterType, UserPermission } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Toast } from '../common/Toast';
import { ShieldCheck, UserCheck, Trash2, CheckCircle2, Loader2 } from 'lucide-react';

export const PermissionManager: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [projects, setProjects] = useState<string[]>([]);

  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<MasterType[]>([
    'Material Master',
    'Vendor Master',
    'Customer Master'
  ]);

  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const allUsers = await fetchAllUsers();
    const standardUsers = allUsers.filter((u) => u.role === 'User');
    setUsers(standardUsers);

    if (standardUsers.length > 0 && !selectedUser) {
      setSelectedUser(standardUsers[0].id);
    }

    const { projects } = await fetchProjectsAndModulesForUser('', 'Admin');
    setProjects(projects);

    const { permissions, userMap } = await fetchAllPermissions();
    setPermissions(permissions);
    setUserMap(userMap);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleProject = (p: string) => {
    setSelectedProjects((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const handleToggleModule = (m: MasterType) => {
    setSelectedModules((prev) =>
      prev.includes(m) ? prev.filter((item) => item !== m) : [...prev, m]
    );
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setToast({ type: 'error', msg: 'Please select a User.' });
      return;
    }
    if (selectedProjects.length === 0) {
      setToast({ type: 'error', msg: 'Please select at least one Project Space.' });
      return;
    }
    if (selectedModules.length === 0) {
      setToast({ type: 'error', msg: 'Please select at least one Master Data Module.' });
      return;
    }

    const count = await grantUserPermissions(selectedUser, selectedProjects, selectedModules);
    setToast({
      type: 'success',
      msg: `Successfully assigned ${count} permission mapping(s)!`
    });
    loadData();
  };

  const handleRevoke = async (id: string) => {
    const ok = await revokePermission(id);
    if (ok) {
      setToast({ type: 'success', msg: 'Permission revoked successfully!' });
      loadData();
    } else {
      setToast({ type: 'error', msg: 'Failed to revoke permission.' });
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.msg} onClose={() => setToast(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grant Permission Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Grant Access Permissions</h3>
          </div>

          {users.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No Standard Users found to assign permissions.</p>
          ) : (
            <form onSubmit={handleGrantAccess} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select User Account
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      👤 {u.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Project Spaces (Multiple allowed)
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-300 rounded-lg">
                  {projects.map((p) => (
                    <label key={p} className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProjects.includes(p)}
                        onChange={() => handleToggleProject(p)}
                        className="w-3.5 h-3.5 text-blue-600 rounded"
                      />
                      <span>📁 {p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Master Data Modules
                </label>
                <div className="space-y-1.5 p-2 bg-slate-50 border border-slate-300 rounded-lg">
                  {(['Material Master', 'Vendor Master', 'Customer Master'] as MasterType[]).map((m) => (
                    <label key={m} className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedModules.includes(m)}
                        onChange={() => handleToggleModule(m)}
                        className="w-3.5 h-3.5 text-blue-600 rounded"
                      />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
              >
                Grant Selected Permissions
              </button>
            </form>
          )}
        </div>

        {/* Existing Permissions Table */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Current RBAC Permission Mappings ({permissions.length})
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Project Space</th>
                    <th className="py-3 px-4">Master Module</th>
                    <th className="py-3 px-4 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                        Loading permissions...
                      </td>
                    </tr>
                  ) : permissions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                        No active permission mappings found.
                      </td>
                    </tr>
                  ) : (
                    permissions.map((perm) => (
                      <tr key={perm.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          👤 {userMap[perm.user_id] || 'User'}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          📁 {perm.project_name}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge type="module" value={perm.master_type} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleRevoke(perm.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Revoke Permission"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
