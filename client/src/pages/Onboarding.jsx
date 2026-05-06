import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';

const steps = [
  { id: 'basic', title: 'Basic Information' },
  { id: 'metrics', title: 'Body Metrics' },
  { id: 'goal', title: 'Fitness Goal' },
  { id: 'activity', title: 'Activity Level' },
  { id: 'diet', title: 'Dietary Preference' }
];

export default function Onboarding() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    height: '',
    weight: '',
    goal: '',
    activity: '',
    diet: ''
  });

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentStep === 0 && (!formData.age || !formData.gender)) {
      toast.error('Please fill in your age and gender');
      return;
    }
    if (currentStep === 1 && (!formData.height || !formData.weight)) {
      toast.error('Please fill in your height and weight');
      return;
    }
    if (currentStep === 2 && !formData.goal) {
      toast.error('Please select a fitness goal');
      return;
    }
    if (currentStep === 3 && !formData.activity) {
      toast.error('Please select your activity level');
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    if (!formData.diet) {
      toast.error('Please select a dietary preference');
      return;
    }

    try {
      const weight = parseFloat(formData.weight);
      const height = parseFloat(formData.height);
      const age = parseInt(formData.age);
      
      let bmr = (10 * weight) + (6.25 * height) - (5 * age);
      bmr += formData.gender === 'Male' ? 5 : -161;

      const activityMultipliers = {
        'Sedentary': 1.2,
        'Lightly Active': 1.375,
        'Moderately Active': 1.55,
        'Very Active': 1.725
      };

      const tdee = bmr * activityMultipliers[formData.activity];
      
      let calorieTarget = tdee;
      if (formData.goal === 'Lose Weight') calorieTarget -= 500;
      if (formData.goal === 'Gain Muscle') calorieTarget += 300;

      const profileData = {
        clerk_user_id: user.id,
        name: user.fullName || 'User',
        email: user.primaryEmailAddress?.emailAddress || '',
        age: age,
        gender: formData.gender,
        height: height,
        weight: weight,
        activity_level: formData.activity,
        goal_type: formData.goal,
        diet_preference: formData.diet,
        calorie_target: Math.round(calorieTarget),
        protein_target: Math.round(weight * 2.2), 
        carbs_target: Math.round((calorieTarget * 0.4) / 4), 
        fats_target: Math.round((calorieTarget * 0.3) / 9), 
        hydration_target: 3000,
        onboarding_completed: true
      };

      // Save to SQLite Backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) throw new Error('Failed to save profile on server');

      localStorage.setItem('calorix_profile', JSON.stringify(profileData));
      
      toast.success('Profile created successfully! Generating your dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error(error);
      toast.error('Failed to save profile');
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#00c2ff]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold mb-2">Welcome, {user?.firstName || 'User'}! 👋</h1>
          <p className="text-muted-foreground">Let's personalize your Calorix experience.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 rounded-full" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary to-[#00c2ff] -translate-y-1/2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((step, idx) => (
            <div 
              key={step.id} 
              className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-colors duration-300 ${
                idx <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-card border border-white/10 text-muted-foreground'
              }`}
            >
              {idx < currentStep ? '✓' : idx + 1}
            </div>
          ))}
        </div>

        <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold mb-6">{steps[currentStep].title}</h2>

                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Age</label>
                      <input 
                        type="number" 
                        value={formData.age}
                        onChange={e => updateForm('age', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-all"
                        placeholder="e.g. 24"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Gender</label>
                      <div className="grid grid-cols-2 gap-4">
                        {['Male', 'Female'].map(g => (
                          <button
                            key={g}
                            onClick={() => updateForm('gender', g)}
                            className={`p-3 rounded-xl border transition-all ${
                              formData.gender === g ? 'border-primary bg-primary/20 text-primary' : 'border-white/10 bg-black/20 hover:border-white/30'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Height (cm)</label>
                      <input 
                        type="number" 
                        value={formData.height}
                        onChange={e => updateForm('height', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-all"
                        placeholder="e.g. 175"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Weight (kg)</label>
                      <input 
                        type="number" 
                        value={formData.weight}
                        onChange={e => updateForm('weight', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-all"
                        placeholder="e.g. 70"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="grid grid-cols-1 gap-4">
                    {['Lose Weight', 'Maintain Weight', 'Gain Muscle'].map(g => (
                      <button
                        key={g}
                        onClick={() => updateForm('goal', g)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          formData.goal === g ? 'border-primary bg-primary/20 text-primary' : 'border-white/10 bg-black/20 hover:border-white/30'
                        }`}
                      >
                        <h3 className="font-bold">{g}</h3>
                      </button>
                    ))}
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="grid grid-cols-1 gap-3">
                    {['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'].map(a => (
                      <button
                        key={a}
                        onClick={() => updateForm('activity', a)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          formData.activity === a ? 'border-[#00c2ff] bg-[#00c2ff]/20 text-[#00c2ff]' : 'border-white/10 bg-black/20 hover:border-white/30'
                        }`}
                      >
                        <h3 className="font-bold">{a}</h3>
                      </button>
                    ))}
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="grid grid-cols-1 gap-4">
                    {['Vegetarian', 'Non-Vegetarian', 'Vegan'].map(d => (
                      <button
                        key={d}
                        onClick={() => updateForm('diet', d)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          formData.diet === d ? 'border-[#9b6dff] bg-[#9b6dff]/20 text-[#9b6dff]' : 'border-white/10 bg-black/20 hover:border-white/30'
                        }`}
                      >
                        <h3 className="font-bold">{d}</h3>
                      </button>
                    ))}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex justify-between">
              {currentStep > 0 ? (
                <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} className="rounded-xl border-white/10">
                  Back
                </Button>
              ) : <div></div>}
              <Button onClick={handleNext} className="rounded-xl bg-gradient-to-r from-primary to-[#00c2ff] hover:opacity-90 transition-opacity">
                {currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
