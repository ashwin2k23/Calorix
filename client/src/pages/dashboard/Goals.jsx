import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function Goals() {
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(175);
  const [age, setAge] = useState(25);
  const [goal, setGoal] = useState('maintain');

  const calculateTarget = () => {
    // Basic BMR calculation (Mifflin-St Jeor)
    const bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5; 
    let tdee = bmr * 1.55; // moderately active
    
    if (goal === 'lose') return Math.round(tdee - 500);
    if (goal === 'gain') return Math.round(tdee + 300);
    return Math.round(tdee);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Your Goals</h1>
        <p className="text-muted-foreground">Set your profile and let us calculate your daily targets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-white/5">
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
                className="w-full bg-input/50 border border-border rounded-xl px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Height (cm)</label>
              <input 
                type="number" 
                value={height} 
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full bg-input/50 border border-border rounded-xl px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Age</label>
              <input 
                type="number" 
                value={age} 
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-input/50 border border-border rounded-xl px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Goal</label>
              <select 
                value={goal} 
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-input/50 border border-border rounded-xl px-4 py-2 outline-none focus:border-primary text-foreground"
              >
                <option className="bg-background text-foreground" value="lose">Lose Weight</option>
                <option className="bg-background text-foreground" value="maintain">Maintain Weight</option>
                <option className="bg-background text-foreground" value="gain">Gain Muscle</option>
              </select>
            </div>
            <Button className="w-full mt-4 rounded-xl">Save Profile</Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <CardTitle>Daily Target</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center py-10">
            <div className="w-40 h-40 rounded-full border-4 border-primary flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,232,122,0.2)]">
              <div>
                <span className="text-4xl font-extrabold text-primary">{calculateTarget()}</span>
                <span className="block text-sm text-muted-foreground mt-1">kcal / day</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              This is your estimated daily calorie target to achieve your goal of {goal === 'lose' ? 'losing weight' : goal === 'gain' ? 'gaining muscle' : 'maintaining weight'}.
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
