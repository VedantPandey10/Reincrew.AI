import React, { useState } from 'react';
import { Lock, ShieldAlert, ArrowRight, X, UserPlus, UserCheck } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'REGISTER') {
      if (username.length < 3 || password.length < 6) {
        setError("User >= 3, Pass >= 6 chars");
        return;
      }
      const ok = StorageService.registerAdmin(username, password);
      if (ok) {
        setSuccess(true);
        setTimeout(() => {
          setMode('LOGIN');
          setSuccess(false);
        }, 1500);
      } else {
        setError("Username already exists");
      }
    } else {
      const ok = StorageService.verifyAdmin(username, password);
      if (ok) {
        onSuccess();
      } else {
        setError("Invalid credentials");
        setTimeout(() => setError(null), 2000);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={20} className="text-indigo-400" />
            <h2 className="font-bold">Admin {mode === 'LOGIN' ? 'Verification' : 'Registration'}</h2>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="text-center mb-2">
            <p className="text-slate-500 text-xs">
              {mode === 'LOGIN'
                ? "Enter your administrator credentials to access the dashboard."
                : "Create a new administrator account to manage interview data."}
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm"
                placeholder="Username"
              />
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm"
                placeholder="Password"
              />
            </div>

            {error && (
              <p className="text-red-500 text-[10px] text-center font-bold flex items-center justify-center gap-1 animate-shake">
                <ShieldAlert size={12} /> {error}
              </p>
            )}

            {success && (
              <p className="text-emerald-500 text-[10px] text-center font-bold flex items-center justify-center gap-1">
                <UserCheck size={12} /> Registration Successful!
              </p>
            )}
          </div>

          <button
            type="submit"
            className={`w-full ${success ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-200`}
          >
            <span>{mode === 'LOGIN' ? 'Verify Access' : 'Create Account'}</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN'); setError(null); }}
              className="text-indigo-600 text-xs font-bold hover:underline underline-offset-4 flex items-center justify-center gap-1 mx-auto"
            >
              {mode === 'LOGIN' ? <UserPlus size={14} /> : <UserCheck size={14} />}
              {mode === 'LOGIN' ? "Create an account" : "Back to login"}
            </button>
          </div>
        </form>

        <div className="p-3 bg-slate-50 border-t border-slate-100 italic text-center">
          <p className="text-[9px] text-slate-400">Default Credentials: <span className="font-bold">admin / admin123</span></p>
        </div>
      </div >
    </div >
  );
};
