import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';

const weeklyData = [
  { day: 'Mon', calories: 1800 },
  { day: 'Tue', calories: 2100 },
  { day: 'Wed', calories: 1950 },
  { day: 'Thu', calories: 2200 },
  { day: 'Fri', calories: 1750 },
  { day: 'Sat', calories: 2400 },
  { day: 'Sun', calories: 2000 },
];

export default function Overview() {
  const goal = 2100;
  const consumed = 1450;
  const remaining = goal - consumed;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Today's Overview</h1>
        <p className="text-muted-foreground">Here is your daily summary and progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Calories Consumed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{consumed}</div>
            <p className="text-xs text-muted-foreground mt-1">kcal eaten today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Calories Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#00c2ff]">{remaining}</div>
            <p className="text-xs text-muted-foreground mt-1">out of {goal} kcal goal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Protein Intake</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#9b6dff]">85g</div>
            <p className="text-xs text-muted-foreground mt-1">out of 120g goal</p>
            <div className="w-full h-1.5 bg-black/20 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-[#9b6dff] w-[70%]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 border-white/5">
          <CardHeader>
            <CardTitle>Weekly Calorie Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
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
          </CardContent>
        </Card>

        <Card className="col-span-1 border-white/5">
          <CardHeader>
            <CardTitle>Macros Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'Macros', Carbs: 180, Protein: 85, Fat: 45 }]} layout="vertical" margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                <XAxis type="number" stroke="#7a90b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#7a90b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#162140', borderColor: '#3d5070', borderRadius: '8px' }}
                />
                <Bar dataKey="Carbs" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="Protein" fill="#9b6dff" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="Fat" fill="#00c2ff" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-[#f97316]" /> Carbs (180g)</div>
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-[#9b6dff]" /> Protein (85g)</div>
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-[#00c2ff]" /> Fat (45g)</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
