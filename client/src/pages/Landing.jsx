import React from 'react';
import { motion } from 'framer-motion';
import { Flame, ArrowRight, MessageSquare, Plus, Activity, AlertCircle, TrendingUp, ChevronRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, useClerk } from '@clerk/clerk-react';

export default function Landing() {
  const { openSignIn, openSignUp } = useClerk();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-[1400px] mx-auto relative z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Calorix</span>
        </div>
        <div className="flex items-center gap-5">
          <SignedIn>
            <Link to="/dashboard" className="px-4 py-2 text-sm font-semibold text-white bg-white/10 border border-white/10 rounded-lg hover:bg-white/15 transition-all">
              Dashboard
            </Link>
          </SignedIn>
          <SignedOut>
            <button onClick={() => openSignIn()} className="text-sm font-medium text-muted-foreground hover:text-white transition-colors cursor-pointer">
              Log in
            </button>
            <button onClick={() => openSignUp()} className="px-4 py-2 text-sm font-semibold text-background bg-foreground rounded-lg hover:bg-foreground/90 transition-all cursor-pointer">
              Get Started
            </button>
          </SignedOut>
        </div>
      </nav>

      <main className="relative overflow-hidden">
        
        {/* Subtle noise texture */}
        <div className="absolute inset-0 z-0 opacity-[0.015] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

        {/* HERO SECTION */}
        <section className="relative pt-20 lg:pt-32 pb-24 px-6 max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Left: Copy */}
          <div className="flex-1 w-full max-w-2xl relative z-10">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-muted-foreground mb-8">
               <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
               Calorix Nutrition Tracking Engine
             </div>
             
             <h1 className="text-[3.5rem] md:text-[5rem] font-semibold tracking-[-0.04em] text-foreground leading-[1] mb-8">
               Track your diet. <br/>
               <span className="text-muted-foreground">Skip the guesswork.</span>
             </h1>
             
             <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-[540px] leading-[1.6]">
               Type what you ate or snap a picture. Calorix instantly calculates calories and macros for complex Indian meals, tracks your daily goals, and adjusts your plan using AI.
             </p>
             
             <div className="flex flex-col sm:flex-row gap-4 items-center">
               <SignedIn>
                 <Link to="/dashboard" className="w-full sm:w-auto px-6 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_8px_20px_-4px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2">
                   Open Dashboard <ArrowRight className="w-4 h-4" />
                 </Link>
               </SignedIn>
               <SignedOut>
                 <button onClick={() => openSignUp()} className="w-full sm:w-auto px-6 py-3.5 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset]">
                   Start tracking today
                 </button>
                 <div className="text-sm text-muted-foreground font-medium px-4">
                   No credit card needed
                 </div>
               </SignedOut>
             </div>
          </div>

          {/* Right: Mocked UI Composition */}
          <div className="flex-1 w-full relative h-[500px] lg:h-[650px] flex items-center justify-center lg:justify-end perspective-1000">
            {/* Background lighting */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="relative w-full max-w-[500px] h-full">
              
              {/* Daily Summary Component */}
              <motion.div 
                initial={{ opacity: 0, y: 20, rotateX: 10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-4 left-0 lg:-left-12 bg-[#14151A] border border-white/[0.08] p-5 rounded-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] w-72 md:w-80 z-10"
              >
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-sm font-semibold text-white">Daily Summary</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Today</span>
                </div>
                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                      <circle cx="50" cy="50" r="42" stroke="#8b5cf6" strokeWidth="8" fill="none" strokeDasharray="264" strokeDashoffset="79.2" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold tracking-tight text-white">1,840</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">/ 2400 Kcal</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <MacroBar label="Protein" current={85} max={120} color="bg-emerald-400" />
                    <MacroBar label="Carbs" current={180} max={200} color="bg-orange-400" />
                    <MacroBar label="Fats" current={55} max={65} color="bg-rose-400" />
                  </div>
                </div>
              </motion.div>

              {/* Meal Logged Component */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-44 right-0 bg-[#1A1C23] border border-white/[0.08] p-4 rounded-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] w-[300px] z-20 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-rose-400" />
                <div className="flex justify-between items-start mb-4 mt-1">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-lg bg-[#2A2624] border border-orange-500/20 flex items-center justify-center text-xl">
                       🍲
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Paneer Butter Masala</h4>
                      <p className="text-xs text-muted-foreground">Lunch • 1.5 bowls + 2 Roti</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-white">640 kcal</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="px-2 py-1 bg-emerald-400/10 text-emerald-400 rounded-md text-[10px] font-semibold border border-emerald-400/20">28g Protein</div>
                  <div className="px-2 py-1 bg-orange-400/10 text-orange-400 rounded-md text-[10px] font-semibold border border-orange-400/20">45g Carbs</div>
                  <div className="px-2 py-1 bg-rose-400/10 text-rose-400 rounded-md text-[10px] font-semibold border border-rose-400/20">32g Fat</div>
                </div>
              </motion.div>

              {/* AI Insight Component */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-12 left-4 md:left-12 bg-primary text-white p-5 rounded-2xl shadow-[0_20px_40px_rgba(139,92,246,0.3)] w-[320px] md:w-[360px] z-30"
              >
                 <div className="flex items-center justify-between mb-3 border-b border-white/20 pb-3">
                   <div className="flex items-center gap-2">
                     <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                       <Flame className="w-3 h-3 text-white" />
                     </div>
                     <span className="text-xs font-bold uppercase tracking-wider text-white/90">Insight</span>
                   </div>
                   <span className="text-xs font-medium text-white/70">Just now</span>
                 </div>
                 <p className="text-[13px] leading-relaxed font-medium text-white/90">
                   You are 35g short on protein today. Since you had a heavy lunch, consider <span className="text-white font-bold bg-white/20 px-1 rounded">Moong Dal Chilla</span> with paneer for dinner. It fits your remaining macros perfectly.
                 </p>
                 <button className="mt-4 w-full py-2.5 bg-white text-primary text-xs font-bold rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                   <Plus className="w-3.5 h-3.5" /> Log recommendation
                 </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FEATURE SECTION 1: Asymmetric Layout */}
        <section className="py-24 px-6 max-w-[1200px] mx-auto border-t border-white/[0.04]">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-center">
            <div className="lg:col-span-5 space-y-6 order-2 lg:order-1">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-foreground leading-[1.1]">
                Stop entering ingredients manually.
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Most apps fail at Indian cuisine. Is a "katori" 150ml or 200ml? How much oil is in standard tadka? Calorix uses NLP to understand exact regional nuances, logging accurate nutritional values in plain English.
              </p>
              <ul className="space-y-3 pt-4">
                {[
                  "Natural language meal logging",
                  "Verified Indian food database",
                  "Automatic macro calculation"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-foreground">
                    <Check className="w-4 h-4 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="lg:col-span-7 relative order-1 lg:order-2">
              <div className="bg-[#111216] rounded-2xl p-2 border border-white/[0.08] shadow-2xl relative overflow-hidden">
                 <div className="bg-[#1A1C23] rounded-xl border border-white/[0.04] p-6">
                   <div className="space-y-5 font-mono text-[13px]">
                     <div className="flex gap-3 items-start">
                       <span className="text-primary mt-0.5">{">"}</span>
                       <span className="text-white leading-relaxed">I had 2 masala dosas with sambar and coconut chutney for breakfast</span>
                     </div>
                     <div className="pl-6 border-l-2 border-primary/20 py-1 space-y-3">
                       <div className="flex justify-between items-center text-muted-foreground">
                         <span>Masala Dosa (2 medium)</span>
                         <span className="font-mono text-xs border border-white/10 px-2 py-0.5 rounded bg-white/5">360 kcal</span>
                       </div>
                       <div className="flex justify-between items-center text-muted-foreground">
                         <span>Sambar (1 bowl, ~150ml)</span>
                         <span className="font-mono text-xs border border-white/10 px-2 py-0.5 rounded bg-white/5">120 kcal</span>
                       </div>
                       <div className="flex justify-between items-center text-muted-foreground">
                         <span>Coconut Chutney (2 tbsp)</span>
                         <span className="font-mono text-xs border border-white/10 px-2 py-0.5 rounded bg-white/5">95 kcal</span>
                       </div>
                       <div className="w-full h-px bg-white/10 my-3" />
                       <div className="flex justify-between text-white font-semibold">
                         <span>Breakfast Total</span>
                         <span className="text-primary">575 kcal</span>
                       </div>
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE SECTION 2: Data Density Grid */}
        <section className="py-24 px-6 bg-[#111216]/50 border-y border-white/[0.04]">
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
                Your data, strictly organized.
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl">
                We present your metrics exactly how you need them. Track weight trends, macro adherence, and metabolic velocity without bloated, fake dashboards.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-[#1A1C23] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between hover:border-white/20 transition-colors">
                <div>
                  <Activity className="w-5 h-5 text-emerald-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Metabolic Velocity</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">Real-time adjustments to your total daily energy expenditure based on weigh-ins.</p>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-end justify-between">
                  <div>
                    <span className="block text-2xl font-bold text-white tracking-tight">2,450</span>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">Current TDEE</span>
                  </div>
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-[#1A1C23] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between hover:border-white/20 transition-colors">
                <div>
                  <AlertCircle className="w-5 h-5 text-orange-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Macro Adherence</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">See exactly which days you deviated from your prescribed protein and carb splits.</p>
                </div>
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex gap-1 h-8 items-end">
                    {[60, 80, 100, 95, 40, 100, 90].map((h, i) => (
                      <div key={i} className={`flex-1 rounded-sm ${h < 50 ? 'bg-rose-500' : h < 80 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold text-muted-foreground uppercase">
                    <span>Mon</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-[#1A1C23] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between hover:border-white/20 transition-colors">
                <div>
                  <Flame className="w-5 h-5 text-primary mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Dynamic Goal Routing</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">If you overeat on Friday, Calorix automatically re-routes your weekend macros to keep you on track.</p>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between bg-black/30 rounded-lg p-2.5 border border-white/5">
                    <span className="text-xs text-muted-foreground font-medium">Saturday Adj.</span>
                    <span className="text-xs font-bold text-rose-400">-150 kcal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="py-32 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-6">
              Ready to log your first meal?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Join thousands of users tracking Indian cuisine with precision. No complex setups, just accurate data.
            </p>
            <div className="flex justify-center">
              <SignedOut>
                <button onClick={() => openSignUp()} className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_8px_20px_-4px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 cursor-pointer">
                  Create free account <ChevronRight className="w-4 h-4" />
                </button>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard" className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2">
                  Go to Dashboard <ChevronRight className="w-4 h-4" />
                </Link>
              </SignedIn>
            </div>
          </div>
        </section>

      </main>

      {/* Clean Footer */}
      <footer className="py-8 border-t border-white/[0.04] px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Calorix Tracker</span>
          </div>
          <div className="text-xs text-muted-foreground/60 font-medium">
            &copy; {new Date().getFullYear()} Calorix. Handcrafted precision.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Micro-component for the Hero composition
function MacroBar({ label, current, max, color }) {
  const percent = Math.min(100, Math.round((current / max) * 100));
  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
        <span className={color.replace('bg-', 'text-')}>{label}</span>
        <span className="text-white/80">{current}<span className="text-white/40">/{max}g</span></span>
      </div>
      <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden w-full relative">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className={`absolute top-0 left-0 h-full rounded-full ${color}`} 
        />
      </div>
    </div>
  );
}
