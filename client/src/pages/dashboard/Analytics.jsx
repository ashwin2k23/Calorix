import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadialBarChart, RadialBar,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Flame, Droplets, Zap, Target,
  Award, Star, Calendar, BarChart2, Lightbulb,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGamification } from '@/hooks/useGamification';
import api from '@/lib/api';

const TODAY = new Date().toISOString().split('T')[0];

function buildWeeklyData(meals, waterLogs = {}) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayMeals = meals.filter(m => m.created_at?.startsWith(dateStr));
    return {
      day: days[d.getDay()],
      date: dateStr,
      calories: dayMeals.reduce((s, m) => s + (m.calories || 0), 0),
      protein: Math.round(dayMeals.reduce((s, m) => s + (m.protein || 0), 0)),
      carbs: Math.round(dayMeals.reduce((s, m) => s + (m.carbs || 0), 0)),
      fats: Math.round(dayMeals.reduce((s, m) => s + (m.fats || 0), 0)),
      water: waterLogs[dateStr] || 0,
    };
  });
}

function StatCard({ label, value, sub, icon, color = 'text-primary', trend, loading }) {
  return (
    <Card className="border-white/5 bg-card/40 backdrop-blur-md">
      <CardContent className="p-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
              {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
              {trend !== undefined && (
                <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend >= 0 ? 'text-primary' : 'text-red-400'}`}>
                  {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(trend)}% vs last week
                </div>
              )}
            </div>
            <div className={`p-2 rounded-xl bg-white/5 ${color}`}>{icon}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1629] border border-[#1e2d4a] rounded-xl p-3 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: <strong>{p.value}</strong>{p.unit || ''}</p>
      ))}
    </div>
  );
};

export default function Analytics({ profile, user }) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMeals = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getMeals(user.id);
      if (data.success) setMeals(data.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  // Get water from localStorage (today)
  const waterToday = useMemo(() => {
    const key = `calorix_water_${user?.id}_${TODAY}`;
    return parseInt(localStorage.getItem(key) || '0');
  }, [user]);

  const { badges, levelInfo, streakData } = useGamification({ meals, waterToday, profile });
  const weeklyData = useMemo(() => buildWeeklyData(meals), [meals]);

  // Analytics computations
  const todayMeals = useMemo(() => meals.filter(m => m.created_at?.startsWith(TODAY)), [meals]);
  const todayCalories = useMemo(() => todayMeals.reduce((s, m) => s + (m.calories || 0), 0), [todayMeals]);

  const thisWeekCals = useMemo(() => weeklyData.slice(-7).reduce((s, d) => s + d.calories, 0), [weeklyData]);
  const lastWeekCals = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return meals
      .filter(m => {
        const date = new Date(m.created_at);
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 14);
        const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
        return date >= weekAgo && date < twoWeeksAgo;
      })
      .reduce((s, m) => s + (m.calories || 0), 0);
  }, [meals]);

  const calorieTrend = lastWeekCals > 0
    ? Math.round(((thisWeekCals - lastWeekCals) / lastWeekCals) * 100)
    : 0;

  const avgDailyCalories = useMemo(() => {
    const days = weeklyData.filter(d => d.calories > 0);
    return days.length ? Math.round(days.reduce((s, d) => s + d.calories, 0) / days.length) : 0;
  }, [weeklyData]);

  const avgProtein = useMemo(() => {
    const days = weeklyData.filter(d => d.protein > 0);
    return days.length ? Math.round(days.reduce((s, d) => s + d.protein, 0) / days.length) : 0;
  }, [weeklyData]);

  const goalPct = profile?.calorie_target
    ? Math.min(Math.round((todayCalories / profile.calorie_target) * 100), 100)
    : 0;

  const consistencyScore = useMemo(() => {
    const daysLogged = weeklyData.filter(d => d.calories > 0).length;
    return Math.round((daysLogged / 7) * 100);
  }, [weeklyData]);

  const macroData = useMemo(() => {
    const totals = meals.reduce((a, m) => ({
      protein: a.protein + (m.protein || 0),
      carbs: a.carbs + (m.carbs || 0),
      fats: a.fats + (m.fats || 0),
    }), { protein: 0, carbs: 0, fats: 0 });
    return [
      { name: 'Protein', value: Math.round(totals.protein), color: '#9b6dff' },
      { name: 'Carbs',   value: Math.round(totals.carbs),   color: '#f97316' },
      { name: 'Fats',    value: Math.round(totals.fats),    color: '#00c2ff' },
    ].filter(d => d.value > 0);
  }, [meals]);

  const mealTypeBreakdown = useMemo(() => {
    const types = { Breakfast: 0, Lunch: 0, Snack: 0, Dinner: 0 };
    meals.forEach(m => { if (types[m.meal_type] !== undefined) types[m.meal_type] += (m.calories || 0); });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [meals]);

  // AI-generated insights
  const insights = useMemo(() => {
    const list = [];
    if (calorieTrend < -10) list.push({ icon: '📉', text: `You consumed ${Math.abs(calorieTrend)}% fewer calories this week — great progress!`, good: true });
    else if (calorieTrend > 10) list.push({ icon: '📈', text: `Calorie intake increased by ${calorieTrend}% this week. Stay mindful.`, good: false });
    if (avgProtein > 0 && profile?.protein_target && avgProtein < profile.protein_target * 0.8)
      list.push({ icon: '💪', text: `Avg protein (${avgProtein}g) is below your target (${profile.protein_target}g). Add paneer or dal.`, good: false });
    if (consistencyScore >= 80) list.push({ icon: '🔥', text: `${consistencyScore}% logging consistency this week — you're crushing it!`, good: true });
    if (waterToday < (profile?.hydration_target || 3000))
      list.push({ icon: '💧', text: `You need ${Math.round(((profile?.hydration_target || 3000) - waterToday) / 250)} more glasses of water today.`, good: false });
    if (list.length === 0) list.push({ icon: '✅', text: 'Keep logging meals to get personalized insights here!', good: true });
    return list;
  }, [calorieTrend, avgProtein, profile, consistencyScore, waterToday]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
          <BarChart2 className="w-7 h-7 text-primary" /> Analytics
        </h1>
        <p className="text-muted-foreground text-sm">Your nutrition trends, consistency, and achievements.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Avg Daily Calories" value={loading ? '—' : avgDailyCalories} sub="kcal this week" icon={<Flame className="w-4 h-4" />} color="text-primary" trend={calorieTrend} loading={loading} />
        <StatCard label="Avg Protein" value={loading ? '—' : `${avgProtein}g`} sub="per day" icon={<Zap className="w-4 h-4" />} color="text-[#9b6dff]" loading={loading} />
        <StatCard label="Today's Goal" value={loading ? '—' : `${goalPct}%`} sub="completion" icon={<Target className="w-4 h-4" />} color="text-[#00c2ff]" loading={loading} />
        <StatCard label="Consistency" value={loading ? '—' : `${consistencyScore}%`} sub="days logged" icon={<Calendar className="w-4 h-4" />} color="text-orange-400" loading={loading} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Calories Trend */}
        <Card className="lg:col-span-2 border-white/5 bg-card/40 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-primary" /> Weekly Calories
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            {loading ? <Skeleton className="w-full h-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e87a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00e87a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {profile?.calorie_target && (
                    <line y={profile.calorie_target} stroke="#ffffff20" strokeDasharray="4" />
                  )}
                  <XAxis dataKey="day" stroke="#7a90b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7a90b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="calories" name="Calories" unit=" kcal" stroke="#00e87a" strokeWidth={2.5} fillOpacity={1} fill="url(#calGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Macro Distribution */}
        <Card className="border-white/5 bg-card/40 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">All-Time Macro Split</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {loading ? <Skeleton className="w-36 h-36 rounded-full" /> : (
              <>
                <div className="relative w-full h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={macroData} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={4} dataKey="value" stroke="none">
                        {macroData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-bold text-sm">{macroData.reduce((s, d) => s + d.value, 0)}g</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-4 w-full mt-2">
                  {macroData.map(m => (
                    <div key={m.name} className="flex flex-col items-center text-xs">
                      <div className="w-2 h-2 rounded-full mb-0.5" style={{ backgroundColor: m.color }} />
                      <span className="font-bold">{m.value}g</span>
                      <span className="text-muted-foreground">{m.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Protein + Meal Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Weekly Protein */}
        <Card className="border-white/5 bg-card/40 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-[#9b6dff]" /> Weekly Protein Intake
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[180px]">
            {loading ? <Skeleton className="w-full h-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#7a90b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7a90b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="protein" name="Protein" unit="g" fill="#9b6dff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Meal Type Breakdown */}
        <Card className="border-white/5 bg-card/40 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Flame className="w-4 h-4 text-orange-400" /> Calories by Meal Type
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[180px]">
            {loading ? <Skeleton className="w-full h-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mealTypeBreakdown} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <XAxis type="number" stroke="#7a90b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#7a90b8" fontSize={11} tickLine={false} axisLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Calories" unit=" kcal" fill="#00c2ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-primary/20 bg-primary/5 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" /> Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights.map((ins, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-start gap-3 p-3 rounded-xl border text-sm
                ${ins.good
                  ? 'bg-primary/5 border-primary/15 text-foreground/80'
                  : 'bg-orange-500/5 border-orange-500/15 text-foreground/80'
                }`}
            >
              <span className="text-base flex-shrink-0">{ins.icon}</span>
              <span>{ins.text}</span>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="border-white/5 bg-card/40 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" /> Achievements
            <span className="ml-auto text-xs text-muted-foreground">
              {badges.filter(b => b.earned).length}/{badges.length} earned
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {badges.map(badge => (
              <motion.div
                key={badge.id}
                whileHover={badge.earned ? { scale: 1.04 } : {}}
                className={`p-4 rounded-xl border text-center transition-all
                  ${badge.earned
                    ? 'bg-yellow-400/10 border-yellow-400/30 shadow-[0_0_20px_rgba(251,191,36,0.08)]'
                    : 'bg-white/3 border-white/5 opacity-40'
                  }`}
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <p className="text-xs font-bold">{badge.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{badge.desc}</p>
                {badge.earned && (
                  <div className="flex items-center justify-center gap-0.5 mt-1.5">
                    <Star className="w-2.5 h-2.5 text-yellow-400" />
                    <span className="text-[10px] text-yellow-400 font-semibold">Earned</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Level Info */}
      <Card className="border-white/5 bg-card/40 backdrop-blur-md">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-400/20 border border-yellow-400/20 flex items-center justify-center flex-shrink-0">
              <Star className="w-7 h-7 text-yellow-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="font-bold">Level {levelInfo.level} · {levelInfo.title}</p>
                  <p className="text-xs text-muted-foreground">{levelInfo.xp} XP total</p>
                </div>
                {levelInfo.next && (
                  <p className="text-xs text-muted-foreground">{levelInfo.next.xpRequired - levelInfo.xp} XP to next level</p>
                )}
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${levelInfo.progress}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
