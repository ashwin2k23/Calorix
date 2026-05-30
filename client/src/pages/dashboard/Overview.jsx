import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion, useInView, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, Flame, Droplets, Target, TrendingUp, Zap, Plus, Minus, ArrowRight, Sparkles, Coffee, Activity, ChevronRight, Check, Clock, ShieldCheck, AlertCircle, Award } from 'lucide-react';
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
    return { day: days[d.getDay()], calories: cals, target: target };
  });
}

// Aceternity-style Spotlight Card
function SpotlightCard({ children, className = "" }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(0.8)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-[2rem] bg-slate-950/40 border border-white/[0.04] backdrop-blur-xl shadow-2xl transition-all duration-500 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(139, 92, 246, 0.05), transparent 45%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

// Animated CountUp Number
function CountUp({ value, suffix = "", className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const springValue = useSpring(0, { bounce: 0, duration: 1500 });
  const displayValue = useTransform(springValue, (current) => Math.round(current) + suffix);

  useEffect(() => {
    if (inView) springValue.set(value);
  }, [inView, springValue, value]);

  return <motion.span ref={ref} className={className}>{displayValue}</motion.span>;
}

// Custom Premium Radial Calorie Widget
function CalorieProgressWidget({ consumed, goal, lastMeal }) {
  const pct = Math.min(consumed / Math.max(goal, 1), 1);
  const percentage = Math.round(pct * 100);
  const isOver = consumed > goal;
  const score = Math.max(0, 100 - Math.abs((consumed / goal) * 100 - 100));

  const size = 230;
  const strokeW = 12;
  const r = (size - strokeW - 20) / 2;
  const circ = 2 * Math.PI * r;
  const strokeDashoffset = circ * (1 - pct);

  const outerR = r + 10;

  return (
    <div className="flex flex-col items-center justify-center p-2 select-none">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Subtle blur background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-40 h-40 rounded-full blur-3xl opacity-10 bg-indigo-500" />
        </div>

        {/* SVG Progress Ring */}
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} className="relative z-10">
          <defs>
            <linearGradient id="calorieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          
          {/* Segmented Outer Circle */}
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={outerR} 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.03)" 
            strokeWidth={1.5} 
            strokeDasharray="4 6"
          />

          {/* Background Track */}
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={r} 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.02)" 
            strokeWidth={strokeW} 
          />
          
          {/* Animated Main Progress Ring */}
          <motion.circle 
            cx={size / 2} 
            cy={size / 2} 
            r={r} 
            fill="none" 
            stroke="url(#calorieGrad)" 
            strokeWidth={strokeW} 
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <span className="text-4xl font-extrabold tracking-tight text-white leading-none">
            <CountUp value={consumed} />
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">
            kcal
          </span>
          <div className="mt-3 flex flex-col items-center">
            <span className="text-xs font-bold text-indigo-400">
              {percentage}% Active
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">
              Goal: {goal}
            </span>
            {lastMeal ? (
              <span className="text-[9px] text-emerald-400 font-medium mt-2 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
                +{lastMeal.calories} from {lastMeal.name}
              </span>
            ) : (
              <span className="text-[9px] text-slate-600 mt-2 font-medium">
                No logs today
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="w-full flex items-center justify-between mt-4 px-2 border-t border-white/[0.04] pt-4">
        <div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Remaining</span>
          <span className="text-base font-black text-white">
            {Math.max(0, goal - consumed)} <span className="text-[10px] font-semibold text-slate-400">kcal</span>
          </span>
        </div>
        <div className="text-right">
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Precision</span>
          <span className="text-base font-black text-indigo-400">
            {Math.round(score)}<span className="text-[10px] font-semibold text-slate-400">/100</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// Shimmering Macro Progress Bar (Rule 5: Thicker, rounded, gradient, glow)
function MacroProgressBar({ label, value, target, gradientClass, glowColor, colorText }) {
  const pct = Math.min((value / Math.max(target, 1)) * 100, 100);
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      className="space-y-2 relative group p-3 rounded-2xl hover:bg-white/[0.01] transition-all duration-300 select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex justify-between items-end text-xs font-bold">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 group-hover:text-white transition-colors">{label}</span>
          {hovered && (
            <motion.span 
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-[8px] uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/10 ${colorText}`}
            >
              {Math.round(pct)}% Met
            </motion.span>
          )}
        </div>
        <div className="flex gap-1 items-baseline">
          <span className="text-white text-sm font-black"><CountUp value={value} />g</span>
          <span className="text-slate-500 text-[10px]">/ {target}g</span>
        </div>
      </div>

      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden relative">
        {/* Glow behind tracking */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 0.3 : 0.15 }}
          className={`absolute inset-0 blur-[4px] rounded-full ${glowColor}`}
          style={{ width: `${pct}%` }}
        />

        {/* Real Progress fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full relative overflow-hidden bg-gradient-to-r ${gradientClass}`}
        >
          {/* Shimmer line */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-shimmer-slide" />
        </motion.div>
      </div>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[9px] text-slate-500 font-semibold pt-1 flex justify-between"
          >
            <span>Remaining: {Math.max(0, target - value)}g</span>
            <span>Excess: {value > target ? `${value - target}g` : '0g'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hydration - Liquid fill capsule redesign
function InteractiveHydrationTracker({ userId, water, setWater, goal = 3000 }) {
  const [bubbles, setBubbles] = useState([]);
  const [rippling, setRippling] = useState(false);
  const storageKey = `calorix_water_${userId}_${TODAY}`;

  const update = useCallback(async (newVal) => {
    const clamped = Math.max(0, Math.min(newVal, goal * 1.5));
    setWater(clamped);
    localStorage.setItem(storageKey, String(clamped));
    try { await api.upsertWater(userId, TODAY, clamped); } catch {}
  }, [userId, goal, storageKey, setWater]);

  const spawnBubbles = () => {
    const newBubbles = Array.from({ length: 4 }).map(() => ({
      id: Math.random(),
      left: Math.random() * 80 + 10,
      size: Math.random() * 5 + 3,
      delay: Math.random() * 0.8,
      duration: Math.random() * 1.5 + 1
    }));
    setBubbles((prev) => [...prev, ...newBubbles]);
    setTimeout(() => {
      setBubbles((prev) => prev.filter(b => !newBubbles.includes(b)));
    }, 2500);
  };

  const handleLog = (amount) => {
    setRippling(true);
    update(water + amount);
    spawnBubbles();
    setTimeout(() => setRippling(false), 600);
  };

  const pct = Math.min((water / goal) * 100, 100);

  return (
    <div className="p-8 h-full flex flex-col justify-between relative overflow-hidden group">
      {/* Decorative Glow */}
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-500" />
      
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Hydration</span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            {Math.round(pct)}% Completed
          </span>
        </div>

        <div className="flex flex-row items-center justify-around gap-6 my-2">
          {/* Liquid Glass Capsule */}
          <div 
            onMouseMove={spawnBubbles}
            className="relative w-24 h-48 bg-slate-900/60 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden cursor-pointer"
          >
            {/* Liquid Fill */}
            <motion.div 
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-600 via-indigo-500 to-indigo-400"
              initial={{ height: 0 }}
              animate={{ height: `${pct}%` }}
              transition={{ type: "spring", stiffness: 40, damping: 12 }}
            >
              {/* Wave SVG 1 */}
              <div className="absolute left-0 bottom-full w-[200%] h-6 overflow-hidden pointer-events-none" style={{ transform: 'translateY(1px)' }}>
                <svg className="w-full h-full animate-wave-slow fill-indigo-400" viewBox="0 0 120 28" preserveAspectRatio="none">
                  <path d="M0 15 Q 30 5, 60 15 T 120 15 T 180 15 T 240 15 L 240 28 L 0 28 Z" />
                </svg>
              </div>

              {/* Wave SVG 2 */}
              <div className="absolute left-0 bottom-full w-[200%] h-6 overflow-hidden opacity-40 pointer-events-none" style={{ transform: 'translateY(1px)' }}>
                <svg className="w-full h-full animate-wave-fast fill-indigo-300" viewBox="0 0 120 28" preserveAspectRatio="none">
                  <path d="M0 15 Q 30 25, 60 15 T 120 15 T 180 15 T 240 15 L 240 28 L 0 28 Z" />
                </svg>
              </div>

              {/* Bubbles */}
              {bubbles.map(b => (
                <span
                  key={b.id}
                  className="absolute bottom-0 rounded-full bg-white/30 animate-bubble"
                  style={{
                    left: `${b.left}%`,
                    width: `${b.size}px`,
                    height: `${b.size}px`,
                    animationDelay: `${b.delay}s`,
                    animationDuration: `${b.duration}s`,
                  }}
                />
              ))}
            </motion.div>

            {/* Glass shine reflections */}
            <div className="absolute top-4 left-3 w-1.5 h-16 bg-white/10 rounded-full pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-20">
              <span className="text-lg font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                {Math.round(pct)}%
              </span>
            </div>
          </div>

          {/* Metrics & Adders */}
          <div className="flex-1 space-y-3">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Volume Logged</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black text-white tracking-tight">
                  <CountUp value={water} />
                </span>
                <span className="text-indigo-400 font-bold text-xs">/ {goal} ml</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button 
                  onClick={() => handleLog(250)}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold text-xs tracking-wide transition-all duration-300 flex items-center justify-center gap-1 active:scale-95 relative overflow-hidden"
                >
                  +250
                  {rippling && <span className="absolute inset-0 bg-indigo-400/10 animate-ping rounded-xl" />}
                </button>
                <button 
                  onClick={() => handleLog(500)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/20 to-violet-500/20 hover:from-indigo-600/30 hover:to-violet-500/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs tracking-wide transition-all duration-300 flex items-center justify-center gap-1 active:scale-95"
                >
                  +500
                </button>
              </div>
              <button
                onClick={() => update(0)}
                className="w-full py-1.5 rounded-lg text-slate-500 hover:text-slate-400 hover:bg-white/[0.01] text-[9px] font-bold tracking-widest uppercase transition-all"
              >
                Reset Daily Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// 7-Day Velocity Chart Component
function VelocityTrajectoryChart({ weeklyData, goal, loading }) {
  return (
    <div className="p-8 bg-slate-950/30 border border-white/[0.04] rounded-3xl backdrop-blur-xl h-full flex flex-col justify-between overflow-hidden group">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Weekly Progress</span>
          </div>
          <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Daily Goal: {goal} kcal
          </span>
        </div>

        <div className="h-[210px] w-full mt-4">
          {loading ? (
            <Skeleton className="w-full h-full bg-white/5 rounded-2xl" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="velocityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
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
                <Tooltip 
                  cursor={{ stroke: 'rgba(99, 102, 241, 0.3)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const val = payload[0].value;
                    const pctOfGoal = Math.round((val / goal) * 100);
                    return (
                      <div className="bg-[#0b0e14]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl space-y-1.5 select-none">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                        <p className="text-xl font-black text-white">{val.toLocaleString()} <span className="text-xs text-slate-400 font-semibold">kcal</span></p>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${val > goal ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                          <span className="text-[10px] font-bold text-slate-300">{pctOfGoal}% of daily target</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine 
                  y={goal} 
                  stroke="rgba(99, 102, 241, 0.3)" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ 
                    position: 'top', 
                    value: 'LIMIT', 
                    fill: 'rgba(99, 102, 241, 0.5)', 
                    fontSize: 8, 
                    fontWeight: '800',
                    letterSpacing: '0.1em'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="calories" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#velocityFill)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

// Hero greeting section redesign
function HeroHeader({ profile, user, streak, consumed, goal }) {
  const greeting = getGreeting();
  const pct = Math.min((consumed / Math.max(goal, 1)) * 100, 100);
  const percentage = Math.round(pct);
  
  const size = 70;
  const strokeW = 6;
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const strokeDashoffset = circ * (1 - pct / 100);

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#121625]/60 via-[#0e111a]/70 to-[#090B14]/80 border border-white/[0.04] p-8 md:p-10 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8 group">
      {/* Aurora glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-indigo-500/8 transition-all duration-700" />
      
      <div className="space-y-4 relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Active Target
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.02] border border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Goal: {profile?.goal_type || 'Maintain Weight'}
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-none">
            {greeting}, <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">{user?.firstName || 'Champion'}</span>
          </h1>
          <p className="text-slate-400 max-w-lg text-xs md:text-sm font-semibold leading-relaxed">
            Your daily macro targets are synced. Consistency is key to optimizing performance.
          </p>
        </div>

        {/* Highlight Stats Block */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-slate-400 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>{goal.toLocaleString()} kcal target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{percentage}% completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span>{streak} day streak</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 relative z-10 shrink-0 w-full md:w-auto justify-between md:justify-end">
        <div className="flex items-center gap-4 bg-white/[0.01] border border-white/[0.04] p-4 rounded-2xl shadow-xl">
          <div className="relative flex items-center justify-center animate-pulse-slow" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth={strokeW} />
              <motion.circle 
                cx={size / 2} cy={size / 2} r={r} fill="none" 
                stroke="url(#miniCalGrad)" strokeWidth={strokeW} 
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="miniCalGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-black text-white">{percentage}%</span>
            </div>
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Progress</p>
            <p className="text-sm font-black text-white">{consumed} <span className="text-[9px] text-slate-400 font-semibold">kcal</span></p>
          </div>
        </div>

        <Link to="/dashboard/meals" className="shrink-0">
          <button className="h-12 px-6 rounded-2xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 active:scale-95 transition-all shadow-[0_4px_16px_rgba(99,102,241,0.25)] flex items-center gap-1.5 shrink-0">
            <Plus className="w-4 h-4" /> Log Meal
          </button>
        </Link>
      </div>
    </div>
  );
}

// Upgraded Stat Cards Row
function StatCardsRow({ streak, water, hydrationGoal, protein, proteinGoal, levelInfo, loading }) {
  const cards = [
    {
      title: "Streak",
      value: `${streak} Days`,
      subtext: "Consistency: " + Math.min(100, Math.round(streak / 7 * 100)) + "%",
      icon: <Flame className="w-5 h-5 text-orange-400 animate-pulse" />,
      color: "from-orange-500/20 to-red-500/20 border-orange-500/10",
      glow: "group-hover:bg-orange-500/10",
      progress: Math.min(100, (streak / 7) * 100),
      progressColor: "bg-orange-500"
    },
    {
      title: "Hydration",
      value: `${water} / ${hydrationGoal} ml`,
      subtext: Math.round((water / hydrationGoal) * 100) + "% completed",
      icon: <Droplets className="w-5 h-5 text-indigo-400" />,
      color: "from-indigo-500/20 to-blue-500/20 border-indigo-500/10",
      glow: "group-hover:bg-indigo-500/10",
      progress: Math.min(100, (water / hydrationGoal) * 100),
      progressColor: "bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.3)]"
    },
    {
      title: "Protein",
      value: `${protein} / ${proteinGoal} g`,
      subtext: Math.max(0, proteinGoal - protein) + "g remaining",
      icon: <Target className="w-5 h-5 text-violet-400" />,
      color: "from-violet-500/20 to-indigo-500/20 border-violet-500/10",
      glow: "group-hover:bg-violet-500/10",
      progress: Math.min(100, (protein / proteinGoal) * 100),
      progressColor: "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.3)]"
    },
    {
      title: `Level ${levelInfo?.level || 1}: ${levelInfo?.title || 'Active'}`,
      value: `${levelInfo?.xp || 0} XP`,
      subtext: levelInfo?.next ? `${levelInfo.next.xpRequired - levelInfo.xp} XP to next level` : "Max Level",
      icon: <Award className="w-5 h-5 text-amber-400" />,
      color: "from-amber-500/20 to-yellow-500/20 border-amber-500/10",
      glow: "group-hover:bg-amber-500/10",
      progress: levelInfo?.progress || 0,
      progressColor: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: i * 0.05 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="relative overflow-hidden rounded-2xl bg-slate-950/40 border border-white/[0.04] p-5 backdrop-blur-xl group hover:shadow-2xl transition-all duration-300"
        >
          <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 transition-all duration-500 ${c.glow}`} />

          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{c.title}</span>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 group-hover:scale-105 transition-transform duration-300">
              {c.icon}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xl font-black text-white tracking-tight">
                {loading ? <Skeleton className="h-7 w-20 bg-white/5" /> : c.value}
              </span>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                {loading ? <Skeleton className="h-3.5 w-28 bg-white/5" /> : c.subtext}
              </p>
            </div>

            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: loading ? 0 : `${c.progress}%` }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className={`h-full rounded-full ${c.progressColor}`}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Premium Animated Adherence Heatmap
function AdherenceHeatmap({ data }) {
  return (
    <div className="p-8 bg-slate-950/30 border border-white/[0.04] rounded-3xl backdrop-blur-xl h-full flex flex-col justify-between overflow-hidden group">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Adherence Heatmap</span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Last 28 Days
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed mb-6">
          Consistency check across training blocks. Indigo indicates target adherence.
        </p>

        {/* Heatmap grid */}
        <div className="grid grid-cols-7 gap-2 max-w-[240px] mx-auto">
          {data.map((day, idx) => {
            let bgClass = "bg-white/[0.02] border-white/5";
            let tooltipText = `${day.calories} kcal`;
            if (day.value === 1) bgClass = "bg-indigo-950/30 border-indigo-900/20";
            else if (day.value === 2) bgClass = "bg-indigo-700/30 border-indigo-700/40";
            else if (day.value === 3) bgClass = "bg-indigo-500 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.25)]";
            else if (day.value === 4) bgClass = "bg-rose-500/80 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.2)]";

            return (
              <motion.div
                key={idx}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.015 }}
                whileHover={{ scale: 1.2, zIndex: 10 }}
                className={`w-7 h-7 rounded border flex items-center justify-center cursor-pointer transition-all duration-300 relative ${bgClass}`}
                title={`${day.date}: ${tooltipText}`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 mt-6 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded bg-white/[0.02] border border-white/5" />
          <div className="w-2.5 h-2.5 rounded bg-indigo-900/30 border border-indigo-900/40" />
          <div className="w-2.5 h-2.5 rounded bg-indigo-700/50 border border-indigo-700/60" />
          <div className="w-2.5 h-2.5 rounded bg-indigo-500 border border-indigo-400" />
          <div className="w-2.5 h-2.5 rounded bg-rose-500/80 border border-rose-400" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export default function Overview({ profile, user }) {
  const [loading, setLoading]               = useState(true);
  const [meals, setMeals]                   = useState([]);
  const [waterToday, setWaterToday]         = useState(0);

  const fetchMeals = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getMeals(user.id);
      if (data.success) setMeals(data.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user]);

  const fetchWater = useCallback(async () => {
    if (!user) return;
    try {
      const d = await api.getWater(user.id, TODAY);
      if (d.success && d.data.amount_ml > 0) {
        setWaterToday(d.data.amount_ml);
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    fetchMeals();
    fetchWater();
  }, [fetchMeals, fetchWater]);

  const consumed        = useMemo(() => meals.filter(m => m.created_at?.startsWith(TODAY)).reduce((a, m) => a + (m.calories || 0), 0), [meals]);
  const goal            = profile?.calorie_target || 2000;
  const proteinConsumed = useMemo(() => Math.round(meals.filter(m => m.created_at?.startsWith(TODAY)).reduce((a, m) => a + (m.protein || 0), 0)), [meals]);
  const proteinGoal     = profile?.protein_target || 120;
  const carbsConsumed   = useMemo(() => Math.round(meals.filter(m => m.created_at?.startsWith(TODAY)).reduce((a, m) => a + (m.carbs || 0), 0)), [meals]);
  const carbsGoal       = profile?.carbs_target || 200;
  const fatsConsumed    = useMemo(() => Math.round(meals.filter(m => m.created_at?.startsWith(TODAY)).reduce((a, m) => a + (m.fats || 0), 0)), [meals]);
  const fatsGoal        = profile?.fats_target || 60;
  const weeklyData      = useMemo(() => buildWeeklyData(meals, goal), [meals, goal]);
  
  const adherenceHistory = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (27 - i));
      const dateStr = d.toISOString().split('T')[0];
      const cals = meals.filter(m => m.created_at?.startsWith(dateStr)).reduce((s, m) => s + (m.calories || 0), 0);
      const target = profile?.calorie_target || 2000;
      let val = 0;
      if (cals > 0) {
        const pct = cals / target;
        if (pct < 0.3) val = 1;
        else if (pct < 0.8) val = 2;
        else if (pct <= 1.1) val = 3;
        else val = 4;
      }
      return { date: dateStr, calories: cals, value: val };
    });
  }, [meals, profile]);

  const todayMeals = meals.filter(m => m.created_at?.startsWith(TODAY)).reverse();
  const hasLoggedMeals = meals.length > 0;
  const hasTodayMeals = todayMeals.length > 0;

  // Utilize Gamification Hooks
  const { streak, levelInfo } = useGamification({ meals, waterToday, profile });

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVars = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 90, damping: 18 } }
  };

  const lastMeal = todayMeals[0] || null;

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto pb-12 select-none">
      
      {/* Hero Greeting Panel */}
      <motion.div variants={itemVars}>
        <HeroHeader profile={profile} user={user} streak={streak} consumed={consumed} goal={goal} />
      </motion.div>

      {/* Stats row */}
      <motion.div variants={itemVars}>
        <StatCardsRow 
          streak={streak} 
          water={waterToday} 
          hydrationGoal={profile?.hydration_target || 3000} 
          protein={proteinConsumed} 
          proteinGoal={proteinGoal} 
          levelInfo={levelInfo} 
          loading={loading} 
        />
      </motion.div>

      {/* Main dashboard widgets grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Calorie Core Progress Ring */}
        <motion.div variants={itemVars} className="xl:col-span-12">
          <SpotlightCard className="p-8 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-950/10 via-slate-950/40 to-slate-950/40">
            {loading ? <Skeleton className="w-full h-[320px] bg-white/5" /> : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-5 flex justify-center">
                  <CalorieProgressWidget consumed={consumed} goal={goal} lastMeal={lastMeal} />
                </div>
                <div className="md:col-span-7 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4.5 h-4.5 text-slate-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Nutrition Target</span>
                  </div>
                  <MacroProgressBar 
                    label="Protein" 
                    value={proteinConsumed} 
                    target={proteinGoal} 
                    gradientClass="from-indigo-600 to-violet-400" 
                    glowColor="bg-indigo-500" 
                    colorText="text-indigo-400" 
                  />
                  <MacroProgressBar 
                    label="Carbohydrates" 
                    value={carbsConsumed} 
                    target={carbsGoal} 
                    gradientClass="from-amber-500 to-orange-400" 
                    glowColor="bg-orange-500" 
                    colorText="text-orange-400" 
                  />
                  <MacroProgressBar 
                    label="Dietary Fats" 
                    value={fatsConsumed} 
                    target={fatsGoal} 
                    gradientClass="from-rose-500 to-red-400" 
                    glowColor="bg-rose-500" 
                    colorText="text-rose-400" 
                  />
                </div>
              </div>
            )}
          </SpotlightCard>
        </motion.div>

        {/* Daily Log */}
        <motion.div variants={itemVars} className="xl:col-span-4 h-[420px]">
          <SpotlightCard className="h-full p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-500" />
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Daily Log</span>
              </div>
              <div className="px-2.5 py-0.5 bg-white/5 rounded-full text-[9px] font-bold text-slate-400 border border-white/5 uppercase tracking-wider">
                {todayMeals.length} logged
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {todayMeals.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-8">
                  <Activity className="w-8 h-8 mb-2 text-slate-500 animate-pulse" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No logs detected for today</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">Use the Log Meal button to register breakfast, lunch, or dinner.</p>
                </div>
              ) : (
                todayMeals.map((meal, i) => {
                  const quality = (meal.protein / (meal.calories || 1)) > 0.05 ? 'High Protein' : 'Standard';
                  const qColor = quality === 'High Protein' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 bg-slate-400/10';
                  return (
                    <div key={i} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-white/20 group-hover:bg-indigo-400 transition-all group-hover:shadow-[0_0_8px_rgba(99,102,241,0.8)] mt-1.5" />
                        {i !== todayMeals.length - 1 && <div className="w-px h-full bg-white/5 mt-2" />}
                      </div>
                      <div className="flex-1 pb-4 border-b border-white/[0.02]">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="text-sm font-bold text-white capitalize">{meal.name}</h4>
                          <span className="text-xs font-black text-indigo-400">{meal.calories} kcal</span>
                        </div>
                        <div className="flex gap-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          <span>P: {Math.round(meal.protein)}g</span>
                          <span>C: {Math.round(meal.carbs)}g</span>
                          <span>F: {Math.round(meal.fats)}g</span>
                        </div>
                        <div className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${qColor}`}>
                          {quality}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Hydration tracker */}
        <motion.div variants={itemVars} className="xl:col-span-4 h-[420px]">
          <SpotlightCard className="h-full">
            <InteractiveHydrationTracker 
              userId={user?.id} 
              water={waterToday} 
              setWater={setWaterToday} 
              goal={profile?.hydration_target || 3000} 
            />
          </SpotlightCard>
        </motion.div>

        {/* Weekly Progress chart */}
        <motion.div variants={itemVars} className="xl:col-span-4 h-[420px]">
          <VelocityTrajectoryChart weeklyData={weeklyData} goal={goal} loading={loading} />
        </motion.div>

        {/* Adherence Heatmap */}
        <motion.div variants={itemVars} className="xl:col-span-12">
          <AdherenceHeatmap data={adherenceHistory} />
        </motion.div>

      </div>
    </motion.div>
  );
}
