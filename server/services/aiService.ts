import db from '../db/database.js';

export interface AIResponse {
  message: string;
  category?: 'FINANCE' | 'CALENDAR' | 'TASK' | 'TRAVEL' | 'OCCASION' | 'GENERAL';
  suggestedAction?: {
    type: 'NAVIGATE' | 'CREATE_TASK' | 'CREATE_REMINDER' | 'CONFIRM_ACTION';
    label: string;
    payload?: any;
  };
  sourcesUsed?: string[];
}

export function processAIChat(
  familyId: string,
  userId: string,
  query: string
): AIResponse {
  const user = db.findOne('users', (u) => u.id === userId);
  if (!user) {
    return { message: 'User session not found.' };
  }

  const permissions = db
    .find('member_permissions', (mp) => mp.user_id === user.id)
    .map((mp) => mp.permission_code);

  const isHead = user.role === 'FAMILY_HEAD';
  const hasFinance = isHead || permissions.includes('FINANCE_VIEW');
  const hasInvestment = isHead || permissions.includes('INVESTMENT_VIEW');
  const hasDocs = isHead || permissions.includes('DOCUMENT_VIEW');
  const hasEmergency = isHead || permissions.includes('EMERGENCY_VIEW');

  const q = query.toLowerCase();

  // 1. Guard against unauthorized Financial queries
  const isFinanceQuery =
    q.includes('spend') ||
    q.includes('spent') ||
    q.includes('expense') ||
    q.includes('budget') ||
    q.includes('cost') ||
    q.includes('money') ||
    q.includes('rupee') ||
    q.includes('₹') ||
    q.includes('net worth') ||
    q.includes('wealth') ||
    q.includes('investment') ||
    q.includes('sip') ||
    q.includes('fd') ||
    q.includes('fixed deposit') ||
    q.includes('loan') ||
    q.includes('emi');

  if (isFinanceQuery && (!hasFinance || !hasInvestment)) {
    return {
      message: `I'm sorry ${user.name}, but you don't have permission to view family financial information. Please ask your Family Head (${user.role === 'CHILD' ? 'Dad/Mom' : 'Raj'}) if you need access.`,
      category: 'FINANCE',
    };
  }

  // 2. Guard against unauthorized Document queries
  const isDocQuery = q.includes('document') || q.includes('passport') || q.includes('aadhaar') || q.includes('pan card') || q.includes('deed');
  if (isDocQuery && !hasDocs) {
    return {
      message: `I'm sorry ${user.name}, but you do not have permission to access private family documents in the Vault.`,
      category: 'GENERAL',
    };
  }

  // 3. Grocery Spending Question
  if (q.includes('grocery') || q.includes('groceries')) {
    const groceryExpenses = db.find('expenses', (e) => e.family_id === familyId && e.category_id === 'cat_groceries');
    const totalGrocery = groceryExpenses.reduce((sum, e) => sum + e.amount, 0);
    const groceryBudget = db.findOne('budgets', (b) => b.family_id === familyId && b.category_id === 'cat_groceries');
    const limit = groceryBudget ? groceryBudget.monthly_limit : 15000;
    const percentage = Math.round((totalGrocery / limit) * 100);

    return {
      message: `This month, your family has spent **₹${totalGrocery.toLocaleString('en-IN')}** on groceries out of the planned budget of **₹${limit.toLocaleString('en-IN')}** (${percentage}% utilized). You are currently ₹${(limit - totalGrocery).toLocaleString('en-IN')} away from your monthly limit.`,
      category: 'FINANCE',
      suggestedAction: {
        type: 'NAVIGATE',
        label: 'View Grocery Budget',
        payload: { tab: 'money' },
      },
      sourcesUsed: ['Expenses DB', 'Budgets DB'],
    };
  }

  // 4. Net Worth Question
  if (q.includes('net worth') || q.includes('total wealth') || q.includes('how much do we have')) {
    const investments = db.find('investments', (i) => i.family_id === familyId);
    const totalAssets = investments.reduce((sum, i) => sum + i.current_value, 0);
    const liabilities = db.find('liabilities', (l) => l.family_id === familyId);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.outstanding_amount, 0);
    const netWorth = totalAssets - totalLiabilities;

    return {
      message: `Your family's current net worth is **₹${(netWorth / 100000).toFixed(1)} Lakhs** (₹${netWorth.toLocaleString('en-IN')}).\n\n• **Total Assets:** ₹${(totalAssets / 100000).toFixed(1)} Lakhs (Mutual Funds, Stocks, Gold, FDs, PPF)\n• **Total Liabilities:** ₹${(totalLiabilities / 100000).toFixed(1)} Lakhs (Home & Car Loans)\n\n*Note: Projections are estimates based on your logged records.*`,
      category: 'FINANCE',
      suggestedAction: {
        type: 'NAVIGATE',
        label: 'View Wealth Dashboard',
        payload: { tab: 'money' },
      },
      sourcesUsed: ['Investments DB', 'Liabilities DB'],
    };
  }

  // 5. Insurance Renewal & Expiring Documents
  if (q.includes('insurance') || q.includes('renew') || q.includes('expire') || q.includes('due date')) {
    const insuranceList = db.find('insurance_policies', (i) => i.family_id === familyId);
    const expiring = insuranceList.find((i) => i.status === 'EXPIRING_SOON') || insuranceList[0];

    return {
      message: `Your next renewal is **${expiring.provider}** (${expiring.policy_type} Insurance for ${expiring.insured_person}) with renewal deadline on **${expiring.renewal_date}** (in 12 days).\n\n• **Sum Insured:** ₹${(expiring.sum_insured / 100000).toFixed(1)} Lakhs\n• **Premium Amount:** ₹${expiring.premium_amount.toLocaleString('en-IN')}\n• **Status:** Renewal action recommended soon.`,
      category: 'CALENDAR',
      suggestedAction: {
        type: 'CREATE_REMINDER',
        label: 'Set WhatsApp Reminder',
        payload: { title: `Renew ${expiring.provider} by ${expiring.renewal_date}` },
      },
      sourcesUsed: ['Insurance Policies DB'],
    };
  }

  // 6. Emergency Fund & Goals Question
  if (q.includes('emergency fund') || q.includes('goals') || q.includes('on track') || q.includes('vacation')) {
    const goalsList = db.find('goals', (g) => g.family_id === familyId);
    const emergencyGoal = goalsList.find((g) => g.category === 'EMERGENCY_FUND') || goalsList[0];
    const progress = Math.round((emergencyGoal.current_amount / emergencyGoal.target_amount) * 100);

    return {
      message: `Yes! You are on track for your **${emergencyGoal.title}**.\n\n• **Saved:** ₹${(emergencyGoal.current_amount / 100000).toFixed(1)}L / ₹${(emergencyGoal.target_amount / 100000).toFixed(1)}L (${progress}% Complete)\n• **Target Date:** ${emergencyGoal.target_date}\n• **Required Monthly SIP:** ₹${emergencyGoal.monthly_contribution.toLocaleString('en-IN')}/mo\n\nAt your current pace of contribution, your emergency fund will be fully funded 1 month ahead of schedule!`,
      category: 'FINANCE',
      suggestedAction: {
        type: 'NAVIGATE',
        label: 'View Family Goals',
        payload: { tab: 'money' },
      },
      sourcesUsed: ['Goals DB'],
    };
  }

  // 7. Travel Packing List & Checklist Generator
  if (q.includes('pack') || q.includes('trip') || q.includes('travel') || q.includes('vacation checklist')) {
    return {
      message: `🎒 **Personalized 5-Day Family Trip Packing Checklist:**\n\n**📄 Essential Documents:**\n• Passports / Aadhaar IDs for all 5 members\n• Flight / Hotel booking confirmations\n• Health insurance card copies (HDFC ERGO Floater)\n\n**💊 Family Medical Kit:**\n• Dadi's Telmisartan BP medicine + Shelcal\n• First aid kit, band-aids & ORS sachets\n• Motion sickness tablets & Aarav's Cetirizine\n\n**👶 Kids (Aarav & Ananya):**\n• Lightweight jacket & comfortable walking shoes\n• Swimwear & sunscreen (SPF 50+)\n• Tablets / headphones with downloaded games\n\n**🔋 Tech & Essentials:**\n• Multi-port fast charger & power bank\n• Universal travel adapter & cameras`,
      category: 'TRAVEL',
      suggestedAction: {
        type: 'CREATE_TASK',
        label: 'Save as Family Task List',
        payload: { title: 'Pack for upcoming Family Vacation' },
      },
      sourcesUsed: ['Family Profile', 'Emergency Profile'],
    };
  }

  // 8. Birthday / Occasion / Gift Assistant
  if (q.includes('gift') || q.includes('birthday') || q.includes('anniversary') || q.includes('occasion') || q.includes('mom') || q.includes('dad')) {
    return {
      message: `🎉 **Ideas for Mom's (Priya) Upcoming Birthday on 22nd September:**\n\n**🎁 Curated Gift Suggestions:**\n1. **Kindle Paperwhite / Noise-Cancelling Headphones** (Budget: ₹8,000 - ₹12,000) — Perfect for her reading time.\n2. **Handcrafted Silver Jewellery / Silk Saree** from Nalli or Tanishq.\n3. **Relaxing Spa Day Voucher** at Kaya / Sheraton.\n\n**🍽️ Celebration Plan:**\n• Family Dinner table at Sheraton Feast (7:30 PM)\n• Custom photo frame with pictures from the Goa trip\n\nWould you like me to add a reminder to order the cake 2 days in advance?`,
      category: 'OCCASION',
      suggestedAction: {
        type: 'CREATE_REMINDER',
        label: 'Set Birthday Reminder',
        payload: { title: "Order cake & gift for Mom's Birthday" },
      },
      sourcesUsed: ['Calendar Events', 'Memories DB'],
    };
  }

  // 9. Tasks for Today
  if (q.includes('task') || q.includes('chore') || q.includes('today') || q.includes('do today')) {
    const tasks = db.find('tasks', (t) => t.family_id === familyId && t.status !== 'COMPLETED');
    const taskList = tasks.map((t) => `• [${t.priority}] **${t.title}** (Assigned: ${t.assigned_to_name})`).join('\n');

    return {
      message: `Here are the active family tasks:\n\n${taskList || 'All tasks are completed for today!'}\n\nWould you like to assign a new task to any family member?`,
      category: 'TASK',
      suggestedAction: {
        type: 'NAVIGATE',
        label: 'Open Family Tasks',
        payload: { tab: 'family' },
      },
      sourcesUsed: ['Tasks DB'],
    };
  }

  // General Fallback
  return {
    message: `Hello ${user.name}! I am your **One Family AI Assistant**. I can help you with:\n\n• **Family Finances:** "How much did we spend on groceries?"\n• **Upcoming Deadlines:** "When is our next insurance renewal?"\n• **Goals:** "Are we on track for our emergency fund?"\n• **Travel & Occasions:** "Create a packing list for our trip" or "Suggest a gift for Mom"\n• **Family Chores:** "What tasks are pending today?"\n\nHow can I help your family today?`,
    category: 'GENERAL',
  };
}

