/**
 * Interface sound, synthesised — no audio files, nothing to license, nothing to download.
 *
 * Persona 5's sound team worked to "if it moves, it makes a sound"; Papers, Please gets half
 * its weight from the stamp. But constant interface sound is a known irritant, and this game
 * is played at desks in open offices, so it is OFF until the player turns it on and nothing
 * in the game ever depends on hearing it (no mandatory audio).
 *
 * Presentation only. Never imported by the engine.
 */
export type Cue = 'select' | 'page' | 'stamp' | 'shutter';

let context: AudioContext | null = null;
function audio(): AudioContext | null {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context ??= new Ctor();
    if (context.state === 'suspended') void context.resume();
    return context;
  } catch { return null; }
}

function tone(ctx: AudioContext, at: number, freq: number, to: number, length: number, gain: number, type: OscillatorType = 'sine') {
  const osc = ctx.createOscillator(); const amp = ctx.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, at); osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + length);
  amp.gain.setValueAtTime(0.0001, at); amp.gain.exponentialRampToValueAtTime(gain, at + 0.008); amp.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(amp).connect(ctx.destination); osc.start(at); osc.stop(at + length + 0.02);
}

function noise(ctx: AudioContext, at: number, length: number, gain: number, low: number, high: number) {
  const frames = Math.floor(ctx.sampleRate * length);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate); const data = buffer.getChannelData(0);
  /* Deterministic noise: a tiny LCG, so the presentation layer stays free of Math.random too. */
  let seed = 22695477;
  for (let i = 0; i < frames; i++) { seed = (Math.imul(seed, 1103515245) + 12345) | 0; data[i] = ((seed >>> 16) / 32768 - 1) * (1 - i / frames); }
  const src = ctx.createBufferSource(); src.buffer = buffer;
  const band = ctx.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = (low + high) / 2; band.Q.value = (low + high) / 2 / (high - low);
  const amp = ctx.createGain(); amp.gain.setValueAtTime(gain, at); amp.gain.exponentialRampToValueAtTime(0.0001, at + length);
  src.connect(band).connect(amp).connect(ctx.destination); src.start(at);
}

export function play(cue: Cue, enabled: boolean) {
  if (!enabled) return;
  const ctx = audio(); if (!ctx) return;
  const t = ctx.currentTime + 0.01;
  switch (cue) {
    case 'select': tone(ctx, t, 880, 1320, 0.07, 0.05, 'triangle'); break;
    case 'page': noise(ctx, t, 0.18, 0.12, 1800, 5200); break;
    case 'stamp': tone(ctx, t, 140, 48, 0.22, 0.32); noise(ctx, t, 0.09, 0.22, 200, 1400); break;
    case 'shutter': noise(ctx, t, 0.5, 0.1, 300, 2600); tone(ctx, t + 0.05, 220, 110, 0.5, 0.06, 'sawtooth'); break;
  }
}
