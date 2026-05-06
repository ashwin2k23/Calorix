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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Your Goals</h1>
        <p className="text-muted-foreground">Set your profile and let us calculate your daily targets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-white/5 bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Body Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Weight (kg)</label>
              <input 
                type="number" 
                value={weight} 
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Height (cm)</label>
              <input 
                type="number" 
                value={height} 
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Age</label>
              <input 
                type="number" 
                value={age} 
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Goal</label>
              <select 
                value={goal} 
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary text-foreground transition-all"
              >
                <option className="bg-background text-foreground" value="Lose Weight">Lose Weight</option>
                <option className="bg-background text-foreground" value="Maintain Weight">Maintain Weight</option>
                <option className="bg-background text-foreground" value="Gain Muscle">Gain Muscle</option>
              </select>
            </div>
            <Button onClick={handleSaveProfile} className="w-full mt-4 rounded-xl bg-gradient-to-r from-primary to-[#00c2ff] hover:opacity-90 transition-opacity">Save Profile</Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-white/5 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all pointer-events-none" />
          <CardHeader>
            <CardTitle>Daily Target</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center py-10">
            <div className="w-40 h-40 rounded-full border-4 border-primary/20 flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 border-4 border-primary rounded-full blur-[2px] opacity-50" />
              <div className="relative z-10">
                <span className="text-4xl font-extrabold text-primary">{calculateTarget()}</span>
                <span className="block text-sm text-muted-foreground mt-1">kcal / day</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              This is your estimated daily calorie target to achieve your goal of {goal.toLowerCase()}.
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
