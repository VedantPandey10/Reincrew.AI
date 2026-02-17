import * as React from 'react';
const { useState, useEffect } = React;
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
        <div className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 dark:border-white/5 transition-all">
          <div className="p-10 text-center bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-900 dark:to-slate-950 text-white relative overflow-hidden">
            {/* Morphing glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full translate-x-12 -translate-y-12 animate-morph"></div>

            <div className="relative z-10">
              <h2 className="text-4xl font-black mb-1 tracking-tighter">Reicrew AI</h2>
              <p className="text-brand-100/60 text-[10px] font-bold uppercase tracking-[0.3em]">Smart Interviewing System</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white tracking-tight">Candidate Launchpad</h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                Unlock your potential. Start your AI-optimized professional assessment.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Candidate Identity</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                  <input
                    name="name"
                    value={name}
                    required
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all text-white placeholder:text-slate-600 font-medium"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Target Role</label>
                <div className="relative group">
                  <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all text-white appearance-none cursor-pointer font-medium"
                  >
                    {jobs.map(job => (
                      <option key={job.id} value={job.id} className="bg-slate-900">{job.title}</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-focus-within:text-brand-400 transition-colors">
                    <ArrowRight size={18} className="rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-brand-500/5 border border-brand-500/10 p-5 rounded-3xl flex gap-4 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 shrink-0 border border-brand-500/20">
                <ShieldCheck size={24} />
              </div>
              <div className="text-xs leading-relaxed">
                <p className="font-black text-brand-300 uppercase mb-0.5 tracking-tight">Secure Assessment</p>
                <p className="text-slate-400 font-medium">Your session is proctored to ensure a fair and consistent evaluation process.</p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-16 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-brand-500/20 active:scale-[0.98] group"
            >
              <span className="text-lg tracking-tight">Begin Interview</span>
              <PlayCircle size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="pt-2 flex flex-col items-center">
              <button
                type="button"
                onClick={onAdminLogin}
                className="text-slate-500 hover:text-brand-400 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] transition-all py-3 px-8 rounded-full border border-transparent hover:border-slate-800 hover:bg-slate-800/50"
              >
                <Shield size={14} /> Admin Gateway
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
