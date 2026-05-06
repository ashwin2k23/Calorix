import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';

const indianFoods = [
  { name: 'Roti (1 piece)', cal: 104, p: 3, c: 22, f: 0.5 },
  { name: 'Dal Tadka (1 bowl)', cal: 180, p: 9, c: 24, f: 5 },
  { name: 'Paneer Tikka (150g)', cal: 260, p: 18, c: 8, f: 18 },
  { name: 'Chicken Curry (200g)', cal: 320, p: 25, c: 10, f: 15 },
  { name: 'White Rice (1 bowl)', cal: 240, p: 4, c: 53, f: 0 },
];

export default function Meals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [meals, setMeals] = useState([
    { id: 1, name: 'Poha (1 plate)', cal: 250, type: 'Breakfast' },
    { id: 2, name: 'Masala Dosa', cal: 350, type: 'Breakfast' },
  ]);

  const filteredFoods = indianFoods.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const addMeal = (food) => {
    setMeals([...meals, { id: Date.now(), name: food.name, cal: food.cal, type: 'Lunch' }]);
  };

  const removeMeal = (id) => {
    setMeals(meals.filter(m => m.id !== id));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Food Logging</h1>
        <p className="text-muted-foreground">Track your daily meals from our Indian food database.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Search and Add */}
        <Card className="border-white/5">
          <CardHeader>
            <CardTitle>Add a Meal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search food (e.g., Roti, Dal, Paneer)..." 
                className="w-full bg-input/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {filteredFoods.map((food, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-white/5 hover:border-primary/30 transition-colors">
                  <div>
                    <h4 className="font-medium text-sm">{food.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {food.cal} kcal &bull; P: {food.p}g &bull; C: {food.c}g &bull; F: {food.f}g
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full h-8 px-3" onClick={() => addMeal(food)}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              ))}
              {filteredFoods.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">No food found matching your search.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Logged Meals */}
        <div className="space-y-6">
          <Card className="border-white/5">
            <CardHeader className="pb-3 border-b border-white/5">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Today's Log</CardTitle>
                <span className="text-sm font-bold text-primary">{meals.reduce((a, b) => a + b.cal, 0)} kcal</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {meals.map((meal) => (
                  <div key={meal.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                    <div>
                      <h4 className="text-sm font-medium">{meal.name}</h4>
                      <p className="text-xs text-muted-foreground">{meal.type}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold">{meal.cal} kcal</span>
                      <button onClick={() => removeMeal(meal.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
                {meals.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm">You haven't logged any meals today.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
