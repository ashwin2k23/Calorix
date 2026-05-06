import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, Flame, Droplets, Target, TrendingUp, Zap, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function buildWeeklyData(meals) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = days[d.getDay()];
    const dateStr = d.toISOString().split('T')[0];
    const dayMeals = meals.filter(m => m.created_at?.startsWith(dateStr));
    const cals = dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
    result.push({ day: label, calories: cals });
  }
  return result;
}

export default function Overview({ profile, user }) {
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState([]);
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);

  const fetchMeals = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API}/api/meals/${user.id}`);
      const data = await response.json();
      if (data.success) setMeals(data.data);
    } catch (error) {
      console.error('Failed to fetch meals:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  const consumed = meals.reduce((acc, m) => acc + (m.calories || 0), 0);
  const goal = profile?.calorie_target || 2000;
  const remaining = Math.max(0, goal - consumed);
  const progressPct = Math.min(Math.round((consumed / goal) * 100), 100);

  const proteinConsumed = Math.round(meals.reduce((acc, m) => acc + (m.protein || 0), 0));
  const proteinGoal = profile?.protein_target || 120;
  const carbsConsumed = Math.round(meals.reduce((acc, m) => acc + (m.carbs || 0), 0));
  const carbsGoal = profile?.carbs_target || 200;
  const fatsConsumed = Math.round(meals.reduce((acc, m) => acc + (m.fats || 0), 0));
  const fatsGoal = profile?.fats_target || 60;

  const hasLoggedMeals = meals.length > 0;
  const weeklyData = buildWeeklyData(meals);

  const macroData = [
    { name: 'Carbs', consumed: carbsConsumed, goal: carbsGoal, color: '#f97316' },
    { name: 'Protein', consumed: proteinConsumed, goal: proteinGoal, color: '#9b6dff' },
    { name: 'Fat', consumed: fatsConsumed, goal: fatsGoal, color: '#00c2ff' },
  ];
  const pieData = macroData.map(m => ({ name: m.name, value: Math.max(m.consumed, 1), color: m.color }));

  const fetchInsight = async () => {
    setInsightLoading(true);
    try {
      const res = await fetch(`${API}/api/ai-insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, consumed, proteinConsumed, carbsConsumed, fatsConsumed })
      });
      const data = await res.json();
      if (data.success) setInsight(data.insight);
    } catch {
      setInsight(`You are ${proteinGoal - proteinConsumed}g below your protein target. Add paneer or dal to your next meal!`);
    } finally {
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) fetchInsight();
  }, [loading]);

  const kpiCards = [
    {
      label: 'Calories Consumed',
      value: consumed,
      unit: 'kcal eaten',
      color: 'primary',
      glow: 'bg-primary/10',
      icon: <Flame className="w-4 h-4 text-primary" />,
      sub: `${progressPct}% of goal`,
    },
    {
      label: 'Calories Remaining',
      value: remaining,
      unit: `of ${goal} kcal`,
      color: '[#00c2ff]',
      glow: 'bg-[#00c2ff]/10',
      icon: <Target className="w-4 h-4 text-[#00c2ff]" />,
      sub: consumed >= goal ? '🎯 Goal reached!' : 'Keep going!',
    },
    {
      label: 'Protein Intake',
      value: `${proteinConsumed}g`,
      unit: `of ${proteinGoal}g goal`,
      color: '[#9b6dff]',
      glow: 'bg-[#9b6dff]/10',
      icon: <Zap className="w-4 h-4 text-[#9b6dff]" />,
      progress: Math.min((proteinConsumed / proteinGoal) * 100, 100),
      progressColor: '#9b6dff',
    },
    {
      label: 'Hydration',
      value: '0L',
      unit: `of ${((profile?.hydration_target || 3000) / 1000).toFixed(1)}L goal`,
      color: 'blue-400',
      glow: 'bg-blue-400/10',
      icon: <Droplets className="w-4 h-4 text-blue-400" />,
      progress: 0,
      progressColor: '#60a5fa',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            {getGreeting()}, {user?.firstName || 'User'} 👋
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-muted-foreground text-sm">Here's your nutrition progress today.</span>
            {profile?.goal_type && (
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium">
                🎯 {profile.goal_type}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right hidden md:block">
            <p className="text-xs text-muted-foreground">Daily Progress</p>
            <p className="text-lg font-bold text-primary">{progressPct}%</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="bg-gradient-to-br from-card to-card/50 border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
              <div className={`absolute -right-6 -top-6 w-24 h-24 ${card.glow} rounded-full blur-xl group-hover:scale-125 transition-transform`} />
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  {card.icon} {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {loading ? (
                  <div className="space-y-2 mt-1">
                    <Skeleton className="h-7 w-[80px]" />
                    <Skeleton className="h-2.5 w-[60px]" />
                  </div>
                ) : (
                  <>
                    <div className={`text-2xl font-bold text-${card.color}`}>{card.value}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.unit}</p>
                    {card.progress !== undefined && (
                      <div className="w-full h-1.5 bg-black/20 rounded-full mt-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${card.progress}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: card.progressColor }}
                        />
                      </div>
                    )}
                    {card.sub && <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* AI Insight Card */}
      <Card className="border-primary/20 bg-primary/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-[#00c2ff]" />
        <CardContent className="p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-primary/20 text-primary flex-shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-base">Today's AI Insight</h3>
              <button
                onClick={fetchInsight}
                disabled={insightLoading}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${insightLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {insightLoading ? (
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Empty State or Charts */}
      {!hasLoggedMeals && !loading ? (
        <Card className="border-dashed border-white/10 bg-black/20">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-primary/10"
            >
              <TrendingUp className="w-10 h-10 text-primary" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-2">No meals tracked yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">Start your nutrition journey today. Add your first meal to see personalized analytics and AI insights.</p>
            <Link to="/dashboard/meals">
              <Button className="rounded-full px-8 bg-gradient-to-r from-primary to-[#00c2ff] hover:opacity-90">
                Log Your First Meal
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Calorie Chart */}
          <Card className="col-span-1 lg:col-span-2 border-white/5 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Weekly Calorie Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              {loading ? <Skeleton className="w-full h-full rounded-xl" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e87a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00e87a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#7a90b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#7a90b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f1629', borderColor: '#1e2d4a', borderRadius: '10px' }}
                      itemStyle={{ color: '#00e87a' }}
                    />
                    <Area type="monotone" dataKey="calories" stroke="#00e87a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCal)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Macro Donut */}
          <Card className="col-span-1 border-white/5 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Today's Macros</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center relative">
              {loading ? <Skeleton className="w-40 h-40 rounded-full" /> : (
                <>
                  <div className="relative w-full h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75}
                          paddingAngle={4} dataKey="value" stroke="none">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f1629', borderColor: '#1e2d4a', borderRadius: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Consumed</p>
                        <p className="font-bold text-lg">{consumed}</p>
                        <p className="text-xs text-muted-foreground">kcal</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 w-full mt-2">
                    {macroData.map(m => (
                      <div key={m.name} className="flex flex-col items-center text-sm">
                        <div className="w-2.5 h-2.5 rounded-full mb-1" style={{ backgroundColor: m.color }} />
                        <span className="font-bold text-xs">{m.consumed}g</span>
                        <span className="text-xs text-muted-foreground">{m.name}</span>
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
