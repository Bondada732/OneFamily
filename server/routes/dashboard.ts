import express from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { generateFinancialInsights } from '../services/aiService.js';

const router = express.Router();
router.use(authMiddleware);

// Aggregated Home Dashboard
router.get('/:id/dashboard', (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const user = req.user!;

  const hasFinance = user.role === 'FAMILY_HEAD' || user.permissions.includes('FINANCE_VIEW');
  const hasInvestments = user.role === 'FAMILY_HEAD' || user.permissions.includes('INVESTMENT_VIEW');
  const hasDocuments = user.role === 'FAMILY_HEAD' || user.permissions.includes('DOCUMENT_VIEW');

  // 1. Members count
  const members = db.find('users', (u) => u.family_id === familyId);

  // 2. Financial Metrics (only calculated if user has finance access)
  let netWorth = 0;
  let monthlySpending = 0;
  let savingsGoalPct = 0;

  if (hasFinance) {
    const expenses = db.find('expenses', (e) => e.family_id === familyId);
    monthlySpending = expenses.reduce((sum, e) => sum + e.amount, 0);

    const goals = db.find('goals', (g) => g.family_id === familyId);
    if (goals.length > 0) {
      const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
      const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
      savingsGoalPct = Math.round((totalSaved / totalTarget) * 100);
    }
  }

  if (hasInvestments) {
    const investments = db.find('investments', (i) => i.family_id === familyId);
    const totalAssets = investments.reduce((sum, i) => sum + i.current_value, 0);
    const liabilities = db.find('liabilities', (l) => l.family_id === familyId);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.outstanding_amount, 0);
    netWorth = totalAssets - totalLiabilities;
  }

  // 3. Needs Your Attention Cards
  const attentionItems = [
    {
      id: 'att_1',
      severity: 'HIGH',
      badgeColor: 'bg-rose-500',
      icon: 'ShieldAlert',
      title: 'Vehicle Insurance Renewal',
      description: 'ICICI Lombard Insurance expires in 12 days (21 Sep)',
      actionTab: 'vault',
    },
    {
      id: 'att_2',
      severity: 'MEDIUM',
      badgeColor: 'bg-amber-500',
      icon: 'Zap',
      title: 'Electricity Bill Due Tomorrow',
      description: 'TSSPDCL Bill of ₹3,840 is due on 10 Sep',
      actionTab: 'money',
    },
    {
      id: 'att_3',
      severity: 'MEDIUM',
      badgeColor: 'bg-amber-500',
      icon: 'FileText',
      title: 'Passport Renewal Notice',
      description: 'Raj Passport expires in 45 days (24 Oct)',
      actionTab: 'vault',
    },
    {
      id: 'att_4',
      severity: 'LOW',
      badgeColor: 'bg-emerald-500',
      icon: 'CheckCircle2',
      title: 'SIP Auto-debit Completed',
      description: '₹25,000 invested across active SIP portfolios',
      actionTab: 'money',
    },
  ];

  // Filter attention items based on permissions
  const filteredAttention = attentionItems.filter((item) => {
    if (item.actionTab === 'money' && !hasFinance) return false;
    if (item.actionTab === 'vault' && !hasDocuments) return false;
    return true;
  });

  // 4. Today's Events, Tasks, and Reminders
  const todayDate = new Date().toISOString().split('T')[0];
  const calendarEvents = db.find('calendar_events', (e) => e.family_id === familyId);
  const pendingTasks = db.find('tasks', (t) => t.family_id === familyId && t.status !== 'COMPLETED');
  const reminders = db.find('reminders', (r) => r.family_id === familyId && !r.is_dismissed);

  // 5. Goals
  const goals = db.find('goals', (g) => g.family_id === familyId);

  // 6. Recent Memories
  const memories = db.find('memories', (m) => m.family_id === familyId);

  // 7. AI Insight
  const insights = generateFinancialInsights(familyId);
  const aiInsight = hasFinance ? insights[0] : {
    id: 'ins_general',
    type: 'INFO',
    title: 'Family Day Ahead',
    message: "You have 2 family events and 3 tasks scheduled this week. Mom's birthday is coming up on Sep 22nd!",
    category: 'Family',
  };

  res.json({
    userGreeting: `Good ${getTimeOfDay()}, ${user.name.split(' ')[0]} 👋`,
    role: user.role,
    snapshot: {
      membersCount: members.length,
      netWorth: hasInvestments ? netWorth : null,
      monthlySpending: hasFinance ? monthlySpending : null,
      savingsGoalPct: hasFinance ? savingsGoalPct : null,
    },
    attentionItems: filteredAttention,
    today: {
      events: calendarEvents.slice(0, 3),
      tasks: pendingTasks.slice(0, 4),
      reminders: reminders.slice(0, 3),
    },
    goals: goals.slice(0, 3),
    recentMemories: memories.slice(0, 4),
    aiInsight,
  });
});

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

export default router;
