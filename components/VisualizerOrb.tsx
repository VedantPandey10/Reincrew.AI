import React, { useEffect, useState } from 'react';
import { InterviewStatus } from '../types';

interface VisualizerOrbProps {
  status: InterviewStatus;
  pulse?: number; // Increments on every speech word boundary
}

export const VisualizerOrb: React.FC<VisualizerOrbProps> = ({ status, pulse = 0 }) => {
  // Determine visual state based on status
  // ASKING = Speaking (Active, Energetic)
  // LISTENING = Listening (Receptive, Gentle Pulse)
  // THINKING = Processing (Fast Spin/Shimmer)
  // IDLE/LOADING = Neutral
  // LOCKED = Error/Static

  const isSpeaking = status === InterviewStatus.ASKING;
  const isListening = status === InterviewStatus.LISTENING;
  const isThinking = status === InterviewStatus.THINKING || status === InterviewStatus.LOADING_QUESTION;
  const isLocked = status === InterviewStatus.LOCKED;

  // Base colors
  let coreColor = "bg-indigo-600";
  let glowColor = "shadow-indigo-500/50";
  
  if (isListening) {
    coreColor = "bg-teal-500";
    glowColor = "shadow-teal-500/50";
  } else if (isThinking) {
    coreColor = "bg-amber-500";
    glowColor = "shadow-amber-500/50";
  } else if (isLocked) {
    coreColor = "bg-red-600";
    glowColor = "shadow-red-600/50";
  }

  // Pulse Logic for Speech Sync
  const [scale, setScale] = useState(1);
  
  useEffect(() => {
    if (isSpeaking && pulse > 0) {
        // Quick pop on word boundary
        setScale(1.2); // Increased pop intensity
        const t = setTimeout(() => setScale(1), 150);
        return () => clearTimeout(t);
    } else if (!isSpeaking) {
        setScale(1);
    }
  }, [pulse, isSpeaking]);

  return (
    <div className="relative w-full h-48 flex items-center justify-center my-4">
      {/* --- Animation Layers --- */}

      {/* Layer 1: Outer Sound Waves (Only when speaking) */}
      {isSpeaking && (
        <>
          <div className={`absolute w-32 h-32 rounded-full border-2 border-indigo-300 opacity-0 animate-sound-wave`} style={{ animationDelay: '0s' }}></div>
          <div className={`absolute w-32 h-32 rounded-full border-2 border-indigo-300 opacity-0 animate-sound-wave`} style={{ animationDelay: '0.4s' }}></div>
          <div className={`absolute w-32 h-32 rounded-full border-2 border-indigo-300 opacity-0 animate-sound-wave`} style={{ animationDelay: '0.8s' }}></div>
        </>
      )}

      {/* Layer 2: Listening Ripple (Only when listening) */}
      {isListening && (
        <>
          <div className="absolute w-32 h-32 bg-teal-100 rounded-full animate-ping opacity-20"></div>
          <div className="absolute w-28 h-28 bg-teal-100 rounded-full animate-pulse opacity-40"></div>
        </>
      )}

      {/* Layer 3: The Liquid Orb Core */}
      <div className="relative z-10">
        {/* Background Glow */}
        <div className={`absolute inset-0 blur-2xl opacity-60 rounded-full ${coreColor}`}></div>
        
        {/* The Main Morphing Blob */}
        <div 
          className={`w-32 h-32 ${coreColor} shadow-2xl ${glowColor} transition-all duration-100 ease-out
            ${isListening ? 'scale-95 animate-pulse' : ''}
            ${isThinking ? 'animate-spin-slow rounded-full' : ''}
            ${!isSpeaking && !isListening && !isThinking ? 'animate-morph' : ''}
          `}
          style={{
            // Use rhythmic scale when speaking, else use defaults
            transform: isSpeaking ? `scale(${scale})` : undefined,
            // Fallback for non-animating states to have a slight organic shape
            borderRadius: isThinking ? '50%' : '60% 40% 30% 70% / 60% 30% 70% 40%' 
          }}
        >
          {/* Inner reflection/sheen for 3D effect */}
          <div className="absolute top-4 left-6 w-8 h-6 bg-white opacity-20 rounded-full blur-sm"></div>
        </div>
      </div>

      {/* Status Text Label (Floating below) */}
      <div className="absolute bottom-2 font-mono text-xs font-bold tracking-widest text-slate-400 uppercase">
        {isSpeaking && <span className="text-indigo-500 animate-pulse">AI Speaking...</span>}
        {isListening && <span className="text-teal-600 animate-pulse">Listening...</span>}
        {isThinking && <span className="text-amber-500">Processing...</span>}
        {isLocked && <span className="text-red-600">TERMINATED</span>}
      </div>
    </div>
  );
};