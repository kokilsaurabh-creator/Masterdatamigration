// frontend/src/components/admin/AdminPanel.tsx
import React, { useState } from 'react';
import { Navbar } from '../common/Navbar';
import { CreateUserForm } from './CreateUserForm';
import { UserAccountsTable } from './UserAccountsTable';
import { PermissionManager } from './PermissionManager';
import { Shield, UserPlus, Users, Key } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'accounts' | 'permissions'>('accounts');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Title Header */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Admin User & Security Management</h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Manage accounts, role assignments, and RBAC project permissions (MM, P2P, SD)
              </p>
            </div>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-2 max-w-fit">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'accounts'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Manage Accounts
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'create'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'permissions'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Key className="w-4 h-4 mr-2" />
            Permission Mapping
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'accounts' && <UserAccountsTable />}
          {activeTab === 'create' && <CreateUserForm onUserCreated={() => setActiveTab('accounts')} />}
          {activeTab === 'permissions' && <PermissionManager />}
        </div>
      </main>
    </div>
  );
};
