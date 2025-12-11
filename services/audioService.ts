// Simple synth for retro sound effects without external assets

const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
const ctx = new AudioContextClass();

const playTone = (freq: number, type: 'square' | 'sawtooth' | 'sine', duration: number, vol: number = 0.1) => {
  if (ctx.state === 'suspended') ctx.resume();
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
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
