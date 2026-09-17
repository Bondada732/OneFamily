import React, { useState, useEffect } from 'react';
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
import { SmartExpenseReviewModal } from '../../components/smartExpense/SmartExpenseReviewModal.js';
import { SmartExpensePermissionModal } from '../../components/smartExpense/SmartExpensePermissionModal.js';
import { SmartExpenseDetailModal } from '../../components/smartExpense/SmartExpenseDetailModal.js';
import { SmartExpenseSettingsModal } from '../../components/smartExpense/SmartExpenseSettingsModal.js';
import { SmartExpenseService } from '../../services/smartExpense/SmartExpenseService.js';
import { DetectedTransaction, SmartCaptureSettings } from '../../services/smartExpense/types.js';
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
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Shared Wishlist & Tasks items state
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [familyTasks, setFamilyTasks] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

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

  const { snapshot, goals, recentMemories, today } = dashboard;
  const rawNetWorth = snapshot.netWorth || 0;
  const netWorthDisplay = Math.abs(rawNetWorth);
  const firstName = currentUser?.name?.split(' ')[0] || 'Rambabu';
  const locationCity = family?.location?.split(',')[0] || 'India';

  return (
    <div className="p-3.5 space-y-3.5 text-[#F4F8FF] pb-24 animate-in fade-in duration-300">
      {/* 2nd Line: Small Greeting + Temperature (Avatar removed per request) */}
      <div className="flex items-center justify-between pt-0.5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-semibold text-slate-200">
              {getGreeting()},{' '}
              <strong className="text-white font-black">{firstName}</strong>
            </span>
            <span className="text-xs">👋</span>
          </div>
          <p className="text-[10px] text-slate-400 italic mt-0.5 leading-tight">
            "Small steps today, big dreams tomorrow."
          </p>
        </div>

        {/* Weather Card */}
        <div className="flex items-center gap-1.5 bg-[#0D152D] border border-amber-500/30 px-2.5 py-1 rounded-full shadow-sm shrink-0">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] text-slate-300 font-medium">{locationCity}</span>
          <span className="text-xs font-bold text-white">28°C</span>
        </div>
      </div>

      {/* 2. 8 Quick Action Tabs (Single-Row 3D Revolving Circular Carousel - 1x2 Inch Cards) */}
      <CircularQuickActions
        onAddExpense={() => setShowAddExpenseModal(true)}
        onWishList={() => setShowWishListModal(true)}
        onSetGoal={() => setShowSetGoalModal(true)}
        onAddIncome={() => setShowAddIncomeModal(true)}
        onVault={() => setShowVaultModal(true)}
        onTasks={() => setShowTaskModal(true)}
        onMaintenance={() => setShowMaintenanceModal(true)}
        onEmergency={() => setShowEmergencyModal(true)}
      />

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

      {/* 2.5. Family Wishlist Section in Bullet Points (Positioned ABOVE Family Wealth) */}
      <div className="space-y-1.5 pt-1 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-[#00D2FF]">✦</span>
              <span>Family Wishlist</span>
              {wishlistItems.length > 0 && (
                <span className="text-[10px] text-[#00D2FF] font-bold">
                  ({wishlistItems.length})
                </span>
              )}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowWishListModal(true)}
            className="text-[11px] text-[#00D2FF] hover:text-[#7EDCFF] font-bold transition-colors"
          >
            + Add Wish
          </button>
        </div>

        {/* Wishlist Items in Pure Bullet Points */}
        {wishlistItems && wishlistItems.length > 0 ? (
          <ul className="space-y-1.5 pl-1 text-xs">
            {wishlistItems.map((wish) => {
              const isFulfilled = wish.completed || wish.status === 'COMPLETED';
              const costDisplay = wish.estimated_cost
                ? `₹${Number(wish.estimated_cost).toLocaleString('en-IN')}`
                : wish.quantity && wish.quantity !== '1 unit'
                ? wish.quantity
                : '';

              return (
                <li
                  key={wish.id}
                  className="flex items-center justify-between group py-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      onClick={() => toggleWishFulfilled(wish.id)}
                      className={`cursor-pointer select-none text-base leading-none transition-colors ${
                        isFulfilled ? 'text-emerald-400' : 'text-[#00D2FF]'
                      }`}
                    >
                      •
                    </span>
                    <span
                      onClick={() => toggleWishFulfilled(wish.id)}
                      className={`truncate cursor-pointer font-medium transition-colors ${
                        isFulfilled ? 'line-through text-slate-500' : 'text-slate-100 hover:text-white'
                      }`}
                    >
                      {wish.item_name || wish.title}
                    </span>
                    {costDisplay && (
                      <span className={`text-[11px] font-bold shrink-0 ${isFulfilled ? 'text-slate-500' : 'text-[#00E676]'}`}>
                        ({costDisplay})
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteWishItem(wish.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-[#FF4D6D] transition-all ml-2"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-slate-400 pl-1">
            • No wishlist items yet. Tap <button onClick={() => setShowWishListModal(true)} className="text-[#00D2FF] underline font-medium">+ Add Wish</button> to add dreams for your family.
          </p>
        )}
      </div>

      {/* 2.6. Family Tasks Section in Bullet Points (Positioned BELOW Wishlist, ABOVE Family Wealth) */}
      <div className="space-y-1.5 pt-1 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-[#FFB91F]">✦</span>
              <span>Family Tasks</span>
              {familyTasks.length > 0 && (
                <span className="text-[10px] text-[#FFB91F] font-bold">
                  ({familyTasks.length})
                </span>
              )}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowTaskModal(true)}
            className="text-[11px] text-[#FFB91F] hover:text-[#FFD21F] font-bold transition-colors"
          >
            + Add Task
          </button>
        </div>

        {/* Tasks Items in Pure Bullet Points */}
        {familyTasks && familyTasks.length > 0 ? (
          <ul className="space-y-1.5 pl-1 text-xs">
            {familyTasks.map((task) => {
              const isCompleted = task.status === 'COMPLETED';
              const priorityColor =
                task.priority === 'HIGH'
                  ? 'text-[#FF4D6D]'
                  : task.priority === 'MEDIUM'
                  ? 'text-[#FFD21F]'
                  : 'text-[#55D98A]';

              return (
                <li
                  key={task.id}
                  className="flex items-center justify-between group py-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`cursor-pointer select-none text-base leading-none transition-colors ${
                        isCompleted ? 'text-emerald-400' : 'text-[#FFB91F]'
                      }`}
                    >
                      •
                    </span>
                    <span
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`truncate cursor-pointer font-medium transition-colors ${
                        isCompleted ? 'line-through text-slate-500' : 'text-slate-100 hover:text-white'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {task.assigned_to_name ? `(${task.assigned_to_name}` : ''}
                      {task.due_date ? ` • Due: ${task.due_date}` : ''}
                      {task.priority ? ` • ` : ''}
                      {task.priority ? (
                        <span className={`font-semibold ${priorityColor}`}>
                          {task.priority}
                        </span>
                      ) : null}
                      {task.assigned_to_name ? `)` : ''}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTaskItem(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-[#FF4D6D] transition-all ml-2"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-slate-400 pl-1">
            • No tasks yet. Tap{' '}
            <button
              onClick={() => setShowTaskModal(true)}
              className="text-[#FFB91F] underline font-medium"
            >
              + Add Task
            </button>{' '}
            to assign chores or family to-dos.
          </p>
        )}
      </div>

      {/* 3. Family Wealth Hero Card (Positioned BELOW Action Buttons, ABOVE Quick Overview) */}
      <div
        onClick={() => onNavigateTab('money')}
        className="relative overflow-hidden rounded-[24px] bg-[#0D152D] border border-slate-800/90 p-4 shadow-xl cursor-pointer group hover:border-[#16C7F2]/50 transition-all"
      >
        {/* Subtle glow overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(22,199,242,0.08),transparent_70%)] pointer-events-none" />

        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-400/15 text-amber-400 border border-amber-400/25">
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
              {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>

          <div className="w-6 h-6 rounded-full bg-slate-800/80 group-hover:bg-slate-700/80 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:translate-x-0.5 transition-all">
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-end justify-between relative z-10">
          <div className="space-y-1.5">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              {isPrivacyMode ? '••••••••' : formatCurrency(netWorthDisplay, false)}
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#34D399] text-[11px] font-bold">
              <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
              <span>12% this month</span>
            </div>
          </div>

          {/* Embedded Sparkline Graph */}
          <div className="w-36 h-14 -mr-1">
            <svg viewBox="0 0 120 50" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="kinoraGraphFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#168BFF" stopOpacity="0.25" />
                  <stop offset="60%" stopColor="#16C7F2" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#0D152D" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="kinoraGraphLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#168BFF" />
                  <stop offset="50%" stopColor="#16C7F2" />
                  <stop offset="100%" stopColor="#34D399" />
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
              <circle cx="120" cy="6" r="3" fill="#34D399" />
            </svg>
          </div>
        </div>
      </div>

      {/* 4. Quick Overview (3 Dark Cards Matching Image 1) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">Quick Overview</h3>
          <button
            onClick={() => onNavigateTab('money')}
            className="text-[11px] text-[#16C7F2] hover:text-[#7EDCFF] font-bold flex items-center gap-0.5 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#16C7F2]" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Card 1: Monthly Spending (Red/Pink Accent) */}
          <div
            onClick={() => onNavigateTab('money')}
            className="p-3.5 rounded-[22px] bg-[#0D152D] border border-[#FF4D6D]/30 hover:border-[#FF4D6D]/60 shadow-lg flex flex-col justify-between transition-all cursor-pointer group"
          >
            <div>
              <div className="text-[10px] font-bold text-[#FF8A70] leading-tight">Monthly Spending</div>
              <div className="text-sm sm:text-base font-black text-white mt-1.5">
                {isPrivacyMode ? '••••' : formatCurrency(snapshot.monthlySpending || 0, false)}
              </div>
            </div>
            <div className="text-[10px] font-bold text-[#FF8A70] mt-2 flex items-center gap-0.5">
              <span>{(snapshot.monthlySpending || 0) > 0 ? '↓ 8%' : '₹0'}</span>
              <span className="text-slate-400 text-[9px] font-normal">{(snapshot.monthlySpending || 0) > 0 ? 'vs last mo' : 'this month'}</span>
            </div>
          </div>

          {/* Card 2: Savings (Emerald Accent) */}
          <div
            onClick={() => onNavigateTab('money')}
            className="p-3.5 rounded-[22px] bg-[#0D152D] border border-[#16C7F2]/30 hover:border-[#16C7F2]/60 shadow-lg flex flex-col justify-between transition-all cursor-pointer group"
          >
            <div>
              <div className="text-[10px] font-bold text-[#34D399] leading-tight">Savings</div>
              <div className="text-sm sm:text-base font-black text-white mt-1.5">
                {isPrivacyMode ? '••••' : formatCurrency(snapshot.totalSavings || 0, true)}
              </div>
            </div>
            <div className="text-[10px] font-bold text-[#34D399] mt-2 flex items-center gap-0.5">
              <span>{(snapshot.totalSavings || 0) > 0 ? '₹0' : '₹0'}</span>
              <span className="text-slate-400 text-[9px] font-normal">saved</span>
              <span className="text-slate-400 text-[9px] font-normal">year</span>
            </div>
          </div>

          {/* Card 3: Goals (Purple Accent) */}
          <div
            onClick={() => onNavigateTab('money')}
            className="p-3.5 rounded-[22px] bg-[#0D152D] border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/60 shadow-lg flex flex-col justify-between transition-all cursor-pointer group"
          >
            <div>
              <div className="text-[10px] font-bold text-slate-300 leading-tight">Goals</div>
              <div className="text-sm sm:text-base font-black text-white mt-1.5">
                {goals && goals.length > 0 ? `${goals.filter(g => g.current_amount >= g.target_amount).length}/${goals.length}` : '0/0'}
              </div>
            </div>
            <div className="text-[10px] font-bold text-[#38BDF8] mt-2">
              {goals && goals.length > 0 ? 'On Track' : '0 Active'}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Upcoming Card */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">Upcoming</h3>
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
                className="p-3.5 rounded-[22px] bg-[#0D152D] border border-slate-800/90 shadow-md flex items-center justify-between hover:border-slate-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#168BFF]/15 border border-[#168BFF]/30 flex items-center justify-center text-[#16C7F2] shrink-0">
                    <Calendar className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-[#7EDCFF] transition-colors">
                      {ev.title} 📅
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {ev.start_date ? formatDate(ev.start_date) : 'Upcoming Event'}
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">
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
              className="p-3.5 rounded-[22px] bg-[#0D152D] border border-slate-800/90 shadow-md flex items-center justify-between hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FF8A24]/15 border border-[#FF8A24]/30 flex items-center justify-center text-[#FFD21F] shrink-0">
                  <Cake className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-[#7EDCFF] transition-colors">
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
                className="min-w-[140px] max-w-[140px] rounded-[20px] bg-[#0D152D] border border-slate-800/90 overflow-hidden shadow-md shrink-0 cursor-pointer group hover:border-[#16C7F2]/50 transition-all"
              >
                <div className="h-24 overflow-hidden relative">
                  <img
                    src={imgUrl}
                    alt={mem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A]/95 via-transparent to-transparent" />
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
