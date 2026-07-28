// frontend/src/components/admin/CreateUserForm.tsx
import React, { useState } from 'react';
import { createUser } from '../../services/authService';
import { Role } from '../../types';
import { Toast } from '../common/Toast';
import { UserPlus, Loader2 } from 'lucide-react';

interface CreateUserFormProps {
  onUserCreated?: () => void;
}

export const CreateUserForm: React.FC<CreateUserFormProps> = ({ onUserCreated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('User');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setToast({ type: 'error', msg: 'Username and password are required.' });
      return;
    }

    setLoading(true);
    setToast(null);

    const { success, error } = await createUser(username.trim(), password.trim(), role);
    setLoading(false);

    if (success) {
      setToast({ type: 'success', msg: `User '${username.trim()}' created successfully!` });
      setUsername('');
      setPassword('');
      setRole('User');
      if (onUserCreated) onUserCreated();
    } else {
      setToast({ type: 'error', msg: error || 'Failed to create user.' });
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-xl">
      <div className="flex items-center space-x-3 mb-5 pb-3 border-b border-slate-200">
        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
          <UserPlus className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-800">Create New System User</h3>
          <p className="text-xs text-slate-500 font-medium">Add a user account and assign global role</p>
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.msg} onClose={() => setToast(null)} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Username
          </label>
          <input
            type="text"
            required
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Role Assignment
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          >
            <option value="User">Standard User</option>
            <option value="Admin">Administrator</option>
          </select>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                Creating User...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-1.5" />
                Create Account
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
