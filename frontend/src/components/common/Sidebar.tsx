// frontend/src/components/common/Sidebar.tsx
import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { MasterType } from '../../types';
import {
  Layers,
  FileCode,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Package,
  Users,
  Building2
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'mapping' | 'rules' | 'xml';
  setActiveTab: (tab: 'mapping' | 'rules' | 'xml') => void;
  allowedModules?: MasterType[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  allowedModules = ['Material Master', 'Vendor Master', 'Customer Master']
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentProject, selectedMaster, setSelectedMaster } = useProject();

  const getModuleIcon = (module: MasterType) => {
    switch (module) {
      case 'Material Master':
        return <Package className="w-4 h-4 text-emerald-400" />;
      case 'Vendor Master':
        return <Building2 className="w-4 h-4 text-indigo-400" />;
      case 'Customer Master':
        return <Users className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Active Environment
            </span>
            <span className="text-xs font-semibold text-white truncate block max-w-[180px]">
              {currentProject || 'No Project Selected'}
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Module Selector Section */}
      <div className="p-3 border-b border-slate-800">
        {!collapsed && (
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 block mb-2">
            Master Data Modules
          </span>
        )}
        <div className="space-y-1">
          {allowedModules.map((module) => {
            const isSelected = selectedMaster === module;
            return (
              <button
                key={module}
                onClick={() => setSelectedMaster(module)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
                } ${collapsed ? 'justify-center' : 'justify-between'}`}
                title={module}
              >
                <div className="flex items-center space-x-2.5">
                  {getModuleIcon(module)}
                  {!collapsed && <span className="truncate">{module}</span>}
                </div>
                {!collapsed && isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="p-3 flex-1 space-y-1">
        {!collapsed && (
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 block mb-2">
            Pipeline Views
          </span>
        )}

        <button
          onClick={() => setActiveTab('mapping')}
          className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'mapping'
              ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          } ${collapsed ? 'justify-center' : 'space-x-3'}`}
          title="Field Mapping"
        >
          <Layers className={`w-4 h-4 ${activeTab === 'mapping' ? 'text-blue-400' : ''}`} />
          {!collapsed && <span>Field Mapping</span>}
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'rules'
              ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          } ${collapsed ? 'justify-center' : 'space-x-3'}`}
          title="Rules Engine"
        >
          <Sliders className={`w-4 h-4 ${activeTab === 'rules' ? 'text-blue-400' : ''}`} />
          {!collapsed && <span>Rules Engine</span>}
        </button>

        <button
          onClick={() => setActiveTab('xml')}
          className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'xml'
              ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          } ${collapsed ? 'justify-center' : 'space-x-3'}`}
          title="XML Payload Generator"
        >
          <FileCode className={`w-4 h-4 ${activeTab === 'xml' ? 'text-blue-400' : ''}`} />
          {!collapsed && <span>XML Generation</span>}
        </button>
      </div>

      {/* Footer info */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800 text-[10px] text-slate-400 text-center">
          Enterprise Migration v2.4
        </div>
      )}
    </aside>
  );
};
