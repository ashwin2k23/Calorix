import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, Flame, Droplets, Target, TrendingUp, Zap, RefreshCw, Plus, Minus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/api';
import GamificationBanner from '@/components/GamificationBanner';
import { useGamification } from '@/hooks/useGamification';

const TODAY = new Date().toISOString().split('T')[0];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function buildWeeklyData(meals) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const cals = meals.filter(m => m.created_at?.startsWith(dateStr)).reduce((s, m) => s + (m.calories || 0), 0);
    return { day: days[d.getDay()], calories: cals };
  });
}

function calcStreak(meals) {
  let streak = 0;
  const d = new Date();
  // Check today first
  const todayHas = meals.some(m => m.created_at?.startsWith(TODAY));
  if (!todayHas) d.setDate(d.getDate() - 1); // start from yesterday if nothing today
  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().split('T')[0];
    if (meals.some(m => m.created_at?.startsWith(dateStr))) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

// SVG Calorie Progress Ring
function CalorieRing({ consumed, goal, size = 160 }) {
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(consumed / Math.max(goal, 1), 1);
  const offset = circ * (1 - pct);
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#00e87a" />
            <stop offset="100%" stopColor="#00c2ff" />
          </linearGradient>
        </defs>
        <circle cx={center} cy={center} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={12} />
        <motion.circle
          cx={center} cy={center} r={r} fill="none"
          stroke="url(#ring-grad)" strokeWidth={12}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-extrabold text-foreground leading-tight">{consumed}</p>
        <p className="text-[10px] text-muted-foreground">of {goal}</p>
        <p className="text-[10px] text-primary font-semibold">kcal</p>
      </div>
    </div>
  );
}

// Water Tracker
function WaterTracker({ userId, goal = 3000 }) {
  const storageKey = `calorix_water_${userId}_${TODAY}`;
  const [water, setWater] = useState(() => {
    const s = localStorage.getItem(storageKey);
    return s ? parseInt(s) : 0;
  });
  const [syncing, setSyncing] = useState(false);

  const update = useCallback(async (newVal) => {
    const clamped = Math.max(0, Math.min(newVal, goal));
    setWater(clamped);
    localStorage.setItem(storageKey, String(clamped));
    setSyncing(true);
    try {
      await api.upsertWater(userId, TODAY, clamped);
    } catch { /* offline — localStorage already updated */ }
    finally { setSyncing(false); }
  }, [userId, goal, storageKey]);

  useEffect(() => {
    api.getWater(userId, TODAY)
      .then(d => { if (d.success && d.data.amount_ml > 0) { setWater(d.data.amount_ml); localStorage.setItem(storageKey, String(d.data.amount_ml)); } })
      .catch(() => {});
  }, [userId, storageKey]);

  const pct = Math.min((water / goal) * 100, 100);
  const glasses = Math.round(water / 250);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium">Hydration</span>
          {syncing && <div className="w-2 h-2 rounded-full bg-blue-400/50 animate-pulse" />}
        </div>
        <span className="text-sm font-bold text-blue-400">{(water / 1000).toFixed(2)}L / {goal / 1000}L</span>
      </div>
      <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-wrap flex-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`w-5 h-6 rounded-sm transition-all ${i < glasses ? 'bg-blue-400/80' : 'bg-white/5 border border-white/10'}`} />
          ))}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={() => update(water - 250)}
            className="w-8 h-8 rounded-lg bg-black/30 border border-white/10 hover:border-white/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
            <Minus className="w-3 h-3" />
          </button>
          <button onClick={() => update(water + 250)}
            className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 hover:bg-blue-500/30 flex items-center justify-center text-blue-400 transition-all">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">+250ml per tap · {8 - glasses} glasses remaining</p>
    </div>
  );
}

