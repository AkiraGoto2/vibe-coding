"use client";

import { useState, useEffect, useCallback } from "react";

// Built-in fallback exercises — used immediately so break screen never hangs
const FALLBACK: Exercise[] = [
  { id: "neck-rolls",    name: "Neck Rolls",           description: "Slowly roll your head in circles. Keep shoulders relaxed. 3 rotations each direction.",        duration: 45, gifUrl: "https://media.giphy.com/media/26BoEiQmzfg2rrkYg/giphy.gif",  category: "stretch"  },
  { id: "shoulder-rolls",name: "Shoulder Rolls",        description: "Roll both shoulders backward in big circles, then forward. Releases upper back tension.",       duration: 40, gifUrl: "https://media.giphy.com/media/3oriO6qJiXajN0TyAU/giphy.gif", category: "stretch"  },
  { id: "wrist-stretch", name: "Wrist Stretch",         description: "Extend arm forward, pull fingers back with other hand. Hold 15 sec each side.",               duration: 40, gifUrl: "https://media.giphy.com/media/xT9IgG50Lg7russbDa/giphy.gif", category: "stretch"  },
  { id: "seated-twist",  name: "Seated Spinal Twist",   description: "Sit tall, right hand on left knee, twist left. Hold 20 sec, then switch sides.",              duration: 50, gifUrl: "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif",  category: "stretch"  },
  { id: "overhead-str",  name: "Overhead Arm Stretch",  description: "Interlace fingers, push palms to ceiling, hold 10 sec. Stretches the entire upper body.",      duration: 40, gifUrl: "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif",  category: "stretch"  },
  { id: "eye-focus",     name: "Eye Relaxation",        description: "Focus on a distant object 20 sec, then something close. Reduces eye strain (20-20-20 rule).", duration: 45, gifUrl: "https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif",       category: "relax"    },
  { id: "calf-raises",   name: "Seated Calf Raises",    description: "Sit with feet flat, raise heels off floor. Hold 2 sec, lower slowly. Repeat 15 times.",       duration: 50, gifUrl: "https://media.giphy.com/media/3oriNYQX2lC6dfW2Ji/giphy.gif", category: "strength" },
  { id: "standing-march",name: "Standing March",        description: "Stand and march in place lifting knees to hip height. Swing arms for 30 seconds.",             duration: 35, gifUrl: "https://media.giphy.com/media/l46Cy1rHbQ92uuLXa/giphy.gif",  category: "cardio"   },
  { id: "box-breathing", name: "Box Breathing",         description: "Inhale 4 sec → hold 4 sec → exhale 4 sec → hold 4 sec. Repeat 3 times.",                      duration: 55, gifUrl: "https://media.giphy.com/media/dVuyBgq2z5gVBkFtDc/giphy.gif",  category: "relax"    },
  { id: "hip-flexor",    name: "Seated Hip Flexor",     description: "Sit on edge of chair, extend right leg back, feel stretch in hip. Hold 20 sec each side.",    duration: 50, gifUrl: "https://media.giphy.com/media/3o7TKP9ln2Dr6ze6f6/giphy.gif", category: "stretch"  },
];

const FALLBACK_RU: Record<string, { name: string; description: string }> = {
  "neck-rolls":     { name: "Вращение шеи",           description: "Медленно вращайте головой по кругу. Плечи расслаблены. 3 круга в каждую сторону." },
  "shoulder-rolls": { name: "Вращение плечами",        description: "Вращайте оба плеча назад большими кругами, затем вперёд. Снимает напряжение спины." },
  "wrist-stretch":  { name: "Растяжка запястий",       description: "Вытяните руку, потяните пальцы назад другой рукой. Держите 15 сек на каждую сторону." },
  "seated-twist":   { name: "Скрутка сидя",            description: "Сядьте прямо, правую руку на левое колено, повернитесь влево. 20 сек, смените сторону." },
  "overhead-str":   { name: "Растяжка рук вверх",      description: "Сцепите пальцы, потяните ладони вверх, держите 10 сек. Растягивает всё верхнее тело." },
  "eye-focus":      { name: "Отдых для глаз",          description: "Смотрите вдаль 20 сек, затем на близкий предмет. Снимает усталость глаз (20-20-20)." },
  "calf-raises":    { name: "Подъём на носки сидя",    description: "Сидя с ровными ногами, поднимите пятки. Держите 2 сек, опустите медленно. 15 раз." },
  "standing-march": { name: "Марш на месте",           description: "Встаньте и маршируйте на месте, поднимая колени до уровня бёдер. 30 секунд." },
  "box-breathing":  { name: "Квадратное дыхание",      description: "Вдох 4 сек → задержка 4 сек → выдох 4 сек → задержка 4 сек. 3 повторения." },
  "hip-flexor":     { name: "Растяжка бедра сидя",     description: "Сядьте на край стула, отведите правую ногу назад. Почувствуйте растяжку. 20 сек на сторону." },
};

export interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: number;
  gifUrl: string;
  category: "stretch" | "strength" | "cardio" | "relax";
}

export type ExerciseSource = "db" | "fallback" | "loading";

interface UseExercisesResult {
  exercises: Exercise[];
  source: ExerciseSource;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

let memCache: { exercises: Exercise[]; source: ExerciseSource; time: number } | null = null;
const MEM_TTL = 1000 * 60 * 30;

function applyLanguage(ex: Exercise, lang: "en" | "ru"): Exercise {
  if (lang === "ru") {
    const ru = FALLBACK_RU[ex.id];
    if (ru) return { ...ex, name: ru.name, description: ru.description };
  }
  return ex;
}

export function useExercises(language: "en" | "ru" = "en"): UseExercisesResult {
  // ✅ Initialize with fallback immediately — break screen never hangs
  const [exercises, setExercises] = useState<Exercise[]>(
    FALLBACK.map((e) => applyLanguage(e, language))
  );
  const [source, setSource] = useState<ExerciseSource>("fallback");
  const [loading, setLoading] = useState(false); // ✅ false — already have data
  const [error, setError] = useState<string | null>(null);

  const fetchExercises = useCallback(async () => {
    // Check memory cache first
    if (memCache && Date.now() - memCache.time < MEM_TTL) {
      setExercises(memCache.exercises.map((e) => applyLanguage(e, language)));
      setSource(memCache.source);
      return;
    }

    // Try to load better exercises from API in background
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s max

      const res = await fetch("/api/exercises", { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (Array.isArray(data.exercises) && data.exercises.length > 0) {
        const mapped = data.exercises.map((ex: Exercise) => applyLanguage(ex, language));
        memCache = { exercises: data.exercises, source: data.source, time: Date.now() };
        setExercises(mapped);
        setSource(data.source === "db" ? "db" : "fallback");
      }
    } catch (err) {
      // Network/DB error — we already have fallback displayed, just log quietly
      const msg = err instanceof Error ? err.message : String(err);
      if (msg !== "AbortError" && !msg.includes("abort")) {
        setError(msg);
      }
      // Keep showing fallback exercises — don't clear them
    }
  }, [language]);

  // Fetch in background after mount — doesn't block the UI
  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  // Re-apply language translations when language changes
  useEffect(() => {
    setExercises((prev) => prev.map((e) => applyLanguage(e, language)));
  }, [language]);

  return { exercises, source, loading, error, refetch: fetchExercises };
}
