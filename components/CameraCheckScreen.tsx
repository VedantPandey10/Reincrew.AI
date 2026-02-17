
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, AlertTriangle, CheckCircle, RefreshCw, ArrowRight, Video } from 'lucide-react';

interface CameraCheckScreenProps {
  onComplete: () => void;
}

export const CameraCheckScreen: React.FC<CameraCheckScreenProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'READY' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState('');
  const isStartingRef = useRef(false);

  const startCamera = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    setStatus('LOADING');
    setErrorMsg('');

    try {
      if (!window.isSecureContext) {
        throw new Error("SECURE_CONTEXT_REQUIRED");
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MEDIA_DEVICES_NOT_SUPPORTED");
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: { ideal: "user" }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setStatus('READY');
          }).catch(e => {
            console.error("Video play failed:", e);
            setStatus('READY');
          });
        };
      }
    } catch (err: any) {
      console.error("Camera detection error:", err);
      setStatus('ERROR');

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg("Permission denied. Check browser settings.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg("No camera device found.");
      } else if (err.message === 'SECURE_CONTEXT_REQUIRED') {
        setErrorMsg("Insecure context detected. Please use 'localhost' instead of an IP address, or use HTTPS.");
      } else if (err.message === 'MEDIA_DEVICES_NOT_SUPPORTED') {
        setErrorMsg("Camera access is not supported by your browser in this context.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMsg("Camera is already in use by another application.");
      } else {
        setErrorMsg(`Camera error: ${err.message || err.name || 'Initialization failed'}`);
      }
    } finally {
      isStartingRef.current = false;
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="h-full w-full flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 blur-[100px] rounded-full animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[100px] rounded-full animate-pulse-slow font-delay-700"></div>

      <div className="max-w-xl w-full h-fit flex flex-col glass-card bg-white/60 dark:bg-slate-900/60 rounded-[2.5rem] shadow-2xl border border-white/40 dark:border-white/5 overflow-hidden animate-fade-in z-10 transition-colors">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 dark:from-slate-950 dark:to-black p-6 text-white text-center shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 blur-xl rounded-full translate-x-12 -translate-y-12"></div>
          <h2 className="text-xl font-black flex items-center justify-center gap-2 relative z-10 tracking-tight">
            <Camera size={22} className="text-brand-400" />
            System Readiness
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 relative z-10">Optimizing proctoring sensors</p>
        </div>

        <div className="p-8 flex flex-col items-center flex-1 overflow-y-auto min-h-0">

          {/* Video Preview */}
          <div className="relative w-full max-w-sm aspect-video bg-slate-950 rounded-3xl overflow-hidden shadow-2xl mb-8 border-8 border-white/50 dark:border-slate-800/50 shrink-0 group">
            {status === 'LOADING' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-950 z-20">
                <Loader2 size={40} className="animate-spin mb-4 text-brand-500" />
                <p className="text-xs font-bold uppercase tracking-widest">Warming Up...</p>
              </div>
            )}

            {status === 'ERROR' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 bg-slate-950 p-6 text-center z-20">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                  <AlertTriangle size={32} />
                </div>
                <p className="font-black text-lg mb-2">Sensor Error</p>
                <p className="text-xs text-red-400/80 leading-relaxed font-medium">{errorMsg}</p>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-700 ${status === 'READY' ? 'opacity-100' : 'opacity-0'}`}
            />

            {status === 'READY' && (
              <>
                <div className="absolute top-4 right-4 flex justify-center z-10">
                  <span className="bg-emerald-500/90 text-white px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 backdrop-blur-md shadow-lg border border-white/20 animate-fade-in uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> Live Feed
                  </span>
                </div>
                {/* Visual scan lines */}
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-b from-transparent via-brand-500/10 to-transparent bg-[length:100%_4px] animate-scan"></div>
              </>
            )}
          </div>

          {/* Checklist */}
          <div className="w-full space-y-4">
            {status === 'ERROR' ? (
              <button
                onClick={startCamera}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-500/20 active:scale-95"
              >
                <RefreshCw size={18} /> Retry Connection
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/40 p-5 rounded-3xl flex items-start gap-4 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0 transition-colors">
                    <Video size={20} />
                  </div>
                  <div className="text-xs leading-relaxed">
                    <p className="font-black text-brand-900 dark:text-brand-300 uppercase tracking-tight mb-1 font-bold">Optimal Environment</p>
                    <ul className="space-y-1.5 text-brand-700 dark:text-brand-400/80 font-medium">
                      <li className="flex items-center gap-2"><div className="w-1 h-1 bg-brand-400 rounded-full"></div> Center your face in the frame</li>
                      <li className="flex items-center gap-2"><div className="w-1 h-1 bg-brand-400 rounded-full"></div> Ensure bright, even lighting</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm shrink-0">
          <button
            onClick={onComplete}
            disabled={status !== 'READY'}
            className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all tracking-tight ${status === 'READY'
              ? 'bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white shadow-xl shadow-brand-500/20 active:scale-95'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
          >
            Enter Assessment Hub <ArrowRight size={20} />
          </button>
        </div>

      </div>
    </div>
  );
};
