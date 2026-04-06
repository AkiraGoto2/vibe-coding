export interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  videoUrl: string;
  category: "stretch" | "strength" | "cardio" | "relax";
}

export const exercises: Exercise[] = [
  {
    id: "neck-rolls",
    name: "Neck Rolls",
    description: "Slowly roll your head in a circular motion, first clockwise then counter-clockwise. Keep your shoulders relaxed and breathe deeply.",
    duration: 60,
    videoUrl: "https://www.youtube.com/embed/wFsVeISYLzc?autoplay=1&mute=1",
    category: "stretch",
  },
  {
    id: "shoulder-shrugs",
    name: "Shoulder Shrugs",
    description: "Raise your shoulders up towards your ears, hold for 2 seconds, then release. Repeat slowly while breathing deeply.",
    duration: 45,
    videoUrl: "https://www.youtube.com/embed/s3yH4qxWjPQ?autoplay=1&mute=1",
    category: "stretch",
  },
  {
    id: "standing-stretch",
    name: "Standing Side Stretch",
    description: "Stand tall, raise one arm overhead and lean to the opposite side. Hold for 15 seconds, then switch sides.",
    duration: 60,
    videoUrl: "https://www.youtube.com/embed/1JYOZpCIGFQ?autoplay=1&mute=1",
    category: "stretch",
  },
  {
    id: "wrist-circles",
    name: "Wrist Circles",
    description: "Extend your arms in front of you and rotate your wrists in circles. This helps relieve tension from typing.",
    duration: 45,
    videoUrl: "https://www.youtube.com/embed/TSrfB7JIzxY?autoplay=1&mute=1",
    category: "stretch",
  },
  {
    id: "desk-squats",
    name: "Desk Squats",
    description: "Stand in front of your chair, lower yourself until you almost sit, then stand back up. Keep your core engaged.",
    duration: 60,
    videoUrl: "https://www.youtube.com/embed/aclHkVaku9U?autoplay=1&mute=1",
    category: "strength",
  },
  {
    id: "calf-raises",
    name: "Calf Raises",
    description: "Stand behind your chair for support, raise up onto your toes, hold briefly, then lower back down slowly.",
    duration: 45,
    videoUrl: "https://www.youtube.com/embed/gwLzBJYoWlI?autoplay=1&mute=1",
    category: "strength",
  },
  {
    id: "torso-twist",
    name: "Seated Torso Twist",
    description: "Sit up straight, place your right hand on your left knee and twist your torso to the left. Hold, then switch sides.",
    duration: 60,
    videoUrl: "https://www.youtube.com/embed/SB1sIELFM0E?autoplay=1&mute=1",
    category: "stretch",
  },
  {
    id: "march-in-place",
    name: "March in Place",
    description: "Stand and march in place, lifting your knees high. Swing your arms naturally to get your blood flowing.",
    duration: 60,
    videoUrl: "https://www.youtube.com/embed/L0A4L04uogk?autoplay=1&mute=1",
    category: "cardio",
  },
  {
    id: "eye-exercise",
    name: "Eye Relaxation",
    description: "Close your eyes and gently press your palms over them. Breathe deeply and let your eyes rest from screen light.",
    duration: 30,
    videoUrl: "https://www.youtube.com/embed/aezNvlvMbSk?autoplay=1&mute=1",
    category: "relax",
  },
  {
    id: "hip-circles",
    name: "Hip Circles",
    description: "Stand with feet shoulder-width apart and hands on hips. Make large circles with your hips, clockwise then counter-clockwise.",
    duration: 45,
    videoUrl: "https://www.youtube.com/embed/6PDPG90nQpc?autoplay=1&mute=1",
    category: "stretch",
  },
  {
    id: "arm-circles",
    name: "Arm Circles",
    description: "Extend your arms out to the sides and make small circles, gradually increasing the size. Switch direction after 15 seconds.",
    duration: 45,
    videoUrl: "https://www.youtube.com/embed/bOnSfLjJkrM?autoplay=1&mute=1",
    category: "cardio",
  },
  {
    id: "forward-fold",
    name: "Standing Forward Fold",
    description: "Stand tall, then slowly bend forward from your hips, letting your arms hang down. Relax your neck and breathe deeply.",
    duration: 45,
    videoUrl: "https://www.youtube.com/embed/g7Uhp5tphAs?autoplay=1&mute=1",
    category: "stretch",
  },
];

export function getRandomExercises(count: number): Exercise[] {
  const shuffled = [...exercises].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getExercisesByCategory(category: Exercise["category"]): Exercise[] {
  return exercises.filter((e) => e.category === category);
}
