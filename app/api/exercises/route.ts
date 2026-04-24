import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Curated office-friendly exercises with reliable Giphy GIFs
// These show real people performing the exercise
const FALLBACK_EXERCISES = [
  {
    id: "neck-rolls",
    name: "Neck Rolls",
    nameRu: "Вращение шеи",
    description: "Slowly roll your head in a full circle. Keep shoulders relaxed. 3 rotations each direction.",
    descriptionRu: "Медленно вращайте головой по кругу. Плечи расслаблены. 3 круга в каждую сторону.",
    gifUrl: "https://media.giphy.com/media/26BoEiQmzfg2rrkYg/giphy.gif",
    category: "stretch",
    duration: 45,
  },
  {
    id: "shoulder-rolls",
    name: "Shoulder Rolls",
    nameRu: "Вращение плечами",
    description: "Roll both shoulders backward in big circles, then forward. Releases upper back tension.",
    descriptionRu: "Вращайте оба плеча назад большими кругами, затем вперёд. Снимает напряжение верхней части спины.",
    gifUrl: "https://media.giphy.com/media/3oriO6qJiXajN0TyAU/giphy.gif",
    category: "stretch",
    duration: 40,
  },
  {
    id: "wrist-stretch",
    name: "Wrist Stretch",
    nameRu: "Растяжка запястий",
    description: "Extend arm forward, pull fingers back with other hand. Hold 15 sec each side.",
    descriptionRu: "Вытяните руку, потяните пальцы назад другой рукой. Держите 15 сек на каждую сторону.",
    gifUrl: "https://media.giphy.com/media/xT9IgG50Lg7russbDa/giphy.gif",
    category: "stretch",
    duration: 40,
  },
  {
    id: "seated-twist",
    name: "Seated Spinal Twist",
    nameRu: "Скрутка сидя",
    description: "Sit tall, right hand on left knee, twist left. Hold 20 sec, then switch sides.",
    descriptionRu: "Сядьте прямо, правую руку на левое колено, повернитесь влево. 20 сек, смените сторону.",
    gifUrl: "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif",
    category: "stretch",
    duration: 50,
  },
  {
    id: "overhead-stretch",
    name: "Overhead Arm Stretch",
    nameRu: "Растяжка рук вверх",
    description: "Interlace fingers, push palms to ceiling, hold 10 sec. Stretches the entire upper body.",
    descriptionRu: "Сцепите пальцы, потяните ладони вверх, держите 10 сек. Растягивает всё верхнее тело.",
    gifUrl: "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif",
    category: "stretch",
    duration: 40,
  },
  {
    id: "eye-focus",
    name: "Eye Focus Exercise",
    nameRu: "Упражнение для глаз",
    description: "Focus on a distant object for 20 sec, then something close. Reduces eye strain (20-20-20 rule).",
    descriptionRu: "Смотрите вдаль 20 сек, затем на близкий предмет. Снимает усталость глаз (правило 20-20-20).",
    gifUrl: "https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif",
    category: "relax",
    duration: 45,
  },
  {
    id: "calf-raises",
    name: "Seated Calf Raises",
    nameRu: "Подъём на носки сидя",
    description: "Sit with feet flat, raise heels off floor. Hold 2 sec, lower slowly. Repeat 15 times.",
    descriptionRu: "Сидя с ровными ногами, поднимите пятки. Держите 2 сек, опустите медленно. 15 повторений.",
    gifUrl: "https://media.giphy.com/media/3oriNYQX2lC6dfW2Ji/giphy.gif",
    category: "strength",
    duration: 50,
  },
  {
    id: "standing-march",
    name: "Standing March",
    nameRu: "Марш на месте",
    description: "Stand and march in place lifting knees to hip height. Swing arms naturally for 30 seconds.",
    descriptionRu: "Встаньте и маршируйте на месте, поднимая колени до уровня бёдер. 30 секунд.",
    gifUrl: "https://media.giphy.com/media/l46Cy1rHbQ92uuLXa/giphy.gif",
    category: "cardio",
    duration: 35,
  },
  {
    id: "hip-flexor",
    name: "Seated Hip Flexor",
    nameRu: "Растяжка сгибателей бедра",
    description: "Sit on edge of chair, extend right leg back, feel stretch in hip. Hold 20 sec each side.",
    descriptionRu: "Сядьте на край стула, отведите правую ногу назад, почувствуйте растяжку. 20 сек на сторону.",
    gifUrl: "https://media.giphy.com/media/3o7TKP9ln2Dr6ze6f6/giphy.gif",
    category: "stretch",
    duration: 50,
  },
  {
    id: "box-breathing",
    name: "Box Breathing",
    nameRu: "Квадратное дыхание",
    description: "Inhale 4 sec → hold 4 sec → exhale 4 sec → hold 4 sec. Repeat 3 times. Instant stress relief.",
    descriptionRu: "Вдох 4 сек → задержка 4 сек → выдох 4 сек → задержка 4 сек. 3 повторения. Мгновенно снимает стресс.",
    gifUrl: "https://media.giphy.com/media/dVuyBgq2z5gVBkFtDc/giphy.gif",
    category: "relax",
    duration: 55,
  },
];

export async function GET() {
  // Try to serve from DB (admin-managed exercises)
  // Wrapped in try/catch so a DB error never breaks the break screen
  try {
    const { db } = await import("@/lib/db");

    const dbExercises = await Promise.race([
      db.exercise.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
      // 3s timeout — if DB is slow, fall back to built-ins immediately
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]).catch(() => [] as typeof dbExercises);

    if (Array.isArray(dbExercises) && dbExercises.length > 0) {
      return NextResponse.json({ exercises: dbExercises, source: "db" });
    }
  } catch {
    // DB not available — silently use fallback
  }

  return NextResponse.json({ exercises: FALLBACK_EXERCISES, source: "fallback" });
}
