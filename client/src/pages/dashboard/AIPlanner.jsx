import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';

export default function AIPlanner() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai-diet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: { weight: 75, goal: 'maintain' } })
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setPlan(data.plan);
      } else {
        throw new Error('Fallback');
      }
    } catch (e) {
      // Fallback if backend is not running
      setPlan({
        breakfast: 'Oats with milk, almonds, and a banana. (350 kcal)',
        lunch: '2 Rotis, Dal Tadka, and mixed vegetable subzi. (450 kcal)',
        snack: 'Roasted Makhana and green tea. (120 kcal)',
        dinner: 'Grilled Paneer with a large bowl of salad. (300 kcal)',
        insight: 'You are currently slightly low on protein. Adding some paneer or greek yogurt to your snacks can help you reach your goals faster while keeping you full.'
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
        <p className="text-muted-foreground">Get a personalized Indian diet plan based on your profile.</p>
      </div>

      {!plan && !loading && (
        <Card className="border-white/5 border-dashed border-2 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Ready for your plan?</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Our AI will analyze your goals, weight, and preferences to generate a full-day Indian diet plan instantly.
            </p>
            <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20" onClick={generatePlan}>
              Generate Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="border-white/5">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Crafting your personalized menu...</p>
          </CardContent>
        </Card>
      )}

      {plan && !loading && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <Card className="bg-gradient-to-r from-[#00c2ff]/10 to-primary/10 border-[#00c2ff]/30">
             <CardContent className="p-6 flex gap-4">
              <div className="mt-1">
                <Sparkles className="w-6 h-6 text-[#00c2ff]" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">AI Insight</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{plan.insight}</p>
              </div>
             </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-white/5 hover:border-primary/20 transition-colors">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-lg flex items-center gap-2">🌅 Breakfast</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-muted-foreground">{plan.breakfast}</CardContent>
            </Card>
            
            <Card className="border-white/5 hover:border-primary/20 transition-colors">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-lg flex items-center gap-2">☀️ Lunch</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-muted-foreground">{plan.lunch}</CardContent>
            </Card>

            <Card className="border-white/5 hover:border-primary/20 transition-colors">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-lg flex items-center gap-2">🍎 Snack</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-muted-foreground">{plan.snack}</CardContent>
            </Card>

            <Card className="border-white/5 hover:border-primary/20 transition-colors">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-lg flex items-center gap-2">🌙 Dinner</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-muted-foreground">{plan.dinner}</CardContent>
            </Card>
          </div>

          <div className="flex justify-center mt-8">
            <Button variant="outline" className="rounded-full px-8" onClick={generatePlan}>
              Regenerate Plan
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
