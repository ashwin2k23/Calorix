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
  if (bmi < 25)   return { label: 'Normal',       color: 'text-primary'    };
  if (bmi < 30)   return { label: 'Overweight',   color: 'text-yellow-400' };
  return              { label: 'Obese',         color: 'text-red-400'    };
}

function StatBox({ label, value, color = 'text-foreground', icon }) {
  return (
    <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-center">
      {icon && <div className="flex justify-center mb-1">{icon}</div>}
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">{label}</p>
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

  const inputCls = 'w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all';
  const selectCls = `${inputCls} text-foreground`;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Profile & Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your body metrics, goals, and preferences.</p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} variant="outline" className="border-white/10 rounded-xl gap-2 self-start sm:self-auto">
            <Edit3 className="w-4 h-4" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2 self-start sm:self-auto">
            <Button onClick={() => setEditing(false)} variant="outline" className="border-white/10 rounded-xl gap-1">
              <X className="w-4 h-4" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-gradient-to-r from-primary to-[#00c2ff] gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Avatar + Identity */}
      <Card className="border-white/5 bg-card/40 backdrop-blur-md">
        <CardContent className="p-5 flex items-center gap-5">
          <div className="relative">
            <img src={user?.imageUrl} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-primary/30 object-cover" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
              <User className="w-2.5 h-2.5 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.fullName || 'User'}</h2>
            <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">{profile?.goal_type}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">{profile?.diet_preference}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BMI Card */}
      {bmi && (
        <Card className="border-white/5 bg-card/40 backdrop-blur-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><Activity className="w-3 h-3" />Body Mass Index</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold">{bmi}</span>
                  <span className={`text-sm font-semibold ${bmiCat?.color}`}>{bmiCat?.label}</span>
                </div>
              </div>
              {/* BMI scale visual */}
              <div className="hidden sm:flex items-center gap-1 text-xs">
                {[
                  { l: 'Under', c: 'bg-blue-400', w: '20%', from: 0, to: 18.5 },
                  { l: 'Normal', c: 'bg-primary', w: '35%', from: 18.5, to: 25 },
                  { l: 'Over', c: 'bg-yellow-400', w: '25%', from: 25, to: 30 },
                  { l: 'Obese', c: 'bg-red-400', w: '20%', from: 30, to: 40 },
                ].map(seg => (
                  <div key={seg.l} className="text-center">
                    <div className={`h-3 rounded-sm ${seg.c} ${parseFloat(bmi) >= seg.from && parseFloat(bmi) < seg.to ? 'opacity-100 ring-2 ring-white/40' : 'opacity-30'}`} style={{ width: '40px' }} />
                    <p className="text-muted-foreground mt-0.5" style={{ fontSize: 9 }}>{seg.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Body Metrics */}
        <Card className="border-white/5 bg-card/40 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Body Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {editing ? (
              <>
                {[
                  { label: 'Age (years)',  key: 'age',    type: 'number', placeholder: 'e.g. 24' },
                  { label: 'Height (cm)', key: 'height', type: 'number', placeholder: 'e.g. 175' },
                  { label: 'Weight (kg)', key: 'weight', type: 'number', placeholder: 'e.g. 70' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                    <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
                      className={inputCls} placeholder={placeholder} />
                  </div>
                ))}
              </>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <StatBox label="Age" value={`${profile?.age}y`} />
                <StatBox label="Height" value={`${profile?.height}cm`} />
                <StatBox label="Weight" value={`${profile?.weight}kg`} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals & Activity */}
        <Card className="border-white/5 bg-card/40 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-[#00c2ff]" /> Goals & Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {editing ? (
              <>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Activity Level</label>
                  <select value={form.activity_level} onChange={e => set('activity_level', e.target.value)} className={selectCls}>
                    {ACTIVITY_OPTS.map(o => <option key={o} value={o} className="bg-background">{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Fitness Goal</label>
                  <select value={form.goal_type} onChange={e => set('goal_type', e.target.value)} className={selectCls}>
                    {GOAL_OPTS.map(o => <option key={o} value={o} className="bg-background">{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Diet Preference</label>
                  <select value={form.diet_preference} onChange={e => set('diet_preference', e.target.value)} className={selectCls}>
                    {DIET_OPTS.map(o => <option key={o} value={o} className="bg-background">{o}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <div className="space-y-2.5">
                {[
                  { label: 'Activity Level', value: profile?.activity_level },
                  { label: 'Fitness Goal',   value: profile?.goal_type      },
                  { label: 'Diet',           value: profile?.diet_preference },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nutrition Targets */}
      <Card className="border-white/5 bg-card/40 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Flame className="w-4 h-4 text-primary" /> Daily Nutrition Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Calories"  value={`${profile?.calorie_target} kcal`}            color="text-primary"     icon={<Flame    className="w-4 h-4 text-primary"     />} />
            <StatBox label="Protein"   value={`${profile?.protein_target}g`}                color="text-[#9b6dff]"   icon={<Zap      className="w-4 h-4 text-[#9b6dff]"   />} />
            <StatBox label="Carbs"     value={`${profile?.carbs_target}g`}                  color="text-orange-400"  icon={<Target   className="w-4 h-4 text-orange-400"  />} />
            <StatBox label="Hydration" value={`${((profile?.hydration_target || 3000) / 1000).toFixed(1)}L`} color="text-blue-400" icon={<Droplets className="w-4 h-4 text-blue-400"  />} />
          </div>
        </CardContent>
      </Card>

      {/* Gamification Summary */}
      <Card className="border-white/5 bg-card/40 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" /> Level & Achievements
            <span className="ml-auto text-xs text-muted-foreground">
              {badges.filter(b => b.earned).length}/{badges.length} badges
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Level Progress */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-yellow-400/5 border border-yellow-400/15">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/15 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <p className="text-sm font-bold">Level {levelInfo.level} · {levelInfo.title}</p>
                <p className="text-xs text-muted-foreground">{levelInfo.xp} XP</p>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${levelInfo.progress}%` }}
                  transition={{ duration: 1.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"
                />
              </div>
            </div>
          </div>
          {/* Badge Grid */}
          <div className="grid grid-cols-4 gap-2">
            {badges.slice(0, 8).map(badge => (
              <div
                key={badge.id}
                title={badge.desc}
                className={`p-2 rounded-xl border text-center transition-all ${
                  badge.earned
                    ? 'bg-yellow-400/10 border-yellow-400/25'
                    : 'bg-white/3 border-white/5 opacity-35'
                }`}
              >
                <div className="text-xl mb-0.5">{badge.icon}</div>
                <p className="text-[9px] text-muted-foreground leading-tight">{badge.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-white/5 bg-card/40 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleResetOnboarding} className="border-white/10 rounded-xl gap-2 text-muted-foreground hover:text-foreground">
            <RotateCcw className="w-4 h-4" /> Redo Onboarding
          </Button>
          <Button variant="destructive" onClick={() => signOut({ redirectUrl: '/' })} className="rounded-xl gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
