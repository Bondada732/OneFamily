import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useFamily } from '../../context/FamilyContext.js';
import { useSecurity } from '../../context/SecurityContext.js';
import { translations } from '../../i18n/index.js';
import { formatCurrency, formatDate, getLocalDateString } from '../../utils/formatters.js';
import { apiRequest } from '../../utils/api.js';
import { Expense, BudgetReport, Investment, Liability, Goal } from '../../types/index.js';
import { Plus, Receipt, TrendingUp, ShieldAlert, Sparkles, AlertTriangle, CheckCircle2, ChevronRight, Camera, ArrowDownLeft, ArrowUpRight, DollarSign, Wallet, Target, PiggyBank, Landmark, Building, CreditCard, Coins, X, Check, Trash2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'cat_groceries', name: 'Groceries & Kirana' },
  { id: 'cat_dining', name: 'Food & Dining / Swiggy' },
  { id: 'cat_utilities', name: 'Utilities & Bills' },
  { id: 'cat_rent', name: 'Rent & Maintenance' },
  { id: 'cat_education', name: 'Education & School' },
  { id: 'cat_transport', name: 'Transport & Fuel' },
  { id: 'cat_healthcare', name: 'Healthcare & Pharmacy' },
  { id: 'cat_shopping', name: 'Shopping & Apparel' },
  { id: 'cat_entertainment', name: 'Entertainment & OTT' },
  { id: 'cat_travel', name: 'Travel & Trips' },
  { id: 'cat_insurance', name: 'Insurance Premiums' },
  { id: 'cat_investments', name: 'Investments / SIP' },
  { id: 'cat_emi', name: 'Loan EMI & Debts' },
  { id: 'cat_misc', name: 'Miscellaneous & Pooja' },
];

