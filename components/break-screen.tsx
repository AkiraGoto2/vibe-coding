"use client";

import { useState, useEffect, useCallback } from "react";
import { ExerciseCard } from "./exercise-card";
import { useExercises } from "@/hooks/use-exercises";
import { useSound } from "@/hooks/use-sound";
import { Exercise } from "@/lib/exercises";
import { motion, AnimatePresence } from "framer-motion";
import { Translations } from "@/lib/i18n";
import { Loader2 } from "lucide-react";

interface BreakScreenProps {
  breakDuration: number;
  onComplete: () => void;
  t: Translations;
  exerciseTranslations: Translations["exercises"];
}

export function BreakScreen({ breakDuration, onComplete, t, exerciseTranslations }: BreakScreenProps) {
  const { exercises: allExercises, loading: exercisesLoading, source } = useExercises();
  const sound = useSound();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

  // Pick exercises to fill the break duration
  useEffect(() => {
    if (allExercises.length === 0) return;

    const totalSecs = breakDuration * 60;
    const shuffled = [...allExercises].sort(() => Math.random() - 0.5);
    const selected: Exercise[] = [];
    let accumulated = 0;

    for (const ex of shuffled) {
      if (accumulated + ex.duration <= totalSecs || selected.length === 0) {
        selected.push(ex);
        accumulated += ex.duration;
        if (accumulated >= totalSecs) break;
      }
    }

    setSelectedExercises(selected.length > 0 ? selected : shuffled.slice(0, 3));
    setCurrentExerciseIndex(0);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [allExercises, breakDuration]);

  const currentExercise = selectedExercises[currentExerciseIndex];

  // Reset timer when exercise changes + play transition sound
  useEffect(() => {
    setCurrentTime(0);
    if (currentExerciseIndex > 0) {
      sound.playExerciseTransition();
    }
  }, [currentExerciseIndex]);

  // Countdown
  useEffect(() => {
    if (!isPlaying || !currentExercise) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 1;
        if (next >= currentExercise.duration) {
          if (currentExerciseIndex < selectedExercises.length - 1) {
            setCurrentExerciseIndex((i) => i + 1);
            return 0;
          }
          return currentExercise.duration;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentExercise, currentExerciseIndex, selectedExercises.length]);

  // Auto-complete when last exercise finishes
  useEffect(() => {
    if (!currentExercise) return;
    const isLast = currentExerciseIndex === selectedExercises.length - 1;
    if (isLast && currentTime >= currentExercise.duration) {
      const timeout = setTimeout(() => {
        sound.playCompletion();
        onComplete();
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [currentTime, currentExercise, currentExerciseIndex, selectedExercises.length, onComplete]);

  // Space = pause/resume
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handlePlayPause = useCallback(() => setIsPlaying((p) => !p), []);

  const handleSkip = useCallback(() => {
    if (currentExerciseIndex < selectedExercises.length - 1) {
      setCurrentExerciseIndex((i) => i + 1);
      setCurrentTime(0);
    }
  }, [currentExerciseIndex, selectedExercises.length]);

  // Show loading while exercises fetch
  if (exercisesLoading || selectedExercises.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center gap-4"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t.breakScreen.title}...</p>
      </motion.div>
    );
  }

  // Apply i18n only for built-in exercises (API exercises are already in English)
  const exTrans = source === "api" || source === "cache"
    ? null
    : exerciseTranslations[currentExercise?.id as keyof typeof exerciseTranslations];
  const translatedExercise = exTrans && currentExercise
    ? { ...currentExercise, name: exTrans.name, description: exTrans.description }
    : currentExercise;

  if (!translatedExercise) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-50 flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-border/40 shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t.breakScreen.title} 🧘</h1>
          <p className="text-sm text-muted-foreground">
            {t.breakScreen.subtitle}
            {source === "api" && (
              <span className="ml-2 text-xs text-primary/60">· ExerciseDB</span>
            )}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {selectedExercises.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx < currentExerciseIndex  ? "w-2 bg-primary/50" :
                idx === currentExerciseIndex ? "w-8 bg-primary" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 py-4 overflow-hidden min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentExercise.id}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full h-full flex"
          >
            <ExerciseCard
              exercise={translatedExercise}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onSkip={handleSkip}
              onComplete={() => { sound.playCompletion(); onComplete(); }}
              isLast={currentExerciseIndex === selectedExercises.length - 1}
              exerciseIndex={currentExerciseIndex}
              totalExercises={selectedExercises.length}
              t={t}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom hint */}
      <div className="text-center pb-4 shrink-0">
        <p className="text-xs text-muted-foreground">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Space</kbd>{" "}
          {t.breakScreen.spaceHint}
        </p>
      </div>
    </motion.div>
  );
}
