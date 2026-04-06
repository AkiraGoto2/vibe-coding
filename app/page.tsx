"use client";

import { useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TimerDisplay } from "@/components/timer-display";
import { SettingsPanel } from "@/components/settings-panel";
import { BreakScreen } from "@/components/break-screen";
import { useTimer, useAutostart } from "@/hooks/use-tauri";
import { Play, Pause, RotateCcw, Timer, Activity } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const {
    timerState,
    startTimer,
    pauseTimer,
    resetTimer,
    setWorkDuration,
    setBreakDuration,
    completeBreak,
    showBreakWindow,
    isTauriAvailable,
  } = useTimer();

  const { enabled: autostartEnabled, toggle: toggleAutostart } = useAutostart();

  // Auto-trigger break when timer reaches 0
  useEffect(() => {
    if (timerState.remaining_seconds === 0 && !timerState.is_break_time) {
      showBreakWindow();
    }
  }, [timerState.remaining_seconds, timerState.is_break_time, showBreakWindow]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !timerState.is_break_time) {
        e.preventDefault();
        if (timerState.is_running) {
          pauseTimer();
        } else {
          startTimer();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [timerState.is_running, timerState.is_break_time, pauseTimer, startTimer]);

  const handlePlayPause = useCallback(() => {
    if (timerState.is_running) {
      pauseTimer();
    } else {
      startTimer();
    }
  }, [timerState.is_running, pauseTimer, startTimer]);

  // For demo: trigger break manually
  const triggerBreak = useCallback(() => {
    showBreakWindow();
  }, [showBreakWindow]);

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <AnimatePresence>
        {timerState.is_break_time && (
          <BreakScreen
            breakDuration={timerState.break_duration}
            onComplete={completeBreak}
          />
        )}
      </AnimatePresence>

      {/* Main app UI */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col items-center justify-center p-6"
      >
        {/* Header */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Break Reminder</h1>
              <p className="text-xs text-muted-foreground">
                {isTauriAvailable ? "Desktop App" : "Web Preview"}
              </p>
            </div>
          </div>
          <SettingsPanel
            workDuration={timerState.work_duration}
            breakDuration={timerState.break_duration}
            onWorkDurationChange={setWorkDuration}
            onBreakDurationChange={setBreakDuration}
            autostart={autostartEnabled}
            onAutostartChange={toggleAutostart}
          />
        </div>

        {/* Timer */}
        <TimerDisplay
          remainingSeconds={timerState.remaining_seconds}
          isRunning={timerState.is_running}
          totalSeconds={timerState.work_duration * 60}
        />

        {/* Controls */}
        <div className="flex items-center gap-4 mt-8">
          <Button
            variant="outline"
            size="icon"
            onClick={resetTimer}
            className="w-12 h-12 rounded-full"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>

          <Button
            size="lg"
            onClick={handlePlayPause}
            className="w-16 h-16 rounded-full"
          >
            {timerState.is_running ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={triggerBreak}
            className="w-12 h-12 rounded-full"
            title="Start break now"
          >
            <Timer className="h-5 w-5" />
          </Button>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-2 gap-4 mt-12 w-full max-w-sm">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Work
              </p>
              <p className="text-2xl font-semibold text-foreground mt-1">
                {timerState.work_duration} min
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Break
              </p>
              <p className="text-2xl font-semibold text-foreground mt-1">
                {timerState.break_duration} min
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Hint */}
        <p className="mt-8 text-sm text-muted-foreground">
          Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Space</kbd> to pause/resume
        </p>
      </motion.div>
    </main>
  );
}
