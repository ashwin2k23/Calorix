import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Plus, Trash2, Zap, Clock, Activity, Sparkles, TrendingDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { sanitizeText } from '@/lib/sanitize';

const COMMON_EXERCISES = [
  { name: 'Running', kcalPerMin: 11, emoji: '🏃‍♂️', category: 'Cardio' },
  { name: 'Cycling', kcalPerMin: 8, emoji: '🚴‍♂️', category: 'Cardio' },
  { name: 'Swimming', kcalPerMin: 9, emoji: '🏊‍♂️', category: 'Cardio' },
  { name: 'Weight Training', kcalPerMin: 6, emoji: '🏋️‍♂️', category: 'Strength' },
  { name: 'Walking', kcalPerMin: 4.5, emoji: '🚶‍♂️', category: 'Cardio' },
  { name: 'Yoga', kcalPerMin: 3.5, emoji: '🧘‍♀️', category: 'Flexibility' },
  { name: 'HIIT', kcalPerMin: 12.5, emoji: '⚡', category: 'Cardio' },
  { name: 'Dance Fitness', kcalPerMin: 7.5, emoji: '💃', category: 'Cardio' },
  { name: 'Pilates', kcalPerMin: 4, emoji: '🤸‍♀️', category: 'Flexibility' },
];

const INTENSITY_MULTIPLIERS = {
  'Low': 0.8,
  'Moderate': 1.0,
  'High': 1.25,
};

