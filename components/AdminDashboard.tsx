import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { InterviewSession, JobPost, Question, RoleSettings, AdminConfig } from '../types';
import {
    Users, Settings, LogOut, Search, Shield, Briefcase, Pencil, Plus, Save, Trash2,
    SlidersHorizontal, Activity, ToggleLeft, ToggleRight, Info, AlertTriangle, CheckCircle, XCircle, Eye, Clock, Mail, Phone, CreditCard
} from 'lucide-react';

interface AdminDashboardProps {
    onLogout: () => void;
}

const DEFAULT_SETTINGS: RoleSettings = {
    difficulty: 'Medium',
    preset: 'Normal',
    weights: { concept: 50, grammar: 20, fluency: 20, camera: 10 },
    proctoring: { maxWarnings: 3, sensitivity: 'Medium', includeInScore: true }
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<'candidates' | 'jobs' | 'config'>('candidates');
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [jobs, setJobs] = useState<JobPost[]>([]);
    const [config, setConfig] = useState<AdminConfig>(StorageService.getConfig());

    const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
    const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
    const [editingJob, setEditingJob] = useState<JobPost | null>(null);
    const [jobEditTab, setJobEditTab] = useState<'questions' | 'settings'>('questions');

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setSessions(StorageService.getSessions());
        setJobs(StorageService.getJobs());
    }, []);

    const handleSaveJob = () => {
        if (editingJob) {
            const updatedJobs = jobs.map(j => j.id === editingJob.id ? editingJob : j);
            setJobs(updatedJobs);
            StorageService.saveJobs(updatedJobs);
            setSelectedJob(editingJob);
            setEditingJob(null);
        }
    };

    const handleUpdateConfig = (field: keyof AdminConfig, value: number) => {
        const newConfig = { ...config, [field]: value };
        setConfig(newConfig);
        StorageService.saveConfig(newConfig);
    };

    const handleCreateJob = () => {
        const newJob: JobPost = {
            id: `job-${Date.now()}`,
            title: 'New Role Title',
            description: 'Role description...',
            status: 'ACTIVE',
            settings: { ...DEFAULT_SETTINGS },
            questions: []
        };
        const updatedJobs = [...jobs, newJob];
        setJobs(updatedJobs);
        StorageService.saveJobs(updatedJobs);
        setEditingJob(newJob);
        setJobEditTab('settings');
    };

    const handleToggleStatus = (jobId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const job = jobs.find(j => j.id === jobId);
        if (job) {
            const newStatus = job.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            const updatedJobs = jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j);
            setJobs(updatedJobs);
            StorageService.saveJobs(updatedJobs);
            if (selectedJob?.id === jobId) setSelectedJob({ ...selectedJob, status: newStatus });
        }
    };

    const applyPreset = (preset: 'Relaxed' | 'Normal' | 'Strict' | 'Custom') => {
        if (!editingJob) return;

        let newSettings = { ...editingJob.settings, preset };

        if (preset === 'Relaxed') {
            newSettings.weights = { concept: 40, grammar: 10, fluency: 40, camera: 10 };
            newSettings.proctoring = { maxWarnings: 5, sensitivity: 'Low', includeInScore: false };
            newSettings.difficulty = 'Easy';
        } else if (preset === 'Normal') {
            newSettings.weights = { concept: 50, grammar: 20, fluency: 20, camera: 10 };
            newSettings.proctoring = { maxWarnings: 3, sensitivity: 'Medium', includeInScore: true };
            newSettings.difficulty = 'Medium';
        } else if (preset === 'Strict') {
            newSettings.weights = { concept: 60, grammar: 25, fluency: 10, camera: 5 };
            newSettings.proctoring = { maxWarnings: 2, sensitivity: 'High', includeInScore: true };
            newSettings.difficulty = 'Hard';
        }

        setEditingJob({ ...editingJob, settings: newSettings });
    };

    const handleUpdateQuestion = (qId: number, field: keyof Question, value: any) => {
        if (editingJob) {
            const updatedQuestions = editingJob.questions.map(q =>
                q.id === qId ? { ...q, [field]: value } : q
            );
            setEditingJob({ ...editingJob, questions: updatedQuestions });
        }
    };

    const handleAddKeyPoint = (qId: number) => {
        if (editingJob) {
            const updatedQuestions = editingJob.questions.map(q => {
                if (q.id === qId) {
                    const keyPoints = q.keyPoints || [];
                    return { ...q, keyPoints: [...keyPoints, ''] };
                }
                return q;
            });
            setEditingJob({ ...editingJob, questions: updatedQuestions });
        }
    };

    const handleUpdateKeyPoint = (qId: number, index: number, value: string) => {
        if (editingJob) {
            const updatedQuestions = editingJob.questions.map(q => {
                if (q.id === qId) {
                    const keyPoints = [...(q.keyPoints || [])];
                    keyPoints[index] = value;
                    return { ...q, keyPoints };
                }
                return q;
            });
            setEditingJob({ ...editingJob, questions: updatedQuestions });
        }
    };

    const handleRemoveKeyPoint = (qId: number, index: number) => {
        if (editingJob) {
            const updatedQuestions = editingJob.questions.map(q => {
                if (q.id === qId) {
                    const keyPoints = (q.keyPoints || []).filter((_, i) => i !== index);
                    return { ...q, keyPoints };
                }
                return q;
            });
            setEditingJob({ ...editingJob, questions: updatedQuestions });
        }
    };

    const handleAddQuestion = () => {
        if (editingJob) {
            const newQuestion: Question = {
                id: Date.now(),
                text: "New Question...",
                difficulty: 'Medium',
                topic: 'General',
                referenceAnswer: "Add reference answer here...",
                keyPoints: [],
                maxScore: 10
            };
            setEditingJob({
                ...editingJob,
                questions: [...editingJob.questions, newQuestion]
            });
        }
    };

    const handleDeleteQuestion = (qId: number) => {
        if (editingJob && confirm('Delete this question?')) {
            setEditingJob({
                ...editingJob,
                questions: editingJob.questions.filter(q => q.id !== qId)
            });
        }
    };

    const filteredSessions = sessions.filter(s =>
        s.candidate.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-screen w-screen flex bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 transition-colors">
                <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
                    <Shield className="text-indigo-500" size={28} />
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">Reicrew AI</h1>
                        <p className="text-xs text-slate-500">Admin Portal</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => { setActiveTab('candidates'); setSelectedSession(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'candidates' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-slate-800 dark:hover:bg-slate-900 text-slate-400 hover:text-white'}`}>
                        <Users size={20} /> <span className="font-semibold">Candidates</span>
                    </button>
                    <button onClick={() => { setActiveTab('jobs'); setSelectedJob(null); setEditingJob(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'jobs' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-slate-800 dark:hover:bg-slate-900 text-slate-400 hover:text-white'}`}>
                        <Briefcase size={20} /> <span className="font-semibold">Roles & Config</span>
                    </button>
                    <button onClick={() => { setActiveTab('config'); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'config' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-slate-800 dark:hover:bg-slate-900 text-slate-400 hover:text-white'}`}>
                        <Settings size={20} /> <span className="font-semibold">System Config</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-2">
                    <button
                        onClick={() => {
                            if (confirm("DANGER: This will permanently delete ALL candidate data, sessions, and custom job configurations. This cannot be undone. Proceed?")) {
                                localStorage.clear();
                                window.location.reload();
                            }
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-950/30 rounded-lg transition-colors text-xs font-bold"
                    >
                        <Trash2 size={16} /> Wipe All Data
                    </button>
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">
                        <LogOut size={20} /> Exit Portal
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shrink-0 transition-colors">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        {activeTab === 'candidates' && (selectedSession ? `Candidate: ${selectedSession.candidate.name}` : 'Session History')}
                        {activeTab === 'jobs' && (editingJob ? `Editing: ${editingJob.title}` : 'Role Management')}
                        {activeTab === 'config' && 'Global System Configuration'}
                    </h2>

                    {/* Back Buttons */}
                    {selectedSession && activeTab === 'candidates' && (
                        <button onClick={() => setSelectedSession(null)} className="text-sm text-indigo-600 font-bold hover:underline">← Back to List</button>
                    )}
                    {selectedJob && !editingJob && activeTab === 'jobs' && (
                        <button onClick={() => setSelectedJob(null)} className="text-sm text-indigo-600 font-bold hover:underline">← Back to Roles</button>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto p-8">

                    {/* --- TAB: CANDIDATES --- */}
                    {activeTab === 'candidates' && !selectedSession && (
                        <div className="space-y-4">
                            {/* Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Candidates</p>
                                    <p className="text-2xl font-black text-slate-800 dark:text-white transition-colors">{sessions.length}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Completed</p>
                                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-500 transition-colors">{sessions.filter(s => s.status === 'COMPLETED').length}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Terminated</p>
                                    <p className="text-2xl font-black text-red-600 dark:text-red-500 transition-colors">{sessions.filter(s => s.status === 'TERMINATED').length}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Avg Score</p>
                                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 transition-colors">{sessions.length ? Math.round(sessions.reduce((a, s) => a + s.overallScore, 0) / sessions.length) : 0}%</p>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
                                    <Search size={18} className="text-slate-400 dark:text-slate-600" />
                                    <input
                                        placeholder="Search candidate names..."
                                        className="flex-1 outline-none text-sm bg-transparent text-slate-700 dark:text-slate-200"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-4">Candidate</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Score</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Warnings</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredSessions.map((s) => {
                                            const scoreColor = s.overallScore >= 70 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' : s.overallScore >= 50 ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400' : 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400';
                                            return (
                                                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors" onClick={() => setSelectedSession(s)}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                                                                {s.candidate.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-slate-800 dark:text-slate-200">{s.candidate.name}</p>
                                                                {s.candidate.email && <p className="text-[10px] text-slate-400 dark:text-slate-500">{s.candidate.email}</p>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">{s.candidate.position || '—'}</td>
                                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">{new Date(s.date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`font-bold text-sm px-2.5 py-1 rounded-lg ${scoreColor}`}>{Math.round(s.overallScore)}%</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${s.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                                                            }`}>{s.status}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {s.warnings.length > 0 ? (
                                                            <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
                                                                <AlertTriangle size={12} /> {s.warnings.length}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-slate-300">0</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={(e) => { e.stopPropagation(); setSelectedSession(s); }} className="text-indigo-600 font-medium hover:underline text-xs">View Report →</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {filteredSessions.length === 0 && (
                                    <div className="p-12 text-center text-slate-400">
                                        <Activity size={48} className="mx-auto mb-4 opacity-20" />
                                        <p>No interview sessions found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'candidates' && selectedSession && (
                        <div className="space-y-6 animate-fade-in pb-12">
                            {/* Candidate Profile Card */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                <div className="flex items-start gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-2xl shrink-0 transition-colors">
                                        {selectedSession.candidate.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">Candidate</p>
                                            <p className="font-bold text-slate-800 dark:text-white text-lg transition-colors">{selectedSession.candidate.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">{selectedSession.candidate.position || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            {selectedSession.candidate.email && (
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 transition-colors">
                                                    <Mail size={14} className="text-slate-400 dark:text-slate-500" />
                                                    <span>{selectedSession.candidate.email}</span>
                                                </div>
                                            )}
                                            {selectedSession.candidate.phone && (
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 transition-colors">
                                                    <Phone size={14} className="text-slate-400 dark:text-slate-500" />
                                                    <span>{selectedSession.candidate.phone}</span>
                                                </div>
                                            )}
                                            {selectedSession.candidate.accessId && (
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <CreditCard size={14} className="text-slate-400" />
                                                    <span className="font-mono text-xs">{selectedSession.candidate.accessId}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Clock size={14} className="text-slate-400" />
                                                <span>{new Date(selectedSession.date).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                {selectedSession.status === 'COMPLETED' ? (
                                                    <><CheckCircle size={14} className="text-emerald-500" /><span className="text-emerald-600 font-bold">Completed</span></>
                                                ) : (
                                                    <><XCircle size={14} className="text-red-500" /><span className="text-red-600 font-bold">Terminated</span></>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Score Overview */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="bg-indigo-600 p-4 rounded-xl text-white shadow-lg col-span-2 md:col-span-1">
                                    <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-1">Overall</p>
                                    <p className="text-3xl font-black">{Math.round(selectedSession.overallScore)}<span className="text-lg opacity-50">%</span></p>
                                </div>
                                {(() => {
                                    const r = selectedSession.results;
                                    const len = r.length || 1;
                                    const avgContent = +(r.reduce((a, x) => a + x.contentScore, 0) / len).toFixed(1);
                                    const avgGrammar = +(r.reduce((a, x) => a + x.grammarScore, 0) / len).toFixed(1);
                                    const avgFluency = +(r.reduce((a, x) => a + x.fluencyScore, 0) / len).toFixed(1);
                                    const avgVisual = +(r.reduce((a, x) => a + x.confidenceScore, 0) / len / 10).toFixed(1);
                                    return [
                                        { label: 'Content', score: avgContent, color: '#6366f1' },
                                        { label: 'Grammar', score: avgGrammar, color: '#06b6d4' },
                                        { label: 'Fluency', score: avgFluency, color: '#f59e0b' },
                                        { label: 'Visual', score: avgVisual, color: '#10b981' },
                                    ].map(s => (
                                        <div key={s.label} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">{s.label}</p>
                                            <div className="flex items-end gap-1">
                                                <span className="text-2xl font-black" style={{ color: s.color }}>{s.score}</span>
                                                <span className="text-xs text-slate-400 dark:text-slate-600 mb-1 transition-colors">/10</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 transition-colors">
                                                <div className="h-1.5 rounded-full" style={{ width: `${(s.score / 10) * 100}%`, backgroundColor: s.color }} />
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>

                            {/* Warnings Log */}
                            {selectedSession.warnings.length > 0 && (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-4 bg-red-50 border-b border-red-100 font-bold text-red-800 flex items-center gap-2 text-sm">
                                        <AlertTriangle size={16} /> Proctoring Warnings ({selectedSession.warnings.length})
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {selectedSession.warnings.map((w, i) => (
                                            <div key={i} className="px-6 py-3 flex items-center gap-4 text-sm">
                                                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">{new Date(w.timestamp).toLocaleTimeString()}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${w.type === 'TAB_SWITCH' ? 'bg-amber-50 text-amber-600' :
                                                    w.type === 'FULLSCREEN_EXIT' ? 'bg-red-50 text-red-600' :
                                                        w.type === 'GAZE' ? 'bg-indigo-50 text-indigo-600' :
                                                            'bg-slate-100 text-slate-500'
                                                    }`}>{w.type.replace('_', ' ')}</span>
                                                <span className="text-slate-600">{w.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Question-by-Question Analysis */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex items-center gap-2">
                                    <Eye size={16} className="text-indigo-500" /> Detailed Question Analysis
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {selectedSession.results.map((r, i) => (
                                        <div key={i} className="p-6">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1 pr-4">
                                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Question {i + 1}</span>
                                                    <h4 className="font-bold text-slate-800 mt-1">{r.questionText}</h4>
                                                </div>
                                                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border whitespace-nowrap ${r.verdict === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    r.verdict === 'Fail' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>{r.verdict}</span>
                                            </div>

                                            {/* Candidate's Answer */}
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-4 transition-colors">
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">Candidate's Answer</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed transition-colors">"{r.userAnswer}"</p>
                                            </div>

                                            {/* Scores grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                                {[
                                                    { label: 'Content', score: r.contentScore, color: '#6366f1' },
                                                    { label: 'Grammar', score: r.grammarScore, color: '#06b6d4' },
                                                    { label: 'Fluency', score: r.fluencyScore, color: '#f59e0b' },
                                                    { label: 'Visual', score: r.confidenceScore, color: '#10b981' },
                                                ].map(s => (
                                                    <div key={s.label} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center transition-colors">
                                                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 transition-colors">{s.label}</span>
                                                        <span className="text-xl font-black" style={{ color: s.color }}>{s.score}</span>
                                                        <span className="text-xs text-slate-400 dark:text-slate-600 transition-colors">/10</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Key Points */}
                                            {(r.matchedKeyPoints?.length > 0 || r.missingKeyPoints?.length > 0) && (
                                                <div className="flex flex-wrap gap-4 mb-4">
                                                    {r.matchedKeyPoints?.length > 0 && (
                                                        <div className="flex-1 min-w-[200px]">
                                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">✓ Covered</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {r.matchedKeyPoints.map((k, j) => (
                                                                    <span key={j} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] border border-emerald-100">{k}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {r.missingKeyPoints?.length > 0 && (
                                                        <div className="flex-1 min-w-[200px]">
                                                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2">✗ Missed</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {r.missingKeyPoints.map((k, j) => (
                                                                    <span key={j} className="px-2 py-1 bg-red-50 text-red-700 rounded text-[10px] border border-red-100">{k}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed p-3 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-xl border border-indigo-100 dark:border-indigo-500/10 transition-colors">
                                                <span className="font-bold text-indigo-700 dark:text-indigo-400">AI Feedback:</span> {r.feedback}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: JOBS LIST --- */}
                    {activeTab === 'jobs' && !selectedJob && !editingJob && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Info className="text-indigo-500" size={20} />
                                    <p className="text-indigo-700 dark:text-indigo-300 text-sm font-medium transition-colors">Manage interview roles and configuration settings.</p>
                                </div>
                                <button onClick={handleCreateJob} className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-sm transition-all hover:-translate-y-0.5">
                                    <Plus size={18} /> New Role
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {jobs.map(job => (
                                    <div key={job.id}
                                        onClick={() => setSelectedJob(job)}
                                        className={`bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full relative ${job.status === 'INACTIVE' ? 'border-slate-100 dark:border-slate-800 opacity-70 grayscale-[0.5]' : 'border-slate-200 dark:border-slate-800'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-slate-800 dark:text-white text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{job.title}</h3>
                                            <button
                                                onClick={(e) => handleToggleStatus(job.id, e)}
                                                className={`p-1 rounded-full transition-colors ${job.status === 'ACTIVE' ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-slate-500'}`}
                                                title={job.status === 'ACTIVE' ? 'Deactivate Role' : 'Activate Role'}
                                            >
                                                {job.status === 'ACTIVE' ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                            </button>
                                        </div>
                                        <p className="text-slate-500 text-sm flex-1 line-clamp-2 mb-4">{job.description}</p>

                                        <div className="flex flex-wrap gap-2 text-xs pt-4 border-t border-slate-100">
                                            <span className={`px-2 py-1 rounded font-bold uppercase tracking-wider ${job.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {job.status}
                                            </span>
                                            <span className="bg-slate-100 px-2 py-1 rounded font-bold text-slate-600">{job.questions.length} Questions</span>
                                            <span className="bg-indigo-50 px-2 py-1 rounded font-bold text-indigo-600">{job.settings?.preset || 'Normal'} Preset</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- JOB DETAILS (READ ONLY) --- */}
                    {activeTab === 'jobs' && selectedJob && !editingJob && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-12">
                            <div className="p-8 border-b border-slate-200 bg-slate-50 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-2xl font-bold text-slate-800">{selectedJob.title}</h2>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${selectedJob.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                            {selectedJob.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 max-w-2xl">{selectedJob.description}</p>
                                </div>
                                <button
                                    onClick={() => { setEditingJob(selectedJob); setJobEditTab('questions'); }}
                                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
                                >
                                    <Pencil size={16} /> Edit Role
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600 uppercase text-xs font-bold tracking-widest mb-4 transition-colors">
                                    <Activity size={14} /> Interview Questions
                                </div>
                                {selectedJob.questions.map((q, idx) => (
                                    <div key={q.id} className="p-5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <p className="font-bold text-slate-800 dark:text-white flex gap-3 transition-colors">
                                                <span className="text-indigo-500">Q{idx + 1}.</span>
                                                {q.text}
                                            </p>
                                            <span className="text-[10px] font-bold uppercase tracking-tighter bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 transition-colors">{q.difficulty}</span>
                                        </div>
                                        {q.keyPoints && q.keyPoints.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2 ml-8">
                                                {q.keyPoints.map((kp, i) => (
                                                    <span key={i} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium border border-indigo-100">
                                                        ✓ {kp}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- EDIT MODE --- */}
                    {activeTab === 'jobs' && editingJob && (
                        <div className="space-y-6 flex flex-col h-full pb-12">
                            <div className="flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">Role Designer</h2>
                                    <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full font-bold transition-colors">UNSAVED CHANGES</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { if (confirm("Discard all changes?")) setEditingJob(null); }} className="px-5 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-sm font-bold transition-all">Discard</button>
                                    <button
                                        onClick={handleSaveJob}
                                        disabled={!editingJob.title.trim()}
                                        className={`px-5 py-2 bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 transition-all ${!editingJob.title.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5 active:scale-95 animate-pulse-subtle'}`}
                                    >
                                        <Save size={16} /> Save Changes
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">Position Title</label>
                                    <input
                                        className="w-full text-lg font-bold border-b border-transparent focus:border-indigo-600 outline-none pb-1 transition-colors bg-slate-50 dark:bg-slate-800 px-2 py-2 rounded text-slate-800 dark:text-white"
                                        value={editingJob.title}
                                        onChange={e => setEditingJob({ ...editingJob, title: e.target.value })}
                                        placeholder="e.g. Senior Frontend Engineer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">Experience Summary</label>
                                    <input
                                        className="w-full text-sm text-slate-600 dark:text-slate-300 focus:text-slate-900 dark:focus:text-white outline-none bg-slate-50 dark:bg-slate-800 px-2 py-2 rounded border-b border-transparent focus:border-indigo-600 transition-colors"
                                        value={editingJob.description}
                                        onChange={e => setEditingJob({ ...editingJob, description: e.target.value })}
                                        placeholder="Brief description of the role requirements..."
                                    />
                                </div>
                            </div>

                            {/* Sub-Tabs */}
                            <div className="flex gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg w-fit shrink-0 transition-colors">
                                <button
                                    onClick={() => setJobEditTab('questions')}
                                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${jobEditTab === 'questions' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                >
                                    Questions
                                </button>
                                <button
                                    onClick={() => setJobEditTab('settings')}
                                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${jobEditTab === 'settings' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                >
                                    Scoring & Logic
                                </button>
                            </div>

                            {/* --- SETTINGS EDITOR --- */}
                            {jobEditTab === 'settings' && (
                                <div className="space-y-6 overflow-y-auto pr-2">
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 text-sm uppercase tracking-wider transition-colors">
                                            <SlidersHorizontal size={18} className="text-indigo-500" /> Adaptive Difficulty & Weights
                                        </h3>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                                            {['Relaxed', 'Normal', 'Strict', 'Custom'].map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() => applyPreset(p as any)}
                                                    className={`py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all ${editingJob.settings.preset === p
                                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400'
                                                        : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 transition-colors">Intelligence Baseline</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'].map((d) => (
                                                    <button
                                                        key={d}
                                                        onClick={() => setEditingJob({ ...editingJob, settings: { ...editingJob.settings, difficulty: d as any, preset: 'Custom' } })}
                                                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${editingJob.settings.difficulty === d ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                                                    >
                                                        {d}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs mb-6 uppercase tracking-widest flex items-center gap-2 transition-colors">
                                            <Activity size={14} className="text-slate-400 dark:text-slate-600" /> Scoring Components (%)
                                        </h4>
                                        <div className="space-y-6 max-w-2xl">
                                            {[
                                                { key: 'concept', label: 'Conceptual Accuracy', desc: 'How well they answered the technical aspects' },
                                                { key: 'grammar', label: 'English Proficiency', desc: 'Grammar, vocabulary, and sentence structure' },
                                                { key: 'fluency', label: 'Verbal Fluency', desc: 'Speech pace, fillers, and confidence' },
                                                { key: 'camera', label: 'Body Language', desc: 'Eye contact and facial presence' }
                                            ].map((w) => (
                                                <div key={w.key}>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <div>
                                                            <span className="block text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors">{w.label}</span>
                                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium transition-colors">{w.desc}</span>
                                                        </div>
                                                        <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-lg transition-colors">
                                                            {editingJob.settings.weights[w.key as keyof typeof editingJob.settings.weights]}%
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="range" min="0" max="100"
                                                        value={editingJob.settings.weights[w.key as keyof typeof editingJob.settings.weights]}
                                                        onChange={(e) => {
                                                            const newWeights = { ...editingJob.settings.weights, [w.key]: parseInt(e.target.value) };
                                                            setEditingJob({ ...editingJob, settings: { ...editingJob.settings, weights: newWeights, preset: 'Custom' } });
                                                        }}
                                                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
                                            <Shield size={18} className="text-red-500" /> Integrity Control (Proctoring)
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Warning Tolerance</label>
                                                    <div className="flex items-center gap-4">
                                                        <input
                                                            type="number" min="1" max="10"
                                                            value={editingJob.settings.proctoring.maxWarnings}
                                                            onChange={(e) => {
                                                                const val = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                                                                setEditingJob({ ...editingJob, settings: { ...editingJob.settings, proctoring: { ...editingJob.settings.proctoring, maxWarnings: val }, preset: 'Custom' } });
                                                            }}
                                                            className="w-20 p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-bold"
                                                        />
                                                        <span className="text-xs text-slate-400 font-medium">Violations before session self-terminates.</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={editingJob.settings.proctoring.includeInScore}
                                                            onChange={(e) => {
                                                                setEditingJob({ ...editingJob, settings: { ...editingJob.settings, proctoring: { ...editingJob.settings.proctoring, includeInScore: e.target.checked }, preset: 'Custom' } });
                                                            }}
                                                            className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-bold text-slate-700 block">Deduct for Warnings</span>
                                                        <span className="text-[10px] text-slate-400 font-medium">Subtract score for cheating behaviors.</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Detection Sensitivity</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['Low', 'Medium', 'High'].map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => setEditingJob({ ...editingJob, settings: { ...editingJob.settings, proctoring: { ...editingJob.settings.proctoring, sensitivity: s as any }, preset: 'Custom' } })}
                                                            className={`py-2 rounded-lg text-xs font-bold border transition-all ${editingJob.settings.proctoring.sensitivity === s ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-red-200'}`}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="mt-3 text-[10px] text-slate-400 leading-relaxed">
                                                    <span className="font-bold text-red-400 uppercase tracking-tighter mr-1">Note:</span>
                                                    High sensitivity may result in false positives if the candidate is in a poorly lit environment or has reflective eyewear.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- QUESTIONS EDITOR --- */}
                            {jobEditTab === 'questions' && (
                                <div className="space-y-6 overflow-y-auto pr-2">
                                    {editingJob.questions.map((q, idx) => (
                                        <div key={q.id} className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative group animate-fade-in divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
                                            <div className="pb-6">
                                                <div className="flex justify-between items-center mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-slate-900 text-white font-bold w-8 h-8 rounded-lg flex items-center justify-center text-xs shadow-sm shadow-slate-300">#{idx + 1}</span>
                                                        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Question Module</h4>
                                                    </div>
                                                    <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 gap-6">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 transition-colors">Interview Question</label>
                                                        <textarea
                                                            className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm focus:border-indigo-500 outline-none bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition-all min-h-[100px] leading-relaxed font-medium text-slate-800 dark:text-slate-200"
                                                            value={q.text}
                                                            onChange={(e) => handleUpdateQuestion(q.id, 'text', e.target.value)}
                                                            placeholder="Ask anything..."
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 transition-colors">Ideal Reference Answer (For AI Comparison)</label>
                                                        <textarea
                                                            className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm focus:border-indigo-500 outline-none h-24 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition-all leading-relaxed text-slate-800 dark:text-slate-200"
                                                            value={q.referenceAnswer}
                                                            onChange={(e) => handleUpdateQuestion(q.id, 'referenceAnswer', e.target.value)}
                                                            placeholder="Describe the perfect answer here..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="py-6">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Mandatory Verification Points (Key Points)</label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                                    {(q.keyPoints || []).map((kp, kIdx) => (
                                                        <div key={kIdx} className="flex gap-2 group/kp">
                                                            <input
                                                                className="flex-1 border border-slate-100 rounded-lg px-3 py-2 text-xs outline-none bg-slate-50/30 focus:bg-white focus:border-indigo-300 transition-all font-medium"
                                                                value={kp}
                                                                onChange={(e) => handleUpdateKeyPoint(q.id, kIdx, e.target.value)}
                                                                placeholder="Key concept..."
                                                            />
                                                            <button
                                                                onClick={() => handleRemoveKeyPoint(q.id, kIdx)}
                                                                className="text-slate-300 hover:text-red-400 p-2"
                                                            >
                                                                <Plus size={14} className="rotate-45" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => handleAddKeyPoint(q.id)}
                                                        className="border-2 border-dashed border-slate-200 rounded-lg py-2 text-slate-400 flex items-center justify-center gap-2 hover:border-indigo-200 hover:text-indigo-400 transition-all text-xs font-bold"
                                                    >
                                                        <Plus size={14} /> Add Concept
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-slate-400 italic">These point guide the AI to verify specific technical concepts in the candidate's answer.</p>
                                            </div>

                                            <div className="pt-6 grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Difficulty</label>
                                                    <select
                                                        className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none bg-slate-50"
                                                        value={q.difficulty}
                                                        onChange={(e) => handleUpdateQuestion(q.id, 'difficulty', e.target.value)}
                                                    >
                                                        <option value="Easy">Beginner</option>
                                                        <option value="Medium">Intermediate</option>
                                                        <option value="Hard">Advanced</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Category</label>
                                                    <input
                                                        className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none bg-slate-50"
                                                        value={q.topic}
                                                        onChange={(e) => handleUpdateQuestion(q.id, 'topic', e.target.value)}
                                                        placeholder="e.g. React hooks"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={handleAddQuestion} className="w-full py-8 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-600 font-bold hover:bg-white dark:hover:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-3 shadow-sm group">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                                            <Plus size={24} />
                                        </div>
                                        New Interview Question
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- TAB: GLOBAL CONFIG --- */}
                    {activeTab === 'config' && (
                        <div className="max-w-3xl space-y-8 animate-fade-in">
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 transition-colors">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2 transition-colors">
                                        <Activity size={20} className="text-indigo-500" />
                                        System Behavioral Parameters
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">Fine-tune the computer vision and AI logic across all interview sessions.</p>
                                </div>

                                <div className="space-y-10">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block transition-colors">Eye-Tracking Accuracy</label>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium transition-colors">Controls how strict the gaze detection is.</p>
                                            </div>
                                            <span className="font-mono text-lg font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1 rounded-xl shadow-inner shadow-indigo-100/50 dark:shadow-indigo-900/20 transition-colors">{config.eyeTrackingSensitivity}</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="10"
                                            value={config.eyeTrackingSensitivity}
                                            onChange={(e) => handleUpdateConfig('eyeTrackingSensitivity', parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 transition-colors"
                                        />
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                                            <span>Lenient</span>
                                            <span>High Performance</span>
                                            <span>Military Grade</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block transition-colors">Global Evaluation Pressure</label>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium transition-colors">Base multiplier for AI scoring strictness.</p>
                                            </div>
                                            <span className="font-mono text-lg font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1 rounded-xl shadow-inner shadow-indigo-100/50 dark:shadow-indigo-900/20 transition-colors">{config.aiStrictness}</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="10"
                                            value={config.aiStrictness}
                                            onChange={(e) => handleUpdateConfig('aiStrictness', parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                                            <span>Supportive</span>
                                            <span>Neutral</span>
                                            <span>Hyper-Critical</span>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-900 rounded-2xl text-white shadow-xl shadow-indigo-900/10 border border-slate-800">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30">
                                                <Shield size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold mb-1">Local Storage Disclaimer</h4>
                                                <p className="text-sm text-slate-400 leading-relaxed">
                                                    This version uses <code className="text-indigo-300 font-bold">localStorage</code> for session data, PII, and API keys. Because there is no backend, this data is plaintext and accessible to anyone with physical access to this browser.
                                                </p>
                                                <div className="mt-4 flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                                                    <Activity size={14} /> Production recommendation: Deploy with PostgreSQL/Supabase
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-3xl opacity-50">
                                <p className="text-sm text-slate-400 font-medium">Advanced LLM Routing & Prompt Engineering controls coming soon.</p>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};
