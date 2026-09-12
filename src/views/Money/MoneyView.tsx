import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useSecurity } from '../../context/SecurityContext.js';
import { translations } from '../../i18n/index.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { apiRequest } from '../../utils/api.js';
import { Expense, BudgetReport, Investment, Liability, Goal } from '../../types/index.js';
import { Plus, Receipt, TrendingUp, ShieldAlert, Sparkles, AlertTriangle, CheckCircle2, ChevronRight, Camera, ArrowDownLeft, ArrowUpRight, DollarSign, Wallet } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export const MoneyView: React.FC = () => {
  const { currentUser, family, activeLanguage, hasPermission } = useAuth();
  const { isPrivacyMode } = useSecurity();
  const t = translations[activeLanguage];

  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'BUDGET' | 'EXPENSES' | 'WEALTH' | 'GOALS'>('OVERVIEW');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetReports, setBudgetReports] = useState<BudgetReport[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [netWorthData, setNetWorthData] = useState<any>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showScanReceipt, setShowScanReceipt] = useState(false);
  const [receiptResult, setReceiptResult] = useState<any>(null);

  // New Expense Form State
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category_id: 'cat_groceries',
    category_name: 'Groceries',
    merchant: '',
    payment_method: 'UPI',
    notes: '',
    date: new Date().toISOString().split('T')[0],
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
    if (!newExpense.amount) return;

    try {
      const created = await apiRequest(`/expenses/${family?.id}/expenses`, {
        method: 'POST',
        body: JSON.stringify(newExpense),
      });
      setExpenses([created, ...expenses]);
      setShowAddExpense(false);
      setNewExpense({
        amount: '',
        category_id: 'cat_groceries',
        category_name: 'Groceries',
        merchant: '',
        payment_method: 'UPI',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      console.error(err);
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
      date: receiptResult.date || new Date().toISOString().split('T')[0],
    });
    setReceiptResult(null);
    setShowScanReceipt(false);
    setShowAddExpense(true);
  };

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
              <span>September 2026 Household Budget</span>
              <span className="text-amber-400 font-bold">14 Categories</span>
            </div>
            <div className="text-xl font-extrabold text-white mt-1">
              ₹78,450 / ₹93,000 <span className="text-xs font-normal text-slate-400">(84.3% spent)</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {budgetReports.map((cat) => (
              <div key={cat.categoryId} className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-sm">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-white">{cat.categoryName}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-200">
                      {isPrivacyMode ? '••••' : `₹${cat.spent.toLocaleString('en-IN')}`} / ₹{cat.limit.toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        cat.alertStatus === 'EXCEEDED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : cat.alertStatus === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {cat.utilizationPct}%
                    </span>
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
                    style={{ width: `${Math.min(100, cat.utilizationPct)}%` }}
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
            <span className="text-xs font-bold text-slate-400 uppercase">Logged Expenses</span>
            <span className="text-xs text-amber-400 font-bold">Total: ₹78,450</span>
          </div>

          <div className="space-y-2">
            {expenses.map((exp) => (
              <div key={exp.id} className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{exp.merchant}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {exp.category_name} • Paid by {exp.paid_by_name} ({exp.payment_method})
                  </div>
                  {exp.notes && <div className="text-[10px] text-slate-500 mt-0.5 italic">{exp.notes}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-rose-400">
                    {isPrivacyMode ? '••••' : `-₹${exp.amount.toLocaleString('en-IN')}`}
                  </div>
                  <div className="text-[10px] text-slate-500">{formatDate(exp.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. WEALTH SUBTAB (Investments, Insurance, Liabilities) */}
      {activeSubTab === 'WEALTH' && (
        <div className="space-y-4">
          {/* Asset Categories */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase">Family Investments & Assets (₹62.8L)</div>
            {investments.map((inv) => (
              <div key={inv.id} className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{inv.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {inv.institution} • Owner: {inv.owner_name}
                  </div>
                  {inv.notes && <div className="text-[10px] text-emerald-400 mt-0.5">{inv.notes}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-emerald-400">
                    {isPrivacyMode ? '••••' : formatCurrency(inv.current_value)}
                  </div>
                  <div className="text-[10px] text-slate-400">Invested: ₹{(inv.invested_amount / 100000).toFixed(1)}L</div>
                </div>
              </div>
            ))}
          </div>

          {/* Liabilities */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase">Liabilities & Loans (₹20.0L)</div>
            {liabilities.map((lia) => (
              <div key={lia.id} className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{lia.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {lia.lender} • Monthly EMI: ₹{lia.monthly_emi.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-rose-400">
                    {isPrivacyMode ? '••••' : formatCurrency(lia.outstanding_amount)}
                  </div>
                  <div className="text-[10px] text-slate-400">Rate: {lia.interest_rate}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. GOALS SUBTAB */}
      {activeSubTab === 'GOALS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400 uppercase">Family Future Goals</span>
            <span className="text-amber-400 font-bold">{goals.length} Active Goals</span>
          </div>

          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
            return (
              <div key={goal.id} className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">{goal.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Target Date: {goal.target_date} • SIP: ₹{goal.monthly_contribution.toLocaleString('en-IN')}/mo
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-amber-400">{pct}%</span>
                </div>

                <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-indigo-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Saved: {isPrivacyMode ? '••••' : formatCurrency(goal.current_amount)}</span>
                  <span>Target: {formatCurrency(goal.target_amount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Record Family Expense</h3>
            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Amount (₹ INR)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2400"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-lg font-bold text-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Merchant / Payee</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ratnadeep Supermarket"
                  value={newExpense.merchant}
                  onChange={(e) => setNewExpense({ ...newExpense, merchant: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Category</label>
                  <select
                    value={newExpense.category_id}
                    onChange={(e) => {
                      const sel = e.target.value;
                      const cat = budgetReports.find((b) => b.categoryId === sel);
                      setNewExpense({
                        ...newExpense,
                        category_id: sel,
                        category_name: cat ? cat.categoryName : 'Miscellaneous',
                      });
                    }}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    {budgetReports.map((b) => (
                      <option key={b.categoryId} value={b.categoryId}>
                        {b.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Payment Mode</label>
                  <select
                    value={newExpense.payment_method}
                    onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
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
                <label className="text-xs text-slate-300 font-semibold">Notes</label>
                <input
                  type="text"
                  placeholder="Optional item details"
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
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
    </div>
  );
};
