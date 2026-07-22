import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, Coffee, Sun, Apple, Moon, Utensils, Minus } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { sanitizeText } from '@/lib/sanitize';
import { indianFoods } from '@/lib/foodDatabase';

const MEAL_TYPES = [
  { id: 'Breakfast', icon: <Coffee className="w-4 h-4" />, color: 'from-amber-400 to-orange-400' },
  { id: 'Lunch',     icon: <Sun className="w-4 h-4" />,    color: 'from-blue-400 to-indigo-400'  },
  { id: 'Snack',     icon: <Apple className="w-4 h-4" />,  color: 'from-green-400 to-emerald-400'},
  { id: 'Dinner',    icon: <Moon className="w-4 h-4" />,   color: 'from-purple-400 to-violet-400'},
];

function MacroPill({ label, value, unit = 'g', color }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {label}: {value}{unit}
    </span>
  );
}

// Quantity selector shown inside the food result row
function QuantityPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <button onClick={() => onChange(Math.max(0.5, value - 0.5))}
        className="w-6 h-6 rounded-full bg-[#f4f6fa] dark:bg-[#1d2d5c] text-[#12266e] flex items-center justify-center hover:bg-[#e8effe] transition-colors">
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 text-center text-xs font-bold text-[#12266e]">{value}</span>
      <button onClick={() => onChange(value + 0.5)}
        className="w-6 h-6 rounded-full bg-[#12266e] text-white flex items-center justify-center hover:bg-[#0e1f5c] transition-colors">
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function Meals({ user }) {
  const [searchTerm, setSearchTerm]     = useState('');
  const [meals, setMeals]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedType, setSelectedType] = useState('Breakfast');
  const [activeTab, setActiveTab]       = useState('all');

  // Search Results
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Quantity map: food result index → quantity multiplier
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    if (!user) return;
    api.getMeals(user.id)
      .then(d => { if (d.success) setMeals(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // Instant & debounced food search (DB + 1,200+ local Indian foods dataset)
  const runSearch = useCallback(async (term, type) => {
    const q = term ? term.trim().toLowerCase() : '';
    if (!q) { setSearchResults([]); return; }

    setSearchLoading(true);

    // Client-side instant filter helper across 1,236 Indian foods
    const searchLocalDataset = () => {
      const matched = indianFoods.filter(f => f.name.toLowerCase().includes(q));
      matched.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aStarts = aName.startsWith(q);
        const bStarts = bName.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return aName.length - bName.length;
      });
      return matched.slice(0, 30).map(f => ({
        name: f.name,
        servingSize: '1 serving',
        cal: f.cal,
        p: f.p,
        c: f.c,
        f: f.f,
        category: type,
        emoji: f.emoji || '🍛'
      }));
    };

    try {
      const d = await api.foodSearch(q, type);
      if (d && d.success && d.results && d.results.length > 0) {
        setSearchResults(d.results);
      } else {
        setSearchResults(searchLocalDataset());
      }
    } catch {
      setSearchResults(searchLocalDataset());
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(searchTerm, selectedType), 150);
    return () => clearTimeout(t);
  }, [searchTerm, selectedType, runSearch]);

  // Reset quantities when results change
  useEffect(() => { setQuantities({}); }, [searchResults]);

  const getQty = (i) => quantities[i] ?? 1;

  // Curated category suggestions (shown when search term is empty or short)
  const categorySuggestions = indianFoods.filter(f => f.category === selectedType);

  const displayedMeals = activeTab === 'all' ? meals : meals.filter(m => m.meal_type === activeTab);

  // ── Totals ──────────────────────────────────────────────────
  const dailyTotals = meals.reduce((acc, m) => ({
    cal:  acc.cal  + (m.calories || 0),
    p:    acc.p    + (m.protein  || 0),
    c:    acc.c    + (m.carbs    || 0),
    f:    acc.f    + (m.fats     || 0),
  }), { cal: 0, p: 0, c: 0, f: 0 });

  const typeTotals = MEAL_TYPES.reduce((acc, t) => {
    const typeMeals = meals.filter(m => m.meal_type === t.id);
    acc[t.id] = typeMeals.reduce((a, m) => ({
      cal: a.cal + (m.calories || 0),
      p:   a.p   + (m.protein  || 0),
      c:   a.c   + (m.carbs    || 0),
      f:   a.f   + (m.fats     || 0),
    }), { cal: 0, p: 0, c: 0, f: 0 });
    return acc;
  }, {});

  // ── Add meal ────────────────────────────────────────────────
  const addMeal = async (food, qty = 1) => {
    if (!user) return;
    const safeName = sanitizeText(food.name, 200);
    if (!safeName) return toast.error('Invalid food name.');
    const multiplied = {
      food_name: safeName,
      calories:  Math.round((food.cal || 0) * qty),
      protein:   Math.round((food.p   || 0) * qty * 10) / 10,
      carbs:     Math.round((food.c   || 0) * qty * 10) / 10,
      fats:      Math.round((food.f   || 0) * qty * 10) / 10,
      meal_type: selectedType,
      user_id:   user.id,
    };
    try {
      const d = await api.addMeal(multiplied);
      if (d.success) {
        setMeals(prev => [{ ...multiplied, id: d.data.id, created_at: new Date().toISOString() }, ...prev]);
        toast.success(`${safeName} × ${qty} logged! (${multiplied.calories} kcal)`);
      }
    } catch (e) { toast.error(e.message || 'Failed to add meal.'); }
  };

  const removeMeal = async (id, name) => {
    try {
      const d = await api.deleteMeal(id);
      if (d.success) { setMeals(p => p.filter(m => m.id !== id)); toast.info(`${name} removed.`); }
    } catch { toast.error('Failed to remove meal.'); }
  };

  // ── Render food row ─────────────────────────────────────────
  const FoodRow = ({ food, idx, isSuggestion = false }) => {
    const qty = isSuggestion ? 1 : getQty(idx);
    const cal = Math.round((food.cal || 0) * qty);
    const p   = Math.round((food.p   || 0) * qty * 10) / 10;
    const c   = Math.round((food.c   || 0) * qty * 10) / 10;
    const f   = Math.round((food.f   || 0) * qty * 10) / 10;

    return (
      <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#f4f6fa] dark:hover:bg-[#1d2d5c]/60 border border-transparent hover:border-[#e8effe] dark:hover:border-[#2e437c]/60 transition-all group gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-[#f4f6fa] dark:bg-[#1d2d5c] flex items-center justify-center text-lg shadow-inner flex-shrink-0">
            {food.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#0E1929] dark:text-white truncate">{food.name}</p>
            {food.servingSize && (
              <p className="text-[10px] text-[#9aa0b0] font-medium">Serving: {food.servingSize}</p>
            )}
            <p className="text-xs text-[#9aa0b0] mt-0.5">
              {cal} kcal · P:{p}g · C:{c}g · F:{f}g
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isSuggestion && (
            <QuantityPicker
              value={qty}
              onChange={v => setQuantities(prev => ({ ...prev, [idx]: v }))}
            />
          )}
          <button
            onClick={() => addMeal(food, qty)}
            className="xh-btn text-xs py-2 px-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto select-none" style={{ fontFamily: "'DM Sans',sans-serif" }}>

      {/* Header */}
      <div className="xh-card p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="xh-label mb-1"><span className="inline-block w-2 h-2 rounded-full bg-[#3456c8] mr-2" />Food Logging</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0E1929]">Log Your Meals</h1>
          <p className="text-xs sm:text-sm text-[#5a6478] mt-1">Search our nutrition database and track your intake.</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="xh-label">Today Total</p>
          <p className="text-3xl sm:text-4xl font-bold text-[#12266e] mt-1">{Math.round(dailyTotals.cal)}<span className="text-base sm:text-lg text-[#9aa0b0] font-normal ml-1">kcal</span></p>
          <div className="flex gap-2 mt-1 flex-wrap sm:justify-end">
            <MacroPill label="P" value={Math.round(dailyTotals.p)} color="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" />
            <MacroPill label="C" value={Math.round(dailyTotals.c)} color="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" />
            <MacroPill label="F" value={Math.round(dailyTotals.f)} color="bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ── Add Meal Panel ─────────────────────────────────── */}
        <div className="lg:col-span-7 xh-card p-5 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-[#0E1929]">Add a Meal</h2>
            <span className="xh-badge self-start sm:self-auto">{selectedType} selected</span>
          </div>

          {/* Meal type tabs */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 p-1.5 bg-[#f4f6fa] rounded-2xl">
            {MEAL_TYPES.map(type => {
              const isSel = selectedType === type.id;
              return (
                <button key={type.id} onClick={() => setSelectedType(type.id)}
                  className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 sm:py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isSel ? 'bg-white shadow-sm text-[#12266e] border border-[#e8effe]' : 'text-[#9aa0b0] hover:text-[#5a6478]'
                  }`}>
                  <span>{type.icon}</span>
                  {type.id}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="space-y-3">
            <div className="relative flex items-center w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa0b0] w-4.5 h-4.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search over 300,000+ foods (e.g. Idli, Paneer, Biryani, Pizza)..."
                className="xh-input pl-11 w-full"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto custom-scrollbar">

            {/* Loading spinner */}
            {searchLoading && (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <div className="w-6 h-6 border-2 border-[#12266e] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[#9aa0b0] font-medium">Searching nutrition database...</p>
              </div>
            )}

            {/* Active search results */}
            {searchTerm.trim().length >= 2 && !searchLoading && searchResults.map((food, i) => (
              <FoodRow key={i} food={food} idx={i} />
            ))}

            {/* Empty search results */}
            {searchTerm.trim().length >= 2 && !searchLoading && searchResults.length === 0 && (
              <div className="text-center py-10 text-[#9aa0b0] text-sm font-medium">
                No results found for &quot;{searchTerm}&quot;
              </div>
            )}

            {/* Default category suggestions (shown when query is empty or too short) */}
            {searchTerm.trim().length < 2 && (
              <>
                <p className="text-xs font-semibold text-[#9aa0b0] px-3 py-1.5 uppercase tracking-wider">
                  Popular {selectedType} Suggestions
                </p>
                {categorySuggestions.map((food, i) => (
                  <FoodRow key={`suggest-${i}`} food={{
                    name: food.name,
                    cal: food.cal,
                    p: food.p,
                    c: food.c,
                    f: food.f,
                    emoji: food.emoji,
                    servingSize: food.servingSize || '1 serving'
                  }} idx={i} isSuggestion />
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── Today's Log ────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-4">

          {/* Per-meal-type totals */}
          <div className="grid grid-cols-2 gap-3">
            {MEAL_TYPES.map(t => {
              const tot = typeTotals[t.id] || { cal: 0, p: 0, c: 0, f: 0 };
              return (
                <div key={t.id} className="xh-card p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[#12266e]">{t.icon}</span>
                    <span className="text-xs font-bold text-[#0E1929]">{t.id}</span>
                  </div>
                  <p className="text-xl font-bold text-[#12266e]">{Math.round(tot.cal)} <span className="text-xs text-[#9aa0b0] font-normal">kcal</span></p>
                  <div className="text-[10px] text-[#9aa0b0] space-y-0.5">
                    <p>P: {Math.round(tot.p)}g · C: {Math.round(tot.c)}g · F: {Math.round(tot.f)}g</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Daily total summary card */}
          <div className="xh-card p-5 bg-gradient-to-br from-[#12266e] to-[#1e3a8a] text-white space-y-3">
            <p className="text-sm font-bold opacity-80">📊 Daily Total</p>
            <p className="text-3xl font-bold">{Math.round(dailyTotals.cal)} <span className="text-base font-normal opacity-70">kcal</span></p>
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/20">
              {[
                { label: 'Protein', val: Math.round(dailyTotals.p) },
                { label: 'Carbs',   val: Math.round(dailyTotals.c) },
                { label: 'Fat',     val: Math.round(dailyTotals.f) },
              ].map(({ label, val }) => (
                <div key={label} className="text-center">
                  <p className="text-lg font-bold">{val}g</p>
                  <p className="text-[10px] opacity-60">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Meal log */}
          <div className="xh-card p-5 sm:p-7 space-y-4">
            <div className="flex justify-between items-center border-b border-[#f0f2f8] pb-4">
              <h2 className="text-lg sm:text-xl font-bold text-[#0E1929]">Today's Log</h2>
              <span className="xh-badge">{meals.length} items</span>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {['all', ...MEAL_TYPES.map(t => t.id)].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                    activeTab === tab ? 'bg-[#12266e] text-white shadow-sm' : 'bg-[#f4f6fa] text-[#5a6478] hover:bg-[#e8effe] hover:text-[#12266e]'
                  }`}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="max-h-[340px] overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {displayedMeals.map(meal => (
                  <motion.div key={meal.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between py-3.5 border-b border-[#f0f2f8] last:border-0 group gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#0E1929] capitalize truncate">{meal.food_name}</p>
                      <p className="xh-label mt-0.5 truncate">{meal.meal_type}</p>
                      <p className="text-[11px] text-[#9aa0b0] mt-0.5">
                        P:{meal.protein || 0}g · C:{meal.carbs || 0}g · F:{meal.fats || 0}g
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="xh-badge text-[10px] sm:text-xs">{meal.calories} kcal</span>
                      <button onClick={() => removeMeal(meal.id, meal.food_name)}
                        className="text-[#c8d0e0] hover:text-red-400 transition-colors p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {displayedMeals.length === 0 && !loading && (
                <div className="text-center py-12 flex flex-col items-center opacity-40">
                  <Utensils className="w-8 h-8 text-[#c8d0e0] mb-2" />
                  <p className="text-sm text-[#9aa0b0] font-medium">
                    {activeTab === 'all' ? 'No meals logged today.' : `No ${activeTab} logged.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
