import { NextResponse } from "next/server";

// Office-friendly body parts from ExerciseDB
// We target muscles that can be exercised at/near a desk
const OFFICE_BODY_PARTS = [
  "neck",
  "upper arms",
  "upper legs",
  "waist",
  "back",
  "shoulders",
  "chest",
  "cardio",
] as const;

// Exercises that work at a desk (by equipment type)
const OFFICE_EQUIPMENT = [
  "body weight",
  "band",
] as const;

// Cache in-memory for the process lifetime so we don't hammer the API
let cachedExercises: OfficeExercise[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

export interface OfficeExercise {
  id: string;
  name: string;
  gifUrl: string;
  target: string;       // primary muscle
  bodyPart: string;
  equipment: string;
  instructions: string[];
  category: "stretch" | "strength" | "cardio" | "relax";
  duration: number;     // seconds — we derive this from the exercise type
}

function deriveCategory(bodyPart: string, equipment: string, name: string): OfficeExercise["category"] {
  const lc = name.toLowerCase();
  if (lc.includes("stretch") || lc.includes("rotation") || lc.includes("roll") || lc.includes("tilt") || lc.includes("twist") || lc.includes("flexion") || bodyPart === "neck") return "stretch";
  if (lc.includes("cardio") || lc.includes("march") || lc.includes("jumping") || bodyPart === "cardio") return "cardio";
  if (lc.includes("relax") || lc.includes("breath") || lc.includes("meditation")) return "relax";
  return "strength";
}

function deriveDuration(category: OfficeExercise["category"]): number {
  switch (category) {
    case "stretch": return 45;
    case "strength": return 60;
    case "cardio": return 60;
    case "relax": return 30;
  }
}

async function fetchExercisesFromAPI(): Promise<OfficeExercise[]> {
  const apiKey = process.env.EXERCISEDB_API_KEY;
  if (!apiKey || apiKey === "your-rapidapi-key-here") {
    throw new Error("EXERCISEDB_API_KEY not configured");
  }

  const headers = {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
  };

  // Fetch exercises for each office-friendly body part in parallel
  const results = await Promise.allSettled(
    OFFICE_BODY_PARTS.map((part) =>
      fetch(
        `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${encodeURIComponent(part)}?limit=50&offset=0`,
        { headers }
      ).then((r) => r.json())
    )
  );

  const allExercises: OfficeExercise[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const data = result.value;
    if (!Array.isArray(data)) continue;

    for (const ex of data) {
      // Only body weight or band exercises — no machines, barbells, etc.
      if (!OFFICE_EQUIPMENT.includes(ex.equipment)) continue;

      // Skip exercises that clearly require lying on floor (not desk-friendly)
      const nameLower = (ex.name as string).toLowerCase();
      const skipKeywords = ["lying", "floor", "push-up", "pushup", "pull-up", "pullup", "plank", "sit-up", "situp", "crunch", "lunge", "squat jump", "burpee", "handstand"];
      if (skipKeywords.some((kw) => nameLower.includes(kw))) continue;

      const category = deriveCategory(ex.bodyPart, ex.equipment, ex.name);
      const duration = deriveDuration(category);

      allExercises.push({
        id: ex.id,
        name: ex.name
          .split(" ")
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        gifUrl: ex.gifUrl,
        target: ex.target,
        bodyPart: ex.bodyPart,
        equipment: ex.equipment,
        instructions: ex.instructions ?? [],
        category,
        duration,
      });
    }
  }

  // Remove duplicates by id
  const unique = Array.from(new Map(allExercises.map((e) => [e.id, e])).values());

  // Shuffle so variety changes between sessions
  return unique.sort(() => Math.random() - 0.5);
}

export async function GET() {
  try {
    const now = Date.now();

    // Return cached data if fresh
    if (cachedExercises && now - cacheTime < CACHE_TTL) {
      return NextResponse.json({ exercises: cachedExercises, source: "cache" });
    }

    const exercises = await fetchExercisesFromAPI();
    cachedExercises = exercises;
    cacheTime = now;

    return NextResponse.json({ exercises, source: "api" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    // If API key not set, return the built-in fallback exercises
    if (msg.includes("EXERCISEDB_API_KEY not configured")) {
      return NextResponse.json({
        exercises: [],
        source: "no-api-key",
        error: "ExerciseDB API key not configured. Add EXERCISEDB_API_KEY to .env",
      });
    }

    console.error("[exercises api]", err);
    return NextResponse.json(
      { exercises: [], source: "error", error: msg },
      { status: 500 }
    );
  }
}
