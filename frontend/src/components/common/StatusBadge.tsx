// frontend/src/components/common/StatusBadge.tsx
import React from 'react';
import { MasterType, Role } from '../../types';

interface StatusBadgeProps {
  type?: 'role' | 'module' | 'status' | 'mandatory';
  value: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type = 'status', value, className = '' }) => {
  if (type === 'role') {
    const isAdmin = value === 'Admin';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${isAdmin ? 'bg-blue-900 text-white' : 'bg-slate-700 text-slate-100'} ${className}`}>
        {value}
      </span>
    );
  }

  if (type === 'module') {
    let colorClasses = 'bg-slate-100 text-slate-800 border-slate-300';
    if (value === 'Material Master') {
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-300';
    } else if (value === 'Vendor Master') {
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-300';
    } else if (value === 'Customer Master') {
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-300';
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses} ${className}`}>
        {value}
      </span>
    );
  }

  if (type === 'mandatory') {
    return value === 'true' || value === 'Required' ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        Mandatory *
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
        Optional
      </span>
    );
  }

  // Default status badge
  let badgeStyle = 'bg-slate-100 text-slate-800 border-slate-300';
  if (value === 'Active' || value === 'Success' || value === 'Migrated') {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-300';
  } else if (value === 'Locked' || value === 'Error' || value === 'Denied') {
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-300';
  } else if (value === 'Pending' || value === 'Draft') {
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-300';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${badgeStyle} ${className}`}>
      {value}
    </span>
  );
};
