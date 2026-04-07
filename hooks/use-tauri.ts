"use client";

import { useState, useEffect, useCallback } from "react";

export function isTauri(): boolean {
  if (typeof window === "undefined") return false;
  return "__TAURI__" in window;
}

interface TauriInvoke {
  <T>(cmd: string, args?: Record<string, unknown>): Promise<T>;
}

interface TauriEvent {
  listen: <T>(event: string, handler: (event: { payload: T }) => void) => Promise<() => void>;
}

declare global {
  interface Window {
    __TAURI__?: {
      core: { invoke: TauriInvoke };
      event: TauriEvent;
    };
  }
}

export interface TimerState {
  remaining_seconds: number;
  is_running: boolean;
  is_break_time: boolean;
  work_duration: number;
  break_duration: number;
}

export function useTauri() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    setIsAvailable(isTauri());
  }, []);

  const invoke = useCallback(async <T>(cmd: string, args?: Record<string, unknown>): Promise<T | null> => {
    if (!isTauri()) return null;
    try {
      return await window.__TAURI__!.core.invoke<T>(cmd, args);
    } catch (error) {
      console.error("[tauri] invoke error:", cmd, error);
      return null;
    }
  }, []);

  const listen = useCallback(async <T>(event: string, handler: (payload: T) => void): Promise<() => void> => {
    if (!isTauri()) return () => {};
    try {
      return await window.__TAURI__!.event.listen<T>(event, (e) => handler(e.payload));
    } catch (error) {
      console.error("[tauri] listen error:", event, error);
      return () => {};
    }
  }, []);

  return { isAvailable, invoke, listen };
}

export function useTimer() {
  const { invoke, listen, isAvailable } = useTauri();

  const [timerState, setTimerState] = useState<TimerState>({
    remaining_seconds: 25 * 60,
    is_running: false,
    is_break_time: false,
    work_duration: 25,
    break_duration: 5,
  });

  useEffect(() => {
    if (isAvailable) {
      invoke<TimerState>("get_timer_state").then((state) => {
        if (state) setTimerState(state);
      });
    }
  }, [isAvailable, invoke]);

  // Web preview countdown
  useEffect(() => {
    if (isAvailable) return;
    if (!timerState.is_running || timerState.is_break_time) return;

    const interval = setInterval(() => {
      setTimerState((prev) => {
        if (prev.remaining_seconds <= 1) {
          return { ...prev, remaining_seconds: 0, is_running: false };
        }
        return { ...prev, remaining_seconds: prev.remaining_seconds - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAvailable, timerState.is_running, timerState.is_break_time]);

  // Tauri events
  useEffect(() => {
    if (!isAvailable) return;
    const unsubscribes: (() => void)[] = [];

    listen<void>("toggle-timer", () => {
      setTimerState((prev) => ({ ...prev, is_running: !prev.is_running }));
    }).then((u) => unsubscribes.push(u));

    listen<void>("reset-timer", () => {
      invoke<TimerState>("reset_timer").then((s) => { if (s) setTimerState(s); });
    }).then((u) => unsubscribes.push(u));

    return () => unsubscribes.forEach((u) => u());
  }, [isAvailable, invoke, listen]);

  const startTimer = useCallback(async () => {
    if (isAvailable) await invoke("start_timer");
    setTimerState((prev) => ({ ...prev, is_running: true }));
  }, [isAvailable, invoke]);

  const pauseTimer = useCallback(async () => {
    if (isAvailable) await invoke("pause_timer");
    setTimerState((prev) => ({ ...prev, is_running: false }));
  }, [isAvailable, invoke]);

  const resetTimer = useCallback(async () => {
    if (isAvailable) await invoke("reset_timer");
    setTimerState((prev) => ({
      ...prev,
      remaining_seconds: prev.work_duration * 60,
      is_break_time: false,
      is_running: false,
    }));
  }, [isAvailable, invoke]);

  const setWorkDuration = useCallback(async (minutes: number) => {
    if (isAvailable) await invoke("set_work_duration", { minutes });
    setTimerState((prev) => ({
      ...prev,
      work_duration: minutes,
      remaining_seconds: prev.is_break_time ? prev.remaining_seconds : minutes * 60,
      is_running: false,
    }));
  }, [isAvailable, invoke]);

  const setBreakDuration = useCallback(async (minutes: number) => {
    if (isAvailable) await invoke("set_break_duration", { minutes });
    setTimerState((prev) => ({ ...prev, break_duration: minutes }));
  }, [isAvailable, invoke]);

  const completeBreak = useCallback(async () => {
    if (isAvailable) {
      await invoke("complete_break");
      await invoke("hide_break_window");
    }
    setTimerState((prev) => ({
      ...prev,
      is_break_time: false,
      remaining_seconds: prev.work_duration * 60,
      is_running: true, // ✅ AUTO-START after break
    }));
  }, [isAvailable, invoke]);

  const showBreakWindow = useCallback(async () => {
    if (isAvailable) await invoke("show_break_window");
    setTimerState((prev) => ({ ...prev, is_break_time: true, is_running: false }));
  }, [isAvailable, invoke]);

  return {
    timerState,
    startTimer,
    pauseTimer,
    resetTimer,
    setWorkDuration,
    setBreakDuration,
    completeBreak,
    showBreakWindow,
    isTauriAvailable: isAvailable,
  };
}

export function useAutostart() {
  const { invoke, isAvailable } = useTauri();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAvailable) { setLoading(false); return; }
    invoke<boolean>("get_autostart_status").then((s) => {
      if (s !== null) setEnabled(s);
      setLoading(false);
    });
  }, [isAvailable, invoke]);

  const toggle = useCallback(async () => {
    if (!isAvailable) { setEnabled((p) => !p); return; }
    const result = await invoke<boolean>("toggle_autostart");
    if (result !== null) setEnabled(result);
  }, [isAvailable, invoke]);

  return { enabled, toggle, loading };
}
