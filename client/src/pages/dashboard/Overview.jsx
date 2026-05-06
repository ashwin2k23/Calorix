import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, Flame, Droplets, Target } from 'lucide-react';

const weeklyData = [
  { day: 'Mon', calories: 1800 },
  { day: 'Tue', calories: 2100 },
  { day: 'Wed', calories: 1950 },
  { day: 'Thu', calories: 2200 },
  { day: 'Fri', calories: 1750 },
  { day: 'Sat', calories: 2400 },
  { day: 'Sun', calories: 2000 },
];

export default function Overview({ profile, user }) {
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    if (!user) return;
    const fetchMeals = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/meals/${user.id}`);
        const data = await response.json();
        if (data.success) {
          setMeals(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch meals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMeals();
  }, [user]);

  const consumed = meals.reduce((acc, meal) => acc + (meal.calories || 0), 0);
  const goal = profile?.calorie_target || 2000;
  const remaining = Math.max(0, goal - consumed);
  
  const proteinConsumed = meals.reduce((acc, meal) => acc + (meal.protein || 0), 0);
  const proteinGoal = profile?.protein_target || 120;

  const carbsConsumed = meals.reduce((acc, meal) => acc + (meal.carbs || 0), 0);
  const carbsGoal = profile?.carbs_target || 200;

  const fatsConsumed = meals.reduce((acc, meal) => acc + (meal.fats || 0), 0);
  const fatsGoal = profile?.fats_target || 60;
  
  const hasLoggedMeals = meals.length > 0;

  const macroData = [
    { name: 'Carbs', value: Math.max(0, carbsGoal - carbsConsumed), color: '#f97316' },
    { name: 'Protein', value: Math.max(0, proteinGoal - proteinConsumed), color: '#9b6dff' },
    { name: 'Fat', value: Math.max(0, fatsGoal - fatsConsumed), color: '#00c2ff' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Good Evening, {user?.firstName || 'User'} 👋</h1>
          <p className="text-muted-foreground">Here’s your nutrition progress today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/50 border-white/5 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" /> Calories Consumed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2 mt-2">
                <Skeleton className="h-8 w-[100px]" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-foreground">{consumed}</div>
                <p className="text-xs text-muted-foreground mt-1">kcal eaten today</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-card to-card/50 border-white/5 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#00c2ff]/10 rounded-full blur-xl group-hover:bg-[#00c2ff]/20 transition-all" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-[#00c2ff]" /> Calories Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2 mt-2">
                <Skeleton className="h-8 w-[100px]" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-[#00c2ff]">{remaining}</div>
                <p className="text-xs text-muted-foreground mt-1">out of {goal} kcal goal</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-white/5 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#9b6dff]/10 rounded-full blur-xl group-hover:bg-[#9b6dff]/20 transition-all" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-[#9b6dff]" /> Protein Intake
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3 mt-2">
                <Skeleton className="h-8 w-[80px]" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-[#9b6dff]">{proteinConsumed}g</div>
                <div className="w-full h-1.5 bg-black/20 rounded-full mt-3 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((proteinConsumed / proteinGoal) * 100, 100)}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-[#9b6dff]" 
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">out of {proteinGoal}g goal</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-white/5 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-400/10 rounded-full blur-xl group-hover:bg-blue-400/20 transition-all" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-400" /> Hydration
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3 mt-2">
                <Skeleton className="h-8 w-[80px]" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-blue-400">0L</div>
                <div className="w-full h-1.5 bg-black/20 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-blue-400 w-[0%]" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">out of {profile?.hydration_target / 1000}L goal</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insight Card */}
      <Card className="border-primary/20 bg-primary/5 backdrop-blur-md relative overflow-hidden shadow-[0_0_20px_rgba(0,232,122,0.05)]">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <CardContent className="p-6 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/20 text-primary">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Today's AI Insight</h3>
            <p className="text-muted-foreground leading-relaxed">
              {hasLoggedMeals 
                ? `You are ${proteinGoal - proteinConsumed}g below your protein target today. Consider adding paneer, eggs, or chicken to your next meal to hit your ${profile?.goal_type} goal efficiently.`
                : `You haven't logged any meals yet today. Remember, tracking consistently is the fastest way to hit your ${profile?.goal_type} goal.`}
            </p>
          </div>
        </CardContent>
      </Card>

      {!hasLoggedMeals && !loading ? (
        <Card className="border-dashed border-white/10 bg-black/20">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-6 shadow-xl">
              <Target className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No meals added yet.</h3>
            <p className="text-muted-foreground max-w-sm mb-6">Start tracking your nutrition journey today. Add your first meal to see your personalized analytics.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-1 lg:col-span-2 border-white/5 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Weekly Calorie Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loading ? (
                <Skeleton className="w-full h-full rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e87a" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00e87a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#7a90b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#7a90b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#162140', borderColor: '#3d5070', borderRadius: '8px' }}
                      itemStyle={{ color: '#00e87a' }}
                    />
                    <Area type="monotone" dataKey="calories" stroke="#00e87a" strokeWidth={3} fillOpacity={1} fill="url(#colorCal)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1 border-white/5 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Target Macros</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex flex-col items-center justify-center relative">
              {loading ? (
                <Skeleton className="w-48 h-48 rounded-full" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#162140', borderColor: '#3d5070', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-8">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase">Target</p>
                      <p className="font-bold text-xl">{profile?.calorieTarget}</p>
                    </div>
                  </div>

                  <div className="flex justify-center gap-6 w-full mt-2">
                    {macroData.map(m => (
                      <div key={m.name} className="flex flex-col items-center text-sm">
                        <div className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: m.color }} /> 
                        <span className="font-bold">{m.value}g</span>
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
  )
}
