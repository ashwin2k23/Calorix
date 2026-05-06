import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, Coffee, Sun, Apple, Moon } from 'lucide-react';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
        const response = await fetch(`${API}/api/meals/${user.id}`);
        const data = await response.json();
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
      const response = await fetch(`${API}/api/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMeal)
      });
      const data = await response.json();
      if (data.success) {
        setMeals(prev => [{ ...newMeal, id: data.data.id, created_at: new Date().toISOString() }, ...prev]);
        toast.success(`${food.name} added to ${selectedType}!`);
      }
    } catch {
      toast.error('Failed to add meal.');
    }
  };

  const removeMeal = async (id, name) => {
    try {
      const response = await fetch(`${API}/api/meals/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setMeals(prev => prev.filter(m => m.id !== id));
        toast.info(`${name} removed.`);
      }
    } catch {
      toast.error('Failed to remove meal.');
    }
  };

  const totalCals = meals.reduce((a, m) => a + (m.calories || 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Food Logging</h1>
        <p className="text-muted-foreground">Track your daily meals from our Indian food database.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Add Meal */}
        <Card className="border-white/5 bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Add a Meal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Meal Type Selector */}
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all ${
                    selectedType === type.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-white/10 bg-black/20 text-muted-foreground hover:border-white/20'
                  }`}
                >
                  <span className={selectedType === type.id ? 'text-primary' : type.color}>{type.icon}</span>
                  {type.id}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search Indian food..."
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Food List */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredFoods.map((food, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5 hover:border-primary/30 transition-all hover:bg-card/60 group">
                  <div className="flex items-center gap-3">
                    <img src={food.image} alt={food.name} className="w-11 h-11 object-cover rounded-lg border border-white/10 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">{food.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {food.cal} kcal · P:{food.p}g · C:{food.c}g · F:{food.f}g
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline"
                    className="rounded-full h-8 px-3 border-white/10 hover:bg-primary/20 hover:text-primary hover:border-primary/40 transition-all flex-shrink-0"
                    onClick={() => addMeal(food)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>
              ))}
              {filteredFoods.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">No food found matching your search.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right — Logged Meals */}
        <div className="space-y-4">
          <Card className="border-white/5 bg-card/40 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-white/5">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Today's Log</CardTitle>
                <div className="text-right">
                  <span className="text-xl font-bold text-primary">{totalCals}</span>
                  <span className="text-xs text-muted-foreground ml-1">kcal</span>
                </div>
              </div>
              {/* Filter tabs */}
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {['all', ...MEAL_TYPES.map(t => t.id)].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs px-3 py-1 rounded-full transition-all capitalize ${
                      activeTab === tab
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-black/20 text-muted-foreground border border-white/10 hover:border-white/20'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                <AnimatePresence>
                  {displayedMeals.map((meal) => (
                    <motion.div
                      key={meal.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 group hover:border-white/10 transition-all"
                    >
                      <div>
                        <h4 className="text-sm font-medium">{meal.food_name}</h4>
                        <p className="text-xs text-muted-foreground uppercase mt-0.5 tracking-wide">{meal.meal_type}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold bg-white/5 px-2 py-1 rounded-lg">{meal.calories} kcal</span>
                        <button
                          onClick={() => removeMeal(meal.id, meal.food_name)}
                          className="text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {displayedMeals.length === 0 && !loading && (
                  <div className="text-center py-10 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl">
                    <p className="text-muted-foreground text-sm">
                      {activeTab === 'all' ? "You haven't logged any meals today." : `No ${activeTab} meals logged yet.`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
