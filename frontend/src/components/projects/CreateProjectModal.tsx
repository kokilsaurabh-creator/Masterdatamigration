// frontend/src/components/projects/CreateProjectModal.tsx
import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Toast } from '../common/Toast';
import { createProject } from '../../services/projectService';
import { MasterType } from '../../types';
import { FolderPlus, Loader2 } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (projectName: string, masterType: MasterType) => void;
  existingProjects: string[];
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingProjects
}) => {
  const [projectName, setProjectName] = useState('');
  const [masterType, setMasterType] = useState<MasterType>('Material Master');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = projectName.trim();
    if (!trimmed) {
      setErrorMsg('Project Name is required.');
      return;
    }

    if (existingProjects.includes(trimmed)) {
      setErrorMsg('A project space with this name already exists. Choose a unique name.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const { success, error } = await createProject(trimmed, masterType);
    setLoading(false);

    if (success) {
      onSuccess(trimmed, masterType);
      onClose();
    } else {
      setErrorMsg(error || 'Failed to create project.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Initialize New Migration Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && <Toast type="error" message={errorMsg} onClose={() => setErrorMsg(null)} />}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Project Space Identifier
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Global_Rollout_2024"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Primary Master Data Type
          </label>
          <select
            value={masterType}
            onChange={(e) => setMasterType(e.target.value as MasterType)}
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="Material Master">Material Master (MM)</option>
            <option value="Vendor Master">Vendor Master (P2P / Supplier)</option>
            <option value="Customer Master">Customer Master (SD / Sales)</option>
          </select>
        </div>

        <div className="pt-3 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <FolderPlus className="w-3.5 h-3.5 mr-1.5" />
                Create Environment
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