export function generateFinancialInsights(familyId: string): Array<{
  id: string;
  type: 'WARNING' | 'OPPORTUNITY' | 'ALERT' | 'ACHIEVEMENT';
  title: string;
  message: string;
  amountSaved?: number;
  category: string;
}> {
  return [
    {
      id: 'ins_grocery',
      type: 'WARNING',
      title: 'Grocery Spending Alert',
      message: 'Your grocery spending is 18% higher than your 3-month average. You could save approximately ₹2,300 this month by buying bulk staples and trimming snack impulse purchases.',
      amountSaved: 2300,
      category: 'Groceries',
    },
    {
      id: 'ins_fd',
      type: 'OPPORTUNITY',
      title: 'SBI FD Maturity Reinvestment',
      message: '₹5,00,000 SBI Fixed Deposit matures in 15 days (24 Sep). Moving ₹2,00,000 into a balanced advantage fund could yield an estimated 4.2% higher post-tax annualized return.',
      category: 'Investments',
    },
    {
      id: 'ins_insurance',
      type: 'ALERT',
      title: 'Vehicle Insurance Expiring',
      message: 'Honda City insurance expires in 12 days. Early online renewal qualifies for a 50% No Claim Bonus (NCB) discount of ₹4,800.',
      amountSaved: 4800,
      category: 'Insurance',
    },
  ];
}
