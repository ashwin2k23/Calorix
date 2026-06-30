import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Target, TrendingUp } from 'lucide-react';
import api from '@/lib/api';

export default function Goals({ profile, user, onProfileUpdate }) {
  const [weight, setWeight] = useState(profile?.weight || 75);
  const [height, setHeight] = useState(profile?.height || 175);
  const [age, setAge]       = useState(profile?.age || 25);
  const [goal, setGoal]     = useState(profile?.goal_type || 'Maintain Weight');

  useEffect(() => {
    if (profile) { setWeight(profile.weight); setHeight(profile.height); setAge(profile.age); setGoal(profile.goal_type); }
  }, [profile]);

  const calculateTarget = () => {
    const bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    const tdee = bmr * 1.55;
    if (goal === 'Lose Weight') return Math.round(tdee - 500);
    if (goal === 'Gain Muscle') return Math.round(tdee + 300);
    return Math.round(tdee);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const cal = calculateTarget();
      const updated = {
        ...profile, clerk_user_id: user.id, name: user.fullName || 'User',
        weight, height, age, goal_type: goal, calorie_target: cal,
        protein_target: Math.round(weight * 2.2),
        carbs_target: Math.round((cal * 0.4) / 4),
        fats_target: Math.round((cal * 0.3) / 9),
        onboarding_completed: true,
      };
      await api.saveUser(updated);
      localStorage.setItem('calorix_profile', JSON.stringify(updated));
      toast.success('Goals updated!');
      if (onProfileUpdate) onProfileUpdate();
    } catch { toast.error('Failed to update goals.'); }
  };

  const target = calculateTarget();

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto select-none" style={{ fontFamily: "'DM Sans',sans-serif" }}>

      <div className="xh-card p-7">
        <p className="xh-label mb-1"><span className="inline-block w-2 h-2 rounded-full bg-[#3456c8] mr-2" />Goal Configuration</p>
        <h1 className="text-3xl font-bold text-[#0E1929]">Your Goals</h1>
        <p className="text-sm text-[#5a6478] mt-1">Set your body profile and we'll calculate your daily targets.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 items-start">
        {/* Form */}
        <div className="xh-card p-7 space-y-5">
          <h2 className="text-xl font-bold text-[#0E1929]">Body Profile</h2>
          {[
            { label: 'Weight (kg)', val: weight, set: setWeight },
            { label: 'Height (cm)', val: height, set: setHeight },
            { label: 'Age (years)',  val: age,    set: setAge    },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="xh-label block mb-2">{label}</label>
              <input type="number" value={val} onChange={e => set(Number(e.target.value))} className="xh-input" />
            </div>
          ))}
          <div>
            <label className="xh-label block mb-2">Fitness Goal</label>
            <select value={goal} onChange={e => setGoal(e.target.value)} className="xh-select">
              <option>Lose Weight</option>
              <option>Maintain Weight</option>
              <option>Gain Muscle</option>
            </select>
          </div>
          <button onClick={handleSave} className="xh-btn w-full justify-center py-3">Save Profile</button>
        </div>

        {/* Target display */}
        <div className="xh-card p-7 flex flex-col gap-6 min-h-[420px]">
          <div>
            <h2 className="text-xl font-bold text-[#0E1929] mb-1">Calculated Target</h2>
            <p className="text-sm text-[#5a6478]">Personalized daily calorie goal based on your metrics.</p>
          </div>

          <div className="xh-card-blue rounded-2xl p-8 text-center flex-1 flex flex-col items-center justify-center gap-2">
            <TrendingUp className="w-8 h-8 text-[#12266e] mb-2" />
            <p className="text-6xl font-bold text-[#12266e]">{target}</p>
            <p className="xh-label">kcal / day</p>
          </div>

          <div className="space-y-3 border-t border-[#f0f2f8] pt-5">
            {[
              { label: 'Protein Target', val: `${Math.round(weight * 2.2)}g` },
              { label: 'Carbs Target',   val: `${Math.round((target * 0.4) / 4)}g` },
              { label: 'Fats Target',    val: `${Math.round((target * 0.3) / 9)}g` },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between">
                <span className="text-sm text-[#5a6478] font-medium">{label}</span>
                <span className="text-sm font-bold text-[#12266e]">{val}</span>
              </div>
            ))}
          </div>
          <p className="xh-label text-center">Mifflin-St Jeor equation · TDEE adjusted</p>
        </div>
      </div>
    </div>
  );
}
