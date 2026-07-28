// frontend/src/context/ProjectContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { MasterType } from '../types';

interface ProjectContextType {
  currentProject: string | null;
  selectedMaster: MasterType;
  setCurrentProject: (proj: string | null) => void;
  setSelectedMaster: (master: MasterType) => void;
  setProjectAndMaster: (proj: string, master: MasterType) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentProject, setCurrentProjectState] = useState<string | null>(() => {
    return localStorage.getItem('expound_project');
  });

  const [selectedMaster, setSelectedMasterState] = useState<MasterType>(() => {
    const saved = localStorage.getItem('expound_master');
    return (saved as MasterType) || 'Material Master';
  });

  const setCurrentProject = (proj: string | null) => {
    setCurrentProjectState(proj);
    if (proj) {
      localStorage.setItem('expound_project', proj);
    } else {
      localStorage.removeItem('expound_project');
    }
  };

  const setSelectedMaster = (master: MasterType) => {
    setSelectedMasterState(master);
    localStorage.setItem('expound_master', master);
  };

  const setProjectAndMaster = (proj: string, master: MasterType) => {
    setCurrentProjectState(proj);
    setSelectedMasterState(master);
    localStorage.setItem('expound_project', proj);
    localStorage.setItem('expound_master', master);
  };

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        selectedMaster,
        setCurrentProject,
        setSelectedMaster,
        setProjectAndMaster
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within ProjectProvider');
  return context;
};
