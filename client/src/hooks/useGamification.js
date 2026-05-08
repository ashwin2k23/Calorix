import { useMemo, useEffect, useRef } from 'react';

const TODAY = new Date().toISOString().split('T')[0];

// ── XP & Level ──────────────────────────────────────────────────────────────
const XP_PER_MEAL      = 10;
const XP_PER_STREAK    = 25;
const XP_WATER_GOAL    = 20;
const XP_PROTEIN_GOAL  = 15;

const LEVELS = [
  { level: 1, title: 'Nutrition Newbie',  xpRequired: 0    },
  { level: 2, title: 'Health Explorer',   xpRequired: 100  },
  { level: 3, title: 'Diet Warrior',      xpRequired: 250  },
  { level: 4, title: 'Macro Master',      xpRequired: 500  },
  { level: 5, title: 'Fitness Champion',  xpRequired: 900  },
  { level: 6, title: 'Wellness Legend',   xpRequired: 1500 },
];

// ── Badge Definitions ────────────────────────────────────────────────────────
const BADGE_DEFS = [
  {
    id: 'first_meal',
    name: 'First Bite',
    icon: '🍽️',
    desc: 'Logged your first meal',
    check: (meals) => meals.length >= 1,
  },
  {
    id: 'streak_7',
    name: '7-Day Streak',
    icon: '🔥',
    desc: 'Logged meals 7 days in a row',
    check: (meals) => calcStreak(meals) >= 7,
  },
  {
    id: 'streak_30',
    name: 'Consistency King',
    icon: '👑',
    desc: 'Logged meals 30 days in a row',
    check: (meals) => calcStreak(meals) >= 30,
  },
  {
    id: 'protein_master',
    name: 'Protein Master',
    icon: '💪',
    desc: 'Hit protein goal 5 times',
    check: (meals, _, profile) => countProteinGoalDays(meals, profile) >= 5,
  },
  {
    id: 'hydration_hero',
    name: 'Hydration Hero',
    icon: '💧',
    desc: 'Hit water goal today',
    check: (_, waterToday, profile) =>
      waterToday >= (profile?.hydration_target || 3000),
  },
  {
    id: 'macro_tracker',
    name: 'Macro Tracker',
    icon: '📊',
    desc: 'Logged 50 meals total',
    check: (meals) => meals.length >= 50,
  },
  {
    id: 'healthy_week',
    name: 'Healthy Week',
    icon: '🥗',
    desc: 'Logged meals every day for a week',
    check: (meals) => calcStreak(meals) >= 7,
  },
  {
    id: 'calorie_goal',
    name: 'Goal Crusher',
    icon: '🎯',
    desc: 'Stayed within calorie goal 3 days',
    check: (meals, _, profile) => countCalorieGoalDays(meals, profile) >= 3,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function calcStreak(meals) {
  let streak = 0;
  const d = new Date();
  const todayHas = meals.some(m => m.created_at?.startsWith(TODAY));
  if (!todayHas) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().split('T')[0];
    if (meals.some(m => m.created_at?.startsWith(dateStr))) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

function getDailyTotals(meals, key) {
  const byDay = {};
  meals.forEach(m => {
    const day = m.created_at?.split('T')[0];
    if (!day) return;
    byDay[day] = (byDay[day] || 0) + (m[key] || 0);
  });
  return byDay;
}

function countProteinGoalDays(meals, profile) {
  if (!profile?.protein_target) return 0;
  const byDay = getDailyTotals(meals, 'protein');
  return Object.values(byDay).filter(v => v >= profile.protein_target).length;
}

function countCalorieGoalDays(meals, profile) {
  if (!profile?.calorie_target) return 0;
  const byDay = getDailyTotals(meals, 'calories');
  return Object.values(byDay).filter(v => v > 0 && v <= profile.calorie_target * 1.05).length;
}

function calcXP(meals, streak, waterToday, profile) {
  let xp = meals.length * XP_PER_MEAL;
  xp += streak * XP_PER_STREAK;
  if (waterToday >= (profile?.hydration_target || 3000)) xp += XP_WATER_GOAL;
  if (profile?.protein_target) {
    const todayProtein = meals
      .filter(m => m.created_at?.startsWith(TODAY))
      .reduce((s, m) => s + (m.protein || 0), 0);
    if (todayProtein >= profile.protein_target) xp += XP_PROTEIN_GOAL;
  }
  return xp;
}

function getLevel(xp) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }
  const progress = next
    ? ((xp - current.xpRequired) / (next.xpRequired - current.xpRequired)) * 100
    : 100;
  return { ...current, next, progress: Math.min(progress, 100), xp };
}

// ── Main Hook ────────────────────────────────────────────────────────────────
export function useGamification({ meals = [], waterToday = 0, profile = null }) {
  const streak = useMemo(() => calcStreak(meals), [meals]);

  const earnedBadges = useMemo(() =>
    BADGE_DEFS.filter(b => b.check(meals, waterToday, profile)).map(b => b.id),
    [meals, waterToday, profile]
  );

  const badges = useMemo(() =>
    BADGE_DEFS.map(b => ({ ...b, earned: earnedBadges.includes(b.id) })),
    [earnedBadges]
  );

  const xp = useMemo(() => calcXP(meals, streak, waterToday, profile), [meals, streak, waterToday, profile]);
  const levelInfo = useMemo(() => getLevel(xp), [xp]);

  // Detect newly earned badges for popup
  const prevBadgesRef = useRef(null);
  const newBadges = useMemo(() => {
    const prev = prevBadgesRef.current;
    if (!prev) {
      prevBadgesRef.current = earnedBadges;
      return [];
    }
    const newOnes = earnedBadges.filter(id => !prev.includes(id));
    prevBadgesRef.current = earnedBadges;
    return newOnes.map(id => BADGE_DEFS.find(b => b.id === id));
  }, [earnedBadges]);

  const streakData = useMemo(() => {
    // Water streak: days consecutively hitting water goal (simplified - uses localStorage)
    const today = waterToday >= (profile?.hydration_target || 3000) ? 1 : 0;
    return {
      dailyStreak: streak,
      waterStreak: today, // simplified
      proteinStreak: countProteinGoalDays(meals, profile),
    };
  }, [streak, waterToday, profile, meals]);

  return { streak, badges, levelInfo, xp, newBadges, streakData };
}

export { calcStreak, BADGE_DEFS, LEVELS };
