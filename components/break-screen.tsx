"use client";

import { useState, useEffect, useCallback } from "react";
import { ExerciseCard } from "./exercise-card";
import { exercises } from "@/lib/exercises";
import { motion, AnimatePresence } from "framer-motion";
import { Translations } from "@/lib/i18n";

interface BreakScreenProps {
  breakDuration: number;
  onComplete: () => void;
  t: Translations;
  exerciseTranslations: Translations["exercises"];
}

export function BreakScreen({ breakDuration, onComplete, t, exerciseTranslations }: BreakScreenProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedExercises, setSelectedExercises] = useState(exercises.slice(0, 3));

  useEffect(() => {
    const totalSecs = breakDuration * 60;
    const shuffled = [...exercises].sort(() => Math.random() - 0.5);
    const selected = [];
    let accumulated = 0;
    for (const ex of shuffled) {
      if (accumulated + ex.duration <= totalSecs || selected.length === 0) {
        selected.push(ex);
        accumulated += ex.duration;
        if (accumulated >= totalSecs) break;
      }
    }
    setSelectedExercises(selected.length > 0 ? selected : shuffled.slice(0, 2));
    setCurrentExerciseIndex(0);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [breakDuration]);

  const currentExercise = selectedExercises[currentExerciseIndex];

  useEffect(() => { setCurrentTime(0); }, [currentExerciseIndex]);

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

  useEffect(() => {
    if (!currentExercise) return;
    const isLast = currentExerciseIndex === selectedExercises.length - 1;
    if (isLast && currentTime >= currentExercise.duration) {
      const timeout = setTimeout(() => onComplete(), 800);
      return () => clearTimeout(timeout);
    }
  }, [currentTime, currentExercise, currentExerciseIndex, selectedExercises.length, onComplete]);

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

  if (!currentExercise) return null;

  const exTrans = exerciseTranslations[currentExercise.id as keyof typeof exerciseTranslations];
  const translatedExercise = exTrans
    ? { ...currentExercise, name: exTrans.name, description: exTrans.description }
    : currentExercise;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-50 flex flex-col"
    >
      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t.breakScreen.title} 🧘</h1>
          <p className="text-sm text-muted-foreground">{t.breakScreen.subtitle}</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {selectedExercises.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-400 ${
                idx < currentExerciseIndex ? "w-2 bg-primary/60" :
                idx === currentExerciseIndex ? "w-8 bg-primary" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT — full height ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-4 overflow-hidden">
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
              onComplete={onComplete}
              isLast={currentExerciseIndex === selectedExercises.length - 1}
              exerciseIndex={currentExerciseIndex}
              totalExercises={selectedExercises.length}
              t={t}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── BOTTOM HINT ── */}
      <div className="text-center pb-4">
        <p className="text-xs text-muted-foreground">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Space</kbd>{" "}
          {t.breakScreen.spaceHint}
        </p>
      </div>
    </motion.div>
  );
}
