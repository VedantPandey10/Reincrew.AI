import React, { useState, useMemo } from 'react';
import { Candidate, EvaluationResult } from '../types';
import { ShieldCheck, CheckCircle, LogOut, RefreshCw, TrendingUp, TrendingDown, AlertCircle, Target, BarChart3, Award } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface SummaryScreenProps {
    candidate: Candidate;
    results: EvaluationResult[];
    overallScore: number;
    onRestart: (shouldLogout?: boolean) => void;
}

// ── SVG Radar Chart Component ───────────────────────────
interface RadarChartProps {
    labels: string[];
    values: number[]; // 0-10
    maxValue?: number;
    size?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ labels, values, maxValue = 10, size = 260 }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const center = size / 2;
    const radius = size / 2 - 40;
    const levels = 5;
    const angleStep = (Math.PI * 2) / labels.length;

    const getPoint = (index: number, value: number) => {
        const angle = angleStep * index - Math.PI / 2;
        const r = (value / maxValue) * radius;
        return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
    };

    const gridPolygons = Array.from({ length: levels }, (_, level) => {
        const frac = (level + 1) / levels;
        const points = labels.map((_, i) => {
            const p = getPoint(i, maxValue * frac);
            return `${p.x},${p.y}`;
        }).join(' ');
        return points;
    });

    const dataPoints = values.map((v, i) => getPoint(i, v));
    const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

    const gridStroke = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';
    const axisStroke = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';
    const textFill = isDark ? '#94a3b8' : '#475569';
    const dataFill = isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)';

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto overflow-visible">
            {/* Grid */}
            {gridPolygons.map((points, i) => (
                <polygon key={i} points={points} fill="none" stroke={gridStroke} strokeWidth="1" opacity={isDark ? 0.3 : 0.5} />
            ))}
            {/* Axis lines */}
            {labels.map((_, i) => {
                const p = getPoint(i, maxValue);
                return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke={axisStroke} strokeWidth="1" />;
            })}
            {/* Data area */}
            <polygon points={dataPolygon} fill={dataFill} stroke="#6366f1" strokeWidth="2.5" />
            {/* Data dots */}
            {dataPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke={isDark ? '#1e293b' : 'white'} strokeWidth="2" />
            ))}
            {/* Labels */}
            {labels.map((label, i) => {
                const p = getPoint(i, maxValue + 12);
                return (
                    <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
                        fontSize="11" fontWeight="700" fill={textFill}
                        className="transition-colors duration-300"
                    >{label}</text>
                );
            })}
        </svg>
    );
};

