// frontend/src/App.tsx
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { LoginForm } from './components/auth/LoginForm';
import { ProjectSetupHub } from './components/projects/ProjectSetupHub';
import { WorkspaceLayout } from './components/workspace/WorkspaceLayout';
import { AdminPanel } from './components/admin/AdminPanel';

const AppRouter: React.FC = () => {
  const { user, step } = useAuth();

  if (!user || step === 0) {
    return <LoginForm />;
  }

  if (step === 1) {
    return <ProjectSetupHub />;
  }

  if (step === 2) {
    return <WorkspaceLayout />;
  }

  if (step === 4) {
    if (user.role !== 'Admin') {
      return <ProjectSetupHub />;
    }
    return <AdminPanel />;
  }

  return <ProjectSetupHub />;
};

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <AppRouter />
      </ProjectProvider>
    </AuthProvider>
  );
}
