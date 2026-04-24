"use client";

import { useCallback, useRef, useEffect } from "react";

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    return new Ctx();
  } catch {
    return null;
  }
}

// ─── Low-level tone builder ────────────────────────────────────────────────────

interface NoteOpts {
  freq: number;
  start: number;       // seconds from now
  duration: number;    // seconds
  peak: number;        // peak gain (0–1), keep ≤ 0.18 for comfort
  attack: number;      // fade-in seconds
  release: number;     // fade-out seconds
  type?: OscillatorType;
  detune?: number;     // cents for warmth
}

function scheduleNote(ctx: AudioContext, opts: NoteOpts) {
  const { freq, start, duration, peak, attack, release, type = "sine", detune = 0 } = opts;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Subtle reverb-like tail via a second very quiet oscillator one octave up
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc.detune.setValueAtTime(detune, ctx.currentTime);

  osc2.type = "sine";
  osc2.frequency.setValueAtTime(freq * 2, ctx.currentTime);

  const t0 = ctx.currentTime + start;
  const t1 = t0 + attack;
  const t2 = t0 + duration - release;
  const t3 = t0 + duration;

  // Main tone envelope
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t1);
  gain.gain.setValueAtTime(peak, t2);
  gain.gain.exponentialRampToValueAtTime(0.0001, t3);

  // Overtone — very quiet
  gain2.gain.setValueAtTime(0, t0);
  gain2.gain.linearRampToValueAtTime(peak * 0.06, t1);
  gain2.gain.exponentialRampToValueAtTime(0.0001, t3);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc.start(t0);
  osc.stop(t3 + 0.05);
  osc2.start(t0);
  osc2.stop(t3 + 0.05);
}

// ─── Sound presets — all very quiet and smooth ────────────────────────────────

/**
 * Soft bowl-like chime — three notes gently ascending.
 * Plays when work timer ends ("time for a break").
 * Inspired by singing bowl / meditation bell.
 */
function soundWorkEnd(ctx: AudioContext) {
  // G4 → B4 → D5 — a peaceful G major triad, arpeggiated
  const notes = [
    { freq: 392.0, start: 0.0 },   // G4
    { freq: 493.9, start: 0.55 },  // B4
    { freq: 587.3, start: 1.1 },   // D5
  ];
  for (const n of notes) {
    scheduleNote(ctx, {
      freq: n.freq, start: n.start,
      duration: 1.8, peak: 0.14,
      attack: 0.02, release: 1.5,
      type: "sine", detune: 3,
    });
  }
}

/**
 * Two gentle identical pulses — back to work.
 * Like a soft double-knock.
 */
function soundBreakEnd(ctx: AudioContext) {
  for (const start of [0, 0.45]) {
    scheduleNote(ctx, {
      freq: 440, start,
      duration: 0.7, peak: 0.11,
      attack: 0.015, release: 0.55,
      type: "sine",
    });
  }
}

/**
 * Single soft high note — exercise transition.
 * Barely audible, just a gentle "next" signal.
 */
function soundTransition(ctx: AudioContext) {
  scheduleNote(ctx, {
    freq: 659.3, start: 0,      // E5
    duration: 0.45, peak: 0.08,
    attack: 0.01, release: 0.38,
    type: "triangle",
  });
}

/**
 * Warm major chord fade-in — break completed.
 * C + E + G played together, very soft, long tail.
 */
function soundCompletion(ctx: AudioContext) {
  const chord = [261.6, 329.6, 392.0]; // C4, E4, G4
  for (const freq of chord) {
    scheduleNote(ctx, {
      freq, start: 0,
      duration: 2.2, peak: 0.10,
      attack: 0.12, release: 1.6,
      type: "sine", detune: -4,
    });
  }
  // Octave up, quieter, delayed slightly for shimmer
  scheduleNote(ctx, {
    freq: 523.3, start: 0.18,   // C5
    duration: 2.0, peak: 0.06,
    attack: 0.08, release: 1.5,
    type: "sine",
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSound() {
  const ctxRef  = useRef<AudioContext | null>(null);
  const enabled = useRef(true);

  const getCtx = useCallback((): AudioContext | null => {
    if (!ctxRef.current) ctxRef.current = getAudioContext();
    if (ctxRef.current?.state === "suspended") {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  // Unlock audio on first interaction (browser autoplay policy)
  useEffect(() => {
    const unlock = () => {
      getCtx();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [getCtx]);

  const play = useCallback(
    (fn: (ctx: AudioContext) => void) => {
      if (!enabled.current) return;
      const ctx = getCtx();
      if (!ctx) return;
      try { fn(ctx); } catch { /* AudioContext might not be ready */ }
    },
    [getCtx]
  );

  return {
    playWorkEnd:            () => play(soundWorkEnd),
    playBreakEnd:           () => play(soundBreakEnd),
    playExerciseTransition: () => play(soundTransition),
    playCompletion:         () => play(soundCompletion),
    setEnabled:             (v: boolean) => { enabled.current = v; },
    isEnabled:              () => enabled.current,
  };
}
