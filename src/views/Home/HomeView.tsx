import React, { useState, useEffect, useMemo } from 'react';
import { useFamily } from '../../context/FamilyContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { useSecurity } from '../../context/SecurityContext.js';
import { translations } from '../../i18n/index.js';
import { formatCurrency, formatDate, getLocalDateString } from '../../utils/formatters.js';
import { apiRequest } from '../../utils/api.js';
import { AddExpenseModal } from '../../components/common/AddExpenseModal.js';
import { AddWishModal } from '../../components/common/AddWishModal.js';
import { AddGoalModal } from '../../components/common/AddGoalModal.js';
import { AddIncomeModal } from '../../components/common/AddIncomeModal.js';
import { AddVaultModal } from '../../components/common/AddVaultModal.js';
import { AddTaskModal } from '../../components/common/AddTaskModal.js';
import { AddMaintenanceModal } from '../../components/common/AddMaintenanceModal.js';
import { AddEmergencyModal } from '../../components/common/AddEmergencyModal.js';
import { CircularQuickActions } from '../../components/common/CircularQuickActions.js';
import { MoneyAnalyticsDashboard } from '../../components/home/MoneyAnalyticsDashboard.js';
import { SmartExpensesHomeCard } from '../../components/home/SmartExpensesHomeCard.js';
import { FamilyRemindersHomeWidget } from '../../components/home/FamilyRemindersHomeWidget.js';
import { SmartExpenseReviewModal } from '../../components/smartExpense/SmartExpenseReviewModal.js';
import { SmartExpensePermissionModal } from '../../components/smartExpense/SmartExpensePermissionModal.js';
import { SmartExpenseDetailModal } from '../../components/smartExpense/SmartExpenseDetailModal.js';
import { SmartExpenseSettingsModal } from '../../components/smartExpense/SmartExpenseSettingsModal.js';
import { SmartExpenseService } from '../../services/smartExpense/SmartExpenseService.js';
import { DetectedTransaction, SmartCaptureSettings } from '../../services/smartExpense/types.js';
import { useTheme } from '../../context/ThemeContext.js';
import {
  Receipt,
  Gift,
  Target,
  Wallet,
  FolderLock,
  CheckSquare,
  Wrench,
  ShieldAlert,
  Eye,
  EyeOff,
  ChevronRight,
  Sun,
  Cake,
  Calendar,
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  ShoppingCart,
  ShoppingBag,
  Tag,
  Utensils,
  Home as HomeIcon,
  Zap,
  Car,
  HeartPulse,
  BookOpen,
  Film,
  Laptop,
  Plane,
  Check,
  Plus,
} from 'lucide-react';

// Category Icon & Self-Color Light Tinted Box Visual Helpers
const getExpenseCategoryVisual = (categoryName?: string, merchant?: string) => {
  const text = `${categoryName || ''} ${merchant || ''}`.toLowerCase();

  if (
    text.includes('grocer') ||
    text.includes('mart') ||
    text.includes('blinkit') ||
    text.includes('zepto') ||
    text.includes('instamart') ||
    text.includes('bigbasket') ||
    text.includes('kirana') ||
    text.includes('supermarket')
  ) {
    return {
      Icon: ShoppingCart,
      boxClass: 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400',
    };
  }
  if (
    text.includes('milk') ||
    text.includes('dairy') ||
    text.includes('curd') ||
    text.includes('coffee') ||
    text.includes('tea')
  ) {
    return {
      Icon: Tag,
      boxClass: 'bg-pink-500/15 border border-pink-500/30 text-pink-400',
    };
  }
  if (
    text.includes('veg') ||
    text.includes('fruit') ||
    text.includes('salad') ||
    text.includes('food') ||
    text.includes('dining') ||
    text.includes('swiggy') ||
    text.includes('zomato') ||
    text.includes('restaurant') ||
    text.includes('kitchen') ||
    text.includes('biryani')
  ) {
    return {
      Icon: Utensils,
      boxClass: 'bg-teal-500/15 border border-teal-500/30 text-teal-400',
    };
  }
  if (
    text.includes('maintenance') ||
    text.includes('repair') ||
    text.includes('service') ||
    text.includes('plumb') ||
    text.includes('electrician') ||
    text.includes('carpenter')
  ) {
    return {
      Icon: Wrench,
      boxClass: 'bg-amber-500/15 border border-amber-500/30 text-amber-400',
    };
  }
  if (
    text.includes('rent') ||
    text.includes('housing') ||
    text.includes('flat') ||
    text.includes('apartment') ||
    text.includes('society') ||
    text.includes('pg')
  ) {
    return {
      Icon: HomeIcon,
      boxClass: 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400',
    };
  }
  if (
    text.includes('utilit') ||
    text.includes('bill') ||
    text.includes('power') ||
    text.includes('water') ||
    text.includes('gas') ||
    text.includes('cylinder') ||
    text.includes('bescom') ||
    text.includes('recharge') ||
    text.includes('broadband') ||
    text.includes('wifi') ||
    text.includes('dth')
  ) {
    return {
      Icon: Zap,
      boxClass: 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400',
    };
  }
  if (
    text.includes('fuel') ||
    text.includes('petrol') ||
    text.includes('diesel') ||
    text.includes('transport') ||
    text.includes('uber') ||
    text.includes('ola') ||
    text.includes('rapido') ||
    text.includes('auto') ||
    text.includes('fastag') ||
    text.includes('parking') ||
    text.includes('toll') ||
    text.includes('travel') ||
    text.includes('irctc') ||
    text.includes('flight') ||
    text.includes('bus')
  ) {
    return {
      Icon: Car,
      boxClass: 'bg-blue-500/15 border border-blue-500/30 text-blue-400',
    };
  }
  if (
    text.includes('shop') ||
    text.includes('cloth') ||
    text.includes('amazon') ||
    text.includes('flipkart') ||
    text.includes('myntra') ||
    text.includes('ajio') ||
    text.includes('mall') ||
    text.includes('fashion') ||
    text.includes('shoes')
  ) {
    return {
      Icon: ShoppingBag,
      boxClass: 'bg-purple-500/15 border border-purple-500/30 text-purple-400',
    };
  }
  if (
    text.includes('health') ||
    text.includes('medic') ||
    text.includes('pharma') ||
    text.includes('doctor') ||
    text.includes('clinic') ||
    text.includes('hospital') ||
    text.includes('lab') ||
    text.includes('dentist') ||
    text.includes('apollo')
  ) {
    return {
      Icon: HeartPulse,
      boxClass: 'bg-rose-500/15 border border-rose-500/30 text-rose-400',
    };
  }
  if (
    text.includes('school') ||
    text.includes('college') ||
    text.includes('tuition') ||
    text.includes('book') ||
    text.includes('course') ||
    text.includes('exam') ||
    text.includes('fee') ||
    text.includes('educat')
  ) {
    return {
      Icon: BookOpen,
      boxClass: 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400',
    };
  }
  if (
    text.includes('movie') ||
    text.includes('cinema') ||
    text.includes('pvr') ||
    text.includes('inox') ||
    text.includes('netflix') ||
    text.includes('hotstar') ||
    text.includes('spotify') ||
    text.includes('game') ||
    text.includes('entertain')
  ) {
    return {
      Icon: Film,
      boxClass: 'bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-400',
    };
  }
  return {
    Icon: Tag,
    boxClass: 'bg-sky-500/15 border border-sky-500/30 text-sky-400',
  };
};

