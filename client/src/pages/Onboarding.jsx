import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { CheckCircle, ChevronRight, ChevronLeft, Flame, Droplets, Zap, Target } from 'lucide-react';
import api from '@/lib/api';

const STEPS = [
  { id: 'personal', title: 'Personal Details', subtitle: 'Tell us a bit about yourself' },
  { id: 'metrics',  title: 'Body Metrics',     subtitle: 'Your current measurements' },
  { id: 'activity', title: 'Activity Level',   subtitle: 'How active are you daily?' },
  { id: 'goal',     title: 'Fitness Goal',     subtitle: 'What do you want to achieve?' },
  { id: 'diet',     title: 'Dietary Preference', subtitle: 'Your food lifestyle' },
  { id: 'summary',  title: 'Your Personalized Plan', subtitle: 'Review your targets before starting' },
];

const ACTIVITY_OPTIONS = [
  { value: 'Sedentary',         icon: '🛋️', desc: 'Little or no exercise',              multiplier: 1.2   },
  { value: 'Lightly Active',    icon: '🚶', desc: 'Light exercise 1–3 days/week',        multiplier: 1.375 },
  { value: 'Moderately Active', icon: '🏃', desc: 'Moderate exercise 3–5 days/week',     multiplier: 1.55  },
  { value: 'Very Active',       icon: '💪', desc: 'Hard exercise 6–7 days/week',         multiplier: 1.725 },
];

const GOAL_OPTIONS = [
  { value: 'Lose Weight',     icon: '🔥', desc: 'Burn fat and get lean',        modifier: -500 },
  { value: 'Maintain Weight', icon: '⚖️', desc: 'Stay healthy and balanced',    modifier: 0    },
  { value: 'Gain Muscle',     icon: '💪', desc: 'Build strength and muscle',     modifier: 300  },
];

const DIET_OPTIONS = [
  { value: 'Vegetarian',     icon: '🥗', desc: 'No meat, includes dairy & eggs' },
  { value: 'Non-Vegetarian', icon: '🍗', desc: 'Includes all food groups'        },
  { value: 'Vegan',          icon: '🌱', desc: 'Plant-based only'                },
];

function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-400' };
  if (bmi < 25)   return { label: 'Normal',       color: 'text-primary'  };
  if (bmi < 30)   return { label: 'Overweight',   color: 'text-yellow-400' };
  return              { label: 'Obese',         color: 'text-red-400'  };
}

