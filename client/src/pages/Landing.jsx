import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, ArrowRight, Check, TrendingUp, Activity, Target, ChevronRight, Zap, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, useClerk, useUser } from '@clerk/clerk-react';
import api from '@/lib/api';
import athleteImg from '../assets/athlete.jpg';
import CalorixLogo from '@/components/CalorixLogo';


const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] } }),
};

export default function Landing() {
  const { openSignIn, openSignUp } = useClerk();
  const { user } = useUser();
  const [meals, setMeals] = useState([]);
  const [profile, setProfile] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('calorix_theme') || 'light');

  useEffect(() => {
    if (user) {
      api.getMeals(user.id).then(res => {
        if (res.success && res.data) setMeals(res.data);
      }).catch(() => {});
      api.getUser(user.id).then(res => {
        if (res.success && res.data) setProfile(res.data);
      }).catch(() => {});
    }
  }, [user]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('calorix_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const TODAY = new Date().toISOString().split('T')[0];
  const consumedToday = meals.filter(m => m.created_at?.startsWith(TODAY)).reduce((a, m) => a + (m.calories || 0), 0);
  const goal = profile?.calorie_target || 2000;
  const pct = Math.min((consumedToday / Math.max(goal, 1)) * 100, 100);

  const weeklyCals = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return meals.filter(m => m.created_at?.startsWith(dateStr)).reduce((s, m) => s + (m.calories || 0), 0);
  });

  const maxCal = Math.max(...weeklyCals, goal, 1);
  const hasRealData = meals.length > 0;

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-[#0E1929]"
         style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* ── NAVBAR ── */}
      <nav className="flex items-center justify-between px-6 lg:px-12 py-5 max-w-[1400px] mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          <CalorixLogo size={36} textClass="text-xl text-[#12266e]" />
        </div>

        {/* CTA & Theme toggle */}
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2.5 rounded-full border border-[#edf0f7] hover:bg-[#e8effe] text-[#12266e] transition-colors flex items-center justify-center bg-white" title="Toggle Theme">
            {theme === 'light' ? <Moon className="w-4.5 h-4.5 text-[#12266e]" /> : <Sun className="w-4.5 h-4.5 text-[#fbbf24]" />}
          </button>
          <SignedIn>
            <Link to="/dashboard" className="xh-btn">
              Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </SignedIn>
          <SignedOut>
            <button onClick={() => openSignIn()}
              className="xh-btn-ghost text-sm font-medium text-[#5a6478] hover:text-[#12266e]">
              Log in
            </button>
            <button onClick={() => openSignUp()} className="xh-btn">
              Join Now!
            </button>
          </SignedOut>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="px-4 sm:px-6 lg:px-12 pt-6 pb-14 max-w-[1400px] mx-auto">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center">

          {/* Left column */}
          <div className="lg:col-span-5 space-y-6 pt-4">
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
              <h1 className="text-[2.2rem] sm:text-[2.8rem] lg:text-[4rem] font-bold leading-[1.1] tracking-[-0.02em] text-[#0E1929]">
                Track Your Diet.{' '}
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-12 h-8 rounded-lg bg-[#e8effe] align-middle" />
                </span>
                <br />
                Skip the <span style={{
                  background: 'linear-gradient(135deg, #3456c8, #12266e)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>Guesswork.</span>
              </h1>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0.5}>
              <p className="text-base sm:text-lg text-[#5a6478] leading-relaxed max-w-md">
                Calorix is the smart, minimalist nutrition tracker that handles macros, daily calorie targets, and hydration logs seamlessly, without the complexity.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1} className="pt-2">
              {user ? (
                <Link to="/dashboard" className="xh-btn py-3.5 px-8 text-base inline-flex">
                  Go to Dashboard <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <div className="flex items-center gap-4">
                  <button onClick={() => openSignUp()} className="xh-btn py-3.5 px-8 text-base shadow-lg">
                    Get Started Free
                  </button>
                  <button onClick={() => openSignIn()} className="text-sm font-semibold text-[#5a6478] hover:text-[#12266e] transition-colors">
                    Sign In
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right column — hero image card */}
          <motion.div className="hidden sm:block lg:col-span-7 relative"
            variants={fadeUp} initial="hidden" animate="show" custom={1}>
            {user ? (
              <div className="rounded-[28px] overflow-hidden relative flex flex-col justify-between p-6"
                   style={{ background: 'linear-gradient(145deg, #c8d8f8 0%, #8fb3f0 50%, #3456c8 100%)', minHeight: 540 }}>

                {/* Top Row: badge */}
                <div className="flex items-center justify-between z-10 w-full">
                  <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
                    <Activity className="w-4 h-4 text-[#12266e]" />
                    <span className="text-sm font-semibold text-[#12266e]">{meals.length} Meals Logged</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md">
                    <span className="text-sm font-semibold text-[#0E1929]">{profile?.goal_type || 'Smart Nutrition Plan'}</span>
                    <div className="w-7 h-7 rounded-full bg-[#12266e] flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✦</span>
                    </div>
                  </div>
                </div>

                {/* Central high-fidelity visual dashboard widget */}
                <div className="flex flex-col items-center justify-center flex-1 py-4 text-white z-10">
                  <div className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Weekly Calorie Deficit</p>
                        <h4 className="text-xl font-bold text-white mt-0.5">{(consumedToday - goal).toLocaleString()} kcal</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-green-400/20 text-green-300 text-xs font-bold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Live
                      </span>
                    </div>

                    {/* Mock/Real Chart SVG */}
                    <div className="h-28 w-full relative">
                      <svg viewBox="0 0 300 100" className="w-full h-full">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d="M 0 80 Q 50 60 100 40 T 200 70 T 300 30 L 300 100 L 0 100 Z" fill="url(#chartGrad)" />
                        <path d="M 0 80 Q 50 60 100 40 T 200 70 T 300 30" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="100" cy="40" r="4" fill="#ffffff" />
                        <circle cx="200" cy="70" r="4" fill="#ffffff" />
                        <circle cx="300" cy="30" r="4" fill="#ffffff" />
                      </svg>
                    </div>

                    {/* Macro Progress Row */}
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { l: 'Protein', v: `${Math.round(meals.filter(m => m.created_at?.startsWith(TODAY)).reduce((s,m)=>s+(m.protein||0),0))}g`, pct: Math.min((meals.filter(m => m.created_at?.startsWith(TODAY)).reduce((s,m)=>s+(m.protein||0),0) / 150) * 100, 100) },
                        { l: 'Carbs', v: `${Math.round(meals.filter(m => m.created_at?.startsWith(TODAY)).reduce((s,m)=>s+(m.carbs||0),0))}g`, pct: Math.min((meals.filter(m => m.created_at?.startsWith(TODAY)).reduce((s,m)=>s+(m.carbs||0),0) / 250) * 100, 100) },
                        { l: 'Fats', v: `${Math.round(meals.filter(m => m.created_at?.startsWith(TODAY)).reduce((s,m)=>s+(m.fats||0),0))}g`, pct: Math.min((meals.filter(m => m.created_at?.startsWith(TODAY)).reduce((s,m)=>s+(m.fats||0),0) / 80) * 100, 100) },
                      ].map(macro => (
                        <div key={macro.l} className="bg-white/5 rounded-xl p-2.5 border border-white/5 text-center">
                          <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">{macro.l}</p>
                          <p className="text-[11px] font-bold text-white mt-0.5">{macro.v}</p>
                          <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full rounded-full bg-white" style={{ width: `${macro.pct || 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: CTA buttons & logged stats */}
                <div className="flex items-center justify-between z-10 w-full mt-2">
                  <div className="bg-white rounded-2xl p-4 shadow-lg min-w-[170px]">
                    <p className="text-xl font-bold text-[#0E1929]">
                      {consumedToday.toLocaleString()}
                      <span className="text-[#9aa0b0] text-sm font-normal ml-1">kcal</span>
                    </p>
                    <p className="text-[10px] text-[#5a6478] font-semibold">Logged today</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[
                      { label: 'Protein', color: '#12266e' },
                      { label: 'Calories', color: '#3456c8' },
                      { label: 'Hydration', color: '#8fb3f0' },
                    ].map((item) => (
                      <div key={item.label}
                        className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-white text-xs font-semibold shadow-md cursor-pointer hover:scale-105 transition-transform"
                        style={{ background: item.color }}>
                        <span className="w-4.5 h-4.5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">+</span>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="rounded-[28px] overflow-hidden relative shadow-lg min-h-[540px]">
                <img src={athleteImg} alt="Calorix Health Athlete" className="w-full h-[540px] object-cover" />
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── NLP FEATURE ── */}
      <section className="py-20 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="xh-card-navy p-10 md:p-14 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium">
              <Flame className="w-4 h-4 text-orange-300" /> NLP Meal Logging
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
              Stop entering<br />ingredients manually.
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              Just type what you ate — "2 masala dosas with sambar for breakfast" — and Calorix understands exact Indian portion sizes and calculates macros instantly.
            </p>
            <ul className="space-y-3">
              {['Natural language meal logging', 'Verified Indian food database', 'Automatic macro calculation'].map(item => (
                <li key={item} className="flex items-center gap-3 text-white/90 text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <SignedOut>
              <button onClick={() => openSignUp()}
                className="mt-2 bg-white text-[#12266e] rounded-full font-bold px-7 py-3.5 text-sm hover:bg-[#f0f5ff] transition-colors inline-flex items-center gap-2 shadow-lg">
                Start Tracking Free <ArrowRight className="w-4 h-4" />
              </button>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard"
                className="mt-2 bg-white text-[#12266e] rounded-full font-bold px-7 py-3.5 text-sm hover:bg-[#f0f5ff] transition-colors inline-flex items-center gap-2 shadow-lg">
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </SignedIn>
          </div>

          {/* Terminal mock */}
          <div className="bg-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-5">
              {[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full bg-white/20" />)}
            </div>
            <div className="space-y-4 font-mono text-sm">
              <div className="flex gap-3 items-start">
                <span className="text-white/40">›</span>
                <span className="text-white leading-relaxed">2 masala dosas with sambar and coconut chutney</span>
              </div>
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                {[
                  ['Masala Dosa (2)', '360 kcal'],
                  ['Sambar (~150ml)', '120 kcal'],
                  ['Coconut Chutney', '95 kcal'],
                ].map(([label, cal]) => (
                  <div key={label} className="flex justify-between items-center text-white/70">
                    <span>{label}</span>
                    <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-xs">{cal}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-3 flex justify-between font-semibold text-white">
                  <span>Breakfast Total</span>
                  <span className="text-[#8fb3f0]">575 kcal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto text-center">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <div className="xh-badge mx-auto mb-6">Ready to start?</div>
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-[-0.03em] text-[#0E1929] mb-6">
            Log your first meal today.
          </h2>
          <p className="text-[#5a6478] text-lg mb-10 max-w-xl mx-auto">
            Join thousands tracking Indian cuisine with precision. No complex setups, just accurate data.
          </p>
          <SignedOut>
            <button onClick={() => openSignUp()} className="xh-btn text-base px-8 py-4">
              Create Free Account <ChevronRight className="w-5 h-5" />
            </button>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard" className="xh-btn text-base px-8 py-4">
              Go to Dashboard <ChevronRight className="w-5 h-5" />
            </Link>
          </SignedIn>
          <p className="text-[#9aa0b0] text-sm mt-4 font-medium">Free forever · No credit card</p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#edf0f7] py-8 px-4 sm:px-6 lg:px-12">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <CalorixLogo size={28} textClass="text-sm text-[#12266e]" />
          <p className="text-sm text-[#9aa0b0] font-medium text-center">
            © {new Date().getFullYear()} Calorix. Handcrafted precision.
          </p>
        </div>
      </footer>
    </div>
  );
}
