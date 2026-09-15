import React, { useState, useEffect } from 'react';
import { useFamily } from '../../context/FamilyContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { useSecurity } from '../../context/SecurityContext.js';
import { translations } from '../../i18n/index.js';
import { formatCurrency, formatDate, getLocalDateString } from '../../utils/formatters.js';
import { apiRequest } from '../../utils/api.js';
import { AddExpenseModal } from '../../components/common/AddExpenseModal.js';
import {
  Receipt,
  Gift,
  Target,
  Wallet,
  Eye,
  EyeOff,
  ChevronRight,
  Sun,
  Cake,
  Calendar,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
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
    category: 'PROPERTY',
    target_amount: '',
    current_amount: '0',
    monthly_contribution: '10000',
    target_date: '2028-12-31',
    priority: 'HIGH' as 'HIGH' | 'MEDIUM' | 'LOW',
  });

  // Shared Wishlist items state
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

  const handleCreateExpense = async (expenseData: {
    amount: string;
    merchant: string;
    category_id: string;
    category_name: string;
    payment_method: string;
    date: string;
    notes: string;
  }) => {
    if (!family?.id || !expenseData.amount) return;
    try {
      await apiRequest(`/expenses/${family.id}/expenses`, {
        method: 'POST',
        body: JSON.stringify(expenseData),
      });
      setShowAddExpenseModal(false);
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
        <div className="h-10 w-48 bg-[#073B9E]/50 rounded-xl"></div>
        <div className="h-44 bg-[#073B9E]/40 rounded-3xl"></div>
        <div className="grid grid-cols-4 gap-2.5">
          <div className="h-20 bg-[#073B9E]/30 rounded-2xl"></div>
          <div className="h-20 bg-[#073B9E]/30 rounded-2xl"></div>
          <div className="h-20 bg-[#073B9E]/30 rounded-2xl"></div>
          <div className="h-20 bg-[#073B9E]/30 rounded-2xl"></div>
        </div>
        <div className="h-32 bg-[#073B9E]/40 rounded-3xl"></div>
      </div>
    );
  }

  const { snapshot, goals, recentMemories, today } = dashboard;
  const rawNetWorth = snapshot.netWorth || 0;
  const netWorthDisplay = Math.abs(rawNetWorth);
  const firstName = currentUser?.name?.split(' ')[0] || 'Rambabu';
  const locationCity = family?.location?.split(',')[0] || 'India';

  return (
    <div className="p-4 space-y-4 text-[#F4F8FF] pb-24 animate-in fade-in duration-300">
      {/* 1. Greeting & Weather Banner */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
            <span>{getGreeting()},</span>{' '}
            <span className="text-[#16C7F2] font-black">{firstName}</span>{' '}
            <span className="inline-block animate-wave origin-bottom-right">👋</span>
          </h2>
          <p className="text-[11px] text-[#A9DFFF] mt-0.5 italic">
            "Small steps today, big dreams tomorrow."
          </p>
        </div>

        {/* Weather Card */}
        <div className="flex items-center gap-2 bg-[rgba(7,59,158,0.55)] border border-[#168BFF]/45 px-3 py-1.5 rounded-2xl shadow-sm backdrop-blur-sm">
          <div className="p-1 rounded-xl bg-[#FFD21F]/20 text-[#FFD21F]">
            <Sun className="w-4 h-4 animate-spin-slow" />
          </div>
          <div className="text-right leading-none">
            <div className="text-[10px] text-[#B9D8FF] font-medium">{locationCity}</div>
            <div className="text-xs font-bold text-white mt-0.5">28°C</div>
          </div>
        </div>
      </div>

      {/* 2. Family Wealth Hero Card (KinoraOne Premium Multi-Stage Brand Gradient) */}
      <div
        onClick={() => onNavigateTab('money')}
        className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#073B9E] via-[#0869E8] to-[#168BFF] border border-[#168BFF]/80 p-4 shadow-[0_8px_30px_rgba(22,139,255,0.20)] cursor-pointer group hover:border-[#16C7F2] transition-all"
      >
        {/* Subtle radial glow overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(22,139,255,0.18),transparent_60%)] pointer-events-none" />

        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-white/15 text-[#FFD21F] backdrop-blur-xs border border-white/20">
              <Sun className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-white tracking-wide">Family Wealth</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePrivacyMode();
              }}
              className="p-1 rounded-md text-[#B9E9FF] hover:text-white transition-colors"
              title="Toggle Privacy Mask"
            >
              {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5 text-[#FFD21F]" /> : <Eye className="w-3.5 h-3.5 text-[#B9E9FF]" />}
            </button>
          </div>

          <div className="w-6 h-6 rounded-full bg-white/15 group-hover:bg-white/25 border border-white/20 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-all">
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-end justify-between relative z-10">
          <div className="space-y-1.5">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              {isPrivacyMode ? '••••••••' : formatCurrency(netWorthDisplay, false)}
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[rgba(25,201,167,0.16)] border border-[#19C9A7]/50 text-[#55D98A] text-[11px] font-bold">
              <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
              <span>12% this month</span>
            </div>
          </div>

          {/* Embedded Multi-Stage Brand Gradient Wave Sparkline Graph */}
          <div className="w-36 h-14 -mr-1">
            <svg viewBox="0 0 120 50" className="w-full h-full overflow-visible">
              <defs>
                {/* Area Fill Gradient: Soft Transparent Brand Fill */}
                <linearGradient id="kinoraGraphFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#168BFF" stopOpacity="0.30" />
                  <stop offset="50%" stopColor="#16C7F2" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#073B9E" stopOpacity="0.0" />
                </linearGradient>
                {/* Multi-Stage Brand Stroke Gradient: Blue -> Cyan -> Teal -> Lime */}
                <linearGradient id="kinoraGraphLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#168BFF" />
                  <stop offset="35%" stopColor="#16C7F2" />
                  <stop offset="70%" stopColor="#19C9A7" />
                  <stop offset="100%" stopColor="#B9F36B" />
                </linearGradient>
              </defs>
              <path
                d="M 0 38 Q 20 42, 40 26 T 80 18 T 120 6 L 120 50 L 0 50 Z"
                fill="url(#kinoraGraphFill)"
              />
              <path
                d="M 0 38 Q 20 42, 40 26 T 80 18 T 120 6"
                fill="none"
                stroke="url(#kinoraGraphLine)"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              {/* Final Growth Peak Indicator */}
              <circle cx="120" cy="6" r="3.5" fill="#B9F36B" className="animate-ping" opacity="0.75" />
              <circle cx="120" cy="6" r="3" fill="#B9F36B" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. 4 Quick Actions in KinoraOne Brand Palette Boxes */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {/* Action 1: Add Expense (Kinora Orange / Gold Accent) */}
        <button
          onClick={() => setShowAddExpenseModal(true)}
          className="flex flex-col items-center justify-center p-2.5 rounded-[20px] bg-gradient-to-b from-[rgba(255,138,36,0.16)] to-[rgba(7,59,158,0.35)] border border-[rgba(255,138,36,0.55)] hover:border-[#FF8A24] active:scale-95 transition-all shadow-md shadow-[rgba(6,31,92,0.4)] group"
        >
          <div className="w-10 h-10 rounded-xl bg-[rgba(255,138,36,0.16)] border border-[#FF8A24]/40 flex items-center justify-center text-[#FFD21F] group-hover:bg-[#FF8A24] group-hover:text-white transition-all mb-1 shadow-sm">
            <Receipt className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold text-white text-center leading-tight">Add Expense</span>
        </button>

        {/* Action 2: Wish List (Kinora Cyan / Bright Blue Accent) */}
        <button
          onClick={() => setShowWishListModal(true)}
          className="flex flex-col items-center justify-center p-2.5 rounded-[20px] bg-gradient-to-b from-[rgba(22,199,242,0.15)] to-[rgba(7,59,158,0.35)] border border-[rgba(22,199,242,0.50)] hover:border-[#16C7F2] active:scale-95 transition-all shadow-md shadow-[rgba(6,31,92,0.4)] group"
        >
          <div className="w-10 h-10 rounded-xl bg-[rgba(22,199,242,0.15)] border border-[#16C7F2]/40 flex items-center justify-center text-[#16C7F2] group-hover:bg-[#16C7F2] group-hover:text-white transition-all mb-1 shadow-sm">
            <Gift className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold text-white text-center leading-tight">Wish List</span>
        </button>

        {/* Action 3: Set Goal (Kinora Teal / Mint Green Accent) */}
        <button
          onClick={() => setShowSetGoalModal(true)}
          className="flex flex-col items-center justify-center p-2.5 rounded-[20px] bg-gradient-to-b from-[rgba(25,201,167,0.15)] to-[rgba(7,59,158,0.35)] border border-[rgba(25,201,167,0.50)] hover:border-[#55D98A] active:scale-95 transition-all shadow-md shadow-[rgba(6,31,92,0.4)] group"
        >
          <div className="w-10 h-10 rounded-xl bg-[rgba(25,201,167,0.15)] border border-[#19C9A7]/40 flex items-center justify-center text-[#55D98A] group-hover:bg-[#55D98A] group-hover:text-white transition-all mb-1 shadow-sm">
            <Target className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold text-white text-center leading-tight">Set Goal</span>
        </button>

        {/* Action 4: Add Income (Kinora Bright Blue / Cyan Accent) */}
        <button
          onClick={() => setShowAddIncomeModal(true)}
          className="flex flex-col items-center justify-center p-2.5 rounded-[20px] bg-gradient-to-b from-[rgba(22,139,255,0.16)] to-[rgba(7,59,158,0.35)] border border-[rgba(22,139,255,0.50)] hover:border-[#168BFF] active:scale-95 transition-all shadow-md shadow-[rgba(6,31,92,0.4)] group"
        >
          <div className="w-10 h-10 rounded-xl bg-[rgba(22,139,255,0.16)] border border-[#168BFF]/40 flex items-center justify-center text-[#7EDCFF] group-hover:bg-[#168BFF] group-hover:text-white transition-all mb-1 shadow-sm">
            <Wallet className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold text-white text-center leading-tight">Add Income</span>
        </button>
      </div>

      {/* 4. Quick Overview (3 Premium Financial Summary Cards) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white tracking-tight">Quick Overview</h3>
          <button
            onClick={() => onNavigateTab('money')}
            className="text-[11px] text-[#16C7F2] hover:text-[#7EDCFF] font-bold flex items-center gap-0.5 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#16C7F2]" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Card 1: Monthly Spending (Orange/Yellow Accent) */}
          <div
            onClick={() => onNavigateTab('money')}
            className="p-3.5 rounded-[22px] bg-gradient-to-br from-[rgba(255,185,31,0.14)] to-[rgba(255,138,36,0.08)] border border-[rgba(255,185,31,0.45)] shadow-lg shadow-[#061F5C]/40 flex flex-col justify-between hover:border-[#FFB91F] transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-[#FFD21F]/20 text-[#FFD21F] flex items-center justify-center text-[10px] font-black">₹</div>
                <div className="text-[10px] font-bold text-[#FFD21F] leading-tight">Monthly Spending</div>
              </div>
              <div className="text-sm sm:text-base font-black text-white mt-1.5">
                {isPrivacyMode ? '••••' : formatCurrency(snapshot.monthlySpending || 0, false)}
              </div>
            </div>
            <div className="text-[10px] font-bold text-[#FF8A70] mt-2 flex items-center gap-0.5">
              <span>{(snapshot.monthlySpending || 0) > 0 ? '↓ 8%' : '₹0 spent'}</span>
              <span className="text-[#B9D8FF]/70 text-[9px] font-normal">{(snapshot.monthlySpending || 0) > 0 ? 'vs last mo' : 'this month'}</span>
            </div>
          </div>

          {/* Card 2: Savings (Teal/Green Accent) */}
          <div
            onClick={() => onNavigateTab('money')}
            className="p-3.5 rounded-[22px] bg-gradient-to-br from-[rgba(25,201,167,0.15)] to-[rgba(85,217,138,0.08)] border border-[rgba(25,201,167,0.45)] shadow-lg shadow-[#061F5C]/40 flex flex-col justify-between hover:border-[#55D98A] transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-[#55D98A]/20 text-[#55D98A] flex items-center justify-center text-[10px]">🌱</div>
                <div className="text-[10px] font-bold text-[#55D98A] leading-tight">Savings</div>
              </div>
              <div className="text-sm sm:text-base font-black text-white mt-1.5">
                {isPrivacyMode ? '••••' : formatCurrency(snapshot.totalSavings || 0, true)}
              </div>
            </div>
            <div className="text-[10px] font-bold text-[#55D98A] mt-2 flex items-center gap-0.5">
              <span>{(snapshot.totalSavings || 0) > 0 ? '↑ 15%' : '₹0 saved'}</span>
              <span className="text-[#B9D8FF]/70 text-[9px] font-normal">{(snapshot.totalSavings || 0) > 0 ? 'this year' : 'this year'}</span>
            </div>
          </div>

          {/* Card 3: Goals (Blue/Cyan Accent) */}
          <div
            onClick={() => onNavigateTab('money')}
            className="p-3.5 rounded-[22px] bg-gradient-to-br from-[rgba(22,139,255,0.15)] to-[rgba(22,199,242,0.08)] border border-[rgba(22,199,242,0.45)] shadow-lg shadow-[#061F5C]/40 flex flex-col justify-between hover:border-[#16C7F2] transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-[#16C7F2]/20 text-[#16C7F2] flex items-center justify-center text-[10px]">🎯</div>
                <div className="text-[10px] font-bold text-[#7EDCFF] leading-tight">Goals</div>
              </div>
              <div className="text-sm sm:text-base font-black text-white mt-1.5">
                {goals && goals.length > 0 ? `${goals.filter(g => g.current_amount >= g.target_amount).length}/${goals.length}` : '0/0'}
              </div>
            </div>
            <div className="text-[10px] font-bold text-[#16C7F2] mt-2">
              {goals && goals.length > 0 ? 'On Track' : '0 Active'}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Upcoming Card (Kinora Trust & Family Theme) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white tracking-tight">Upcoming</h3>
          <button
            onClick={() => onNavigateTab('family')}
            className="text-[11px] text-[#16C7F2] hover:text-[#7EDCFF] font-bold flex items-center gap-0.5 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#16C7F2]" />
          </button>
        </div>

        {(() => {
          const calendarEvents = dashboard?.today?.events || [];
          if (calendarEvents.length > 0) {
            const ev = calendarEvents[0];
            return (
              <div
                onClick={() => onNavigateTab('calendar')}
                className="p-3.5 rounded-[22px] bg-[rgba(7,59,158,0.35)] border border-[rgba(22,139,255,0.25)] shadow-md flex items-center justify-between hover:border-[#168BFF]/60 transition-all cursor-pointer group backdrop-blur-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#168BFF]/25 to-[#16C7F2]/25 border border-[#168BFF]/40 flex items-center justify-center text-[#16C7F2] shrink-0">
                    <Calendar className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-[#7EDCFF] transition-colors">
                      {ev.title} 📅
                    </div>
                    <div className="text-[10px] text-[#A9DFFF] mt-0.5">
                      {ev.start_date ? formatDate(ev.start_date) : 'Upcoming Event'}
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#168BFF]/20 border border-[#168BFF]/40 flex items-center justify-center text-[#7EDCFF] text-xs font-bold">
                  ➔
                </div>
              </div>
            );
          }

          // Birthday calculation
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
              className="p-3.5 rounded-[22px] bg-[rgba(7,59,158,0.35)] border border-[rgba(22,139,255,0.25)] shadow-md flex items-center justify-between hover:border-[#168BFF]/60 transition-all cursor-pointer group backdrop-blur-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF8A24]/20 to-[#FFD21F]/20 border border-[#FF8A24]/40 flex items-center justify-center text-[#FFD21F] shrink-0">
                  <Cake className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-[#7EDCFF] transition-colors">
                    {nearest ? `${nearest.member.name.split(' ')[0]}'s Birthday 🎂` : "Family Birthday 🎂"}
                  </div>
                  <div className="text-[10px] text-[#A9DFFF] mt-0.5">
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
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#16C7F2]/60 shadow-sm"
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
            className="text-[11px] text-[#16C7F2] hover:text-[#7EDCFF] font-bold flex items-center gap-0.5 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#16C7F2]" />
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
                className="min-w-[140px] max-w-[140px] rounded-[20px] bg-[#073B9E]/40 border border-[#168BFF]/25 overflow-hidden shadow-md shrink-0 cursor-pointer group hover:border-[#16C7F2]/60 transition-all"
              >
                <div className="h-24 overflow-hidden relative">
                  <img
                    src={imgUrl}
                    alt={mem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#061F5C]/95 via-transparent to-transparent" />
                  <span className="absolute bottom-1.5 left-2.5 text-[9px] font-bold text-white truncate max-w-[120px]">
                    {mem.location || mem.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MODALS (WITH KINORAONE THEME SYSTEM) ================= */}

      {/* 1. Add Expense Modal (Interactive Icon Grid & Preset Pills) */}
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onSubmit={handleCreateExpense}
      />

      {/* 2. Wish List Modal */}
      {showWishListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#061F5C] border-2 border-[#16C7F2]/40 rounded-3xl p-5 text-[#F4F8FF] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#168BFF]/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#16C7F2]/20 text-[#16C7F2] border border-[#16C7F2]/40">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Family Wish List</h3>
                  <p className="text-[10px] text-[#B9D8FF]">Stored in Family Hub • Shared with all members</p>
                </div>
              </div>
              <button onClick={() => setShowWishListModal(false)} className="text-[#B9D8FF] hover:text-white text-sm">✕</button>
            </div>

            {/* Add Wish Item Form */}
            <form onSubmit={handleAddWish} className="p-3.5 bg-[#073B9E]/50 border border-[#168BFF]/35 rounded-2xl space-y-2.5">
              <div className="text-xs font-bold text-[#FFD21F]">+ Add New Wish</div>
              <div>
                <input
                  type="text"
                  required
                  placeholder="Wish item (e.g. Sony Wireless Headphones)"
                  value={newWishTitle}
                  onChange={(e) => setNewWishTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#03194A] border border-[#168BFF]/40 rounded-xl text-xs text-white outline-none focus:border-[#16C7F2]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newWishCategory}
                  onChange={(e) => setNewWishCategory(e.target.value)}
                  className="px-3 py-2 bg-[#03194A] border border-[#168BFF]/40 rounded-xl text-xs text-white outline-none focus:border-[#16C7F2]"
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
                  className="px-3 py-2 bg-[#03194A] border border-[#168BFF]/40 rounded-xl text-xs text-white outline-none focus:border-[#16C7F2]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-[#168BFF] to-[#16C7F2] hover:opacity-95 text-white font-bold rounded-xl text-xs shadow-md shadow-[#168BFF]/30 active:scale-98 transition-all"
              >
                Add to Family Wish List
              </button>
            </form>

            {/* Wish List items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#B9D8FF]">
                <span>Shared Wish List ({wishlistItems.length})</span>
                <span className="text-[10px] text-[#91A8C7] font-normal">Tap check to mark fulfilled</span>
              </div>
              {wishlistItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#91A8C7]">No wishes added yet. Make a wish above! ✨</div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {wishlistItems.map((wish) => (
                    <div
                      key={wish.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        wish.is_purchased
                          ? 'bg-[#03194A]/60 border-[#168BFF]/15 opacity-60'
                          : 'bg-[#073B9E]/50 border-[#168BFF]/35 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                        <button
                          type="button"
                          onClick={() => toggleWishFulfilled(wish.id)}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                            wish.is_purchased
                              ? 'bg-[#55D98A] border-[#55D98A] text-[#03194A]'
                              : 'border-[#168BFF]/60 hover:border-[#16C7F2]'
                          }`}
                        >
                          {wish.is_purchased && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <div className="min-w-0">
                          <div className={`text-xs font-bold truncate ${wish.is_purchased ? 'line-through text-[#91A8C7]' : 'text-white'}`}>
                            {wish.item_name}
                          </div>
                          <div className="text-[10px] text-[#B9D8FF] truncate mt-0.5">
                            Added by <span className="text-[#FFD21F] font-semibold">{wish.added_by_name || 'Family'}</span>
                            {wish.estimated_cost ? (
                              <span className="text-[#55D98A] font-bold ml-1.5">• ₹{Number(wish.estimated_cost).toLocaleString('en-IN')}</span>
                            ) : wish.quantity && wish.quantity !== '1 unit' && (
                              <span className="text-[#B9D8FF] ml-1.5">• {wish.quantity}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] bg-[#03194A] text-[#7EDCFF] px-2 py-0.5 rounded-full font-semibold border border-[#168BFF]/30">
                          {wish.category || 'WISH'}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteWishItem(wish.id)}
                          className="p-1.5 text-[#91A8C7] hover:text-[#FF4D6D] transition-colors"
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

      {/* 3. Set Goal Modal */}
      {showSetGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#061F5C] border-2 border-[#19C9A7]/40 rounded-3xl p-5 text-[#F4F8FF] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#168BFF]/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#19C9A7]/20 text-[#55D98A] border border-[#19C9A7]/40">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Set Family Financial Goal</h3>
                  <p className="text-[10px] text-[#B9D8FF]">Synced with Money & Wealth Tracker</p>
                </div>
              </div>
              <button onClick={() => setShowSetGoalModal(false)} className="text-[#B9D8FF] hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="text-xs text-[#B9D8FF] font-semibold">Goal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Buy Dream House / Europe Trip / Child MBA"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-[#073B9E]/40 border border-[#168BFF]/40 rounded-xl text-xs text-white outline-none focus:border-[#55D98A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-[#B9D8FF] font-semibold mb-1 block">Goal Category</label>
                  <select
                    value={goalForm.category}
                    onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#073B9E]/60 border border-[#168BFF]/40 rounded-xl text-xs text-white outline-none"
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
                  <label className="text-xs text-[#B9D8FF] font-semibold mb-1 block">Priority</label>
                  <select
                    value={goalForm.priority}
                    onChange={(e) => setGoalForm({ ...goalForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-[#073B9E]/60 border border-[#168BFF]/40 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="HIGH">🔥 High Priority</option>
                    <option value="MEDIUM">⚡ Medium Priority</option>
                    <option value="LOW">🌱 Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-[#B9D8FF] font-semibold">Target Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000000"
                    value={goalForm.target_amount}
                    onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-[#073B9E]/40 border border-[#168BFF]/40 rounded-xl text-sm font-bold text-[#55D98A] outline-none focus:border-[#55D98A]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#B9D8FF] font-semibold">Saved So Far (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 100000"
                    value={goalForm.current_amount}
                    onChange={(e) => setGoalForm({ ...goalForm, current_amount: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-[#073B9E]/40 border border-[#168BFF]/40 rounded-xl text-sm font-bold text-[#FFD21F] outline-none focus:border-[#55D98A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-[#B9D8FF] font-semibold mb-1 block">Monthly SIP / Save (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={goalForm.monthly_contribution}
                    onChange={(e) => setGoalForm({ ...goalForm, monthly_contribution: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#073B9E]/40 border border-[#168BFF]/40 rounded-xl text-xs text-white outline-none focus:border-[#55D98A]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#B9D8FF] font-semibold mb-1 block">Target Date</label>
                  <input
                    type="date"
                    required
                    value={goalForm.target_date}
                    onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#073B9E]/40 border border-[#168BFF]/40 rounded-xl text-xs text-white outline-none focus:border-[#55D98A]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#19C9A7] to-[#55D98A] hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-[#19C9A7]/30 text-xs transition-all active:scale-98 mt-2"
              >
                Create Financial Goal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Income Modal */}
      {showAddIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#061F5C] border-2 border-[#168BFF]/40 rounded-3xl p-5 text-[#F4F8FF] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#168BFF]/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#168BFF]/20 text-[#7EDCFF] border border-[#168BFF]/40">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add Family Income / Deposit</h3>
                  <p className="text-[10px] text-[#B9D8FF]">Credits directly to Family Wealth balance</p>
                </div>
              </div>
              <button onClick={() => setShowAddIncomeModal(false)} className="text-[#B9D8FF] hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleAddIncome} className="space-y-3">
              <div>
                <label className="text-xs text-[#B9D8FF] font-semibold">Income Amount (₹ INR) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 150000"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-[#073B9E]/40 border border-[#168BFF]/40 rounded-xl text-lg font-bold text-[#55D98A] outline-none focus:border-[#168BFF]"
                />
              </div>

              <div>
                <label className="text-xs text-[#B9D8FF] font-semibold">Income Source / Employer *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Salary / Freelance / Business"
                  value={incomeForm.source}
                  onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-[#073B9E]/40 border border-[#168BFF]/40 rounded-xl text-xs text-white outline-none focus:border-[#168BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-[#B9D8FF] font-semibold mb-1 block">Income Type</label>
                  <select
                    value={incomeForm.type}
                    onChange={(e) => setIncomeForm({ ...incomeForm, type: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#073B9E]/60 border border-[#168BFF]/40 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="SALARY">Primary Salary</option>
                    <option value="BUSINESS">Business Income</option>
                    <option value="DIVIDEND">Investments / Dividends</option>
                    <option value="RENTAL">Rental Income</option>
                    <option value="GIFT">Cash Gift / Bonus</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#B9D8FF] font-semibold mb-1 block">Received Date</label>
                  <input
                    type="date"
                    required
                    value={incomeForm.date}
                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#073B9E]/40 border border-[#168BFF]/40 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#B9D8FF] font-semibold">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. September Salary credited to HDFC"
                  value={incomeForm.notes}
                  onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#073B9E]/40 border border-[#168BFF]/40 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#0869E8] to-[#168BFF] hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-[#0869E8]/30 text-xs transition-all active:scale-98 mt-2"
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
