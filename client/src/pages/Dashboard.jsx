import { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Utensils, Target, UserCircle, BarChart2, Flame, Plus, Bell, ChevronDown, Sun, Moon, CheckCheck, Droplets, Zap, TrendingUp, AlertTriangle, Dumbbell } from 'lucide-react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorBoundary from '@/components/ErrorBoundary';
import CalorixLogo from '@/components/CalorixLogo';
import Overview from './dashboard/Overview';
import Meals from './dashboard/Meals';
import Goals from './dashboard/Goals';
import Profile from './dashboard/Profile';
import Analytics from './dashboard/Analytics';
import Fitness from './dashboard/Fitness';
import api from '@/lib/api';

const NAV_ITEMS = [
  { path: '',          label: 'Overview',   icon: <LayoutDashboard size={16} /> },
  { path: 'meals',     label: 'Meals',      icon: <Utensils size={16} />        },
  { path: 'fitness',   label: 'Fitness',    icon: <Dumbbell size={16} />        },
  { path: 'goals',     label: 'Goals',      icon: <Target size={16} />          },
  { path: 'analytics', label: 'Analytics',  icon: <BarChart2 size={16} />       },
  { path: 'profile',   label: 'Profile',    icon: <UserCircle size={16} />      },
];

const BOTTOM_NAV = [
  { path: '',          label: 'Home',      icon: <LayoutDashboard size={20} /> },
  { path: 'meals',     label: 'Meals',     icon: <Utensils size={20} />        },
  { path: 'fitness',   label: 'Fitness',   icon: <Dumbbell size={20} />        },
  { path: 'analytics', label: 'Stats',     icon: <BarChart2 size={20} />       },
  { path: 'profile',   label: 'Profile',   icon: <UserCircle size={20} />      },
];

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readNotifs, setReadNotifs] = useState(() => JSON.parse(localStorage.getItem('calorix_read_notifs') || '[]'));
  const [streak, setStreak] = useState(3);
  const [consumedToday, setConsumedToday] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('calorix_theme') || 'light');

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

  useEffect(() => {
    if (user) {
      api.getMeals(user.id).then(res => {
        if (res.success && res.data) {
          const today = new Date().toISOString().split('T')[0];
          const todayMeals = res.data.filter(m => m.created_at?.startsWith(today));
          setConsumedToday(todayMeals.reduce((acc, curr) => acc + (curr.calories || 0), 0));
          setStreak(res.data.length > 0 ? 5 : 0);
        }
      });
    }
  }, [user, location.pathname]);

  const goal = profile?.calorie_target || 2000;
  const pct = Math.min((consumedToday / Math.max(goal, 1)) * 100, 100);

  // ── NOTIFICATIONS (must be before any early returns — Rules of Hooks) ─
  const notifications = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const items = [];

    // Calorie status
    if (pct >= 100) {
      items.push({ id: 'cal-over', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-500', bg: 'bg-red-50', title: 'Calorie limit reached!', body: `You've hit your ${goal} kcal goal for today. Great discipline!`, time: 'Now' });
    } else if (pct >= 80) {
      items.push({ id: 'cal-near', icon: <Flame className="w-4 h-4" />, color: 'text-orange-500', bg: 'bg-orange-50', title: 'Almost at your calorie goal', body: `${Math.round(goal - consumedToday)} kcal remaining for today.`, time: 'Now' });
    } else if (consumedToday === 0 && hour >= 10) {
      items.push({ id: 'cal-none', icon: <Zap className="w-4 h-4" />, color: 'text-[#3456c8]', bg: 'bg-[#e8effe]', title: 'No meals logged yet today', body: 'Start tracking your breakfast to hit your nutrition goal.', time: 'Today' });
    }

    // Hydration reminder
    if (hour >= 12) {
      items.push({ id: 'hydration', icon: <Droplets className="w-4 h-4" />, color: 'text-blue-500', bg: 'bg-blue-50', title: 'Stay hydrated!', body: `Your daily water target is ${((profile?.hydration_target || 2500) / 1000).toFixed(1)}L. Keep sipping!`, time: `${hour}:00` });
    }

    // Protein tip
    if (profile?.protein_target) {
      items.push({ id: 'protein', icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-600', bg: 'bg-green-50', title: 'Protein tip', body: `Your daily protein target is ${profile.protein_target}g. Add paneer or eggs to your next meal.`, time: 'Daily' });
    }

    // Streak
    if (streak > 0) {
      items.push({ id: 'streak', icon: <Flame className="w-4 h-4" />, color: 'text-amber-500', bg: 'bg-amber-50', title: `${streak}-day logging streak! 🔥`, body: 'Keep it up! Consistent tracking leads to better results.', time: `${streak}d` });
    }

    return items;
  }, [pct, goal, consumedToday, profile, streak]);

  const unreadCount = notifications.filter(n => !readNotifs.includes(n.id)).length;

  const markAllRead = () => {
    const ids = notifications.map(n => n.id);
    setReadNotifs(ids);
    localStorage.setItem('calorix_read_notifs', JSON.stringify(ids));
  };

  // ── EARLY RETURNS (after all hooks) ──────────────────────────
  if (!isLoaded || loadingProfile) {
    return (
      <div className="min-h-screen bg-[#f4f6fa] flex flex-col">
        <div className="bg-white border-b border-[#edf0f7] px-8 py-4 flex items-center gap-4">
          <Skeleton className="h-7 w-32 bg-[#edf0f7] rounded-full" />
          <Skeleton className="h-8 w-64 bg-[#edf0f7] rounded-full ml-8" />
        </div>
        <div className="flex-1 p-8 space-y-4">
          <Skeleton className="h-40 w-full bg-[#edf0f7] rounded-[20px]" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 bg-[#edf0f7] rounded-[20px]" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#f4f6fa] flex flex-col" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* ── TOP HEADER ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#edf0f7] shadow-sm px-6 lg:px-10 py-3 flex items-center gap-4">

        {/* Brand — new logo */}
        <div className="cursor-pointer mr-2 flex-shrink-0" onClick={() => navigate('/dashboard')}>
          <CalorixLogo size={34} textClass="text-base text-[#12266e]" />
        </div>

        {/* Nav Pills */}
        <nav className="hidden md:flex items-center gap-1 bg-[#f4f6fa] rounded-full px-2 py-1.5 border border-[#edf0f7]">
          {NAV_ITEMS.map((item) => {
            const href = `/dashboard${item.path ? `/${item.path}` : ''}`;
            const isActive = location.pathname === href || (item.path === '' && location.pathname === '/dashboard');
            return (
              <Link
                key={item.path}
                to={href}
                className={`xh-nav-item text-xs ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3 ml-auto">

          {/* Calorie widget */}
          <div className="hidden md:flex items-center gap-3 bg-[#f4f6fa] border border-[#edf0f7] rounded-full px-4 py-2">
            <Flame className="w-4 h-4 text-[#12266e]" />
            <div>
              <p className="text-xs font-semibold text-[#0E1929]">
                {consumedToday} <span className="text-[#9aa0b0] font-normal">/ {goal} kcal</span>
              </p>
            </div>
            <div className="w-20 h-1.5 bg-[#edf0f7] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: consumedToday > goal ? '#ef4444' : 'linear-gradient(90deg, #3456c8, #12266e)' }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Add Meal */}
          <button
            onClick={() => navigate('/dashboard/meals')}
            className="xh-btn text-sm py-2 px-4 hidden sm:flex"
          >
            <Plus className="w-4 h-4" /> Add Meal
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full bg-[#f4f6fa] border border-[#edf0f7] flex items-center justify-center text-[#5a6478] hover:bg-[#e8effe] hover:text-[#12266e] transition-colors cursor-pointer"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 text-[#12266e]" /> : <Sun className="w-4 h-4 text-[#fbbf24]" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(o => !o); setQuickMenuOpen(false); }}
              className="w-9 h-9 rounded-full bg-[#f4f6fa] border border-[#edf0f7] flex items-center justify-center relative text-[#5a6478] hover:bg-[#e8effe] hover:text-[#12266e] transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-[#3456c8] text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-[min(320px,calc(100vw-1.5rem))] bg-white rounded-2xl border border-[#edf0f7] shadow-2xl z-40 overflow-hidden"
                  >
                    {/* Panel header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#edf0f7] bg-[#f4f6fa]">
                      <div>
                        <p className="text-sm font-bold text-[#0E1929]">Notifications</p>
                        <p className="text-xs text-[#9aa0b0]">{unreadCount} unread</p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="flex items-center gap-1 text-xs font-semibold text-[#3456c8] hover:text-[#12266e] transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-[#f0f2f8]">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center text-sm text-[#9aa0b0]">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map(n => {
                          const isRead = readNotifs.includes(n.id);
                          return (
                            <div
                              key={n.id}
                              onClick={() => {
                                const updated = [...new Set([...readNotifs, n.id])];
                                setReadNotifs(updated);
                                localStorage.setItem('calorix_read_notifs', JSON.stringify(updated));
                              }}
                              className={`flex gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-[#f8f9ff] ${isRead ? 'opacity-60' : ''}`}
                            >
                              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${n.bg} ${n.color}`}>
                                {n.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-xs font-semibold text-[#0E1929] leading-snug ${!isRead ? 'font-bold' : ''}`}>{n.title}</p>
                                  <span className="text-[10px] text-[#9aa0b0] whitespace-nowrap flex-shrink-0">{n.time}</span>
                                </div>
                                <p className="text-xs text-[#5a6478] mt-0.5 leading-relaxed">{n.body}</p>
                              </div>
                              {!isRead && <div className="w-2 h-2 rounded-full bg-[#3456c8] flex-shrink-0 mt-1.5" />}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-[#edf0f7] bg-[#f4f6fa]">
                      <Link
                        to="/dashboard"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs font-semibold text-[#3456c8] hover:text-[#12266e] transition-colors"
                      >
                        View Dashboard →
                      </Link>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Quick stats dropdown */}
          <div className="relative">
            <button
              onClick={() => setQuickMenuOpen(!quickMenuOpen)}
              className="w-9 h-9 rounded-full bg-[#f4f6fa] border border-[#edf0f7] flex items-center justify-center text-[#5a6478] hover:bg-[#e8effe] hover:text-[#12266e] transition-colors cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {quickMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setQuickMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-[#edf0f7] shadow-xl z-40 overflow-hidden"
                  >
                    <div className="p-4 border-b border-[#edf0f7] bg-[#f4f6fa]">
                      <p className="xh-label mb-1">Active Goals</p>
                      <p className="text-sm font-bold text-[#0E1929]">{profile?.goal_type || 'Active Target'}</p>
                    </div>
                    <div className="p-4 space-y-3">
                      {[
                        ['Calorie Target', `${profile?.calorie_target || 2000} kcal`],
                        ['Protein Target', `${profile?.protein_target || 150}g`],
                        ['Water Target',   `${(profile?.hydration_target || 2500) / 1000}L`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between">
                          <span className="text-sm text-[#5a6478] font-medium">{k}</span>
                          <span className="text-sm font-bold text-[#12266e]">{v}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User */}
          <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-8 h-8 shadow-sm' } }} />
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 p-4 pb-20 md:p-6 lg:p-8 min-h-0">
        <ErrorBoundary>
          <Routes>
            <Route path=""          element={<Overview   profile={profile} user={user} />} />
            <Route path="meals"     element={<Meals      profile={profile} user={user} />} />
            <Route path="fitness"   element={<Fitness    profile={profile} user={user} />} />
            <Route path="goals"     element={<Goals      profile={profile} user={user} onProfileUpdate={refreshProfile} />} />
            <Route path="analytics" element={<Analytics  profile={profile} user={user} />} />
            <Route path="profile"   element={<Profile    profile={profile} user={user} onProfileUpdate={refreshProfile} />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#edf0f7] shadow-lg pb-safe">
        <div className="flex items-center px-2 py-2">
          {BOTTOM_NAV.map((item) => {
            const href = `/dashboard${item.path ? `/${item.path}` : ''}`;
            const isActive = location.pathname === href || (item.path === '' && location.pathname === '/dashboard');
            return (
              <Link
                key={item.path}
                to={href}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-2xl text-[9px] font-semibold transition-all ${
                  isActive ? 'text-[#12266e] bg-[#e8effe]' : 'text-[#9aa0b0] hover:text-[#12266e]'
                }`}
                style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
              >
                <span className={isActive ? 'text-[#12266e]' : 'text-[#c8d0e0]'}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
