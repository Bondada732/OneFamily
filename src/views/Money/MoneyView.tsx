import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useFamily } from '../../context/FamilyContext.js';
import { useSecurity } from '../../context/SecurityContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { translations } from '../../i18n/index.js';
import { formatCurrency, formatDate, getLocalDateString } from '../../utils/formatters.js';
import { apiRequest, getCachedApiResponse } from '../../utils/api.js';
import { Expense, BudgetReport, Investment, Liability, Goal } from '../../types/index.js';
import { AddExpenseModal } from '../../components/common/AddExpenseModal.js';
import { AddIncomeModal } from '../../components/common/AddIncomeModal.js';
import { CustomDatePicker } from '../../components/common/CustomDatePicker.js';
import { CustomSelect } from '../../components/common/CustomSelect.js';
import { CsvExpenseModal, exportExpensesToCsv, downloadSampleTemplate } from '../../components/common/CsvExpenseModal.js';
import { PanPortfolioSyncModal } from '../../components/common/PanPortfolioSyncModal.js';
import { WealthSection } from './WealthSection.js';
import { GoalsSection } from './GoalsSection.js';
import { AccessDeniedView } from '../../components/common/AccessDeniedView.js';
import { Plus, Receipt, TrendingUp, ShieldAlert, Sparkles, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, Camera, ArrowDownLeft, ArrowUpRight, DollarSign, Wallet, Target, PiggyBank, Landmark, Building, CreditCard, Coins, X, Check, Trash2, Edit3, FileSpreadsheet, Download, Upload } from 'lucide-react';
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

interface MoneyViewProps {
  initialSubTab?: 'OVERVIEW' | 'BUDGET' | 'EXPENSES' | 'INCOME' | 'WEALTH' | 'GOALS';
  onBack?: () => void;
}