// ── Donut/Pie Chart Component ───────────────────────────
interface DonutChartProps {
    segments: { label: string; value: number; color: string }[];
    size?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ segments, size = 180 }) => {
    const { theme } = useTheme();
    const total = segments.reduce((a, b) => a + b.value, 0);
    const center = size / 2;
    const outerR = size / 2 - 10;
    const innerR = outerR * 0.55;
    let cumulativeAngle = -Math.PI / 2;

    const arcs = segments.map((seg) => {
        const angleSpan = (seg.value / total) * Math.PI * 2;
        const startAngle = cumulativeAngle;
        cumulativeAngle += angleSpan;
        const endAngle = cumulativeAngle;

        const x1o = center + outerR * Math.cos(startAngle);
        const y1o = center + outerR * Math.sin(startAngle);
        const x2o = center + outerR * Math.cos(endAngle);
        const y2o = center + outerR * Math.sin(endAngle);

        const x1i = center + innerR * Math.cos(endAngle);
        const y1i = center + innerR * Math.sin(endAngle);
        const x2i = center + innerR * Math.cos(startAngle);
        const y2i = center + innerR * Math.sin(startAngle);

        const largeArc = angleSpan > Math.PI ? 1 : 0;

        const d = [
            `M ${x1o} ${y1o}`,
            `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
            `L ${x1i} ${y1i}`,
            `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i}`,
            'Z'
        ].join(' ');

        return { ...seg, d };
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto overflow-visible">
            {arcs.map((arc, i) => (
                <path key={i} d={arc.d} fill={arc.color} stroke={theme === 'dark' ? '#1e293b' : 'white'} strokeWidth="2" className="transition-all duration-500 hover:opacity-80" />
            ))}
            {/* Center label */}
            <text x={center} y={center - 8} textAnchor="middle" fontSize="20" fontWeight="800" fill={theme === 'dark' ? '#f8fafc' : '#1e293b'} className="transition-colors">
                {Math.round(total / segments.length)}
            </text>
            <text x={center} y={center + 10} textAnchor="middle" fontSize="10" fontWeight="600" fill={theme === 'dark' ? '#94a3b8' : '#64748b'} className="transition-colors uppercase tracking-widest">
                AVG SCORE
            </text>
        </svg>
    );
};

// ── Score Bar ────────────────────────────────────────────
const ScoreBar: React.FC<{ label: string; score: number; max?: number; color: string }> = ({ label, score, max = 10, color }) => {
    const pct = Math.round((score / max) * 100);
    return (
        <div>
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">{label}</span>
                <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5" style={{ color }}>{score}/{max}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-white/5">
                <div
                    className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
};

// ── Main Component ──────────────────────────────────────
const Container = ({ children }: { children?: React.ReactNode }) => (
    <div className="min-h-full w-full flex flex-col items-center bg-transparent relative overflow-y-auto">
        <div className="w-full h-full p-6 md:p-10 flex flex-col items-center scroll-smooth z-10">
            {children}
        </div>
    </div>
);

export const SummaryScreen: React.FC<SummaryScreenProps> = ({ candidate, results, overallScore, onRestart }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'questions'>('overview');

    // ── Computed Metrics ────────────────────────────────────
    const metrics = useMemo(() => {
        if (!results.length) return null;

        const avgContent = results.reduce((s, r) => s + r.contentScore, 0) / results.length;
        const avgGrammar = results.reduce((s, r) => s + r.grammarScore, 0) / results.length;
        const avgFluency = results.reduce((s, r) => s + r.fluencyScore, 0) / results.length;
        const avgConfidence = results.reduce((s, r) => s + r.confidenceScore, 0) / results.length;
        const avgCommunication = results.reduce((s, r) => s + (r.communicationScore || 0), 0) / results.length;

        const categories = [
            { key: 'content', label: 'Content Knowledge', avg: avgContent, icon: '📚' },
            { key: 'grammar', label: 'Grammar & Language', avg: avgGrammar, icon: '✍️' },
            { key: 'fluency', label: 'Fluency & Clarity', avg: avgFluency, icon: '🗣️' },
            { key: 'confidence', label: 'Visual Confidence', avg: avgConfidence / 10, icon: '👁️' },
            { key: 'communication', label: 'Communication', avg: avgCommunication || ((avgGrammar + avgFluency) / 2), icon: '💬' },
        ];

        const sorted = [...categories].sort((a, b) => a.avg - b.avg);
        const strengths = sorted.filter(c => c.avg >= 7).reverse().slice(0, 3);
        const weaknesses = sorted.filter(c => c.avg < 7).slice(0, 3);

        const allMissing = results.flatMap(r => r.missingKeyPoints || []);
        const uniqueMissing = [...new Set(allMissing)];

        const passCount = results.filter(r => r.verdict === 'Pass').length;
        const failCount = results.filter(r => r.verdict === 'Fail').length;

        return {
            avgContent, avgGrammar, avgFluency, avgConfidence: avgConfidence / 10, avgCommunication: avgCommunication || ((avgGrammar + avgFluency) / 2),
            categories, strengths, weaknesses, uniqueMissing, passCount, failCount,
            borderlineCount: results.length - passCount - failCount,
        };
    }, [results]);

    const getGrade = (score: number) => {
        if (score >= 90) return { letter: 'A+', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' };
        if (score >= 80) return { letter: 'A', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' };
        if (score >= 70) return { letter: 'B+', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.2)' };
        if (score >= 60) return { letter: 'B', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.2)' };
        if (score >= 50) return { letter: 'C', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' };
        if (score >= 40) return { letter: 'D', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.2)' };
        return { letter: 'F', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' };
    };

    const grade = getGrade(overallScore);

    if (!metrics) {
        return (
            <div className="h-full w-full flex items-center justify-center p-4">
                <div className="glass-card bg-white/40 dark:bg-slate-900/40 p-12 rounded-[2.5rem] border border-white/20 dark:border-white/5 text-center max-w-md shadow-2xl">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No results to display.</p>
                </div>
            </div>
        );
    }

    const segmentColors = ['#818cf8', '#22d3ee', '#fbbf24', '#34d399', '#f472b6'];

    return (
        <div className="h-full w-full relative overflow-hidden transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
            {/* Background Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-500/10 dark:bg-brand-500/5 blur-[130px] rounded-full animate-morph pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[130px] rounded-full animate-morph-fast pointer-events-none"></div>

            <Container>
                <div className="w-full max-w-4xl animate-fade-in space-y-8">

                    {/* ── Hero Score Card ───────────────────────────────── */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 text-white p-10 rounded-[3rem] shadow-2xl border border-white/20">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.8),transparent_70%)]"></div>
                        <div className="relative flex flex-col md:flex-row items-center gap-10">
                            <div className="flex-1 text-center md:text-left">
                                <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-white/10">
                                    Assessment Analytics Report
                                </span>
                                <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">{candidate.name}</h1>
                                <p className="text-brand-100/70 text-base font-medium">{candidate.position} {candidate.company ? `• ${candidate.company}` : ''}</p>

                                <div className="flex flex-wrap items-center gap-6 mt-10 justify-center md:justify-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                                            <CheckCircle size={18} className="text-emerald-300" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-200/60 leading-none mb-1">Passed</p>
                                            <p className="text-sm font-black">{metrics.passCount}</p>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                                            <BarChart3 size={18} className="text-brand-300" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-200/60 leading-none mb-1">Assessment Units</p>
                                            <p className="text-sm font-black">{results.length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="w-36 h-36 rounded-full flex flex-col items-center justify-center border-8 border-white/10 shadow-2xl relative bg-white/5 backdrop-blur-md"
                                        style={{ borderColor: grade.border }}>
                                        <span className="text-5xl font-black italic tracking-tighter" style={{ color: grade.color }}>{grade.letter}</span>
                                        <div className="mt-1 flex items-baseline">
                                            <span className="text-lg font-black">{Math.round(overallScore)}</span>
                                            <span className="text-[10px] opacity-40 ml-0.5 font-bold">/100</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Tier Classification</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Tab Navigation ────────────────────────────────── */}
                    <div className="flex justify-center md:justify-start p-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/40 dark:border-white/5 w-fit shadow-sm mx-auto md:mx-0">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-8 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-widest flex items-center gap-3 ${activeTab === 'overview'
                                ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                                : 'text-slate-500 dark:text-slate-400 hover:text-brand-500 active:scale-95'
                                }`}
                        >
                            <BarChart3 size={14} />
                            Metric Insights
                        </button>
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={`px-8 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-widest flex items-center gap-3 ${activeTab === 'questions'
                                ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                                : 'text-slate-500 dark:text-slate-400 hover:text-brand-500 active:scale-95'
                                }`}
                        >
                            <Target size={14} />
                            Question Analysis
                        </button>
                    </div>

                    {/* ── OVERVIEW TAB ──────────────────────────────────── */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-fade-in">

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Radar Chart */}
                                <div className="glass-card bg-white/60 dark:bg-slate-900/60 p-8 rounded-[2.5rem] border border-white/40 dark:border-slate-800/40 shadow-xl transition-all hover:shadow-indigo-500/10">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                                                <Target size={16} />
                                            </div>
                                            Capability Radar
                                        </h3>
                                        <Award size={16} className="text-slate-300 dark:text-slate-700" />
                                    </div>
                                    <RadarChart
                                        labels={['Content', 'Grammar', 'Fluency', 'Confidence', 'Communication']}
                                        values={[
                                            metrics.avgContent,
                                            metrics.avgGrammar,
                                            metrics.avgFluency,
                                            metrics.avgConfidence,
                                            metrics.avgCommunication,
                                        ]}
                                    />
                                </div>

                                {/* Donut Chart + Score Distribution */}
                                <div className="glass-card bg-white/60 dark:bg-slate-900/60 p-8 rounded-[2.5rem] border border-white/40 dark:border-slate-800/40 shadow-xl transition-all hover:shadow-indigo-500/10">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                                <BarChart3 size={16} />
                                            </div>
                                            Weightage Balance
                                        </h3>
                                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 uppercase tracking-widest">
                                            Avg 10/10
                                        </div>
                                    </div>
                                    <div className="dark:mix-blend-lighten">
                                        <DonutChart
                                            segments={[
                                                { label: 'Content', value: metrics.avgContent, color: segmentColors[0] },
                                                { label: 'Grammar', value: metrics.avgGrammar, color: segmentColors[1] },
                                                { label: 'Fluency', value: metrics.avgFluency, color: segmentColors[2] },
                                                { label: 'Confidence', value: metrics.avgConfidence, color: segmentColors[3] },
                                                { label: 'Communication', value: metrics.avgCommunication, color: segmentColors[4] },
                                            ]}
                                        />
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                                        {['Content', 'Grammar', 'Fluency', 'Confidence', 'Communication'].map((label, i) => (
                                            <div key={label} className="flex items-center gap-2 group">
                                                <div className="w-2 h-2 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: segmentColors[i] }} />
                                                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Scores Card */}
                            <div className="glass-card bg-white/60 dark:bg-slate-900/60 p-10 rounded-[2.5rem] border border-white/40 dark:border-white/5 shadow-xl transition-colors">
                                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-8">Granular Performance Metrics</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                    <ScoreBar label="📚 Content Knowledge" score={+metrics.avgContent.toFixed(1)} color="#818cf8" />
                                    <ScoreBar label="✍️ Grammar & Style" score={+metrics.avgGrammar.toFixed(1)} color="#22d3ee" />
                                    <ScoreBar label="🗣️ Oral Communication" score={+metrics.avgFluency.toFixed(1)} color="#fbbf24" />
                                    <ScoreBar label="👁️ Visual Projection" score={+metrics.avgConfidence.toFixed(1)} color="#34d399" />
                                    <div className="md:col-span-2">
                                        <ScoreBar label="💬 Interactive Sync" score={+metrics.avgCommunication.toFixed(1)} color="#f472b6" />
                                    </div>
                                </div>
                            </div>

                            {/* Strengths & Weaknesses */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Strengths */}
                                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-8 rounded-[2.5rem] border border-emerald-200/50 dark:border-emerald-500/10 backdrop-blur-sm">
                                    <h3 className="text-xs font-black text-emerald-800 dark:text-emerald-400 mb-6 flex items-center gap-3 uppercase tracking-widest">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                            <TrendingUp size={16} />
                                        </div>
                                        Core Strengths
                                    </h3>
                                    {metrics.strengths.length > 0 ? (
                                        <div className="space-y-4">
                                            {metrics.strengths.map(s => (
                                                <div key={s.key} className="flex items-center gap-4 bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-white/40 dark:border-white/5 shadow-sm">
                                                    <span className="text-2xl">{s.icon}</span>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-white tracking-tight">{s.label}</p>
                                                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400/80 uppercase tracking-widest mt-0.5">{s.avg.toFixed(1)}/10 Elite Proficiency</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium italic">Continuity in effort will yield distinctive strengths.</p>
                                    )}
                                </div>

                                {/* Areas to Improve */}
                                <div className="bg-amber-50/50 dark:bg-amber-900/10 p-8 rounded-[2.5rem] border border-amber-200/50 dark:border-amber-500/10 backdrop-blur-sm">
                                    <h3 className="text-xs font-black text-amber-800 dark:text-amber-400 mb-6 flex items-center gap-3 uppercase tracking-widest">
                                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                            <TrendingDown size={16} />
                                        </div>
                                        Development Nodes
                                    </h3>
                                    {metrics.weaknesses.length > 0 ? (
                                        <div className="space-y-4">
                                            {metrics.weaknesses.map(w => (
                                                <div key={w.key} className="flex items-center gap-4 bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-white/40 dark:border-white/5 shadow-sm">
                                                    <span className="text-2xl">{w.icon}</span>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-white tracking-tight">{w.label}</p>
                                                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400/80 uppercase tracking-widest mt-0.5">{w.avg.toFixed(1)}/10 Optimization Required</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium italic">Exceptional! All nodes within optimal parameters.</p>
                                    )}
                                </div>
                            </div>

                            {/* Missing Key Concepts */}
                            {metrics.uniqueMissing.length > 0 && (
                                <div className="glass-card bg-white/60 dark:bg-slate-900/60 p-10 rounded-[2.5rem] border border-white/40 dark:border-white/5 shadow-xl transition-colors">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                                            <AlertCircle size={16} />
                                        </div>
                                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Conceptual Gap Recognition</h3>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-wider">Integrate the following modules to solidify subject matter expertise:</p>
                                    <div className="flex flex-wrap gap-2.5">
                                        {metrics.uniqueMissing.map((point, i) => (
                                            <span key={i} className="px-5 py-2 bg-brand-500/5 text-brand-700 dark:text-brand-300 border border-brand-500/10 dark:border-brand-500/20 rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-brand-500/10 transition-colors">
                                                {point}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Personalized Recommendations */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950/20 p-10 rounded-[2.5rem] border border-brand-100 dark:border-white/5 shadow-xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-3xl rounded-full"></div>
                                <h3 className="text-xs font-black text-brand-800 dark:text-brand-400 mb-8 flex items-center gap-3 uppercase tracking-widest">
                                    <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center">
                                        <Award size={16} />
                                    </div>
                                    Growth Trajectory Strategy
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { condition: metrics.avgContent < 7, icon: '📌', text: 'Deepen technical architecture understanding. Practice detailing complex workflows with high semantic precision.' },
                                        { condition: metrics.avgGrammar < 7, icon: '✍️', text: 'Enhance syntactical variety and industry-specific lexicon. Refine the clarity of abstract technical explanations.' },
                                        { condition: metrics.avgFluency < 7, icon: '🗣️', text: 'Optimize verbal delivery pace. Minimize transitional hesitations to project total subject authority.' },
                                        { condition: metrics.avgConfidence < 7, icon: '👁️', text: 'Calibrate non-verbal projection. Maintain persistent visual engagement to strengthen perceived reliability.' }
                                    ].filter(tip => tip.condition).map((tip, i) => (
                                        <div key={i} className="flex gap-4 p-5 bg-white/40 dark:bg-white/5 rounded-2xl border border-white/60 dark:border-white/5">
                                            <span className="text-xl shrink-0">{tip.icon}</span>
                                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{tip.text}</p>
                                        </div>
                                    ))}
                                    {overallScore >= 70 && (
                                        <div className="md:col-span-2 flex gap-4 p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                            <span className="text-2xl shrink-0">🌟</span>
                                            <div>
                                                <p className="text-emerald-800 dark:text-emerald-400 font-black text-sm uppercase tracking-tight mb-1">Elite Performance Identified</p>
                                                <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-400/60 leading-relaxed">Your performance ranks within the top percentiles. Focus on ultra-fine optimizations to reach mastery level.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── QUESTIONS TAB ─────────────────────────────────── */}
                    {activeTab === 'questions' && (
                        <div className="space-y-6 animate-fade-in">
                            {results.map((r, i) => (
                                <div key={i} className="glass-card bg-white/60 dark:bg-slate-900/60 p-8 rounded-[2.5rem] border border-white/40 dark:border-white/5 shadow-lg transition-colors overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <span className="text-8xl font-black italic">{i + 1}</span>
                                    </div>

                                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 relative z-10">
                                        <div className="flex-1">
                                            <span className="text-[10px] font-black text-brand-500 dark:text-brand-400 uppercase tracking-[0.3em] mb-2 block">
                                                Assessment Block {i + 1}
                                            </span>
                                            <h4 className="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-snug">
                                                {r.questionText}
                                            </h4>
                                        </div>
                                        <div className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest border shadow-sm transition-all animate-fade-in
                                            ${r.verdict === 'Pass' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' :
                                                r.verdict === 'Fail' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20' :
                                                    'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                                            }`}>
                                            {r.verdict} Efficiency
                                        </div>
                                    </div>

                                    {/* Question Score Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                        {[
                                            { label: 'Content', score: r.contentScore, color: '#818cf8', icon: '📚' },
                                            { label: 'Grammar', score: r.grammarScore, color: '#22d3ee', icon: '✍️' },
                                            { label: 'Fluency', score: r.fluencyScore, color: '#fbbf24', icon: '🗣️' },
                                            { label: 'Visual', score: r.confidenceScore, color: '#34d399', icon: '👁️' },
                                        ].map(s => (
                                            <div key={s.label} className="bg-slate-50/50 dark:bg-white/5 p-5 rounded-3xl text-center border border-slate-100 dark:border-white/5 group hover:bg-white dark:hover:bg-white/10 transition-all">
                                                <span className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">{s.label}</span>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className="text-2xl font-black italic tracking-tighter" style={{ color: s.color }}>{s.score}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">/10</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Feedback Block */}
                                    <div className="bg-slate-100/50 dark:bg-slate-950/40 p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-brand-500/20"></div>
                                        <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">AI Diagnostic Feedback</p>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic group-hover:dark:text-white transition-colors">
                                            "{r.feedback}"
                                        </p>
                                    </div>

                                    {/* Concept Nodes */}
                                    {(r.matchedKeyPoints?.length > 0 || r.missingKeyPoints?.length > 0) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                            {r.matchedKeyPoints?.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400/70 uppercase tracking-widest">Validated Concepts</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {r.matchedKeyPoints.map((k, j) => (
                                                            <span key={j} className="px-3 py-1 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 rounded-xl text-[10px] font-bold border border-emerald-500/10">
                                                                {k}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {r.missingKeyPoints?.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                                        <p className="text-[10px] font-black text-red-600 dark:text-red-400/70 uppercase tracking-widest">Optimizable Nodes</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {r.missingKeyPoints.map((k, j) => (
                                                            <span key={j} className="px-3 py-1 bg-red-500/5 text-red-700 dark:text-red-300 rounded-xl text-[10px] font-bold border border-red-500/10">
                                                                {k}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Action Buttons ────────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-16 mb-20">
                        <button
                            onClick={() => onRestart(false)}
                            className="w-full sm:w-auto px-10 py-5 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm rounded-[2rem] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-brand-500/40 uppercase tracking-[0.2em] active:scale-95 group"
                        >
                            <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                            Initiate New Assessment
                        </button>
                        <button
                            onClick={() => onRestart(true)}
                            className="w-full sm:w-auto px-10 py-5 bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-black text-sm rounded-[2rem] border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] active:scale-95"
                        >
                            <LogOut size={20} />
                            Terminate Session
                        </button>
                    </div>

                </div>
            </Container>
        </div>
    );
};