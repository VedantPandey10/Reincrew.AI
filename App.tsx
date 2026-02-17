import * as React from 'react';
const { useState, useEffect } = React;
import { LoginScreen } from './components/LoginScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { CameraCheckScreen } from './components/CameraCheckScreen';
import { InterviewScreen } from './components/InterviewScreen';
import { SummaryScreen } from './components/SummaryScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { Candidate, EvaluationResult, WarningEvent } from './types';
import { StorageService } from './services/storageService';
import { BrainCircuit, Moon, Sun } from 'lucide-react';
import { AdminLogin } from './components/AdminLogin';
import { useTheme } from './context/ThemeContext';

enum AppView {
  LOGIN = 'LOGIN',
  PROFILE_SETUP = 'PROFILE_SETUP',
  CAMERA_CHECK = 'CAMERA_CHECK',
  INTERVIEW = 'INTERVIEW',
  SUMMARY = 'SUMMARY',
  ADMIN = 'ADMIN'
}

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [sessionScore, setSessionScore] = useState<number>(0);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    console.log("Environment check:", {
      VITE_API_KEY: import.meta.env.VITE_API_KEY,
      ALL_ENV: import.meta.env
    });
    if (!import.meta.env.VITE_API_KEY) {
      console.warn("Missing VITE_API_KEY in environment variables.");
    }
  }, []);

  const handleLogin = (data: Candidate) => {
    setCandidate(data);
    setView(AppView.PROFILE_SETUP);
  };

  const handleProfileComplete = (updatedCandidate: Candidate) => {
    setCandidate(updatedCandidate);
    if (updatedCandidate.accessId) {
      StorageService.saveUserProfile(updatedCandidate);
    }
    setView(AppView.CAMERA_CHECK);
  };

  const handleCameraCheckComplete = () => {
    setView(AppView.INTERVIEW);
  };

  const handleInterviewComplete = (finalResults: EvaluationResult[], warnings: WarningEvent[], status: 'COMPLETED' | 'TERMINATED') => {
    setResults(finalResults);
    let weightedScore = 0;

    if (candidate) {
      const totalQuestions = finalResults.length || 1;

      // Default Weights
      let weights = { concept: 0.6, grammar: 0.15, fluency: 0.15, camera: 0.1 };
      let includeWarnings = true;

      if (candidate.jobPostId) {
        const job = StorageService.getJobById(candidate.jobPostId);
        if (job && job.settings) {
          const w = job.settings.weights;
          const total = w.concept + w.grammar + w.fluency + w.camera || 100;
          weights = {
            concept: w.concept / total,
            grammar: w.grammar / total,
            fluency: w.fluency / total,
            camera: w.camera / total
          };
          includeWarnings = job.settings.proctoring.includeInScore;
        }
      }

      const avgContent = finalResults.reduce((acc, r) => acc + (r.contentScore || 0), 0) / totalQuestions;
      const avgGrammar = finalResults.reduce((acc, r) => acc + (r.grammarScore || 0), 0) / totalQuestions;
      const avgFluency = finalResults.reduce((acc, r) => acc + (r.fluencyScore || 0), 0) / totalQuestions;
      const avgConf = (finalResults.reduce((acc, r) => acc + (r.confidenceScore || 50), 0) / totalQuestions) / 10;

      weightedScore = (avgContent * 10 * weights.concept) +
        (avgGrammar * 10 * weights.grammar) +
        (avgFluency * 10 * weights.fluency) +
        (avgConf * 10 * weights.camera);

      if (includeWarnings && warnings.length > 0) {
        const penalty = warnings.length * 5;
        weightedScore = Math.max(0, weightedScore - penalty);
      }

      weightedScore = Math.min(100, Math.round(weightedScore));

      StorageService.saveSession({
        id: (candidate.accessId || 'guest') + '-' + Date.now(),
        candidate: candidate,
        date: new Date().toISOString(),
        status: status,
        overallScore: weightedScore,
        durationSeconds: finalResults.length * 120,
        results: finalResults,
        warnings: warnings
      });
    }

    setSessionScore(weightedScore);
    setView(AppView.SUMMARY);
  };

  const handleRestart = (shouldLogout: boolean = false) => {
    if (shouldLogout) {
      setCandidate(null);
      setView(AppView.LOGIN);
    } else {
      setView(AppView.CAMERA_CHECK);
    }
    setResults([]);
  };

  const showHeader = view !== AppView.ADMIN;

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden font-sans transition-colors duration-300 ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
      {showHeader && (
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex-none flex items-center justify-between shadow-sm z-50 h-16 sticky top-0 transition-colors">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
            <BrainCircuit size={28} strokeWidth={2.5} className="animate-pulse-slow" />
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Reicrew AI</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              {view === AppView.LOGIN && "Welcome"}
              {view === AppView.PROFILE_SETUP && "Identity Verification"}
              {view === AppView.CAMERA_CHECK && "System Check"}
              {view === AppView.INTERVIEW && `Interviewing: ${candidate?.name}`}
              {view === AppView.SUMMARY && "Performance Review"}
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 relative overflow-hidden">
        {view === AppView.LOGIN && (
          <LoginScreen
            onStart={handleLogin}
            onAdminLogin={() => setShowAdminLogin(true)}
          />
        )}

        {showAdminLogin && (
          <AdminLogin
            onSuccess={() => {
              setIsAdminAuthenticated(true);
              setShowAdminLogin(false);
              setView(AppView.ADMIN);
            }}
            onCancel={() => setShowAdminLogin(false)}
          />
        )}

        {view === AppView.PROFILE_SETUP && candidate && (
          <ProfileSetup
            initialData={candidate}
            onComplete={handleProfileComplete}
          />
        )}

        {view === AppView.CAMERA_CHECK && (
          <CameraCheckScreen
            onComplete={handleCameraCheckComplete}
          />
        )}

        {view === AppView.INTERVIEW && candidate && (
          <InterviewScreen
            candidate={candidate}
            onComplete={handleInterviewComplete}
          />
        )}

        {view === AppView.SUMMARY && candidate && (
          <SummaryScreen
            candidate={candidate}
            results={results}
            overallScore={sessionScore}
            onRestart={handleRestart}
          />
        )}

        {view === AppView.ADMIN && (
          isAdminAuthenticated ? (
            <AdminDashboard onLogout={() => {
              setIsAdminAuthenticated(false);
              setView(AppView.LOGIN);
            }} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-slate-500">Access Denied. Please login as admin.</p>
              <button onClick={() => setView(AppView.LOGIN)} className="text-indigo-600 font-bold">Return to Login</button>
            </div>
          )
        )}
      </main>
    </div>
  );
}
