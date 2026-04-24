"use client";

import { useState, useEffect, useCallback } from "react";
import { ExerciseCard } from "./exercise-card";
import { useExercises, Exercise } from "@/hooks/use-exercises";
import { useSound } from "@/hooks/use-sound";
import { motion, AnimatePresence } from "framer-motion";
import { Translations } from "@/lib/i18n";
import { Loader2, Dumbbell } from "lucide-react";

interface BreakScreenProps {
  breakDuration: number;
  onComplete: () => void;
  t: Translations;
  exerciseTranslations: Translations["exercises"];
  language?: "en" | "ru";
}

export function BreakScreen({
  breakDuration, onComplete, t, exerciseTranslations, language = "en",
}: BreakScreenProps) {
  const { exercises: allExercises, loading: exercisesLoading, source } = useExercises(language);
  const sound = useSound();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selected, setSelected] = useState<Exercise[]>([]);

  // ── Select exercises that fit the break duration ──────────────────────────
  useEffect(() => {
    if (allExercises.length === 0) return;

    const totalSecs = Math.max(breakDuration * 60, 120); // min 2 min
    const shuffled = [...allExercises].sort(() => Math.random() - 0.5);
    const picked: Exercise[] = [];
    let acc = 0;

    for (const ex of shuffled) {
      if (acc + ex.duration <= totalSecs || picked.length === 0) {
        picked.push(ex);
        acc += ex.duration;
        if (acc >= totalSecs) break;
      }
    }

    setSelected(picked.length > 0 ? picked : shuffled.slice(0, 3));
    setCurrentIdx(0);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [allExercises, breakDuration]);

  const currentExercise = selected[currentIdx];

  // ── Reset timer + play soft transition sound on exercise change ────────────
  useEffect(() => {
    setCurrentTime(0);
    if (currentIdx > 0) sound.playExerciseTransition();
  }, [currentIdx]);

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !currentExercise) return;
    const id = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 1;
        if (next >= currentExercise.duration) {
          if (currentIdx < selected.length - 1) {
            setCurrentIdx((i) => i + 1);
            return 0;
          }
          return currentExercise.duration; // clamp at last exercise end
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying, currentExercise, currentIdx, selected.length]);

  // ── Auto-complete when last exercise finishes ──────────────────────────────
  useEffect(() => {
    if (!currentExercise) return;
    const isLast = currentIdx === selected.length - 1;
    if (isLast && currentTime >= currentExercise.duration) {
      const tid = setTimeout(() => {
        sound.playCompletion();
        onComplete();
      }, 600);
      return () => clearTimeout(tid);
    }
  }, [currentTime, currentExercise, currentIdx, selected.length, onComplete]);

  // ── Space = pause/resume ───────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const handlePlayPause = useCallback(() => setIsPlaying((p) => !p), []);

  const handleSkip = useCallback(() => {
    if (currentIdx < selected.length - 1) {
      setCurrentIdx((i) => i + 1);
      setCurrentTime(0);
    }
  }, [currentIdx, selected.length]);

  const handleComplete = useCallback(() => {
    sound.playCompletion();
    onComplete();
  }, [onComplete]);

  // Exercises are always pre-loaded from fallback — selected.length === 0 only briefly
  if (selected.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center gap-5"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Dumbbell className="w-7 h-7 text-primary animate-pulse" />
        </div>
        <p className="font-medium text-foreground">{t.breakScreen.title} 🧘</p>
      </motion.div>
    );
  }

  // DB exercises already have translated fields (applied in useExercises hook)
  const exTrans =
    source === "db"
      ? null
      : exerciseTranslations[currentExercise?.id as keyof typeof exerciseTranslations];

  const displayExercise = exTrans && currentExercise
    ? { ...currentExercise, name: exTrans.name, description: exTrans.description }
    : currentExercise;

  if (!displayExercise) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-50 flex flex-col"
    >
      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-border/40 shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {t.breakScreen.title} 🧘
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            {t.breakScreen.subtitle}
            {(source === "api" || source === "cache") && (
              <span className="text-xs text-primary/50 font-mono">· ExerciseDB</span>
            )}
          </p>
        </div>

        {/* Progress pills */}
        <div className="flex items-center gap-1.5">
          {selected.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { setCurrentIdx(idx); setCurrentTime(0); }}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx < currentIdx     ? "w-2 bg-primary/40" :
                idx === currentIdx   ? "w-8 bg-primary" :
                                       "w-2 bg-muted hover:bg-muted-foreground/30"
              }`}
              title={selected[idx]?.name}
            />
          ))}
        </div>
      </div>

      {/* ── EXERCISE ── */}
      <div className="flex-1 flex items-stretch justify-center px-6 py-4 overflow-hidden min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentExercise.id + currentIdx}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="w-full flex"
          >
            <ExerciseCard
              exercise={displayExercise}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onSkip={handleSkip}
              onComplete={handleComplete}
              isLast={currentIdx === selected.length - 1}
              exerciseIndex={currentIdx}
              totalExercises={selected.length}
              t={t}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── BOTTOM HINT ── */}
      <div className="text-center pb-4 shrink-0">
        <p className="text-xs text-muted-foreground">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Space</kbd>{" "}
          {t.breakScreen.spaceHint}
        </p>
      </div>
    </motion.div>
  );
}
