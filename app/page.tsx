"use client";

import { useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TimerDisplay } from "@/components/timer-display";
import { SettingsPanel } from "@/components/settings-panel";
import { BreakScreen } from "@/components/break-screen";
import { AuthModal } from "@/components/auth-modal";
import { FeedbackModal } from "@/components/feedback-modal";
import { useTimer, useAutostart } from "@/hooks/use-tauri";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useSound } from "@/hooks/use-sound";
import {
  Play, Pause, RotateCcw, Timer, Activity,
  UserCircle2, LogOut, MessageSquare, CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export default function Home() {
  const { t, language, changeLanguage } = useLanguage();
  const { user, loading: authLoading, logout, isAdmin } = useAuth();
  const sound = useSound();

  const {
    timerState, startTimer, pauseTimer, resetTimer,
    setWorkDuration, setBreakDuration,
    completeBreak, showBreakWindow, isTauriAvailable,
  } = useTimer();

  const { enabled: autostartEnabled, toggle: toggleAutostart } = useAutostart();
  const [authOpen, setAuthOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Track previous remaining_seconds to detect the exact 0 crossing
  const prevRemaining = useState(timerState.remaining_seconds)[0];

  // Sync settings from DB when user logs in
  useEffect(() => {
    if (!user?.settings) return;
    const s = user.settings;
    if (s.workDuration)  setWorkDuration(s.workDuration);
    if (s.breakDuration) setBreakDuration(s.breakDuration);
    if (s.language)      changeLanguage(s.language as "en" | "ru");
  }, [user]);

  // Persist settings to DB (debounced)
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workDuration:  timerState.work_duration,
          breakDuration: timerState.break_duration,
          language,
        }),
      }).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [timerState.work_duration, timerState.break_duration, language, user]);

  // Auto-trigger break when timer hits 0 + play sound
  useEffect(() => {
    if (timerState.remaining_seconds === 0 && !timerState.is_break_time) {
      sound.playWorkEnd();
      showBreakWindow();
    }
  }, [timerState.remaining_seconds, timerState.is_break_time]);

  // Play sound when break completes and timer restarts
  const handleCompleteBreak = useCallback(async () => {
    sound.playBreakEnd();
    await completeBreak();
  }, [completeBreak]);

  // Space shortcut
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
            onComplete={handleCompleteBreak}
            t={t}
            exerciseTranslations={t.exercises}
            language={language}
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
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-foreground leading-tight">{t.appName}</h1>
              <p className="text-xs text-muted-foreground leading-tight">
                {isTauriAvailable ? t.desktopApp : t.webPreview}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost" size="sm"
              onClick={() => setFeedbackOpen(true)}
              className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-full px-3"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {t.feedback.feedbackBtn}
            </Button>

            {authLoading ? null : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-3 py-2">
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="flex items-center gap-1 text-xs text-green-500 mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t.auth.syncSettings}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild className="gap-2 text-primary">
                        <Link href="/admin">
                          <ShieldCheck className="w-4 h-4" />
                          {language === "ru" ? "Панель администратора" : "Admin Panel"}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={logout} className="text-destructive gap-2">
                    <LogOut className="w-4 h-4" />
                    {t.auth.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline" size="sm"
                onClick={() => setAuthOpen(true)}
                className="h-9 gap-1.5 text-xs rounded-full px-3"
              >
                <UserCircle2 className="w-3.5 h-3.5" />
                {t.auth.login}
              </Button>
            )}

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
              sound={sound}
            />
          </div>
        </div>

        {/* Timer */}
        <TimerDisplay
          remainingSeconds={timerState.remaining_seconds}
          isRunning={timerState.is_running}
          totalSeconds={timerState.work_duration * 60}
          t={t}
        />

        {/* Controls */}
        <div className="flex items-center gap-4 mt-7">
          <Button
            variant="outline" size="icon"
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
              : <Play className="h-6 w-6 ml-0.5" />}
          </Button>

          <Button
            variant="outline" size="icon"
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
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t.work}</p>
              <p className="text-2xl font-semibold tabular-nums">
                {timerState.work_duration}
                <span className="text-sm font-normal text-muted-foreground ml-1">{t.min}</span>
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card/60 border-border/50">
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t.break}</p>
              <p className="text-2xl font-semibold tabular-nums">
                {timerState.break_duration}
                <span className="text-sm font-normal text-muted-foreground ml-1">{t.min}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="mt-7 text-xs text-muted-foreground">
          {t.pressSpace}{" "}
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Space</kbd>{" "}
          {t.toToggle}
        </p>
      </motion.div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} t={t} />
      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        t={t}
        onOpenAuth={() => setAuthOpen(true)}
      />
    </main>
  );
}
