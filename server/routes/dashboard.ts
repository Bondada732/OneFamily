import express from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { generateFinancialInsights } from '../services/aiService.js';

const router = express.Router();
router.use(authMiddleware);

// Aggregated Home Dashboard
router.get('/:id/dashboard', async (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const user = req.user!;

  const hasFinance = user.role === 'FAMILY_HEAD' || user.permissions.includes('FINANCE_VIEW');
  const hasInvestments = user.role === 'FAMILY_HEAD' || user.permissions.includes('INVESTMENT_VIEW');
  const hasDocuments = user.role === 'FAMILY_HEAD' || user.permissions.includes('DOCUMENT_VIEW');

  // 1. Members count
  const members = db.find('users', (u) => u.family_id === familyId);

  // 2. Financial Metrics (only calculated if user has finance access)
  let netWorth = 0;
  let totalAssets = 0;
  let monthlySpending = 0;
  let monthlyBudget = 0;
  let savingsGoalPct = 0;

  if (hasFinance) {
    const expenses = db.find('expenses', (e) => e.family_id === familyId);
    monthlySpending = expenses.reduce((sum, e) => sum + e.amount, 0);

    const budgets = db.find('budgets', (b) => b.family_id === familyId && b.month_year === '2026-09');
    monthlyBudget = budgets.reduce((sum, b) => sum + (Number(b.monthly_limit) || 0), 0);
    // If no custom budget rows yet, default to standard family budget base
    if (monthlyBudget === 0) {
      monthlyBudget = 93000;
    }

    const goals = db.find('goals', (g) => g.family_id === familyId);
    if (goals.length > 0) {
      const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
      const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
      savingsGoalPct = Math.round((totalSaved / totalTarget) * 100);
    }
  }


  if (hasInvestments) {
    const investments = db.find('investments', (i) => i.family_id === familyId);
    totalAssets = investments.reduce((sum, i) => sum + i.current_value, 0);
    const liabilities = db.find('liabilities', (l) => l.family_id === familyId);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.outstanding_amount, 0);
    netWorth = totalAssets - totalLiabilities;
  }

  // 3. Dynamic Attention Cards
  const attentionItems: any[] = [];

  // Check documents expiring soon (within 45 days)
  if (hasDocuments) {
    const documents = db.find('documents', (d) => d.family_id === familyId);
    const today = new Date();
    documents.forEach((doc) => {
      if (doc.expiry_date) {
        const expDate = new Date(doc.expiry_date);
        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 45 && diffDays >= 0) {
          attentionItems.push({
            id: `att_doc_${doc.id}`,
            severity: diffDays <= 15 ? 'HIGH' : 'MEDIUM',
            badgeColor: diffDays <= 15 ? 'bg-rose-500' : 'bg-amber-500',
            icon: 'FileText',
            title: `${doc.title} Expiry Notice`,
            description: `${doc.owner_name}'s ${doc.title} expires in ${diffDays} days (${doc.expiry_date})`,
            actionTab: 'vault',
          });
        }
      }
    });
  }

  // Check active reminders
  const reminders = db.find('reminders', (r) => r.family_id === familyId && !r.is_dismissed);
  reminders.slice(0, 2).forEach((rem) => {
    attentionItems.push({
      id: `att_rem_${rem.id}`,
      severity: 'MEDIUM',
      badgeColor: 'bg-amber-500',
      icon: 'Zap',
      title: rem.title,
      description: rem.description || `Due on ${rem.due_date}`,
      actionTab: rem.category === 'FINANCE' ? 'money' : 'calendar',
    });
  });

  // Check pending high priority tasks
  const pendingTasks = db.find('tasks', (t) => t.family_id === familyId && t.status !== 'COMPLETED');
  const highPriorityTask = pendingTasks.find((t) => t.priority === 'HIGH');
  if (highPriorityTask) {
    attentionItems.push({
      id: `att_task_${highPriorityTask.id}`,
      severity: 'HIGH',
      badgeColor: 'bg-rose-500',
      icon: 'ShieldAlert',
      title: 'High Priority Chore',
      description: `${highPriorityTask.title} (Assigned to ${highPriorityTask.assigned_to_name})`,
      actionTab: 'family',
    });
  }

  // Fallback pleasant welcome item if no urgent attention items
  if (attentionItems.length === 0) {
    attentionItems.push({
      id: 'att_welcome',
      severity: 'LOW',
      badgeColor: 'bg-emerald-500',
      icon: 'CheckCircle2',
      title: 'Family Hub Ready',
      description: `Welcome to your private family operating system! Everything is securely synchronized.`,
      actionTab: 'family',
    });
  }

  const filteredAttention = attentionItems;

  // 4. Today's Events, Tasks, and Reminders
  const todayDate = new Date().toISOString().split('T')[0];
  const calendarEvents = db.find('calendar_events', (e) => e.family_id === familyId);

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
      netWorth: hasInvestments ? netWorth : 0,
      totalSavings: hasInvestments ? totalAssets : 0,
      monthlySpending: hasFinance ? monthlySpending : 0,
      monthlyBudget: hasFinance ? monthlyBudget : 0,
      savingsGoalPct: hasFinance ? savingsGoalPct : 0,
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
