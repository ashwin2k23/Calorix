import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Utensils, Target, Sparkles, UserCircle, Menu, X, BarChart2, Flame, Award, Lightbulb, Zap, ChevronLeft, ChevronRight, Bell, Search, Plus } from 'lucide-react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorBoundary from '@/components/ErrorBoundary';
import Overview from './dashboard/Overview';
import Meals from './dashboard/Meals';
import Goals from './dashboard/Goals';
import Profile from './dashboard/Profile';
import Analytics from './dashboard/Analytics';
import api from '@/lib/api';

const NAV_ITEMS = [
  { path: '',          label: 'Overview',   icon: <LayoutDashboard size={18} /> },
  { path: 'meals',     label: 'Meals',      icon: <Utensils size={18} />        },
  { path: 'goals',     label: 'Goals',      icon: <Target size={18} />          },
  { path: 'analytics', label: 'Analytics',  icon: <BarChart2 size={18} />       },
  { path: 'profile',   label: 'Profile',    icon: <UserCircle size={18} />      },
];

const BOTTOM_NAV = [
  { path: '',          label: 'Home',      icon: <LayoutDashboard size={20} /> },
  { path: 'meals',     label: 'Meals',     icon: <Utensils size={20} />        },
  { path: 'analytics', label: 'Stats',     icon: <BarChart2 size={20} />       },
  { path: 'profile',   label: 'Profile',   icon: <UserCircle size={20} />      },
];

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Real-time metrics simulation
  const [streak, setStreak] = useState(3); 
  const [consumedToday, setConsumedToday] = useState(0);

  const refreshProfile = useCallback(async () => {
    if (!isLoaded || !user) return;
    try {
      const data = await api.getUser(user.id);
      if (data.success && data.data?.onboarding_completed) {
        localStorage.setItem('calorix_profile', JSON.stringify(data.data));
        setProfile(data.data);
      } else {
        localStorage.removeItem('calorix_profile');
        navigate('/onboarding');
      }
    } catch (err) {
      const stored = localStorage.getItem('calorix_profile');
      if (stored) {
        const parsedProfile = JSON.parse(stored);
        setProfile(parsedProfile);
        api.saveUser({ ...parsedProfile, clerk_user_id: user.id }).catch(() => {});
      } else {
        navigate('/onboarding');
      }
    } finally {
      setLoadingProfile(false);
    }
  }, [isLoaded, user, navigate]);

  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  // Fetch quick metrics for sidebar
  useEffect(() => {
    if (user) {
      api.getMeals(user.id).then(res => {
        if(res.success && res.data) {
          const today = new Date().toISOString().split('T')[0];
          const todayMeals = res.data.filter(m => m.created_at?.startsWith(today));
          setConsumedToday(todayMeals.reduce((acc, curr) => acc + (curr.calories || 0), 0));
          setStreak(res.data.length > 0 ? 5 : 0); // Simplified for this demo
        }
      });
    }
  }, [user, location.pathname]); // Refresh when navigating

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  if (!isLoaded || loadingProfile) {
    return (
      <div className="min-h-screen bg-[#090B14] flex">
        <aside className="w-[280px] border-r border-white/5 bg-[#111827]/60 backdrop-blur-xl p-6 hidden md:flex flex-col">
          <Skeleton className="h-8 w-32 mb-10 bg-white/5" />
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl bg-white/5" />)}
          </div>
        </aside>
        <main className="flex-1 p-10 bg-[#090B14]"><Skeleton className="h-full rounded-3xl bg-white/5" /></main>
      </div>
    );
  }

  if (!profile) return null;

  const goal = profile?.calorie_target || 2000;
  const pct = Math.min((consumedToday / Math.max(goal, 1)) * 100, 100);

  const SidebarContent = ({ collapsed = false }) => (
    <div className="flex flex-col h-full select-none">
      {/* Brand Logo Header */}
      <div className={`flex items-center gap-3 mb-8 pl-2 transition-all duration-300 ${collapsed ? 'justify-center pl-0' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-transform duration-300 hover:scale-105">
          <Flame className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-xl font-black tracking-tight text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Calorix
          </span>
        )}
      </div>

      {/* Mini Product Status Widget */}
      {!collapsed && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 px-4 py-4 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner relative overflow-hidden group cursor-pointer hover:border-white/10 transition-colors" 
          onClick={() => navigate('/dashboard')}
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-violet-600/10 rounded-full blur-xl group-hover:bg-violet-600/20 transition-colors" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Today</span>
            </div>
            <span className="text-xs font-black text-white">{consumedToday} <span className="text-slate-500 font-semibold">/ {goal}</span></span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative z-10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              className={`h-full rounded-full bg-gradient-to-r ${consumedToday > goal ? 'from-rose-500 to-red-400' : 'from-violet-500 to-indigo-500'}`} 
            />
          </div>
        </motion.div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 relative">
        {NAV_ITEMS.map((item) => {
          const href = `/dashboard${item.path ? `/${item.path}` : ''}`;
          const isActive = location.pathname === href || (item.path === '' && location.pathname === '/dashboard');
          
          return (
            <Link key={item.path} to={href} className="relative block group">
              {isActive && (
                <>
                  {/* Glowing left bar */}
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-gradient-to-b from-violet-500 to-indigo-500 shadow-[0_0_10px_rgba(139,92,246,0.8)] z-20"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                  {/* Backdrop highlight */}
                  <motion.div
                    layoutId="activeNavBackground"
                    className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-indigo-600/5 to-transparent border-l border-t border-b border-white/[0.04] rounded-xl backdrop-blur-md"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </>
              )}
              <motion.div 
                whileHover={{ x: collapsed ? 0 : 4 }}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-semibold z-10 ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.01]'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <div className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]' : 'text-slate-400 group-hover:text-white'}`}>
                  {item.icon}
                </div>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.path === 'planner' && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Gamification Stats */}
      {!collapsed && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 space-y-2 py-4 border-t border-white/[0.04]"
        >
          <div className="flex items-center gap-3 px-3 py-1.5 text-xs text-slate-400 font-bold hover:text-white transition-colors">
            <Award className="w-4 h-4 text-orange-400" />
            <span>{streak} Day Streak</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-1.5 text-xs text-slate-400 font-bold hover:text-white transition-colors">
            <Lightbulb className="w-4 h-4 text-violet-400" />
            <span>AI Assistant Active</span>
          </div>
        </motion.div>
      )}

      {/* User Button Info Card */}
      <div
        className={`mt-auto relative flex items-center transition-all duration-300 ${
          collapsed 
            ? 'flex-col gap-2 p-1 bg-transparent border-none' 
            : 'gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md shadow-lg hover:bg-white/[0.04] hover:border-white/10 group cursor-pointer'
        }`}
        onClick={() => !collapsed && navigate('/dashboard/profile')}
      >
        <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-violet-500 via-indigo-500 to-cyan-500 shadow-md transition-transform duration-300 group-hover:scale-105">
          <div className="bg-slate-950 p-[2px] rounded-full flex items-center justify-center">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-9 h-9 shadow-sm' } }} />
          </div>
        </div>
        {!collapsed && (
          <div className="overflow-hidden flex-1 select-none">
            <p className="text-sm font-bold truncate text-white group-hover:text-violet-400 transition-colors">
              {user?.fullName || 'User'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] uppercase tracking-wider text-slate-500 truncate font-black">
                {profile.goal_type || 'Active'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#090B14] flex flex-col selection:bg-indigo-500/30">
      {/* Top Navigation Header */}
      <header className="w-full sticky top-0 z-20 border-b border-white/[0.05] bg-[#090B14]/80 backdrop-blur-md px-8 py-4 flex items-center justify-between select-none">
        {/* Left Brand Area */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.3)] transition-all duration-300 hover:scale-105">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              Calorix
            </span>
          </div>

          {/* Search bar inside header */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-colors w-48 xl:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search or command..." 
              className="bg-transparent border-none text-[11px] text-white placeholder-slate-500 focus:outline-none w-full"
              readOnly
              onClick={() => navigate('/dashboard/meals')}
            />
          </div>
        </div>

        {/* Center Horizontal Menu */}
        <nav className="hidden md:flex items-center gap-1.5 relative">
          {NAV_ITEMS.map((item) => {
            const href = `/dashboard${item.path ? `/${item.path}` : ''}`;
            const isActive = location.pathname === href || (item.path === '' && location.pathname === '/dashboard');
            
            return (
              <Link key={item.path} to={href} className="relative block group">
                {isActive && (
                  <motion.div
                    layoutId="activeNavBackground"
                    className="absolute inset-0 bg-white/[0.03] border border-white/[0.04] rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={`relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 text-xs font-semibold ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.01]'
                }`}>
                  <div className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'text-slate-400 group-hover:text-white'}`}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Right Side Control Bar */}
        <div className="flex items-center gap-4">
          {/* Mini Hydration/Calorie overview widget */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/[0.01] border border-white/5">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Today</span>
            <span className="text-xs font-black text-white">{consumedToday} <span className="text-slate-500 font-semibold">/ {goal}</span></span>
            <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                className={`h-full rounded-full bg-gradient-to-r ${consumedToday > goal ? 'from-rose-500 to-red-400' : 'from-indigo-500 to-violet-600'}`} 
              />
            </div>
          </div>

          {/* Quick Add Meal Button */}
          <button 
            onClick={() => navigate('/dashboard/meals')}
            className="hidden sm:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full transition-all duration-300 shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:scale-102 hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Meal</span>
          </button>

          {/* Notifications button */}
          <button className="relative p-2 text-slate-400 hover:text-white transition-colors cursor-pointer bg-white/[0.02] border border-white/5 rounded-full">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
          </button>

          {/* User Button */}
          <div className="flex items-center gap-2 pl-1 border-l border-white/5">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-7.5 h-7.5 shadow-md border border-white/10 hover:scale-105 transition-all' } }} />
          </div>

          {/* 3-Dots Docker Trigger Button */}
          <div className="relative">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer"
            >
              <div className="flex flex-col gap-1 w-4 items-center py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>
            </button>

            {/* Docker Dropdown Menu */}
            <AnimatePresence>
              {sidebarOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSidebarOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/[0.08] bg-[#0b0e14]/95 backdrop-blur-xl p-4 shadow-2xl z-40 space-y-4"
                  >
                    <div className="pb-3 border-b border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Goals</p>
                      <p className="text-sm font-black text-white mt-1">{profile?.goal_type || 'Active Target'}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>Calorie Target</span>
                        <span className="text-white">{profile?.calorie_target || 2000} kcal</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>Protein Target</span>
                        <span className="text-white">{profile?.protein_target || 150}g</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>Water Target</span>
                        <span className="text-white">{(profile?.hydration_target || 2500) / 1000}L</span>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 lg:p-12 overflow-y-auto min-h-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/5 via-[#090B14] to-[#090B14]">
        <ErrorBoundary>
          <Routes>
            <Route path=""          element={<Overview   profile={profile} user={user} />} />
            <Route path="meals"     element={<Meals      profile={profile} user={user} />} />
            <Route path="goals"     element={<Goals      profile={profile} user={user} onProfileUpdate={refreshProfile} />} />
            <Route path="analytics" element={<Analytics  profile={profile} user={user} />} />
            <Route path="profile"   element={<Profile    profile={profile} user={user} onProfileUpdate={refreshProfile} />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#090B14]/85 backdrop-blur-xl border-t border-white/[0.05] px-2 py-2 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around">
          {BOTTOM_NAV.map((item) => {
            const href = `/dashboard${item.path ? `/${item.path}` : ''}`;
            const isActive = location.pathname === href || (item.path === '' && location.pathname === '/dashboard');
            return (
              <Link
                key={item.path}
                to={href}
                className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 min-w-0 flex-1 ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavActive"
                    className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/10 rounded-2xl -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={`transition-all duration-300 ${isActive ? 'scale-110 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''}`}>
                  {item.icon}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider truncate ${isActive ? 'text-indigo-400' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