const getWishCategoryVisual = (title: string = '', category: string = '') => {
  const text = `${title} ${category}`.toLowerCase();
  if (
    text.includes('phone') ||
    text.includes('laptop') ||
    text.includes('tv') ||
    text.includes('ipad') ||
    text.includes('tablet') ||
    text.includes('gadget') ||
    text.includes('camera') ||
    text.includes('watch') ||
    text.includes('playstation')
  ) {
    return {
      Icon: Laptop,
      boxClass: 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400',
    };
  }
  if (
    text.includes('car') ||
    text.includes('bike') ||
    text.includes('cycle') ||
    text.includes('bicycle') ||
    text.includes('scooter') ||
    text.includes('vehicle')
  ) {
    return {
      Icon: Car,
      boxClass: 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400',
    };
  }
  if (
    text.includes('home') ||
    text.includes('sofa') ||
    text.includes('bed') ||
    text.includes('fridge') ||
    text.includes('refrigerator') ||
    text.includes('ac') ||
    text.includes('furnitur') ||
    text.includes('house') ||
    text.includes('flat')
  ) {
    return {
      Icon: HomeIcon,
      boxClass: 'bg-amber-500/15 border border-amber-500/30 text-amber-400',
    };
  }
  if (
    text.includes('trip') ||
    text.includes('travel') ||
    text.includes('tour') ||
    text.includes('vacation') ||
    text.includes('holiday') ||
    text.includes('flight') ||
    text.includes('goa') ||
    text.includes('paris') ||
    text.includes('kashmir')
  ) {
    return {
      Icon: Plane,
      boxClass: 'bg-blue-500/15 border border-blue-500/30 text-blue-400',
    };
  }
  if (
    text.includes('gold') ||
    text.includes('jewel') ||
    text.includes('diamond') ||
    text.includes('ring') ||
    text.includes('necklace') ||
    text.includes('silver')
  ) {
    return {
      Icon: Sparkles,
      boxClass: 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400',
    };
  }
  return {
    Icon: Gift,
    boxClass: 'bg-purple-500/15 border border-purple-500/30 text-purple-400',
  };
};

const getTaskCategoryVisual = (title: string = '', category: string = '') => {
  const text = `${title} ${category}`.toLowerCase();
  if (
    text.includes('grocer') ||
    text.includes('vegetable') ||
    text.includes('milk') ||
    text.includes('buy') ||
    text.includes('shop') ||
    text.includes('market')
  ) {
    return {
      Icon: ShoppingCart,
      boxClass: 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400',
    };
  }
  if (
    text.includes('clean') ||
    text.includes('wash') ||
    text.includes('mop') ||
    text.includes('tidy') ||
    text.includes('laundry') ||
    text.includes('cook') ||
    text.includes('dish')
  ) {
    return {
      Icon: Sparkles,
      boxClass: 'bg-teal-500/15 border border-teal-500/30 text-teal-400',
    };
  }
  if (
    text.includes('repair') ||
    text.includes('fix') ||
    text.includes('service') ||
    text.includes('maint') ||
    text.includes('plumb') ||
    text.includes('mechanic')
  ) {
    return {
      Icon: Wrench,
      boxClass: 'bg-amber-500/15 border border-amber-500/30 text-amber-400',
    };
  }
  if (
    text.includes('bill') ||
    text.includes('pay') ||
    text.includes('recharge') ||
    text.includes('fee') ||
    text.includes('bank') ||
    text.includes('transfer')
  ) {
    return {
      Icon: Zap,
      boxClass: 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400',
    };
  }
  if (
    text.includes('doctor') ||
    text.includes('medic') ||
    text.includes('health') ||
    text.includes('clinic') ||
    text.includes('hospital') ||
    text.includes('test') ||
    text.includes('vaccin')
  ) {
    return {
      Icon: HeartPulse,
      boxClass: 'bg-rose-500/15 border border-rose-500/30 text-rose-400',
    };
  }
  if (
    text.includes('school') ||
    text.includes('homework') ||
    text.includes('study') ||
    text.includes('exam') ||
    text.includes('class') ||
    text.includes('tuition')
  ) {
    return {
      Icon: BookOpen,
      boxClass: 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400',
    };
  }
  return {
    Icon: CheckSquare,
    boxClass: 'bg-sky-500/15 border border-sky-500/30 text-sky-400',
  };
};

