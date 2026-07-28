// frontend/src/components/projects/ProjectSetupHub.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { fetchProjectsAndModulesForUser } from '../../services/projectService';
import { MasterType } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Navbar } from '../common/Navbar';
import { CreateProjectModal } from './CreateProjectModal';
import { FolderOpen, PlusCircle, ArrowRight, Database, Loader2, Package, Building2, Users } from 'lucide-react';

export const ProjectSetupHub: React.FC = () => {
  const { user, setStep } = useAuth();
  const { setProjectAndMaster } = useProject();

  const [projects, setProjects] = useState<string[]>([]);
  const [allowedMastersMap, setAllowedMastersMap] = useState<Record<string, MasterType[]>>({});
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<MasterType>('Material Master');
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'open' | 'create'>('open');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchProjectsAndModulesForUser(user.id, user.role).then(({ projects, allowedMastersMap }) => {
      setProjects(projects);
      setAllowedMastersMap(allowedMastersMap);

      if (projects.length > 0) {
        setSelectedProject(projects[0]);
        const available = allowedMastersMap[projects[0]] || ['Material Master'];
        setSelectedModule(available[0]);
      }
      setLoading(false);
    });
  }, [user]);

  const handleProjectChange = (proj: string) => {
    setSelectedProject(proj);
    const available = allowedMastersMap[proj] || ['Material Master'];
    setSelectedModule(available[0]);
  };

  const handleLaunch = () => {
    if (!selectedProject) return;
    setProjectAndMaster(selectedProject, selectedModule);
    setStep(2); // Workspace step
  };

  const availableModules = allowedMastersMap[selectedProject] || [
    'Material Master',
    'Vendor Master',
    'Customer Master'
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="relative z-10">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-3">
                <Database className="w-3.5 h-3.5 mr-1.5" /> Project Space Launcher
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Select Migration Workspace</h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Choose a project space and target SAP Master Data Module (MM, P2P, SD)
              </p>
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('open')}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'open'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FolderOpen className="w-4 h-4 mr-2 text-blue-600" />
                Open Existing Project
              </button>

              {user?.role === 'Admin' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  <PlusCircle className="w-4 h-4 mr-2 text-emerald-600" />
                  Create New Migration Space
                </button>
              )}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8">
            {loading ? (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                <span className="text-xs font-medium">Loading project environments...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-3">
                <Database className="w-10 h-10 mx-auto text-slate-400" />
                <p className="text-xs font-medium">No project spaces assigned to your account.</p>
                <p className="text-[11px] text-slate-400">Please contact an Administrator to grant access.</p>
              </div>
            ) : (
              <div className="space-y-6 max-w-xl mx-auto">
                {/* Project Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Project Space
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                  >
                    {projects.map((proj) => (
                      <option key={proj} value={proj}>
                        📁 {proj}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Module Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Master Data Module
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {availableModules.map((module) => {
                      const isSelected = selectedModule === module;
                      const icon =
                        module === 'Material Master' ? (
                          <Package className="w-5 h-5 text-emerald-600" />
                        ) : module === 'Vendor Master' ? (
                          <Building2 className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Users className="w-5 h-5 text-amber-600" />
                        );

                      return (
                        <div
                          key={module}
                          onClick={() => setSelectedModule(module)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center space-y-2 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/50 shadow-md ring-1 ring-blue-500'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                          }`}
                        >
                          {icon}
                          <span className="text-xs font-bold text-slate-800 leading-tight">
                            {module}
                          </span>
                          <StatusBadge type="module" value={module} className="text-[10px]" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Launch CTA */}
                <div className="pt-4">
                  <button
                    onClick={handleLaunch}
                    className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 group"
                  >
                    <span>Launch Migration Workspace</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newProj, newMaster) => {
          setProjects((prev) => [...prev, newProj]);
          setAllowedMastersMap((prev) => ({ ...prev, [newProj]: [newMaster] }));
          setSelectedProject(newProj);
          setSelectedModule(newMaster);
        }}
        existingProjects={projects}
      />
    </div>
  );
};
