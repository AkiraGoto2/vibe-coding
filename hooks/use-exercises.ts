"use client";

import { useState, useEffect, useCallback } from "react";
import { Exercise, exercises as fallbackExercises } from "@/lib/exercises";

export type ExerciseSource = "api" | "cache" | "fallback" | "no-api-key" | "loading";

interface UseExercisesResult {
  exercises: Exercise[];
  source: ExerciseSource;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// In-memory cache so we don't re-fetch on every break
let memCache: Exercise[] | null = null;
let memCacheTime = 0;
const MEM_TTL = 1000 * 60 * 30; // 30 minutes client-side cache

function mapApiExercise(ex: {
  id: string;
  name: string;
  gifUrl: string;
  instructions: string[];
  category: Exercise["category"];
  duration: number;
  target: string;
  bodyPart: string;
}): Exercise {
  // Build a human-readable description from the instructions array
  const description = ex.instructions.length > 0
    ? ex.instructions.slice(0, 2).join(" ").slice(0, 180)
    : `${ex.name} — targets ${ex.target}`;

  return {
    id: ex.id,
    name: ex.name,
    description,
    duration: ex.duration,
    gifUrl: ex.gifUrl,
    category: ex.category,
  };
}

export function useExercises(): UseExercisesResult {
  const [exercises, setExercises] = useState<Exercise[]>(fallbackExercises);
  const [source, setSource] = useState<ExerciseSource>("loading");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExercises = useCallback(async () => {
    // Check client memory cache
    if (memCache && Date.now() - memCacheTime < MEM_TTL) {
      setExercises(memCache);
      setSource("cache");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/exercises");
      const data = await res.json();

      if (data.source === "no-api-key") {
        // No API key — silently use built-in exercises
        setExercises(fallbackExercises);
        setSource("no-api-key");
        setError(null);
      } else if (data.exercises && data.exercises.length > 0) {
        const mapped = (data.exercises as Parameters<typeof mapApiExercise>[0][]).map(mapApiExercise);
        memCache = mapped;
        memCacheTime = Date.now();
        setExercises(mapped);
        setSource(data.source === "cache" ? "cache" : "api");
      } else {
        // Empty response — fall back to built-in
        setExercises(fallbackExercises);
        setSource("fallback");
        if (data.error) setError(data.error);
      }
    } catch (err) {
      setExercises(fallbackExercises);
      setSource("fallback");
      setError("Failed to fetch exercises from API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExercises(); }, [fetchExercises]);

  return { exercises, source, loading, error, refetch: fetchExercises };
}
