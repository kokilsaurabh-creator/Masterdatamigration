// frontend/src/components/workspace/WorkspaceLayout.tsx
import React, { useState } from 'react';
import { Navbar } from '../common/Navbar';
import { Sidebar } from '../common/Sidebar';
import { FieldMappingTab } from './FieldMappingTab';
import { RulesDefinitionTab } from './RulesDefinitionTab';
import { XmlGenerationTab } from './XmlGenerationTab';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';

export const WorkspaceLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mapping' | 'rules' | 'xml'>('mapping');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'mapping' && <FieldMappingTab />}
            {activeTab === 'rules' && <RulesDefinitionTab />}
            {activeTab === 'xml' && <XmlGenerationTab />}
          </div>
        </main>
      </div>
    </div>
  );
};
