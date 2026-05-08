import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Utensils, Target, Sparkles, UserCircle, Menu, X, BarChart2, MessageSquare } from 'lucide-react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorBoundary from '@/components/ErrorBoundary';
import Overview from './dashboard/Overview';
import Meals from './dashboard/Meals';
import Goals from './dashboard/Goals';
import AIPlanner from './dashboard/AIPlanner';
import Profile from './dashboard/Profile';
import Assistant from './dashboard/Assistant';
import Analytics from './dashboard/Analytics';
import api from '@/lib/api';

const NAV_ITEMS = [
  { path: '',          label: 'Overview',   icon: <LayoutDashboard size={18} /> },
  { path: 'meals',     label: 'Meals',      icon: <Utensils size={18} />        },
  { path: 'goals',     label: 'Goals',      icon: <Target size={18} />          },
  { path: 'planner',   label: 'AI Planner', icon: <Sparkles size={18} />        },
  { path: 'assistant', label: 'AI Chat',    icon: <MessageSquare size={18} />   },
  { path: 'analytics', label: 'Analytics',  icon: <BarChart2 size={18} />       },
  { path: 'profile',   label: 'Profile',    icon: <UserCircle size={18} />      },
];

// Bottom nav shows only the 5 most important items on mobile
const BOTTOM_NAV = [
  { path: '',          label: 'Home',      icon: <LayoutDashboard size={20} /> },
  { path: 'meals',     label: 'Meals',     icon: <Utensils size={20} />        },
  { path: 'assistant', label: 'AI Chat',   icon: <MessageSquare size={20} />   },
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
    } catch {
      const stored = localStorage.getItem('calorix_profile');
      if (stored) {
        setProfile(JSON.parse(stored));
      } else {
        navigate('/onboarding');
      }
    } finally {
      setLoadingProfile(false);
    }
  }, [isLoaded, user, navigate]);

  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  // Close sidebar when route changes
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  if (!isLoaded || loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex flex-col md:flex-row">
        <aside className="w-64 border-r border-white/10 bg-card/30 p-6 hidden md:flex flex-col">
          <Skeleton className="h-8 w-32 mb-10" />
          <div className="space-y-2">
            {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
          </div>
        </aside>
        <main className="flex-1 p-6 md:p-10">
          <Skeleton className="h-10 w-64 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <Skeleton className="h-40 rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!profile) return null;

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2 mb-10">
        <span className="text-2xl">🔥</span>
        <span className="text-xl font-extrabold bg-gradient-to-r from-primary to-[#00c2ff] bg-clip-text text-transparent">
          Calorix
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const href = `/dashboard${item.path ? `/${item.path}` : ''}`;
          const isActive = location.pathname === href;
          return (
            <Link key={item.path} to={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,232,122,0.08)]'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}>
              {item.icon}
              <span className="font-medium">{item.label}</span>
              {item.path === 'assistant' && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-[#00c2ff]/15 border border-[#00c2ff]/30 text-[#00c2ff] font-semibold">NEW</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div
        className="mt-8 flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5 cursor-pointer hover:border-white/10 transition-all group"
        onClick={() => navigate('/dashboard/profile')}
      >
        <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-9 h-9' } }} />
        <div className="overflow-hidden flex-1">
          <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">{user?.fullName || 'User'}</p>
          <p className="text-xs text-muted-foreground truncate">{profile.goal_type}</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-white/10 bg-card/30 backdrop-blur-md p-6 flex-col h-screen sticky top-0 z-10">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-card/30 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <span className="text-lg font-extrabold bg-gradient-to-r from-primary to-[#00c2ff] bg-clip-text text-transparent">Calorix</span>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-72 bg-background border-r border-white/10 p-6 flex flex-col z-40 md:hidden"
            >
              <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5">
                <X size={18} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto min-h-0 pb-24 md:pb-10">
        <ErrorBoundary>
          <Routes>
            <Route path=""          element={<Overview   profile={profile} user={user} onProfileUpdate={refreshProfile} />} />
            <Route path="meals"     element={<Meals      profile={profile} user={user} />} />
            <Route path="goals"     element={<Goals      profile={profile} user={user} onProfileUpdate={refreshProfile} />} />
            <Route path="planner"   element={<AIPlanner  profile={profile} />} />
            <Route path="assistant" element={<Assistant  profile={profile} />} />
            <Route path="analytics" element={<Analytics  profile={profile} user={user} />} />
            <Route path="profile"   element={<Profile    profile={profile} user={user} onProfileUpdate={refreshProfile} />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-lg border-t border-white/10 px-2 py-2 pb-safe">
        <div className="flex items-center justify-around">
          {BOTTOM_NAV.map((item) => {
            const href = `/dashboard${item.path ? `/${item.path}` : ''}`;
            const isActive = location.pathname === href;
            return (
              <Link
                key={item.path}
                to={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-0 flex-1 ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className={`transition-all ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </div>
                <span className={`text-[10px] font-medium truncate ${isActive ? 'text-primary' : ''}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