export default function Overview({ profile, user }) {
  const [loading, setLoading]               = useState(true);
  const [meals, setMeals]                   = useState([]);
  const [insight, setInsight]               = useState('');
  const [insightLoading, setInsightLoading] = useState(false);

  const fetchMeals = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getMeals(user.id);
      if (data.success) setMeals(data.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  const consumed       = useMemo(() => meals.reduce((a, m) => a + (m.calories || 0), 0), [meals]);
  const goal           = profile?.calorie_target || 2000;
  const remaining      = Math.max(0, goal - consumed);
  const progressPct    = Math.min(Math.round((consumed / goal) * 100), 100);
  const proteinConsumed = useMemo(() => Math.round(meals.reduce((a, m) => a + (m.protein || 0), 0)), [meals]);
  const proteinGoal    = profile?.protein_target || 120;
  const carbsConsumed  = useMemo(() => Math.round(meals.reduce((a, m) => a + (m.carbs || 0), 0)), [meals]);
  const carbsGoal      = profile?.carbs_target || 200;
  const fatsConsumed   = useMemo(() => Math.round(meals.reduce((a, m) => a + (m.fats || 0), 0)), [meals]);
  const fatsGoal       = profile?.fats_target || 60;
  const streak         = useMemo(() => calcStreak(meals), [meals]);
  const weeklyData     = useMemo(() => buildWeeklyData(meals), [meals]);
  const hasLoggedMeals = meals.length > 0;

  // Water for gamification (from localStorage)
  const waterToday = useMemo(() => {
    const key = `calorix_water_${user?.id}_${TODAY}`;
    return parseInt(localStorage.getItem(key) || '0');
  }, [user]);

  const { levelInfo, streakData, badges } = useGamification({ meals, waterToday, profile });

  const macroData = [
    { name: 'Carbs',   consumed: carbsConsumed,   goal: carbsGoal,   color: '#f97316' },
    { name: 'Protein', consumed: proteinConsumed,  goal: proteinGoal, color: '#9b6dff' },
    { name: 'Fat',     consumed: fatsConsumed,     goal: fatsGoal,    color: '#00c2ff' },
  ];
  const pieData = macroData.map(m => ({ name: m.name, value: Math.max(m.consumed, 1), color: m.color }));

  const fetchInsight = useCallback(async () => {
    setInsightLoading(true);
    try {
      const d = await api.getAIInsight({ profile, consumed, proteinConsumed, carbsConsumed, fatsConsumed });
      if (d.success) setInsight(d.insight);
    } catch {
      setInsight(`You have ${proteinGoal - proteinConsumed}g of protein remaining. Add paneer or dal to your next meal!`);
    } finally { setInsightLoading(false); }
  }, [profile, consumed, proteinConsumed, carbsConsumed, fatsConsumed, proteinGoal]);

  useEffect(() => { if (!loading) fetchInsight(); }, [loading]); // eslint-disable-line

  const todayMeals = meals.filter(m => m.created_at?.startsWith(TODAY));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
              {getGreeting()}, {user?.firstName || 'User'} 👋
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground text-sm">Here's your nutrition progress today.</span>
              {profile?.goal_type && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium">
                  🎯 {profile.goal_type}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Gamification Banner */}
        {!loading && (
          <GamificationBanner levelInfo={levelInfo} streakData={streakData} badges={badges} />
        )}
      </div>

      {/* Calorie Ring + Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Ring Card */}
        <Card className="sm:col-span-1 border-white/5 bg-card/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            {loading ? <Skeleton className="w-40 h-40 rounded-full" /> : <CalorieRing consumed={consumed} goal={goal} size={160} />}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Daily progress</p>
              <p className="text-sm font-bold text-primary">{progressPct}%</p>
            </div>
          </div>
        </Card>

        {/* Macro bars */}
        <Card className="sm:col-span-2 border-white/5 bg-card/40 backdrop-blur-md p-5 space-y-4">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Today's Macros</p>
          {[
            { label: 'Calories', consumed, goal, unit: 'kcal', color: '#00e87a', bg: 'bg-primary' },
            { label: 'Protein',  consumed: proteinConsumed, goal: proteinGoal, unit: 'g', color: '#9b6dff', bg: 'bg-[#9b6dff]' },
            { label: 'Carbs',    consumed: carbsConsumed,   goal: carbsGoal,   unit: 'g', color: '#f97316', bg: 'bg-orange-400' },
            { label: 'Fats',     consumed: fatsConsumed,    goal: fatsGoal,    unit: 'g', color: '#00c2ff', bg: 'bg-[#00c2ff]' },
          ].map(item => {
            const pct = Math.min((item.consumed / Math.max(item.goal, 1)) * 100, 100);
            return (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-medium">{item.label}</span>
                  <span className="font-semibold" style={{ color: item.color }}>
                    {loading ? '—' : `${item.consumed} / ${item.goal}${item.unit}`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                  {!loading && (
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1 }}
                      className={`h-full rounded-full ${item.bg}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      {/* Water + Remaining calories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-white/5 bg-card/40 backdrop-blur-md p-5">
          <WaterTracker userId={user?.id} goal={profile?.hydration_target || 3000} />
        </Card>
        <Card className="border-white/5 bg-card/40 backdrop-blur-md p-5 flex flex-col justify-center">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#00c2ff]" />
              <span className="text-sm font-medium">Calories Remaining</span>
            </div>
            <div>
              <span className="text-4xl font-extrabold text-[#00c2ff]">{loading ? '—' : remaining}</span>
              <span className="text-sm text-muted-foreground ml-2">kcal left</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {consumed >= goal ? '🎯 Daily goal reached! Great work!' : `${todayMeals.length} meal${todayMeals.length !== 1 ? 's' : ''} logged today`}
            </p>
            {!hasLoggedMeals && !loading && (
              <Link to="/dashboard/meals">
                <Button size="sm" className="mt-1 rounded-xl bg-gradient-to-r from-primary to-[#00c2ff] hover:opacity-90 text-xs">
                  + Log First Meal
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>

      {/* AI Insight */}
      <Card className="border-primary/20 bg-primary/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-[#00c2ff]" />
        <CardContent className="p-4 flex items-start gap-4">
          <div className="p-2 rounded-xl bg-primary/20 text-primary flex-shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-sm">Today's AI Insight</h3>
              <button onClick={fetchInsight} disabled={insightLoading}
                className="text-muted-foreground hover:text-primary transition-colors ml-2 flex-shrink-0">
                <RefreshCw className={`w-3.5 h-3.5 ${insightLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {insightLoading
              ? <div className="space-y-1.5"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /></div>
              : <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
            }
          </div>
        </CardContent>
      </Card>

      {/* Charts or Empty State */}
      {!hasLoggedMeals && !loading ? (
        <Card className="border-dashed border-white/10 bg-black/20">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="text-6xl mb-5"
            >
              🍎
            </motion.div>
            <h3 className="text-xl font-bold mb-2">Start your nutrition journey!</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-2">
              Log your first meal to unlock <strong className="text-foreground">analytics</strong>, <strong className="text-foreground">AI insights</strong>, and <strong className="text-foreground">streak rewards</strong>.
            </p>
            <p className="text-xs text-muted-foreground mb-6">Track consistently to earn badges and level up! 🏆</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/dashboard/meals">
                <Button className="rounded-full px-8 bg-gradient-to-r from-primary to-[#00c2ff] hover:opacity-90">
                  🍽️ Log First Meal
                </Button>
              </Link>
              <Link to="/dashboard/assistant">
                <Button variant="outline" className="rounded-full px-6 border-white/10 hover:border-primary/30 gap-2">
                  <MessageSquare className="w-4 h-4" /> Ask AI Coach
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : hasLoggedMeals && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Weekly chart */}
          <Card className="lg:col-span-2 border-white/5 bg-card/40 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-primary" /> Weekly Calorie Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              {loading ? <Skeleton className="w-full h-full rounded-xl" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#00e87a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00e87a" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#7a90b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#7a90b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f1629', borderColor: '#1e2d4a', borderRadius: '10px' }} itemStyle={{ color: '#00e87a' }} />
                    <Area type="monotone" dataKey="calories" stroke="#00e87a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCal)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Macro donut */}
          <Card className="border-white/5 bg-card/40 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Macro Split</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {loading ? <Skeleton className="w-36 h-36 rounded-full" /> : (
                <>
                  <div className="relative w-full h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={4} dataKey="value" stroke="none">
                          {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f1629', borderColor: '#1e2d4a', borderRadius: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-bold text-base">{consumed}</p>
                        <p className="text-[10px] text-muted-foreground">kcal</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-3 w-full mt-1">
                    {macroData.map(m => (
                      <div key={m.name} className="flex flex-col items-center text-xs">
                        <div className="w-2 h-2 rounded-full mb-0.5" style={{ backgroundColor: m.color }} />
                        <span className="font-bold">{m.consumed}g</span>
                        <span className="text-muted-foreground">{m.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
}
