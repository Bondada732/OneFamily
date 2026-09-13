import React, { useState, useEffect } from 'react';
import { useFamily } from '../../context/FamilyContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { useSecurity } from '../../context/SecurityContext.js';
import { translations } from '../../i18n/index.js';
import { formatCurrency, formatDate, getLocalDateString } from '../../utils/formatters.js';
import { apiRequest } from '../../utils/api.js';
import {
  TrendingUp,
  Receipt,
  Gift,
  Target,
  Wallet,
  Eye,
  EyeOff,
  ChevronRight,
  Sun,
  CloudSun,
  Cake,
  Calendar,
  Sparkles,
  Plus,
  X,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Building,
  Heart,
  Tag,
  Trash2,
} from 'lucide-react';

interface HomeViewProps {
  onNavigateTab: (tab: any) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigateTab }) => {
  const { dashboard, isLoading, refreshDashboard } = useFamily();
  const { activeLanguage, currentUser, family, hasPermission, familyMembers } = useAuth();
  const { isPrivacyMode, togglePrivacyMode } = useSecurity();
  const t = translations[activeLanguage];

  // Quick Action Modal States
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showWishListModal, setShowWishListModal] = useState(false);
  const [showSetGoalModal, setShowSetGoalModal] = useState(false);
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);

  // Form states (matching MoneyView and FamilyView schema)
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    merchant: '',
    category_id: 'cat_groceries',
    category_name: 'Groceries & Kirana',
    payment_method: 'UPI',
    date: getLocalDateString(),
    notes: '',
  });

  const [incomeForm, setIncomeForm] = useState({
    source: '',
    amount: '',
    type: 'SALARY',
    date: getLocalDateString(),
    notes: '',
  });

  const [goalForm, setGoalForm] = useState({
    title: '',
    category: 'PROPERTY',
    target_amount: '',
    current_amount: '0',
    monthly_contribution: '10000',
    target_date: '2028-12-31',
    priority: 'HIGH' as 'HIGH' | 'MEDIUM' | 'LOW',
  });

  // Shared Wishlist items state (fetched directly from backend tasks/grocery API)
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [newWishTitle, setNewWishTitle] = useState('');
  const [newWishAmount, setNewWishAmount] = useState('');
  const [newWishCategory, setNewWishCategory] = useState('WISH');

  // Load shared wishlist items from backend database
  const loadWishlist = async () => {
    if (!family?.id) return;
    try {
      const data = await apiRequest(`/tasks/${family.id}/tasks`);
      setWishlistItems(data.groceryItems || []);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    }
  };

  useEffect(() => {
    refreshDashboard();
    loadWishlist();
  }, [family?.id, refreshDashboard]);

  // Dynamic greeting by time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family?.id || !expenseForm.amount) return;
    try {
      await apiRequest(`/expenses/${family.id}/expenses`, {
        method: 'POST',
        body: JSON.stringify(expenseForm),
      });
      setShowAddExpenseModal(false);
      setExpenseForm({
        amount: '',
        merchant: '',
        category_id: 'cat_groceries',
        category_name: 'Groceries & Kirana',
        payment_method: 'UPI',
        date: getLocalDateString(),
        notes: '',
      });
      refreshDashboard();
    } catch (err) {
      console.error('Failed to create expense:', err);
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family?.id || !incomeForm.amount) return;
    try {
      await apiRequest(`/investments/${family.id}/investments`, {
        method: 'POST',
        body: JSON.stringify({
          title: incomeForm.source || 'Monthly Salary & Income',
          type: 'FIXED_DEPOSIT',
          institution: 'Bank Credit / Direct Deposit',
          invested_amount: Number(incomeForm.amount) || 0,
          current_value: Number(incomeForm.amount) || 0,
          notes: incomeForm.notes,
        }),
      });
      setShowAddIncomeModal(false);
      setIncomeForm({
        source: '',
        amount: '',
        type: 'SALARY',
        date: getLocalDateString(),
        notes: '',
      });
      refreshDashboard();
    } catch (err) {
      console.error('Failed to record income:', err);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family?.id || !goalForm.title.trim()) return;
    try {
      await apiRequest(`/goals/${family.id}/goals`, {
        method: 'POST',
        body: JSON.stringify({
          title: goalForm.title.trim(),
          category: goalForm.category,
          target_amount: Number(goalForm.target_amount) || 0,
          current_amount: Number(goalForm.current_amount) || 0,
          monthly_contribution: Number(goalForm.monthly_contribution) || 10000,
          target_date: goalForm.target_date || '2028-12-31',
          priority: goalForm.priority,
        }),
      });
      setShowSetGoalModal(false);
      setGoalForm({
        title: '',
        category: 'PROPERTY',
        target_amount: '',
        current_amount: '0',
        monthly_contribution: '10000',
        target_date: '2028-12-31',
        priority: 'HIGH',
      });
      refreshDashboard();
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const handleAddWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWishTitle.trim() || !family?.id) return;
    try {
      const created = await apiRequest(`/tasks/${family.id}/grocery`, {
        method: 'POST',
        body: JSON.stringify({
          item_name: newWishTitle.trim(),
          quantity: newWishAmount ? `₹${Number(newWishAmount).toLocaleString('en-IN')}` : '1 unit',
          category: newWishCategory || 'WISH',
          estimated_cost: Number(newWishAmount) || 0,
        }),
      });
      setWishlistItems((prev) => [...prev, created]);
      setNewWishTitle('');
      setNewWishAmount('');
      setNewWishCategory('WISH');
    } catch (err) {
      console.error('Failed to add wish item:', err);
    }
  };

  const toggleWishFulfilled = async (id: string) => {
    if (!family?.id) return;
    try {
      const updated = await apiRequest(`/tasks/${family.id}/grocery/${id}/toggle`, {
        method: 'PATCH',
      });
      setWishlistItems((prev) => prev.map((w) => (w.id === id ? updated : w)));
    } catch (err) {
      console.error('Failed to toggle wish status:', err);
    }
  };

  const deleteWishItem = async (id: string) => {
    if (!family?.id) return;
    setWishlistItems((prev) => prev.filter((w) => w.id !== id));
    try {
      await apiRequest(`/tasks/${family.id}/grocery/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete wish item:', err);
    }
  };

  if (isLoading || !dashboard) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-slate-800 rounded-xl"></div>
        <div className="h-44 bg-slate-800 rounded-3xl"></div>
        <div className="grid grid-cols-4 gap-2.5">
          <div className="h-20 bg-slate-800 rounded-2xl"></div>
          <div className="h-20 bg-slate-800 rounded-2xl"></div>
          <div className="h-20 bg-slate-800 rounded-2xl"></div>
          <div className="h-20 bg-slate-800 rounded-2xl"></div>
        </div>
        <div className="h-32 bg-slate-800 rounded-3xl"></div>
      </div>
    );
  }

  const { snapshot, goals, recentMemories, today } = dashboard;
  const rawNetWorth = snapshot.netWorth ?? 1248000;
  const netWorthDisplay = Math.abs(rawNetWorth);
  const firstName = currentUser?.name?.split(' ')[0] || 'Family';
  const locationCity = family?.location?.split(',')[0] || 'Hyderabad';

  return (
    <div className="p-4 space-y-4 text-slate-100 pb-20 animate-in fade-in duration-300">
      {/* 1. Greeting & Weather Banner */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
            {getGreeting()}, {firstName} <span className="inline-block animate-wave origin-bottom-right">👋</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 italic">
            "Small steps today, big dreams tomorrow."
          </p>
        </div>

        {/* Weather Badge */}
        <div className="flex items-center gap-2 bg-slate-850/80 border border-slate-700/60 px-3 py-1.5 rounded-2xl shadow-sm">
          <div className="p-1 rounded-xl bg-amber-400/20 text-amber-400">
            <Sun className="w-4 h-4 animate-spin-slow" />
          </div>
          <div className="text-right leading-none">
            <div className="text-[10px] text-slate-400 font-medium">{locationCity}</div>
            <div className="text-xs font-bold text-white mt-0.5">28°C</div>
          </div>
        </div>
      </div>

      {/* 2. Family Wealth Hero Card (Compact + Colorful Sparkline Graph) */}
      <div
        onClick={() => onNavigateTab('money')}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#131d3b] via-[#0f1730] to-[#0a1024] border border-indigo-500/30 p-4 shadow-xl shadow-indigo-950/40 cursor-pointer group hover:border-indigo-400/60 transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-amber-400/20 text-amber-400">
              <Sun className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-200 tracking-wide">Family Wealth</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePrivacyMode();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
              title="Toggle Privacy Mask"
            >
              {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="w-6 h-6 rounded-full bg-slate-800/80 group-hover:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all">
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div className="space-y-1.5 z-10">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              {isPrivacyMode ? '••••••••' : formatCurrency(netWorthDisplay, false)}
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <ArrowUpRight className="w-3 h-3" />
              <span>12% this month</span>
            </div>
          </div>

          {/* Embedded Colorful Wave Sparkline Graph */}
          <div className="w-36 h-14 -mr-1">
            <svg viewBox="0 0 120 50" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="wealthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="wealthLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <path
                d="M 0 38 Q 20 42, 40 26 T 80 18 T 120 6 L 120 50 L 0 50 Z"
                fill="url(#wealthGrad)"
              />
              <path
                d="M 0 38 Q 20 42, 40 26 T 80 18 T 120 6"
                fill="none"
                stroke="url(#wealthLine)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="120" cy="6" r="3" fill="#34d399" className="animate-ping" />
              <circle cx="120" cy="6" r="2.5" fill="#34d399" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. 4 Quick Actions in Distinct Colorful Boxes (Mockup Style) */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {/* Action 1: Add Expense (Rose Box) */}
        <button
          onClick={() => setShowAddExpenseModal(true)}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-b from-rose-950/40 to-slate-900 border border-rose-500/30 hover:border-rose-400 active:scale-95 transition-all shadow-md shadow-rose-950/30 group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-all mb-1 shadow-sm">
            <Receipt className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">Add Expense</span>
        </button>

        {/* Action 2: Wish List (Cyan Box - Replaces Transfer) */}
        <button
          onClick={() => setShowWishListModal(true)}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-b from-cyan-950/40 to-slate-900 border border-cyan-500/30 hover:border-cyan-400 active:scale-95 transition-all shadow-md shadow-cyan-950/30 group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all mb-1 shadow-sm">
            <Gift className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">Wish List</span>
        </button>

        {/* Action 3: Set Goal (Emerald Box) */}
        <button
          onClick={() => setShowSetGoalModal(true)}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-500/30 hover:border-emerald-400 active:scale-95 transition-all shadow-md shadow-emerald-950/30 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all mb-1 shadow-sm">
            <Target className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">Set Goal</span>
        </button>

        {/* Action 4: Add Income (Purple Box - Replaces Add Money) */}
        <button
          onClick={() => setShowAddIncomeModal(true)}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-b from-purple-950/40 to-slate-900 border border-purple-500/30 hover:border-purple-400 active:scale-95 transition-all shadow-md shadow-purple-950/30 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all mb-1 shadow-sm">
            <Wallet className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">Add Income</span>
        </button>
      </div>

      {/* 4. Quick Overview (3 Distinctly Colored Themed Boxes from Mock) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white tracking-tight">Quick Overview</h3>
          <button
            onClick={() => onNavigateTab('money')}
            className="text-[11px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Box 1: Monthly Spending (Rose Themed Box) */}
          <div
            onClick={() => onNavigateTab('money')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-950/50 via-slate-900 to-slate-900 border border-rose-500/30 shadow-lg shadow-rose-950/20 flex flex-col justify-between hover:border-rose-400/60 transition-all cursor-pointer group"
          >
            <div>
              <div className="text-[10px] font-bold text-rose-300/90 leading-tight">Monthly Spending</div>
              <div className="text-sm sm:text-base font-black text-rose-100 mt-1">
                {isPrivacyMode ? '••••' : formatCurrency(snapshot.monthlySpending || 25850, false)}
              </div>
            </div>
            <div className="text-[10px] font-bold text-rose-400 mt-2 flex items-center gap-0.5">
              <span>↓ 8%</span>
              <span className="text-slate-400 text-[9px] font-normal">vs last mo</span>
            </div>
          </div>

          {/* Box 2: Savings (Emerald Themed Box) */}
          <div
            onClick={() => onNavigateTab('money')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-lg shadow-emerald-950/20 flex flex-col justify-between hover:border-emerald-400/60 transition-all cursor-pointer group"
          >
            <div>
              <div className="text-[10px] font-bold text-emerald-300/90 leading-tight">Savings</div>
              <div className="text-sm sm:text-base font-black text-emerald-100 mt-1">
                {isPrivacyMode ? '••••' : formatCurrency(240000, true)}
              </div>
            </div>
            <div className="text-[10px] font-bold text-emerald-400 mt-2 flex items-center gap-0.5">
              <span>↑ 15%</span>
              <span className="text-slate-400 text-[9px] font-normal">this year</span>
            </div>
          </div>

          {/* Box 3: Goals (Sky/Indigo Themed Box) */}
          <div
            onClick={() => onNavigateTab('money')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-950/50 via-slate-900 to-slate-900 border border-sky-500/30 shadow-lg shadow-sky-950/20 flex flex-col justify-between hover:border-sky-400/60 transition-all cursor-pointer group"
          >
            <div>
              <div className="text-[10px] font-bold text-sky-300/90 leading-tight">Goals</div>
              <div className="text-sm sm:text-base font-black text-sky-100 mt-1">
                {goals.length > 0 ? `${goals.filter(g => g.current_amount >= g.target_amount).length}/${goals.length}` : '2/5'}
              </div>
            </div>
            <div className="text-[10px] font-bold text-sky-400 mt-2">
              On Track
            </div>
          </div>
        </div>
      </div>

      {/* 5. Upcoming Card (Mockup Style) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white tracking-tight">Upcoming</h3>
          <button
            onClick={() => onNavigateTab('family')}
            className="text-[11px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {(() => {
          // Dynamic calculation of nearest family birthday or event
          const calendarEvents = dashboard?.today?.events || [];
          if (calendarEvents.length > 0) {
            const ev = calendarEvents[0];
            return (
              <div
                onClick={() => onNavigateTab('calendar')}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md flex items-center justify-between hover:border-slate-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-sky-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {ev.title} 📅
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {ev.start_date ? formatDate(ev.start_date) : 'Upcoming Event'}
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 text-xs font-bold">
                  ➔
                </div>
              </div>
            );
          }

          // Check real family member birthdays
          const today = new Date();
          const currentYear = today.getFullYear();

          const memberBirthdays = (familyMembers || [])
            .filter((m) => m.birth_date)
            .map((m) => {
              const bDate = new Date(m.birth_date!);
              let nextBday = new Date(currentYear, bDate.getMonth(), bDate.getDate());
              if (nextBday < today && nextBday.getDate() !== today.getDate()) {
                nextBday = new Date(currentYear + 1, bDate.getMonth(), bDate.getDate());
              }
              const diffDays = Math.ceil((nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return {
                member: m,
                diffDays: diffDays < 0 ? 0 : diffDays,
                bDateStr: formatDate(nextBday.toISOString().split('T')[0]),
              };
            })
            .sort((a, b) => a.diffDays - b.diffDays);

          const nearest = memberBirthdays.length > 0 ? memberBirthdays[0] : null;

          return (
            <div
              onClick={() => onNavigateTab('family')}
              className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md flex items-center justify-between hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
                  <Cake className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
                    {nearest ? `${nearest.member.name.split(' ')[0]}'s Birthday 🎂` : "Family Birthday 🎂"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {nearest
                      ? nearest.diffDays === 0
                        ? 'Today! Celebrate together 🎉'
                        : `In ${nearest.diffDays} day${nearest.diffDays > 1 ? 's' : ''} • ${nearest.bDateStr}`
                      : 'Add birth dates in Family Hub'}
                  </div>
                </div>
              </div>

              <img
                src={nearest?.member?.avatar_url || currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={nearest?.member?.name || 'Member'}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-pink-500/40 shadow-sm"
              />
            </div>
          );
        })()}
      </div>

      {/* 6. Family Moments (Horizontal Carousel) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white tracking-tight">Family Moments</h3>
          <button
            onClick={() => onNavigateTab('memories')}
            className="text-[11px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {(recentMemories && recentMemories.length > 0
            ? recentMemories
            : [
                { id: 'm1', title: 'Goa Family Vacation', location: 'Goa Beach', photo: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400' },
                { id: 'm2', title: 'Diwali Celebration', location: 'Home', photo: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=400' },
                { id: 'm3', title: 'Hitesh Birthday Party', location: 'Hyderabad', photo: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400' },
              ]
          ).map((mem: any) => {
            const imgUrl = mem.photo || mem.photosList?.[0] || 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400';
            return (
              <div
                key={mem.id}
                onClick={() => onNavigateTab('memories')}
                className="min-w-[140px] max-w-[140px] rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md shrink-0 cursor-pointer group"
              >
                <div className="h-24 overflow-hidden relative">
                  <img
                    src={imgUrl}
                    alt={mem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                  <span className="absolute bottom-1 left-2 text-[9px] font-bold text-white truncate max-w-[120px]">
                    {mem.location || mem.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MODALS (UNIFIED WITH MONEY & FAMILY SECTIONS) ================= */}

      {/* 1. Add Expense Modal (Exact same functionality as Money Section) */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Record Family Expense</h3>
                  <p className="text-[10px] text-slate-400">Synced with Family Wealth & Budget</p>
                </div>
              </div>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Amount (₹ INR) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2400"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-lg font-bold text-amber-400 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Merchant / Payee *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ratnadeep Supermarket / Swiggy"
                  value={expenseForm.merchant}
                  onChange={(e) => setExpenseForm({ ...expenseForm, merchant: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Category</label>
                  <select
                    value={expenseForm.category_name}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      setExpenseForm({
                        ...expenseForm,
                        category_name: selectedName,
                      });
                    }}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="Groceries & Kirana">Groceries & Kirana</option>
                    <option value="Food & Dining / Swiggy">Food & Dining / Swiggy</option>
                    <option value="Utilities & Bills">Utilities & Bills</option>
                    <option value="Rent & Maintenance">Rent & Maintenance</option>
                    <option value="Education & School">Education & School</option>
                    <option value="Transport & Fuel">Transport & Fuel</option>
                    <option value="Healthcare & Pharmacy">Healthcare & Pharmacy</option>
                    <option value="Shopping & Apparel">Shopping & Apparel</option>
                    <option value="Entertainment & OTT">Entertainment & OTT</option>
                    <option value="Travel & Trips">Travel & Trips</option>
                    <option value="Investments / SIP">Investments / SIP</option>
                    <option value="Loan EMI & Debts">Loan EMI & Debts</option>
                    <option value="Miscellaneous & Pooja">Miscellaneous & Pooja</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Payment Mode</label>
                  <select
                    value={expenseForm.payment_method}
                    onChange={(e) => setExpenseForm({ ...expenseForm, payment_method: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank NetBanking</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Expense Date</label>
                <input
                  type="date"
                  required
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Notes / Items (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly ration & snacks"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-bold rounded-xl shadow-lg shadow-rose-500/30 text-xs transition-all active:scale-98 mt-2"
              >
                Save Expense Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Wish List Modal (Unified directly with Family Hub's Wish List backend) */}
      {showWishListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Family Wish List</h3>
                  <p className="text-[10px] text-slate-400">Stored in Family Hub • Shared with all members</p>
                </div>
              </div>
              <button onClick={() => setShowWishListModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            {/* Add Wish Item Form */}
            <form onSubmit={handleAddWish} className="p-3.5 bg-slate-800/70 border border-slate-700/60 rounded-2xl space-y-2.5">
              <div className="text-xs font-bold text-amber-400">+ Add New Wish</div>
              <div>
                <input
                  type="text"
                  required
                  placeholder="Wish item (e.g. Sony Wireless Headphones)"
                  value={newWishTitle}
                  onChange={(e) => setNewWishTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newWishCategory}
                  onChange={(e) => setNewWishCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
                >
                  <option value="WISH">🎁 Wish / Gift</option>
                  <option value="GADGET">📱 Gadget / Tech</option>
                  <option value="SHOPPING">🛍️ Shopping / Clothes</option>
                  <option value="BOOK">📚 Books / Study</option>
                  <option value="GROCERY">🛒 Grocery / Food</option>
                  <option value="HOME">🏡 Home & Living</option>
                  <option value="OTHER">✨ Other</option>
                </select>
                <input
                  type="number"
                  placeholder="₹ Est. Cost (Optional)"
                  value={newWishAmount}
                  onChange={(e) => setNewWishAmount(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-bold rounded-xl text-xs shadow-md shadow-cyan-500/20 active:scale-98 transition-all"
              >
                Add to Family Wish List
              </button>
            </form>

            {/* Wish List items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Shared Wish List ({wishlistItems.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">Tap check to mark fulfilled</span>
              </div>
              {wishlistItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No wishes added yet. Make a wish above! ✨</div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {wishlistItems.map((wish) => (
                    <div
                      key={wish.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        wish.is_purchased
                          ? 'bg-slate-900/50 border-slate-800 opacity-60'
                          : 'bg-slate-800/90 border-slate-700/80 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                        <button
                          type="button"
                          onClick={() => toggleWishFulfilled(wish.id)}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                            wish.is_purchased
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'border-slate-600 hover:border-cyan-400'
                          }`}
                        >
                          {wish.is_purchased && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <div className="min-w-0">
                          <div className={`text-xs font-bold truncate ${wish.is_purchased ? 'line-through text-slate-400' : 'text-white'}`}>
                            {wish.item_name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            Added by <span className="text-amber-300 font-semibold">{wish.added_by_name || 'Family'}</span>
                            {wish.estimated_cost ? (
                              <span className="text-emerald-400 font-bold ml-1.5">• ₹{Number(wish.estimated_cost).toLocaleString('en-IN')}</span>
                            ) : wish.quantity && wish.quantity !== '1 unit' && (
                              <span className="text-slate-300 ml-1.5">• {wish.quantity}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] bg-slate-700/80 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                          {wish.category || 'WISH'}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteWishItem(wish.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete wish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Set Goal Modal (Exact same functionality as Money Section Goals) */}
      {showSetGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Set Family Financial Goal</h3>
                  <p className="text-[10px] text-slate-400">Synced with Money & Wealth Tracker</p>
                </div>
              </div>
              <button onClick={() => setShowSetGoalModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Goal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Buy Dream House / Europe Trip / Child MBA"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Goal Category</label>
                  <select
                    value={goalForm.category}
                    onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-400"
                  >
                    <option value="PROPERTY">🏡 Property / Real Estate</option>
                    <option value="EDUCATION">🎓 Children Education</option>
                    <option value="EMERGENCY">🛡️ Emergency Fund</option>
                    <option value="TRAVEL">✈️ Family Vacation / Travel</option>
                    <option value="VEHICLE">🚗 Vehicle / Car / EV</option>
                    <option value="RETIREMENT">👴 Retirement Corpus</option>
                    <option value="FAMILY">👨‍👩‍👧‍👦 Family Dream / General</option>
                    <option value="OTHER">✨ Other Milestone</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Priority</label>
                  <select
                    value={goalForm.priority}
                    onChange={(e) => setGoalForm({ ...goalForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-400"
                  >
                    <option value="HIGH">🔥 High Priority</option>
                    <option value="MEDIUM">⚡ Medium Priority</option>
                    <option value="LOW">🌱 Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Target Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000000"
                    value={goalForm.target_amount}
                    onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-emerald-400 outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold">Saved So Far (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 100000"
                    value={goalForm.current_amount}
                    onChange={(e) => setGoalForm({ ...goalForm, current_amount: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-amber-400 outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Monthly SIP / Save (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={goalForm.monthly_contribution}
                    onChange={(e) => setGoalForm({ ...goalForm, monthly_contribution: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Target Date</label>
                  <input
                    type="date"
                    required
                    value={goalForm.target_date}
                    onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 text-xs transition-all active:scale-98 mt-2"
              >
                Create Financial Goal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Income Modal (Synced with Wealth / Investments) */}
      {showAddIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add Family Income / Deposit</h3>
                  <p className="text-[10px] text-slate-400">Credits directly to Family Wealth balance</p>
                </div>
              </div>
              <button onClick={() => setShowAddIncomeModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleAddIncome} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Income Amount (₹ INR) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 150000"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-lg font-bold text-emerald-400 outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Income Source / Employer *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Salary / Freelance / Business"
                  value={incomeForm.source}
                  onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Income Type</label>
                  <select
                    value={incomeForm.type}
                    onChange={(e) => setIncomeForm({ ...incomeForm, type: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="SALARY">Primary Salary</option>
                    <option value="BUSINESS">Business Income</option>
                    <option value="DIVIDEND">Investments / Dividends</option>
                    <option value="RENTAL">Rental Income</option>
                    <option value="GIFT">Cash Gift / Bonus</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Received Date</label>
                  <input
                    type="date"
                    required
                    value={incomeForm.date}
                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. September Salary credited to HDFC"
                  value={incomeForm.notes}
                  onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 text-xs transition-all active:scale-98 mt-2"
              >
                Deposit & Credit to Family Wealth
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