export default function Onboarding() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ age: '', gender: '', height: '', weight: '', activity: '', goal: '', diet: '' });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const metrics = useMemo(() => {
    const w = parseFloat(form.weight), h = parseFloat(form.height), a = parseInt(form.age);
    if (!w || !h || !a) return null;
    const bmi = w / ((h / 100) ** 2);
    let bmr = 10 * w + 6.25 * h - 5 * a + (form.gender === 'Male' ? 5 : -161);
    const mult = ACTIVITY_OPTIONS.find(x => x.value === form.activity)?.multiplier || 1.55;
    const tdee = bmr * mult;
    const mod = GOAL_OPTIONS.find(x => x.value === form.goal)?.modifier || 0;
    const cal = Math.round(tdee + mod);
    return {
      bmi: bmi.toFixed(1),
      bmiCat: getBMICategory(bmi),
      calories: cal,
      protein: Math.round(w * 2.2),
      carbs: Math.round((cal * 0.4) / 4),
      fats: Math.round((cal * 0.3) / 9),
      hydration: 3000,
    };
  }, [form]);

  const validate = () => {
    const rules = [
      { s: 0, check: form.age && form.gender,   msg: 'Please enter your age and select gender' },
      { s: 1, check: form.height && form.weight, msg: 'Please enter height and weight' },
      { s: 2, check: form.activity,              msg: 'Please select your activity level' },
      { s: 3, check: form.goal,                  msg: 'Please select a fitness goal' },
      { s: 4, check: form.diet,                  msg: 'Please select a dietary preference' },
    ];
    const rule = rules.find(r => r.s === step);
    if (rule && !rule.check) { toast.error(rule.msg); return false; }
    return true;
  };

  const next = () => { if (!validate()) return; setStep(p => Math.min(p + 1, STEPS.length - 1)); };
  const back = () => setStep(p => Math.max(p - 1, 0));

  const handleComplete = async () => {
    setSaving(true);
    try {
      const profileData = {
        clerk_user_id: user.id,
        name: user.fullName || 'User',
        email: user.primaryEmailAddress?.emailAddress || '',
        age: parseInt(form.age),
        gender: form.gender,
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
        activity_level: form.activity,
        goal_type: form.goal,
        diet_preference: form.diet,
        calorie_target: metrics.calories,
        protein_target: metrics.protein,
        carbs_target: metrics.carbs,
        fats_target: metrics.fats,
        hydration_target: metrics.hydration,
        onboarding_completed: true,
      };
      await api.saveUser(profileData);
      localStorage.setItem('calorix_profile', JSON.stringify(profileData));
      setDone(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_60px_rgba(0,232,122,0.3)]"
        >
          <CheckCircle className="w-12 h-12 text-primary" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="text-3xl font-extrabold mb-2">You're all set! 🎉</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="text-muted-foreground">Launching your dashboard...</motion.p>
      </motion.div>
    </div>
  );

  const progress = step / (STEPS.length - 1);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#00c2ff]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
            <Flame className="w-3 h-3" /> Calorix Setup
          </div>
          <h1 className="text-3xl font-extrabold mb-1">Welcome, {user?.firstName || 'User'}! 👋</h1>
          <p className="text-muted-foreground text-sm">Let's personalize your nutrition experience in 6 quick steps.</p>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5 justify-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`transition-all duration-300 rounded-full ${
              i === step ? 'w-8 h-2.5 bg-primary' :
              i < step   ? 'w-2.5 h-2.5 bg-primary/50' :
                           'w-2.5 h-2.5 bg-white/10'
            }`} />
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-white/5 rounded-full mb-6 overflow-hidden">
          <motion.div
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.4 }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-[#00c2ff]"
          />
        </div>

        <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
          <CardContent className="p-8">
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Step {step + 1} of {STEPS.length}</p>
              <h2 className="text-2xl font-bold">{STEPS[step].title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{STEPS[step].subtitle}</p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {/* Step 0: Personal */}
                {step === 0 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block font-medium">Age</label>
                      <input type="number" value={form.age} onChange={e => set('age', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                        placeholder="e.g. 24" min="10" max="100" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block font-medium">Gender</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['Male', 'Female'].map(g => (
                          <button key={g} onClick={() => set('gender', g)}
                            className={`p-4 rounded-xl border text-sm font-semibold transition-all ${
                              form.gender === g ? 'border-primary bg-primary/20 text-primary shadow-[0_0_15px_rgba(0,232,122,0.1)]' : 'border-white/10 bg-black/20 hover:border-white/30'
                            }`}>
                            {g === 'Male' ? '👨 Male' : '👩 Female'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Metrics */}
                {step === 1 && (
                  <div className="space-y-4">
                    {[
                      { label: 'Height (cm)', key: 'height', placeholder: 'e.g. 175' },
                      { label: 'Current Weight (kg)', key: 'weight', placeholder: 'e.g. 70' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="text-sm text-muted-foreground mb-1.5 block font-medium">{label}</label>
                        <input type="number" value={form[key]} onChange={e => set(key, e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                          placeholder={placeholder} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Step 2: Activity */}
                {step === 2 && (
                  <div className="space-y-2.5">
                    {ACTIVITY_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => set('activity', o.value)}
                        className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${
                          form.activity === o.value ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,232,122,0.1)]' : 'border-white/10 bg-black/20 hover:border-white/25'
                        }`}>
                        <span className="text-2xl">{o.icon}</span>
                        <div>
                          <p className={`font-semibold text-sm ${form.activity === o.value ? 'text-primary' : ''}`}>{o.value}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>
                        </div>
                        {form.activity === o.value && <CheckCircle className="w-4 h-4 text-primary ml-auto flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 3: Goal */}
                {step === 3 && (
                  <div className="space-y-2.5">
                    {GOAL_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => set('goal', o.value)}
                        className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${
                          form.goal === o.value ? 'border-[#00c2ff] bg-[#00c2ff]/10 shadow-[0_0_15px_rgba(0,194,255,0.1)]' : 'border-white/10 bg-black/20 hover:border-white/25'
                        }`}>
                        <span className="text-2xl">{o.icon}</span>
                        <div>
                          <p className={`font-semibold text-sm ${form.goal === o.value ? 'text-[#00c2ff]' : ''}`}>{o.value}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>
                        </div>
                        {form.goal === o.value && <CheckCircle className="w-4 h-4 text-[#00c2ff] ml-auto flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 4: Diet */}
                {step === 4 && (
                  <div className="space-y-2.5">
                    {DIET_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => set('diet', o.value)}
                        className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${
                          form.diet === o.value ? 'border-[#9b6dff] bg-[#9b6dff]/10 shadow-[0_0_15px_rgba(155,109,255,0.1)]' : 'border-white/10 bg-black/20 hover:border-white/25'
                        }`}>
                        <span className="text-2xl">{o.icon}</span>
                        <div>
                          <p className={`font-semibold text-sm ${form.diet === o.value ? 'text-[#9b6dff]' : ''}`}>{o.value}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>
                        </div>
                        {form.diet === o.value && <CheckCircle className="w-4 h-4 text-[#9b6dff] ml-auto flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 5: Summary */}
                {step === 5 && metrics && (
                  <div className="space-y-4">
                    {/* BMI */}
                    <div className="p-4 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Your BMI</p>
                        <p className="text-2xl font-extrabold">{metrics.bmi}</p>
                        <p className={`text-xs font-semibold mt-0.5 ${metrics.bmiCat.color}`}>{metrics.bmiCat.label}</p>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <Target className="w-7 h-7 text-primary" />
                      </div>
                    </div>
                    {/* Targets grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Daily Calories', value: `${metrics.calories} kcal`, icon: <Flame className="w-4 h-4 text-primary" />, color: 'text-primary' },
                        { label: 'Protein Target', value: `${metrics.protein}g`,       icon: <Zap className="w-4 h-4 text-[#9b6dff]" />,  color: 'text-[#9b6dff]' },
                        { label: 'Carbs Target',   value: `${metrics.carbs}g`,         icon: <Target className="w-4 h-4 text-orange-400" />, color: 'text-orange-400' },
                        { label: 'Hydration',      value: `${metrics.hydration / 1000}L`, icon: <Droplets className="w-4 h-4 text-blue-400" />, color: 'text-blue-400' },
                      ].map(item => (
                        <div key={item.label} className="p-3 rounded-xl bg-black/20 border border-white/5 text-center">
                          <div className="flex justify-center mb-1">{item.icon}</div>
                          <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">These targets are calculated using the Mifflin-St Jeor equation and adjusted for your goal.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="mt-8 flex justify-between items-center">
              {step > 0 ? (
                <Button variant="outline" onClick={back} className="rounded-xl border-white/10 gap-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
              ) : <div />}

              {step < STEPS.length - 1 ? (
                <Button onClick={next} className="rounded-xl bg-gradient-to-r from-primary to-[#00c2ff] hover:opacity-90 gap-1">
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-primary to-[#00c2ff] hover:opacity-90 px-8 gap-2">
                  {saving ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</> : '🚀 Start My Journey'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