export default function Fitness({ user }) {
  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [activityName, setActivityName] = useState('');
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState('Moderate');
  const [customCalories, setCustomCalories] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Stats
  const [caloriesBurnedToday, setCaloriesBurnedToday] = useState(0);
  const [caloriesConsumedToday, setCaloriesConsumedToday] = useState(0);

  const fetchWorkoutsAndMeals = useCallback(async () => {
    if (!user) return;
    try {
      const [workoutRes, mealRes] = await Promise.all([
        api.getWorkouts(user.id),
        api.getMeals(user.id)
      ]);
      if (workoutRes.success) setWorkouts(workoutRes.data);
      if (mealRes.success) setMeals(mealRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWorkoutsAndMeals();
  }, [fetchWorkoutsAndMeals]);

  // Recalculate daily totals
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    const todayWorkouts = workouts.filter(w => w.created_at?.startsWith(todayStr));
    const todayBurned = todayWorkouts.reduce((acc, curr) => acc + (curr.calories_burned || 0), 0);
    setCaloriesBurnedToday(todayBurned);

    const todayMeals = meals.filter(m => m.created_at?.startsWith(todayStr));
    const todayConsumed = todayMeals.reduce((acc, curr) => acc + (curr.calories || 0), 0);
    setCaloriesConsumedToday(todayConsumed);
  }, [workouts, meals]);

  // Calculate dynamic calories estimate
  const estimatedCalories = (() => {
    if (isCustomMode) return parseInt(customCalories) || 0;
    const found = COMMON_EXERCISES.find(e => e.name.toLowerCase() === activityName.toLowerCase());
    if (!found) return 0;
    const base = found.kcalPerMin * duration;
    const mult = INTENSITY_MULTIPLIERS[intensity] || 1.0;
    return Math.round(base * mult);
  })();

  const selectPreset = (exercise) => {
    setActivityName(exercise.name);
    setIsCustomMode(false);
  };

  const handleAddWorkout = async (e) => {
    e.preventDefault();
    if (!user) return;

    const name = sanitizeText(activityName, 100);
    if (!name) {
      toast.error('Please select or input a valid activity name.');
      return;
    }

    const minutes = parseInt(duration);
    if (isNaN(minutes) || minutes <= 0 || minutes > 1440) {
      toast.error('Please specify a valid duration (1-1440 mins).');
      return;
    }

    let finalCalories = estimatedCalories;
    if (isCustomMode) {
      const parsed = parseInt(customCalories);
      if (isNaN(parsed) || parsed < 0 || parsed > 20000) {
        toast.error('Please specify a valid calorie burn count.');
        return;
      }
      finalCalories = parsed;
    }

    try {
      const res = await api.addWorkout({
        user_id: user.id,
        activity_name: name,
        duration_minutes: minutes,
        calories_burned: finalCalories,
        intensity: isCustomMode ? 'Custom' : intensity,
      });

      if (res.success) {
        setWorkouts(prev => [
          {
            id: res.data.id,
            user_id: user.id,
            activity_name: name,
            duration_minutes: minutes,
            calories_burned: finalCalories,
            intensity: isCustomMode ? 'Custom' : intensity,
            created_at: res.data.created_at || new Date().toISOString()
          },
          ...prev
        ]);
        toast.success(`Logged: ${name} (${finalCalories} kcal)`);
        // reset form
        setActivityName('');
        setCustomCalories('');
        setIsCustomMode(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to log workout.');
    }
  };

  const handleDeleteWorkout = async (id, name) => {
    try {
      const res = await api.deleteWorkout(id);
      if (res.success) {
        setWorkouts(prev => prev.filter(w => w.id !== id));
        toast.info(`Workout "${name}" deleted.`);
      }
    } catch (err) {
      toast.error('Failed to delete workout.');
    }
  };

  const netCalories = caloriesConsumedToday - caloriesBurnedToday;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-white rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-96 bg-white rounded-3xl animate-pulse md:col-span-2" />
          <div className="h-96 bg-white rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* ── HEADER & NET CALORIES HERO ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#12266e] via-[#3456c8] to-[#1e3bb3] text-white rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10">
          <Dumbbell size={300} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Fitness Dashboard</h1>
            <p className="text-blue-100 text-sm mt-1">Track physical activities, monitor active calorie burn, and view net daily calories.</p>
          </div>
          <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Consumed Today</span>
              <p className="text-xl md:text-2xl font-black mt-0.5">{caloriesConsumedToday} <span className="text-xs font-normal">kcal</span></p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">Burned Today</span>
              <p className="text-xl md:text-2xl font-black mt-0.5 text-emerald-300">-{caloriesBurnedToday} <span className="text-xs font-normal">kcal</span></p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-300">Net Calories</span>
              <p className="text-xl md:text-2xl font-black mt-0.5 text-yellow-300">{netCalories} <span className="text-xs font-normal">kcal</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── LEFT: PRESETS & FORM ── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Presets Card */}
          <div className="bg-white dark:bg-[#0e1738] rounded-3xl p-6 border border-[#edf0f7] dark:border-[#1e2a5f] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-bold text-[#0E1929] dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                Quick-Select Preset Exercise
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {COMMON_EXERCISES.map((ex) => {
                const isActive = activityName.toLowerCase() === ex.name.toLowerCase() && !isCustomMode;
                return (
                  <button
                    key={ex.name}
                    onClick={() => selectPreset(ex)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                      isActive
                        ? 'border-[#3456c8] bg-[#e8effe] dark:bg-[#1d2d5c] text-[#12266e] dark:text-white'
                        : 'border-[#edf0f7] dark:border-[#1a2656] hover:bg-[#f8f9ff] dark:hover:bg-[#121c44] text-[#5a6478] dark:text-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{ex.emoji}</span>
                    <div>
                      <p className="text-xs font-bold truncate">{ex.name}</p>
                      <p className="text-[9px] text-[#9aa0b0] font-medium">{ex.kcalPerMin} kcal/min</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workout Log Form */}
          <div className="bg-white dark:bg-[#0e1738] rounded-3xl p-6 border border-[#edf0f7] dark:border-[#1e2a5f] shadow-sm">
            <h2 className="text-md font-bold text-[#0E1929] dark:text-white flex items-center gap-2 mb-4">
              <Dumbbell className="w-5 h-5 text-[#3456c8]" />
              Log an Activity
            </h2>

            <form onSubmit={handleAddWorkout} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Activity Name */}
                <div>
                  <label className="block text-xs font-bold text-[#5a6478] uppercase tracking-wider mb-2">Activity / Exercise Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swimming, Brisk Walking, HIIT"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    className="w-full text-sm border border-[#edf0f7] dark:border-[#1e2a5f] rounded-2xl px-4 py-3 bg-[#f8f9ff] dark:bg-[#0b102b] dark:text-white focus:outline-none focus:border-[#3456c8] transition-colors"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-bold text-[#5a6478] uppercase tracking-wider mb-2">Duration (minutes)</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      max="1440"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                      className="w-full text-sm border border-[#edf0f7] dark:border-[#1e2a5f] rounded-2xl px-4 py-3 bg-[#f8f9ff] dark:bg-[#0b102b] dark:text-white focus:outline-none focus:border-[#3456c8] transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#9aa0b0] font-bold">mins</span>
                  </div>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="flex gap-4 border-b border-[#edf0f7] dark:border-[#1e2a5f] pb-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className={`text-xs font-bold pb-1 border-b-2 transition-all ${
                    !isCustomMode
                      ? 'border-[#3456c8] text-[#3456c8]'
                      : 'border-transparent text-[#9aa0b0] hover:text-[#5a6478]'
                  }`}
                >
                  Estimate Calories (MET-based)
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(true)}
                  className={`text-xs font-bold pb-1 border-b-2 transition-all ${
                    isCustomMode
                      ? 'border-[#3456c8] text-[#3456c8]'
                      : 'border-transparent text-[#9aa0b0] hover:text-[#5a6478]'
                  }`}
                >
                  Enter Calories Manually
                </button>
              </div>

              {/* Estimate or Custom Form Fields */}
              <AnimatePresence mode="wait">
                {!isCustomMode ? (
                  <motion.div
                    key="estimate"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {/* Intensity */}
                    <div>
                      <label className="block text-xs font-bold text-[#5a6478] uppercase tracking-wider mb-2">Intensity</label>
                      <select
                        value={intensity}
                        onChange={(e) => setIntensity(e.target.value)}
                        className="w-full text-sm border border-[#edf0f7] dark:border-[#1e2a5f] rounded-2xl px-4 py-3 bg-[#f8f9ff] dark:bg-[#0b102b] dark:text-white focus:outline-none focus:border-[#3456c8] transition-colors"
                      >
                        <option value="Low">Low (0.8x burn rate)</option>
                        <option value="Moderate">Moderate (1.0x burn rate)</option>
                        <option value="High">High (1.25x burn rate)</option>
                      </select>
                    </div>

                    <div className="bg-[#e8effe] dark:bg-[#121c44] rounded-2xl p-4 flex flex-col justify-center border border-[#d2e0ff] dark:border-[#1d2d5c]">
                      <span className="text-[10px] text-[#3456c8] dark:text-blue-300 font-bold uppercase tracking-wider">Estimated Calorie Burn</span>
                      <p className="text-2xl font-black text-[#12266e] dark:text-white mt-1">
                        ~{estimatedCalories} <span className="text-xs font-normal">kcal</span>
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="custom"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="block text-xs font-bold text-[#5a6478] uppercase tracking-wider mb-2">Calories Burned (kcal)</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 350"
                        value={customCalories}
                        onChange={(e) => setCustomCalories(e.target.value)}
                        className="w-full text-sm border border-[#edf0f7] dark:border-[#1e2a5f] rounded-2xl px-4 py-3 bg-[#f8f9ff] dark:bg-[#0b102b] dark:text-white focus:outline-none focus:border-[#3456c8] transition-colors"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                className="w-full bg-[#12266e] text-white font-bold text-sm py-3 px-6 rounded-2xl hover:bg-[#0e1f5c] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#12266e]/20"
              >
                <Plus className="w-4 h-4" /> Add Activity to Log
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT: WORKOUTS LOG LIST ── */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0e1738] rounded-3xl p-6 border border-[#edf0f7] dark:border-[#1e2a5f] shadow-sm flex flex-col min-h-[480px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-bold text-[#0E1929] dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Workouts Log
              </h2>
              <span className="text-[10px] font-bold text-[#3456c8] bg-[#e8effe] px-2 py-0.5 rounded-full">
                {workouts.length} total
              </span>
            </div>

            {/* Workouts Feed */}
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px] pr-1">
              <AnimatePresence>
                {workouts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 text-[#9aa0b0] dark:text-gray-500">
                    <Dumbbell className="w-12 h-12 stroke-[1.5] mb-2 text-[#cbd0e0]" />
                    <p className="text-sm font-semibold">No activities logged yet.</p>
                    <p className="text-xs">Your exercise logs will show up here.</p>
                  </div>
                ) : (
                  workouts.map((w) => {
                    const timeStr = w.created_at
                      ? new Date(w.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Recently';
                    
                    // Simple logic to select exercise emoji
                    const preset = COMMON_EXERCISES.find(e => e.name.toLowerCase() === w.activity_name.toLowerCase());
                    const emoji = preset?.emoji || '💪';

                    return (
                      <motion.div
                        key={w.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#f4f6fa] dark:hover:bg-[#1d2d5c]/60 border border-transparent hover:border-[#e8effe] dark:hover:border-[#2e437c]/60 transition-all group gap-2"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-[#f4f6fa] dark:bg-[#1d2d5c] flex items-center justify-center text-lg shadow-inner flex-shrink-0">
                            {emoji}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#0E1929] dark:text-white truncate">{w.activity_name}</p>
                            <p className="text-[10px] text-[#9aa0b0] font-medium flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {w.duration_minutes}m</span>
                              <span className="flex items-center gap-0.5"><Zap className="w-3 h-3 text-emerald-500" /> {w.intensity}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            -{w.calories_burned} kcal
                          </span>
                          <button
                            onClick={() => handleDeleteWorkout(w.id, w.activity_name)}
                            className="p-2 rounded-xl text-[#9aa0b0] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Delete Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
