import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useClerk } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { User, Target, Activity, Droplets, Edit3, Save, X, LogOut, RotateCcw, Zap, Flame, Award, Star } from 'lucide-react';
import api from '@/lib/api';
import { useGamification } from '@/hooks/useGamification';

const ACTIVITY_OPTS  = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'];
const GOAL_OPTS      = ['Lose Weight', 'Maintain Weight', 'Gain Muscle'];
const DIET_OPTS      = ['Vegetarian', 'Non-Vegetarian', 'Vegan'];

function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-400'   };
  if (bmi < 25)   return { label: 'Normal',       color: 'text-indigo-400' };
  if (bmi < 30)   return { label: 'Overweight',   color: 'text-yellow-400' };
  return              { label: 'Obese',         color: 'text-red-400'    };
}

function StatBox({ label, value, color = 'text-white', icon }) {
  return (
    <div className="p-4 rounded-2xl bg-black/30 border border-white/[0.04] text-center transition-all hover:border-indigo-500/10">
      {icon && <div className="flex justify-center mb-2">{icon}</div>}
      <p className={`text-xl font-black tracking-tight ${color}`}>{value}</p>
      <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}

export default function Profile({ profile, user, onProfileUpdate }) {
  const { signOut } = useClerk();
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({
    weight:         profile?.weight         || '',
    height:         profile?.height         || '',
    age:            profile?.age            || '',
    activity_level: profile?.activity_level || 'Moderately Active',
    goal_type:      profile?.goal_type      || 'Maintain Weight',
    diet_preference:profile?.diet_preference|| 'Vegetarian',
  });

  // Gamification — uses empty meals for profile page (no full fetch here)
  const { badges, levelInfo, streakData } = useGamification({ meals: [], waterToday: 0, profile });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const bmi = useMemo(() => {
    const w = parseFloat(form.weight || profile?.weight);
    const h = parseFloat(form.height || profile?.height);
    if (!w || !h) return null;
    return (w / ((h / 100) ** 2)).toFixed(1);
  }, [form.weight, form.height, profile]);

  const bmiCat = bmi ? getBMICategory(parseFloat(bmi)) : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const w   = parseFloat(form.weight);
      const h   = parseFloat(form.height);
      const a   = parseInt(form.age);
      const mult = { Sedentary: 1.2, 'Lightly Active': 1.375, 'Moderately Active': 1.55, 'Very Active': 1.725 };
      let bmr = 10 * w + 6.25 * h - 5 * a + (profile?.gender === 'Male' ? 5 : -161);
      const tdee = bmr * (mult[form.activity_level] || 1.55);
      const mod  = { 'Lose Weight': -500, 'Maintain Weight': 0, 'Gain Muscle': 300 };
      const cal  = Math.round(tdee + (mod[form.goal_type] || 0));

      const updated = {
        ...profile,
        clerk_user_id:   user.id,
        name:            user.fullName || 'User',
        weight:          w,
        height:          h,
        age:             a,
        activity_level:  form.activity_level,
        goal_type:       form.goal_type,
        diet_preference: form.diet_preference,
        calorie_target:  cal,
        protein_target:  Math.round(w * 2.2),
        carbs_target:    Math.round((cal * 0.4) / 4),
        fats_target:     Math.round((cal * 0.3) / 9),
        onboarding_completed: true,
      };
      await api.saveUser(updated);
      localStorage.setItem('calorix_profile', JSON.stringify(updated));
      toast.success('Profile updated!');
      setEditing(false);
      if (onProfileUpdate) onProfileUpdate();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem('calorix_profile');
    window.location.href = '/#/onboarding';
  };

  const inputCls = 'w-full bg-black/30 border border-white/[0.05] rounded-2xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-white transition-all font-semibold';
  const selectCls = `${inputCls} text-white`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="space-y-6 max-w-4xl mx-auto pb-12 select-none"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Profile & Settings</h1>
          <p className="text-slate-400 text-sm font-semibold">Manage your body metrics, goals, and preferences.</p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl px-5 py-2.5 font-bold gap-2 self-start sm:self-auto transition-all">
            <Edit3 className="w-4 h-4 text-indigo-400" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2 self-start sm:self-auto">
            <Button onClick={() => setEditing(false)} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl px-4 py-2.5 font-bold gap-1 transition-all">
              <X className="w-4 h-4 text-rose-400" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 font-bold gap-2 transition-all shadow-[0_4px_16px_rgba(99,102,241,0.25)]">
              {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Avatar + Identity */}
      <div className="rounded-[2rem] bg-slate-950/40 border border-white/[0.04] p-8 backdrop-blur-xl shadow-2xl flex items-center gap-6">
        <div className="relative">
          <img src={user?.imageUrl} alt="Avatar" className="w-20 h-20 rounded-full border-2 border-indigo-500/20 object-cover" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 border-2 border-[#090b14] flex items-center justify-center">
            <User className="w-3 h-3 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">{user?.fullName || 'User'}</h2>
          <p className="text-sm text-slate-400 font-semibold">{user?.primaryEmailAddress?.emailAddress}</p>
          <div className="flex gap-2 mt-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">{profile?.goal_type}</span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">{profile?.diet_preference}</span>
          </div>
        </div>
      </div>

      {/* BMI Card */}
      {bmi && (
        <div className="rounded-[2rem] bg-slate-950/40 border border-white/[0.04] p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" />Body Mass Index</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white tracking-tight">{bmi}</span>
                <span className={`text-sm font-extrabold ${bmiCat?.color}`}>{bmiCat?.label}</span>
              </div>
            </div>
            {/* BMI scale visual */}
            <div className="hidden sm:flex items-center gap-1 text-xs">
              {[
                { l: 'Under', c: 'bg-blue-400', w: '20%', from: 0, to: 18.5 },
                { l: 'Normal', c: 'bg-indigo-400', w: '35%', from: 18.5, to: 25 },
                { l: 'Over', c: 'bg-yellow-400', w: '25%', from: 25, to: 30 },
                { l: 'Obese', c: 'bg-red-400', w: '20%', from: 30, to: 40 },
              ].map(seg => (
                <div key={seg.l} className="text-center">
                  <div className={`h-3 rounded-sm ${seg.c} ${parseFloat(bmi) >= seg.from && parseFloat(bmi) < seg.to ? 'opacity-100 ring-2 ring-white/40' : 'opacity-30'}`} style={{ width: '40px' }} />
                  <p className="text-[9px] font-bold text-slate-500 mt-1">{seg.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Body Metrics */}
        <div className="rounded-[2rem] bg-slate-950/40 border border-white/[0.04] p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" /> Body Metrics
          </h3>
          <div className="space-y-4">
            {editing ? (
              <>
                {[
                  { label: 'Age (years)',  key: 'age',    type: 'number', placeholder: 'e.g. 24' },
                  { label: 'Height (cm)', key: 'height', type: 'number', placeholder: 'e.g. 175' },
                  { label: 'Weight (kg)', key: 'weight', type: 'number', placeholder: 'e.g. 70' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{label}</label>
                    <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
                      className={inputCls} placeholder={placeholder} />
                  </div>
                ))}
              </>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <StatBox label="Age" value={`${profile?.age}y`} />
                <StatBox label="Height" value={`${profile?.height}cm`} />
                <StatBox label="Weight" value={`${profile?.weight}kg`} />
              </div>
            )}
          </div>
        </div>

        {/* Goals & Activity */}
        <div className="rounded-[2rem] bg-slate-950/40 border border-white/[0.04] p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" /> Goals & Activity
          </h3>
          <div className="space-y-4">
            {editing ? (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Activity Level</label>
                  <select value={form.activity_level} onChange={e => set('activity_level', e.target.value)} className={selectCls}>
                    {ACTIVITY_OPTS.map(o => <option key={o} value={o} className="bg-[#090b14] text-white">{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Fitness Goal</label>
                  <select value={form.goal_type} onChange={e => set('goal_type', e.target.value)} className={selectCls}>
                    {GOAL_OPTS.map(o => <option key={o} value={o} className="bg-[#090b14] text-white">{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Diet Preference</label>
                  <select value={form.diet_preference} onChange={e => set('diet_preference', e.target.value)} className={selectCls}>
                    {DIET_OPTS.map(o => <option key={o} value={o} className="bg-[#090b14] text-white">{o}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <div className="space-y-3 font-semibold">
                {[
                  { label: 'Activity Level', value: profile?.activity_level },
                  { label: 'Fitness Goal',   value: profile?.goal_type      },
                  { label: 'Diet',           value: profile?.diet_preference },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2.5 border-b border-white/[0.04] last:border-0">
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="text-sm text-white">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nutrition Targets */}
      <div className="rounded-[2rem] bg-slate-950/40 border border-white/[0.04] p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
          <Flame className="w-4 h-4 text-indigo-400" /> Daily Nutrition Targets
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBox label="Calories"  value={`${profile?.calorie_target} kcal`}            color="text-indigo-400"  icon={<Flame    className="w-4 h-4 text-indigo-400"  />} />
          <StatBox label="Protein"   value={`${profile?.protein_target}g`}                color="text-indigo-400"  icon={<Zap      className="w-4 h-4 text-indigo-400"  />} />
          <StatBox label="Carbs"     value={`${profile?.carbs_target}g`}                  color="text-indigo-400"  icon={<Target   className="w-4 h-4 text-indigo-400"  />} />
          <StatBox label="Hydration" value={`${((profile?.hydration_target || 3000) / 1000).toFixed(1)}L`} color="text-indigo-400" icon={<Droplets className="w-4 h-4 text-indigo-400" />} />
        </div>
      </div>

      {/* Level & Achievements */}
      <div className="rounded-[2rem] bg-slate-950/40 border border-white/[0.04] p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Level & Achievements
          </h3>
          <span className="text-xs font-bold text-slate-500 lowercase">
            {badges.filter(b => b.earned).length}/{badges.length} badges earned
          </span>
        </div>

        {/* Level Progress */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-400/5 border border-amber-400/10">
          <div className="w-12 h-12 rounded-xl bg-amber-400/15 flex items-center justify-center flex-shrink-0">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <p className="text-sm font-bold text-white">Level {levelInfo.level} · {levelInfo.title}</p>
              <p className="text-xs text-slate-400 font-bold">{levelInfo.xp} XP</p>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progress}%` }}
                transition={{ duration: 1.2 }}
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
              />
            </div>
          </div>
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-4 gap-3">
          {badges.slice(0, 8).map(badge => (
            <div
              key={badge.id}
              title={badge.desc}
              className={`p-3 rounded-2xl border text-center transition-all ${
                badge.earned
                  ? 'bg-amber-400/10 border-amber-400/20 shadow-[0_4px_12px_rgba(245,158,11,0.05)]'
                  : 'bg-white/[0.01] border-white/5 opacity-30'
              }`}
            >
              <div className="text-2xl mb-1 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">{badge.icon}</div>
              <p className="text-[10px] text-white font-extrabold leading-tight">{badge.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-[2rem] bg-slate-950/40 border border-white/[0.04] p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <h3 className="text-lg font-extrabold text-white tracking-tight">Account Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleResetOnboarding} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl px-5 py-2.5 font-bold transition-all">
            <RotateCcw className="w-4 h-4 text-indigo-400" /> Redo Onboarding
          </Button>
          <Button onClick={() => signOut({ redirectUrl: '/' })} className="bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 rounded-2xl px-5 py-2.5 font-bold transition-all">
            <LogOut className="w-4 h-4 text-rose-400" /> Sign Out
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
