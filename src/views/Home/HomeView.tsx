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
  const { activeLanguage, currentUser, family, hasPermission } = useAuth();
  const { isPrivacyMode, togglePrivacyMode } = useSecurity();
  const t = translations[activeLanguage];

  // Quick Action Modal States
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showWishListModal, setShowWishListModal] = useState(false);
  const [showSetGoalModal, setShowSetGoalModal] = useState(false);
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);

  // Form states
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
    target_amount: '',
    current_amount: '0',
    category: 'FAMILY',
    target_date: '',
  });

  // Local Wishlist items state (persisted to localStorage & synced with tasks)
  const [wishlistItems, setWishlistItems] = useState<Array<{
    id: string;
    title: string;
    estimatedCost: number;
    requestedBy: string;
    isFulfilled: boolean;
    date: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('onefamily_wishlist');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'w1', title: 'New Study Table for Aarav', estimatedCost: 4500, requestedBy: 'Sailaja', isFulfilled: false, date: '2026-09-10' },
      { id: 'w2', title: 'Smart TV for Living Room', estimatedCost: 32000, requestedBy: 'Rambabu', isFulfilled: false, date: '2026-09-08' },
      { id: 'w3', title: 'Badminton Racket Set', estimatedCost: 1800, requestedBy: 'Hitesh', isFulfilled: true, date: '2026-09-02' },
    ];
  });

  const [newWishTitle, setNewWishTitle] = useState('');
  const [newWishAmount, setNewWishAmount] = useState('');

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // Dynamic greeting by time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family?.id) return;
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
    if (!family?.id) return;
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
    if (!family?.id) return;
    try {
      await apiRequest(`/goals/${family.id}/goals`, {
        method: 'POST',
        body: JSON.stringify({
          title: goalForm.title,
          target_amount: Number(goalForm.target_amount) || 0,
          current_amount: Number(goalForm.current_amount) || 0,
          category: goalForm.category,
          target_date: goalForm.target_date,
        }),
      });
      setShowSetGoalModal(false);
      setGoalForm({
        title: '',
        target_amount: '',
        current_amount: '0',
        category: 'FAMILY',
        target_date: '',
      });
      refreshDashboard();
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const handleAddWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWishTitle.trim()) return;
    const item = {
      id: `wish_${Date.now()}`,
      title: newWishTitle.trim(),
      estimatedCost: Number(newWishAmount) || 0,
      requestedBy: currentUser?.name?.split(' ')[0] || 'Family',
      isFulfilled: false,
      date: getLocalDateString(),
    };
    const updated = [item, ...wishlistItems];
    setWishlistItems(updated);
    localStorage.setItem('onefamily_wishlist', JSON.stringify(updated));
    setNewWishTitle('');
    setNewWishAmount('');
  };

  const toggleWishFulfilled = (id: string) => {
    const updated = wishlistItems.map((w) => (w.id === id ? { ...w, isFulfilled: !w.isFulfilled } : w));
    setWishlistItems(updated);
    localStorage.setItem('onefamily_wishlist', JSON.stringify(updated));
  };

  const deleteWishItem = (id: string) => {
    const updated = wishlistItems.filter((w) => w.id !== id);
    setWishlistItems(updated);
    localStorage.setItem('onefamily_wishlist', JSON.stringify(updated));
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

      {/* 2. Family Wealth Hero Card */}
      <div
        onClick={() => onNavigateTab('money')}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121c3d] via-[#0f1730] to-[#0a1024] border border-indigo-500/30 p-5 shadow-2xl shadow-indigo-950/40 cursor-pointer group hover:border-indigo-400/60 transition-all"
      >
        {/* Decorative Wave Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-500/20 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between mb-3">
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

          <div className="w-7 h-7 rounded-full bg-slate-800/80 group-hover:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Amount */}
        <div className="relative z-10 space-y-2">
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-sans">
            {isPrivacyMode ? '••••••••' : formatCurrency(netWorthDisplay, false)}
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>12% this month</span>
          </div>
        </div>
      </div>

      {/* 3. 4 Quick Actions Bar (Mockup Style) */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {/* Action 1: Add Expense */}
        <button
          onClick={() => setShowAddExpenseModal(true)}
          className="flex flex-col items-center gap-1.5 p-2 rounded-2xl active:scale-95 transition-all group"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/30 group-hover:scale-105 transition-transform">
            <Receipt className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">Add Expense</span>
        </button>

        {/* Action 2: Wish List (Replaces Transfer) */}
        <button
          onClick={() => setShowWishListModal(true)}
          className="flex flex-col items-center gap-1.5 p-2 rounded-2xl active:scale-95 transition-all group"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-transform">
            <Gift className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">Wish List</span>
        </button>

        {/* Action 3: Set Goal */}
        <button
          onClick={() => setShowSetGoalModal(true)}
          className="flex flex-col items-center gap-1.5 p-2 rounded-2xl active:scale-95 transition-all group"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
            <Target className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">Set Goal</span>
        </button>

        {/* Action 4: Add Income (Replaces Add Money) */}
        <button
          onClick={() => setShowAddIncomeModal(true)}
          className="flex flex-col items-center gap-1.5 p-2 rounded-2xl active:scale-95 transition-all group"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform">
            <Wallet className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">Add Income</span>
        </button>
      </div>

      {/* 4. Quick Overview (3-Column Layout from Mock) */}
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
          {/* Card 1: Monthly Spending */}
          <div
            onClick={() => onNavigateTab('money')}
            className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md flex flex-col justify-between hover:border-slate-700 transition-all cursor-pointer"
          >
            <div>
              <div className="text-[10px] font-bold text-slate-400 leading-tight">Monthly Spending</div>
              <div className="text-sm sm:text-base font-black text-white mt-1">
                {isPrivacyMode ? '••••' : formatCurrency(snapshot.monthlySpending || 25850, false)}
              </div>
            </div>
            <div className="text-[10px] font-bold text-rose-400 mt-2 flex items-center gap-0.5">
              <span>↓ 8%</span>
              <span className="text-slate-500 text-[9px] font-normal">vs last mo</span>
            </div>
          </div>

          {/* Card 2: Savings */}
          <div
            onClick={() => onNavigateTab('money')}
            className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md flex flex-col justify-between hover:border-slate-700 transition-all cursor-pointer"
          >
            <div>
              <div className="text-[10px] font-bold text-slate-400 leading-tight">Savings</div>
              <div className="text-sm sm:text-base font-black text-white mt-1">
                {isPrivacyMode ? '••••' : formatCurrency(240000, true)}
              </div>
            </div>
            <div className="text-[10px] font-bold text-emerald-400 mt-2 flex items-center gap-0.5">
              <span>↑ 15%</span>
              <span className="text-slate-500 text-[9px] font-normal">this year</span>
            </div>
          </div>

          {/* Card 3: Goals */}
          <div
            onClick={() => onNavigateTab('money')}
            className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md flex flex-col justify-between hover:border-slate-700 transition-all cursor-pointer"
          >
            <div>
              <div className="text-[10px] font-bold text-slate-400 leading-tight">Goals</div>
              <div className="text-sm sm:text-base font-black text-white mt-1">
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
                Sailaja's Birthday 🎂
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                In 5 days • 18 Sep 2026
              </div>
            </div>
          </div>

          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
            alt="Sailaja"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-pink-500/40 shadow-sm"
          />
        </div>
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

      {/* ================= MODALS ================= */}

      {/* 1. Add Expense Modal */}
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
                  <p className="text-[10px] text-slate-400">Track kirana, bills, or shopping</p>
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
                  placeholder="e.g. Ratnadeep Supermarket"
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
                    onChange={(e) => setExpenseForm({ ...expenseForm, category_name: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="Groceries & Kirana">Groceries & Kirana</option>
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Utilities & Bills">Utilities & Bills</option>
                    <option value="Education & School">Education & School</option>
                    <option value="Healthcare & Pharmacy">Healthcare & Pharmacy</option>
                    <option value="Shopping & Apparel">Shopping & Apparel</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Payment Mode</label>
                  <select
                    value={expenseForm.payment_method}
                    onChange={(e) => setExpenseForm({ ...expenseForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="CASH">Cash</option>
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

      {/* 2. Wish List Modal (User requested: Replaces Transfer) */}
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
                  <p className="text-[10px] text-slate-400">Things our family wants to buy or achieve</p>
                </div>
              </div>
              <button onClick={() => setShowWishListModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            {/* Add Wish Item Form */}
            <form onSubmit={handleAddWish} className="p-3.5 bg-slate-800/70 border border-slate-700/60 rounded-2xl space-y-2.5">
              <div className="text-xs font-bold text-amber-400">+ Add New Wish</div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Wish item (e.g. Sony Headphones)"
                  value={newWishTitle}
                  onChange={(e) => setNewWishTitle(e.target.value)}
                  className="col-span-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
                />
                <input
                  type="number"
                  placeholder="₹ Cost"
                  value={newWishAmount}
                  onChange={(e) => setNewWishAmount(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-bold rounded-xl text-xs shadow-md shadow-cyan-500/20 active:scale-98 transition-all"
              >
                Add to Wish List
              </button>
            </form>

            {/* Wish List items */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300">Active Wishes ({wishlistItems.length})</div>
              {wishlistItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No wishes added yet. Make a wish above! ✨</div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {wishlistItems.map((wish) => (
                    <div
                      key={wish.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        wish.isFulfilled
                          ? 'bg-slate-900/50 border-slate-800 opacity-60'
                          : 'bg-slate-800/90 border-slate-700/80 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleWishFulfilled(wish.id)}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                            wish.isFulfilled
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'border-slate-600 hover:border-cyan-400'
                          }`}
                        >
                          {wish.isFulfilled && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <div>
                          <div className={`text-xs font-bold ${wish.isFulfilled ? 'line-through text-slate-400' : 'text-white'}`}>
                            {wish.title}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            By {wish.requestedBy} • {wish.estimatedCost > 0 ? `₹${wish.estimatedCost.toLocaleString('en-IN')}` : 'Price TBD'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteWishItem(wish.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Set Goal Modal */}
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
                  <p className="text-[10px] text-slate-400">House, education, car, or dream trip</p>
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
                  placeholder="e.g. Buy Dream House / Europe Trip"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Target (₹) *</label>
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

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Target Completion Date</label>
                <input
                  type="date"
                  value={goalForm.target_date}
                  onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
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

      {/* 4. Add Income Modal (User requested: Replaces Add Money) */}
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
                  <p className="text-[10px] text-slate-400">Credit salary, business earnings, or returns</p>
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
                  >
                  </input>
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
