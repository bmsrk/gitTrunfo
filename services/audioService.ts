/**
 * Audio service for retro-style synthesized sound effects
 * Uses Web Audio API to generate 8-bit style sounds
 */

const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let ctx: AudioContext | null = null;

/**
 * Initialize audio context (lazy initialization)
 */
const getAudioContext = (): AudioContext | null => {
  if (!ctx && AudioContextClass) {
    try {
      ctx = new AudioContextClass();
    } catch (error) {
      console.warn('Failed to create AudioContext:', error);
      return null;
    }
  }
  return ctx;
};

/**
 * Play a synthesized tone
 * @param freq Frequency in Hz
 * @param type Waveform type
 * @param duration Duration in seconds
 * @param vol Volume (0-1)
 */
const playTone = (
  freq: number,
  type: 'square' | 'sawtooth' | 'sine',
  duration: number,
  vol: number = 0.1
): void => {
  const audioCtx = getAudioContext();
  if (!audioCtx) return;

  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (error) {
    console.warn('Failed to play tone:', error);
  }
};

export const playSound = {
  hover: () => playTone(800, 'sine', 0.05, 0.05),
  click: () => playTone(1200, 'square', 0.1, 0.1),
  start: () => {
    playTone(400, 'square', 0.1, 0.1);
    setTimeout(() => playTone(600, 'square', 0.1, 0.1), 100);
    setTimeout(() => playTone(800, 'square', 0.4, 0.1), 200);
  },
  win: () => {
    playTone(880, 'square', 0.1, 0.2); // A5
    setTimeout(() => playTone(1108, 'square', 0.1, 0.2), 100); // C#6
    setTimeout(() => playTone(1318, 'square', 0.4, 0.2), 200); // E6
  },
  lose: () => {
    playTone(200, 'sawtooth', 0.3, 0.2);
    setTimeout(() => playTone(150, 'sawtooth', 0.4, 0.2), 200);
  },
  draw: () => playTone(400, 'sine', 0.3, 0.2),
  type: () => playTone(800 + Math.random() * 200, 'square', 0.03, 0.02)
};
