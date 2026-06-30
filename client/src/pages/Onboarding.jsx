import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { CheckCircle, ChevronRight, ChevronLeft, Flame, Droplets, Zap, Target } from 'lucide-react';
import api from '@/lib/api';

const STEPS = [
  { id: 'personal', title: 'Personal Details',      subtitle: 'Tell us a bit about yourself'          },
  { id: 'metrics',  title: 'Body Metrics',           subtitle: 'Your current measurements'             },
  { id: 'activity', title: 'Activity Level',         subtitle: 'How active are you daily?'             },
  { id: 'goal',     title: 'Fitness Goal',           subtitle: 'What do you want to achieve?'          },
  { id: 'diet',     title: 'Dietary Preference',     subtitle: 'Your food lifestyle'                   },
  { id: 'summary',  title: 'Your Personalized Plan', subtitle: 'Review your targets before starting'   },
];

const ACTIVITY_OPTIONS = [
  { value: 'Sedentary',         icon: '🛋️', desc: 'Little or no exercise',          multiplier: 1.2   },
  { value: 'Lightly Active',    icon: '🚶', desc: 'Light exercise 1–3 days/week',    multiplier: 1.375 },
  { value: 'Moderately Active', icon: '🏃', desc: 'Moderate exercise 3–5 days/week', multiplier: 1.55  },
  { value: 'Very Active',       icon: '💪', desc: 'Hard exercise 6–7 days/week',     multiplier: 1.725 },
];
const GOAL_OPTIONS = [
  { value: 'Lose Weight',     icon: '🔥', desc: 'Burn fat and get lean',      modifier: -500 },
  { value: 'Maintain Weight', icon: '⚖️', desc: 'Stay healthy and balanced',  modifier: 0    },
  { value: 'Gain Muscle',     icon: '💪', desc: 'Build strength and muscle',   modifier: 300  },
];
const DIET_OPTIONS = [
  { value: 'Vegetarian',     icon: '🥗', desc: 'No meat, includes dairy & eggs' },
  { value: 'Non-Vegetarian', icon: '🍗', desc: 'Includes all food groups'        },
  { value: 'Vegan',          icon: '🌱', desc: 'Plant-based only'                },
];

function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: '#3b82f6' };
  if (bmi < 25)   return { label: 'Normal',       color: '#16a34a' };
  if (bmi < 30)   return { label: 'Overweight',   color: '#d97706' };
  return              { label: 'Obese',         color: '#dc2626' };
}

