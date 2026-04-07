"use client";

import { useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TimerDisplay } from "@/components/timer-display";
import { SettingsPanel } from "@/components/settings-panel";
import { BreakScreen } from "@/components/break-screen";
import { useTimer, useAutostart } from "@/hooks/use-tauri";
import { useLanguage } from "@/hooks/use-language";
import { Play, Pause, RotateCcw, Timer, Activity } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const { t, language, changeLanguage } = useLanguage();

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

  // Keyboard shortcuts (Space = play/pause, only on main screen)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && !timerState.is_break_time) {
        e.preventDefault();
        timerState.is_running ? pauseTimer() : startTimer();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [timerState.is_running, timerState.is_break_time, pauseTimer, startTimer]);

  const handlePlayPause = useCallback(() => {
    timerState.is_running ? pauseTimer() : startTimer();
  }, [timerState.is_running, pauseTimer, startTimer]);

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <AnimatePresence>
        {timerState.is_break_time && (
          <BreakScreen
            breakDuration={timerState.break_duration}
            onComplete={completeBreak}
            t={t}
            exerciseTranslations={t.exercises}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col items-center justify-center p-6"
      >
        {/* Header */}
        <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Activity className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-foreground leading-tight">{t.appName}</h1>
              <p className="text-xs text-muted-foreground leading-tight">
                {isTauriAvailable ? t.desktopApp : t.webPreview}
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
            language={language}
            onLanguageChange={changeLanguage}
            t={t}
          />
        </div>

        {/* Timer circle */}
        <TimerDisplay
          remainingSeconds={timerState.remaining_seconds}
          isRunning={timerState.is_running}
          totalSeconds={timerState.work_duration * 60}
          t={t}
        />

        {/* Controls */}
        <div className="flex items-center gap-4 mt-7">
          <Button
            variant="outline"
            size="icon"
            onClick={resetTimer}
            className="w-11 h-11 rounded-full"
            title={t.reset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            size="lg"
            onClick={handlePlayPause}
            className="w-16 h-16 rounded-full shadow-md"
          >
            {timerState.is_running
              ? <Pause className="h-6 w-6" />
              : <Play className="h-6 w-6 ml-0.5" />
            }
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={showBreakWindow}
            className="w-11 h-11 rounded-full"
            title={t.startBreakNow}
          >
            <Timer className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-10 w-full max-w-xs">
          <Card className="bg-card/60 border-border/50">
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                {t.work}
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {timerState.work_duration}
                <span className="text-sm font-normal text-muted-foreground ml-1">{t.min}</span>
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card/60 border-border/50">
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                {t.break}
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {timerState.break_duration}
                <span className="text-sm font-normal text-muted-foreground ml-1">{t.min}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Hint */}
        <p className="mt-7 text-xs text-muted-foreground">
          {t.pressSpace}{" "}
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Space</kbd>{" "}
          {t.toToggle}
        </p>
      </motion.div>
    </main>
  );
}
