import * as React from 'react';
const { useState } = React;
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-6 text-white flex items-center justify-between relative overflow-hidden border-b border-slate-800">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 blur-xl rounded-full translate-x-12 -translate-y-12"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
              <Lock size={20} className="text-brand-400" />
            </div>
            <div>
              <h2 className="font-black tracking-tight">Admin {mode === 'LOGIN' ? 'Verification' : 'Registration'}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Secure Gateway</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="text-center">
            <p className="text-slate-400 text-xs font-medium leading-relaxed">
              {mode === 'LOGIN'
                ? "Enter your administrator credentials to access the dashboard."
                : "Create a new administrator account to manage interview data."}
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <input
                type="text"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all text-sm font-medium text-white placeholder:text-slate-500"
                placeholder="Username"
              />
            </div>
            <div className="relative group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all text-sm font-medium text-white placeholder:text-slate-500"
                placeholder="Password"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 py-2.5 px-4 rounded-xl animate-shake">
                <p className="text-red-400 text-[11px] font-bold flex items-center justify-center gap-2">
                  <ShieldAlert size={14} /> {error}
                </p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 py-2.5 px-4 rounded-xl">
                <p className="text-emerald-400 text-[11px] font-bold flex items-center justify-center gap-2">
                  <UserCheck size={14} /> Registration Successful!
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`w-full h-14 ${success ? 'bg-emerald-600' : 'bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600'} text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-xl shadow-brand-500/20 active:scale-[0.98]`}
          >
            <span className="tracking-tight">{mode === 'LOGIN' ? 'Verify Access' : 'Create Account'}</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN'); setError(null); }}
              className="px-4 py-2 text-brand-400 text-xs font-black hover:bg-brand-900/30 rounded-full transition-all flex items-center justify-center gap-2 mx-auto uppercase tracking-wider"
            >
              {mode === 'LOGIN' ? <UserPlus size={16} /> : <UserCheck size={16} />}
              {mode === 'LOGIN' ? "Create an account" : "Back to login"}
            </button>
          </div>
        </form>

        <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-800 transition-colors">
          <p className="text-[10px] text-slate-500 font-bold text-center uppercase tracking-[0.15em]">
            Credentials: <span className="text-slate-300">admin / admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
};
