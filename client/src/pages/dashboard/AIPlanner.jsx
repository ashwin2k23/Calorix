import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const mealIcons = { breakfast: '🌅', lunch: '☀️', snack: '🍎', dinner: '🌙' };

export default function AIPlanner({ profile }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/ai-diet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setPlan(data.plan);
      } else throw new Error('Failed');
    } catch {
      setPlan({
        breakfast: 'Oats with milk, almonds, and a banana. (350 kcal)',
        lunch: '2 Rotis, Dal Tadka, and mixed vegetable subzi. (450 kcal)',
        snack: 'Roasted Makhana and green tea. (120 kcal)',
        dinner: 'Grilled Paneer with a large bowl of salad. (300 kcal)',
        insight: 'Adding some paneer or greek yogurt to your snacks can help you reach your protein goals faster while keeping you full.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
          AI Diet Planner <Sparkles className="w-6 h-6 text-[#00c2ff]" />
        </h1>
        <p className="text-muted-foreground">
          Get a personalized Indian meal plan based on your profile.
          {profile?.diet_preference && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[#9b6dff]/10 border border-[#9b6dff]/30 text-[#9b6dff]">
              {profile.diet_preference}
            </span>
          )}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!plan && !loading && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="border-white/5 border-dashed border-2 bg-transparent">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-[#00c2ff]/20 flex items-center justify-center mb-6"
                >
                  <Sparkles className="w-10 h-10 text-primary" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2">Ready for your personalized plan?</h3>
                <p className="text-muted-foreground max-w-sm mb-2">
                  Our AI will analyze your{' '}
                  <span className="text-primary font-medium">{profile?.goal_type || 'fitness'}</span> goal,
                  weight, and dietary preference to generate a full-day Indian meal plan.
                </p>
                {profile?.calorie_target && (
                  <p className="text-xs text-muted-foreground mb-6">
                    Target: <span className="text-primary font-bold">{profile.calorie_target} kcal/day</span>
                  </p>
                )}
                <Button size="lg" className="rounded-full px-10 bg-gradient-to-r from-primary to-[#00c2ff] hover:opacity-90 shadow-lg shadow-primary/20" onClick={generatePlan}>
                  Generate My Plan
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="border-white/5">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <Sparkles className="w-5 h-5 text-[#00c2ff] absolute -top-1 -right-1 animate-pulse" />
                </div>
                <p className="text-muted-foreground">Crafting your personalized menu with Gemini AI...</p>
                <p className="text-xs text-muted-foreground mt-1">Based on your {profile?.diet_preference} preferences</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {plan && !loading && (
          <motion.div key="plan" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            {/* Insight Banner */}
            <Card className="bg-gradient-to-r from-[#00c2ff]/10 to-primary/10 border-[#00c2ff]/30">
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="mt-0.5 flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-[#00c2ff]" />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1">Gemini AI Insight</h3>
                  <p className="text-sm text-foreground/80 leading-relaxed">{plan.insight}</p>
                </div>
              </CardContent>
            </Card>

            {/* Meal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {['breakfast', 'lunch', 'snack', 'dinner'].map((meal, i) => (
                <motion.div key={meal} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="border-white/5 bg-card/40 backdrop-blur-md hover:border-primary/20 transition-all group h-full">
                    <CardHeader className="pb-3 border-b border-white/5">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="text-xl">{mealIcons[meal]}</span>
                        <span className="capitalize">{meal}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">
                      {plan[meal]}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center mt-4">
              <Button variant="outline" className="rounded-full px-8 border-white/10 hover:border-primary/30 gap-2" onClick={generatePlan}>
                <RefreshCw className="w-4 h-4" /> Regenerate Plan
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