interface HomeViewProps {
  onNavigateTab: (tab: any) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigateTab }) => {
  const { dashboard, isLoading, refreshDashboard } = useFamily();
  const { activeLanguage, currentUser, family, hasPermission, familyMembers } = useAuth();
  const { isPrivacyMode, togglePrivacyMode } = useSecurity();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const t = translations[activeLanguage];

  // Quick Action Modal States
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showWishListModal, setShowWishListModal] = useState(false);
  const [showSetGoalModal, setShowSetGoalModal] = useState(false);
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Shared Wishlist & Tasks items state
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [familyTasks, setFamilyTasks] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  // Last 5 recent expenses sorted by date/timestamp descending
  const recentExpenses = useMemo(() => {
    if (!Array.isArray(expenses)) return [];
    return [...expenses]
      .sort((a, b) => {
        const timeA = new Date(a.date || a.expense_date || a.created_at || 0).getTime();
        const timeB = new Date(b.date || b.expense_date || b.created_at || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 5);
  }, [expenses]);

  // Smart Expense State
  const [pendingSmartTx, setPendingSmartTx] = useState<DetectedTransaction[]>([]);
  const [confirmedSmartTx, setConfirmedSmartTx] = useState<DetectedTransaction[]>([]);
  const [ignoredSmartTx, setIgnoredSmartTx] = useState<DetectedTransaction[]>([]);
  const [smartSettings, setSmartSettings] = useState<SmartCaptureSettings>({
    enabled: false,
    smsEnabled: false,
    notificationEnabled: false,
    autoCategorization: true,
    dailyReview: true,
    notificationMode: 'BATCH',
    privacyMode: false,
    historicalScanDays: 7,
  });
  const [showSmartReviewModal, setShowSmartReviewModal] = useState(false);
  const [showSmartPermissionModal, setShowSmartPermissionModal] = useState(false);
  const [showSmartDetailModal, setShowSmartDetailModal] = useState(false);
  const [showSmartSettingsModal, setShowSmartSettingsModal] = useState(false);
  const [selectedSmartTx, setSelectedSmartTx] = useState<DetectedTransaction | null>(null);

  // Load shared wishlist, tasks, expenses, and smart capture from backend database
  const loadHomeData = async () => {
    if (!family?.id) return;
    try {
      const [tasksRes, expRes, smartData, smartSettingsData] = await Promise.all([
        apiRequest(`/tasks/${family.id}/tasks`).catch(() => ({ groceryItems: [], tasks: [] })),
        apiRequest(`/expenses/${family.id}/expenses`).catch(() => ({ expenses: [] })),
        SmartExpenseService.fetchAllTransactions(family.id).catch(() => ({ pending: [], confirmed: [], ignored: [] })),
        SmartExpenseService.getSettings(family.id).catch(() => null),
      ]);
      setWishlistItems(tasksRes.groceryItems || []);
      setFamilyTasks(tasksRes.tasks || []);
      setExpenses(expRes.expenses || []);
      if (smartData) {
        setPendingSmartTx(smartData.pending || []);
        setConfirmedSmartTx(smartData.confirmed || []);
        setIgnoredSmartTx(smartData.ignored || []);
      }
      if (smartSettingsData) {
        setSmartSettings(smartSettingsData);
      }
    } catch (err) {
      console.error('Failed to load home data:', err);
    }
  };

  const handleConfirmSmartTx = async (tx: DetectedTransaction, overrides?: any) => {
    if (!family?.id) return;
    const success = await SmartExpenseService.confirmTransaction(family.id, tx.id, overrides);
    if (success) {
      refreshDashboard();
      loadHomeData();
    }
  };

  const handleBulkConfirmSmartTx = async () => {
    if (!family?.id) return;
    await SmartExpenseService.bulkConfirmTransactions(family.id);
    refreshDashboard();
    loadHomeData();
  };

  const handleIgnoreSmartTx = async (tx: DetectedTransaction) => {
    if (!family?.id) return;
    await SmartExpenseService.ignoreTransaction(family.id, tx.id);
    loadHomeData();
  };

  const handleScanRecentSmartTx = async (days?: number) => {
    if (!family?.id) return { detectedCount: 0, message: 'Family not found' };
    const res = await SmartExpenseService.runHistoricalScan(family.id, days || smartSettings.historicalScanDays || 7);
    await loadHomeData();
    return res;
  };

  const handleGrantSmartPermission = async () => {
    setShowSmartPermissionModal(false);
    if (!family?.id) return;
    const provider = await SmartExpenseService.getProvider();
    await provider.requestPermission();
    await SmartExpenseService.updateSettings(family.id, { enabled: true, smsEnabled: true });
    await handleScanRecentSmartTx();
    const updatedSettings = await SmartExpenseService.getSettings(family.id);
    setSmartSettings(updatedSettings);
  };

  const handleSaveSmartSettings = async (newSettings: Partial<SmartCaptureSettings>) => {
    if (!family?.id) return;
    await SmartExpenseService.updateSettings(family.id, newSettings);
    const updated = await SmartExpenseService.getSettings(family.id);
    setSmartSettings(updated);
  };

  useEffect(() => {
    refreshDashboard();
    loadHomeData();
    if (family?.id && typeof SmartExpenseService.startLiveCapture === 'function') {
      try {
        SmartExpenseService.startLiveCapture(family.id, () => {
          loadHomeData();
        });
      } catch (err) {
        console.warn('Live capture init suppressed:', err);
      }
    }
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
      loadHomeData();
    } catch (err) {
      console.error('Failed to create expense:', err);
    }
  };

  const handleAddIncome = async (incomeData: {
    source: string;
    amount: string;
    type: string;
    date: string;
    notes: string;
  }) => {
    if (!family?.id || !incomeData.amount) return;
    try {
      await apiRequest(`/investments/${family.id}/investments`, {
        method: 'POST',
        body: JSON.stringify({
          title: incomeData.source || 'Monthly Salary & Income',
          type: 'FIXED_DEPOSIT',
          institution: 'Bank Credit / Direct Deposit',
          invested_amount: Number(incomeData.amount) || 0,
          current_value: Number(incomeData.amount) || 0,
          notes: incomeData.notes,
        }),
      });
      setShowAddIncomeModal(false);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to record income:', err);
    }
  };

  const handleCreateGoal = async (goalData: {
    title: string;
    category: string;
    target_amount: number;
    current_amount: number;
    monthly_contribution: number;
    target_date: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }) => {
    if (!family?.id || !goalData.title.trim()) return;
    try {
      await apiRequest(`/goals/${family.id}/goals`, {
        method: 'POST',
        body: JSON.stringify(goalData),
      });
      setShowSetGoalModal(false);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const handleAddWish = async (wishData: {
    item_name: string;
    category: string;
    estimated_cost: number;
    notes?: string;
  }) => {
    if (!wishData.item_name.trim() || !family?.id) return;
    try {
      const created = await apiRequest(`/tasks/${family.id}/grocery`, {
        method: 'POST',
        body: JSON.stringify({
          item_name: wishData.item_name.trim(),
          quantity: wishData.estimated_cost ? `₹${Number(wishData.estimated_cost).toLocaleString('en-IN')}` : '1 unit',
          category: wishData.category || 'WISH',
          estimated_cost: Number(wishData.estimated_cost) || 0,
        }),
      });
      setWishlistItems((prev) => [...prev, created]);
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

  const handleCreateVaultDoc = async (vaultData: {
    title: string;
    category: string;
    document_number?: string;
    holder_name?: string;
    expiry_date?: string;
    notes?: string;
  }) => {
    if (!family?.id || !vaultData.title.trim()) return;
    try {
      await apiRequest(`/documents/${family.id}/documents`, {
        method: 'POST',
        body: JSON.stringify(vaultData),
      });
      setShowVaultModal(false);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to add document to vault:', err);
    }
  };

  const toggleTaskStatus = async (id: string) => {
    if (!family?.id) return;
    try {
      const updated = await apiRequest(`/tasks/${family.id}/tasks/${id}/toggle`, {
        method: 'PATCH',
      });
      setFamilyTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      refreshDashboard();
    } catch (err) {
      console.error('Failed to toggle task status:', err);
    }
  };

  const deleteTaskItem = async (id: string) => {
    if (!family?.id) return;
    try {
      setFamilyTasks((prev) => prev.filter((t) => t.id !== id));
      await apiRequest(`/tasks/${family.id}/tasks/${id}`, {
        method: 'DELETE',
      });
      refreshDashboard();
    } catch (err) {
      console.error('Failed to delete task item:', err);
    }
  };

  const handleCreateTask = async (taskData: {
    title: string;
    category: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    assigned_to_name?: string;
    due_date?: string;
    notes?: string;
  }) => {
    if (!family?.id || !taskData.title.trim()) return;
    try {
      const created = await apiRequest(`/tasks/${family.id}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          title: taskData.title,
          category: taskData.category,
          priority: taskData.priority,
          assigned_to_name: taskData.assigned_to_name,
          due_date: taskData.due_date,
          status: 'PENDING',
        }),
      });
      if (created) {
        setFamilyTasks((prev) => [created, ...prev]);
      }
      setShowTaskModal(false);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleCreateMaintenance = async (maintenanceData: {
    item_name: string;
    service_type: string;
    cost?: number;
    service_provider?: string;
    contact_phone?: string;
    next_service_due?: string;
    notes?: string;
  }) => {
    if (!family?.id || !maintenanceData.item_name.trim()) return;
    try {
      await apiRequest(`/tasks/${family.id}/maintenance`, {
        method: 'POST',
        body: JSON.stringify(maintenanceData),
      });
      setShowMaintenanceModal(false);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to add maintenance record:', err);
    }
  };

  const handleCreateEmergencyContact = async (contactData: {
    contact_name: string;
    phone: string;
    relationship: string;
    category?: string;
    blood_group?: string;
    notes?: string;
  }) => {
    if (!family?.id || !contactData.contact_name.trim() || !contactData.phone.trim()) return;
    try {
      await apiRequest(`/emergency/${family.id}/emergency/contacts`, {
        method: 'POST',
        body: JSON.stringify(contactData),
      });
      setShowEmergencyModal(false);
      refreshDashboard();
    } catch (err) {
      console.error('Failed to add emergency contact:', err);
    }
  };

  if (isLoading || !dashboard) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-[#0D152D] rounded-xl"></div>
        <div className="h-44 bg-[#0D152D] rounded-3xl"></div>
        <div className="grid grid-cols-4 gap-2.5">
          <div className="h-20 bg-[#0D152D] rounded-2xl"></div>
          <div className="h-20 bg-[#0D152D] rounded-2xl"></div>
          <div className="h-20 bg-[#0D152D] rounded-2xl"></div>
          <div className="h-20 bg-[#0D152D] rounded-2xl"></div>
        </div>
        <div className="h-32 bg-[#0D152D] rounded-3xl"></div>
      </div>
    );
  }

  const snapshot = dashboard?.snapshot || {
    netWorth: 0,
    monthlySpending: 0,
    totalSavings: 0,
    monthlyBudget: 100000,
  };
  const goals = dashboard?.goals || [];
  const recentMemories = dashboard?.recentMemories || [];
  const today = dashboard?.today;
  const rawNetWorth = snapshot?.netWorth || 0;
  const netWorthDisplay = Math.abs(rawNetWorth);
  const firstName = currentUser?.name?.split(' ')[0] || 'Rambabu';
  const locationCity = family?.location?.split(',')[0] || 'India';

  return (
    <div className={`p-3.5 space-y-3.5 pb-24 animate-in fade-in duration-300 ${
      isLight ? 'text-[#2A1B14]' : 'text-[#F4F8FF]'
    }`}>
      {/* Hero Greeting + Weather + Family Badge (Matching Reference 1 & 2) */}
      <div className={`relative rounded-[26px] overflow-hidden kinora-3d-card ${
        isLight
          ? 'bg-gradient-to-r from-[#F8EDE0] via-[#F3E3D3] to-[#EAD6C4]/60 border border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14)]'
          : 'bg-transparent'
      }`}>
        <div className={`p-4 sm:p-5 flex items-center justify-between gap-3 ${isLight ? 'relative min-h-[148px]' : ''}`}>
          {/* Left: Weather Tag & Greeting */}
          <div className={`space-y-2 min-w-0 z-10 ${isLight ? 'max-w-[56%]' : ''}`}>
            {/* Weather Pill */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full shadow-sm border ${
              isLight
                ? 'bg-[#FFF8F1] border-[#EAD6C4] text-[#1F1F1F]'
                : 'bg-[#0D152D] border-amber-500/30 text-white'
            }`}>
              <Sun className="w-3.5 h-3.5 text-[#FFC107] fill-[#FFC107]/20" />
              <span className={`text-[10.5px] font-semibold ${isLight ? 'text-[#6B6B6B]' : 'text-slate-300'}`}>{locationCity}</span>
              <span className="text-xs font-black">28°C</span>
              <ChevronRight className="w-3 h-3 text-[#A3A3A3]" />
            </div>

            <div>
              <h2 className={`text-base sm:text-lg font-bold leading-tight ${
                isLight ? 'text-[#1F1F1F]' : 'text-slate-200'
              }`}>
                {getGreeting()},
              </h2>
              <h1 className={`text-2xl sm:text-3xl font-black leading-tight flex items-center gap-1.5 mt-0.5 ${
                isLight ? 'text-[#F05A28]' : 'text-white'
              }`}>
                <span>{firstName}</span>
                <span className="text-xl">👋</span>
              </h1>
              <p className={`text-xs italic mt-1 leading-snug ${
                isLight ? 'text-[#6B6B6B]' : 'text-slate-400'
              }`}>
                "Small steps today, big dreams tomorrow."
              </p>
            </div>
          </div>

          {/* Right: 3D Pixar Indian Family Photo (2nd Reference Image) with "Better Together ♡" Script */}
          {isLight && (
            <div className="relative shrink-0 w-[44%] h-full flex flex-col items-end justify-center">
              {/* Better Together cursive tag at top-right of family */}
              <div className="absolute -top-2 right-1 z-10 flex items-center gap-0.5 bg-[#FFF8F1]/95 backdrop-blur-xs px-2 py-0.5 rounded-full border border-[#EAD6C4] shadow-xs">
                <span className="font-serif italic font-bold text-[#D3542F] text-[10px] sm:text-[11px] tracking-tight">
                  Better Together
                </span>
                <span className="text-[#D3542F] text-[10px] font-bold">♡</span>
              </div>
              <img
                src="/family-hero.jpg"
                alt="Family Together"
                className="w-full max-w-[175px] h-[125px] sm:h-[140px] object-cover object-top rounded-2xl ring-2 ring-[#EAD6C4] shadow-md transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. Quick Action Tabs (Single-Row 3D Revolving Circular Carousel - 1x2 Inch Cards) */}
      <CircularQuickActions
        onFriends={() => onNavigateTab('friends')}
        onAddExpense={() => setShowAddExpenseModal(true)}
        onWishList={() => setShowWishListModal(true)}
        onSetGoal={() => setShowSetGoalModal(true)}
        onAddIncome={() => setShowAddIncomeModal(true)}
        onVault={() => setShowVaultModal(true)}
        onTasks={() => setShowTaskModal(true)}
        onMaintenance={() => setShowMaintenanceModal(true)}
        onEmergency={() => setShowEmergencyModal(true)}
      />

      {/* 2.1. Upcoming Family & Friends Celebrations & Reminders (KinoraOne Module) */}
      <FamilyRemindersHomeWidget onNavigateTab={onNavigateTab} />

      {/* 2.2. Spending Financial Analytics Dashboard (Matching Attached Image) */}
      <MoneyAnalyticsDashboard
        expenses={expenses}
        monthlyBudget={dashboard?.snapshot?.monthlyBudget || 100000}
        onNavigateTab={onNavigateTab}
        isPrivacyMode={isPrivacyMode}
      />

      {/* 2.3. Smart Expenses Quick Review Card */}
      <SmartExpensesHomeCard
        pendingTransactions={pendingSmartTx}
        settings={smartSettings}
        onOpenReview={() => setShowSmartReviewModal(true)}
        onOpenEnable={() => setShowSmartPermissionModal(true)}
        onOpenSettings={() => setShowSmartSettingsModal(true)}
        isPrivacyMode={isPrivacyMode}
      />

      {/* 2.4. Recent Expenses Section (Matching Reference Model Image) */}
      <div className={`rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xl space-y-2.5 kinora-3d-card ${
        isLight
          ? 'bg-[#F3E3D3] border border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14)]'
          : 'bg-[#0D152D] border border-slate-800/80 shadow-xl'
      }`}>
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm sm:text-base font-bold tracking-tight flex items-center gap-2 ${
              isLight ? 'text-[#1F1F1F]' : 'text-white'
            }`}>
              <span className={isLight ? 'text-[#D3542F]' : 'text-[#FF4D6D]'}>✦</span>
              <span>Recent Expenses</span>
              {recentExpenses.length > 0 && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  isLight
                    ? 'text-[#D3542F] bg-[#D3542F]/12 border-[#D3542F]/30'
                    : 'text-[#FF4D6D] bg-[#FF4D6D]/15 border-[#FF4D6D]/30'
                }`}>
                  {recentExpenses.length}
                </span>
              )}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddExpenseModal(true)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                isLight
                  ? 'text-white bg-[#F05A28] hover:bg-[#E76F3C] border-[#F05A28] shadow-sm'
                  : 'text-[#FF4D6D] hover:text-[#FF758F] bg-[#FF4D6D]/10 hover:bg-[#FF4D6D]/20 border-[#FF4D6D]/25'
              }`}
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('money')}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all flex items-center gap-0.5 ${
                isLight
                  ? 'text-[#6B6B6B] hover:text-[#1F1F1F] bg-[#FFF8F1] hover:bg-[#F8EDE0] border-[#EAD6C4]'
                  : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border-slate-700/40'
              }`}
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Expenses List with Self-Color Light Boxes */}
        {recentExpenses && recentExpenses.length > 0 ? (
          <div className={`divide-y ${isLight ? 'divide-[#EAD6C4]' : 'divide-slate-800/60'}`}>
            {recentExpenses.map((exp) => {
              const amountDisplay = isPrivacyMode
                ? '••••'
                : `₹${Number(exp.amount || 0).toLocaleString('en-IN')}`;
              const merchantDisplay = exp.merchant || exp.description || exp.title || 'Expense';
              const categoryDisplay = exp.category_name || exp.category || 'General';
              const dateDisplay = exp.date || exp.expense_date
                ? new Date(exp.date || exp.expense_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })
                : '';

              const visual = getExpenseCategoryVisual(categoryDisplay, merchantDisplay);
              const VisualIcon = visual.Icon;

              return (
                <div
                  key={exp.id || Math.random()}
                  className={`flex items-center justify-between py-2.5 px-2 rounded-xl transition-all group ${
                    isLight ? 'hover:bg-[#FFF8F1]/60' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Self Color Light Box with Category Picture/Icon */}
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 kinora-3d-icon-box ${visual.boxClass}`}>
                      <VisualIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className={`text-xs sm:text-sm font-semibold truncate ${
                        isLight ? 'text-[#1F1F1F]' : 'text-white'
                      }`}>
                        {merchantDisplay}
                      </div>
                      <div className={`text-[11px] mt-0.5 truncate flex items-center gap-1.5 ${
                        isLight ? 'text-[#6B6B6B]' : 'text-slate-400'
                      }`}>
                        <span>{categoryDisplay}</span>
                        {dateDisplay && <span>•</span>}
                        {dateDisplay && <span>{dateDisplay}</span>}
                      </div>
                    </div>
                  </div>

                  <div className={`text-xs sm:text-sm font-bold text-right tracking-tight shrink-0 pl-3 ${
                    isLight ? 'text-[#D3542F]' : 'text-white'
                  }`}>
                    {amountDisplay}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className={`text-xs ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>No expenses recorded yet.</p>
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className={`mt-2 text-xs font-semibold hover:underline ${
                isLight ? 'text-[#D3542F]' : 'text-[#FF4D6D]'
              }`}
            >
              + Record your first expense
            </button>
          </div>
        )}
      </div>

      {/* 2.5. Family Tasks Section (Matching Reference Model Image) */}
      <div className={`rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xl space-y-2.5 kinora-3d-card ${
        isLight
          ? 'bg-[#F3E3D3] border border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14)]'
          : 'bg-[#0D152D] border border-slate-800/80 shadow-xl'
      }`}>
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm sm:text-base font-bold tracking-tight flex items-center gap-2 ${
              isLight ? 'text-[#1F1F1F]' : 'text-white'
            }`}>
              <span className={isLight ? 'text-[#FFC107]' : 'text-[#FFB91F]'}>✦</span>
              <span>Family Tasks</span>
              {familyTasks.length > 0 && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  isLight
                    ? 'text-amber-900 bg-amber-100 border-amber-300'
                    : 'text-[#FFB91F] bg-[#FFB91F]/15 border-[#FFB91F]/30'
                }`}>
                  {familyTasks.length}
                </span>
              )}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowTaskModal(true)}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
              isLight
                ? 'text-white bg-[#F05A28] hover:bg-[#E76F3C] border-[#F05A28] shadow-sm'
                : 'text-[#FFB91F] hover:text-[#FFD21F] bg-[#FFB91F]/10 hover:bg-[#FFB91F]/20 border-[#FFB91F]/25'
            }`}
          >
            <Plus className="w-3 h-3" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Tasks List with Self-Color Light Boxes */}
        {familyTasks && familyTasks.length > 0 ? (
          <div className={`divide-y ${isLight ? 'divide-[#EAD6C4]' : 'divide-slate-800/60'}`}>
            {familyTasks.map((task) => {
              const isCompleted = task.status === 'COMPLETED';
              const visual = getTaskCategoryVisual(task.title, task.category);
              const VisualIcon = visual.Icon;
              const priorityColor =
                task.priority === 'HIGH'
                  ? isLight ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : task.priority === 'MEDIUM'
                  ? isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between py-2.5 px-2 rounded-xl transition-all group ${
                    isLight ? 'hover:bg-[#FFF8F1]/60' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Self Color Light Box with Category Picture/Icon */}
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 kinora-3d-icon-box ${visual.boxClass}`}>
                      <VisualIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`text-xs sm:text-sm font-semibold cursor-pointer truncate transition-colors ${
                          isCompleted
                            ? isLight ? 'line-through text-[#A3A3A3]' : 'line-through text-slate-500'
                            : isLight ? 'text-[#1F1F1F] hover:text-[#D3542F]' : 'text-white hover:text-amber-300'
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className={`text-[11px] mt-0.5 truncate flex items-center gap-1.5 ${
                        isLight ? 'text-[#6B6B6B]' : 'text-slate-400'
                      }`}>
                        {task.assigned_to_name && <span>{task.assigned_to_name}</span>}
                        {task.assigned_to_name && task.due_date && <span>•</span>}
                        {task.due_date && <span>Due: {task.due_date}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    {task.priority && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColor}`}>
                        {task.priority}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        isCompleted
                          ? isLight
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : isLight
                          ? 'bg-[#FFF8F1] border-[#EAD6C4] text-[#6B6B6B] hover:text-[#1F1F1F]'
                          : 'bg-white/5 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                      }`}
                      title={isCompleted ? 'Mark pending' : 'Mark completed'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteTaskItem(task.id)}
                      className={`opacity-0 group-hover:opacity-100 p-1 transition-all ${
                        isLight ? 'text-[#A3A3A3] hover:text-rose-600' : 'text-slate-500 hover:text-[#FF4D6D]'
                      }`}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className={`text-xs ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>No active tasks for the family.</p>
            <button
              onClick={() => setShowTaskModal(true)}
              className={`mt-2 text-xs font-semibold hover:underline ${
                isLight ? 'text-[#D3542F]' : 'text-[#FFB91F]'
              }`}
            >
              + Add a chore or task
            </button>
          </div>
        )}
      </div>

      {/* 2.6. Family Wishlist Section (Matching Reference Model Image) */}
      <div className={`rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xl space-y-2.5 kinora-3d-card ${
        isLight
          ? 'bg-[#F3E3D3] border border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14)]'
          : 'bg-[#0D152D] border border-slate-800/80 shadow-xl'
      }`}>
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm sm:text-base font-bold tracking-tight flex items-center gap-2 ${
              isLight ? 'text-[#1F1F1F]' : 'text-white'
            }`}>
              <span className={isLight ? 'text-[#42A5F5]' : 'text-[#00D2FF]'}>✦</span>
              <span>Family Wishlist</span>
              {wishlistItems.length > 0 && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  isLight
                    ? 'text-sky-900 bg-sky-100 border-sky-300'
                    : 'text-[#00D2FF] bg-[#00D2FF]/15 border-[#00D2FF]/30'
                }`}>
                  {wishlistItems.length}
                </span>
              )}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowWishListModal(true)}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
              isLight
                ? 'text-white bg-[#F05A28] hover:bg-[#E76F3C] border-[#F05A28] shadow-sm'
                : 'text-[#00D2FF] hover:text-[#7EDCFF] bg-[#00D2FF]/10 hover:bg-[#00D2FF]/20 border-[#00D2FF]/25'
            }`}
          >
            <Plus className="w-3 h-3" />
            <span>Add Wish</span>
          </button>
        </div>

        {/* Wishlist List with Self-Color Light Boxes */}
        {wishlistItems && wishlistItems.length > 0 ? (
          <div className={`divide-y ${isLight ? 'divide-[#EAD6C4]' : 'divide-slate-800/60'}`}>
            {wishlistItems.map((wish) => {
              const isFulfilled = wish.completed || wish.status === 'COMPLETED';
              const costDisplay = wish.estimated_cost
                ? `₹${Number(wish.estimated_cost).toLocaleString('en-IN')}`
                : wish.quantity && wish.quantity !== '1 unit'
                ? wish.quantity
                : '';

              const visual = getWishCategoryVisual(wish.item_name || wish.title, wish.category);
              const VisualIcon = visual.Icon;

              return (
                <div
                  key={wish.id}
                  className={`flex items-center justify-between py-2.5 px-2 rounded-xl transition-all group ${
                    isLight ? 'hover:bg-[#FFF8F1]/60' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Self Color Light Box with Category Picture/Icon */}
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 kinora-3d-icon-box ${visual.boxClass}`}>
                      <VisualIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        onClick={() => toggleWishFulfilled(wish.id)}
                        className={`text-xs sm:text-sm font-semibold cursor-pointer truncate transition-colors ${
                          isFulfilled
                            ? isLight ? 'line-through text-[#A3A3A3]' : 'line-through text-slate-500'
                            : isLight ? 'text-[#1F1F1F] hover:text-[#42A5F5]' : 'text-white hover:text-cyan-300'
                        }`}
                      >
                        {wish.item_name || wish.title}
                      </div>
                      <div className={`text-[11px] mt-0.5 truncate flex items-center gap-1.5 ${
                        isLight ? 'text-[#6B6B6B]' : 'text-slate-400'
                      }`}>
                        <span>{wish.category || 'Wishlist'}</span>
                        {wish.notes && <span>•</span>}
                        {wish.notes && <span>{wish.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    {costDisplay && (
                      <span className={`text-xs sm:text-sm font-bold ${
                        isFulfilled
                          ? isLight ? 'text-[#A3A3A3]' : 'text-slate-500'
                          : isLight ? 'text-[#22C55E]' : 'text-[#00E676]'
                      }`}>
                        {costDisplay}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleWishFulfilled(wish.id)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        isFulfilled
                          ? isLight
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : isLight
                          ? 'bg-[#FFF8F1] border-[#EAD6C4] text-[#6B6B6B] hover:text-[#1F1F1F]'
                          : 'bg-white/5 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                      }`}
                      title={isFulfilled ? 'Mark unfulfilled' : 'Mark fulfilled'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteWishItem(wish.id)}
                      className={`opacity-0 group-hover:opacity-100 p-1 transition-all ${
                        isLight ? 'text-[#A3A3A3] hover:text-rose-600' : 'text-slate-500 hover:text-[#FF4D6D]'
                      }`}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className={`text-xs ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>No wishlist items yet.</p>
            <button
              onClick={() => setShowWishListModal(true)}
              className={`mt-2 text-xs font-semibold hover:underline ${
                isLight ? 'text-[#D3542F]' : 'text-[#00D2FF]'
              }`}
            >
              + Add a dream for your family
            </button>
          </div>
        )}
      </div>

      {/* 4. Quick Overview (3 Cards) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-bold tracking-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Quick Overview</h3>
          <button
            onClick={() => onNavigateTab('money')}
            className={`text-[11px] font-bold flex items-center gap-0.5 transition-colors ${
              isLight ? 'text-[#D3542F] hover:text-[#F05A28]' : 'text-[#16C7F2] hover:text-[#7EDCFF]'
            }`}
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Card 1: Monthly Spending (Red/Pink Accent) */}
          <div
            onClick={() => onNavigateTab('money')}
            className={`p-3.5 rounded-[22px] flex flex-col justify-between transition-all cursor-pointer group border kinora-3d-tile ${
              isLight
                ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2] hover:border-[#D3542F]/50 shadow-[0_6px_14px_-2px_rgba(130,80,45,0.12)]'
                : 'bg-[#0D152D] border-[#FF4D6D]/30 hover:border-[#FF4D6D]/60 shadow-lg'
            }`}
          >
            <div>
              <div className={`text-[10px] font-bold leading-tight ${
                isLight ? 'text-[#D3542F]' : 'text-[#FF8A70]'
              }`}>Monthly Spending</div>
              <div className={`text-sm sm:text-base font-black mt-1.5 ${
                isLight ? 'text-[#1F1F1F]' : 'text-white'
              }`}>
                {isPrivacyMode ? '••••' : formatCurrency(snapshot.monthlySpending || 0, false)}
              </div>
            </div>
            <div className={`text-[10px] font-bold mt-2 flex items-center gap-0.5 ${
              isLight ? 'text-[#D3542F]' : 'text-[#FF8A70]'
            }`}>
              <span>{(snapshot.monthlySpending || 0) > 0 ? '↓ 8%' : '₹0'}</span>
              <span className={`text-[9px] font-normal ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>{(snapshot.monthlySpending || 0) > 0 ? 'vs last mo' : 'this month'}</span>
            </div>
          </div>

          {/* Card 2: Savings (Emerald Accent) */}
          <div
            onClick={() => onNavigateTab('money')}
            className={`p-3.5 rounded-[22px] flex flex-col justify-between transition-all cursor-pointer group border kinora-3d-tile ${
              isLight
                ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2] hover:border-emerald-600/50 shadow-[0_6px_14px_-2px_rgba(130,80,45,0.12)]'
                : 'bg-[#0D152D] border-[#16C7F2]/30 hover:border-[#16C7F2]/60 shadow-lg'
            }`}
          >
            <div>
              <div className={`text-[10px] font-bold leading-tight ${
                isLight ? 'text-[#22C55E]' : 'text-[#34D399]'
              }`}>Savings</div>
              <div className={`text-sm sm:text-base font-black mt-1.5 ${
                isLight ? 'text-[#1F1F1F]' : 'text-white'
              }`}>
                {isPrivacyMode ? '••••' : formatCurrency(snapshot.totalSavings || 0, true)}
              </div>
            </div>
            <div className={`text-[10px] font-bold mt-2 flex items-center gap-0.5 ${
              isLight ? 'text-[#22C55E]' : 'text-[#34D399]'
            }`}>
              <span>{(snapshot.totalSavings || 0) > 0 ? '₹0' : '₹0'}</span>
              <span className={`text-[9px] font-normal ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>saved</span>
              <span className={`text-[9px] font-normal ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>year</span>
            </div>
          </div>

          {/* Card 3: Goals (Purple Accent) */}
          <div
            onClick={() => onNavigateTab('money')}
            className={`p-3.5 rounded-[22px] flex flex-col justify-between transition-all cursor-pointer group border kinora-3d-tile ${
              isLight
                ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2] hover:border-purple-600/50 shadow-[0_6px_14px_-2px_rgba(130,80,45,0.12)]'
                : 'bg-[#0D152D] border-[#8B5CF6]/30 hover:border-[#8B5CF6]/60 shadow-lg'
            }`}
          >
            <div>
              <div className={`text-[10px] font-bold leading-tight ${
                isLight ? 'text-[#AB47BC]' : 'text-slate-300'
              }`}>Goals</div>
              <div className={`text-sm sm:text-base font-black mt-1.5 ${
                isLight ? 'text-[#1F1F1F]' : 'text-white'
              }`}>
                {goals && goals.length > 0 ? `${goals.filter(g => g.current_amount >= g.target_amount).length}/${goals.length}` : '0/0'}
              </div>
            </div>
            <div className={`text-[10px] font-bold mt-2 ${
              isLight ? 'text-[#AB47BC]' : 'text-[#38BDF8]'
            }`}>
              {goals && goals.length > 0 ? 'On Track' : '0 Active'}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Upcoming Card */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-bold tracking-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Upcoming</h3>
          <button
            onClick={() => onNavigateTab('family')}
            className={`text-[11px] font-bold flex items-center gap-0.5 transition-colors ${
              isLight ? 'text-[#D3542F] hover:text-[#F05A28]' : 'text-[#16C7F2] hover:text-[#7EDCFF]'
            }`}
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {(() => {
          const calendarEvents = dashboard?.today?.events || [];
          if (calendarEvents.length > 0) {
            const ev = calendarEvents[0];
            return (
              <div
                onClick={() => onNavigateTab('calendar')}
                className={`p-3.5 rounded-[22px] flex items-center justify-between transition-all cursor-pointer group border kinora-3d-tile ${
                  isLight
                    ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2] hover:border-[#F05A28]/50 shadow-[0_6px_14px_-2px_rgba(130,80,45,0.12)]'
                    : 'bg-[#0D152D] border-slate-800/90 hover:border-slate-700 shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border kinora-3d-icon-box ${
                    isLight
                      ? 'bg-sky-100 border-sky-300 text-sky-800'
                      : 'bg-[#168BFF]/15 border-[#168BFF]/30 text-[#16C7F2]'
                  }`}>
                    <Calendar className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <div className={`text-xs font-bold transition-colors ${
                      isLight ? 'text-[#1F1F1F] group-hover:text-[#D3542F]' : 'text-white group-hover:text-[#7EDCFF]'
                    }`}>
                      {ev.title} 📅
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>
                      {ev.start_date ? formatDate(ev.start_date) : 'Upcoming Event'}
                    </div>
                  </div>
                </div>

                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                  isLight
                    ? 'bg-[#FFF8F1] border-[#EAD6C4] text-[#1F1F1F]'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}>
                  ➔
                </div>
              </div>
            );
          }

          // Birthday calculation
          const today = new Date();
          const currentYear = today.getFullYear();

          const memberBirthdays = (familyMembers || [])
            .filter((m) => {
              if (!m?.birth_date) return false;
              const d = new Date(m.birth_date);
              return !isNaN(d.getTime());
            })
            .map((m) => {
              try {
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
              } catch {
                return null;
              }
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a, b) => a.diffDays - b.diffDays);

          const nearest = memberBirthdays.length > 0 ? memberBirthdays[0] : null;

          return (
            <div
              onClick={() => onNavigateTab('family')}
              className={`p-3.5 rounded-[22px] flex items-center justify-between transition-all cursor-pointer group border kinora-3d-tile ${
                isLight
                  ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2] hover:border-amber-300 shadow-[0_6px_14px_-2px_rgba(130,80,45,0.12)]'
                  : 'bg-[#0D152D] border-slate-800/90 hover:border-slate-700 shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border kinora-3d-icon-box ${
                  isLight
                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                    : 'bg-[#FF8A24]/15 border-[#FF8A24]/30 text-[#FFD21F]'
                }`}>
                  <Cake className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className={`text-xs font-bold transition-colors ${
                    isLight ? 'text-[#1F1F1F] group-hover:text-[#D3542F]' : 'text-white group-hover:text-[#7EDCFF]'
                  }`}>
                    {nearest ? `${(nearest.member?.name || 'Family Member').split(' ')[0]}'s Birthday 🎂` : "Family Birthday 🎂"}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>
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
                className={`w-9 h-9 rounded-full object-cover ring-2 shadow-sm ${
                  isLight ? 'ring-[#C25425]/60' : 'ring-[#16C7F2]/60'
                }`}
              />
            </div>
          );
        })()}
      </div>

      {/* 6. Family Moments (Horizontal Carousel) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-black tracking-tight ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>Family Moments</h3>
          <button
            onClick={() => onNavigateTab('memories')}
            className={`text-[11px] font-bold flex items-center gap-0.5 transition-colors ${
              isLight ? 'text-[#B84A1E] hover:text-[#D96632]' : 'text-[#16C7F2] hover:text-[#7EDCFF]'
            }`}
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentMemories && recentMemories.length > 0 ? (
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {recentMemories.map((mem: any) => {
              const imgUrl = mem.photo || mem.photosList?.[0] || 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400';
              return (
                <div
                  key={mem.id}
                  onClick={() => onNavigateTab('memories')}
                  className={`min-w-[140px] max-w-[140px] rounded-[20px] overflow-hidden shadow-md shrink-0 cursor-pointer group transition-all border ${
                    isLight
                      ? 'bg-[#EBE0D2] border-[#DECFC0] hover:border-[#C25425]/50'
                      : 'bg-[#0D152D] border-slate-800/90 hover:border-[#16C7F2]/50'
                  }`}
                >
                  <div className="h-24 overflow-hidden relative">
                    <img
                      src={imgUrl}
                      alt={mem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <span className="absolute bottom-1.5 left-2.5 text-[9px] font-bold text-white truncate max-w-[120px]">
                      {mem.location || mem.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            onClick={() => onNavigateTab('memories')}
            className={`flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer group border ${
              isLight
                ? 'bg-[#EBE0D2] border-[#DECFC0] hover:border-[#C25425]/40'
                : 'bg-[#0D152D] border-slate-800/80 hover:border-[#16C7F2]/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isLight
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-[#16C7F2]/15 border-[#168BFF]/30 text-[#16C7F2]'
              }`}>
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-xs font-bold ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>Capture Your First Family Moment</p>
                <p className={`text-[10px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Save family photos, voice stories & precious memories</p>
              </div>
            </div>
            <span className={`text-[11px] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform ${
              isLight ? 'text-[#C25425]' : 'text-[#16C7F2]'
            }`}>
              <Plus className="w-3.5 h-3.5" /> Add
            </span>
          </div>
        )}
      </div>

      {/* ================= MODALS (WITH KINORAONE THEME SYSTEM) ================= */}

      {/* 1. Add Expense Modal (Interactive Icon Grid & Preset Pills) */}
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onSubmit={handleCreateExpense}
      />

      {/* 2. Wish List Modal */}
      <AddWishModal
        isOpen={showWishListModal}
        onClose={() => setShowWishListModal(false)}
        onSubmit={handleAddWish}
        wishlistItems={wishlistItems}
        onToggleWish={toggleWishFulfilled}
        onDeleteWish={deleteWishItem}
      />

      {/* 3. Set Goal Modal */}
      <AddGoalModal
        isOpen={showSetGoalModal}
        onClose={() => setShowSetGoalModal(false)}
        onSubmit={handleCreateGoal}
      />

      {/* 4. Add Income Modal */}
      <AddIncomeModal
        isOpen={showAddIncomeModal}
        onClose={() => setShowAddIncomeModal(false)}
        onSubmit={handleAddIncome}
      />

      {/* 5. Vault Modal */}
      <AddVaultModal
        isOpen={showVaultModal}
        onClose={() => setShowVaultModal(false)}
        onSubmit={handleCreateVaultDoc}
        familyMembers={familyMembers?.map((m) => ({ id: m.id, name: m.name }))}
      />

      {/* 6. Tasks Modal */}
      <AddTaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSubmit={handleCreateTask}
        familyMembers={familyMembers?.map((m) => ({ id: m.id, name: m.name }))}
      />

      {/* 7. Maintenance Modal */}
      <AddMaintenanceModal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        onSubmit={handleCreateMaintenance}
      />

      {/* 8. Emergency Modal */}
      <AddEmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        onSubmit={handleCreateEmergencyContact}
      />

      {/* ================= SMART EXPENSE MODALS ================= */}
      <SmartExpenseReviewModal
        isOpen={showSmartReviewModal}
        familyId={family?.id}
        onClose={() => setShowSmartReviewModal(false)}
        pendingTransactions={pendingSmartTx}
        confirmedTransactions={confirmedSmartTx}
        ignoredTransactions={ignoredSmartTx}
        onConfirm={(tx) => handleConfirmSmartTx(tx)}
        onEdit={(tx) => {
          setSelectedSmartTx(tx);
          setShowSmartDetailModal(true);
        }}
        onIgnore={(tx) => handleIgnoreSmartTx(tx)}
        onBulkConfirm={handleBulkConfirmSmartTx}
        onScanRecent={handleScanRecentSmartTx}
        onRefreshData={loadHomeData}
        onOpenSettings={() => {
          setShowSmartReviewModal(false);
          setShowSmartSettingsModal(true);
        }}
        isPrivacyMode={isPrivacyMode}
      />

      <SmartExpensePermissionModal
        isOpen={showSmartPermissionModal}
        onClose={() => setShowSmartPermissionModal(false)}
        onGrant={handleGrantSmartPermission}
      />

      <SmartExpenseDetailModal
        isOpen={showSmartDetailModal}
        transaction={selectedSmartTx}
        onClose={() => {
          setShowSmartDetailModal(false);
          setSelectedSmartTx(null);
        }}
        onConfirm={(overrides) => {
          if (selectedSmartTx) {
            handleConfirmSmartTx(selectedSmartTx, overrides);
          }
        }}
      />

      <SmartExpenseSettingsModal
        isOpen={showSmartSettingsModal}
        familyId={family?.id || ''}
        onClose={() => setShowSmartSettingsModal(false)}
        settings={smartSettings}
        onSettingsSaved={loadHomeData}
        onSaveSettings={handleSaveSmartSettings}
        onTriggerScan={handleScanRecentSmartTx}
        onRequestPermission={() => {
          setShowSmartSettingsModal(false);
          setShowSmartPermissionModal(true);
        }}
      />
    </div>
  );
};
