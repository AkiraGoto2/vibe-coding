export interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  gifUrl: string;
  category: "stretch" | "strength" | "cardio" | "relax";
}

// Using Giphy-style exercise GIFs from public sources
export const exercises: Exercise[] = [
  {
    id: "neck-rolls",
    name: "Neck Rolls",
    description: "Slowly roll your head in a circular motion.",
    duration: 60,
    gifUrl: "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif",
    category: "stretch",
  },
  {
    id: "shoulder-shrugs",
    name: "Shoulder Shrugs",
    description: "Raise your shoulders up towards your ears, hold, then release.",
    duration: 45,
    gifUrl: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
    category: "stretch",
  },
  {
    id: "standing-stretch",
    name: "Side Stretch",
    description: "Raise one arm overhead and lean to the opposite side.",
    duration: 60,
    gifUrl: "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif",
    category: "stretch",
  },
  {
    id: "wrist-circles",
    name: "Wrist Circles",
    description: "Rotate your wrists in circles to relieve typing tension.",
    duration: 45,
    gifUrl: "https://media.giphy.com/media/xT9IgG50Lg7russbDa/giphy.gif",
    category: "stretch",
  },
  {
    id: "desk-squats",
    name: "Desk Squats",
    description: "Lower yourself until almost seated, then stand back up.",
    duration: 60,
    gifUrl: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    category: "strength",
  },
  {
    id: "calf-raises",
    name: "Calf Raises",
    description: "Rise onto your toes, hold briefly, then lower slowly.",
    duration: 45,
    gifUrl: "https://media.giphy.com/media/3oriNYQX2lC6dfW2Ji/giphy.gif",
    category: "strength",
  },
  {
    id: "torso-twist",
    name: "Torso Twist",
    description: "Twist your torso left and right while seated.",
    duration: 60,
    gifUrl: "https://media.giphy.com/media/3o7TKF1fSIs1R19B8k/giphy.gif",
    category: "stretch",
  },
  {
    id: "march-in-place",
    name: "March in Place",
    description: "Lift your knees high and swing arms to get blood flowing.",
    duration: 60,
    gifUrl: "https://media.giphy.com/media/l46Cy1rHbQ92uuLXa/giphy.gif",
    category: "cardio",
  },
  {
    id: "eye-exercise",
    name: "Eye Relaxation",
    description: "Close eyes, press palms gently, breathe deeply.",
    duration: 30,
    gifUrl: "https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif",
    category: "relax",
  },
  {
    id: "hip-circles",
    name: "Hip Circles",
    description: "Make large circles with your hips in both directions.",
    duration: 45,
    gifUrl: "https://media.giphy.com/media/3o7TKP9ln2Dr6ze6f6/giphy.gif",
    category: "stretch",
  },
  {
    id: "arm-circles",
    name: "Arm Circles",
    description: "Extend arms and make circles, switch direction after 15 seconds.",
    duration: 45,
    gifUrl: "https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif",
    category: "cardio",
  },
  {
    id: "forward-fold",
    name: "Forward Fold",
    description: "Bend forward from hips, let arms hang down, breathe deeply.",
    duration: 45,
    gifUrl: "https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif",
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
