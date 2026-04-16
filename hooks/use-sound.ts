"use client";

import { useCallback, useRef, useEffect } from "react";

// Generate tones using Web Audio API — no external files needed
function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

interface ToneOptions {
  frequency: number;
  duration: number;     // seconds
  type?: OscillatorType;
  gain?: number;
  fadeIn?: number;      // seconds
  fadeOut?: number;     // seconds
  delay?: number;       // seconds before playing
}

async function playTone(ctx: AudioContext, opts: ToneOptions): Promise<void> {
  const {
    frequency, duration, type = "sine",
    gain = 0.4, fadeIn = 0.01, fadeOut = 0.1, delay = 0,
  } = opts;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

  gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
  gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + fadeIn);
  gainNode.gain.setValueAtTime(gain, ctx.currentTime + delay + duration - fadeOut);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + duration);

  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

// ── Sound presets ──────────────────────────────────────────────────────────────

/** Three ascending chimes — "time to break" */
async function playWorkEndSound(ctx: AudioContext) {
  await Promise.all([
    playTone(ctx, { frequency: 523.25, duration: 0.4, gain: 0.3, delay: 0 }),      // C5
    playTone(ctx, { frequency: 659.25, duration: 0.4, gain: 0.3, delay: 0.25 }),   // E5
    playTone(ctx, { frequency: 783.99, duration: 0.6, gain: 0.35, delay: 0.5 }),   // G5
  ]);
}

/** Soft double-chime — "break over, back to work" */
async function playBreakEndSound(ctx: AudioContext) {
  await Promise.all([
    playTone(ctx, { frequency: 783.99, duration: 0.35, gain: 0.28, delay: 0 }),    // G5
    playTone(ctx, { frequency: 783.99, duration: 0.35, gain: 0.28, delay: 0.4 }),  // G5 again
  ]);
}

/** Short tick — every exercise transitions */
async function playExerciseTransitionSound(ctx: AudioContext) {
  await playTone(ctx, { frequency: 440, duration: 0.15, gain: 0.2, type: "triangle" });
}

/** Warm completion chord — break done */
async function playCompletionSound(ctx: AudioContext) {
  await Promise.all([
    playTone(ctx, { frequency: 523.25, duration: 0.8, gain: 0.25, delay: 0 }),    // C5
    playTone(ctx, { frequency: 659.25, duration: 0.8, gain: 0.25, delay: 0 }),    // E5
    playTone(ctx, { frequency: 783.99, duration: 0.8, gain: 0.25, delay: 0 }),    // G5
    playTone(ctx, { frequency: 1046.5, duration: 0.8, gain: 0.2,  delay: 0 }),   // C6
  ]);
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  // Lazy init AudioContext (must be created after user gesture on some browsers)
  const getCtx = useCallback((): AudioContext | null => {
    if (!ctxRef.current) {
      ctxRef.current = createAudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (ctxRef.current?.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // Unlock audio context on first user interaction
  useEffect(() => {
    const unlock = () => {
      getCtx();
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
    document.addEventListener("click", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, [getCtx]);

  const play = useCallback((fn: (ctx: AudioContext) => Promise<void>) => {
    if (!enabledRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    fn(ctx).catch(() => {}); // swallow errors (e.g. user hasn't interacted yet)
  }, [getCtx]);

  return {
    playWorkEnd:            () => play(playWorkEndSound),
    playBreakEnd:           () => play(playBreakEndSound),
    playExerciseTransition: () => play(playExerciseTransitionSound),
    playCompletion:         () => play(playCompletionSound),
    setEnabled:             (v: boolean) => { enabledRef.current = v; },
    isEnabled:              () => enabledRef.current,
  };
}
