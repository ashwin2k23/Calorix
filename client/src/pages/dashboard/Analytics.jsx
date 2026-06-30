import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Flame, Droplets, Zap, Target, Award, Star, Calendar, BarChart2, Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGamification } from '@/hooks/useGamification';
import api from '@/lib/api';

const TODAY = new Date().toISOString().split('T')[0];

function buildWeeklyData(meals) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dm = meals.filter(m => m.created_at?.startsWith(dateStr));
    return {
      day: days[d.getDay()], date: dateStr,
      calories: dm.reduce((s, m) => s + (m.calories || 0), 0),
      protein:  Math.round(dm.reduce((s, m) => s + (m.protein  || 0), 0)),
      carbs:    Math.round(dm.reduce((s, m) => s + (m.carbs    || 0), 0)),
      fats:     Math.round(dm.reduce((s, m) => s + (m.fats     || 0), 0)),
    };
  });
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#edf0f7] rounded-2xl p-3 shadow-lg text-xs">
      <p className="xh-label mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold text-[#0E1929] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: <strong>{p.value}{p.unit || ''}</strong>
        </p>
      ))}
    </div>
  );
};

function StatCard({ label, value, sub, icon, iconBg, trend, loading }) {
  return (
    <div className="xh-card p-6 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="xh-label">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
          {icon}
        </div>
      </div>
      {loading
        ? <Skeleton className="h-8 w-24 rounded-xl bg-[#edf0f7]" />
        : <p className="text-2xl font-bold text-[#0E1929]">{value}</p>
      }
      <p className="text-xs text-[#9aa0b0] font-medium">{sub}</p>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-red-500' : 'text-green-600'}`}>
          {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span>{Math.abs(trend)}% vs last week</span>
        </div>
      )}
    </div>
  );
}

