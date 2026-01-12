import { useState, useCallback, useRef, useEffect } from 'react';

interface UseCookModeOptions {
  instructions: string[];
  onComplete?: () => void;
}

interface Timer {
  id: string;
  duration: number; // in seconds
  remaining: number;
  isRunning: boolean;
  label: string;
}

export const useCookMode = ({ instructions, onComplete }: UseCookModeOptions) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [timers, setTimers] = useState<Timer[]>([]);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Keep screen awake during cook mode
  useEffect(() => {
    const requestWakeLock = async () => {
      if (isActive && 'wakeLock' in navigator) {
        try {
          const lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
        } catch (err) {
          console.log('Wake lock not available');
        }
      }
    };

    if (isActive) {
      requestWakeLock();
    } else if (wakeLock) {
      wakeLock.release();
      setWakeLock(null);
    }

    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, [isActive]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (speechSynthRef.current) {
        window.speechSynthesis.cancel();
      }
      timerIntervalsRef.current.forEach((interval) => clearInterval(interval));
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Try to use a natural sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google'))
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const startCookMode = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    if (instructions.length > 0) {
      setTimeout(() => {
        speak(`Let's start cooking! Step 1: ${instructions[0]}`);
      }, 500);
    }
  }, [instructions, speak]);

  const exitCookMode = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setTimers([]);
    stopSpeaking();
    timerIntervalsRef.current.forEach((interval) => clearInterval(interval));
    timerIntervalsRef.current.clear();
  }, [stopSpeaking]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < instructions.length) {
      setCurrentStep(step);
      speak(`Step ${step + 1}: ${instructions[step]}`);
    }
  }, [instructions, speak]);

  const nextStep = useCallback(() => {
    if (currentStep < instructions.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      speak(`Step ${next + 1}: ${instructions[next]}`);
    } else {
      speak("Congratulations! You've completed all the steps. Enjoy your meal!");
      onComplete?.();
    }
  }, [currentStep, instructions, speak, onComplete]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      speak(`Going back. Step ${prev + 1}: ${instructions[prev]}`);
    }
  }, [currentStep, instructions, speak]);

  const repeatStep = useCallback(() => {
    speak(`Step ${currentStep + 1}: ${instructions[currentStep]}`);
  }, [currentStep, instructions, speak]);

  // Timer functions
  const addTimer = useCallback((minutes: number, label?: string) => {
    const id = `timer-${Date.now()}`;
    const duration = minutes * 60;
    
    const newTimer: Timer = {
      id,
      duration,
      remaining: duration,
      isRunning: true,
      label: label || `${minutes} minute timer`
    };
    
    setTimers(prev => [...prev, newTimer]);
    speak(`Timer set for ${minutes} minutes`);
    
    const interval = setInterval(() => {
      setTimers(prev => {
        const updated = prev.map(t => {
          if (t.id === id && t.isRunning) {
            const remaining = t.remaining - 1;
            
            if (remaining <= 0) {
              clearInterval(timerIntervalsRef.current.get(id)!);
              timerIntervalsRef.current.delete(id);
              speak(`Timer complete! ${t.label}`);
              return { ...t, remaining: 0, isRunning: false };
            }
            
            // Announce at 1 minute and 30 seconds remaining
            if (remaining === 60) {
              speak('One minute remaining');
            } else if (remaining === 30) {
              speak('30 seconds remaining');
            }
            
            return { ...t, remaining };
          }
          return t;
        });
        return updated;
      });
    }, 1000);
    
    timerIntervalsRef.current.set(id, interval);
    
    return id;
  }, [speak]);

  const removeTimer = useCallback((id: string) => {
    const interval = timerIntervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval);
      timerIntervalsRef.current.delete(id);
    }
    setTimers(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTimer = useCallback((id: string) => {
    setTimers(prev => prev.map(t => {
      if (t.id === id) {
        if (t.isRunning) {
          const interval = timerIntervalsRef.current.get(id);
          if (interval) {
            clearInterval(interval);
            timerIntervalsRef.current.delete(id);
          }
          return { ...t, isRunning: false };
        } else {
          const interval = setInterval(() => {
            setTimers(prevTimers => {
              const updated = prevTimers.map(timer => {
                if (timer.id === id && timer.isRunning) {
                  const remaining = timer.remaining - 1;
                  if (remaining <= 0) {
                    clearInterval(timerIntervalsRef.current.get(id)!);
                    timerIntervalsRef.current.delete(id);
                    speak(`Timer complete! ${timer.label}`);
                    return { ...timer, remaining: 0, isRunning: false };
                  }
                  return { ...timer, remaining };
                }
                return timer;
              });
              return updated;
            });
          }, 1000);
          timerIntervalsRef.current.set(id, interval);
          return { ...t, isRunning: true };
        }
      }
      return t;
    }));
  }, [speak]);

  // Extract time from instruction text (e.g., "cook for 5 minutes")
  const extractTimeFromInstruction = useCallback((instruction: string): number | null => {
    const patterns = [
      /(\d+)\s*(?:minute|min)/i,
      /(\d+)\s*(?:hour|hr)/i,
    ];
    
    for (const pattern of patterns) {
      const match = instruction.match(pattern);
      if (match) {
        let minutes = parseInt(match[1], 10);
        if (pattern.toString().includes('hour')) {
          minutes *= 60;
        }
        return minutes;
      }
    }
    return null;
  }, []);

  const suggestedTime = instructions[currentStep] 
    ? extractTimeFromInstruction(instructions[currentStep]) 
    : null;

  return {
    currentStep,
    totalSteps: instructions.length,
    isActive,
    isSpeaking,
    voiceEnabled,
    timers,
    suggestedTime,
    setVoiceEnabled,
    startCookMode,
    exitCookMode,
    goToStep,
    nextStep,
    previousStep,
    repeatStep,
    speak,
    stopSpeaking,
    addTimer,
    removeTimer,
    toggleTimer,
  };
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
