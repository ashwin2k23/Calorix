import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Utensils, Target, Sparkles, UserCircle } from 'lucide-react';
import { useUser, UserButton } from '@clerk/clerk-react';
import Overview from './dashboard/Overview';
import Meals from './dashboard/Meals';
import Goals from './dashboard/Goals';
import AIPlanner from './dashboard/AIPlanner';
import Profile from './dashboard/Profile';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isLoaded || !user) return;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/${user.id}`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.onboarding_completed) {
          // Sync to localStorage for fast initial loads in children
          localStorage.setItem('calorix_profile', JSON.stringify(data.data));
          setProfile(data.data);
        } else {
          // Needs onboarding
          localStorage.removeItem('calorix_profile');
          navigate('/onboarding');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to local storage if server is down temporarily
        const storedProfile = localStorage.getItem('calorix_profile');
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        } else {
          navigate('/onboarding');
        }
      }
    };

    fetchProfile();
  }, [isLoaded, user, navigate]);

  const navItems = [
    { path: '', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { path: 'meals', label: 'Meals', icon: <Utensils size={20} /> },
    { path: 'goals', label: 'Goals', icon: <Target size={20} /> },
    { path: 'planner', label: 'AI Planner', icon: <Sparkles size={20} /> },
    { path: 'profile', label: 'Profile', icon: <UserCircle size={20} /> },
  ];

  if (!isLoaded || !profile) return <div className="min-h-screen bg-background flex items-center justify-center">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-white/10 bg-card/30 backdrop-blur-md p-6 flex flex-col h-auto md:h-screen sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-10">
          <span className="text-2xl">🔥</span>
          <span className="text-xl font-extrabold bg-gradient-to-r from-primary to-[#00c2ff] bg-clip-text text-transparent">
            Calorix
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === `/dashboard${item.path ? `/${item.path}` : ''}`;
            return (
              <Link
                key={item.path}
                to={`/dashboard${item.path ? `/${item.path}` : ''}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,232,122,0.1)]' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-10 flex items-center gap-3 p-4 rounded-xl bg-black/20 border border-white/5 relative group">
          <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-10 h-10" } }} />
          <div className="overflow-hidden flex-1 cursor-pointer" onClick={() => navigate('/dashboard/profile')}>
            <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">{user?.fullName || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.goal_type}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <Routes>
          <Route path="" element={<Overview profile={profile} user={user} />} />
          <Route path="meals" element={<Meals profile={profile} user={user} />} />
          <Route path="goals" element={<Goals profile={profile} user={user} />} />
          <Route path="planner" element={<AIPlanner profile={profile} />} />
          <Route path="profile" element={<Profile profile={profile} user={user} />} />
        </Routes>
      </main>
    </div>
  );
}

