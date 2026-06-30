import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, Droplets, Target, TrendingUp, Plus, Activity, Award, Dumbbell } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useGamification } from '@/hooks/useGamification';

const TODAY = new Date().toISOString().split('T')[0];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function buildWeeklyData(meals, target) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const cals = meals.filter(m => m.created_at?.startsWith(dateStr)).reduce((s, m) => s + (m.calories || 0), 0);
    return { day: days[d.getDay()], calories: cals, target };
  });
}

function StatCard({ title, value, subtext, icon, iconBg, progress, progressColor, loading }) {
  return (
    <div className="xh-card p-5 sm:p-7 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <p className="xh-label">{title}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
          {icon}
        </div>
      </div>
      {loading
        ? <Skeleton className="h-8 w-24 rounded-xl bg-[#edf0f7]" />
        : <p className="text-xl sm:text-2xl font-bold text-[#0E1929]">{value}</p>
      }
      <p className="text-xs text-[#9aa0b0] font-medium">{subtext}</p>
      <div className="xh-progress">
        <motion.div
          className="xh-progress-fill"
          style={{ background: progressColor }}
          initial={{ width: 0 }}
          animate={{ width: loading ? '0%' : `${progress}%` }}
          transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
        />
      </div>
    </div>
  );
}

function CalorieCard({ consumed, burned, goal, lastMeal }) {
  const net = consumed - burned;
  const pct = Math.min((Math.max(0, net) / Math.max(goal, 1)) * 100, 100);
  const remaining = Math.max(0, goal - net);
  const isOver = net > goal;

  return (
    <div className="xh-card p-5 sm:p-7 flex flex-col gap-4 sm:gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="xh-label mb-1">Net Calories</p>
          <p className="text-3xl sm:text-4xl font-bold text-[#0E1929] dark:text-white">
            {net.toLocaleString()}
            <span className="text-base sm:text-lg text-[#9aa0b0] font-medium ml-2">/ {goal.toLocaleString()} kcal</span>
          </p>
          {lastMeal && <p className="text-xs text-[#3456c8] font-medium mt-1">+{lastMeal.calories} from {lastMeal.name}</p>}
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${isOver ? 'bg-red-50 text-red-600' : 'bg-[#e8effe] text-[#12266e]'}`}>
          {isOver ? 'Over limit' : `${Math.round(pct)}% net used`}
        </div>
      </div>

      <div className="xh-progress" style={{ height: 10 }}>
        <motion.div
          className="xh-progress-fill"
          style={{ background: isOver ? '#ef4444' : 'linear-gradient(90deg,#3456c8,#12266e)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#edf0f7] dark:border-[#1e2a5f]">
        {[
          { label: 'Consumed', val: consumed.toLocaleString(), color: 'text-[#0E1929] dark:text-white' },
          { label: 'Burned', val: `-${burned.toLocaleString()}`, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Net Calories', val: net.toLocaleString(), color: 'text-[#3456c8] dark:text-blue-400' },
          { label: 'Remaining', val: remaining.toLocaleString(), color: 'text-[#9aa0b0]' },
        ].map(({ label, val, color }) => (
          <div key={label} className="text-center">
            <p className={`text-base font-bold ${color}`}>{val}</p>
            <p className="xh-label text-[10px]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MacroCard({ proteinConsumed, proteinGoal, carbsConsumed, carbsGoal, fatsConsumed, fatsGoal, loading }) {
  const macros = [
    { label: 'Protein', val: proteinConsumed, goal: proteinGoal, color: 'linear-gradient(90deg,#a78bfa,#7c3aed)', pColor: '#7c3aed' },
    { label: 'Carbs', val: carbsConsumed, goal: carbsGoal, color: 'linear-gradient(90deg,#fb923c,#ea580c)', pColor: '#ea580c' },
    { label: 'Fats', val: fatsConsumed, goal: fatsGoal, color: 'linear-gradient(90deg,#f87171,#dc2626)', pColor: '#dc2626' },
  ];
  return (
    <div className="xh-card p-7 flex flex-col gap-5">
      <p className="xh-label">Macro Targets</p>
      {loading
        ? [1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl bg-[#edf0f7]" />)
        : macros.map(m => {
          const pct = Math.min((m.val / Math.max(m.goal, 1)) * 100, 100);
          return (
            <div key={m.label} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-[#5a6478]">{m.label}</span>
                <span className="font-bold text-[#0E1929]">{m.val}g <span className="text-[#9aa0b0] font-normal">/ {m.goal}g</span></span>
              </div>
              <div className="xh-progress">
                <motion.div
                  className="xh-progress-fill"
                  style={{ background: m.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                />
              </div>
              <p className="text-xs text-[#9aa0b0]">{Math.round(pct)}% met · {Math.max(0, m.goal - m.val)}g left</p>
            </div>
          );
        })
      }
    </div>
  );
}

function HydrationCard({ userId, water, setWater, goal = 3000 }) {
  const pct = Math.min((water / goal) * 100, 100);
  const storageKey = `calorix_water_${userId}_${TODAY}`;

  const update = useCallback(async (val) => {
    const clamped = Math.max(0, Math.min(val, goal * 1.5));
    setWater(clamped);
    localStorage.setItem(storageKey, String(clamped));
    try { await api.upsertWater(userId, TODAY, clamped); } catch { }
  }, [userId, goal, storageKey, setWater]);

  return (
    <div className="xh-card p-7 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="xh-label">Hydration</p>
        <span className="xh-badge"><Droplets className="w-3 h-3" />{Math.round(pct)}%</span>
      </div>
      <div>
        <p className="text-3xl font-bold text-[#0E1929]">{water}<span className="text-base text-[#9aa0b0] font-normal ml-1">ml</span></p>
        <p className="text-sm text-[#9aa0b0]">of {goal}ml goal</p>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-6 rounded-md transition-all duration-500"
            style={{ background: i < Math.round(pct / 10) ? 'linear-gradient(180deg,#3456c8,#12266e)' : '#edf0f7' }} />
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => update(water + 250)}
          className="flex-1 xh-btn-outline text-sm py-2.5 justify-center">+250 ml</button>
        <button onClick={() => update(water + 500)}
          className="flex-1 xh-btn text-sm py-2.5 justify-center">+500 ml</button>
      </div>
      <button onClick={() => update(0)}
        className="xh-label text-center hover:text-[#5a6478] transition-colors cursor-pointer">
        Reset daily log
      </button>
    </div>
  );
}

function WeeklyChart({ weeklyData, goal, loading }) {
  return (
    <div className="xh-card p-7 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="xh-label">Weekly Progress</p>
        <span className="xh-badge"><TrendingUp className="w-3 h-3" />7 days</span>
      </div>
      <div className="h-[180px]">
        {loading
          ? <Skeleton className="w-full h-full rounded-2xl bg-[#edf0f7]" />
          : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3456c8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3456c8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#c8d0e0" fontSize={10} tickLine={false} axisLine={false}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }} />
                <YAxis stroke="#c8d0e0" fontSize={10} tickLine={false} axisLine={false}
                  style={{ fontFamily: "'DM Sans', sans-serif" }} />
                <Tooltip
                  cursor={{ stroke: '#3456c8', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white border border-[#edf0f7] rounded-2xl p-3 shadow-lg">
                        <p className="xh-label mb-1">{label}</p>
                        <p className="text-base font-bold text-[#0E1929]">{payload[0].value.toLocaleString()} kcal</p>
                        <p className="text-xs text-[#3456c8] font-medium">{Math.round((payload[0].value / goal) * 100)}% of target</p>
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={goal} stroke="#c8d0e0" strokeDasharray="4 4" strokeWidth={1.5} />
                <Area type="monotone" dataKey="calories" stroke="#3456c8" strokeWidth={2.5}
                  fillOpacity={1} fill="url(#areaFill)" animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          )
        }
      </div>
    </div>
  );
}

function DailyLogCard({ todayMeals }) {
  return (
    <div className="xh-card p-7 flex flex-col gap-4" style={{ minHeight: 360 }}>
      <div className="flex items-center justify-between">
        <p className="xh-label">Today's Log</p>
        <span className="xh-badge">{todayMeals.length} meals</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
        {todayMeals.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-40 text-center">
              <Activity className="w-8 h-8 text-[#c8d0e0] mb-2" />
              <p className="text-sm font-semibold text-[#9aa0b0]">No meals logged today</p>
              <p className="text-xs text-[#c8d0e0] mt-1">Use Add Meal to start</p>
            </div>
          )
          : todayMeals.map((meal, i) => (
            <div key={i} className={`flex items-center justify-between py-3.5 ${i !== todayMeals.length - 1 ? 'border-b border-[#f0f2f8]' : ''}`}>
              <div>
                <p className="text-sm font-bold text-[#0E1929] capitalize">{meal.name}</p>
                <p className="text-xs text-[#9aa0b0] mt-0.5">P:{Math.round(meal.protein)}g · C:{Math.round(meal.carbs)}g · F:{Math.round(meal.fats)}g</p>
              </div>
              <div className="xh-badge ml-3 flex-shrink-0">
                <Flame className="w-3 h-3" />{meal.calories} kcal
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function AdherenceGrid({ data }) {
  return (
    <div className="xh-card p-7">
      <div className="flex items-center justify-between mb-2">
        <p className="xh-label">Adherence Heatmap</p>
        <span className="xh-badge">Last 28 days</span>
      </div>
      <p className="text-xs text-[#9aa0b0] mb-5">Dark blue = on target · Red = over · Light = partial</p>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)', maxWidth: 280 }}>
        {data.map((day, idx) => {
          let bg = '#f0f2f8';
          if (day.value === 1) bg = '#dbeafe';
          else if (day.value === 2) bg = '#93c5fd';
          else if (day.value === 3) bg = '#12266e';
          else if (day.value === 4) bg = '#fca5a5';
          return (
            <div key={idx} title={`${day.date}: ${day.calories} kcal`}
              className="w-8 h-8 rounded-lg cursor-pointer hover:scale-110 transition-transform duration-150"
              style={{ background: bg }} />
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-5">
        <p className="xh-label">Less</p>
        {['#f0f2f8', '#dbeafe', '#93c5fd', '#12266e', '#fca5a5'].map((c, i) => (
          <div key={i} className="w-4 h-4 rounded" style={{ background: c }} />
        ))}
        <p className="xh-label">More</p>
      </div>
    </div>
  );
}

function WorkoutCard({ workoutsToday }) {
  return (
    <div className="xh-card p-7 flex flex-col gap-4" style={{ minHeight: 360 }}>
      <div className="flex items-center justify-between">
        <p className="xh-label">Today's Workouts</p>
        <span className="xh-badge">{workoutsToday.length} logged</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
        {workoutsToday.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 opacity-40 text-center">
            <Dumbbell className="w-8 h-8 text-[#c8d0e0] mb-2" />
            <p className="text-sm font-semibold text-[#9aa0b0]">No workouts today</p>
            <p className="text-xs text-[#c8d0e0] mt-1">Log one in the Fitness tab</p>
          </div>
        ) : (
          workoutsToday.map((w, i) => (
            <div key={i} className={`flex items-center justify-between py-3.5 ${i !== workoutsToday.length - 1 ? 'border-b border-[#f0f2f8]' : ''}`}>
              <div>
                <p className="text-sm font-bold text-[#0E1929] capitalize">{w.activity_name}</p>
                <p className="text-xs text-[#9aa0b0] mt-0.5">{w.duration_minutes}m · {w.intensity}</p>
              </div>
              <div className="ml-3 flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                -{w.calories_burned} kcal
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Overview({ profile, user }) {
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState([]);
  const [waterToday, setWaterToday] = useState(0);
  const [workouts, setWorkouts] = useState([]);

  const fetchMeals = useCallback(async () => {
    if (!user) return;
    try { const d = await api.getMeals(user.id); if (d.success) setMeals(d.data); } catch { }
  }, [user]);

  const fetchWater = useCallback(async () => {
    if (!user) return;
    try { const d = await api.getWater(user.id, TODAY); if (d.success && d.data.amount_ml > 0) setWaterToday(d.data.amount_ml); } catch { }
  }, [user]);

  const fetchWorkouts = useCallback(async () => {
    if (!user) return;
    try { const d = await api.getWorkouts(user.id); if (d.success) setWorkouts(d.data); } catch { }
  }, [user]);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      await Promise.all([fetchMeals(), fetchWater(), fetchWorkouts()]);
      setLoading(false);
    }
    loadAll();
  }, [fetchMeals, fetchWater, fetchWorkouts]);

  const consumed       = useMemo(() => meals.filter(m => m.created_at?.startsWith(TODAY)).reduce((a, m) => a + (m.calories || 0), 0), [meals]);
  const goal           = profile?.calorie_target || 2000;
  const proteinConsumed = useMemo(() => Math.round(meals.filter(m => m.created_at?.startsWith(TODAY)).reduce((a, m) => a + (m.protein || 0), 0)), [meals]);
  const carbsConsumed  = useMemo(() => Math.round(meals.filter(m => m.created_at?.startsWith(TODAY)).reduce((a, m) => a + (m.carbs   || 0), 0)), [meals]);
  const fatsConsumed   = useMemo(() => Math.round(meals.filter(m => m.created_at?.startsWith(TODAY)).reduce((a, m) => a + (m.fats    || 0), 0)), [meals]);
  const weeklyData     = useMemo(() => buildWeeklyData(meals, goal), [meals, goal]);
  const todayMeals     = meals.filter(m => m.created_at?.startsWith(TODAY)).reverse();
  const lastMeal       = todayMeals[0] || null;

  const burnedToday    = useMemo(() => workouts.filter(w => w.created_at?.startsWith(TODAY)).reduce((a, w) => a + (w.calories_burned || 0), 0), [workouts]);
  const workoutsToday  = useMemo(() => workouts.filter(w => w.created_at?.startsWith(TODAY)).reverse(), [workouts]);
  const netCalories    = consumed - burnedToday;

  const adherenceHistory = useMemo(() => Array.from({ length: 28 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (27 - i));
    const dateStr = d.toISOString().split('T')[0];
    const cals    = meals.filter(m => m.created_at?.startsWith(dateStr)).reduce((s, m) => s + (m.calories || 0), 0);
    const target  = profile?.calorie_target || 2000;
    let val = 0;
    if (cals > 0) { const p = cals / target; val = p < 0.3 ? 1 : p < 0.8 ? 2 : p <= 1.1 ? 3 : 4; }
    return { date: dateStr, calories: cals, value: val };
  }), [meals, profile]);

  const { streak, levelInfo } = useGamification({ meals, waterToday, profile });

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-16 select-none"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* ── Hero Header ── */}
      <div className="xh-card p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <p className="xh-label mb-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#3456c8] mr-2" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#0E1929] tracking-tight">
            {getGreeting()},{' '}
            <span style={{ background: 'linear-gradient(135deg,#3456c8,#12266e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {user?.firstName || 'Champion'}
            </span>{' '}👋
          </h1>
          <p className="text-[#5a6478] text-sm mt-2">
            Goal: <strong>{profile?.goal_type || 'Maintain Weight'}</strong> · {goal.toLocaleString()} kcal target · {Math.round(Math.min((Math.max(0, netCalories) / goal) * 100, 100))}% net completed
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/dashboard/meals">
            <button className="xh-btn px-6 py-3"><Plus className="w-4 h-4" /> Log Meal</button>
          </Link>
          <Link to="/dashboard/fitness">
            <button className="px-5 py-3 rounded-full border border-[#edf0f7] bg-white text-[#12266e] text-sm font-bold flex items-center gap-1 hover:bg-[#f4f6fa] transition-colors">
              <Dumbbell className="w-4 h-4" /> Log Workout
            </button>
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Streak"         value={`${streak} Days`}
          subtext={`${Math.min(100, Math.round(streak / 7 * 100))}% weekly`}
          icon={<Flame   className="w-4 h-4 text-white" />} iconBg="#ea580c"
          progress={Math.min(100, (streak / 7) * 100)}
          progressColor="linear-gradient(90deg,#fb923c,#ea580c)" loading={loading} />
        <StatCard title="Hydration"      value={`${waterToday}ml`}
          subtext={`${Math.round((waterToday / (profile?.hydration_target || 3000)) * 100)}% of goal`}
          icon={<Droplets className="w-4 h-4 text-white" />} iconBg="#3456c8"
          progress={Math.min(100, (waterToday / (profile?.hydration_target || 3000)) * 100)}
          progressColor="linear-gradient(90deg,#3456c8,#12266e)" loading={loading} />
        <StatCard title="Protein"        value={`${proteinConsumed}g`}
          subtext={`${Math.max(0, (profile?.protein_target || 120) - proteinConsumed)}g remaining`}
          icon={<Target  className="w-4 h-4 text-white" />} iconBg="#7c3aed"
          progress={Math.min(100, (proteinConsumed / (profile?.protein_target || 120)) * 100)}
          progressColor="linear-gradient(90deg,#a78bfa,#7c3aed)" loading={loading} />
        <StatCard title={`Level ${levelInfo?.level || 1}`} value={`${levelInfo?.xp || 0} XP`}
          subtext={levelInfo?.next ? `${levelInfo.next.xpRequired - levelInfo.xp} XP to next` : 'Max level'}
          icon={<Award   className="w-4 h-4 text-white" />} iconBg="#d97706"
          progress={levelInfo?.progress || 0}
          progressColor="linear-gradient(90deg,#fbbf24,#d97706)" loading={loading} />
      </div>

      {/* ── Net Calories + Macros ── */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
        <CalorieCard consumed={consumed} burned={burnedToday} goal={goal} lastMeal={lastMeal} />
        <MacroCard proteinConsumed={proteinConsumed} proteinGoal={profile?.protein_target || 120}
          carbsConsumed={carbsConsumed}  carbsGoal={profile?.carbs_target  || 200}
          fatsConsumed={fatsConsumed}    fatsGoal={profile?.fats_target    || 60} loading={loading} />
      </div>

      {/* ── Today's Logs + Water + Chart ── */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <DailyLogCard todayMeals={todayMeals} />
        <WorkoutCard  workoutsToday={workoutsToday} />
        <HydrationCard userId={user?.id} water={waterToday} setWater={setWaterToday}
          goal={profile?.hydration_target || 3000} />
        <WeeklyChart weeklyData={weeklyData} goal={goal} loading={loading} />
      </div>

      {/* ── Adherence Heatmap ── */}
      <AdherenceGrid data={adherenceHistory} />
    </div>
  );
}


