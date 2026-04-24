// Exercise type and fallback data — re-exported for backward compatibility
// The canonical source is now hooks/use-exercises.ts

export interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: number; // seconds
  gifUrl: string;
  category: "stretch" | "strength" | "cardio" | "relax";
}

// Kept for any legacy imports — useExercises hook is the preferred way to get exercises
export const exercises: Exercise[] = [];
