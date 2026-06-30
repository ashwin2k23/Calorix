import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useClerk } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { User, Target, Activity, Droplets, Edit3, Save, X, LogOut, RotateCcw, Zap, Flame, Award, Star, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { useGamification } from '@/hooks/useGamification';
import { maskEmail, maskName } from '@/lib/sanitize';

const ACTIVITY_OPTS  = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'];
const GOAL_OPTS      = ['Lose Weight', 'Maintain Weight', 'Gain Muscle'];
const DIET_OPTS      = ['Vegetarian', 'Non-Vegetarian', 'Vegan'];

function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' };
  if (bmi < 25)   return { label: 'Normal',       color: 'text-green-600' };
  if (bmi < 30)   return { label: 'Overweight',   color: 'text-yellow-600' };
  return              { label: 'Obese',         color: 'text-red-500' };
}

function StatBox({ label, value, color = 'text-[#12266e]', icon }) {
  return (
    <div className="p-5 rounded-2xl bg-white border border-[#edf0f7] text-center shadow-sm hover:shadow-md transition-shadow">
      {icon && <div className="flex justify-center mb-2">{icon}</div>}
      <p className={`text-xl font-bold tracking-tight ${color}`}>{value}</p>
      <p className="xh-label mt-1">{label}</p>
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

  const { badges, levelInfo } = useGamification({ meals: [], waterToday: 0, profile });
  const [privacyMode, setPrivacyMode] = useState(false);

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 select-none" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 xh-card p-7">
        <div>
          <p className="xh-label mb-1"><span className="inline-block w-2 h-2 rounded-full bg-[#3456c8] mr-2" />Profile Dashboard</p>
          <h1 className="text-3xl font-bold text-[#0E1929]">Profile & Settings</h1>
          <p className="text-sm text-[#5a6478] mt-1">Manage your body metrics, goals, and preferences.</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="xh-btn-outline self-start sm:self-auto gap-2">
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2 self-start sm:self-auto">
            <button onClick={() => setEditing(false)} className="xh-btn-ghost gap-1">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="xh-btn gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Avatar + Identity */}
      <div className="xh-card p-7 flex items-center gap-6">
        <div className="relative">
          <img src={user?.imageUrl} alt="Avatar" className="w-20 h-20 rounded-full border border-[#edf0f7] object-cover" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#12266e] flex items-center justify-center border border-white">
            <User className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-[#0E1929]">
            {privacyMode ? maskName(user?.fullName) : (user?.fullName || 'User')}
          </h2>
          <p className="text-sm text-[#9aa0b0] font-medium">
            {privacyMode ? maskEmail(user?.primaryEmailAddress?.emailAddress) : user?.primaryEmailAddress?.emailAddress}
          </p>
          <div className="flex gap-2 mt-3">
            <span className="xh-badge">{profile?.goal_type}</span>
            <span className="xh-badge">{profile?.diet_preference}</span>
          </div>
        </div>
        <button
          onClick={() => setPrivacyMode(p => !p)}
          title={privacyMode ? 'Show personal info' : 'Hide personal info'}
          className="w-9 h-9 rounded-full border border-[#edf0f7] flex items-center justify-center text-[#9aa0b0] hover:text-[#12266e] hover:bg-[#e8effe] transition-colors self-start mt-1"
        >
          {privacyMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* BMI Card */}
      {bmi && (
        <div className="xh-card p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="xh-label mb-2 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" />Body Mass Index</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-[#0E1929]">{bmi}</span>
                <span className={`text-sm font-bold ${bmiCat?.color}`}>{bmiCat?.label}</span>
              </div>
            </div>
            {/* BMI scale */}
            <div className="hidden sm:flex items-center gap-1 text-xs">
              {[
                { l: 'Under', c: 'bg-blue-400', from: 0, to: 18.5 },
                { l: 'Normal', c: 'bg-green-500', from: 18.5, to: 25 },
                { l: 'Over', c: 'bg-yellow-500', from: 25, to: 30 },
                { l: 'Obese', c: 'bg-red-500', from: 30, to: 40 },
              ].map(seg => (
                <div key={seg.l} className="text-center">
                  <div className={`h-3 rounded-md ${seg.c} ${parseFloat(bmi) >= seg.from && parseFloat(bmi) < seg.to ? 'opacity-100 ring-2 ring-offset-1 ring-[#12266e]' : 'opacity-20'}`} style={{ width: '40px' }} />
                  <p className="text-[9px] font-bold text-[#9aa0b0] mt-1">{seg.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Body Metrics */}
        <div className="xh-card p-7 space-y-6">
          <h3 className="text-lg font-bold text-[#0E1929] flex items-center gap-2">
            <User className="w-4 h-4 text-[#12266e]" /> Body Metrics
          </h3>
          <div className="space-y-4">
            {editing ? (
              <>
                {[
                  { label: 'Age (years)',  key: 'age',    placeholder: 'e.g. 24' },
                  { label: 'Height (cm)', key: 'height', placeholder: 'e.g. 175' },
                  { label: 'Weight (kg)', key: 'weight', placeholder: 'e.g. 70' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="xh-label block mb-2">{label}</label>
                    <input type="number" value={form[key]} onChange={e => set(key, e.target.value)}
                      className="xh-input" placeholder={placeholder} />
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
        <div className="xh-card p-7 space-y-6">
          <h3 className="text-lg font-bold text-[#0E1929] flex items-center gap-2">
            <Target className="w-4 h-4 text-[#12266e]" /> Goals & Activity
          </h3>
          <div className="space-y-4">
            {editing ? (
              <>
                <div>
                  <label className="xh-label block mb-2">Activity Level</label>
                  <select value={form.activity_level} onChange={e => set('activity_level', e.target.value)} className="xh-select">
                    {ACTIVITY_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="xh-label block mb-2">Fitness Goal</label>
                  <select value={form.goal_type} onChange={e => set('goal_type', e.target.value)} className="xh-select">
                    {GOAL_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="xh-label block mb-2">Diet Preference</label>
                  <select value={form.diet_preference} onChange={e => set('diet_preference', e.target.value)} className="xh-select">
                    {DIET_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
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
                  <div key={label} className="flex justify-between items-center py-2.5 border-b border-[#f0f2f8] last:border-0">
                    <span className="text-sm text-[#5a6478]">{label}</span>
                    <span className="text-sm text-[#0E1929]">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nutrition Targets */}
      <div className="xh-card p-7 space-y-6">
        <h3 className="text-lg font-bold text-[#0E1929] flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#12266e]" /> Daily Nutrition Targets
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBox label="Calories"  value={`${profile?.calorie_target} kcal`}            color="text-[#12266e]" icon={<Flame    className="w-4 h-4 text-[#12266e]" />} />
          <StatBox label="Protein"   value={`${profile?.protein_target}g`}                color="text-[#7c3aed]" icon={<Zap      className="w-4 h-4 text-[#7c3aed]" />} />
          <StatBox label="Carbs"     value={`${profile?.carbs_target}g`}                  color="text-[#ea580c]" icon={<Target   className="w-4 h-4 text-[#ea580c]" />} />
          <StatBox label="Hydration" value={`${((profile?.hydration_target || 3000) / 1000).toFixed(1)}L`} color="text-[#3456c8]" icon={<Droplets className="w-4 h-4 text-[#3456c8]" />} />
        </div>
      </div>

      {/* Level & Achievements */}
      <div className="xh-card p-7 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#0E1929] flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" /> Level & Achievements
          </h3>
          <span className="xh-badge-orange">
            {badges.filter(b => b.earned).length}/{badges.length} badges earned
          </span>
        </div>

        {/* Level Progress */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <p className="text-sm font-bold text-[#0E1929]">Level {levelInfo.level} · {levelInfo.title}</p>
              <p className="text-xs text-[#9aa0b0] font-bold">{levelInfo.xp} XP</p>
            </div>
            <div className="xh-progress">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progress}%` }}
                transition={{ duration: 1.2 }}
                className="xh-progress-fill"
                style={{ background: 'linear-gradient(90deg,#fbbf24,#d97706)' }}
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
                  ? 'bg-amber-50 border-amber-100 shadow-sm'
                  : 'bg-[#f8f9fc] border-[#f0f2f8] opacity-30'
              }`}
            >
              <div className="text-2xl mb-1">{badge.icon}</div>
              <p className="text-[10px] text-[#0E1929] font-bold leading-tight">{badge.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="xh-card p-7 space-y-6">
        <h3 className="text-lg font-bold text-red-500">Account Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleResetOnboarding} className="xh-btn-outline gap-2 text-sm font-semibold">
            <RotateCcw className="w-4 h-4" /> Redo Onboarding
          </button>
          <button onClick={() => signOut({ redirectUrl: '/' })} className="xh-btn-ghost gap-2 border border-[#f0f2f8] text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
