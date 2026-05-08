import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Droplets, Zap, Star, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function LevelBar({ levelInfo }) {
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Star className="w-3 h-3 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400">Lv.{levelInfo.level}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">{levelInfo.title}</span>
          </div>
          <span className="text-xs text-muted-foreground">{levelInfo.xp} XP</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelInfo.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"
          />
        </div>
        {levelInfo.next && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {levelInfo.next.xpRequired - levelInfo.xp} XP to {levelInfo.next.title}
          </p>
        )}
      </div>
    </div>
  );
}

export default function GamificationBanner({ levelInfo, streakData, badges }) {
  const earnedCount = badges?.filter(b => b.earned).length || 0;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Streak Cards */}
      <div className="flex gap-2 flex-1">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 flex-1">
          <Flame className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-orange-400 leading-tight">{streakData?.dailyStreak || 0}d</p>
            <p className="text-[10px] text-muted-foreground">Log Streak</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 flex-1">
          <Droplets className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-blue-400 leading-tight">{streakData?.waterStreak || 0}d</p>
            <p className="text-[10px] text-muted-foreground">Hydration</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 flex-1">
          <Zap className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-purple-400 leading-tight">{streakData?.proteinStreak || 0}d</p>
            <p className="text-[10px] text-muted-foreground">Protein Goal</p>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card/40 border border-white/5 flex-1">
        <LevelBar levelInfo={levelInfo} />
        <Link
          to="/dashboard/analytics"
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5 flex-shrink-0"
        >
          {earnedCount} badges <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
