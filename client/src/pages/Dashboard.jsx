import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Utensils, Target, Sparkles, UserCircle } from 'lucide-react';
import Overview from './dashboard/Overview';
import Meals from './dashboard/Meals';
import Goals from './dashboard/Goals';
import AIPlanner from './dashboard/AIPlanner';

export default function Dashboard() {
  const location = useLocation();

  const navItems = [
    { path: '', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { path: 'meals', label: 'Meals', icon: <Utensils size={20} /> },
    { path: 'goals', label: 'Goals', icon: <Target size={20} /> },
    { path: 'planner', label: 'AI Planner', icon: <Sparkles size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-white/10 bg-card/30 backdrop-blur-md p-6 flex flex-col h-auto md:h-screen sticky top-0">
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

        <div className="mt-10 flex items-center gap-3 p-4 rounded-xl bg-black/20 border border-white/5">
          <UserCircle className="w-10 h-10 text-primary" />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">Guest User</p>
            <p className="text-xs text-muted-foreground truncate">guest@calorix.app</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <Routes>
          <Route path="" element={<Overview />} />
          <Route path="meals" element={<Meals />} />
          <Route path="goals" element={<Goals />} />
          <Route path="planner" element={<AIPlanner />} />
        </Routes>
      </main>
    </div>
  );
}

