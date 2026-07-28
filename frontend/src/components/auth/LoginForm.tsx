// frontend/src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../services/authService';
import { Toast } from '../common/Toast';
import { Lock, User, ArrowRight, Loader2, Database } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { setUser, setStep } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const { user, error } = await loginUser(username.trim(), password.trim());
    setLoading(false);

    if (error || !user) {
      setErrorMsg(error || 'Authentication failed.');
    } else {
      setUser(user);
      setStep(1); // Proceed to Project Setup
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Graphic Accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-xl text-white font-extrabold text-2xl mb-4 tracking-tight">
          E
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Expound Master Data Hub</h1>
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
          S/4HANA Migration Engine <span className="text-slate-600">|</span> Enterprise Secure Login
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-slate-200/80 sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && <Toast type="error" message={errorMsg} onClose={() => setErrorMsg(null)} />}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <span>Secure Login</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200/80 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center space-x-1 font-medium">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>Multi-Master S/4HANA Cockpit (MM, P2P, SD)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