export default function Analytics({ profile, user }) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMeals = useCallback(async () => {
    if (!user) return;
    try { const d = await api.getMeals(user.id); if (d.success) setMeals(d.data); } catch {}
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  const waterToday = useMemo(() => {
    const key = `calorix_water_${user?.id}_${TODAY}`;
    return parseInt(localStorage.getItem(key) || '0');
  }, [user]);

  const { badges, levelInfo } = useGamification({ meals, waterToday, profile });
  const weeklyData = useMemo(() => buildWeeklyData(meals), [meals]);

  const todayCalories    = useMemo(() => meals.filter(m => m.created_at?.startsWith(TODAY)).reduce((s, m) => s + (m.calories || 0), 0), [meals]);
  const thisWeekCals     = useMemo(() => weeklyData.reduce((s, d) => s + d.calories, 0), [weeklyData]);
  const lastWeekCals     = useMemo(() => {
    return meals.filter(m => {
      const date = new Date(m.created_at);
      const from = new Date(); from.setDate(from.getDate() - 14);
      const to   = new Date(); to.setDate(to.getDate() - 7);
      return date >= from && date < to;
    }).reduce((s, m) => s + (m.calories || 0), 0);
  }, [meals]);

  const calorieTrend   = lastWeekCals > 0 ? Math.round(((thisWeekCals - lastWeekCals) / lastWeekCals) * 100) : 0;
  const avgDailyCals   = useMemo(() => { const d = weeklyData.filter(d => d.calories > 0); return d.length ? Math.round(d.reduce((s, x) => s + x.calories, 0) / d.length) : 0; }, [weeklyData]);
  const avgProtein     = useMemo(() => { const d = weeklyData.filter(d => d.protein > 0);  return d.length ? Math.round(d.reduce((s, x) => s + x.protein,  0) / d.length) : 0; }, [weeklyData]);
  const goalPct        = profile?.calorie_target ? Math.min(Math.round((todayCalories / profile.calorie_target) * 100), 100) : 0;
  const consistency    = useMemo(() => Math.round((weeklyData.filter(d => d.calories > 0).length / 7) * 100), [weeklyData]);

  const macroData = useMemo(() => {
    const t = meals.reduce((a, m) => ({ protein: a.protein + (m.protein || 0), carbs: a.carbs + (m.carbs || 0), fats: a.fats + (m.fats || 0) }), { protein: 0, carbs: 0, fats: 0 });
    return [
      { name: 'Protein', value: Math.round(t.protein), color: '#7c3aed' },
      { name: 'Carbs',   value: Math.round(t.carbs),   color: '#ea580c' },
      { name: 'Fats',    value: Math.round(t.fats),    color: '#0891b2' },
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
      list.push({ icon: '💪', text: `Avg protein (${avgProtein}g) is below your target (${profile.protein_target}g).`, good: false });
    if (consistency >= 80) list.push({ icon: '🔥', text: `${consistency}% logging consistency this week — you're on fire!`, good: true });
    if (waterToday < (profile?.hydration_target || 3000))
      list.push({ icon: '💧', text: `You need ${Math.round(((profile?.hydration_target || 3000) - waterToday) / 250)} more glasses today.`, good: false });
    if (list.length === 0) list.push({ icon: '✅', text: 'Keep logging meals to get personalized insights here!', good: true });
    return list;
  }, [calorieTrend, avgProtein, profile, consistency, waterToday]);

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-12 select-none" style={{ fontFamily: "'DM Sans',sans-serif" }}>

      {/* Header */}
      <div className="xh-card p-7">
        <p className="xh-label mb-1"><span className="inline-block w-2 h-2 rounded-full bg-[#3456c8] mr-2" />Nutrition Analytics</p>
        <h1 className="text-3xl font-bold text-[#0E1929]">Analytics Trajectory</h1>
        <p className="text-sm text-[#5a6478] mt-1">Long-term trends, metabolic consistency, and achievements.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Avg Daily Calories" value={loading ? '—' : avgDailyCals} sub="kcal this week"
          icon={<Flame className="w-4 h-4 text-white" />} iconBg="#ea580c" trend={calorieTrend} loading={loading} />
        <StatCard label="Avg Protein" value={loading ? '—' : `${avgProtein}g`} sub="per day"
          icon={<Zap className="w-4 h-4 text-white" />} iconBg="#7c3aed" loading={loading} />
        <StatCard label="Today's Goal" value={loading ? '—' : `${goalPct}%`} sub="completion"
          icon={<Target className="w-4 h-4 text-white" />} iconBg="#3456c8" loading={loading} />
        <StatCard label="Consistency" value={loading ? '—' : `${consistency}%`} sub="days logged"
          icon={<Calendar className="w-4 h-4 text-white" />} iconBg="#d97706" loading={loading} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Calorie trend */}
        <div className="lg:col-span-2 xh-card p-7 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#3456c8]" />
            <p className="xh-label">Calorie Trend — 7 Days</p>
          </div>
          <div className="h-[220px]">
            {loading ? <Skeleton className="w-full h-full rounded-2xl bg-[#edf0f7]" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3456c8" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3456c8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#c8d0e0" fontSize={11} tickLine={false} axisLine={false}
                         style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600 }} />
                  <YAxis stroke="#c8d0e0" fontSize={11} tickLine={false} axisLine={false}
                         style={{ fontFamily:"'DM Sans',sans-serif" }} />
                  <Tooltip content={<ChartTooltip />} />
                  {profile?.calorie_target && (
                    <ReferenceLine y={profile.calorie_target} stroke="#e0e5f0" strokeDasharray="4 4" strokeWidth={1.5} />
                  )}
                  <Area type="monotone" dataKey="calories" name="Calories" unit=" kcal"
                        stroke="#3456c8" strokeWidth={2.5} fillOpacity={1} fill="url(#calGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Macro donut */}
        <div className="xh-card p-7 space-y-4">
          <p className="xh-label">Macro Split (All-Time)</p>
          <div className="h-[180px] relative">
            {loading ? <Skeleton className="w-full h-full rounded-2xl bg-[#edf0f7]" /> : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={macroData} cx="50%" cy="50%" innerRadius={52} outerRadius={72}
                         paddingAngle={4} dataKey="value" stroke="none">
                      {macroData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="xh-label">Total</p>
                    <p className="font-bold text-[#0E1929] text-lg">{macroData.reduce((s, d) => s + d.value, 0)}g</p>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex justify-center gap-5">
            {macroData.map(m => (
              <div key={m.name} className="flex flex-col items-center text-xs">
                <div className="w-2.5 h-2.5 rounded-full mb-1" style={{ background: m.color }} />
                <span className="font-bold text-[#0E1929]">{m.value}g</span>
                <span className="text-[#9aa0b0]">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Protein + Meal Type charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="xh-card p-7 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#7c3aed]" />
            <p className="xh-label">Weekly Protein Intake</p>
          </div>
          <div className="h-[200px]">
            {loading ? <Skeleton className="w-full h-full rounded-2xl bg-[#edf0f7]" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#c8d0e0" fontSize={11} tickLine={false} axisLine={false}
                         style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600 }} />
                  <YAxis stroke="#c8d0e0" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="protein" name="Protein" unit="g" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="xh-card p-7 space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#ea580c]" />
            <p className="xh-label">Calories by Meal Type</p>
          </div>
          <div className="h-[200px]">
            {loading ? <Skeleton className="w-full h-full rounded-2xl bg-[#edf0f7]" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mealTypeBreakdown} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis type="number" stroke="#c8d0e0" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#c8d0e0" fontSize={11} tickLine={false} axisLine={false} width={70}
                         style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Calories" unit=" kcal" fill="#3456c8" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="xh-card p-7 space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-[#d97706]" />
          <p className="xh-label">Progress Insights</p>
        </div>
        <div className="space-y-3">
          {insights.map((ins, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3.5 p-4 rounded-2xl border text-sm font-medium ${
                ins.good
                  ? 'bg-green-50 border-green-100 text-green-800'
                  : 'bg-orange-50 border-orange-100 text-orange-800'
              }`}>
              <span className="text-base flex-shrink-0">{ins.icon}</span>
              <span>{ins.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="xh-card p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#d97706]" />
            <p className="xh-label">Earned Badges</p>
          </div>
          <span className="xh-badge-orange text-[11px]">
            {badges.filter(b => b.earned).length}/{badges.length} unlocked
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {badges.map(badge => (
            <motion.div key={badge.id} whileHover={badge.earned ? { y: -3 } : {}}
              className={`p-5 rounded-2xl border text-center transition-all ${
                badge.earned
                  ? 'bg-amber-50 border-amber-100 shadow-sm'
                  : 'bg-[#f8f9fc] border-[#f0f2f8] opacity-40'
              }`}>
              <div className="text-3xl mb-2">{badge.icon}</div>
              <p className="text-xs font-bold text-[#0E1929]">{badge.name}</p>
              <p className="text-[10px] text-[#9aa0b0] mt-1 leading-tight">{badge.desc}</p>
              {badge.earned && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-[9px] text-amber-600 font-bold uppercase">Unlocked</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Level progress */}
      <div className="xh-card p-7">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
            <Star className="w-7 h-7 text-amber-500 fill-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-[#0E1929]">Level {levelInfo.level} · {levelInfo.title}</p>
              {levelInfo.next && <p className="xh-label">{levelInfo.next.xpRequired - levelInfo.xp} XP to next</p>}
            </div>
            <div className="xh-progress">
              <motion.div className="xh-progress-fill"
                style={{ background: 'linear-gradient(90deg,#fbbf24,#d97706)' }}
                initial={{ width: 0 }} animate={{ width: `${levelInfo.progress}%` }}
                transition={{ duration: 1.5 }} />
            </div>
            <p className="text-xs text-[#9aa0b0] mt-1.5">{levelInfo.xp} XP total</p>
          </div>
        </div>
      </div>
    </div>
  );
}