export const MoneyView: React.FC<MoneyViewProps> = ({ initialSubTab, onBack }) => {
  const { currentUser, family, activeLanguage, hasPermission, familyMembers } = useAuth();
  const { refreshDashboard } = useFamily();
  const { isPrivacyMode } = useSecurity();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const t = translations[activeLanguage];

  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'BUDGET' | 'EXPENSES' | 'INCOME' | 'WEALTH' | 'GOALS'>(initialSubTab || 'OVERVIEW');

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    if (family?.id) {
      const cached = getCachedApiResponse<any>(`/expenses/${family.id}/expenses`);
      return cached?.expenses || [];
    }
    return [];
  });
  const [categories, setCategories] = useState<any[]>(() => {
    if (family?.id) {
      const cached = getCachedApiResponse<any>(`/expenses/${family.id}/expenses`);
      return cached?.categories || DEFAULT_EXPENSE_CATEGORIES;
    }
    return DEFAULT_EXPENSE_CATEGORIES;
  });
  const [budgetReports, setBudgetReports] = useState<BudgetReport[]>(() => {
    if (family?.id) {
      const cached = getCachedApiResponse<any>(`/budget/${family.id}/budget`);
      return cached?.categories || [];
    }
    return [];
  });
  const [investments, setInvestments] = useState<Investment[]>(() => {
    if (family?.id) {
      const cached = getCachedApiResponse<any>(`/investments/${family.id}/investments`);
      return cached?.investments || [];
    }
    return [];
  });
  const [liabilities, setLiabilities] = useState<Liability[]>(() => {
    if (family?.id) {
      const cached = getCachedApiResponse<any>(`/investments/${family.id}/investments`);
      return cached?.liabilities || [];
    }
    return [];
  });
  const [netWorthData, setNetWorthData] = useState<any>(() => {
    if (family?.id) {
      return getCachedApiResponse<any>(`/investments/${family.id}/investments`);
    }
    return null;
  });
  const [goals, setGoals] = useState<Goal[]>(() => {
    if (family?.id) {
      return getCachedApiResponse<any>(`/goals/${family.id}/goals`) || [];
    }
    return [];
  });
  const [incomes, setIncomes] = useState<any[]>(() => {
    if (family?.id) {
      const cached = getCachedApiResponse<any>(`/expenses/${family.id}/incomes`);
      return cached?.incomes || [
        { id: 'inc_1', source: 'Monthly Salary', amount: 150000, type: 'SALARY', date: getLocalDateString(), added_by_name: currentUser?.name?.split(' ')[0] || 'Self', notes: 'Monthly salary payout' },
        { id: 'inc_2', source: 'House Rent Credit', amount: 25000, type: 'RENTAL', date: getLocalDateString(), added_by_name: 'Spouse', notes: '2BHK Apartment rent' },
        { id: 'inc_3', source: 'Stock Portfolio Dividend', amount: 12500, type: 'DIVIDEND', date: getLocalDateString(), added_by_name: currentUser?.name?.split(' ')[0] || 'Self', notes: 'Quarterly dividend' },
      ];
    }
    return [
      { id: 'inc_1', source: 'Monthly Salary', amount: 150000, type: 'SALARY', date: getLocalDateString(), added_by_name: currentUser?.name?.split(' ')[0] || 'Self', notes: 'Monthly salary payout' },
      { id: 'inc_2', source: 'House Rent Credit', amount: 25000, type: 'RENTAL', date: getLocalDateString(), added_by_name: 'Spouse', notes: '2BHK Apartment rent' },
      { id: 'inc_3', source: 'Stock Portfolio Dividend', amount: 12500, type: 'DIVIDEND', date: getLocalDateString(), added_by_name: currentUser?.name?.split(' ')[0] || 'Self', notes: 'Quarterly dividend' },
    ];
  });
  const [showAddIncome, setShowAddIncome] = useState(false);

  useEffect(() => {
    if (!family?.id) return;
    const loadIncomes = async () => {
      try {
        const data = await apiRequest(`/expenses/${family.id}/incomes`);
        if (data.incomes && data.incomes.length > 0) {
          setIncomes(data.incomes);
        }
      } catch (err) {
        console.error('Failed to fetch incomes:', err);
      }
    };
    loadIncomes();
  }, [family?.id]);

  const handleCreateIncome = async (incomeData: {
    source: string;
    amount: string;
    type: string;
    date: string;
    notes: string;
  }) => {
    if (!family?.id) return;
    try {
      const created = await apiRequest(`/expenses/${family.id}/incomes`, {
        method: 'POST',
        body: JSON.stringify(incomeData),
      });
      setIncomes((prev) => [created, ...prev]);
      setShowAddIncome(false);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to create income:', err);
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    if (!family?.id) return;
    try {
      await apiRequest(`/expenses/${family.id}/incomes/${incomeId}`, {
        method: 'DELETE',
      });
      setIncomes((prev) => prev.filter((i) => i.id !== incomeId));
      refreshDashboard();
    } catch (err) {
      console.error('Failed to delete income:', err);
    }
  };

  const [isLoading, setIsLoading] = useState(() => {
    if (family?.id) {
      const cached = getCachedApiResponse<any>(`/expenses/${family.id}/expenses`);
      return !cached;
    }
    return true;
  });

  // Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showScanReceipt, setShowScanReceipt] = useState(false);
  const [receiptResult, setReceiptResult] = useState<any>(null);

  // Wealth & Goals Modals State
  const [showAddInvestment, setShowAddInvestment] = useState(false);
  const [showPanSyncModal, setShowPanSyncModal] = useState(false);
  const [showAddLiability, setShowAddLiability] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  // Editing Modals State (Family Head or RBAC Permitted)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

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

  const canViewExpensesAndBudget = hasPermission('FINANCE_VIEW') || hasPermission('FINANCE_EDIT') || currentUser?.role === 'FAMILY_HEAD';
  const canEditExpensesAndBudget = hasPermission('FINANCE_EDIT') || currentUser?.role === 'FAMILY_HEAD';
  const canViewWealth = hasPermission('INVESTMENT_VIEW') || hasPermission('INVESTMENT_EDIT') || currentUser?.role === 'FAMILY_HEAD';
  const canEditWealth = hasPermission('INVESTMENT_EDIT') || currentUser?.role === 'FAMILY_HEAD';
  const canViewFinance = canViewExpensesAndBudget || canViewWealth;
  const canEditFinance = canEditExpensesAndBudget || canEditWealth;

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

  const handleCreateExpense = async (expenseData: {
    amount: string;
    merchant: string;
    category_id: string;
    category_name: string;
    payment_method: string;
    date: string;
    notes: string;
  }) => {
    if (!expenseData.amount || !family?.id) return;

    try {
      const created = await apiRequest(`/expenses/${family.id}/expenses`, {
        method: 'POST',
        body: JSON.stringify(expenseData),
      });
      setExpenses((prev) => [created, ...prev]);
      setShowAddExpense(false);
      const budData = await apiRequest(`/budget/${family.id}/budget`);
      setBudgetReports(budData.categories || []);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to create expense:', err);
    }
  };

  const handleImportCsvSuccess = async (newExpenses: Expense[]) => {
    setExpenses((prev) => [...newExpenses, ...prev]);
    if (family?.id) {
      try {
        const budData = await apiRequest(`/budget/${family.id}/budget`);
        setBudgetReports(budData.categories || []);
      } catch (err) {
        console.error('Failed to reload budget after CSV import:', err);
      }
    }
    refreshDashboard();
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

  const refreshInvestments = async () => {
    if (!family?.id) return;
    try {
      // Clear stale localStorage cache so mobile/APK always gets fresh data after CAS import
      const cacheKey = `kinora_api_cache_/investments/${family.id}/investments`;
      localStorage.removeItem(cacheKey);
      const invData = await apiRequest(`/investments/${family.id}/investments`);
      setInvestments(invData.investments || []);
      setLiabilities(invData.liabilities || []);
      setNetWorthData(invData);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to refresh investments:', err);
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

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !family?.id) return;
    try {
      const updated = await apiRequest(`/expenses/${family.id}/expenses/${editingExpense.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editingExpense),
      });
      setExpenses((prev) => prev.map((exp) => (exp.id === editingExpense.id ? { ...exp, ...updated } : exp)));
      setEditingExpense(null);
      const budData = await apiRequest(`/budget/${family.id}/budget`);
      setBudgetReports(budData.categories || []);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to update expense:', err);
    }
  };

  const handleUpdateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvestment || !family?.id) return;
    try {
      const updated = await apiRequest(`/investments/${family.id}/investments/${editingInvestment.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingInvestment),
      });
      setInvestments((prev) => prev.map((inv) => (inv.id === editingInvestment.id ? { ...inv, ...updated } : inv)));
      setEditingInvestment(null);
      const invData = await apiRequest(`/investments/${family.id}/investments`);
      setNetWorthData(invData);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to update investment:', err);
    }
  };

  const handleUpdateLiability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLiability || !family?.id) return;
    try {
      const updated = await apiRequest(`/investments/${family.id}/liabilities/${editingLiability.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editingLiability),
      });
      setLiabilities((prev) => prev.map((lia) => (lia.id === editingLiability.id ? { ...lia, ...updated } : lia)));
      setEditingLiability(null);
      const invData = await apiRequest(`/investments/${family.id}/investments`);
      setNetWorthData(invData);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to update liability:', err);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!family?.id) return;
    try {
      await apiRequest(`/goals/${family.id}/goals/${goalId}`, {
        method: 'DELETE',
      });
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      refreshDashboard();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !family?.id) return;
    try {
      const updated = await apiRequest(`/goals/${family.id}/goals/${editingGoal.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editingGoal),
      });
      const target = Number(editingGoal.target_amount) || 1;
      const current = Number(editingGoal.current_amount) || 0;
      const enriched = {
        ...updated,
        progressPct: Math.min(100, Math.round((current / target) * 100)),
        shortfall: Math.max(0, target - current),
      };
      setGoals((prev) => prev.map((g) => (g.id === editingGoal.id ? enriched : g)));
      setEditingGoal(null);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to update goal:', err);
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
    <div className={`p-4 space-y-4 animate-fade-in pb-24 ${
      isLight ? 'text-[#2A1B14]' : 'text-slate-100'
    }`}>
      {/* Title & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className={`p-1.5 rounded-xl border transition-all ${
                isLight ? 'bg-[#FFF8F1] text-[#6B6B6B] hover:text-[#1F1F1F] border-[#EAD6C4]' : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Back to Home"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className={`text-xl font-extrabold tracking-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
              {activeSubTab === 'EXPENSES'
                ? 'Record Expenses'
                : activeSubTab === 'INCOME'
                ? 'Record Income'
                : activeSubTab === 'BUDGET'
                ? 'Category Budget'
                : activeSubTab === 'WEALTH'
                ? 'Wealth & Assets'
                : activeSubTab === 'GOALS'
                ? 'Set Family Goals'
                : 'Family Wealth & Budget'}
            </h2>
            <p className={`text-xs ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
              {activeSubTab === 'EXPENSES'
                ? 'Track, record and analyze daily family spending'
                : activeSubTab === 'INCOME'
                ? 'Log salary, dividends, rental income & business credits'
                : activeSubTab === 'BUDGET'
                ? 'Set & monitor monthly spending limits by category'
                : activeSubTab === 'WEALTH'
                ? 'Manage stocks, mutual funds, FDs & liabilities'
                : activeSubTab === 'GOALS'
                ? 'Plan target funds for vacation, education & emergency'
                : 'Total control over Indian family finances'}
            </p>
          </div>
        </div>
        {canEditFinance && (
          <div className="flex items-center gap-1.5">
            {activeSubTab === 'WEALTH' ? (
              <>
                <button
                  onClick={() => setShowAddInvestment(true)}
                  className={`p-2 rounded-xl text-xs flex items-center gap-1 font-bold border transition-all ${
                    isLight
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-sm'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Asset</span>
                </button>
                <button
                  onClick={() => setShowAddLiability(true)}
                  className={`p-2 rounded-xl text-xs flex items-center gap-1 font-bold border transition-all ${
                    isLight
                      ? 'bg-[#C24419] hover:bg-[#A83813] text-white border-[#C24419] shadow-sm'
                      : 'bg-rose-600/80 hover:bg-rose-600 text-white shadow-md'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Loan</span>
                </button>
              </>
            ) : activeSubTab === 'GOALS' ? (
              <button
                onClick={() => setShowAddGoal(true)}
                className={`px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 font-bold transition-all shadow-md ${
                  isLight
                    ? 'bg-[#F05A28] hover:bg-[#E76F3C] text-white shadow-orange-500/20'
                    : 'bg-[#F05A28] hover:bg-[#E76F3C] text-white shadow-orange-500/30'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Goal</span>
              </button>
            ) : activeSubTab === 'INCOME' ? (
              <button
                onClick={() => setShowAddIncome(true)}
                className={`p-2 rounded-xl text-xs flex items-center gap-1 font-bold border transition-all ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-md shadow-emerald-500/20'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Income</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowScanReceipt(true)}
                  className={`p-2 rounded-xl text-xs flex items-center gap-1 font-bold border transition-all ${
                    isLight
                      ? 'bg-[#FFF8F1] hover:bg-[#F8EFE4] text-[#B84A1E] border-[#EAD6C4] shadow-sm kinora-3d-tile'
                      : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border-indigo-500/40'
                  }`}
                  title="Scan Receipt OCR"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scan</span>
                </button>
                <button
                  onClick={() => setShowAddExpense(true)}
                  className={`p-2 rounded-xl text-xs flex items-center gap-1 font-bold border transition-all ${
                    isLight
                      ? 'bg-[#F05A28] hover:bg-[#E76F3C] text-white border-[#F05A28] shadow-sm'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-md shadow-amber-500/20'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Expense</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sub Tab Navigation (Hidden when launched directly via module option) */}
      {!initialSubTab && (
        <div className={`flex items-center gap-1 p-1 rounded-2xl overflow-x-auto scrollbar-none border ${
          isLight
            ? 'bg-[#EAD8C7] border-[#DEC8B2] shadow-inner'
            : 'bg-slate-800/80 border border-slate-700/80'
        }`}>
          {(['OVERVIEW', 'BUDGET', 'EXPENSES', 'INCOME', 'WEALTH', 'GOALS'] as const).map((tab) => {
            const isTabPermitted =
              tab === 'OVERVIEW'
                ? canViewFinance
                : tab === 'WEALTH'
                ? canViewWealth
                : canViewExpensesAndBudget;

            return (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1 ${
                  !isTabPermitted ? 'opacity-50' : ''
                } ${
                  activeSubTab === tab
                    ? isLight
                      ? 'bg-[#F05A28] text-white shadow-md'
                      : 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
                    : isLight
                      ? 'text-[#634B3F] hover:text-[#1F1F1F]'
                      : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {!isTabPermitted && <Lock className="w-3 h-3 text-rose-500 inline" />}
                <span>{tab}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 1. OVERVIEW SUBTAB */}
      {activeSubTab === 'OVERVIEW' && (
        !canViewFinance ? (
          <AccessDeniedView
            moduleName="Family Wealth & Budget"
            requiredPermission="FINANCE_VIEW / INVESTMENT_VIEW"
            onBackToHome={onBack}
          />
        ) : (
          <div className="space-y-4">
          {/* Net Worth Hero Card */}
          <div className={`p-4 sm:p-5 rounded-3xl relative overflow-hidden kinora-3d-card ${
            isLight
              ? 'bg-[#F3E3D3] border border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14)]'
              : 'bg-gradient-to-tr from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 shadow-2xl'
          }`}>
            <div className={`flex items-center justify-between text-xs mb-1 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
              <span className="font-semibold">Family Net Worth (Formula: Assets - Liabilities)</span>
              <span className={`font-bold px-2 py-0.5 rounded-full border text-[11px] ${
                isLight 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              }`}>
                +4.2% YoY
              </span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
              {isPrivacyMode ? '••••••' : formatCurrency(netWorthData?.netWorth)}
            </div>

            <div className={`grid grid-cols-2 gap-3 mt-4 pt-3 border-t ${
              isLight ? 'border-[#DEC8B2]' : 'border-slate-800'
            }`}>
              <div className={`p-3 rounded-2xl border kinora-3d-tile ${
                isLight 
                  ? 'bg-[#FFF8F1] border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2] shadow-[0_6px_14px_-2px_rgba(130,80,45,0.12)]' 
                  : 'bg-slate-900/60 border-slate-800'
              }`}>
                <span className={`text-[10px] uppercase font-bold ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Total Assets</span>
                <div className={`text-sm sm:text-base font-black mt-0.5 ${isLight ? 'text-[#2E7D32]' : 'text-emerald-400'}`}>
                  {isPrivacyMode ? '••••' : formatCurrency(netWorthData?.totalAssetValue)}
                </div>
              </div>
              <div className={`p-3 rounded-2xl border kinora-3d-tile ${
                isLight 
                  ? 'bg-[#FFF8F1] border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2] shadow-[0_6px_14px_-2px_rgba(130,80,45,0.12)]' 
                  : 'bg-slate-900/60 border-slate-800'
              }`}>
                <span className={`text-[10px] uppercase font-bold ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Total Liabilities</span>
                <div className={`text-sm sm:text-base font-black mt-0.5 ${isLight ? 'text-[#C24419]' : 'text-rose-400'}`}>
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
                      <stop offset="5%" stopColor={isLight ? '#F05A28' : '#4F6BF5'} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={isLight ? '#F05A28' : '#4F6BF5'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke={isLight ? '#8C7A6B' : '#64748b'} fontSize={10} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`₹${val} Lakhs`, 'Net Worth']}
                    contentStyle={{
                      backgroundColor: isLight ? '#FFF8F1' : '#0f172a',
                      borderColor: isLight ? '#EAD6C4' : '#334155',
                      color: isLight ? '#1F1F1F' : '#ffffff',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                  />
                  <Area type="monotone" dataKey="netWorth" stroke={isLight ? '#F05A28' : '#4F6BF5'} strokeWidth={2.5} fillOpacity={1} fill="url(#colorNet)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Auto-Sync Banner for Mutual Funds & Demat */}
          {canEditFinance && (
            <div className={`p-4 rounded-3xl flex items-center justify-between gap-3 border kinora-3d-card ${
              isLight
                ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_8px_20px_-4px_rgba(130,80,45,0.12)]'
                : 'bg-gradient-to-r from-amber-500/20 via-indigo-950/60 to-slate-900 border-indigo-500/40 shadow-xl'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md kinora-3d-icon-box ${
                  isLight ? 'bg-gradient-to-tr from-[#F05A28] to-amber-500 text-white' : 'bg-gradient-to-tr from-amber-500 to-indigo-600 text-white'
                }`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-xs sm:text-sm font-black ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                    Auto-Sync Mutual Funds & Demat
                  </h4>
                  <p className={`text-[11px] ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
                    Sync portfolios via PAN & CAMS without manual imports
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPanSyncModal(true)}
                className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 shadow-md transition-all text-white ${
                  isLight
                    ? 'bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700'
                    : 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500'
                }`}
              >
                Sync PAN ⚡
              </button>
            </div>
          )}

          {/* Quick Expense Breakdown */}
          <div className={`p-4 rounded-3xl space-y-3 kinora-3d-card ${
            isLight
              ? 'bg-[#F3E3D3] border border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14)]'
              : 'bg-slate-800/90 border border-slate-700/80'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Recent Family Expenses</span>
              <button onClick={() => setActiveSubTab('EXPENSES')} className={`font-bold ${isLight ? 'text-[#D3542F] hover:text-[#F05A28]' : 'text-indigo-400 hover:underline'}`}>
                View All ({expenses.length}) →
              </button>
            </div>

            <div className="space-y-2">
              {expenses.slice(0, 10).map((exp) => (
                <div key={exp.id} className={`flex items-center justify-between p-2.5 rounded-xl border kinora-3d-tile ${
                  isLight
                    ? 'bg-[#FFF8F1] border-[#EAD6C4] border-t-white/95 border-b-[2px] border-b-[#DEC8B2]'
                    : 'bg-slate-900/60 border-slate-800'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs kinora-3d-icon-box ${
                      isLight
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-indigo-500/20 text-indigo-400'
                    }`}>
                      {exp.payment_method === 'UPI' ? 'UPI' : '₹'}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>{exp.merchant}</div>
                      <div className={`text-[10px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>{exp.category_name} • Paid by {exp.paid_by_name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold ${isLight ? 'text-[#C24419]' : 'text-rose-400'}`}>
                      {isPrivacyMode ? '••••' : `-₹${exp.amount.toLocaleString('en-IN')}`}
                    </div>
                    <div className={`text-[10px] ${isLight ? 'text-[#8C7A6B]' : 'text-slate-500'}`}>{formatDate(exp.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )
      )}

      {/* 2. BUDGET SUBTAB */}
      {activeSubTab === 'BUDGET' && (
        !canViewExpensesAndBudget ? (
          <AccessDeniedView
            moduleName="Category Budget"
            requiredPermission="FINANCE_VIEW"
            onBackToHome={onBack}
          />
        ) : (
          <div className="space-y-3">
          <div className={`p-4 rounded-2xl border kinora-3d-card ${
            isLight
              ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-md'
              : 'bg-slate-800/90 border-slate-700/80'
          }`}>
            <div className={`flex items-center justify-between text-xs ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Monthly Household Budget</span>
                {canEditFinance && (
                  <button
                    onClick={() => setShowManageCategories(true)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                      isLight
                        ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                        : 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30'
                    }`}
                  >
                    + Manage Categories
                  </button>
                )}
              </div>
              <span className={`font-bold ${isLight ? 'text-[#B84A1E]' : 'text-amber-400'}`}>{budgetReports.length} Categories</span>
            </div>
            <div className={`text-xl font-extrabold mt-1 ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
              {formatCurrency(budgetReports.reduce((s, b) => s + (b.spent || 0), 0))} / {formatCurrency(budgetReports.reduce((s, b) => s + (b.limit || 0), 0))}
              <span className={`text-xs font-normal ml-2 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                ({budgetReports.reduce((s, b) => s + (b.limit || 0), 0) > 0 
                  ? ((budgetReports.reduce((s, b) => s + (b.spent || 0), 0) / budgetReports.reduce((s, b) => s + (b.limit || 0), 0)) * 100).toFixed(1) 
                  : 0}% spent)
              </span>
            </div>
            <p className={`text-[11px] mt-2 p-2 rounded-xl border ${
              isLight
                ? 'bg-[#FFF8F1] text-[#8C5228] border-[#DEC8B2]'
                : 'text-amber-300/90 bg-amber-500/10 border-amber-500/20'
            }`}>
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
                className={`p-3.5 rounded-2xl border transition-all shadow-sm cursor-pointer group kinora-3d-tile ${
                  isLight
                    ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2] hover:border-[#F05A28]/50'
                    : 'bg-slate-800/90 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold transition-colors ${
                      isLight ? 'text-[#1F1F1F] group-hover:text-[#D3542F]' : 'text-white group-hover:text-amber-300'
                    }`}>
                      {cat.categoryName}
                    </span>
                    {cat.limit === 0 && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                        isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        Set Limit ✎
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-extrabold ${isLight ? 'text-[#1F1F1F]' : 'text-slate-200'}`}>
                      {isPrivacyMode ? '••••' : `₹${(cat.spent ?? 0).toLocaleString('en-IN')}`} / {cat.limit > 0 ? `₹${cat.limit.toLocaleString('en-IN')}` : 'No limit'}
                    </span>
                    {cat.limit > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          cat.alertStatus === 'EXCEEDED'
                            ? isLight ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : cat.alertStatus === 'WARNING'
                            ? isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {cat.utilizationPct ?? 0}%
                      </span>
                    )}
                  </div>
                </div>

                <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-[#E0CCBB]' : 'bg-slate-700'}`}>
                  <div
                    className={`h-full rounded-full transition-all ${
                      cat.alertStatus === 'EXCEEDED'
                        ? 'bg-rose-500'
                        : cat.alertStatus === 'WARNING'
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, cat.utilizationPct ?? 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        )
      )}

      {/* 3. EXPENSES SUBTAB */}
      {activeSubTab === 'EXPENSES' && (
        !canViewExpensesAndBudget ? (
          <AccessDeniedView
            moduleName="Record Expenses"
            requiredPermission="FINANCE_VIEW"
            onBackToHome={onBack}
          />
        ) : (
          <div className="space-y-3">
          {/* Header & Actions Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold uppercase ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                Logged Expenses ({expenses.length})
              </span>
              {canEditFinance && (
                <>
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-sm flex items-center gap-1 transition-all ${
                      isLight
                        ? 'bg-[#F05A28] hover:bg-[#E76F3C] text-white shadow-[#F05A28]/20'
                        : 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Expense</span>
                  </button>
                  <button
                    onClick={() => setShowCsvModal(true)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all ${
                      isLight
                        ? 'bg-[#FFF8F1] hover:bg-[#F3E3D3] border-[#DEC8B2] text-[#B84A1E]'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-400'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>CSV Upload / Download</span>
                  </button>
                  <button
                    onClick={() => setShowManageCategories(true)}
                    className={`text-[11px] font-medium px-2 py-1 rounded-xl border transition-all ${
                      isLight
                        ? 'text-[#634B3F] bg-[#FFF8F1] hover:bg-[#F3E3D3] border-[#DEC8B2]'
                        : 'text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border-indigo-500/20'
                    }`}
                  >
                    ⚙ Categories
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 justify-between sm:justify-end">
              {expenses.length > 0 && (
                <button
                  onClick={() => exportExpensesToCsv(expenses, family?.name || 'OneFamily')}
                  className={`text-[11px] font-semibold px-2 py-1 rounded-xl border flex items-center gap-1 transition-all ${
                    isLight
                      ? 'bg-[#FFF8F1] hover:bg-[#F3E3D3] text-[#634B3F] border-[#DEC8B2]'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title="Export to CSV"
                >
                  <Download className="w-3 h-3" />
                  <span>Download CSV</span>
                </button>
              )}
              <span className={`text-xs font-bold ${isLight ? 'text-[#C24419]' : 'text-amber-400'}`}>
                Total: {formatCurrency(expenses.reduce((s, e) => s + (e.amount || 0), 0))}
              </span>
            </div>
          </div>

          {expenses.length === 0 ? (
            <div
              className={`p-6 rounded-3xl border border-dashed text-center transition-all space-y-4 kinora-3d-card ${
                isLight
                  ? 'bg-[#F3E3D3] border-[#DEC8B2]'
                  : 'bg-slate-800/60 border-slate-700'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto kinora-3d-icon-box ${
                isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400'
              }`}>
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <div className={`text-sm font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>No Expenses Logged Yet</div>
                <p className={`text-xs max-w-xs mx-auto mt-1 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                  Track grocery bills, fuel, rent, dining, shopping, and everyday family spends.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setShowAddExpense(true)}
                  className={`px-4 py-2 font-bold rounded-xl text-xs shadow-lg text-white transition-all ${
                    isLight ? 'bg-[#F05A28] hover:bg-[#E76F3C]' : 'bg-gradient-to-r from-amber-500 to-indigo-600'
                  }`}
                >
                  + Add Single Expense
                </button>
                <button
                  onClick={() => setShowCsvModal(true)}
                  className={`px-3.5 py-2 font-bold rounded-xl text-xs border transition-all flex items-center gap-1.5 ${
                    isLight
                      ? 'bg-[#FFF8F1] hover:bg-[#EBDCD0] border-[#DEC8B2] text-[#B84A1E]'
                      : 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-amber-300'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload from CSV</span>
                </button>
                <button
                  onClick={downloadSampleTemplate}
                  className={`px-3 py-2 font-semibold rounded-xl text-xs border transition-all flex items-center gap-1.5 ${
                    isLight
                      ? 'bg-[#FFF8F1] hover:bg-[#EBDCD0] border-[#DEC8B2] text-[#634B3F]'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample Template</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp) => (
                <div key={exp.id} className={`p-3.5 rounded-2xl border flex items-center justify-between kinora-3d-tile ${
                  isLight
                    ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2]'
                    : 'bg-slate-800/90 border-slate-700/80'
                }`}>
                  <div className="overflow-hidden mr-2">
                    <div className={`text-xs font-bold truncate ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>{exp.merchant}</div>
                    <div className={`text-[11px] mt-0.5 truncate ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                      {exp.category_name} • Paid by {exp.paid_by_name} ({exp.payment_method})
                    </div>
                    {exp.notes && <div className={`text-[10px] mt-0.5 italic truncate ${isLight ? 'text-[#8C7A6B]' : 'text-slate-500'}`}>{exp.notes}</div>}
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <div className={`text-sm font-bold ${isLight ? 'text-[#C24419]' : 'text-rose-400'}`}>
                        {isPrivacyMode ? '••••' : `-₹${(exp.amount ?? 0).toLocaleString('en-IN')}`}
                      </div>
                      <div className={`text-[10px] ${isLight ? 'text-[#8C7A6B]' : 'text-slate-500'}`}>{formatDate(exp.date)}</div>
                    </div>
                    {canEditFinance && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingExpense(exp)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isLight
                              ? 'bg-[#FFF8F1] hover:bg-amber-100 text-[#634B3F] hover:text-[#1F1F1F] border-[#EAD6C4]'
                              : 'bg-slate-700/60 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400'
                          }`}
                          title="Edit Expense"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isLight
                              ? 'bg-[#FFF8F1] hover:bg-rose-100 text-[#C24419] border-[#EAD6C4]'
                              : 'bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400'
                          }`}
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        )
      )}

      {/* 4. WEALTH SUBTAB (Redesigned with Interactive Category Sub-screens matching Figma / Mockup) */}
      {/* 4. WEALTH SUBTAB (Redesigned with Interactive Category Sub-screens matching Figma / Mockup) */}
      {activeSubTab === 'WEALTH' && (
        !canViewWealth ? (
          <AccessDeniedView
            moduleName="Wealth & Assets"
            requiredPermission="INVESTMENT_VIEW"
            onBackToHome={onBack}
          />
        ) : (
          <WealthSection
            investments={investments}
            liabilities={liabilities}
            goals={goals}
            members={familyMembers || []}
            currentUser={currentUser}
            isLight={isLight}
            isPrivacyMode={isPrivacyMode}
            canEditFinance={canEditFinance}
            onAddInvestment={(catType) => {
              if (catType) {
                let defaultType = 'MUTUAL_FUND';
                if (catType === 'EQUITY') defaultType = 'STOCK';
                else if (catType === 'PF') defaultType = 'PF';
                else if (catType === 'PPF') defaultType = 'PPF';
                else if (catType === 'NPS') defaultType = 'NPS';
                else if (catType === 'FD') defaultType = 'FIXED_DEPOSIT';
                else if (catType === 'RD') defaultType = 'RD';
                else if (catType === 'SMALL_SAVINGS') defaultType = 'SMALL_SAVINGS';
                else if (catType === 'BONDS') defaultType = 'BONDS';
                else if (catType === 'GOLD') defaultType = 'GOLD';
                setNewInvestment((prev) => ({ ...prev, type: defaultType }));
              }
              setShowAddInvestment(true);
            }}
            onEditInvestment={(inv) => setEditingInvestment(inv)}
            onDeleteInvestment={(id) => handleDeleteInvestment(id)}
            onOpenPanSync={() => setShowPanSyncModal(true)}
            onAddLiability={() => setShowAddLiability(true)}
            onEditLiability={(lia) => setEditingLiability(lia)}
            onDeleteLiability={(id) => handleDeleteLiability(id)}
            onOpenAddGoal={() => setShowAddGoal(true)}
            onSelectGoalTab={() => setActiveSubTab('GOALS')}
          />
        )
      )}

      {/* 5. GOALS SUBTAB */}
      {activeSubTab === 'GOALS' && (
        !canViewExpensesAndBudget ? (
          <AccessDeniedView
            moduleName="Family Goals"
            requiredPermission="FINANCE_VIEW"
            onBackToHome={onBack}
          />
        ) : (
          <GoalsSection
            goals={goals}
            members={familyMembers}
            currentUser={currentUser}
            isLight={isLight}
            isPrivacyMode={isPrivacyMode}
            canEditFinance={canEditFinance}
            onOpenAddGoal={() => setShowAddGoal(true)}
            onEditGoal={(goal) => setEditingGoal(goal)}
            onDeleteGoal={(id) => handleDeleteGoal(id)}
            onContributeGoal={(goal) => {
              setContributingGoal(goal);
              setContributionAmount(String(goal.monthly_contribution || '10000'));
            }}
          />
        )
      )}

      {/* 6. INCOME SUBTAB */}
      {activeSubTab === 'INCOME' && (
        !canViewExpensesAndBudget ? (
          <AccessDeniedView
            moduleName="Record Income"
            requiredPermission="FINANCE_VIEW"
            onBackToHome={onBack}
          />
        ) : (
          <div className="space-y-4">
          {/* Income Header Banner */}
          <div className={`p-4 rounded-3xl space-y-3 border kinora-3d-card ${
            isLight
              ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14)]'
              : 'bg-[#0D152D] border-slate-800/80 shadow-xl'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                  Total Family Income
                </span>
                <div className={`text-2xl sm:text-3xl font-black tracking-tight mt-0.5 ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                  {isPrivacyMode
                    ? '••••'
                    : formatCurrency(incomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0), true)}
                </div>
              </div>

              {canEditFinance && (
                <button
                  type="button"
                  onClick={() => setShowAddIncome(true)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isLight
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-md'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Income</span>
                </button>
              )}
            </div>
          </div>

          {/* Logged Incomes Section */}
          <div className={`rounded-3xl p-4 shadow-xl space-y-3 kinora-3d-card ${
            isLight
              ? 'bg-[#F3E3D3] border border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14)]'
              : 'bg-[#0D152D] border border-slate-800/80 shadow-xl'
          }`}>
            <div className="flex items-center justify-between px-1">
              <h3 className={`text-sm sm:text-base font-bold tracking-tight flex items-center gap-2 ${
                isLight ? 'text-[#1F1F1F]' : 'text-white'
              }`}>
                <span>LOGGED INCOMES ({incomes.length})</span>
              </h3>

              {canEditFinance && (
                <button
                  type="button"
                  onClick={() => setShowAddIncome(true)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                    isLight
                      ? 'text-white bg-emerald-600 hover:bg-emerald-500 border-emerald-600 shadow-sm'
                      : 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/25'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Income</span>
                </button>
              )}
            </div>

            {incomes && incomes.length > 0 ? (
              <div className={`divide-y ${isLight ? 'divide-[#EAD6C4]' : 'divide-slate-800/60'}`}>
                {incomes.map((inc) => {
                  const amountDisplay = isPrivacyMode
                    ? '••••'
                    : `+₹${Number(inc.amount || 0).toLocaleString('en-IN')}`;
                  const sourceDisplay = inc.source || 'Income Credit';
                  const typeDisplay = inc.type || 'SALARY';
                  const dateDisplay = inc.date
                    ? new Date(inc.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : '';

                  return (
                    <div
                      key={inc.id || Math.random()}
                      className={`flex items-center justify-between py-3 px-2 rounded-xl transition-all group ${
                        isLight ? 'hover:bg-[#FFF8F1]/60' : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-5 h-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className={`text-xs sm:text-sm font-semibold truncate ${
                            isLight ? 'text-[#1F1F1F]' : 'text-white'
                          }`}>
                            {sourceDisplay}
                          </div>
                          <div className={`text-[11px] mt-0.5 truncate flex items-center gap-1.5 ${
                            isLight ? 'text-[#6B6B6B]' : 'text-slate-400'
                          }`}>
                            <span className="font-bold text-emerald-600 uppercase">{typeDisplay}</span>
                            {inc.added_by_name && <span>• {inc.added_by_name}</span>}
                            {dateDisplay && <span>• {dateDisplay}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 pl-2">
                        <span className="text-xs sm:text-sm font-black text-emerald-500 tracking-tight">
                          {amountDisplay}
                        </span>

                        {canEditFinance && (
                          <button
                            type="button"
                            onClick={() => handleDeleteIncome(inc.id)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isLight
                                ? 'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100'
                                : 'text-rose-400 bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20'
                            }`}
                            title="Delete Income"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <p className={`text-xs ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>No incomes recorded yet.</p>
                <button
                  onClick={() => setShowAddIncome(true)}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  + Record your first income
                </button>
              </div>
            )}
          </div>
        </div>
        )
      )}

      {/* Add Expense Modal (Interactive Category Cards & Quick Preset Pills) */}
      <AddExpenseModal
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onSubmit={handleCreateExpense}
      />

      {/* Add Income Modal */}
      <AddIncomeModal
        isOpen={showAddIncome}
        onClose={() => setShowAddIncome(false)}
        onSubmit={handleCreateIncome}
      />

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
                  <CustomSelect
                    label="Asset Type *"
                    value={newInvestment.type}
                    onChange={(val) => setNewInvestment({ ...newInvestment, type: val })}
                    options={[
                      { value: 'MUTUAL_FUND', label: 'Mutual Fund (SIP/Lump)', icon: '📈' },
                      { value: 'STOCK', label: 'Stocks / Equity', icon: '📊' },
                      { value: 'FIXED_DEPOSIT', label: 'Fixed Deposit / RD', icon: '🏦' },
                      { value: 'GOLD', label: 'Physical Gold / SGB', icon: '🪙' },
                      { value: 'PPF', label: 'PPF / EPF / NPS', icon: '🛡️' },
                      { value: 'REAL_ESTATE', label: 'Property / Real Estate', icon: '🏡' },
                      { value: 'OTHER', label: 'Other Asset', icon: '💎' },
                    ]}
                  />
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
                  <CustomSelect
                    label="Owner / Holder"
                    value={newInvestment.owner_name}
                    onChange={(val) => setNewInvestment({ ...newInvestment, owner_name: val })}
                    options={familyMembers.map((m) => ({
                      value: m.name,
                      label: `${m.name} (${m.relationship || m.role})`,
                      icon: '👤',
                    }))}
                  />
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
                  <CustomSelect
                    label="Loan Type *"
                    value={newLiability.type}
                    onChange={(val) => setNewLiability({ ...newLiability, type: val })}
                    options={[
                      { value: 'HOME_LOAN', label: 'Home Loan', icon: '🏡' },
                      { value: 'VEHICLE_LOAN', label: 'Vehicle / Car Loan', icon: '🚗' },
                      { value: 'PERSONAL_LOAN', label: 'Personal Loan', icon: '💳' },
                      { value: 'EDUCATION_LOAN', label: 'Education Loan', icon: '🎓' },
                      { value: 'CREDIT_CARD', label: 'Credit Card Outstanding', icon: '💳' },
                      { value: 'OTHER', label: 'Other Debt', icon: '📋' },
                    ]}
                  />
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
                  <CustomSelect
                    label="Borrower / Member"
                    value={newLiability.owner_name}
                    onChange={(val) => setNewLiability({ ...newLiability, owner_name: val })}
                    options={familyMembers.map((m) => ({
                      value: m.name,
                      label: `${m.name} (${m.relationship || m.role})`,
                      icon: '👤',
                    }))}
                  />
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
                  <CustomSelect
                    label="Goal Category"
                    value={newGoal.category}
                    onChange={(val) => setNewGoal({ ...newGoal, category: val })}
                    options={[
                      { value: 'EDUCATION', label: 'Education & College', icon: '🎓' },
                      { value: 'HOME', label: 'Home / Real Estate', icon: '🏡' },
                      { value: 'VACATION', label: 'Family Vacation', icon: '✈️' },
                      { value: 'VEHICLE', label: 'Vehicle / Car', icon: '🚗' },
                      { value: 'WEDDING', label: 'Wedding / Function', icon: '💍' },
                      { value: 'EMERGENCY', label: 'Emergency Safety Fund', icon: '🛡️' },
                      { value: 'RETIREMENT', label: 'Retirement', icon: '🌴' },
                      { value: 'OTHER', label: 'Other Milestone', icon: '✨' },
                    ]}
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Priority"
                    value={newGoal.priority}
                    onChange={(val) => setNewGoal({ ...newGoal, priority: val as any })}
                    options={[
                      { value: 'HIGH', label: 'High Priority', badge: '🔴' },
                      { value: 'MEDIUM', label: 'Medium Priority', badge: '🟡' },
                      { value: 'LOW', label: 'Low Priority', badge: '🟢' },
                    ]}
                  />
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
                  <CustomDatePicker
                    label="Target Date"
                    value={newGoal.target_date}
                    onChange={(newDate) => setNewGoal({ ...newGoal, target_date: newDate })}
                    className="!bg-slate-800 !border-slate-700 mt-1"
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

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit Family Expense</h3>
              <button onClick={() => setEditingExpense(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleUpdateExpense} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={editingExpense.amount}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-rose-400 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Merchant / Store / Payee *</label>
                <input
                  type="text"
                  required
                  value={editingExpense.merchant}
                  onChange={(e) => setEditingExpense({ ...editingExpense, merchant: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <CustomSelect
                    label="Category"
                    value={editingExpense.category_id}
                    onChange={(val) => {
                      const sel = categories.find((c) => (c.id || c.categoryId) === val);
                      setEditingExpense({
                        ...editingExpense,
                        category_id: val,
                        category_name: sel ? (sel.name || sel.categoryName) : editingExpense.category_name,
                      });
                    }}
                    options={categories.map((c) => ({
                      value: c.id || c.categoryId,
                      label: c.name || c.categoryName,
                    }))}
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Payment Method"
                    value={editingExpense.payment_method}
                    onChange={(val) => setEditingExpense({ ...editingExpense, payment_method: val as any })}
                    options={[
                      { value: 'UPI', label: 'UPI / GPay / PhonePe', icon: '📱' },
                      { value: 'CREDIT_CARD', label: 'Credit Card', icon: '💳' },
                      { value: 'DEBIT_CARD', label: 'Debit Card', icon: '💳' },
                      { value: 'NET_BANKING', label: 'Net Banking', icon: '🏦' },
                      { value: 'CASH', label: 'Cash', icon: '💵' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <CustomDatePicker
                  label="Expense Date"
                  value={editingExpense.date}
                  onChange={(newDate) => setEditingExpense({ ...editingExpense, date: newDate })}
                  className="!bg-slate-800 !border-slate-700 mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Notes / Purpose</label>
                <input
                  type="text"
                  value={editingExpense.notes || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Investment Modal */}
      {editingInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit Investment / Asset</h3>
              <button onClick={() => setEditingInvestment(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleUpdateInvestment} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Asset Title *</label>
                <input
                  type="text"
                  required
                  value={editingInvestment.title}
                  onChange={(e) => setEditingInvestment({ ...editingInvestment, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <CustomSelect
                    label="Asset Type"
                    value={editingInvestment.type}
                    onChange={(val) => setEditingInvestment({ ...editingInvestment, type: val as any })}
                    options={[
                      { value: 'MUTUAL_FUND', label: 'Mutual Fund (SIP / Lump)', icon: '📈' },
                      { value: 'STOCK', label: 'Indian Stocks / Equity', icon: '📊' },
                      { value: 'FIXED_DEPOSIT', label: 'Fixed Deposit (FD)', icon: '🏦' },
                      { value: 'GOLD', label: 'Physical Gold / SGB', icon: '🪙' },
                      { value: 'PPF', label: 'PPF / EPF / NPS', icon: '🛡️' },
                      { value: 'REAL_ESTATE', label: 'Real Estate / Land / Flat', icon: '🏡' },
                      { value: 'SAVINGS_ACCOUNT', label: 'Savings Bank Account', icon: '💳' },
                      { value: 'OTHER', label: 'Other Asset', icon: '💎' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Institution / Platform</label>
                  <input
                    type="text"
                    value={editingInvestment.institution || ''}
                    onChange={(e) => setEditingInvestment({ ...editingInvestment, institution: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Invested Amount (₹)</label>
                  <input
                    type="number"
                    value={editingInvestment.invested_amount}
                    onChange={(e) => setEditingInvestment({ ...editingInvestment, invested_amount: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Current Value (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingInvestment.current_value}
                    onChange={(e) => setEditingInvestment({ ...editingInvestment, current_value: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-emerald-400 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Folio / Account No.</label>
                  <input
                    type="text"
                    value={editingInvestment.folio_number || ''}
                    onChange={(e) => setEditingInvestment({ ...editingInvestment, folio_number: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Nominee Name</label>
                  <input
                    type="text"
                    value={editingInvestment.nominee || ''}
                    onChange={(e) => setEditingInvestment({ ...editingInvestment, nominee: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Notes / Details</label>
                <input
                  type="text"
                  value={editingInvestment.notes || ''}
                  onChange={(e) => setEditingInvestment({ ...editingInvestment, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingInvestment(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Liability Modal */}
      {editingLiability && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit Loan / Debt Record</h3>
              <button onClick={() => setEditingLiability(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleUpdateLiability} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Loan / Debt Title *</label>
                <input
                  type="text"
                  required
                  value={editingLiability.title}
                  onChange={(e) => setEditingLiability({ ...editingLiability, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <CustomSelect
                    label="Loan Type"
                    value={editingLiability.type}
                    onChange={(val) => setEditingLiability({ ...editingLiability, type: val as any })}
                    options={[
                      { value: 'HOME_LOAN', label: 'Home Loan', icon: '🏡' },
                      { value: 'CAR_LOAN', label: 'Car / Auto Loan', icon: '🚗' },
                      { value: 'PERSONAL_LOAN', label: 'Personal Loan', icon: '💳' },
                      { value: 'EDUCATION_LOAN', label: 'Education Loan', icon: '🎓' },
                      { value: 'CREDIT_CARD', label: 'Credit Card Outstanding', icon: '💳' },
                      { value: 'OTHER', label: 'Other Debt', icon: '📋' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Bank / Lender</label>
                  <input
                    type="text"
                    value={editingLiability.lender || ''}
                    onChange={(e) => setEditingLiability({ ...editingLiability, lender: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Total Sanctioned (₹)</label>
                  <input
                    type="number"
                    value={editingLiability.total_loan}
                    onChange={(e) => setEditingLiability({ ...editingLiability, total_loan: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Outstanding Balance (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingLiability.outstanding_amount}
                    onChange={(e) => setEditingLiability({ ...editingLiability, outstanding_amount: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-rose-400 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Monthly EMI (₹)</label>
                  <input
                    type="number"
                    value={editingLiability.monthly_emi}
                    onChange={(e) => setEditingLiability({ ...editingLiability, monthly_emi: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingLiability.interest_rate}
                    onChange={(e) => setEditingLiability({ ...editingLiability, interest_rate: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLiability(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit Family Goal</h3>
              <button onClick={() => setEditingGoal(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleUpdateGoal} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Goal Title *</label>
                <input
                  type="text"
                  required
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <CustomSelect
                    label="Goal Category"
                    value={editingGoal.category}
                    onChange={(val) => setEditingGoal({ ...editingGoal, category: val })}
                    options={[
                      { value: 'EDUCATION', label: 'Children Higher Education', icon: '🎓' },
                      { value: 'HOME', label: 'Dream House / Flat Purchase', icon: '🏡' },
                      { value: 'VEHICLE', label: 'New Car / Vehicle', icon: '🚗' },
                      { value: 'RETIREMENT', label: 'Retirement Freedom Fund', icon: '🌴' },
                      { value: 'EMERGENCY', label: 'Emergency 6-Month Reserve', icon: '🛡️' },
                      { value: 'TRAVEL', label: 'Annual Family Vacation / Tour', icon: '✈️' },
                      { value: 'WEDDING', label: 'Wedding & Celebrations', icon: '💍' },
                      { value: 'OTHER', label: 'Other Milestone', icon: '✨' },
                    ]}
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Priority"
                    value={editingGoal.priority}
                    onChange={(val) => setEditingGoal({ ...editingGoal, priority: val as any })}
                    options={[
                      { value: 'HIGH', label: 'High Priority (Must-Have)', badge: '🔴' },
                      { value: 'MEDIUM', label: 'Medium Priority', badge: '🟡' },
                      { value: 'LOW', label: 'Low Priority (Flexible)', badge: '🟢' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Target Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingGoal.target_amount}
                    onChange={(e) => setEditingGoal({ ...editingGoal, target_amount: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Current Saved (₹)</label>
                  <input
                    type="number"
                    value={editingGoal.current_amount}
                    onChange={(e) => setEditingGoal({ ...editingGoal, current_amount: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-amber-400 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Monthly SIP (₹)</label>
                  <input
                    type="number"
                    value={editingGoal.monthly_contribution}
                    onChange={(e) => setEditingGoal({ ...editingGoal, monthly_contribution: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <CustomDatePicker
                    label="Target Date"
                    value={editingGoal.target_date}
                    onChange={(newDate) => setEditingGoal({ ...editingGoal, target_date: newDate })}
                    className="!bg-slate-800 !border-slate-700 mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CSV Expenses Import / Export Modal */}
      {showCsvModal && (
        <CsvExpenseModal
          isOpen={showCsvModal}
          onClose={() => setShowCsvModal(false)}
          isLight={isLight}
          expenses={expenses}
          familyId={family?.id || ''}
          categories={categories}
          onImportSuccess={handleImportCsvSuccess}
          apiCall={apiRequest}
        />
      )}

      {/* PAN Mutual Fund & Demat Portfolio Sync Modal */}
      {showPanSyncModal && (
        <PanPortfolioSyncModal
          isOpen={showPanSyncModal}
          onClose={() => setShowPanSyncModal(false)}
          isLight={isLight}
          familyId={family?.id || ''}
          members={familyMembers || []}
          currentUserName={currentUser?.name || 'Self'}
          onSyncComplete={() => {
            // Small delay ensures server has persisted data before we re-fetch
            setTimeout(() => refreshInvestments(), 500);
          }}
          apiCall={apiRequest}
        />
      )}
    </div>
  );
};

