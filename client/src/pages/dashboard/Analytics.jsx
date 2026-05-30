import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ReferenceLine
} from 'recharts';
import {
  TrendingUp, TrendingDown, Flame, Droplets, Zap, Target,
  Award, Star, Calendar, BarChart2, Lightbulb
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

function StatCard({ label, value, sub, icon, color = 'text-white', trend, loading }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-2xl bg-slate-950/40 border border-white/[0.04] p-5 backdrop-blur-xl group hover:shadow-2xl transition-all duration-300 select-none"
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-10 bg-white group-hover:opacity-20 transition-all duration-500" />
      
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-20 bg-white/5" />
          <Skeleton className="h-8 w-16 bg-white/5" />
        </div>
      ) : (
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">{label}</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-black text-white tracking-tight ${color}`}>{value}</span>
            </div>
            {sub && <p className="text-[10px] text-slate-400 font-semibold">{sub}</p>}
            {trend !== undefined && (
              <div className={`flex items-center gap-1 mt-1 text-[10px] font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{Math.abs(trend)}% vs last week</span>
              </div>
            )}
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 group-hover:scale-105 transition-transform duration-300">
            {icon}
          </div>
        </div>
      )}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0b0e14]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl space-y-1.5 select-none text-xs">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold text-white flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span>{p.name}: <strong className="font-black">{p.value}</strong>{p.unit || ''}</span>
        </p>
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

  const waterToday = useMemo(() => {
    const key = `calorix_water_${user?.id}_${TODAY}`;
    return parseInt(localStorage.getItem(key) || '0');
  }, [user]);

  const { badges, levelInfo } = useGamification({ meals, waterToday, profile });
  const weeklyData = useMemo(() => buildWeeklyData(meals), [meals]);

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
      { name: 'Protein', value: Math.round(totals.protein), color: 'url(#proteinGrad)', rawColor: '#a855f7' },
      { name: 'Carbs',   value: Math.round(totals.carbs),   color: 'url(#carbsGrad)',   rawColor: '#f97316' },
      { name: 'Fats',    value: Math.round(totals.fats),    color: 'url(#fatsGrad)',    rawColor: '#06b6d4' },
    ].filter(d => d.value > 0);
  }, [meals]);

  const mealTypeBreakdown = useMemo(() => {
    const types = { Breakfast: 0, Lunch: 0, Snack: 0, Dinner: 0 };
    meals.forEach(m => { if (types[m.meal_type] !== undefined) types[m.meal_type] += (m.calories || 0); });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [meals]);

  const insights = useMemo(() => {
    const list = [];
    if (calorieTrend < -10) list.push({ icon: '📉', text: `You consumed ${Math.abs(calorieTrend)}% fewer calories this week — great progress!`, good: true });
    else if (calorieTrend > 10) list.push({ icon: '📈', text: `Calorie intake increased by ${calorieTrend}% this week. Stay mindful.`, good: false });
    if (avgProtein > 0 && profile?.protein_target && avgProtein < profile.protein_target * 0.8)
      list.push({ icon: '💪', text: `Avg protein (${avgProtein}g) is below your target (${profile.protein_target}g). Add protein isolates.`, good: false });
    if (consistencyScore >= 80) list.push({ icon: '🔥', text: `${consistencyScore}% logging consistency this week — you're crushing it!`, good: true });
    if (waterToday < (profile?.hydration_target || 3000))
      list.push({ icon: '💧', text: `You need ${Math.round(((profile?.hydration_target || 3000) - waterToday) / 250)} more glasses of water today.`, good: false });
    if (list.length === 0) list.push({ icon: '✅', text: 'Keep logging meals to get personalized insights here!', good: true });
    return list;
  }, [calorieTrend, avgProtein, profile, consistencyScore, waterToday]);

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto pb-12 select-none">
      {/* Header */}
      <motion.div variants={itemVars}>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
          <BarChart2 className="w-8 h-8 text-violet-400" /> Analytics Trajectory
        </h1>
        <p className="text-slate-400 text-xs md:text-sm font-semibold">Your long-term nutrition trends, metabolic consistency, and achievements.</p>
      </motion.div>

      {/* Summary Stats Grid */}
      <motion.div variants={itemVars} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Avg Daily Calories" value={loading ? '—' : avgDailyCalories} sub="kcal this week" icon={<Flame className="w-5 h-5 text-emerald-400" />} trend={calorieTrend} loading={loading} />
        <StatCard label="Avg Protein" value={loading ? '—' : `${avgProtein}g`} sub="per day" icon={<Zap className="w-5 h-5 text-violet-400" />} loading={loading} />
        <StatCard label="Today's Goal" value={loading ? '—' : `${goalPct}%`} sub="completion" icon={<Target className="w-5 h-5 text-cyan-400" />} loading={loading} />
        <StatCard label="Consistency" value={loading ? '—' : `${consistencyScore}%`} sub="days logged" icon={<Calendar className="w-5 h-5 text-amber-400" />} loading={loading} />
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Calories Trend */}
        <motion.div variants={itemVars} className="lg:col-span-2">
          <Card className="border-white/[0.04] bg-slate-950/40 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl h-full">
            <CardHeader className="pb-4 px-2">
              <CardTitle className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <TrendingUp className="w-4.5 h-4.5 text-emerald-400" /> Calorie Trajectory Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[240px] px-0">
              {loading ? <Skeleton className="w-full h-full bg-white/5 rounded-2xl" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="day" 
                      stroke="rgba(255, 255, 255, 0.15)" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                      style={{ fontWeight: '600' }}
                    />
                    <YAxis 
                      stroke="rgba(255, 255, 255, 0.15)" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      dx={-5}
                      style={{ fontWeight: '600' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {profile?.calorie_target && (
                      <ReferenceLine 
                        y={profile.calorie_target} 
                        stroke="rgba(244, 63, 94, 0.3)" 
                        strokeDasharray="4 4" 
                        strokeWidth={1.5}
                        label={{ position: 'top', value: 'LIMIT', fill: 'rgba(244, 63, 94, 0.5)', fontSize: 8, fontWeight: '800' }} 
                      />
                    )}
                    <Area type="monotone" dataKey="calories" name="Calories" unit=" kcal" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#calGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Macro Donut Split */}
        <motion.div variants={itemVars}>
          <Card className="border-white/[0.04] bg-slate-950/40 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl h-full flex flex-col justify-between">
            <CardHeader className="pb-2 px-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metabolic Macro Split</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-4 flex-1">
              {loading ? <Skeleton className="w-36 h-36 rounded-full bg-white/5" /> : (
                <>
                  <div className="relative w-full h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          <linearGradient id="proteinGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                          <linearGradient id="carbsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fb923c" />
                            <stop offset="100%" stopColor="#f97316" />
                          </linearGradient>
                          <linearGradient id="fatsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                        </defs>
                        <Pie 
                          data={macroData} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={50} 
                          outerRadius={70} 
                          paddingAngle={4} 
                          dataKey="value" 
                          stroke="none"
                        >
                          {macroData.map((e, i) => <Cell key={i} fill={e.color} className="outline-none" />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500 uppercase font-black">All-Time</p>
                        <p className="font-black text-white text-lg">{macroData.reduce((s, d) => s + d.value, 0)}g</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 w-full mt-4">
                    {macroData.map(m => (
                      <div key={m.name} className="flex flex-col items-center text-xs font-bold">
                        <div className="w-2.5 h-2.5 rounded-full mb-1" style={{ backgroundColor: m.rawColor }} />
                        <span className="text-white">{m.value}g</span>
                        <span className="text-slate-500 text-[10px]">{m.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Protein + Meal type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Protein */}
        <motion.div variants={itemVars}>
          <Card className="border-white/[0.04] bg-slate-950/40 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl">
            <CardHeader className="pb-4 px-2">
              <CardTitle className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Zap className="w-4.5 h-4.5 text-purple-400" /> Weekly Protein Intake
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[200px] px-0">
              {loading ? <Skeleton className="w-full h-full bg-white/5 rounded-2xl" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="proteinBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="day" 
                      stroke="rgba(255, 255, 255, 0.15)" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                      style={{ fontWeight: '600' }}
                    />
                    <YAxis 
                      stroke="rgba(255, 255, 255, 0.15)" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      dx={-5}
                      style={{ fontWeight: '600' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="protein" name="Protein" unit="g" fill="url(#proteinBarGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Calories by Meal Type */}
        <motion.div variants={itemVars}>
          <Card className="border-white/[0.04] bg-slate-950/40 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl">
            <CardHeader className="pb-4 px-2">
              <CardTitle className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Flame className="w-4.5 h-4.5 text-orange-400" /> Calories by Meal Type
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[200px] px-0">
              {loading ? <Skeleton className="w-full h-full bg-white/5 rounded-2xl" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mealTypeBreakdown} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mealTypeGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                    <XAxis type="number" stroke="rgba(255, 255, 255, 0.15)" fontSize={10} tickLine={false} axisLine={false} style={{ fontWeight: '600' }} />
                    <YAxis type="category" dataKey="name" stroke="rgba(255, 255, 255, 0.15)" fontSize={10} tickLine={false} axisLine={false} width={65} style={{ fontWeight: '700' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Calories" unit=" kcal" fill="url(#mealTypeGrad)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Progress Insights Feed */}
      <motion.div variants={itemVars}>
        <div className="bg-slate-950/40 border border-white/[0.04] backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-2 pb-2">
            <Lightbulb className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress Insights</span>
          </div>
          <div className="space-y-3">
            {insights.map((ins, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-start gap-3.5 p-4 rounded-2xl border text-sm font-semibold transition-all duration-300
                  ${ins.good
                    ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-300 shadow-[0_4px_12px_rgba(16,185,129,0.03)]'
                    : 'bg-orange-500/5 border-orange-500/10 text-orange-300 shadow-[0_4px_12px_rgba(249,115,22,0.03)]'
                  }`}
              >
                <span className="text-base flex-shrink-0">{ins.icon}</span>
                <span>{ins.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Achievements Card */}
      <motion.div variants={itemVars}>
        <Card className="border-white/[0.04] bg-slate-950/40 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl">
          <CardHeader className="pb-4 px-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-amber-400" /> Earned Badges
              <span className="ml-auto text-xs text-slate-500 font-bold lowercase">
                {badges.filter(b => b.earned).length}/{badges.length} unlocked
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {badges.map(badge => (
                <motion.div
                  key={badge.id}
                  whileHover={badge.earned ? { scale: 1.03 } : {}}
                  className={`p-5 rounded-2xl border text-center transition-all duration-300 select-none
                    ${badge.earned
                      ? 'bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]'
                      : 'bg-white/[0.01] border-white/5 opacity-30'
                    }`}
                >
                  <div className="text-3xl mb-2.5 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">{badge.icon}</div>
                  <p className="text-xs font-extrabold text-white">{badge.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-tight">{badge.desc}</p>
                  {badge.earned && (
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-[9px] text-amber-400 font-black uppercase tracking-wider">Unlocked</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Level Info Terminal */}
      <motion.div variants={itemVars}>
        <Card className="border-white/[0.04] bg-slate-950/40 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl">
          <CardContent className="p-2">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-extrabold text-white text-base">Level {levelInfo.level} · {levelInfo.title}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{levelInfo.xp} XP total</p>
                  </div>
                  {levelInfo.next && (
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{levelInfo.next.xpRequired - levelInfo.xp} XP to level up</p>
                  )}
                </div>
                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/[0.04]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${levelInfo.progress}%` }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