export default function Onboarding() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [step, setStep]   = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone]   = useState(false);
  const [form, setForm]   = useState({ age: '', gender: '', height: '', weight: '', activity: '', goal: '', diet: '' });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const metrics = useMemo(() => {
    const w = parseFloat(form.weight), h = parseFloat(form.height), a = parseInt(form.age);
    if (!w || !h || !a) return null;
    const bmi = w / ((h / 100) ** 2);
    let bmr = 10 * w + 6.25 * h - 5 * a + (form.gender === 'Male' ? 5 : -161);
    const mult = ACTIVITY_OPTIONS.find(x => x.value === form.activity)?.multiplier || 1.55;
    const tdee = bmr * mult;
    const mod  = GOAL_OPTIONS.find(x => x.value === form.goal)?.modifier || 0;
    const cal  = Math.round(tdee + mod);
    return { bmi: bmi.toFixed(1), bmiCat: getBMICategory(bmi), calories: cal, protein: Math.round(w * 2.2), carbs: Math.round((cal * 0.4) / 4), fats: Math.round((cal * 0.3) / 9), hydration: 3000 };
  }, [form]);

  const validate = () => {
    const rules = [
      { s: 0, check: form.age && form.gender,    msg: 'Please enter your age and select gender' },
      { s: 1, check: form.height && form.weight,  msg: 'Please enter height and weight'          },
      { s: 2, check: form.activity,               msg: 'Please select your activity level'       },
      { s: 3, check: form.goal,                   msg: 'Please select a fitness goal'            },
      { s: 4, check: form.diet,                   msg: 'Please select a dietary preference'      },
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
        clerk_user_id: user.id, name: user.fullName || 'User',
        email: user.primaryEmailAddress?.emailAddress || '',
        age: parseInt(form.age), gender: form.gender, height: parseFloat(form.height), weight: parseFloat(form.weight),
        activity_level: form.activity, goal_type: form.goal, diet_preference: form.diet,
        calorie_target: metrics.calories, protein_target: metrics.protein, carbs_target: metrics.carbs,
        fats_target: metrics.fats, hydration_target: metrics.hydration, onboarding_completed: true,
      };
      await api.saveUser(profileData);
      localStorage.setItem('calorix_profile', JSON.stringify(profileData));
      setDone(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch { toast.error('Failed to save profile.'); }
    finally { setSaving(false); }
  };

  if (!isLoaded) return (
    <div className="min-h-screen bg-[#f4f6fa] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#12266e] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-[#f4f6fa] flex items-center justify-center" style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
        <div className="w-20 h-20 rounded-full bg-[#e8effe] flex items-center justify-center mx-auto mb-5 shadow-lg">
          <CheckCircle className="w-10 h-10 text-[#12266e]" />
        </div>
        <h1 className="text-3xl font-bold text-[#0E1929] mb-2">You're all set! 🎉</h1>
        <p className="text-[#5a6478]">Launching your dashboard...</p>
      </motion.div>
    </div>
  );

  const progress = step / (STEPS.length - 1);

  const OptionBtn = ({ selected, onClick, icon, title, desc }) => (
    <button onClick={onClick}
      className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all ${
        selected ? 'border-[#3456c8] bg-[#e8effe]' : 'border-[#edf0f7] bg-white hover:border-[#c8d8f8] hover:bg-[#f8faff]'
      }`}>
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div className="flex-1">
        <p className={`font-semibold text-sm ${selected ? 'text-[#12266e]' : 'text-[#0E1929]'}`}>{title}</p>
        <p className="text-xs text-[#9aa0b0] mt-0.5">{desc}</p>
      </div>
      {selected && <CheckCircle className="w-4 h-4 text-[#3456c8] flex-shrink-0" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f4f6fa] flex flex-col items-center justify-center p-4"
         style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <div className="w-full max-w-lg">

        {/* Brand */}
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-9 h-9 rounded-xl bg-[#12266e] flex items-center justify-center shadow-md">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-[#12266e]">Calorix</span>
        </div>

        {/* Step indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="xh-label">Step {step + 1} of {STEPS.length}</p>
            <p className="xh-label">{Math.round(progress * 100)}%</p>
          </div>
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                   style={{ background: i <= step ? '#3456c8' : '#e0e5f0' }} />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="xh-card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#0E1929]">{STEPS[step].title}</h2>
            <p className="text-sm text-[#5a6478] mt-1">{STEPS[step].subtitle}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>

              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <label className="xh-label block mb-2">Age</label>
                    <input type="number" value={form.age} onChange={e => set('age', e.target.value)}
                      className="xh-input" placeholder="e.g. 24" min="10" max="100" />
                  </div>
                  <div>
                    <label className="xh-label block mb-2">Gender</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Male', 'Female'].map(g => (
                        <button key={g} onClick={() => set('gender', g)}
                          className={`p-4 rounded-2xl border-2 font-semibold text-sm transition-all ${
                            form.gender === g ? 'border-[#3456c8] bg-[#e8effe] text-[#12266e]' : 'border-[#edf0f7] bg-white text-[#5a6478] hover:border-[#c8d8f8]'
                          }`}>
                          {g === 'Male' ? '♂ Male' : '♀ Female'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  {[{ label: 'Height (cm)', key: 'height', ph: 'e.g. 175' }, { label: 'Weight (kg)', key: 'weight', ph: 'e.g. 70' }].map(({ label, key, ph }) => (
                    <div key={key}>
                      <label className="xh-label block mb-2">{label}</label>
                      <input type="number" value={form[key]} onChange={e => set(key, e.target.value)}
                        className="xh-input" placeholder={ph} />
                    </div>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-2">
                  {ACTIVITY_OPTIONS.map(o => <OptionBtn key={o.value} selected={form.activity === o.value} onClick={() => set('activity', o.value)} icon={o.icon} title={o.value} desc={o.desc} />)}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-2">
                  {GOAL_OPTIONS.map(o => <OptionBtn key={o.value} selected={form.goal === o.value} onClick={() => set('goal', o.value)} icon={o.icon} title={o.value} desc={o.desc} />)}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-2">
                  {DIET_OPTIONS.map(o => <OptionBtn key={o.value} selected={form.diet === o.value} onClick={() => set('diet', o.value)} icon={o.icon} title={o.value} desc={o.desc} />)}
                </div>
              )}

              {step === 5 && metrics && (
                <div className="space-y-4">
                  <div className="xh-card-blue p-5 flex items-center justify-between rounded-2xl">
                    <div>
                      <p className="xh-label mb-1">Your BMI</p>
                      <p className="text-4xl font-bold text-[#0E1929]">{metrics.bmi}</p>
                      <p className="text-sm font-semibold mt-1" style={{ color: metrics.bmiCat.color }}>{metrics.bmiCat.label}</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                      <Target className="w-7 h-7 text-[#12266e]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Daily Calories', val: `${metrics.calories}`, unit: 'kcal', icon: <Flame className="w-4 h-4 text-[#12266e]" /> },
                      { label: 'Protein',        val: `${metrics.protein}`,  unit: 'g',    icon: <Zap className="w-4 h-4 text-[#7c3aed]" /> },
                      { label: 'Carbs',          val: `${metrics.carbs}`,    unit: 'g',    icon: <Target className="w-4 h-4 text-[#ea580c]" /> },
                      { label: 'Hydration',      val: `${metrics.hydration / 1000}`, unit: 'L', icon: <Droplets className="w-4 h-4 text-[#3456c8]" /> },
                    ].map(item => (
                      <div key={item.label} className="xh-stat-chip text-center items-center">
                        <div className="flex justify-center mb-1">{item.icon}</div>
                        <p className="text-xl font-bold text-[#0E1929]">{item.val}<span className="text-sm text-[#9aa0b0] font-normal ml-1">{item.unit}</span></p>
                        <p className="xh-label">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          <div className="mt-8 flex justify-between items-center border-t border-[#f0f2f8] pt-6">
            {step > 0
              ? <button onClick={back} className="xh-btn-outline"><ChevronLeft className="w-4 h-4" /> Back</button>
              : <div />
            }
            {step < STEPS.length - 1
              ? <button onClick={next} className="xh-btn">Continue <ChevronRight className="w-4 h-4" /></button>
              : <button onClick={handleComplete} disabled={saving} className="xh-btn px-8">
                  {saving
                    ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</>
                    : <>Launch Dashboard <ChevronRight className="w-4 h-4" /></>
                  }
                </button>
            }
          </div>
        </div>

        <p className="text-center text-sm text-[#9aa0b0] mt-5">Welcome, {user?.firstName || 'User'} — 6 quick steps to start</p>
      </div>
    </div>
  );
}
