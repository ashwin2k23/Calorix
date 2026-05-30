import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function Goals({ profile, user, onProfileUpdate }) {
  const [weight, setWeight] = useState(profile?.weight || 75);
  const [height, setHeight] = useState(profile?.height || 175);
  const [age, setAge] = useState(profile?.age || 25);
  const [goal, setGoal] = useState(profile?.goal_type || 'Maintain Weight');

  useEffect(() => {
    if (profile) {
      setWeight(profile.weight);
      setHeight(profile.height);
      setAge(profile.age);
      setGoal(profile.goal_type);
    }
  }, [profile]);

  const calculateTarget = () => {
    const bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5; 
    let tdee = bmr * 1.55; 
    
    if (goal === 'Lose Weight') return Math.round(tdee - 500);
    if (goal === 'Gain Muscle') return Math.round(tdee + 300);
    return Math.round(tdee);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const calorieTarget = calculateTarget();
      const updatedProfile = {
        ...profile,
        clerk_user_id: user.id,
        name: user.fullName || 'User',
        weight, height, age,
        goal_type: goal,
        calorie_target: calorieTarget,
        protein_target: Math.round(weight * 2.2),
        carbs_target: Math.round((calorieTarget * 0.4) / 4),
        fats_target: Math.round((calorieTarget * 0.3) / 9),
        onboarding_completed: true
      };
      await api.saveUser(updatedProfile);
      localStorage.setItem('calorix_profile', JSON.stringify(updatedProfile));
      toast.success('Goals updated successfully!');
      if (onProfileUpdate) onProfileUpdate();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update goals.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="space-y-8 max-w-[1400px] mx-auto select-none"
    >
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Your Goals</h1>
        <p className="text-slate-400 text-sm font-semibold">Set your profile and let us calculate your daily targets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Card */}
        <div className="rounded-[2rem] bg-slate-950/40 border border-white/[0.04] p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <h2 className="text-xl font-extrabold text-white tracking-tight">Body Profile</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Weight (kg)</label>
              <input 
                type="number" 
                value={weight} 
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full bg-black/30 border border-white/[0.05] rounded-2xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-white transition-all font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Height (cm)</label>
              <input 
                type="number" 
                value={height} 
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full bg-black/30 border border-white/[0.05] rounded-2xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-white transition-all font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Age</label>
              <input 
                type="number" 
                value={age} 
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-black/30 border border-white/[0.05] rounded-2xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-white transition-all font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Goal</label>
              <select 
                value={goal} 
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-black/30 border border-white/[0.05] rounded-2xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-white transition-all font-semibold"
              >
                <option className="bg-[#090b14] text-white" value="Lose Weight">Lose Weight</option>
                <option className="bg-[#090b14] text-white" value="Maintain Weight">Maintain Weight</option>
                <option className="bg-[#090b14] text-white" value="Gain Muscle">Gain Muscle</option>
              </select>
            </div>
            <Button onClick={handleSaveProfile} className="w-full mt-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white py-3 font-bold transition-all shadow-[0_4px_16px_rgba(99,102,241,0.25)]">Save Profile</Button>
          </div>
        </div>

        {/* Right Card */}
        <div className="rounded-[2rem] bg-slate-950/40 border border-white/[0.04] p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group flex flex-col justify-between min-h-[400px]">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-700" />
          
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight mb-2">Daily Target</h2>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              This is your calculated daily calorie target to achieve the goal of {goal.toLowerCase()}.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-48 h-48 rounded-full border border-white/[0.04] bg-white/[0.01] flex flex-col items-center justify-center shadow-inner relative">
              <div className="absolute inset-2 rounded-full border border-indigo-500/10 bg-indigo-500/[0.01]" />
              <span className="text-5xl font-black text-white tracking-tight">{calculateTarget()}</span>
              <span className="block text-[10px] uppercase font-bold text-indigo-400 tracking-wider mt-2">kcal / day</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.04] text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Calculated dynamically based on TDEE</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
