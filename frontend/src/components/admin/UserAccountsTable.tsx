// frontend/src/components/admin/UserAccountsTable.tsx
import React, { useEffect, useState } from 'react';
import { fetchAllUsers, updateUserStatus, resetUserPassword } from '../../services/authService';
import { AppUser } from '../../types';
import { DataGrid, ColumnDef } from '../common/DataGrid';
import { StatusBadge } from '../common/StatusBadge';
import { Toast } from '../common/Toast';
import { ShieldAlert, Lock, Unlock, KeyRound, Loader2 } from 'lucide-react';

export const UserAccountsTable: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [resetPwd, setResetPwd] = useState<string>('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const loadUsers = () => {
    setLoading(true);
    fetchAllUsers().then((data) => {
      setUsers(data);
      if (data.length > 0 && !selectedUser) {
        setSelectedUser(data[0].username);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleLock = async (username: string, currentLockedState: boolean) => {
    const newLockedState = !currentLockedState;
    const ok = await updateUserStatus(username, newLockedState);
    if (ok) {
      setToast({
        type: 'success',
        msg: `Account status for ${username} updated to ${newLockedState ? 'Locked' : 'Active'}.`
      });
      loadUsers();
    } else {
      setToast({ type: 'error', msg: 'Failed to update user status.' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !resetPwd.trim()) {
      setToast({ type: 'error', msg: 'Please enter a new password.' });
      return;
    }

    const ok = await resetUserPassword(selectedUser, resetPwd.trim());
    if (ok) {
      setToast({ type: 'success', msg: `Password reset successfully for ${selectedUser}!` });
      setResetPwd('');
    } else {
      setToast({ type: 'error', msg: 'Failed to reset password.' });
    }
  };

  const columns: ColumnDef<AppUser>[] = [
    { key: 'username', header: 'Username', sortable: true },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <StatusBadge type="role" value={row.role} />
    },
    {
      key: 'is_locked',
      header: 'Status',
      render: (row) => (
        <StatusBadge type="status" value={row.is_locked ? 'Locked' : 'Active'} />
      )
    },
    {
      key: 'created_at',
      header: 'Created At',
      render: (row) => (row.created_at ? new Date(row.created_at).toLocaleDateString() : '-')
    },
    {
      key: 'actions',
      header: 'Account Actions',
      sortable: false,
      render: (row) => (
        <button
          onClick={() => handleToggleLock(row.username, row.is_locked)}
          className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
            row.is_locked
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
              : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
          }`}
        >
          {row.is_locked ? (
            <>
              <Unlock className="w-3 h-3 mr-1" /> Unlock User
            </>
          ) : (
            <>
              <Lock className="w-3 h-3 mr-1" /> Lock User
            </>
          )}
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.msg} onClose={() => setToast(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            All Registered Accounts ({users.length})
          </h3>
          {loading ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
              Loading accounts...
            </div>
          ) : (
            <DataGrid data={users} columns={columns} pageSize={10} />
          )}
        </div>

        {/* Reset Password Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
            <KeyRound className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Reset User Password</h3>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target User
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.username}>
                    {u.username} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter new password"
                value={resetPwd}
                onChange={(e) => setResetPwd(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
            >
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
