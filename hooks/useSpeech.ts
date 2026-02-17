import { useState, useEffect, useCallback, useRef } from 'react';

// Polyfill definitions for browser speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeakOptions {
  onEnd?: () => void;
  onBoundary?: () => void;
}

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Store available voices to pick from randomly
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionCtor) {
      setIsSupported(true);
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript || interimTranscript) {
           setTranscript(prev => (finalTranscript + interimTranscript).toLowerCase()); 
        }
      };

      recognition.onerror = (event: any) => {
        // Don't auto-stop on no-speech, just let it try to continue or handle UI
        if (event.error === 'not-allowed' || event.error === 'aborted') {
            setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Initialize Text-to-Speech Voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;

      const allVoices = window.speechSynthesis.getVoices();
      // Filter for English to ensure correct pronunciation of interview questions
      const englishVoices = allVoices.filter(v => v.lang.startsWith('en'));
      
      setAvailableVoices(englishVoices.length > 0 ? englishVoices : allVoices);
    };

    loadVoices();
    if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Cleanup TTS on unmount
  useEffect(() => {
      return () => {
          if (typeof window !== 'undefined' && window.speechSynthesis) {
              window.speechSynthesis.cancel();
          }
      };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        // Ignore if already started
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const speak = useCallback((text: string, options?: SpeakOptions | (() => void)) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech to prevent queue backup
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      currentUtteranceRef.current = utterance;

      // Handle overloaded argument for backward compatibility (if simplified call is used)
      const onEnd = typeof options === 'function' ? options : options?.onEnd;
      const onBoundary = typeof options === 'object' ? options?.onBoundary : undefined;

      // --- HYPER-REALISTIC VOICE SELECTION LOGIC ---
      if (availableVoices.length > 0) {
        // 1. Filter for "Premium" voices (Google, Natural, Premium, Enhanced)
        // These are typically the neural voices available in Chrome/Edge
        const premiumKeywords = ['Google', 'Natural', 'Premium', 'Enhanced', 'Online', 'Samantha', 'Daniel'];
        const premiumVoices = availableVoices.filter(v => 
          premiumKeywords.some(k => v.name.includes(k))
        );

        // 2. Pool Selection: Use premium if available, else fall back to all English
        const voicePool = premiumVoices.length > 0 ? premiumVoices : availableVoices;

        // 3. Gender Categorization (Heuristic based on name)
        const maleKeywords = ['Male', 'David', 'Guy', 'Daniel', 'Martin', 'Mark', 'James', 'Arthur'];
        const femaleKeywords = ['Female', 'Zira', 'Susan', 'Google US English', 'Victoria', 'Samantha', 'Martha'];

        const maleVoices = voicePool.filter(v => 
            maleKeywords.some(k => v.name.includes(k) || (v.name.includes('UK') && v.name.includes('Male')))
        );
        const femaleVoices = voicePool.filter(v => 
            femaleKeywords.some(k => v.name.includes(k) || (v.name.includes('UK') && v.name.includes('Female'))) || v.name === 'Google US English'
        );

        let selectedVoice;
        
        // 4. Randomized Selection with Gender Balance
        // We want a fresh voice for each question to sound dynamic
        const preferMale = Math.random() > 0.5;
        
        if (preferMale && maleVoices.length > 0) {
            selectedVoice = maleVoices[Math.floor(Math.random() * maleVoices.length)];
        } else if (!preferMale && femaleVoices.length > 0) {
             selectedVoice = femaleVoices[Math.floor(Math.random() * femaleVoices.length)];
        } else {
             // Fallback to pure random if specific buckets are empty
             selectedVoice = voicePool[Math.floor(Math.random() * voicePool.length)];
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            
            // 5. Humanization: Subtle Variance in Pitch/Rate
            // Pitch: 0.95 - 1.05 (Natural variation, avoids robotic flatness)
            // Rate: 0.9 - 1.05 (Slight pacing changes)
            utterance.pitch = 0.95 + Math.random() * 0.1;
            utterance.rate = 0.92 + Math.random() * 0.13;
        }
      }

      utterance.onstart = () => setIsSpeaking(true);

      // Word boundary event for visualizer sync
      utterance.onboundary = (event) => {
        if (onBoundary) onBoundary();
      };

      const handleEnd = () => {
        // Verify this is the current utterance ending (prevent race conditions)
        if (currentUtteranceRef.current === utterance) {
            setIsSpeaking(false);
            currentUtteranceRef.current = null;
            if (onEnd) onEnd();
        }
      };

      utterance.onend = handleEnd;

      utterance.onerror = (event: any) => {
        // Ignore cancel/interrupt as they are usually manual
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
            console.error(`TTS Error: ${event.error}`);
        }
        handleEnd();
      };

      window.speechSynthesis.speak(utterance);

      // 6. Safety Timeout (Browser Bug Fix)
      // Force end if event doesn't fire within reasonable time
      // Calculation: avg 200ms per char + 3s buffer
      const timeoutDuration = (text.length * 200) + 3000;
      setTimeout(() => {
          if (currentUtteranceRef.current === utterance && window.speechSynthesis.speaking) {
              window.speechSynthesis.cancel();
              handleEnd();
          }
      }, timeoutDuration);

    } else {
      console.warn("TTS not supported");
      const onEnd = typeof options === 'function' ? options : options?.onEnd;
      if (onEnd) onEnd();
    }
  }, [availableVoices]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    }
  }, []);

  return {
    isListening,
    transcript,
    setTranscript,
    resetTranscript,
    startListening,
    stopListening,
    isSupported,
    speak,
    stopSpeaking,
    isSpeaking
  };
};