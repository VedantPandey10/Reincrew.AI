import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, UserCircle, ShieldCheck, ArrowRight, ChevronRight, Zap, Target, BarChart3, Globe, Lock, Cpu, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { PricingSection } from './PricingSection';

interface LandingPageProps {
  onCandidateLogin: () => void;
  onAdminLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onCandidateLogin, onAdminLogin }) => {
  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      {/* Background Orbs */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ willChange: 'transform' }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle,rgba(79,70,229,0.15)_0%,transparent_70%)] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 60, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{ willChange: 'transform' }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(37,99,235,0.15)_0%,transparent_70%)] rounded-full" 
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-8 flex justify-between items-center bg-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <BrainCircuit className="text-white" size={24} />
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">REICREW<span className="text-indigo-500">.AI</span></span>
        </div>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <button 
            onClick={onAdminLogin}
            className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-indigo-500 transition-colors hidden md:block"
          >
            Admin Node
          </button>
          <button 
            onClick={onCandidateLogin}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
          >
            Start Journey
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8"
          >
            <Sparkles size={14} className="text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Next-Gen Interview Intelligence</span>
          </motion.div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-slate-900 dark:text-white">
            EVALUATING <br />
            <span className="shimmer-text">HUMAN POTENTIAL</span>
          </h1>
          
          <p className="text-lg md:text-xl text-text-main/80 dark:text-slate-400 max-w-2xl mx-auto mb-12 font-medium">
            Deploy advanced behavioral analysis to discover top talent. Reicrew.AI is the neural nexus for modern recruitment.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCandidateLogin}
              className="px-10 py-5 bg-indigo-600 rounded-[2rem] text-white font-black text-lg flex items-center gap-4 shadow-2xl shadow-indigo-600/30 group hover:bg-indigo-700 transition-all"
            >
              Start Candidate Journey <ArrowRight className="group-hover:translate-x-2 transition-all" />
            </motion.button>
            <button className="px-8 py-5 rounded-[2rem] text-text-main dark:text-slate-300 font-bold border border-slate-200/20 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
              Learn How it Works
            </button>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { icon: <Zap />, title: "Neural Speed", desc: "Instantaneous evaluation with high-fidelity predictive modeling." },
            { icon: <Target />, title: "Precision Proctering", desc: "Advanced blink and gaze tracking for total assessment integrity." },
            { icon: <BarChart3 />, title: "Quantum Analytics", desc: "Granular data visualizations explaining the 'why' behind every score." }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-10 rounded-[3rem]"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400">
                {feature.icon}
              </div>
              <h3 className="text-xl font-black text-text-main mb-4 uppercase tracking-tighter">{feature.title}</h3>
              <p className="text-sm font-medium text-text-muted leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Footer */}
      <footer className="py-20 border-t border-slate-900/10 dark:border-white/5 relative z-10 bg-slate-50/30 dark:bg-transparent">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
              <BrainCircuit className="text-indigo-500" size={18} />
            </div>
            <span className="text-sm font-black tracking-tighter text-slate-900 dark:text-white uppercase transition-colors">Reicrew Intelligence Node</span>
          </div>
          <div className="flex gap-8">
            <button className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-indigo-500 transition-colors">Privacy</button>
            <button className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-indigo-500 transition-colors">Protocol</button>
            <button className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-indigo-500 transition-colors">Network</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
