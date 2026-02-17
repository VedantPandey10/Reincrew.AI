
import React, { useState, useEffect } from 'react';
import { Candidate, JobPost } from '../types';
import { StorageService } from '../services/storageService';
import { User, ArrowRight, ShieldCheck, PlayCircle, Shield, Briefcase } from 'lucide-react';

interface LoginScreenProps {
  onStart: (candidate: Candidate) => void;
  onAdminLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onStart, onAdminLogin }) => {
  const [name, setName] = useState('');
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  useEffect(() => {
    const availableJobs = StorageService.getJobs();
    setJobs(availableJobs);
    if (availableJobs.length > 0) {
      setSelectedJobId(availableJobs[0].id);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedJob = jobs.find(j => j.id === selectedJobId);

    onStart({
      name: name.trim() || 'Candidate',
      position: selectedJob?.title || 'General Applicant',
      company: 'N/A',
      jobPostId: selectedJobId
    });
  };

  return (
    <div className="h-full w-full overflow-y-auto relative p-4 flex items-center justify-center transition-colors duration-300">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-brand-500/10 blur-[120px] rounded-full animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse-slow font-delay-1000"></div>

      <div className="w-full max-w-md animate-fade-in z-10">
        <div className="glass-card bg-white/40 dark:bg-slate-900/40 rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/5 transition-colors">
          <div className="p-8 text-center bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-900 dark:to-slate-950 text-white relative overflow-hidden">
            {/* Morphing glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full translate-x-12 -translate-y-12 animate-morph"></div>

            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-1 tracking-tight">Reicrew AI</h2>
              <p className="text-brand-100/80 text-xs font-medium uppercase tracking-[0.2em]">Automated Intelligence Platform</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Welcome Back</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs text-balance">
                Elevate your career. Start your AI-powered interview journey today.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Candidate Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                  <input
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-brand-500 dark:focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:focus:ring-brand-400/5 outline-none transition-all text-slate-800 dark:text-slate-100"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Interview Position</label>
                <div className="relative group">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-brand-500 dark:focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:focus:ring-brand-400/5 outline-none transition-all text-slate-800 dark:text-slate-100 appearance-none cursor-pointer"
                  >
                    {jobs.map(job => (
                      <option key={job.id} value={job.id} className="dark:bg-slate-900">{job.title}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ArrowRight size={16} className="rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/30 p-4 rounded-2xl flex gap-4 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="text-[11px] leading-relaxed">
                <p className="font-bold text-brand-900 dark:text-brand-300 uppercase mb-0.5 tracking-tight">Verified Assessment</p>
                <p className="text-brand-700 dark:text-brand-400/80 italic">Your session is proctored by AI to ensure integrity and fair evaluation.</p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-500/20 dark:shadow-brand-500/10 hover:scale-[1.02] active:scale-95 group"
            >
              <span>Get Started</span>
              <PlayCircle size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="pt-2 flex flex-col items-center">
              <button
                type="button"
                onClick={onAdminLogin}
                className="text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all py-3 px-6 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 hover:bg-white/50 dark:hover:bg-slate-800/50"
              >
                <Shield size={12} /> Portal Access
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