export const MoneyView: React.FC = () => {
  const { currentUser, family, activeLanguage, hasPermission, familyMembers } = useAuth();
  const { refreshDashboard } = useFamily();
  const { isPrivacyMode } = useSecurity();
  const t = translations[activeLanguage];


  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'BUDGET' | 'EXPENSES' | 'WEALTH' | 'GOALS'>('OVERVIEW');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [budgetReports, setBudgetReports] = useState<BudgetReport[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [netWorthData, setNetWorthData] = useState<any>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showScanReceipt, setShowScanReceipt] = useState(false);
  const [receiptResult, setReceiptResult] = useState<any>(null);

  // Wealth & Goals Modals State
  const [showAddInvestment, setShowAddInvestment] = useState(false);
  const [showAddLiability, setShowAddLiability] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  // New Investment Form State
  const [newInvestment, setNewInvestment] = useState({
    title: '',
    type: 'MUTUAL_FUND',
    institution: '',
    invested_amount: '',
    current_value: '',
    maturity_date: '',
    folio_number: '',
    nominee: '',
    notes: '',
    owner_name: currentUser?.name || 'Self',
  });

  // New Liability Form State
  const [newLiability, setNewLiability] = useState({
    title: '',
    type: 'HOME_LOAN',
    lender: '',
    total_loan: '',
    outstanding_amount: '',
    monthly_emi: '',
    interest_rate: '8.5',
    end_date: '',
    owner_name: currentUser?.name || 'Self',
  });

  // New Goal Form State
  const [newGoal, setNewGoal] = useState({
    title: '',
    category: 'EDUCATION',
    target_amount: '',
    current_amount: '',
    monthly_contribution: '10000',
    target_date: '2028-12-31',
    priority: 'HIGH' as 'HIGH' | 'MEDIUM' | 'LOW',
  });

  // Budget Limit Editing State
  const [editingBudgetCat, setEditingBudgetCat] = useState<BudgetReport | null>(null);
  const [newBudgetLimit, setNewBudgetLimit] = useState('');

  // New Expense Form State
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category_id: 'cat_groceries',
    category_name: 'Groceries & Kirana',
    merchant: '',
    payment_method: 'UPI',
    notes: '',
    date: getLocalDateString(),
  });

  const canViewFinance = hasPermission('FINANCE_VIEW');
  const canEditFinance = hasPermission('FINANCE_EDIT');

  useEffect(() => {
    if (!canViewFinance || !family?.id) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [expData, budData, invData, goalData] = await Promise.all([
          apiRequest(`/expenses/${family.id}/expenses`),
          apiRequest(`/budget/${family.id}/budget`),
          apiRequest(`/investments/${family.id}/investments`),
          apiRequest(`/goals/${family.id}/goals`),
        ]);

        setExpenses(expData.expenses || []);
        setCategories(expData.categories || budData.categories || []);
        setBudgetReports(budData.categories || []);
        setInvestments(invData.investments || []);
        setLiabilities(invData.liabilities || []);
        setNetWorthData(invData);
        setGoals(goalData || []);
      } catch (err) {
        console.error('Failed to load money data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [family?.id, canViewFinance, currentUser?.id]);


  if (!canViewFinance) {
    return (
      <div className="p-6 text-center space-y-4 my-auto">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white">Financial Access Restricted</h2>
        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          {currentUser?.role === 'CHILD'
            ? "You are logged in as a Child account. Family financial balances and investments are private to Family Heads and Parents."
            : t.permissionDenied}
        </p>
      </div>
    );
  }

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !family?.id) return;

    try {
      const created = await apiRequest(`/expenses/${family.id}/expenses`, {
        method: 'POST',
        body: JSON.stringify(newExpense),
      });
      setExpenses((prev) => [created, ...prev]);
      setShowAddExpense(false);
      setNewExpense({
        amount: '',
        category_id: categoryOptions[0]?.id || 'cat_groceries',
        category_name: categoryOptions[0]?.name || 'Groceries & Kirana',
        merchant: '',
        payment_method: 'UPI',
        notes: '',
        date: getLocalDateString(),
      });
      const budData = await apiRequest(`/budget/${family.id}/budget`);
      setBudgetReports(budData.categories || []);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to create expense:', err);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!family?.id) return;
    try {
      await apiRequest(`/expenses/${family.id}/expenses/${expenseId}`, {
        method: 'DELETE',
      });
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      const budData = await apiRequest(`/budget/${family.id}/budget`);
      setBudgetReports(budData.categories || []);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !family?.id) return;
    try {
      const created = await apiRequest(`/expenses/${family.id}/categories`, {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      setCategories((prev) => [...prev, created]);
      setNewCategoryName('');
      const budData = await apiRequest(`/budget/${family.id}/budget`);
      setBudgetReports(budData.categories || []);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to create category:', err);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!family?.id) return;
    try {
      await apiRequest(`/expenses/${family.id}/categories/${catId}`, {
        method: 'DELETE',
      });
      setCategories((prev) => prev.filter((c) => (c.id || c.categoryId) !== catId));
      const budData = await apiRequest(`/budget/${family.id}/budget`);
      setBudgetReports(budData.categories || []);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };


  const handleCreateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvestment.title.trim() || !family?.id) return;
    try {
      const created = await apiRequest(`/investments/${family.id}/investments`, {
        method: 'POST',
        body: JSON.stringify(newInvestment),
      });
      setInvestments((prev) => [created, ...prev]);
      setShowAddInvestment(false);
      setNewInvestment({
        title: '',
        type: 'MUTUAL_FUND',
        institution: '',
        invested_amount: '',
        current_value: '',
        maturity_date: '',
        folio_number: '',
        nominee: '',
        notes: '',
        owner_name: currentUser?.name || 'Self',
      });
      const invData = await apiRequest(`/investments/${family.id}/investments`);
      setNetWorthData(invData);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to create investment:', err);
    }
  };

  const handleDeleteInvestment = async (invId: string) => {
    if (!family?.id) return;
    try {
      await apiRequest(`/investments/${family.id}/investments/${invId}`, {
        method: 'DELETE',
      });
      setInvestments((prev) => prev.filter((i) => i.id !== invId));
      const invData = await apiRequest(`/investments/${family.id}/investments`);
      setNetWorthData(invData);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to delete investment:', err);
    }
  };

  const handleDeleteLiability = async (liaId: string) => {
    if (!family?.id) return;
    try {
      await apiRequest(`/investments/${family.id}/liabilities/${liaId}`, {
        method: 'DELETE',
      });
      setLiabilities((prev) => prev.filter((l) => l.id !== liaId));
      const invData = await apiRequest(`/investments/${family.id}/investments`);
      setNetWorthData(invData);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to delete liability:', err);
    }
  };

  const handleCreateLiability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLiability.title.trim() || !family?.id) return;
    try {
      const created = await apiRequest(`/investments/${family.id}/liabilities`, {
        method: 'POST',
        body: JSON.stringify(newLiability),
      });
      setLiabilities((prev) => [created, ...prev]);
      setShowAddLiability(false);
      setNewLiability({
        title: '',
        type: 'HOME_LOAN',
        lender: '',
        total_loan: '',
        outstanding_amount: '',
        monthly_emi: '',
        interest_rate: '8.5',
        end_date: '',
        owner_name: currentUser?.name || 'Self',
      });
      const invData = await apiRequest(`/investments/${family.id}/investments`);
      setNetWorthData(invData);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to create liability:', err);
    }
  };

  const handleSaveBudgetLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudgetCat || !family?.id) return;
    try {
      await apiRequest(`/budget/${family.id}/budget`, {
        method: 'POST',
        body: JSON.stringify({
          category_id: editingBudgetCat.categoryId,
          category_name: editingBudgetCat.categoryName,
          monthly_limit: Number(newBudgetLimit) || 0,
          month_year: '2026-09',
        }),
      });
      const bData = await apiRequest(`/budget/${family.id}/budget?month=2026-09`);
      setBudgetReports(bData.categories || []);
      setEditingBudgetCat(null);
      setNewBudgetLimit('');
      refreshDashboard();
    } catch (err) {
      console.error('Failed to update budget limit:', err);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim() || !family?.id) return;
    try {
      const created = await apiRequest(`/goals/${family.id}/goals`, {
        method: 'POST',
        body: JSON.stringify(newGoal),
      });
      const target = Number(created.target_amount) || 1;
      const current = Number(created.current_amount) || 0;
      setGoals((prev) => [
        {
          ...created,
          progressPct: Math.min(100, Math.round((current / target) * 100)),
          shortfall: Math.max(0, target - current),
          monthsRemaining: Math.ceil((target - current) / (created.monthly_contribution || 10000)),
          isOnTrack: true,
        },
        ...prev,
      ]);
      setShowAddGoal(false);
      setNewGoal({
        title: '',
        category: 'EDUCATION',
        target_amount: '',
        current_amount: '',
        monthly_contribution: '10000',
        target_date: '2028-12-31',
        priority: 'HIGH',
      });
      refreshDashboard();
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };


  const handleContributeToGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributingGoal || !contributionAmount || !family?.id) return;
    const added = Number(contributionAmount) || 0;
    const newCurrent = (contributingGoal.current_amount || 0) + added;
    try {
      await apiRequest(`/goals/${family.id}/goals/${contributingGoal.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ current_amount: newCurrent }),
      });
      setGoals((prev) =>
        prev.map((g) => {
          if (g.id === contributingGoal.id) {
            const target = g.target_amount || 1;
            return {
              ...g,
              current_amount: newCurrent,
              progressPct: Math.min(100, Math.round((newCurrent / target) * 100)),
              shortfall: Math.max(0, target - newCurrent),
            };
          }
          return g;
        })
      );
      setContributingGoal(null);
      setContributionAmount('');
      refreshDashboard();
    } catch (err) {
      console.error('Failed to contribute to goal:', err);
    }
  };


  const handleSimulateScan = async (sampleName: string) => {
    try {
      const res = await apiRequest(`/expenses/${family?.id}/scan-receipt`, {
        method: 'POST',
        body: JSON.stringify({ fileName: sampleName }),
      });
      setReceiptResult(res.extracted);
    } catch (err) {
      console.error(err);
    }
  };

  const applyScannedReceipt = () => {
    if (!receiptResult) return;
    setNewExpense({
      amount: String(receiptResult.amount),
      category_id: 'cat_groceries',
      category_name: receiptResult.category,
      merchant: receiptResult.merchant,
      payment_method: receiptResult.paymentMethod || 'UPI',
      notes: `Scanned items: ${receiptResult.items?.map((i: any) => i.name).join(', ')}`,
      date: receiptResult.date || getLocalDateString(),
    });
    setReceiptResult(null);
    setShowScanReceipt(false);
    setShowAddExpense(true);
  };

  const categoryOptions = categories.length > 0
    ? categories.map((c: any) => ({ id: c.id || c.categoryId, name: c.name || c.categoryName }))
    : budgetReports.length > 0
    ? budgetReports.map((b) => ({ id: b.categoryId, name: b.categoryName }))
    : DEFAULT_EXPENSE_CATEGORIES;

  const netWorthHistory = netWorthData?.netWorthHistory || [];


  return (
    <div className="p-4 space-y-5 animate-fade-in text-slate-100 pb-12">
      {/* Title & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Family Wealth & Budget</h2>
          <p className="text-xs text-slate-400">Total control over Indian family finances</p>
        </div>
        {canEditFinance && (
          <div className="flex items-center gap-1.5">
            {activeSubTab === 'WEALTH' ? (
              <>
                <button
                  onClick={() => setShowAddInvestment(true)}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs flex items-center gap-1 font-bold shadow-md shadow-emerald-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Asset</span>
                </button>
                <button
                  onClick={() => setShowAddLiability(true)}
                  className="p-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs flex items-center gap-1 font-bold shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Loan</span>
                </button>
              </>
            ) : activeSubTab === 'GOALS' ? (
              <button
                onClick={() => setShowAddGoal(true)}
                className="p-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white rounded-xl text-xs flex items-center gap-1 font-bold shadow-md shadow-amber-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Goal</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowScanReceipt(true)}
                  className="p-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-xl border border-indigo-500/40 text-xs flex items-center gap-1 font-semibold"
                  title="Scan Receipt OCR"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scan</span>
                </button>
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl text-xs flex items-center gap-1 font-bold shadow-md shadow-amber-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Expense</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80 overflow-x-auto scrollbar-none">
        {(['OVERVIEW', 'BUDGET', 'EXPENSES', 'WEALTH', 'GOALS'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeSubTab === tab
                ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW SUBTAB */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-4">
          {/* Net Worth Hero Card */}
          <div className="p-4 rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 shadow-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Family Net Worth (Formula: Assets - Liabilities)</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                +4.2% YoY
              </span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              {isPrivacyMode ? '••••••' : formatCurrency(netWorthData?.netWorth)}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Assets</span>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {isPrivacyMode ? '••••' : formatCurrency(netWorthData?.totalAssetValue)}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Liabilities</span>
                <div className="text-sm font-bold text-rose-400 mt-0.5">
                  {isPrivacyMode ? '••••' : formatCurrency(netWorthData?.totalLiabilities)}
                </div>
              </div>
            </div>

            {/* Growth Chart */}
            <div className="h-32 mt-4 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={netWorthHistory}>
                  <defs>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F6BF5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4F6BF5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`₹${val} Lakhs`, 'Net Worth']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="netWorth" stroke="#4F6BF5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNet)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Expense Breakdown */}
          <div className="p-4 rounded-3xl bg-slate-800/90 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Recent Family Expenses</span>
              <button onClick={() => setActiveSubTab('EXPENSES')} className="text-indigo-400 hover:underline">
                View All ({expenses.length}) →
              </button>
            </div>

            <div className="space-y-2">
              {expenses.slice(0, 3).map((exp) => (
                <div key={exp.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {exp.payment_method === 'UPI' ? 'UPI' : '₹'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{exp.merchant}</div>
                      <div className="text-[10px] text-slate-400">{exp.category_name} • Paid by {exp.paid_by_name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-rose-400">
                      {isPrivacyMode ? '••••' : `-₹${exp.amount.toLocaleString('en-IN')}`}
                    </div>
                    <div className="text-[10px] text-slate-500">{formatDate(exp.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. BUDGET SUBTAB */}
      {activeSubTab === 'BUDGET' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>Monthly Household Budget</span>
                {canEditFinance && (
                  <button
                    onClick={() => setShowManageCategories(true)}
                    className="text-[10px] text-amber-300 font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-lg transition-all"
                  >
                    + Manage Categories
                  </button>
                )}
              </div>
              <span className="text-amber-400 font-bold">{budgetReports.length} Categories</span>
            </div>
            <div className="text-xl font-extrabold text-white mt-1">
              {formatCurrency(budgetReports.reduce((s, b) => s + (b.spent || 0), 0))} / {formatCurrency(budgetReports.reduce((s, b) => s + (b.limit || 0), 0))}
              <span className="text-xs font-normal text-slate-400 ml-2">
                ({budgetReports.reduce((s, b) => s + (b.limit || 0), 0) > 0 
                  ? ((budgetReports.reduce((s, b) => s + (b.spent || 0), 0) / budgetReports.reduce((s, b) => s + (b.limit || 0), 0)) * 100).toFixed(1) 
                  : 0}% spent)
              </span>
            </div>
            <p className="text-[11px] text-amber-300/90 mt-2 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl">
              💡 Tap any category below to set or adjust your monthly spending budget limit.
            </p>
          </div>

          <div className="space-y-2.5">
            {budgetReports.map((cat) => (
              <div
                key={cat.categoryId}
                onClick={() => {
                  if (canEditFinance) {
                    setEditingBudgetCat(cat);
                    setNewBudgetLimit(cat.limit ? String(cat.limit) : '');
                  }
                }}
                className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white group-hover:text-amber-300 transition-colors">{cat.categoryName}</span>
                    {cat.limit === 0 && (
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-medium">
                        Set Limit ✎
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-200">
                      {isPrivacyMode ? '••••' : `₹${(cat.spent ?? 0).toLocaleString('en-IN')}`} / {cat.limit > 0 ? `₹${cat.limit.toLocaleString('en-IN')}` : 'No limit'}
                    </span>
                    {cat.limit > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          cat.alertStatus === 'EXCEEDED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : cat.alertStatus === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {cat.utilizationPct ?? 0}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      cat.alertStatus === 'EXCEEDED'
                        ? 'bg-rose-500'
                        : cat.alertStatus === 'WARNING'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, cat.utilizationPct ?? 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. EXPENSES SUBTAB */}
      {activeSubTab === 'EXPENSES' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Logged Expenses ({expenses.length})</span>
              {canEditFinance && (
                <button
                  onClick={() => setShowManageCategories(true)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20"
                >
                  ⚙ Categories
                </button>
              )}
            </div>
            <span className="text-xs text-amber-400 font-bold">
              Total: {formatCurrency(expenses.reduce((s, e) => s + (e.amount || 0), 0))}
            </span>
          </div>

          {expenses.length === 0 ? (
            <div
              onClick={() => setShowAddExpense(true)}
              className="p-6 rounded-3xl bg-slate-800/60 border border-dashed border-slate-700 text-center cursor-pointer hover:border-amber-400 hover:bg-slate-800/90 transition-all space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">No Expenses Logged Yet</div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Track grocery bills, fuel, rent, dining, shopping, and everyday family spends.
                </p>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-lg">
                + Add Your First Expense
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp) => (
                <div key={exp.id} className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between">
                  <div className="overflow-hidden mr-2">
                    <div className="text-xs font-bold text-white truncate">{exp.merchant}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {exp.category_name} • Paid by {exp.paid_by_name} ({exp.payment_method})
                    </div>
                    {exp.notes && <div className="text-[10px] text-slate-500 mt-0.5 italic truncate">{exp.notes}</div>}
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-rose-400">
                        {isPrivacyMode ? '••••' : `-₹${(exp.amount ?? 0).toLocaleString('en-IN')}`}
                      </div>
                      <div className="text-[10px] text-slate-500">{formatDate(exp.date)}</div>
                    </div>
                    {canEditFinance && (
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* 4. WEALTH SUBTAB (Investments, Assets & Liabilities) */}
      {activeSubTab === 'WEALTH' && (
        <div className="space-y-4">
          {/* Asset Categories */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 uppercase">
                Family Investments & Assets ({formatCurrency(investments.reduce((s, i) => s + (i.current_value || 0), 0), true)})
              </span>
              {canEditFinance && (
                <button
                  onClick={() => setShowAddInvestment(true)}
                  className="flex items-center gap-1 text-emerald-400 hover:underline font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Asset</span>
                </button>
              )}
            </div>

            {investments.length === 0 ? (
              <div
                onClick={() => setShowAddInvestment(true)}
                className="p-5 rounded-2xl bg-slate-800/60 border border-dashed border-slate-700 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-slate-800/90 transition-all space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-white">No Assets Added Yet</div>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Track Mutual Funds, Stocks, Gold, FDs, PPF, and Real Estate in one consolidated family portfolio.
                </p>
                <button className="px-3 py-1.5 bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold inline-flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Investment / Asset
                </button>
              </div>
            ) : (
              investments.map((inv) => (
                <div key={inv.id} className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between shadow-sm">
                  <div className="overflow-hidden mr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">{inv.title}</span>
                      <span className="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-medium shrink-0">
                        {inv.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {inv.institution} • Owner: {inv.owner_name}
                    </div>
                    {inv.notes && <div className="text-[10px] text-emerald-400 mt-0.5 truncate">{inv.notes}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">
                        {isPrivacyMode ? '••••' : formatCurrency(inv.current_value)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Invested: ₹{(((inv.invested_amount || 0)) / 100000).toFixed(1)}L
                      </div>
                    </div>
                    {canEditFinance && (
                      <button
                        onClick={() => handleDeleteInvestment(inv.id)}
                        className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Liabilities */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 uppercase">
                Liabilities & Loans ({formatCurrency(liabilities.reduce((s, l) => s + (l.outstanding_amount || 0), 0), true)})
              </span>
              {canEditFinance && (
                <button
                  onClick={() => setShowAddLiability(true)}
                  className="flex items-center gap-1 text-rose-400 hover:underline font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Loan</span>
                </button>
              )}
            </div>

            {liabilities.length === 0 ? (
              <div
                onClick={() => setShowAddLiability(true)}
                className="p-5 rounded-2xl bg-slate-800/60 border border-dashed border-slate-700 text-center cursor-pointer hover:border-rose-500/50 hover:bg-slate-800/90 transition-all space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-white">No Active Loans or Debts</div>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Keep track of Home Loans, Car Loans, EMIs, and Credit Cards to manage family cash flow.
                </p>
                <button className="px-3 py-1.5 bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold inline-flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Loan or EMI
                </button>
              </div>
            ) : (
              liabilities.map((lia) => (
                <div key={lia.id} className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between shadow-sm">
                  <div className="overflow-hidden mr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">{lia.title}</span>
                      <span className="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-medium shrink-0">
                        {lia.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {lia.lender} • Monthly EMI: ₹{(lia.monthly_emi ?? 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-rose-400">
                        {isPrivacyMode ? '••••' : formatCurrency(lia.outstanding_amount)}
                      </div>
                      <div className="text-[10px] text-slate-400">Rate: {lia.interest_rate}%</div>
                    </div>
                    {canEditFinance && (
                      <button
                        onClick={() => handleDeleteLiability(lia.id)}
                        className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Loan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. GOALS SUBTAB */}
      {activeSubTab === 'GOALS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400 uppercase">Family Future Goals</span>
            {canEditFinance && (
              <button
                onClick={() => setShowAddGoal(true)}
                className="flex items-center gap-1 text-amber-400 hover:underline font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Goal</span>
              </button>
            )}
          </div>

          {goals.length === 0 ? (
            <div
              onClick={() => setShowAddGoal(true)}
              className="p-6 rounded-3xl bg-slate-800/60 border border-dashed border-slate-700 text-center cursor-pointer hover:border-amber-400 hover:bg-slate-800/90 transition-all space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">No Family Financial Goals Set</div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Plan for your child's college, a new dream house, annual family vacation, or emergency safety net.
                </p>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-lg">
                + Set Your First Family Goal
              </button>
            </div>
          ) : (
            goals.map((goal) => {
              const pct = goal.target_amount > 0 ? Math.min(100, Math.round(((goal.current_amount || 0) / goal.target_amount) * 100)) : 0;
              return (
                <div key={goal.id} className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{goal.title}</span>
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-500/30">
                          {goal.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Target Date: {goal.target_date} • SIP: ₹{(goal.monthly_contribution ?? 0).toLocaleString('en-IN')}/mo
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-amber-400">{pct}%</span>
                      {canEditFinance && (
                        <button
                          onClick={() => {
                            setContributingGoal(goal);
                            setContributionAmount(String(goal.monthly_contribution || '10000'));
                          }}
                          className="block ml-auto mt-1 px-2 py-0.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-lg text-[10px] font-semibold transition-colors"
                        >
                          + Add Savings
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-indigo-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/50">
                    <span>Saved: {isPrivacyMode ? '••••' : formatCurrency(goal.current_amount)}</span>
                    <span>Target: {formatCurrency(goal.target_amount)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Record Family Expense</h3>
              <button onClick={() => setShowAddExpense(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>
            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Amount (₹ INR) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2400"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-lg font-bold text-amber-400 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Merchant / Payee *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ratnadeep Supermarket"
                  value={newExpense.merchant}
                  onChange={(e) => setNewExpense({ ...newExpense, merchant: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-300 font-semibold">Category *</label>
                    {canEditFinance && (
                      <button
                        type="button"
                        onClick={() => setShowManageCategories(true)}
                        className="text-[10px] text-amber-400 hover:underline font-semibold"
                      >
                        + Manage
                      </button>
                    )}
                  </div>
                  <select
                    value={newExpense.category_id}
                    onChange={(e) => {
                      const sel = e.target.value;
                      const cat = categoryOptions.find((b: any) => (b.id || b.categoryId) === sel);
                      setNewExpense({
                        ...newExpense,
                        category_id: sel,
                        category_name: cat ? (cat.name || cat.categoryName) : 'Miscellaneous',
                      });
                    }}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  >
                    {categoryOptions.map((b: any) => (
                      <option key={b.id || b.categoryId} value={b.id || b.categoryId}>
                        {b.name || b.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Payment Mode</label>
                  <select
                    value={newExpense.payment_method}
                    onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  >
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-300 font-semibold">Expense Date *</label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewExpense({ ...newExpense, date: getLocalDateString() })}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                        newExpense.date === getLocalDateString()
                          ? 'bg-amber-500 text-slate-900 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() - 1);
                        setNewExpense({ ...newExpense, date: getLocalDateString(d) });
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                        newExpense.date === (() => {
                          const d = new Date();
                          d.setDate(d.getDate() - 1);
                          return getLocalDateString(d);
                        })()
                          ? 'bg-amber-500 text-slate-900 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      Yesterday
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly groceries, snacks, household items"
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {showManageCategories && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Manage Expense Categories</h3>
                <p className="text-[11px] text-slate-400">Add custom categories or delete unwanted ones for your family</p>
              </div>
              <button onClick={() => setShowManageCategories(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            {/* Add New Category Form */}
            {canEditFinance && (
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Pet Care, Gardening, Baby Food..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl text-xs flex items-center gap-1 shrink-0 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            )}

            {/* Category List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Existing Categories ({categoryOptions.length})</span>
              {categoryOptions.map((cat: any) => {
                const catId = cat.id || cat.categoryId;
                const catName = cat.name || cat.categoryName;
                return (
                  <div
                    key={catId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/70"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                        🏷️
                      </div>
                      <span className="text-xs font-medium text-slate-200">{catName}</span>
                    </div>
                    {canEditFinance && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(catId)}
                        className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowManageCategories(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Add Investment / Asset Modal */}
      {showAddInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Add Family Asset / Investment</h3>
                <p className="text-[11px] text-slate-400">Mutual funds, stocks, gold, FD, PPF, or real estate</p>
              </div>
              <button onClick={() => setShowAddInvestment(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateInvestment} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Asset / Scheme Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parag Parikh Flexi Cap Fund / 2BHK Flat"
                  value={newInvestment.title}
                  onChange={(e) => setNewInvestment({ ...newInvestment, title: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Asset Type *</label>
                  <select
                    value={newInvestment.type}
                    onChange={(e) => setNewInvestment({ ...newInvestment, type: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="MUTUAL_FUND">Mutual Fund (SIP/Lump)</option>
                    <option value="STOCK">Stocks / Equity</option>
                    <option value="FIXED_DEPOSIT">Fixed Deposit / RD</option>
                    <option value="GOLD">Physical Gold / SGB</option>
                    <option value="PPF">PPF / EPF / NPS</option>
                    <option value="REAL_ESTATE">Property / Real Estate</option>
                    <option value="OTHER">Other Asset</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Platform / Institution</label>
                  <input
                    type="text"
                    placeholder="e.g. Zerodha, SBI, Groww"
                    value={newInvestment.institution}
                    onChange={(e) => setNewInvestment({ ...newInvestment, institution: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Total Asset Value (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 100000"
                    value={newInvestment.current_value}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewInvestment((prev) => ({
                        ...prev,
                        current_value: val,
                        invested_amount: prev.invested_amount ? prev.invested_amount : val,
                      }));
                    }}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-emerald-400 outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Current market worth</span>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Invested Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 100000"
                    value={newInvestment.invested_amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewInvestment((prev) => ({
                        ...prev,
                        invested_amount: val,
                        current_value: prev.current_value ? prev.current_value : val,
                      }));
                    }}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Initial principal amount</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Owner / Holder</label>
                  <select
                    value={newInvestment.owner_name}
                    onChange={(e) => setNewInvestment({ ...newInvestment, owner_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    {familyMembers.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.relationship || m.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Folio / Account No</label>
                  <input
                    type="text"
                    placeholder="Optional folio"
                    value={newInvestment.folio_number}
                    onChange={(e) => setNewInvestment({ ...newInvestment, folio_number: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Notes / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Long term retirement growth fund"
                  value={newInvestment.notes}
                  onChange={(e) => setNewInvestment({ ...newInvestment, notes: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddInvestment(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Liability / Loan Modal */}
      {showAddLiability && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Add Loan / Liability</h3>
                <p className="text-[11px] text-slate-400">Track EMIs, home loans, car loans, and credit cards</p>
              </div>
              <button onClick={() => setShowAddLiability(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateLiability} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Loan Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SBI Home Loan / HDFC Car EMI"
                  value={newLiability.title}
                  onChange={(e) => setNewLiability({ ...newLiability, title: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Loan Type *</label>
                  <select
                    value={newLiability.type}
                    onChange={(e) => setNewLiability({ ...newLiability, type: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="HOME_LOAN">Home Loan</option>
                    <option value="VEHICLE_LOAN">Vehicle / Car Loan</option>
                    <option value="PERSONAL_LOAN">Personal Loan</option>
                    <option value="EDUCATION_LOAN">Education Loan</option>
                    <option value="CREDIT_CARD">Credit Card Outstanding</option>
                    <option value="OTHER">Other Debt</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Bank / Lender</label>
                  <input
                    type="text"
                    placeholder="e.g. SBI, ICICI, Axis Bank"
                    value={newLiability.lender}
                    onChange={(e) => setNewLiability({ ...newLiability, lender: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Outstanding Balance (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1850000"
                    value={newLiability.outstanding_amount}
                    onChange={(e) => setNewLiability({ ...newLiability, outstanding_amount: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-rose-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Monthly EMI (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 24500"
                    value={newLiability.monthly_emi}
                    onChange={(e) => setNewLiability({ ...newLiability, monthly_emi: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="8.5"
                    value={newLiability.interest_rate}
                    onChange={(e) => setNewLiability({ ...newLiability, interest_rate: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Borrower / Member</label>
                  <select
                    value={newLiability.owner_name}
                    onChange={(e) => setNewLiability({ ...newLiability, owner_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    {familyMembers.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddLiability(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Family Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Create Family Future Goal</h3>
                <p className="text-[11px] text-slate-400">Save for milestones, children education, home, or vacations</p>
              </div>
              <button onClick={() => setShowAddGoal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Goal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Higher Education Fund / Dream Home Downpayment"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Goal Category</label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="EDUCATION">🎓 Education & College</option>
                    <option value="HOME">🏡 Home / Real Estate</option>
                    <option value="VACATION">✈️ Family Vacation</option>
                    <option value="VEHICLE">🚗 Vehicle / Car</option>
                    <option value="WEDDING">💍 Wedding / Function</option>
                    <option value="EMERGENCY">🛡️ Emergency Safety Fund</option>
                    <option value="RETIREMENT">🌴 Retirement</option>
                    <option value="OTHER">✨ Other Milestone</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Priority</label>
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Target Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2500000"
                    value={newGoal.target_amount}
                    onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Current Savings (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 350000"
                    value={newGoal.current_amount}
                    onChange={(e) => setNewGoal({ ...newGoal, current_amount: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Monthly Savings / SIP (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 20000"
                    value={newGoal.monthly_contribution}
                    onChange={(e) => setNewGoal({ ...newGoal, monthly_contribution: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Target Date</label>
                  <input
                    type="date"
                    value={newGoal.target_date}
                    onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddGoal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute to Goal Modal */}
      {contributingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Add Savings to Goal</h3>
                <p className="text-[11px] text-slate-400">{contributingGoal.title}</p>
              </div>
              <button onClick={() => setContributingGoal(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleContributeToGoal} className="space-y-3">
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 flex justify-between text-xs">
                <span className="text-slate-400">Current Progress:</span>
                <span className="text-amber-400 font-bold">
                  {formatCurrency(contributingGoal.current_amount)} / {formatCurrency(contributingGoal.target_amount)}
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Contribution Amount (₹ INR) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 10000"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-lg font-bold text-emerald-400 outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setContributingGoal(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Add Savings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt OCR Scanner Simulation Modal */}
      {showScanReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">AI Receipt Scanner</h3>
              </div>
              <button onClick={() => setShowScanReceipt(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Select a sample receipt to test instant OCR parsing & item extraction:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSimulateScan('ratnadeep_grocery.jpg')}
                className="p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-left text-xs text-slate-200"
              >
                🛒 Ratnadeep Supermarket
              </button>
              <button
                onClick={() => handleSimulateScan('indian_oil_fuel.jpg')}
                className="p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-left text-xs text-slate-200"
              >
                ⛽ Indian Oil Petrol
              </button>
              <button
                onClick={() => handleSimulateScan('swiggy_dining.jpg')}
                className="p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-left text-xs text-slate-200"
              >
                🍽️ Chutneys Restaurant
              </button>
              <button
                onClick={() => handleSimulateScan('apollo_pharmacy.jpg')}
                className="p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-left text-xs text-slate-200"
              >
                💊 Apollo Pharmacy
              </button>
            </div>

            {receiptResult && (
              <div className="p-3.5 rounded-2xl bg-slate-800 border border-amber-500/40 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{receiptResult.merchant}</span>
                  <span className="text-sm font-extrabold text-amber-400">₹{receiptResult.amount}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Category: <span className="text-slate-200">{receiptResult.category}</span> • Confidence: {(receiptResult.confidenceScore * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-slate-300 border-t border-slate-700 pt-1.5 space-y-0.5">
                  {receiptResult.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span>• {item.name}</span>
                      <span>₹{item.price}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={applyScannedReceipt}
                  className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                >
                  Verify & Confirm Entry →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Set Category Budget Limit Modal */}
      {editingBudgetCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Set Monthly Budget Limit</h3>
                <p className="text-xs text-amber-300 font-semibold">{editingBudgetCat.categoryName}</p>
              </div>
              <button onClick={() => setEditingBudgetCat(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleSaveBudgetLimit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Monthly Spending Cap (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 15000"
                  value={newBudgetLimit}
                  onChange={(e) => setNewBudgetLimit(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-emerald-400 outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Alerts your family when spending in this category exceeds this monthly limit.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Limits:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['3000', '5000', '10000', '15000', '25000', '50000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setNewBudgetLimit(amt)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 active:scale-95 transition-all"
                    >
                      ₹{Number(amt).toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBudgetCat(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Budget Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
