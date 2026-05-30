import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, Coffee, Sun, Apple, Moon } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const MEAL_TYPES = [
  { id: 'Breakfast', icon: <Coffee className="w-4 h-4" />, color: 'text-orange-400' },
  { id: 'Lunch', icon: <Sun className="w-4 h-4" />, color: 'text-yellow-400' },
  { id: 'Snack', icon: <Apple className="w-4 h-4" />, color: 'text-green-400' },
  { id: 'Dinner', icon: <Moon className="w-4 h-4" />, color: 'text-blue-400' },
];

const indianFoods = [
  { name: 'Roti (1 piece)', cal: 104, p: 3, c: 22, f: 0.5, image: 'https://images.unsplash.com/photo-1565557613262-ba945657850c?w=400&q=80' },
  { name: 'Dal Tadka (1 bowl)', cal: 180, p: 9, c: 24, f: 5, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80' },
  { name: 'Paneer Tikka (150g)', cal: 260, p: 18, c: 8, f: 18, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80' },
  { name: 'Chicken Curry (200g)', cal: 320, p: 25, c: 10, f: 15, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80' },
  { name: 'White Rice (1 bowl)', cal: 240, p: 4, c: 53, f: 0, image: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=80' },
  { name: 'Masala Dosa (1 piece)', cal: 350, p: 8, c: 60, f: 9, image: 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=400&q=80' },
  { name: 'Idli (2 pieces)', cal: 120, p: 4, c: 26, f: 0.5, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=400&q=80' },
  { name: 'Poha (1 plate)', cal: 250, p: 5, c: 45, f: 5, image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80' },
  { name: 'Rajma Chawal (1 bowl)', cal: 380, p: 12, c: 65, f: 8, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
  { name: 'Chicken Biryani (250g)', cal: 450, p: 28, c: 50, f: 15, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80' },
  { name: 'Palak Paneer (150g)', cal: 220, p: 14, c: 12, f: 13, image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80' },
  { name: 'Chole Bhature (1 plate)', cal: 520, p: 14, c: 75, f: 18, image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80' },
  { name: 'Samosa (2 pieces)', cal: 260, p: 4, c: 32, f: 13, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80' },
  { name: 'Egg Bhurji (2 eggs)', cal: 210, p: 14, c: 4, f: 15, image: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400&q=80' },
  { name: 'Upma (1 bowl)', cal: 200, p: 5, c: 38, f: 4, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80' },
  { name: 'Aloo Paratha (1 piece)', cal: 290, p: 6, c: 45, f: 9, image: 'https://images.unsplash.com/photo-1565557613262-ba945657850c?w=400&q=80' },
  { name: 'Moong Dal (1 bowl)', cal: 150, p: 10, c: 22, f: 2, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80' },
  { name: 'Lassi (1 glass)', cal: 170, p: 5, c: 28, f: 4, image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&q=80' },
  { name: 'Banana (1 medium)', cal: 89, p: 1, c: 23, f: 0, image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400&q=80' },
  { name: 'Roasted Chana (30g)', cal: 110, p: 6, c: 16, f: 2, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
];

export default function Meals({ user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('Breakfast');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!user) return;
    const fetchMeals = async () => {
      try {
        const data = await api.getMeals(user.id);
        if (data.success) setMeals(data.data);
      } catch (error) {
        console.error('Failed to fetch meals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMeals();
  }, [user]);

  const filteredFoods = indianFoods.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedMeals = activeTab === 'all'
    ? meals
    : meals.filter(m => m.meal_type === activeTab);

  const addMeal = async (food) => {
    if (!user) return;
    try {
      const newMeal = {
        user_id: user.id,
        food_name: food.name,
        calories: food.cal,
        protein: food.p,
        carbs: food.c,
        fats: food.f,
        meal_type: selectedType
      };
      const data = await api.addMeal(newMeal);
      if (data.success) {
        setMeals(prev => [{ ...newMeal, id: data.data.id, created_at: new Date().toISOString() }, ...prev]);
        toast.success(`${food.name} added to ${selectedType}!`);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to add meal.');
    }
  };

  const removeMeal = async (id, name) => {
    try {
      const data = await api.deleteMeal(id);
      if (data.success) {
        setMeals(prev => prev.filter(m => m.id !== id));
        toast.info(`${name} removed.`);
      }
    } catch {
      toast.error('Failed to remove meal.');
    }
  };

  const totalCals = meals.reduce((a, m) => a + (m.calories || 0), 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="space-y-8 max-w-[1400px] mx-auto select-none"
    >
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Food Logging</h1>
        <p className="text-slate-400 text-sm font-semibold">Log and track your daily nutrition intake with our database.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left — Add Meal */}
        <div className="lg:col-span-7 rounded-[2rem] bg-slate-950/40 border border-white/[0.04] p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Add a Meal</h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-wider">
              {selectedType} Selected
            </span>
          </div>

          {/* Meal Type Selector */}
          <div className="grid grid-cols-4 gap-3">
            {MEAL_TYPES.map(type => {
              const isSel = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border text-xs font-bold tracking-wide transition-all duration-300 ${
                    isSel
                      ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                      : 'border-white/5 bg-white/[0.01] text-slate-400 hover:text-white hover:border-white/10 hover:bg-white/[0.02]'
                  }`}
                >
                  <span className={isSel ? 'text-indigo-400 scale-110 transition-transform' : `${type.color}`}>{type.icon}</span>
                  {type.id}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Indian food database..."
              className="w-full bg-black/30 border border-white/[0.05] rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-semibold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Food List */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredFoods.map((food, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:border-indigo-500/30 transition-all duration-300 hover:bg-white/[0.02] group">
                <div className="flex items-center gap-4">
                  <img src={food.image} alt={food.name} className="w-12 h-12 object-cover rounded-xl border border-white/10 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-white">{food.name}</h4>
                    <p className="text-xs text-slate-400 font-semibold mt-1">
                      {food.cal} kcal · P:{food.p}g · C:{food.c}g · F:{food.f}g
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline"
                  className="rounded-xl h-9 px-4 border-white/10 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all flex-shrink-0 text-xs font-bold"
                  onClick={() => addMeal(food)}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            ))}
            {filteredFoods.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm font-semibold">No food found matching search term.</div>
            )}
          </div>
        </div>

        {/* Right — Logged Meals */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-[2rem] bg-slate-950/40 border border-white/[0.04] p-8 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-white/[0.04]">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Today's Log</h2>
              <div className="text-right">
                <span className="text-2xl font-black text-indigo-400">{totalCals}</span>
                <span className="text-xs text-slate-500 font-bold ml-1">kcal</span>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {['all', ...MEAL_TYPES.map(t => t.id)].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-bold tracking-wide transition-all capitalize ${
                    activeTab === tab
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                      : 'bg-white/[0.01] text-slate-400 border border-white/5 hover:border-white/10 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence>
                {displayedMeals.map((meal) => (
                  <motion.div
                    key={meal.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/[0.03] group hover:border-white/[0.08] transition-all duration-300"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white capitalize">{meal.food_name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">{meal.meal_type}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2.5 py-1 rounded-xl">{meal.calories} kcal</span>
                      <button
                        onClick={() => removeMeal(meal.id, meal.food_name)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {displayedMeals.length === 0 && !loading && (
                <div className="text-center py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl opacity-40">
                  <p className="text-slate-400 text-sm font-bold">
                    {activeTab === 'all' ? "No meals logged today." : `No ${activeTab} meals logged.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
