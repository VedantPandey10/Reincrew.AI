
import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { AlertTriangle, UserCheck, Eye, Camera, Lock, ScanFace } from 'lucide-react';
import { VisualMetrics } from '../types';

interface CameraMonitorProps {
  onWarning: (count: number) => void;
  onMetricsUpdate: (metrics: VisualMetrics) => void;
  isLocked: boolean;
  onStreamReady?: () => void;
  sensitivity?: 'Low' | 'Medium' | 'High';
}

export const CameraMonitor: React.FC<CameraMonitorProps> = ({ onWarning, onMetricsUpdate, isLocked, onStreamReady, sensitivity = 'Medium' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [status, setStatus] = useState<"OK" | "WARNING" | "NO_FACE">("OK");
  const [feedbackMsg, setFeedbackMsg] = useState("Initializing integrity system...");

  // Logic Refs
  const lastFrameTimeRef = useRef<number>(-1);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const warningCounterRef = useRef<number>(0);

  const missingFaceFramesRef = useRef<number>(0);
  const lookingAwayFramesRef = useRef<number>(0);
  const multipleFacesFramesRef = useRef<number>(0);
  const lookingDownFramesRef = useRef<number>(0);
  const talkingFramesRef = useRef<number>(0);
  const phoneUseFramesRef = useRef<number>(0);
  const lastWarningTimeRef = useRef<number>(0);
  const confidenceAccumulatorRef = useRef<number[]>([]);
  const suspicionAccumulatorRef = useRef<number[]>([]);

  // Configure sensitivity thresholds
  const getThresholds = () => {
    switch (sensitivity) {
      case 'High': return { missing: 5, away: 4 }; // Instant reaction
      case 'Low': return { missing: 30, away: 20 }; // ~0.5-1s buffer
      case 'Medium':
      default: return { missing: 15, away: 10 };
    }
  };

  useEffect(() => {
    let isActive = true;

    const initMediaPipe = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 2
        });

        if (isActive) {
          faceLandmarkerRef.current = faceLandmarker;
          setIsInitialized(true);
          startCamera();
        }
      } catch (error) {
        console.error("Failed to init MediaPipe:", error);
        setFeedbackMsg("Camera system error. Refresh page.");
      }
    };

    initMediaPipe();

    return () => {
      isActive = false;
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isStartingRef = useRef(false);

  const startCamera = async () => {
    if (isStartingRef.current) return;

    if (!window.isSecureContext) {
      setFeedbackMsg("Insecure context detected. Please use 'localhost' or HTTPS for camera access.");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setFeedbackMsg("Camera API not supported in this browser context.");
      return;
    }

    isStartingRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
          facingMode: { ideal: "user" }
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          if (onStreamReady) onStreamReady();
          predictWebcam();
        };
      }
    } catch (err: any) {
      console.error("Camera monitor access error:", err);
      setFeedbackMsg(`Camera error: ${err.name}`);
    } finally {
      isStartingRef.current = false;
    }
  };

  const predictWebcam = () => {
    const video = videoRef.current;
    const landmarker = faceLandmarkerRef.current;

    if (!video || !landmarker || isLocked) return;

    const now = performance.now();
    if (lastFrameTimeRef.current !== video.currentTime) {
      lastFrameTimeRef.current = video.currentTime;
      let startTimeMs = performance.now();
      const result = landmarker.detectForVideo(video, startTimeMs);
      processResult(result);
    }

    requestAnimationFrame(predictWebcam);
  };

  const processResult = (result: any) => {
    const hasFace = result.faceLandmarks && result.faceLandmarks.length > 0;
    const { missing: missingThresh, away: awayThresh } = getThresholds();

    // 1. Multiple Faces Check (Collaboration)
    if (result.faceLandmarks.length > 1) {
      multipleFacesFramesRef.current += 1;
      if (multipleFacesFramesRef.current > 10) {
        setStatus("WARNING");
        attemptTriggerWarning("Collaboration detected! Multiple faces in frame.");
      }
    } else {
      multipleFacesFramesRef.current = 0;
    }

    // 2. Face Presence Check
    if (!hasFace) {
      missingFaceFramesRef.current += 1;
      if (missingFaceFramesRef.current > missingThresh) {
        setStatus("NO_FACE");
        attemptTriggerWarning("Face not detected! Return immediately.");
      }
      onMetricsUpdate({
        isPresent: false, isLookingAtCamera: false, currentExpression: 'Unknown', confidenceLevel: 0,
        headPose: 'FORWARD', isLookingDown: false, isTalking: false, suspectedPhoneUse: false, suspicionLevel: 0
      });
      return;
    } else {
      missingFaceFramesRef.current = 0;
    }

    // ─── 3. Horizontal Gaze Tracking ───────────────────────────
    const landmarks = result.faceLandmarks[0];
    const noseTip = landmarks[1];
    const leftEar = landmarks[234];
    const rightEar = landmarks[454];

    const faceWidth = Math.abs(rightEar.x - leftEar.x);
    const noseRelX = (noseTip.x - leftEar.x) / faceWidth;

    const isLookingLeft = noseRelX < 0.35;
    const isLookingRight = noseRelX > 0.65;
    const isLookingAway = isLookingLeft || isLookingRight;

    if (isLookingAway) {
      lookingAwayFramesRef.current += 1;
      if (lookingAwayFramesRef.current > awayThresh) {
        setStatus("WARNING");
        attemptTriggerWarning("Maintain eye contact! Don't look away.");
      }
    } else {
      lookingAwayFramesRef.current = 0;
    }

    // ─── 4. Head Pose Detection (Vertical) ────────────────────
    const forehead = landmarks[10];   // Top of forehead
    const chin = landmarks[152];      // Bottom of chin
    const faceHeight = Math.abs(chin.y - forehead.y);
    const noseRelY = (noseTip.y - forehead.y) / faceHeight;

    // Normal noseRelY is ~0.55-0.65 when looking forward
    const isHeadDown = noseRelY > 0.75;  // Head tilted down (phone/desk)
    const isHeadUp = noseRelY < 0.40;    // Head tilted up

    let headPose: 'FORWARD' | 'DOWN' | 'LEFT' | 'RIGHT' | 'UP' = 'FORWARD';
    if (isHeadDown) headPose = 'DOWN';
    else if (isHeadUp) headPose = 'UP';
    else if (isLookingLeft) headPose = 'LEFT';
    else if (isLookingRight) headPose = 'RIGHT';

    // ─── 5. Eye Gaze via Blendshapes ──────────────────────────
    const blendshapes = result.faceBlendshapes[0].categories;
    const getBlendshape = (name: string): number =>
      blendshapes.find((b: any) => b.categoryName === name)?.score || 0;

    const eyeLookDownL = getBlendshape('eyeLookDownLeft');
    const eyeLookDownR = getBlendshape('eyeLookDownRight');
    const eyeLookDown = (eyeLookDownL + eyeLookDownR) / 2;
    const isEyesLookingDown = eyeLookDown > 0.35;

    // ─── 6. Talking / Lip Movement Detection ──────────────────
    const jawOpen = getBlendshape('jawOpen');
    const mouthClose = getBlendshape('mouthClose');
    const mouthPucker = getBlendshape('mouthPucker');
    const lipActivity = jawOpen + (1 - mouthClose) + mouthPucker;
    const isTalking = lipActivity > 0.6;

    if (isTalking) {
      talkingFramesRef.current += 1;
      if (talkingFramesRef.current > 60) { // ~2s sustained talking
        attemptTriggerWarning("Suspicious lip movement detected! No talking allowed.");
        talkingFramesRef.current = 30; // Reset partially to avoid spam
      }
    } else {
      talkingFramesRef.current = Math.max(0, talkingFramesRef.current - 1);
    }

    // ─── 7. Phone Use Detection (Composite) ───────────────────
    const suspectedPhoneUse = isHeadDown && isEyesLookingDown;

    if (suspectedPhoneUse) {
      phoneUseFramesRef.current += 1;
      if (phoneUseFramesRef.current > 15) { // ~0.5s sustained
        setStatus("WARNING");
        attemptTriggerWarning("Suspected mobile phone usage! Keep your head up and face the screen.");
        phoneUseFramesRef.current = 5; // Partial reset
      }
    } else {
      phoneUseFramesRef.current = Math.max(0, phoneUseFramesRef.current - 1);
    }

    if (isHeadDown && !suspectedPhoneUse) {
      lookingDownFramesRef.current += 1;
      if (lookingDownFramesRef.current > 20) {
        setStatus("WARNING");
        attemptTriggerWarning("Head down detected! Look at the screen.");
        lookingDownFramesRef.current = 10;
      }
    } else {
      lookingDownFramesRef.current = Math.max(0, lookingDownFramesRef.current - 1);
    }

    // ─── 8. Expression & Confidence ───────────────────────────
    const smile = getBlendshape('mouthSmileLeft');
    let expression = 'Neutral';
    if (suspectedPhoneUse) expression = 'Phone Suspected';
    else if (isHeadDown) expression = 'Looking Down';
    else if (isTalking) expression = 'Talking';
    else if (smile > 0.4) expression = 'Confident/Smiling';
    else if (isLookingAway) expression = 'Distracted';

    let frameConfidence = 70;
    if (isLookingAway) frameConfidence = 10;
    else if (suspectedPhoneUse) frameConfidence = 5;
    else if (isHeadDown) frameConfidence = 20;
    else if (smile > 0.3) frameConfidence = 90;

    confidenceAccumulatorRef.current.push(frameConfidence);
    if (confidenceAccumulatorRef.current.length > 30) confidenceAccumulatorRef.current.shift();
    const avgConfidence = Math.round(confidenceAccumulatorRef.current.reduce((a, b) => a + b, 0) / confidenceAccumulatorRef.current.length);

    // ─── 9. Suspicion Score ───────────────────────────────────
    let frameSuspicion = 0;
    if (isLookingAway) frameSuspicion += 30;
    if (isHeadDown) frameSuspicion += 25;
    if (isEyesLookingDown) frameSuspicion += 15;
    if (isTalking) frameSuspicion += 20;
    if (suspectedPhoneUse) frameSuspicion += 40;
    frameSuspicion = Math.min(100, frameSuspicion);

    suspicionAccumulatorRef.current.push(frameSuspicion);
    if (suspicionAccumulatorRef.current.length > 30) suspicionAccumulatorRef.current.shift();
    const avgSuspicion = Math.round(suspicionAccumulatorRef.current.reduce((a, b) => a + b, 0) / suspicionAccumulatorRef.current.length);

    // ─── Status & Feedback Message ────────────────────────────
    if (!isLookingAway && !isHeadDown && !suspectedPhoneUse) {
      setStatus("OK");
      setFeedbackMsg("Monitoring Active");
    } else if (suspectedPhoneUse) {
      setFeedbackMsg("⚠ Phone usage suspected!");
    } else if (isHeadDown) {
      setFeedbackMsg("⚠ Head down — look at screen");
    }

    onMetricsUpdate({
      isPresent: true,
      isLookingAtCamera: !isLookingAway,
      currentExpression: expression,
      confidenceLevel: avgConfidence,
      headPose,
      isLookingDown: isHeadDown || isEyesLookingDown,
      isTalking,
      suspectedPhoneUse,
      suspicionLevel: avgSuspicion,
    });
  };

  const attemptTriggerWarning = (msg: string) => {
    const now = Date.now();
    if (now - lastWarningTimeRef.current > 2000) {
      triggerWarning(msg);
      lastWarningTimeRef.current = now;
    } else {
      setFeedbackMsg(msg);
    }
  };

  const triggerWarning = (msg: string) => {
    if (isLocked) return;

    warningCounterRef.current += 1;
    setWarnings(warningCounterRef.current);
    setFeedbackMsg(`STRIKE ${warningCounterRef.current}: ${msg}`);
    onWarning(warningCounterRef.current);
  };

  return (
    <div className={`rounded-xl overflow-hidden border-4 relative shadow-2xl transition-colors duration-100 ${status === 'OK' ? 'border-slate-700' : 'border-red-600'
      }`}>

      {/* Warning Flash */}
      {status !== 'OK' && (
        <div className="absolute inset-0 z-20 pointer-events-none border-8 border-red-600 animate-pulse opacity-50"></div>
      )}

      {/* Status Badge */}
      <div className="absolute top-3 left-3 z-30 flex flex-col gap-2">
        <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg ${status === 'OK' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white animate-bounce'
          }`}>
          {status === 'OK' ? <ScanFace size={14} /> : <AlertTriangle size={14} />}
          {status === 'OK' ? 'TRACKING ACTIVE' : 'VIOLATION DETECTED'}
        </div>
      </div>

      {/* Video Feed */}
      <div className="relative aspect-[4/3] w-full bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isLocked ? 'opacity-20 grayscale' : 'opacity-100'}`}
        />

        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-40 p-4 text-center">
            <Lock className="text-red-500 w-16 h-16 mb-4" />
            <h3 className="text-red-500 text-xl font-bold uppercase">Session Terminated</h3>
          </div>
        )}

        <div className={`absolute bottom-0 left-0 right-0 p-3 transition-colors duration-200 ${status === 'OK' ? 'bg-slate-900/80' : 'bg-red-600'
          }`}>
          <p className="text-white text-xs font-bold uppercase text-center tracking-widest">
            {feedbackMsg}
          </p>
        </div>
      </div>

      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-20">
          <div className="flex flex-col items-center text-slate-500 gap-3">
            <Camera className="animate-ping" size={32} />
            <span className="text-xs font-mono">INITIALIZING OPTICS...</span>
          </div>
        </div>
      )}
    </div>
  );
};
