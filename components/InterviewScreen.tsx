
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Candidate, Question, InterviewStatus, EvaluationResult, VisualMetrics, WarningEvent, RoleSettings } from '../types';
import { startInterview, submitAnswer } from '../services/apiService';
import { useSpeech } from '../hooks/useSpeech';
import { useFullscreenLockdown, LockdownViolation } from '../hooks/useFullscreenLockdown';
import { CameraMonitor } from './CameraMonitor';
import { Mic, Volume2, ShieldAlert, ShieldCheck, Loader2, AlertTriangle, Maximize, Lock, ArrowRight } from 'lucide-react';
import { VisualizerOrb } from './VisualizerOrb';

interface InterviewScreenProps {
  candidate: Candidate;
  onComplete: (results: EvaluationResult[], warnings: WarningEvent[], status: 'COMPLETED' | 'TERMINATED') => void;
}

const MemoizedCameraMonitor = React.memo(CameraMonitor);

export const InterviewScreen: React.FC<InterviewScreenProps> = ({ candidate, onComplete }) => {
  const [status, setStatus] = useState<InterviewStatus>(InterviewStatus.IDLE);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [processingMsg, setProcessingMsg] = useState('Evaluating answer...');
  const [voicePulse, setVoicePulse] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [settings, setSettings] = useState<RoleSettings | null>(null);

  const warningLogRef = useRef<WarningEvent[]>([]);
  const statusRef = useRef<InterviewStatus>(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const [visualMetrics, setVisualMetrics] = useState<VisualMetrics>({
    isPresent: true,
    isLookingAtCamera: true,
    currentExpression: 'Neutral',
    confidenceLevel: 50,
    headPose: 'FORWARD',
    isLookingDown: false,
    isTalking: false,
    suspectedPhoneUse: false,
    suspicionLevel: 0,
  });

  const {
    isListening,
    transcript,
    resetTranscript,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  } = useSpeech();

  // ─── Fullscreen Lockdown ───────────────────────────────────
  const isLockdownActive = isCameraReady && status !== InterviewStatus.IDLE && status !== InterviewStatus.LOCKED;

  const handleLockdownViolation = useCallback((violation: LockdownViolation) => {
    if (statusRef.current === InterviewStatus.LOCKED) return;

    const warningType = violation.type === 'TAB_SWITCH' ? 'TAB_SWITCH' : 'FULLSCREEN_EXIT';
    warningLogRef.current.push({
      timestamp: violation.timestamp,
      type: warningType,
      message: violation.message,
    });
  }, []);

  const handleLockdownTerminate = useCallback(() => {
    if (statusRef.current === InterviewStatus.LOCKED) return;

    statusRef.current = InterviewStatus.LOCKED;
    setStatus(InterviewStatus.LOCKED);
    stopListening();
    stopSpeaking();
    localStorage.setItem(`blocked_${candidate.accessId}`, 'true');

    setTimeout(() => {
      onComplete(results, warningLogRef.current, 'TERMINATED');
    }, 3000);
  }, [stopListening, stopSpeaking, results, onComplete, candidate.accessId]);

  const {
    isFullscreen,
    violationCount,
    showViolationOverlay,
    violationMessage,
    enterFullscreen,
    forceExitFullscreen,
    dismissViolationOverlay,
  } = useFullscreenLockdown({
    enabled: isLockdownActive,
    onViolation: handleLockdownViolation,
    onTerminate: handleLockdownTerminate,
    maxViolations: settings?.proctoring.maxWarnings || 3,
    graceMs: 1500,
  });

  // ─── Interview Flow ─────────────────────────────────────────
  useEffect(() => {
    if (isCameraReady && status === InterviewStatus.IDLE) {
      const init = async () => {
        // Auto-enter fullscreen when interview begins
        await enterFullscreen();
        setStatus(InterviewStatus.LOADING_QUESTION);
        const { question, totalQuestions, settings: loadedSettings } = await startInterview(candidate);
        setCurrentQuestion(question);
        setTotalQuestions(totalQuestions);
        if (loadedSettings) setSettings(loadedSettings);
        setStatus(InterviewStatus.ASKING);
      };
      init();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraReady]);

  useEffect(() => {
    if (status === InterviewStatus.ASKING && currentQuestion) {
      resetTranscript();
      setLiveTranscript('');

      speak(currentQuestion.text, {
        onBoundary: () => {
          setVoicePulse(p => p + 1);
        },
        onEnd: () => {
          if (statusRef.current !== InterviewStatus.LOCKED) {
            setStatus(InterviewStatus.LISTENING);
          }
        }
      });
    }
  }, [status, currentQuestion, speak, resetTranscript]);

  useEffect(() => {
    if (status === InterviewStatus.LISTENING) {
      startListening();
    }
  }, [status, startListening]);

  useEffect(() => {
    if (status === InterviewStatus.LISTENING && isListening) {
      setLiveTranscript(transcript);
      const lower = transcript.toLowerCase();
      if (lower.includes('please repeat') || lower.includes('repeat question')) {
        stopListening();
        resetTranscript();
        setLiveTranscript('');
        setStatus(InterviewStatus.ASKING);
      }
    }
  }, [transcript, status, isListening, stopListening, resetTranscript]);

  // ─── Camera Warning Handler ────────────────────────────────
  const handleCameraWarning = useCallback((count: number) => {
    if (statusRef.current === InterviewStatus.LOCKED) return;

    warningLogRef.current.push({
      timestamp: new Date().toISOString(),
      type: 'GAZE',
      message: `Strike ${count}: Loss of eye contact.`
    });

    const maxWarnings = settings?.proctoring.maxWarnings || 3;
    const totalWarnings = warningLogRef.current.length;

    if (totalWarnings >= maxWarnings) {
      statusRef.current = InterviewStatus.LOCKED;
      setStatus(InterviewStatus.LOCKED);
      stopListening();
      stopSpeaking();
      localStorage.setItem(`blocked_${candidate.accessId}`, 'true');
      forceExitFullscreen();

      setTimeout(() => {
        onComplete(results, warningLogRef.current, 'TERMINATED');
      }, 3000);
    }
  }, [stopListening, stopSpeaking, results, onComplete, candidate.accessId, settings, forceExitFullscreen]);

  const handleCameraStreamReady = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  const processSubmission = async () => {
    if (!currentQuestion || !liveTranscript.trim()) return;

    stopListening();
    setStatus(InterviewStatus.THINKING);
    setProcessingMsg("Analysing Response...");

    const { evaluation: result, nextQuestion } = await submitAnswer(
      candidate,
      currentQuestion,
      liveTranscript,
      visualMetrics,
      settings || undefined
    );

    const updatedResults = [...results, result];
    setResults(updatedResults);
    setProcessingMsg("Response Recorded.");

    setTimeout(() => {
      if (nextQuestion) {
        setLiveTranscript('');
        resetTranscript();
        setCurrentQuestion(nextQuestion);
        setStatus(InterviewStatus.ASKING);
      } else {
        forceExitFullscreen();
        onComplete(updatedResults, warningLogRef.current, 'COMPLETED');
      }
    }, 1500);
  };

  // ─── TERMINATED SCREEN ─────────────────────────────────────
  if (status === InterviewStatus.LOCKED) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-red-950 text-white p-8 relative overflow-hidden transition-colors">
        {/* Background pulses */}
        <div className="absolute inset-0 bg-red-900/20 animate-pulse"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-600/10 blur-[150px] rounded-full animate-morph"></div>

        <div className="max-w-2xl w-full text-center glass-card bg-red-900/10 border-2 border-red-500/50 p-12 rounded-[3rem] shadow-2xl relative z-10 animate-fade-in">
          <div className="w-24 h-24 bg-red-600/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/30">
            <ShieldAlert size={56} className="text-red-500 animate-bounce" />
          </div>
          <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">Session Locked</h2>
          <p className="text-xl text-red-200/80 mb-8 font-medium">Multiple integrity violations detected. Your session has been terminated for administrative review.</p>
          <div className="w-16 h-1 bg-red-500 mx-auto rounded-full opacity-50"></div>
        </div>
      </div>
    );
  }

  // ─── MAIN RENDER ────────────────────────────────────────────
  return (
    <div className="h-full w-full max-w-[1920px] mx-auto flex flex-col p-4 md:p-6 gap-6 relative overflow-hidden transition-colors duration-300">

      {/* Dynamic background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-500/5 blur-[120px] rounded-full animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse-slow font-delay-700 pointer-events-none"></div>

      {/* ── Violation Overlay ────────────────────────────────── */}
      {showViolationOverlay && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-8 transition-all animate-fade-in" style={{ position: 'fixed' }}>
          <div className="max-w-lg w-full glass-card bg-red-950/20 border-2 border-red-500/50 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-600/5 to-transparent pointer-events-none"></div>

            <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <AlertTriangle size={48} className="text-red-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">Integrity Warning</h2>
            <p className="text-red-200/70 mb-8 text-sm leading-relaxed font-medium">{violationMessage}</p>

            <div className="bg-red-500/5 dark:bg-white/5 rounded-2xl p-5 mb-8 border border-white/5">
              <div className="flex justify-between items-center mb-3">
                <p className="text-red-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  Strike Account
                </p>
                <p className="text-white text-xs font-black font-mono">
                  {violationCount} / {settings?.proctoring.maxWarnings || 3}
                </p>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  style={{ width: `${(violationCount / (settings?.proctoring.maxWarnings || 3)) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={dismissViolationOverlay}
              className="w-full py-4 bg-white hover:bg-slate-100 text-slate-950 font-black rounded-2xl transition-all flex items-center justify-center gap-3 text-lg shadow-xl hover:scale-[1.02] active:scale-95 group"
            >
              <Maximize size={22} className="group-hover:rotate-12 transition-transform" />
              Resume Assessment
            </button>
            <p className="text-red-400/60 text-[9px] mt-6 uppercase tracking-[0.4em] font-black">
              Zero tolerance for external assistance
            </p>
          </div>
        </div>
      )}

      {/* ── Camera Loading Overlay ─────────────────────────── */}
      {!isCameraReady && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 z-[60] flex flex-col items-center justify-center backdrop-blur-xl animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-brand-500/10 flex items-center justify-center mb-8 border border-brand-500/20">
            <Loader2 size={48} className="text-brand-500 animate-spin" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Securing Connection</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 mb-10 font-medium">Calibrating proctoring array...</p>

          <div className="glass-card bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100/50 dark:border-brand-800/20 rounded-3xl p-6 max-w-md text-center shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-500 mx-auto mb-4">
              <Lock size={20} />
            </div>
            <p className="text-[11px] text-brand-900 dark:text-brand-300 font-bold leading-relaxed uppercase tracking-tight">
              Lockdown Protocol Active
            </p>
            <p className="text-[11px] text-brand-700/80 dark:text-brand-400/80 mt-1 italic">
              Exiting fullscreen or switching tabs will be flagged as a violation.
            </p>
          </div>
        </div>
      )}

      {/* ── Top Bar ───────────────────────────────────────── */}
      <div className="flex-none h-16 glass-card bg-white/40 dark:bg-slate-900/40 rounded-2xl shadow-lg border border-white/40 dark:border-white/5 px-6 flex items-center justify-between z-10 transition-colors">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-brand-500/20">
            {candidate.name.charAt(0)}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">{candidate.name}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">Authenticated Candidate</p>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-0.5">Progress</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black font-mono text-brand-600 dark:text-brand-400">{results.length + 1} / {totalQuestions}</span>
              <div className="w-24 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 hidden md:block overflow-hidden">
                <div
                  className="bg-brand-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${((results.length + 1) / totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

          <div className="flex items-center gap-3">
            {violationCount > 0 && (
              <div className="flex items-center gap-2 text-[10px] font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-xl border border-red-100 dark:border-red-900/40 uppercase tracking-wider shadow-sm">
                <AlertTriangle size={14} />
                <span>{violationCount} Violations</span>
              </div>
            )}
            <div className={`flex items-center gap-2 text-[10px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-wider transition-colors shadow-sm ${isFullscreen
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40'
              : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40 animate-pulse'
              }`}>
              {isFullscreen ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
              <span>{isFullscreen ? 'Secure' : 'Unsecure'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ─────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">

        {/* LEFT PANEL: AI Avatar */}
        <div className="hidden lg:flex lg:col-span-3 glass-card bg-white/40 dark:bg-slate-900/40 rounded-3xl shadow-xl border border-white/40 dark:border-white/5 flex-col items-center justify-center p-8 relative overflow-hidden transition-colors">
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent"></div>

          <div className="relative z-10 w-full flex flex-col items-center">
            <VisualizerOrb status={status} pulse={voicePulse} />
            <div className="mt-10 text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5">
                <div className={`w-2 h-2 rounded-full ${status === InterviewStatus.ASKING ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></div>
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">AI Agent</span>
              </div>
              <h3 className="font-black text-slate-800 dark:text-white text-lg tracking-tight">Evaluation Bot</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {status === InterviewStatus.ASKING || status === InterviewStatus.LOADING_QUESTION ? "Transmitting audio..." : "Processing audio input..."}
              </p>
            </div>
          </div>

          {/* Decorative scanner line */}
          <div className="absolute bottom-4 left-4 right-4 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent"></div>
        </div>

        {/* CENTER PANEL: Content */}
        <div className="lg:col-span-6 flex flex-col gap-6 min-h-0 h-full">
          {/* Question Card */}
          <div className="glass-card bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-900 dark:to-slate-950 rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center shrink-0 max-h-[35%] overflow-y-auto relative overflow-hidden transition-colors">
            {/* Morphing decorative shape */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full translate-x-12 -translate-y-12 animate-morph"></div>

            <div className="relative z-10 w-full">
              {currentQuestion ? (
                <div className="animate-fade-in">
                  <span className="inline-block text-[10px] font-black text-brand-100 dark:text-brand-300/60 uppercase tracking-[0.3em] mb-4 bg-white/10 dark:bg-brand-800/40 px-3 py-1 rounded-lg">Question Queue</span>
                  <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed tracking-tight italic">
                    "{currentQuestion.text}"
                  </h2>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white/50" size={32} />
                  </div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Generating Prompts</p>
                </div>
              )}
            </div>
          </div>

          {/* Answer Box */}
          <div className="flex-1 glass-card bg-white/40 dark:bg-slate-900/40 rounded-[2.5rem] border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 flex flex-col relative overflow-hidden transition-all focus-within:border-brand-500 dark:focus-within:border-brand-400/50 focus-within:bg-white/80 dark:focus-within:bg-slate-900/60 min-h-0">
            {status === InterviewStatus.THINKING || status === InterviewStatus.LOADING_QUESTION ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 z-20 backdrop-blur-xl animate-fade-in">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-brand-500 blur-xl opacity-20 scale-150 animate-pulse"></div>
                  <Loader2 size={48} className="text-brand-600 dark:text-brand-400 animate-spin relative" />
                </div>
                <p className="text-slate-900 dark:text-white font-black text-lg tracking-tight">{processingMsg}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Evaluating semantic accuracy...</p>
              </div>
            ) : (
              <div className="flex flex-col h-full animate-fade-in">
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${status === InterviewStatus.LISTENING ? "bg-red-500 text-white shadow-lg shadow-red-500/20 scale-110" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                      <Mic size={20} className={status === InterviewStatus.LISTENING ? "animate-pulse" : ""} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">{status === InterviewStatus.LISTENING ? "Recording High-Fi Audio" : "Input Monitor Idle"}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{status === InterviewStatus.LISTENING ? "Sensitivity: High" : "Mic Standby"}</p>
                    </div>
                  </div>

                  {status === InterviewStatus.LISTENING && (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-1 bg-red-500 rounded-full h-4 animate-bounce" style={{ animationDelay: `${i * 0.1}s`, height: `${8 + Math.random() * 12}px` }}></div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-1 relative group overflow-hidden bg-slate-50/50 dark:bg-slate-950/20 rounded-3xl p-6 border border-slate-100 dark:border-white/5 transition-colors group-focus-within:bg-transparent">
                  <textarea
                    value={liveTranscript}
                    readOnly
                    placeholder={status === InterviewStatus.LISTENING ? "Voice detection active. Start speaking your response now..." : "Awaiting interviewer prompt. Please maintain focus."}
                    className="w-full h-full bg-transparent border-none focus:ring-0 text-slate-800 dark:text-white text-lg font-medium resize-none leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                  />
                  {/* Visual recording fade */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/20 dark:from-slate-900/20 to-transparent pointer-events-none"></div>
                </div>

                <div className="shrink-0 pt-6 mt-6">
                  <button
                    onClick={processSubmission}
                    disabled={!liveTranscript.trim() || status !== InterviewStatus.LISTENING}
                    className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl tracking-tight flex items-center justify-center gap-3 active:scale-95 group
                      ${!liveTranscript.trim() || status !== InterviewStatus.LISTENING
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                        : 'bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white shadow-brand-500/20'
                      }`}
                  >
                    <span>Finalize and Submit Response</span>
                    <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-[9px] text-center mt-3 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em]">Response auto-records beyond timeout threshold</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Monitor */}
        <div className="lg:col-span-3 flex flex-col gap-6 min-h-0 h-full">
          {/* Camera Card */}
          <div className="glass-card bg-slate-950 rounded-3xl overflow-hidden shadow-2xl shrink-0 h-48 lg:h-auto lg:aspect-[4/3] relative group border-[6px] border-white/40 dark:border-white/5 transition-colors">
            <MemoizedCameraMonitor
              onWarning={handleCameraWarning}
              onMetricsUpdate={setVisualMetrics}
              isLocked={false}
              onStreamReady={handleCameraStreamReady}
              sensitivity={settings?.proctoring.sensitivity || 'Medium'}
            />
            {/* Visual HUD overlay */}
            <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-4 h-4 border-t-2 border-l-2 border-brand-500/50"></div>
                <div className="w-4 h-4 border-t-2 border-r-2 border-brand-500/50"></div>
              </div>
              <div className="flex justify-between items-end">
                <div className="w-4 h-4 border-b-2 border-l-2 border-brand-500/50"></div>
                <div className="w-4 h-4 border-b-2 border-r-2 border-brand-500/50"></div>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 z-10">
              <span className="bg-brand-500/90 text-white px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg border border-white/20">
                Encrypted Feed
              </span>
            </div>
          </div>

          {/* Procturing Stats */}
          <div className="flex-1 glass-card bg-slate-900/90 dark:bg-black/60 rounded-[2.5rem] p-6 text-slate-300 flex flex-col shadow-2xl overflow-y-auto min-h-0 border border-white/5">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h4 className="text-white font-black text-sm tracking-tight leading-none mb-1">Live Telemetry</h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Active Proctoring Unit</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Telemetry Items */}
              <div className="grid grid-cols-1 gap-5">
                {[
                  { label: 'Gaze Focus', status: visualMetrics.isLookingAtCamera ? 'Stable' : 'Deficit', active: visualMetrics.isLookingAtCamera, color: 'brand' },
                  { label: 'Pose Integrity', status: visualMetrics.headPose === 'FORWARD' ? 'Aligned' : 'Skewed', active: visualMetrics.headPose === 'FORWARD', color: 'indigo' },
                  { label: 'Object Breach', status: visualMetrics.suspectedPhoneUse ? 'Compromised' : 'Secured', active: !visualMetrics.suspectedPhoneUse, color: 'red' },
                  { label: 'Audio Leak', status: visualMetrics.isTalking ? 'Detected' : 'Silent', active: !visualMetrics.isTalking, color: 'amber' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-10 rounded-full transition-all ${item.active ? 'bg-emerald-500/20' : 'bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse'}`}></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{item.label}</p>
                        <p className={`text-xs font-bold ${item.active ? 'text-slate-200' : 'text-red-400 shadow-sm'}`}>{item.status}</p>
                      </div>
                    </div>
                    {!item.active && <AlertTriangle size={14} className="text-red-500 animate-bounce" />}
                  </div>
                ))}
              </div>

              {/* Suspicion Meter */}
              <div className="pt-6 mt-2 border-t border-white/5">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-slate-400 text-[9px] uppercase tracking-[0.2em]">Risk Assessment</p>
                  </div>
                  <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg border ${visualMetrics.suspicionLevel > 60 ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                    visualMetrics.suspicionLevel > 30 ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                    }`}>{visualMetrics.suspicionLevel}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 shadow-lg ${visualMetrics.suspicionLevel > 60 ? 'bg-red-500' :
                      visualMetrics.suspicionLevel > 30 ? 'bg-amber-500' : 'bg-brand-500'
                      }`}
                    style={{ width: `${visualMetrics.suspicionLevel}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Visual HUD footer */}
            <div className="mt-auto pt-6 border-t border-white/5 text-[8px] text-slate-600 font-bold uppercase tracking-[0.3em] flex items-center justify-between">
              <span>Sensor: Mediapipe V2</span>
              <span>Latency: 42ms</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
